const express = require("express");
const logger = require("../../utils/logger");

/**
 * 创建用户数据相关路由。
 * @param {Object} deps - 依赖对象
 * @param {Object} deps.db - 数据库实例
 * @returns {import("express").Router} 路由实例
 */
function createUserDataRouter({ db } = {}) {
  const router = express.Router();
  /**
   * 获取当前请求使用的数据库实例。
   * @param {import("express").Request} req - 请求对象
   * @returns {Object} 数据库实例
   */
  const resolveDb = (req) => db || req.app.locals.db;

  /**
   * 保存用户数据。
   * @param {import("express").Request} req - 请求对象
   * @param {import("express").Response} res - 响应对象
   * @returns {Promise<void>}
   */
  router.post("/api/save-user-data", async (req, res) => {
    try {
      const userData = req.body;
      if (!userData.userName || !userData.orderNo) {
        return res.status(400).json({
          ok: false,
          error: "userName和orderNo是必填字段",
        });
      }

      const result = await resolveDb(req).saveUserData(userData);

      res.json({
        ok: true,
        message: "用户数据保存成功",
        data: result,
      });
    } catch (e) {
      logger.error("save-user-data error", e && e.message ? e.message : e);
      res
        .status(500)
        .json({ ok: false, error: e && e.message ? e.message : String(e) });
    }
  });

  /**
   * 按订单号获取用户数据。
   * @param {import("express").Request} req - 请求对象
   * @param {import("express").Response} res - 响应对象
   * @returns {Promise<void>}
   */
  router.get("/api/user-by-order/:orderNo", async (req, res) => {
    try {
      const { orderNo } = req.params;
      if (!orderNo) {
        return res.status(400).json({
          ok: false,
          error: "请提供orderNo参数",
        });
      }

      const userData = await resolveDb(req).getUserDataByOrderNo(orderNo);
      if (!userData) {
        return res.status(404).json({
          ok: false,
          error: `未找到订单号 ${orderNo} 的数据`,
        });
      }

      res.json({
        ok: true,
        data: userData,
      });
    } catch (e) {
      logger.error("user-by-order error", e && e.message ? e.message : e);
      res
        .status(500)
        .json({ ok: false, error: e && e.message ? e.message : String(e) });
    }
  });

  /**
   * 获取全部用户数据列表。
   * @param {import("express").Request} req - 请求对象
   * @param {import("express").Response} res - 响应对象
   * @returns {Promise<void>}
   */
  router.get("/api/all-users", async (req, res) => {
    try {
      const allUsers = await resolveDb(req).getAllUserData();
      res.json({
        ok: true,
        data: allUsers,
        count: allUsers.length,
      });
    } catch (e) {
      logger.error("all-users error", e && e.message ? e.message : e);
      res
        .status(500)
        .json({ ok: false, error: e && e.message ? e.message : String(e) });
    }
  });

  return router;
}

module.exports = createUserDataRouter;
