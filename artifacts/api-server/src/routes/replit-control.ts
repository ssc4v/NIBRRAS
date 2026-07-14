import { Router, type IRouter } from "express";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const router: IRouter = Router();
const execFileAsync = promisify(execFile);
const allowedActions = new Set(["health", "diagnostics", "typecheck", "build"]);
let runningAction: string | null = null;

function authorized(req: Parameters<Parameters<typeof router.post>[1]>[0]): boolean {
  const expected = process.env.REPLIT_CONTROL_TOKEN;
  const provided = req.header("x-replit-control-token");
  return Boolean(expected && provided && provided === expected);
}

router.post("/replit-control", async (req, res) => {
  if (!authorized(req)) {
    res.status(401).json({ ok: false, error: { code: "UNAUTHORIZED", message: "اعتماد التحكم غير صحيح" } });
    return;
  }

  const action = String(req.body?.action ?? "").trim();
  if (!allowedActions.has(action)) {
    res.status(400).json({ ok: false, error: { code: "ACTION_NOT_ALLOWED", message: "الأمر غير مسموح" } });
    return;
  }

  const base = {
    pid: process.pid,
    uptimeSeconds: Math.round(process.uptime()),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV ?? "unknown",
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  };

  if (action === "health") {
    res.json({ ok: true, action, data: base });
    return;
  }

  if (action === "diagnostics") {
    res.json({
      ok: true,
      action,
      data: {
        ...base,
        configuration: {
          nirbasGatewayConfigured: Boolean(process.env.NIRBAS_GATEWAY_URL),
          nirbasAuthConfigured: Boolean(process.env.NIRBAS_AUTH_VALUE),
          controlTokenConfigured: Boolean(process.env.REPLIT_CONTROL_TOKEN),
        },
      },
    });
    return;
  }

  if (runningAction) {
    res.status(409).json({ ok: false, error: { code: "ACTION_IN_PROGRESS", message: `الأمر ${runningAction} قيد التنفيذ` } });
    return;
  }

  runningAction = action;
  try {
    const script = action === "typecheck" ? "typecheck" : "build";
    const result = await execFileAsync("pnpm", ["run", script], {
      cwd: process.cwd(),
      timeout: 120_000,
      maxBuffer: 512_000,
      env: process.env,
    });
    res.json({ ok: true, action, data: { stdout: result.stdout.slice(-12000), stderr: result.stderr.slice(-12000), ...base } });
  } catch (error) {
    const details = error as { message?: string; stdout?: string; stderr?: string; code?: number | string };
    res.status(500).json({
      ok: false,
      action,
      error: {
        code: "COMMAND_FAILED",
        message: details.message ?? "فشل تنفيذ الأمر",
        exitCode: details.code ?? null,
        stdout: String(details.stdout ?? "").slice(-12000),
        stderr: String(details.stderr ?? "").slice(-12000),
      },
    });
  } finally {
    runningAction = null;
  }
});

export default router;
