#!/usr/bin/env node

/**
 * 华美机场解析系统主入口
 * 提供统一的启动和管理接口
 */

const { spawn } = require("child_process");
const path = require("path");

/**
 * CLI 命令处理器集合。
 */
const commands = {
  /**
   * 启动 HTTP 服务进程。
   * @returns {void}
   */
  start: () => {
    console.log("🚀 启动Web服务器...");
    const serverProcess = spawn("node", ["src/api/server.js"], {
      cwd: __dirname,
      stdio: "inherit",
    });

    serverProcess.on("exit", (code) => {
      console.log(`服务器退出，代码: ${code}`);
      process.exit(code);
    });
  },

  /**
   * 启动服务 + 定时任务。
   * @returns {void}
   */
  dev: () => {
    console.log("🚀 启动完整系统...");
    const systemProcess = spawn("node", ["scripts/startWithScheduler.js"], {
      cwd: __dirname,
      stdio: "inherit",
    });

    systemProcess.on("exit", (code) => {
      console.log(`系统退出，代码: ${code}`);
      process.exit(code);
    });
  },

  /**
   * 执行一次城市数据同步。
   * @returns {void}
   */
  sync: () => {
    console.log("🌍 手动同步城市数据...");
    const syncProcess = spawn("node", ["src/services/syncCityData.js"], {
      cwd: __dirname,
      stdio: "inherit",
    });

    syncProcess.on("exit", (code) => {
      process.exit(code);
    });
  },

  /**
   * 委托到管理脚本处理。
   * @returns {void}
   */
  manage: () => {
    const manageProcess = spawn(
      "node",
      ["scripts/manage.js", ...process.argv.slice(2)],
      {
        cwd: __dirname,
        stdio: "inherit",
      }
    );

    manageProcess.on("exit", (code) => {
      process.exit(code);
    });
  },

  /**
   * 输出 CLI 帮助信息。
   * @returns {void}
   */
  help: () => {
    console.log(`
华美机场解析系统

使用方法:
  node index.js <命令> [参数]

可用命令:
  start       - 启动Web服务器
  dev         - 启动完整系统（服务器+定时任务）
  sync        - 手动同步城市数据
  manage      - 系统管理工具
  help        - 显示此帮助信息

管理工具命令:
  node index.js manage install     - 安装依赖
  node index.js manage sync        - 手动同步数据
  node index.js manage start       - 启动服务器
  node index.js manage startFull   - 启动完整系统
  node index.js manage scheduler   - 启动定时任务
  node index.js manage status      - 查看状态
  node index.js manage stop        - 停止定时任务
  node index.js manage logs        - 查看日志
  node index.js manage clean       - 清理日志

快速开始:
  npm install                      # 安装依赖
  npm run dev                      # 启动完整系统
  npm run sync-cities              # 手动同步城市数据

系统特性:
  - 每天凌晨2点自动同步城市数据
  - 支持手动同步和API接口
  - 完整的日志记录和错误处理
  - 优雅的进程管理和关闭
    `);
  },
};

// 获取命令参数
const command = process.argv[2] || "help";

if (commands[command]) {
  commands[command]();
} else {
  console.log(`❌ 未知命令: ${command}`);
  commands.help();
  process.exit(1);
}
