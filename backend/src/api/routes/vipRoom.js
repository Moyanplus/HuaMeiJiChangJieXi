const express = require("express");
const logger = require("../../utils/logger");
const { generateCustomPage } = require("../../utils/customPage");
const { buildVipRoomData } = require("../../services/vipRoomService");

/**
 * 创建贵宾厅聚合页面与数据路由。
 * @param {Object} deps - 依赖对象
 * @param {Object} deps.db - 数据库实例
 * @returns {import("express").Router} 路由实例
 */
function createVipRoomRouter({ db } = {}) {
  const router = express.Router();

  /**
   * 获取当前请求使用的数据库实例。
   * @param {import("express").Request} req - 请求对象
   * @returns {Object} 数据库实例
   */
  const resolveDb = (req) => db || req.app.locals.db;

  /**
   * 输出自定义 HTML 页面。
   * @param {import("express").Request} req - 请求对象
   * @param {import("express").Response} res - 响应对象
   * @returns {Promise<void>}
   */
  router.get("/custom-page", async (req, res) => {
    try {
      const { name, orderUserName } = req.query;

      if (!name) {
        return res.status(400).send(`
          <!DOCTYPE html>
          <html lang="zh-CN">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width,initial-scale=1" />
            <title>参数错误</title>
          </head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>参数错误</h1>
            <p>请提供name参数</p>
          </body>
          </html>
        `);
      }

      const queryUserName = orderUserName || name;
      logger.info("custom page query", {
        name,
        orderUserName,
        queryUserName,
      });

      const vipRoomResult = await buildVipRoomData({
        db: resolveDb(req),
        name,
        orderUserName,
      });

      if (vipRoomResult.error) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html lang="zh-CN">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width,initial-scale=1" />
            <title>未找到用户</title>
          </head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>未找到用户</h1>
            <p>${vipRoomResult.error}</p>
          </body>
          </html>
        `);
      }

      const customHtml = generateCustomPage(
        name,
        vipRoomResult.userData,
        orderUserName
      );

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(customHtml);
    } catch (e) {
      logger.error("custom-page error", e && e.message ? e.message : e);
      res.status(500).send(`
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <title>服务器错误</title>
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>服务器错误</h1>
          <p>${e && e.message ? e.message : String(e)}</p>
        </body>
        </html>
      `);
    }
  });

  /**
   * 获取贵宾厅业务数据。
   * @param {import("express").Request} req - 请求对象
   * @param {import("express").Response} res - 响应对象
   * @returns {Promise<void>}
   */
  router.get("/api/vip-room", async (req, res) => {
    try {
      const { name, orderUserName } = req.query;

      if (!name) {
        return res.status(400).json({
          ok: false,
          error: "请提供name参数",
        });
      }

      const queryUserName = orderUserName || name;
      logger.info("vip-room query", {
        name,
        orderUserName,
        queryUserName,
      });

      const vipRoomResult = await buildVipRoomData({
        db: resolveDb(req),
        name,
        orderUserName,
      });

      if (vipRoomResult.error) {
        return res.status(404).json({
          ok: false,
          error: vipRoomResult.error,
        });
      }

      res.json({ ok: true, data: vipRoomResult.data });
    } catch (e) {
      logger.error("vip-room error", e && e.message ? e.message : e);
      res
        .status(500)
        .json({ ok: false, error: e && e.message ? e.message : String(e) });
    }
  });

  return router;
}

module.exports = createVipRoomRouter;
