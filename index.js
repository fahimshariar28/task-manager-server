const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Task Manager in running!");
});

app.listen(port, () => {
  console.log(`Task Manager Server is running on port: ${port}`);
});
