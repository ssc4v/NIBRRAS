import { Router, type IRouter } from "express";
import healthRouter from "./health";
import nirbasRouter from "./nirbas";
import replitControlRouter from "./replit-control";

const router: IRouter = Router();

router.use(healthRouter);
router.use(nirbasRouter);
router.use(replitControlRouter);

export default router;
