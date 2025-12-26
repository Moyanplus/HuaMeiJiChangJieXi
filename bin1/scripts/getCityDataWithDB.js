const CityDataManager = require("../backend/cityDataManager");

/**
 * 获取所有城市数据的脚本（支持数据库存储）
 * 从API获取城市列表并保存到数据库和文件
 */

function parseArgJson() {
  const arg = process.argv.find((v) => v.startsWith("--json="));
  if (!arg) return null;
  const s = arg.slice("--json=".length);
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

async function getCityData() {
  const cityManager = new CityDataManager();

  try {
    console.log("🌍 开始获取城市数据...");
    console.log("=".repeat(50));

    // 使用城市数据管理器同步数据
    const result = await cityManager.syncCityData();

    console.log("");
    console.log("🏁 获取城市数据完成");
    console.log(`✅ 成功同步 ${result.totalCities} 个城市到数据库`);
    console.log(`📊 统计信息:`);
    console.log(`  🇨🇳 国内机场: ${result.domesticCount} 个`);
    console.log(`  🌍 国外机场: ${result.internationalCount} 个`);
    console.log(
      `  💾 数据库保存: 成功 ${result.saveResult.successCount} 条, 失败 ${result.saveResult.errorCount} 条`
    );
  } catch (error) {
    console.error("❌ 获取城市数据失败:", error.message);
    if (error.response) {
      console.error("响应状态:", error.response.status);
      console.error("响应数据:", error.response.data);
    }
    console.error("错误详情:", error);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    await cityManager.close();
  }
}

// 显示使用说明
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
获取城市数据脚本使用说明（数据库版本）:

基本用法:
  node getCityDataWithDB.js

功能特点:
  - 自动从API获取最新城市数据
  - 保存到SQLite数据库
  - 同时保存JSON和CSV文件作为备份
  - 记录同步日志和统计信息
  - 支持错误处理和重试

输出文件:
  - 数据库: vip_room.db (cities表)
  - cities.json: JSON格式的城市数据
  - cities.csv: CSV格式的城市数据

数据库表结构:
  - cities: 城市数据主表
  - city_sync_log: 同步日志表

示例:
  node getCityDataWithDB.js
`);
  process.exit(0);
}

// 运行获取城市数据
getCityData();
