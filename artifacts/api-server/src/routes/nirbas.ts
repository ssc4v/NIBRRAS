import { Router, type IRouter } from "express";

const router: IRouter = Router();
const DEFAULT_GATEWAY_URL = "https://sc4v.app.n8n.cloud/webhook/nirbas-api";

router.post("/nirbas", async (req, res, next) => {
  try {
    const gatewayUrl = process.env.NIRBAS_GATEWAY_URL ?? DEFAULT_GATEWAY_URL;
    const authHeader = process.env.NIRBAS_AUTH_HEADER ?? "Authorization";
    const authValue = process.env.NIRBAS_AUTH_VALUE;

    if (!authValue) {
      res.status(503).json({
        ok: false,
        error: { code: "NIRBAS_AUTH_MISSING", message: "لم يتم إعداد اعتماد بوابة نبراس في الخادم" },
        requestId: req.id,
      });
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    try {
      const response = await fetch(gatewayUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          [authHeader]: authValue,
          "x-request-id": String(req.id ?? ""),
        },
        body: JSON.stringify(req.body),
        signal: controller.signal,
      });

      const body = await response.text();
      res.status(response.status);
      res.type(response.headers.get("content-type") ?? "application/json");
      res.send(body);
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    next(error);
  }
});

export default router;
