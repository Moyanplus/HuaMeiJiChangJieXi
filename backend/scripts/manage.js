#!/usr/bin/env node

/**
 * 系统管理脚本
 * 用于管理城市数据同步和定时任务
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

/**
 * 管理命令集合。
 */
const commands = {
  /**
   * 安装依赖。
   * @returns {void}
   */
  install: () => {
    console.log("📦 安装依赖包...");
    try {
      execSync("npm install", { cwd: __dirname, stdio: "inherit" });
      console.log("✅ 依赖安装完成");
    } catch (error) {
      console.error("❌ 依赖安装失败:", error.message);
      process.exit(1);
    }
  },

  /**
   * 手动同步城市数据。
   * @returns {void}
   */
  sync: () => {
    console.log("🌍 手动同步城市数据...");
    try {
      execSync("node ../src/services/syncCityData.js", {
        cwd: __dirname,
        stdio: "inherit",
      });
      console.log("✅ 城市数据同步完成");
    } catch (error) {
      console.error("❌ 城市数据同步失败:", error.message);
      process.exit(1);
    }
  },

  /**
   * 启动服务器（不包含定时任务）。
   * @returns {void}
   */
  start: () => {
    console.log("🚀 启动Web服务器...");
    try {
      execSync("node ../src/api/server.js", {
        cwd: __dirname,
        stdio: "inherit",
      });
    } catch (error) {
      console.error("❌ 服务器启动失败:", error.message);
      process.exit(1);
    }
  },

  /**
   * 启动完整系统（服务器+定时任务）。
   * @returns {void}
   */
  startFull: () => {
    console.log("🚀 启动完整系统...");
    try {
      execSync("node startWithScheduler.js", {
        cwd: __dirname,
        stdio: "inherit",
      });
    } catch (error) {
      console.error("❌ 系统启动失败:", error.message);
      process.exit(1);
    }
  },

  /**
   * 启动定时任务调度器。
   * @returns {void}
   */
  scheduler: () => {
    console.log("⏰ 启动定时任务调度器...");
    try {
      execSync("node ../src/utils/scheduler.js start", {
        cwd: __dirname,
        stdio: "inherit",
      });
    } catch (error) {
      console.error("❌ 定时任务启动失败:", error.message);
      process.exit(1);
    }
  },

  /**
   * 查看定时任务状态。
   * @returns {void}
   */
  status: () => {
    console.log("📊 查看系统状态...");
    try {
      execSync("node ../src/utils/scheduler.js status", {
        cwd: __dirname,
        stdio: "inherit",
      });
    } catch (error) {
      console.error("❌ 获取状态失败:", error.message);
      process.exit(1);
    }
  },

  /**
   * 停止定时任务。
   * @returns {void}
   */
  stop: () => {
    console.log("🛑 停止定时任务...");
    try {
      execSync("node ../src/utils/scheduler.js stop", {
        cwd: __dirname,
        stdio: "inherit",
      });
      console.log("✅ 定时任务已停止");
    } catch (error) {
      console.error("❌ 停止定时任务失败:", error.message);
      process.exit(1);
    }
  },

  /**
   * 查看日志。
   * @returns {void}
   */
  logs: () => {
    const logFile = path.join(__dirname, "..", "logs", "scheduler.log");
    if (fs.existsSync(logFile)) {
      console.log("📋 定时任务日志:");
      console.log("=".repeat(50));
      const logs = fs.readFileSync(logFile, "utf8");
      console.log(logs);
    } else {
      console.log("📋 暂无日志文件");
    }
  },

  /**
   * 清理日志。
   * @returns {void}
   */
  clean: () => {
    const logFile = path.join(__dirname, "..", "logs", "scheduler.log");
    if (fs.existsSync(logFile)) {
      fs.unlinkSync(logFile);
      console.log("✅ 日志文件已清理");
    } else {
      console.log("📋 无需清理，日志文件不存在");
    }
  },

  /**
   * 显示帮助信息。
   * @returns {void}
   */
  help: () => {
    console.log(`
华美机场解析系统管理工具

使用方法:
  node manage.js <命令>

可用命令:
  install     - 安装依赖包
  sync        - 手动同步城市数据
  start       - 启动Web服务器（不含定时任务）
  startFull   - 启动完整系统（服务器+定时任务）
  scheduler   - 启动定时任务调度器
  status      - 查看定时任务状态
  stop        - 停止定时任务
  logs        - 查看定时任务日志
  clean       - 清理日志文件
  help        - 显示此帮助信息

定时任务配置:
  - 城市数据同步: 每天凌晨2点执行
  - 时区: Asia/Shanghai
  - 日志文件: scheduler.log

API接口:
  GET  /api/cities              - 获取所有城市数据
  GET  /api/cities/search       - 搜索城市数据
  POST /api/cities/sync         - 手动同步城市数据
  GET  /api/cities/sync-logs    - 获取同步日志

示例:
  node manage.js install        # 安装依赖
  node manage.js sync           # 手动同步数据
  node manage.js startFull      # 启动完整系统
  node manage.js status         # 查看状态
    `);
  },
};

// 获取命令参数
const command = process.argv[2];

if (!command || !commands[command]) {
  console.log("❌ 无效的命令");
  commands.help();
  process.exit(1);
}

// 执行命令
commands[command]();
