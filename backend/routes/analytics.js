const express = require("express");
const { query } = require("express-validator");

const { authMiddleware } = require("../middleware/auth");
const analyticsController = require("../controllers/analyticsController");

const router = express.Router();

router.get(
  "/analytics/monthly",
  authMiddleware,
  [query("groupId").isMongoId().withMessage("groupId is required")],
  analyticsController.monthlyExpense
);

router.get(
  "/analytics/member-wise",
  authMiddleware,
  [query("groupId").isMongoId().withMessage("groupId is required")],
  analyticsController.memberWiseExpense
);

module.exports = router;

