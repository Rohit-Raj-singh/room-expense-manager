const express = require("express");
const { body, query } = require("express-validator");

const { authMiddleware } = require("../middleware/auth");
const expenseController = require("../controllers/expenseController");

const router = express.Router();

router.post(
  "/expense/add",
  authMiddleware,
  [
    body("groupId").isMongoId().withMessage("groupId is required"),
    body("description").isString().trim().isLength({ min: 1 }).withMessage("description is required"),
    body("amount").isNumeric().custom((v) => Number(v) >= 0).withMessage("amount must be >= 0"),
    body("member").isMongoId().withMessage("member (userId) is required"),
    body("date").optional().isString().withMessage("date must be a valid date string"),
  ],
  expenseController.addExpense
);

router.get(
  "/expense/list",
  authMiddleware,
  [
    query("groupId").optional().isMongoId().withMessage("groupId must be a valid MongoId"),
  ],
  expenseController.listExpenses
);

router.put(
  "/expense/:expenseId",
  authMiddleware,
  [
    body("groupId").isMongoId().withMessage("groupId is required"),
    body("description").isString().trim().isLength({ min: 1 }).withMessage("description is required"),
    body("amount").isNumeric().custom((v) => Number(v) >= 0).withMessage("amount must be >= 0"),
    body("member").isMongoId().withMessage("member (userId) is required"),
    body("date").optional().isString().withMessage("date must be a valid date string"),
  ],
  expenseController.updateExpense
);

router.delete(
  "/expense/:expenseId",
  authMiddleware,
  [
    query("groupId").isMongoId().withMessage("groupId is required"),
  ],
  expenseController.deleteExpense
);

module.exports = router;

