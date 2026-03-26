const mongoose = require("mongoose");

const Group = require("../models/Group");
const Expense = require("../models/Expense");
const User = require("../models/User");

/**
 * GET /api/settlement/:groupId
 *
 * Backend-only settlement calculator (group-scoped).
 * Important: all computations are done on the server to enforce group isolation.
 */
async function getGroupSettlement(req, res) {
  try {
    const { groupId } = req.params;
    if (!mongoose.isValidObjectId(groupId)) {
      return res.status(404).json({ message: "Group not found" });
    }

    // 1) Fetch group and membership (only members can access).
    const group = await Group.findById(groupId).select("_id name members").lean();
    if (!group) return res.status(404).json({ message: "Group not found" });

    const isMember = group.members.some((m) => String(m) === String(req.user.id));
    if (!isMember) return res.status(403).json({ message: "User not in group" });

    const memberIds = group.members.map(String);
    const totalMembers = memberIds.length;

    // Edge case: group exists but has no members (shouldn't happen, but handle safely).
    if (!totalMembers) {
      return res.json({
        totalExpense: 0,
        perPersonShare: 0,
        balances: [],
        settlements: [],
      });
    }

    // 2) Aggregate expenses per member + total expense (optimized).
    const gid = new mongoose.Types.ObjectId(groupId);
    const agg = await Expense.aggregate([
      { $match: { group: gid } },
      {
        $group: {
          _id: "$member",
          spent: { $sum: "$amount" },
        },
      },
    ]);

    // Convert aggregation result into a map for O(1) lookups.
    const spentByMember = new Map();
    let totalExpense = 0;
    for (const row of agg) {
      const mid = String(row._id);
      const spent = Number(row.spent) || 0;
      spentByMember.set(mid, spent);
      totalExpense += spent;
    }

    // 3) Equal share (float). If you need currency rounding, do it at display time.
    const perPersonShare = totalMembers ? totalExpense / totalMembers : 0;

    // 4) Fetch member names once.
    const users = await User.find({ _id: { $in: group.members } }).select("name").lean();
    const usersById = new Map(users.map((u) => [String(u._id), u]));

    // 5) Build balances list.
    const balances = memberIds.map((id) => {
      const spent = spentByMember.get(id) || 0;
      const balance = spent - perPersonShare;
      return {
        memberId: id,
        name: usersById.get(id)?.name || "Member",
        spent,
        balance,
      };
    });

    // 6) Settlement algorithm (greedy).
    // EPS prevents tiny floating errors creating micro-settlements.
    const EPS = 0.01;
    const round2 = (n) => Math.round(n * 100) / 100;

    const creditors = [];
    const debtors = [];

    for (const b of balances) {
      const bal = round2(b.balance);
      if (bal > EPS) creditors.push({ ...b, balance: bal });
      else if (bal < -EPS) debtors.push({ ...b, balance: bal });
    }

    // Edge case: everyone settled (or only one member).
    if (!creditors.length || !debtors.length) {
      return res.json({
        totalExpense,
        perPersonShare,
        balances: balances.map((b) => ({ ...b, balance: round2(b.balance) })),
        settlements: [],
      });
    }

    // Sort: largest creditor first, most-negative debtor first.
    creditors.sort((a, b) => b.balance - a.balance);
    debtors.sort((a, b) => a.balance - b.balance);

    const settlements = [];
    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i]; // negative balance
      const creditor = creditors[j]; // positive balance

      const debtorOwes = -debtor.balance;
      const creditorReceives = creditor.balance;
      const payment = Math.min(debtorOwes, creditorReceives);

      if (payment > EPS) {
        settlements.push({
          from: debtor.name,
          to: creditor.name,
          amount: round2(payment),
        });
      }

      debtor.balance = round2(debtor.balance + payment); // closer to 0
      creditor.balance = round2(creditor.balance - payment); // closer to 0

      if (Math.abs(debtor.balance) <= EPS) i++;
      if (Math.abs(creditor.balance) <= EPS) j++;
    }

    return res.json({
      totalExpense,
      perPersonShare,
      balances: balances.map((b) => ({ ...b, balance: round2(b.balance) })),
      settlements,
    });
  } catch (err) {
    // Calculation or DB error
    return res.status(500).json({ message: "Settlement calculation error" });
  }
}

module.exports = { getGroupSettlement };

