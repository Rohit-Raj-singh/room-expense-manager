const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

const User = require("../models/User");

function validateRequest(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return { ok: false, status: 400, message: errors.array()[0].msg };
  }
  return { ok: true };
}

async function register(req, res) {
  const check = validateRequest(req);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const { name, mobileNumber, password } = req.body;

  const existing = await User.findOne({ $or: [{ mobileNumber }, { mobile: mobileNumber }] });
  if (existing) return res.status(409).json({ message: "Mobile number already registered" });

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = await User.create({
    name,
    mobileNumber,
    // Keep old `mobile` index value in sync to avoid duplicate-key crashes.
    mobile: mobileNumber,
    password: passwordHash,
    role: "user",
  });

  return res.status(201).json({
    message: "User registered successfully",
    userId: user._id,
  });
}

async function login(req, res) {
  const check = validateRequest(req);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const { mobileNumber, password } = req.body;

  const user = await User.findOne({
    $or: [{ mobileNumber }, { mobile: mobileNumber }]
  }).select("+password");
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { role: user.role },
    process.env.JWT_SECRET,
    {
      subject: user._id.toString(),
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );

  return res.json({
    token,
    user: { id: user._id, name: user.name, mobileNumber: user.mobileNumber, role: user.role },
  });
}

module.exports = { register, login };

