import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import router from "./routes";
import { logger } from "./lib/logger";
import { WebhookHandler } from "./routes/stripe";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
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

app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  WebhookHandler,
);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Required behind Netlify/Render reverse proxies so session cookies work over HTTPS.
app.set("trust proxy", 1);

const sessionSecret = process.env.SESSION_SECRET ?? "walker-creek-secret-dev";
const isProduction = process.env.NODE_ENV === "production";
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);

app.use("/api", router);

export default app;
