import express from "express";
import cors from "cors";
import contentRouter from "./routes/content";
import { getBooksRootPath, getCoversRootPath } from "./files/dataPaths";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/covers", express.static(getCoversRootPath()));
app.use("/book-files", express.static(getBooksRootPath()));

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
