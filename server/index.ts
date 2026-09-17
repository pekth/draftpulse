import "dotenv/config";
import cors from "cors";
import express from "express";
import { analyzeLive, analyzeMock, hasApiKey } from "./analyze.js";

const PORT = Number(process.env.PORT || 8787);
const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: "32kb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    mode: hasApiKey() ? "live" : "mock",
  });
});

app.post("/api/analyze", async (req, res) => {
  const text = typeof req.body?.text === "string" ? req.body.text : "";
  if (!text.trim()) {
    res.status(400).json({ error: "text required" });
    return;
  }
  if (text.length > 8000) {
    res.status(400).json({ error: "text too long" });
    return;
  }

  const ac = new AbortController();
  const timeout = setTimeout(() => ac.abort(), 30_000);

  try {
    if (!hasApiKey()) {
      res.json(analyzeMock(text));
      return;
    }
    const result = await analyzeLive(text, ac.signal);
    res.json(result);
  } catch (err) {
    if (ac.signal.aborted) {
      if (!res.headersSent) res.status(504).json({ error: "timed out" });
      return;
    }
    console.error(err);
    if (!res.headersSent) {
      res.json({
        ...analyzeMock(text),
        tips: ["Live Jev failed; showing mock heuristic."],
      });
    }
  } finally {
    clearTimeout(timeout);
  }
});

app.listen(PORT, () => {
  console.log(
    `viral-post-analyzer API on http://localhost:${PORT} (${hasApiKey() ? "live" : "mock"})`,
  );
});
