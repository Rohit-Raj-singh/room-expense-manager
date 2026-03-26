const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true, required: true },
    member: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true, index: true },
    date: { type: Date, required: true, default: Date.now },
  },
  { versionKey: false }
);

expenseSchema.index({ group: 1, date: -1 });

module.exports = mongoose.model("Expense", expenseSchema);

