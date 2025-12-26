const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/test", (req, res) => {
  res.json({ message: "Test successful" });
});

const port = 3001;
app.listen(port, () => {
  console.log(`Test server running on port ${port}`);
});
