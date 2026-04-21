import express from "express";
import { getMessages, sendMessage } from "../controllers/message.controller.js";
import protectRoute from "../middleware/protectRoute.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.get("/:id", protectRoute, getMessages);

// upload.single("file") handles multipart/form-data with optional file
router.post("/send/:id", protectRoute, upload.single("file"), sendMessage);

export default router;
