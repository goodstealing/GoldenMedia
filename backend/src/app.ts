import express from "express";
import cors from "cors";
import path from "path";
import contentRouter from "./routes/content";

const app = express();

app.use(cors());
app.use(express.json());

// Статика обложек: GoldenMedia/backend/src/data/covers
const backendSrcRoot = __dirname;
const coversDir = path.join(backendSrcRoot, "data", "covers");
app.use("/covers", express.static(coversDir));

app.get("/", (_req, res) => {
  res.send(
    "Golden Media API is running. Use /health or /api/content/:category"
  );
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/content", contentRouter);

export default app;
