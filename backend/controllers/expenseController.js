const { validationResult } = require("express-validator");
const Group = require("../models/Group");
const Expense = require("../models/Expense");

function validateRequest(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return { ok: false, status: 400, message: errors.array()[0].msg };
  }
  return { ok: true };
}

async function ensureMemberOfGroup(groupId, userId) {
  const group = await Group.findById(groupId).select("members");
  if (!group) return null;
  const isMember = group.members.some((m) => String(m) === String(userId));
  return { group, isMember };
}

async function addExpense(req, res) {
  const check = validateRequest(req);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const { description, amount, member, groupId, date } = req.body;

  const { isMember } = await ensureMemberOfGroup(groupId, req.user.id) || {};
  if (!isMember) return res.status(403).json({ message: "You are not a member of this group" });

  // member must be a member as well
  const { group: groupDoc } = await ensureMemberOfGroup(groupId, member) || {};
  if (!groupDoc) return res.status(404).json({ message: "Group not found" });
  const memberIsMember = groupDoc.members.some((m) => String(m) === String(member));
  if (!memberIsMember) return res.status(400).json({ message: "member must be a group member" });

  const expenseDate = date ? new Date(date) : new Date();
  if (Number.isNaN(expenseDate.getTime())) {
    return res.status(400).json({ message: "Invalid date" });
  }

  const expense = await Expense.create({
    amount: Number(amount),
    description: description.trim(),
    member,
    group: groupId,
    date: expenseDate,
  });

  // Real-time update: notify group members
  const io = req.app.get("io");
  io.to(`group_${groupId}`).emit("expenseUpdated", { groupId });

  return res.status(201).json({ message: "Expense added", expenseId: expense._id });
}

async function listExpenses(req, res) {
  const groupIdFromQuery = req.query.groupId;
  const requestedGroupId = groupIdFromQuery;

  const groupWhereMember = await Group.findOne({
    members: req.user.id,
    ...(requestedGroupId ? { _id: requestedGroupId } : {}),
  }).select("_id name");
  if (!groupWhereMember) return res.status(404).json({ message: "No group found for this user" });

  const expenses = await Expense.find({ group: groupWhereMember._id })
    .populate("member", "name mobileNumber")
    .sort({ date: -1 })
    .limit(Number(req.query.limit || 100));

  return res.json({
    groupId: groupWhereMember._id,
    groupName: groupWhereMember.name,
    expenses: expenses.map((e) => ({
      id: e._id,
      amount: e.amount,
      description: e.description,
      member: { id: e.member._id, name: e.member.name },
      date: e.date,
    })),
  });
}

async function updateExpense(req, res) {
  const check = validateRequest(req);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const expenseId = req.params.expenseId;
  const { groupId, description, amount, member, date } = req.body;

  if (!groupId) return res.status(400).json({ message: "groupId is required" });

  // Authorization + strict group isolation
  const { isMember } = await ensureMemberOfGroup(groupId, req.user.id) || {};
  if (!isMember) return res.status(403).json({ message: "You are not a member of this group" });

  const expense = await Expense.findById(expenseId);
  if (!expense) return res.status(404).json({ message: "Expense not found" });
  if (String(expense.group) !== String(groupId)) return res.status(400).json({ message: "Expense does not belong to this group" });

  const { group: groupDoc } = await ensureMemberOfGroup(groupId, member) || {};
  if (!groupDoc) return res.status(404).json({ message: "Group not found" });
  const memberIsMember = groupDoc.members.some((m) => String(m) === String(member));
  if (!memberIsMember) return res.status(400).json({ message: "member must be a group member" });

  const expenseDate = date ? new Date(date) : expense.date;
  if (date && Number.isNaN(expenseDate.getTime())) return res.status(400).json({ message: "Invalid date" });

  expense.description = description.trim();
  expense.amount = Number(amount);
  expense.member = member;
  expense.date = expenseDate;

  await expense.save();

  const io = req.app.get("io");
  io.to(`group_${groupId}`).emit("expenseUpdated", { groupId });

  return res.json({ message: "Expense updated" });
}

async function deleteExpense(req, res) {
  const check = validateRequest(req);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const expenseId = req.params.expenseId;
  const groupId = req.query.groupId || req.body.groupId;

  if (!groupId) return res.status(400).json({ message: "groupId is required" });

  const { isMember } = await ensureMemberOfGroup(groupId, req.user.id) || {};
  if (!isMember) return res.status(403).json({ message: "You are not a member of this group" });

  const expense = await Expense.findById(expenseId).select("_id group");
  if (!expense) return res.status(404).json({ message: "Expense not found" });
  if (String(expense.group) !== String(groupId)) return res.status(400).json({ message: "Expense does not belong to this group" });

  await Expense.deleteOne({ _id: expenseId });

  const io = req.app.get("io");
  io.to(`group_${groupId}`).emit("expenseUpdated", { groupId });

  return res.json({ message: "Expense deleted" });
}

module.exports = { addExpense, listExpenses, updateExpense, deleteExpense };

