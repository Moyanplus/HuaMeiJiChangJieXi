const fs = require("fs");
const path = require("path");
const VipRoomDatabase = require("../src/core/database");

/**
 * 导入贵宾厅数据到数据库。
 * @returns {Promise<void>}
 */

async function importLounges() {
  try {
    console.log("🏛️ 开始导入贵宾厅数据到数据库...");
    console.log("=".repeat(50));

    // 读取贵宾厅数据文件
    const loungeDataPath = path.join(__dirname, "../../BIN/lounges.json");

    if (!fs.existsSync(loungeDataPath)) {
      console.error("❌ 贵宾厅数据文件不存在:", loungeDataPath);
      console.log(
        "请先运行 getAllLounges.js 或 getDomesticLounges.js 生成数据文件"
      );
      process.exit(1);
    }

    console.log("📖 读取贵宾厅数据文件...");
    const loungeData = JSON.parse(fs.readFileSync(loungeDataPath, "utf8"));
    console.log(`✅ 读取到 ${loungeData.length} 条贵宾厅数据`);

    // 初始化数据库
    console.log("🔗 连接数据库...");
    const db = new VipRoomDatabase();
    await db.init();

    // 保存贵宾厅数据
    console.log("💾 保存贵宾厅数据到数据库...");
    const result = await db.saveLounges(loungeData);

    console.log("📊 导入结果统计:");
    console.log(`✅ 成功导入: ${result.successCount} 条`);
    console.log(`❌ 失败导入: ${result.errorCount} 条`);
    console.log(`📋 总计处理: ${result.total} 条`);

    // 记录同步日志
    const today = new Date().toISOString().split("T")[0];
    const domesticCount = loungeData.filter(
      (l) => l.countryCode === "CN"
    ).length;
    const internationalCount = loungeData.length - domesticCount;

    await db.saveLoungeSyncLog({
      syncDate: today,
      totalLounges: loungeData.length,
      domesticCount: domesticCount,
      internationalCount: internationalCount,
      syncStatus: "success",
      errorMessage:
        result.errorCount > 0 ? `${result.errorCount} 条数据导入失败` : null,
    });

    console.log("✅ 贵宾厅数据导入完成");
    console.log("📝 同步日志已记录");

    // 关闭数据库连接
    db.close();
  } catch (error) {
    console.error("❌ 导入贵宾厅数据失败:", error.message);
    console.error("错误详情:", error);
    process.exit(1);
  }
}

// 显示使用说明
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
导入贵宾厅数据到数据库脚本使用说明:

基本用法:
  node importLounges.js

功能:
  - 读取 domestic-lounges.json 文件
  - 将贵宾厅数据导入到数据库
  - 记录同步日志
  - 支持事务处理确保数据一致性

前置条件:
  - 需要先运行 getDomesticLounges.js 生成数据文件
  - 数据库表结构需要已创建

输出:
  - 在数据库中创建 lounges 表记录
  - 在 lounge_sync_log 表中记录同步日志

  --help, -h         显示此帮助信息
`);
  process.exit(0);
}

// 运行导入脚本
importLounges();
