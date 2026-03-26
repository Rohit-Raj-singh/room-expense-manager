const Group = require("../models/Group");

async function assertMemberOfGroup(req, res, next) {
  const { groupId } = req.body;
  const groupIdFromQuery = req.query.groupId;
  const groupIdFromParams = req.params.groupId;
  const gid = groupId || groupIdFromQuery || groupIdFromParams;
  if (!gid) return res.status(400).json({ message: "Missing groupId" });

  const group = await Group.findById(gid).select("_id members admin name");
  if (!group) return res.status(404).json({ message: "Group not found" });

  const isMember = group.members.some((m) => String(m) === String(req.user.id));
  if (!isMember) return res.status(403).json({ message: "You are not a member of this group" });

  req.group = group;
  next();
}

async function assertAdminOfGroup(req, res, next) {
  const { groupId } = req.body;
  const groupIdFromQuery = req.query.groupId;
  const groupIdFromParams = req.params.groupId;
  const gid = groupId || groupIdFromQuery || groupIdFromParams;
  if (!gid) return res.status(400).json({ message: "Missing groupId" });

  const group = await Group.findById(gid).select("_id admin members name");
  if (!group) return res.status(404).json({ message: "Group not found" });

  if (String(group.admin) !== String(req.user.id)) {
    return res.status(403).json({ message: "Only the admin can perform this action" });
  }

  req.group = group;
  next();
}

module.exports = { assertMemberOfGroup, assertAdminOfGroup };

