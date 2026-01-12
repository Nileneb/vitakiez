import express from "express";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";

const app = express();
const PORT = process.env.PORT || 3000;

// Basic security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "img-src": ["'self'", "data:"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "script-src": ["'self'"]
      }
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Static
app.use(express.static("public", { maxAge: "1h", etag: true }));

// Health endpoint
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Fallback to index.html (SPA-style)
app.get("*", (_req, res) => {
  res.sendFile(process.cwd() + "/public/index.html");
});

app.listen(PORT, () => {
  console.log(`vitakiez listening on http://0.0.0.0:${PORT}`);
});
