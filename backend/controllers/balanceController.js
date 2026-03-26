const Group = require("../models/Group");
const Expense = require("../models/Expense");
const User = require("../models/User");

function pickActiveGroupId(userId, requestedGroupId) {
  // If groupId not provided, choose the first group containing the user.
  return Group.findOne({ members: userId, ...(requestedGroupId ? { _id: requestedGroupId } : {}) }).select(
    "_id name members"
  );
}

function computeSettlements(membersWithBalance) {
  // Greedy settlement:
  // - positive balance: receiver
  // - negative balance: owes
  // returns array of transfers { fromName, toName, amount }
  const EPS = 0.01;
  const round2 = (n) => Math.round(n * 100) / 100;
  const creditors = [];
  const debtors = [];

  for (const m of membersWithBalance) {
    if (m.balance > EPS) creditors.push({ ...m, balance: m.balance });
    else if (m.balance < -EPS) debtors.push({ ...m, balance: m.balance });
  }

  creditors.sort((a, b) => b.balance - a.balance); // receivers high first
  debtors.sort((a, b) => a.balance - b.balance); // debtors most negative first

  const transfers = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    // debtor.balance is negative
    const debtorOwes = -debtor.balance;
    const creditorReceives = creditor.balance;
    const amt = Math.min(debtorOwes, creditorReceives);
    if (amt > EPS) {
      const amount = round2(amt);
      transfers.push({
        fromUserId: debtor.id,
        fromName: debtor.name,
        toUserId: creditor.id,
        toName: creditor.name,
        amount,
      });
    }

    debtor.balance = round2(debtor.balance + amt); // closer to 0 (less negative)
    creditor.balance = round2(creditor.balance - amt); // closer to 0

    if (Math.abs(debtor.balance) <= EPS) i++;
    if (Math.abs(creditor.balance) <= EPS) j++;
  }

  return transfers;
}

async function getBalance(req, res) {
  const requestedGroupId = req.query.groupId;
  const group = await pickActiveGroupId(req.user.id, requestedGroupId);
  if (!group) return res.status(404).json({ message: "No group found for this user" });

  // Fetch all expenses for group
  const expenses = await Expense.find({ group: group._id }).select("amount member date").lean();

  const memberIds = group.members.map(String);
  // For per-member spent, sum only member
  const spentBy = new Map(); // userId => spent
  for (const id of memberIds) spentBy.set(id, 0);

  let totalExpense = 0;
  for (const e of expenses) {
    const uid = String(e.member);
    if (!spentBy.has(uid)) spentBy.set(uid, 0);
    spentBy.set(uid, (spentBy.get(uid) || 0) + (Number(e.amount) || 0));
    totalExpense += Number(e.amount) || 0;
  }

  const membersCount = memberIds.length;
  // Currency display is rupees; use integer share so balances match the common Splitwise-style examples.
  const perPersonShare = membersCount ? Math.floor(totalExpense / membersCount) : 0;

  // Need member names for dashboard
  const users = await User.find({ _id: { $in: group.members } }).select("name mobileNumber").lean();

  const usersById = new Map(users.map((u) => [String(u._id), u]));

  const membersWithBalance = memberIds.map((id) => {
    const user = usersById.get(id);
    const spent = spentBy.get(id) || 0;
    const balance = spent - perPersonShare;
    return {
      id,
      name: user ? user.name : "Member",
      mobileNumber: user ? user.mobileNumber : undefined,
      spent,
      balance,
    };
  });

  // Balance Section settlements: Who owes whom
  const settlements = computeSettlements(membersWithBalance);

  const responseMembers = membersWithBalance.map((m) => ({
    id: m.id,
    name: m.name,
    spent: m.spent,
    balance: m.balance,
  }));

  return res.json({
    groupId: group._id,
    groupName: group.name,
    totalGroupExpense: totalExpense,
    perPersonShare,
    members: responseMembers,
    settlements,
  });
}

module.exports = { getBalance };

