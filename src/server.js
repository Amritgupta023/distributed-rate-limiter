const express = require("express");
const rateLimiter = require("./middleware/rateLimiter");

const app = express();

const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Distributed Rate Limiter",
    level: 4,
    algorithm: "Token Bucket",
  });
});

app.get("/api/test", rateLimiter, (req, res) => {
  res.json({
    success: true,
    message: "Request allowed",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});