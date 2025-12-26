const { spawn } = require("child_process");
const path = require("path");

/**
 * 启动脚本 - 同时启动服务器和定时任务调度器
 */

console.log("🚀 启动华美机场解析系统...");
console.log("=".repeat(50));

// 启动服务器
console.log("📡 启动Web服务器...");
const serverProcess = spawn("node", ["../src/api/server.js"], {
  cwd: __dirname,
  stdio: "inherit",
});

// 等待服务器启动
setTimeout(() => {
  console.log("⏰ 启动定时任务调度器...");

  // 启动定时任务调度器
  const schedulerProcess = spawn(
    "node",
    ["../src/utils/scheduler.js", "start"],
    {
      cwd: __dirname,
      stdio: "inherit",
    }
  );

  // 处理进程退出
  /**
   * 清理子进程并退出。
   * @returns {void}
   */
  const cleanup = () => {
    console.log("\n🛑 正在关闭系统...");

    if (schedulerProcess && !schedulerProcess.killed) {
      schedulerProcess.kill("SIGTERM");
    }

    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill("SIGTERM");
    }

    setTimeout(() => {
      process.exit(0);
    }, 2000);
  };

  // 监听退出信号
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  // 监听子进程退出
  serverProcess.on("exit", (code) => {
    console.log(`Web服务器退出，代码: ${code}`);
    cleanup();
  });

  schedulerProcess.on("exit", (code) => {
    console.log(`定时任务调度器退出，代码: ${code}`);
    cleanup();
  });
}, 3000); // 等待3秒让服务器完全启动

console.log("✅ 系统启动完成");
console.log("📱 访问地址: http://localhost:3000/simple.html");
console.log("⏰ 定时任务: 每天凌晨2点自动同步城市数据");
console.log("🛑 按 Ctrl+C 停止系统");
