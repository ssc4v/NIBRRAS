import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import nirbasRouter from "./nirbas.js";
import replitControlRouter from "./replit-control.js";
import employeesRouter from "./employees.js";
import tasksRouter from "./tasks.js";
import approvalsRouter from "./approvals.js";
import n8nManagementRouter from "./n8nManagement.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(nirbasRouter);
router.use(replitControlRouter);
router.use(employeesRouter);
router.use(tasksRouter);
router.use(approvalsRouter);
router.use(n8nManagementRouter);

export default router;
