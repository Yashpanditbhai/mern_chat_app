import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { searchGifs, getLinkPreview, aiChat, clearAiChat } from "../controllers/misc.controller.js";

const router = express.Router();

router.get("/gifs", protectRoute, searchGifs);
router.get("/link-preview", protectRoute, getLinkPreview);
router.post("/ai-chat", protectRoute, aiChat);
router.post("/ai-chat/clear", protectRoute, clearAiChat);

export default router;
