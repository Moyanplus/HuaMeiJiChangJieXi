const express = require("express");
const logger = require("../../utils/logger");

/**
 * 创建城市数据相关路由。
 * @param {Object} deps - 依赖对象
 * @param {Object} deps.cityManager - 城市数据管理实例
 * @returns {import("express").Router} 路由实例
 */
function createCitiesRouter({ cityManager } = {}) {
  const router = express.Router();
  /**
   * 获取当前请求可用的城市管理实例。
   * @param {import("express").Request} req - 请求对象
   * @returns {Object} 城市数据管理实例
   */
  const resolveManager = (req) => cityManager || req.app.locals.cityManager;

  /**
   * 获取全部城市列表。
   * @param {import("express").Request} req - 请求对象
   * @param {import("express").Response} res - 响应对象
   * @returns {Promise<void>}
   */
  router.get("/api/cities", async (req, res) => {
    try {
      const cities = await resolveManager(req).getAllCities();
      res.json({ success: true, data: cities, count: cities.length });
    } catch (error) {
      logger.error("get cities failed", error && error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * 按国家代码获取城市列表。
   * @param {import("express").Request} req - 请求对象
   * @param {import("express").Response} res - 响应对象
   * @returns {Promise<void>}
   */
  router.get("/api/cities/country/:countryCode", async (req, res) => {
    try {
      const { countryCode } = req.params;
      const cities = await resolveManager(req).getCitiesByCountry(countryCode);
      res.json({ success: true, data: cities, count: cities.length });
    } catch (error) {
      logger.error("get cities by country failed", error && error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * 按关键字搜索城市。
   * @param {import("express").Request} req - 请求对象
   * @param {import("express").Response} res - 响应对象
   * @returns {Promise<void>}
   */
  router.get("/api/cities/search", async (req, res) => {
    try {
      const { keyword } = req.query;
      if (!keyword) {
        return res
          .status(400)
          .json({ success: false, error: "搜索关键词不能为空" });
      }

      const cities = await resolveManager(req).searchCities(keyword);
      res.json({ success: true, data: cities, count: cities.length });
    } catch (error) {
      logger.error("search cities failed", error && error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * 手动触发城市数据同步。
   * @param {import("express").Request} req - 请求对象
   * @param {import("express").Response} res - 响应对象
   * @returns {Promise<void>}
   */
  router.post("/api/cities/sync", async (req, res) => {
    try {
      logger.info("manual sync city data");
      const result = await resolveManager(req).syncCityData();
      res.json({
        success: true,
        message: "城市数据同步完成",
        data: result,
      });
    } catch (error) {
      logger.error("sync cities failed", error && error.message);
      res.status(500).json({
        success: false,
        error: error.message,
        message: "城市数据同步失败",
      });
    }
  });

  /**
   * 获取城市同步日志列表。
   * @param {import("express").Request} req - 请求对象
   * @param {import("express").Response} res - 响应对象
   * @returns {Promise<void>}
   */
  router.get("/api/cities/sync-logs", async (req, res) => {
    try {
      const { limit = 30 } = req.query;
      const logs = await resolveManager(req).getSyncLogs(parseInt(limit));
      res.json({ success: true, data: logs });
    } catch (error) {
      logger.error("sync logs failed", error && error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}

module.exports = createCitiesRouter;
