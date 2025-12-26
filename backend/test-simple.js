const express = require("express");
const app = express();

app.get("/health", (req, res) => {
  console.log("Health check requested");
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.get("/", (req, res) => {
  console.log("Root requested");
  res.send("Hello World!");
});

const port = 8080;
app.listen(port, "0.0.0.0", () => {
  console.log(`Test server running on port ${port}`);
});
