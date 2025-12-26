const express = require("express");
const logger = require("../../utils/logger");

/**
 * 创建贵宾厅数据相关路由。
 * @param {Object} deps - 依赖对象
 * @param {Object} deps.db - 数据库实例
 * @returns {import("express").Router} 路由实例
 */
function createLoungesRouter({ db } = {}) {
  const router = express.Router();
  /**
   * 获取当前请求使用的数据库实例。
   * @param {import("express").Request} req - 请求对象
   * @returns {Object} 数据库实例
   */
  const resolveDb = (req) => db || req.app.locals.db;

  /**
   * 获取贵宾厅列表（支持筛选）。
   * @param {import("express").Request} req - 请求对象
   * @param {import("express").Response} res - 响应对象
   * @returns {Promise<void>}
   */
  router.get("/api/lounges", async (req, res) => {
    try {
      const { countryCode, cityCode, search, limit = 50 } = req.query;

      const filters = {};
      if (countryCode) filters.countryCode = countryCode;
      if (cityCode) filters.cityCode = cityCode;
      if (search) filters.search = search;

      const lounges = await resolveDb(req).getLounges(filters);
      const limitedLounges = lounges.slice(0, parseInt(limit));

      res.json({
        ok: true,
        data: limitedLounges,
        total: lounges.length,
        returned: limitedLounges.length,
        filters: filters,
      });
    } catch (error) {
      logger.error("get lounges failed", error && error.message);
      res.status(500).json({
        ok: false,
        error: "获取贵宾厅列表失败",
        details: error.message,
      });
    }
  });

  /**
   * 搜索贵宾厅列表。
   * @param {import("express").Request} req - 请求对象
   * @param {import("express").Response} res - 响应对象
   * @returns {Promise<void>}
   */
  router.get("/api/lounges/search", async (req, res) => {
    try {
      const { q: query, limit = 50 } = req.query;

      if (!query || query.trim().length < 1) {
        return res.status(400).json({
          ok: false,
          error: "搜索关键词不能为空",
        });
      }

      const lounges = await resolveDb(req).searchLounges(
        query.trim(),
        parseInt(limit)
      );

      res.json({
        ok: true,
        data: lounges,
        query: query.trim(),
        total: lounges.length,
      });
    } catch (error) {
      logger.error("search lounges failed", error && error.message);
      res.status(500).json({
        ok: false,
        error: "搜索贵宾厅失败",
        details: error.message,
      });
    }
  });

  /**
   * 获取单个贵宾厅详情。
   * @param {import("express").Request} req - 请求对象
   * @param {import("express").Response} res - 响应对象
   * @returns {Promise<void>}
   */
  router.get("/api/lounges/:loungeCode", async (req, res) => {
    try {
      const { loungeCode } = req.params;

      if (!loungeCode) {
        return res.status(400).json({
          ok: false,
          error: "贵宾厅代码不能为空",
        });
      }

      const lounges = await resolveDb(req).getLounges({
        search: loungeCode,
      });
      const lounge = lounges.find((l) => l.loungeCode === loungeCode);

      if (!lounge) {
        return res.status(404).json({
          ok: false,
          error: "未找到指定的贵宾厅",
        });
      }

      res.json({
        ok: true,
        data: lounge,
      });
    } catch (error) {
      logger.error("get lounge detail failed", error && error.message);
      res.status(500).json({
        ok: false,
        error: "获取贵宾厅详情失败",
        details: error.message,
      });
    }
  });

  return router;
}

module.exports = createLoungesRouter;
