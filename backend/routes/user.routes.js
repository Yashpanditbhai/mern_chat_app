import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { getUsersForSidebar, updateProfile, toggleBlockUser, toggleMuteUser, getBlockedAndMutedUsers } from "../controllers/user.controller.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.get("/", protectRoute, getUsersForSidebar);
router.get("/blocked-muted", protectRoute, getBlockedAndMutedUsers);
router.put("/profile", protectRoute, upload.single("file"), updateProfile);
router.put("/block/:userId", protectRoute, toggleBlockUser);
router.put("/mute/:userId", protectRoute, toggleMuteUser);

export default router;
