#!/usr/bin/env node

/**
 * 华美机场解析系统 PM2 管理工具
 */

const { spawn } = require("child_process");
const path = require("path");

/**
 * PM2 生命周期命令处理器集合。
 */
const commands = {
  /**
   * 以生产模式启动应用。
   * @returns {void}
   */
  start: () => {
    console.log("🚀 启动华美机场解析系统...");
    const pm2Process = spawn(
      "pm2",
      ["start", "ecosystem.config.js", "--env", "production"],
      {
        cwd: __dirname,
        stdio: "inherit",
      }
    );

    pm2Process.on("exit", (code) => {
      if (code === 0) {
        console.log("✅ 应用启动成功！");
        console.log("📱 访问地址: http://localhost:8081/simple.html");
      } else {
        console.log("❌ 应用启动失败");
      }
      process.exit(code);
    });
  },

  /**
   * 停止应用。
   * @returns {void}
   */
  stop: () => {
    console.log("🛑 停止华美机场解析系统...");
    const pm2Process = spawn("pm2", ["stop", "huamei-airport-parser"], {
      cwd: __dirname,
      stdio: "inherit",
    });

    pm2Process.on("exit", (code) => {
      console.log(code === 0 ? "✅ 应用已停止" : "❌ 停止失败");
      process.exit(code);
    });
  },

  /**
   * 重启应用。
   * @returns {void}
   */
  restart: () => {
    console.log("🔄 重启华美机场解析系统...");
    const pm2Process = spawn("pm2", ["restart", "huamei-airport-parser"], {
      cwd: __dirname,
      stdio: "inherit",
    });

    pm2Process.on("exit", (code) => {
      console.log(code === 0 ? "✅ 应用重启成功" : "❌ 重启失败");
      process.exit(code);
    });
  },

  /**
   * 查看进程状态。
   * @returns {void}
   */
  status: () => {
    console.log("📊 查看应用状态...");
    const pm2Process = spawn("pm2", ["status"], {
      cwd: __dirname,
      stdio: "inherit",
    });

    pm2Process.on("exit", (code) => {
      process.exit(code);
    });
  },

  /**
   * 查看日志（非跟随）。
   * @returns {void}
   */
  logs: () => {
    console.log("📋 查看应用日志...");
    const pm2Process = spawn("pm2", ["logs", "huamei-airport-parser"], {
      cwd: __dirname,
      stdio: "inherit",
    });

    pm2Process.on("exit", (code) => {
      process.exit(code);
    });
  },

  /**
   * 实时跟随日志。
   * @returns {void}
   */
  logs_follow: () => {
    console.log("📋 查看实时日志...");
    const pm2Process = spawn(
      "pm2",
      ["logs", "huamei-airport-parser", "--follow"],
      {
        cwd: __dirname,
        stdio: "inherit",
      }
    );

    pm2Process.on("exit", (code) => {
      process.exit(code);
    });
  },

  /**
   * 删除应用进程。
   * @returns {void}
   */
  delete: () => {
    console.log("🗑️ 删除华美机场解析系统...");
    const pm2Process = spawn("pm2", ["delete", "huamei-airport-parser"], {
      cwd: __dirname,
      stdio: "inherit",
    });

    pm2Process.on("exit", (code) => {
      console.log(code === 0 ? "✅ 应用已删除" : "❌ 删除失败");
      process.exit(code);
    });
  },

  /**
   * 保存 PM2 配置快照。
   * @returns {void}
   */
  save: () => {
    console.log("💾 保存 PM2 配置...");
    const pm2Process = spawn("pm2", ["save"], {
      cwd: __dirname,
      stdio: "inherit",
    });

    pm2Process.on("exit", (code) => {
      console.log(code === 0 ? "✅ 配置已保存" : "❌ 保存失败");
      process.exit(code);
    });
  },

  /**
   * 设置开机自启。
   * @returns {void}
   */
  startup: () => {
    console.log("🔧 设置开机自启...");
    const pm2Process = spawn("pm2", ["startup"], {
      cwd: __dirname,
      stdio: "inherit",
    });

    pm2Process.on("exit", (code) => {
      console.log(code === 0 ? "✅ 开机自启已设置" : "❌ 设置失败");
      process.exit(code);
    });
  },

  /**
   * 输出帮助信息。
   * @returns {void}
   */
  help: () => {
    console.log(`
华美机场解析系统 PM2 管理工具

使用方法:
  node pm2-manage.js <命令>

可用命令:
  start         - 启动应用
  stop          - 停止应用
  restart       - 重启应用
  status        - 查看状态
  logs          - 查看日志
  logs_follow   - 查看实时日志
  delete        - 删除应用
  save          - 保存配置
  startup       - 设置开机自启
  help          - 显示此帮助信息

快速开始:
  node pm2-manage.js start     # 启动应用
  node pm2-manage.js status    # 查看状态
  node pm2-manage.js logs      # 查看日志

系统特性:
  - 自动重启
  - 日志管理
  - 内存监控
  - 开机自启
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
