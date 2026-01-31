import express from "express";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "backend",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
});
