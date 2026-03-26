const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

module.exports = mongoose.model("Group", groupSchema);

