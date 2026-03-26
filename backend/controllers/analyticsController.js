const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const Group = require("../models/Group");
const Expense = require("../models/Expense");
const User = require("../models/User");

function validateRequest(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return { ok: false, status: 400, message: errors.array()[0].msg };
  }
  return { ok: true };
}

async function assertMemberAndGetGroup(groupId, userId) {
  const group = await Group.findOne({ _id: groupId, members: userId }).select("_id name members").lean();
  return group;
}

async function monthlyExpense(req, res) {
  const check = validateRequest(req);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const { groupId } = req.query;
  const group = await assertMemberAndGetGroup(groupId, req.user.id);
  if (!group) return res.status(404).json({ message: "Group not found" });

  const groupObjectId = new mongoose.Types.ObjectId(groupId);

  const results = await Expense.aggregate([
    { $match: { group: groupObjectId } },
    {
      $addFields: {
        month: { $dateToString: { format: "%Y-%m", date: "$date" } },
      },
    },
    { $group: { _id: "$month", total: { $sum: "$amount" } } },
    { $sort: { _id: 1 } },
  ]);

  return res.json({
    groupId: group._id,
    labels: results.map((r) => r._id),
    values: results.map((r) => r.total),
  });
}

async function memberWiseExpense(req, res) {
  const check = validateRequest(req);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const { groupId } = req.query;
  const group = await assertMemberAndGetGroup(groupId, req.user.id);
  if (!group) return res.status(404).json({ message: "Group not found" });

  const groupObjectId = new mongoose.Types.ObjectId(groupId);

  const totals = await Expense.aggregate([
    { $match: { group: groupObjectId } },
    { $group: { _id: "$member", total: { $sum: "$amount" } } },
  ]);

  const totalsByMember = new Map(totals.map((t) => [String(t._id), t.total]));

  const users = await User.find({ _id: { $in: group.members } }).select("name mobileNumber").lean();
  const usersById = new Map(users.map((u) => [String(u._id), u]));

  const members = group.members.map((id) => {
    const u = usersById.get(String(id));
    return { id: id, name: u?.name || "Member" };
  });

  const values = members.map((m) => totalsByMember.get(String(m.id)) || 0);

  return res.json({ groupId: group._id, members, values });
}

module.exports = { monthlyExpense, memberWiseExpense };

