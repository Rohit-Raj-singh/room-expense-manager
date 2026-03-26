const express = require("express");
const { query } = require("express-validator");

const { authMiddleware } = require("../middleware/auth");
const balanceController = require("../controllers/balanceController");

const router = express.Router();

router.get(
  "/group/summary",
  authMiddleware,
  [query("groupId").optional().isMongoId().withMessage("groupId must be a valid MongoId")],
  balanceController.getBalance
);

module.exports = router;

