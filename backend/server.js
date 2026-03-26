const path = require("path");
const http = require("http");
const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const groupRoutes = require("./routes/group");
const expenseRoutes = require("./routes/expense");
const balanceRoutes = require("./routes/balance");
const analyticsRoutes = require("./routes/analytics");
const settlementRoutes = require("./routes/settlementRoutes");
const { initSocket } = require("./socket");

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
app.disable("x-powered-by");

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5500",
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));

// API routes
app.use("/api", authRoutes);
app.use("/api", groupRoutes);
app.use("/api", expenseRoutes);
app.use("/api", balanceRoutes);
app.use("/api", analyticsRoutes);
app.use("/api", settlementRoutes);

// Serve frontend if built assets are present (optional; for separate deployments this can be skipped)
const frontendDistDir = path.join(__dirname, "..", "frontend", "app", "dist");
if (fs.existsSync(frontendDistDir)) {
  app.use(express.static(frontendDistDir));
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendDistDir, "index.html"));
  });
}

// Basic healthcheck
app.get("/health", (req, res) => res.json({ ok: true }));

async function start() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("Missing MONGODB_URI in backend/.env");

  const port = Number(process.env.PORT || 3000);

  await mongoose.connect(mongoUri, {
    autoIndex: true,
  });

  const server = http.createServer(app);
  const io = initSocket(server);

  // Make io accessible to controllers
  app.set("io", io);

  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${port}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server:", err);
  process.exit(1);
});

