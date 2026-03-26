const express = require("express");
const { param } = require("express-validator");

const { authMiddleware } = require("../middleware/auth");
const settlementController = require("../controllers/settlementController");

const router = express.Router();

// Protected: only JWT-authenticated group members can access
router.get(
  "/settlement/:groupId",
  authMiddleware,
  [param("groupId").isMongoId().withMessage("groupId must be a valid MongoId")],
  settlementController.getGroupSettlement
);

module.exports = router;

