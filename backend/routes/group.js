const express = require("express");
const { body, param } = require("express-validator");

const { authMiddleware } = require("../middleware/auth");
const groupController = require("../controllers/groupController");

const router = express.Router();

router.post(
  "/group/create",
  authMiddleware,
  [
    body("name").isString().trim().isLength({ min: 2 }).withMessage("name is required"),
  ],
  groupController.createGroup
);

router.get("/group/list", authMiddleware, groupController.listMyGroups);

router.post(
  "/group/add-member",
  authMiddleware,
  [
    body("groupId").isMongoId().withMessage("groupId is required"),
    body("memberMobileNumber")
      .isString()
      .trim()
      .matches(/^[0-9]{10,15}$/)
      .withMessage("memberMobileNumber must be 10-15 digits"),
  ],
  groupController.addMember
);

router.post(
  "/group/remove-member",
  authMiddleware,
  [
    body("groupId").isMongoId().withMessage("groupId is required"),
    body("memberMobileNumber")
      .isString()
      .trim()
      .matches(/^[0-9]{10,15}$/)
      .withMessage("memberMobileNumber must be 10-15 digits"),
  ],
  groupController.removeMember
);

router.delete(
  "/group/:groupId",
  authMiddleware,
  [
    param("groupId").isMongoId().withMessage("groupId is required"),
  ],
  groupController.deleteGroup
);

module.exports = router;

