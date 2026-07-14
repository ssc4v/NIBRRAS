import crypto from "node:crypto";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cors, { type CorsOptions } from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
const allowedOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("CORS_ORIGIN_NOT_ALLOWED"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
  maxAge: 86_400,
};

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use((req, res, next) => {
  const requestId = String(req.header("x-request-id") || crypto.randomUUID());
  res.setHeader("x-request-id", requestId);
  res.setHeader("x-content-type-options", "nosniff");
  res.setHeader("x-frame-options", "DENY");
  res.setHeader("referrer-policy", "no-referrer");
  res.setHeader("permissions-policy", "camera=(), microphone=(), geolocation=()");
  next();
});

app.use(
  pinoHttp({
    logger,
    genReqId(req, res) {
      const id = String(req.headers["x-request-id"] || crypto.randomUUID());
      res.setHeader("x-request-id", id);
      return id;
    },
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "nibrras-api", timestamp: new Date().toISOString() });
});

app.use("/api", router);

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: { code: "NOT_FOUND", message: "المسار غير موجود" } });
});

app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
  const message = error instanceof Error ? error.message : "INTERNAL_SERVER_ERROR";
  req.log?.error({ err: error }, "request failed");
  const status = message === "CORS_ORIGIN_NOT_ALLOWED" ? 403 : 500;
  res.status(status).json({
    ok: false,
    error: {
      code: message === "CORS_ORIGIN_NOT_ALLOWED" ? message : "INTERNAL_SERVER_ERROR",
      message: status === 403 ? "المصدر غير مسموح" : "حدث خطأ داخلي",
    },
    requestId: res.getHeader("x-request-id"),
  });
});

export default app;
