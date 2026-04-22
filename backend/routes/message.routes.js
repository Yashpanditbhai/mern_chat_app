import express from "express";
import {
	getMessages, sendMessage, sendGroupMessage, getGroupMessages,
	reactToMessage, deleteMessage, forwardMessage,
	pinMessage, starMessage, getStarredMessages, searchMessages,
} from "../controllers/message.controller.js";
import protectRoute from "../middleware/protectRoute.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

// Group messages (must be before /:id to avoid conflicts)
router.get("/group/:conversationId", protectRoute, getGroupMessages);
router.post("/send/group/:conversationId", protectRoute, upload.single("file"), sendGroupMessage);

// Message actions
router.post("/react/:messageId", protectRoute, reactToMessage);
router.post("/delete/:messageId", protectRoute, deleteMessage);
router.post("/forward/:messageId", protectRoute, forwardMessage);
router.post("/pin/:messageId", protectRoute, pinMessage);
router.post("/star/:messageId", protectRoute, starMessage);

// Search & starred
router.get("/starred/all", protectRoute, getStarredMessages);
router.get("/search/query", protectRoute, searchMessages);

// Direct messages
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, upload.single("file"), sendMessage);

export default router;
