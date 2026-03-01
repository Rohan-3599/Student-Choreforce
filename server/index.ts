import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { mountIntegratedRoutes } from "./index.integrated";
import { createServer } from "http";
import dotenv from "dotenv";

dotenv.config({ path: "./server/.env" });

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

mountIntegratedRoutes(app);

// Paste this into server/index.ts after app.use(express.urlencoded(...)) and before registerRoutes(...)
app.get("/api/debug/user", (req, res) => {
  // req.user is set by your auth middleware when authenticated; otherwise undefined.
  // We return a simple JSON object to make debugging easy from curl / browser.
  try {
    // If you have a typed user, this just returns whatever is present.
    const user = (req as any).user || null;

    // Return JSON always (no HTML), so it's safe to call from client or curl.
    return res.json({ ok: true, user });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        const responseStr = JSON.stringify(capturedJsonResponse);
        logLine += ` :: ${responseStr.length > 200 ? responseStr.slice(0, 200) + "..." : responseStr}`;
      }

      log(logLine);
    }
    capturedJsonResponse = undefined;
  });

  next();
});

(async () => {
  // Always register routes.
  // Replit auth is already guarded inside routes.ts.
  // This ensures API routes are available locally.
  try {
    await registerRoutes(httpServer, app);
  } catch (err) {
    console.error("registerRoutes() failed (continuing anyway):", err);
  }

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  // const port = parseInt(process.env.PORT || "5000", 10);
  // httpServer.listen(
  //   {
  //     port,
  //     host: "0.0.0.0",
  //     reusePort: true,
  //   },
  //   () => {
  //     log(`serving on port ${port}`);
  //   },
  // );
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
