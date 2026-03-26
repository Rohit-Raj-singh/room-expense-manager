const { validationResult } = require("express-validator");
const Group = require("../models/Group");
const User = require("../models/User");
const Expense = require("../models/Expense");

function validateRequest(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return { ok: false, status: 400, message: errors.array()[0].msg };
  }
  return { ok: true };
}

async function createGroup(req, res) {
  const check = validateRequest(req);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const { name } = req.body;

  const group = await Group.create({
    name,
    admin: req.user.id,
    members: [req.user.id],
  });

  // Maintain user->groups relation for fast group listing.
  await User.updateOne({ _id: req.user.id }, { $addToSet: { groups: group._id } });

  return res.status(201).json({
    message: "Group created",
    group: {
      id: group._id,
      name: group.name,
      admin: group.admin,
      members: group.members,
    },
  });
}

async function addMember(req, res) {
  const check = validateRequest(req);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const { memberMobileNumber } = req.body;
  const groupId = req.body.groupId || req.query.groupId;

  const group = await Group.findById(groupId).select("admin members name");
  if (!group) return res.status(404).json({ message: "Group not found" });
  if (String(group.admin) !== String(req.user.id)) {
    return res.status(403).json({ message: "Only the admin can add members" });
  }

  const user = await User.findOne({
    $or: [{ mobileNumber: memberMobileNumber }, { mobile: memberMobileNumber }]
  });
  if (!user) return res.status(404).json({ message: "Member not found for this mobile number" });

  if (group.members.some((m) => String(m) === String(user._id))) {
    return res.status(200).json({ message: "Member already exists in group", group });
  }

  group.members.push(user._id);
  await group.save();

  await User.updateOne({ _id: user._id }, { $addToSet: { groups: group._id } });

  return res.json({
    message: "Member added",
    group: {
      id: group._id,
      name: group.name,
      admin: group.admin,
      members: group.members,
    },
  });
}

async function removeMember(req, res) {
  const check = validateRequest(req);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const { memberMobileNumber } = req.body;
  const groupId = req.body.groupId || req.query.groupId;

  const group = await Group.findById(groupId).select("admin members name");
  if (!group) return res.status(404).json({ message: "Group not found" });
  if (String(group.admin) !== String(req.user.id)) {
    return res.status(403).json({ message: "Only the admin can remove members" });
  }

  const user = await User.findOne({
    $or: [{ mobileNumber: memberMobileNumber }, { mobile: memberMobileNumber }]
  });
  if (!user) return res.status(404).json({ message: "Member not found for this mobile number" });

  if (String(user._id) === String(group.admin)) {
    return res.status(400).json({ message: "You cannot remove the group admin from the group" });
  }

  const isMember = group.members.some((m) => String(m) === String(user._id));
  if (!isMember) return res.status(404).json({ message: "Member is not in this group" });

  group.members = group.members.filter((m) => String(m) !== String(user._id));
  await group.save();

  await User.updateOne({ _id: user._id }, { $pull: { groups: group._id } });

  return res.json({
    message: "Member removed",
    group: { id: group._id, name: group.name, admin: group.admin, members: group.members },
  });
}

async function deleteGroup(req, res) {
  const check = validateRequest(req);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const groupId = req.params.groupId || req.body.groupId;
  const group = await Group.findById(groupId).select("admin members name");
  if (!group) return res.status(404).json({ message: "Group not found" });

  if (String(group.admin) !== String(req.user.id)) {
    return res.status(403).json({ message: "Only the admin can delete the group" });
  }

  // Delete all group expenses to guarantee strict group isolation over time.
  await Expense.deleteMany({ group: group._id });

  // Remove group from all member users.
  await User.updateMany(
    { _id: { $in: group.members } },
    { $pull: { groups: group._id } }
  );

  await group.deleteOne();

  return res.json({ message: "Group deleted" });
}

async function listMyGroups(req, res) {
  const check = validateRequest(req);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const groups = await Group.find({ members: req.user.id })
    .select("_id name admin members createdAt")
    .sort({ createdAt: -1 });

  return res.json({
    groups: groups.map((g) => ({
      id: g._id,
      name: g.name,
      admin: g.admin,
      membersCount: g.members.length,
      createdAt: g.createdAt,
    })),
  });
}

module.exports = { createGroup, addMember, removeMember, deleteGroup, listMyGroups };

