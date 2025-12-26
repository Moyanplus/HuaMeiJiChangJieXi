const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const createRouter = require("./routes");
const requestLogger = require("./middleware/requestLogger");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandlers");

/**
 * 创建并配置 Express 应用实例。
 * @param {Object} deps - 依赖对象
 * @param {Object} deps.db - 数据库实例
 * @param {Object} deps.cityManager - 城市数据管理实例
 * @returns {import("express").Express} 应用实例
 */
function createApp({ db, cityManager } = {}) {
  const app = express();

  app.locals.db = db;
  app.locals.cityManager = cityManager;

  app.use(requestLogger);
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.static(path.join(__dirname, "..", "..", "public")));

  app.use(
    "/frontend",
    express.static(path.join(__dirname, "..", "..", "..", "frontend"))
  );
  app.use(
    "/image",
    express.static(path.join(__dirname, "..", "..", "..", "frontend", "image"))
  );

  /**
   * 提供本地二维码脚本资源。
   * @param {import("express").Request} req - 请求对象
   * @param {import("express").Response} res - 响应对象
   * @returns {void}
   */
  app.get("/qrcode.js", (req, res) => {
    const candidates = [
      path.join(
        __dirname,
        "..",
        "..",
        "node_modules",
        "qrcode",
        "build",
        "qrcode.min.js"
      ),
      path.join(
        __dirname,
        "..",
        "..",
        "node_modules",
        "qrcode",
        "build",
        "qrcode.js"
      ),
      path.join(
        __dirname,
        "..",
        "..",
        "node_modules",
        "qrcode",
        "dist",
        "browser",
        "index.umd.js"
      ),
    ];
    const found = candidates.find((p) => fs.existsSync(p));
    if (!found) {
      return res.status(404).type("text/plain").send("qrcode bundle not found");
    }
    res.type("application/javascript");
    res.sendFile(found);
  });

  app.use(createRouter({ db, cityManager }));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
