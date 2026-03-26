const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    mobileNumber: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      index: true,
    },
    // Backward-compatible field for older DBs/indexes.
    // If an old unique index exists on `mobile`, we must keep this in sync.
    mobile: { type: String, trim: true, required: false },
    password: { type: String, required: true, select: false },
    groups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }],
    // Kept for compatibility with JWT payload; authorization is enforced by group ownership/membership.
    role: { type: String, trim: true, default: "user" },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

module.exports = mongoose.model("User", userSchema);

