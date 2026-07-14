import { Router, type IRouter } from "express";
import healthRouter from "./health";
import nibrrasRouter from "./nibrras";
import replitControlRouter from "./replit-control";

const router: IRouter = Router();

router.use(healthRouter);
router.use(nibrrasRouter);
router.use(replitControlRouter);

export default router;
