import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { votePoll } from "../controllers/poll.controller.js";

const router = express.Router();

router.post("/:pollId/vote", protectRoute, votePoll);

export default router;
