import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { createStory, getStories, viewStory } from "../controllers/story.controller.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.post("/", protectRoute, upload.single("file"), createStory);
router.get("/", protectRoute, getStories);
router.post("/:id/view", protectRoute, viewStory);

export default router;
