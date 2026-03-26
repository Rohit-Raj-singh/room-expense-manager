const express = require("express");
const { body } = require("express-validator");

const { authMiddleware } = require("../middleware/auth");
const authController = require("../controllers/authController");

const router = express.Router();

router.post(
  "/register",
  [
    body("name").isString().trim().isLength({ min: 1 }).withMessage("Name is required"),
    body("mobileNumber")
      .isString()
      .trim()
      .matches(/^[0-9]{10,15}$/)
      .withMessage("mobileNumber must be 10-15 digits"),
    body("password").isString().isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  authController.register
);

router.post(
  "/login",
  [
    body("mobileNumber").isString().trim().matches(/^[0-9]{10,15}$/).withMessage("mobileNumber must be valid"),
    body("password").isString().isLength({ min: 1 }).withMessage("Password is required"),
  ],
  authController.login
);

// Convenience: no-op endpoint for auth checks
router.get("/me", authMiddleware, (req, res) => res.json({ user: req.user }));

module.exports = router;

