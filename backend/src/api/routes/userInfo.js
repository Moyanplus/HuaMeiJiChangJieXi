const express = require("express");
const cfg = require("../../core/config");
const logger = require("../../utils/logger");
const { decryptUrlData, fetchUserInfo } = require("../../services/userService");

/**
 * 创建用户信息相关路由。
 * @returns {import("express").Router} 路由实例
 */
function createUserInfoRouter() {
  const router = express.Router();

  /**
   * 解密链接中的用户信息数据。
   * @param {import("express").Request} req - 请求对象
   * @param {import("express").Response} res - 响应对象
   * @returns {Promise<void>}
   */
  router.post("/api/user-info", async (req, res) => {
    try {
      const { data, sign } = req.body || {};
      if (!data || !sign) {
        return res
          .status(400)
          .json({ ok: false, error: "data and sign are required" });
      }

      const decrypted = await decryptUrlData(data, cfg.ACTIVITY_ID);

      res.json({ ok: true, result: decrypted });
    } catch (e) {
      logger.error("user-info error", e && e.message ? e.message : e);
      res
        .status(500)
        .json({ ok: false, error: e && e.message ? e.message : String(e) });
    }
  });

  /**
   * 通过接口获取用户信息。
   * @param {import("express").Request} req - 请求对象
   * @param {import("express").Response} res - 响应对象
   * @returns {Promise<void>}
   */
  router.post("/api/get-user-info", async (req, res) => {
    try {
      const { cardTypeCode = cfg.CARD_TYPE_CODE, data: userData } = req.body;
      logger.info("get-user-info request", { cardTypeCode });

      if (!userData) {
        return res.status(400).json({
          ok: false,
          error: "data 参数是必需的，请先通过链接解析获取 data 参数",
        });
      }

      const { userInfo } = await fetchUserInfo({
        cardTypeCode,
        data: userData,
      });

      if (!userInfo) {
        return res.status(500).json({
          ok: false,
          error: "无法获取用户信息",
        });
      }

      res.json({
        ok: true,
        data: userInfo,
        message: "用户信息获取成功",
      });
    } catch (error) {
      logger.error(
        "get-user-info error",
        error && error.message ? error.message : error
      );
      res.status(500).json({
        ok: false,
        error: "获取用户信息失败",
        details: error.message,
      });
    }
  });

  return router;
}

module.exports = createUserInfoRouter;
