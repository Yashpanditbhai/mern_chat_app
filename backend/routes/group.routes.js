import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { createGroup, getMyGroups, getGroupDetails, leaveGroup, updateGroupSettings, makeAdmin } from "../controllers/group.controller.js";
import { createPoll, getGroupPolls } from "../controllers/poll.controller.js";

const router = express.Router();

router.post("/", protectRoute, createGroup);
router.get("/", protectRoute, getMyGroups);
router.get("/:id", protectRoute, getGroupDetails);
router.post("/:id/leave", protectRoute, leaveGroup);
router.put("/:id/settings", protectRoute, updateGroupSettings);
router.post("/:id/make-admin/:userId", protectRoute, makeAdmin);
router.post("/:id/poll", protectRoute, createPoll);
router.get("/:id/polls", protectRoute, getGroupPolls);

export default router;
