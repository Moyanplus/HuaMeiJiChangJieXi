const express = require("express");
const logger = require("../../utils/logger");
const { runFullFlow } = require("../../services/fullFlowService");

/**
 * 创建全流程执行路由。
 * @param {Object} deps - 依赖对象
 * @param {Object} deps.db - 数据库实例
 * @returns {import("express").Router} 路由实例
 */
function createFullFlowRouter({ db } = {}) {
  const router = express.Router();
  /**
   * 获取当前请求使用的数据库实例。
   * @param {import("express").Request} req - 请求对象
   * @returns {Object} 数据库实例
   */
  const resolveDb = (req) => db || req.app.locals.db;

  /**
   * 执行完整业务流程并返回聚合结果。
   * @param {import("express").Request} req - 请求对象
   * @param {import("express").Response} res - 响应对象
   * @returns {Promise<void>}
   */
  router.post("/api/full-flow", async (req, res) => {
    try {
      const { data, sign } = req.body || {};
      if (!data) {
        return res.status(400).json({ ok: false, error: "data is required" });
      }
      if (!sign) {
        logger.warn("full-flow request missing sign");
      }

      const result = await runFullFlow({
        data,
        db: resolveDb(req),
      });

      if (result && result.ok === false) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (e) {
      logger.error("full-flow error", e && e.message ? e.message : e);
      res
        .status(500)
        .json({ ok: false, error: e && e.message ? e.message : String(e) });
    }
  });

  return router;
}

module.exports = createFullFlowRouter;
