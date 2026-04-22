import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { searchGifs, getLinkPreview } from "../controllers/misc.controller.js";

const router = express.Router();

router.get("/gifs", protectRoute, searchGifs);
router.get("/link-preview", protectRoute, getLinkPreview);

export default router;
