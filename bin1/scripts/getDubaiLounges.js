const axios = require("axios");
const { encryptRequest, decryptResponse } = require("./cryptoUtils");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

/**
 * 迪拜国际机场贵宾厅数据获取脚本
 * 专门获取迪拜国际机场(DXB)的贵宾厅信息
 */

// 迪拜国际机场信息
const DUBAI_AIRPORT = {
  siteCode: "ZD13144",
  cityName: "迪拜",
  cityCode: "AREDU",
  cityEnName: "Dubai",
  siteName: "迪拜国际机场",
  siteEnName: "Dubai International Airport",
  countryCode: "ARE",
  countryName: "阿联酋",
  countryEnName: "United Arab Emirates",
  siteType: "1",
};

// 配置参数
const CONFIG = {
  REQUEST_DELAY: 1000, // 请求间延迟(毫秒)
  RETRY_ATTEMPTS: 3, // 重试次数
  TIMEOUT: 15000, // 请求超时时间
  PAGE_SIZE: 10, // 每页数量 (减小页面大小，确保能获取到所有数据)
  MAX_PAGES: 20, // 最大页数限制
};

// 统计信息
const stats = {
  startTime: Date.now(),
  domesticLounges: 0,
  internationalLounges: 0,
  totalLounges: 0,
  success: false,
  error: null,
};

// 获取迪拜机场的贵宾厅数据（带重试机制）
async function getDubaiLoungeData(
  domesticForeign = "1",
  page = 1,
  retryCount = 0
) {
  try {
    console.log(
      `🔍 正在获取迪拜机场${
        domesticForeign === "1" ? "国内" : "国际"
      }贵宾厅数据 (第${page}页)...`
    );

    // 构建请求数据
    const requestData = {
      serviceId: "5476",
      domesticForeign: domesticForeign,
      continentType: "",
      countryCode: DUBAI_AIRPORT.countryCode,
      cityCode: DUBAI_AIRPORT.cityCode,
      siteCode: DUBAI_AIRPORT.siteCode,
      page: page,
      size: CONFIG.PAGE_SIZE,
      loungeType: "1,2,3", // 所有类型的贵宾厅
      sdTimestamp: Date.now(),
    };

    console.log(`📋 请求参数:`, JSON.stringify(requestData, null, 2));

    // 加密请求数据
    const sdData = encryptRequest(requestData);

    // 发送请求
    const url =
      "https://h5.schengle.com/ShengDaHXZHJSJHD/bespeak/VipHall/vipHallList";
    const response = await axios.post(
      url,
      { sdData },
      {
        headers: {
          referer: "https://h5.schengle.com/ShengDaHXZHJSJ/",
          "user-agent":
            "Mozilla/5.0 (Linux; Android 13; 23046RP50C Build/TKQ1.221114.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.180 Safari/537.36 XWEB/1380187 MMWEBSDK/20250201 MMWEBID/911 MicroMessenger/8.0.60.2860(0x28003C55) WeChat/arm64 Weixin Android Tablet NetType/WIFI Language/zh_CN ABI/arm64",
        },
        timeout: CONFIG.TIMEOUT,
      }
    );

    // 处理响应数据
    let data = response && response.data;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch (e) {
        throw new Error("响应数据不是有效的JSON格式");
      }
    }

    // 解密响应数据
    if (data && data.sdData) {
      try {
        const decrypted = decryptResponse(data);
        if (decrypted && decrypted.data) {
          let loungeData = decrypted.data;

          if (typeof loungeData === "string") {
            try {
              loungeData = JSON.parse(loungeData);
            } catch (e) {
              throw new Error("无法解析data字段为JSON");
            }
          }

          if (Array.isArray(loungeData)) {
            return loungeData.map((lounge) => ({
              ...lounge,
              airportSiteCode: DUBAI_AIRPORT.siteCode,
              airportSiteName: DUBAI_AIRPORT.siteName,
              airportCityName: DUBAI_AIRPORT.cityName,
              airportCountryName: DUBAI_AIRPORT.countryName,
              domesticForeign: domesticForeign === "1" ? "国内" : "国际",
            }));
          }
        }
      } catch (decryptError) {
        throw new Error(`解密失败: ${decryptError.message}`);
      }
    }

    return [];
  } catch (error) {
    // 重试机制
    if (retryCount < CONFIG.RETRY_ATTEMPTS) {
      console.log(
        `🔄 请求失败，正在重试 (${retryCount + 1}/${CONFIG.RETRY_ATTEMPTS})...`
      );
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * (retryCount + 1))
      );
      return getDubaiLoungeData(domesticForeign, page, retryCount + 1);
    }
    throw error;
  }
}

// 获取所有页面的贵宾厅数据
async function getAllPagesLounges(domesticForeign) {
  const allLounges = [];
  let page = 1;
  let hasMore = true;
  let totalPages = 0;
  let consecutiveEmptyPages = 0; // 连续空页面计数

  console.log(
    `\n🔍 开始获取${domesticForeign === "1" ? "国内" : "国际"}贵宾厅数据...`
  );

  while (hasMore && page <= CONFIG.MAX_PAGES) {
    try {
      console.log(`📄 正在获取第${page}页数据...`);
      const lounges = await getDubaiLoungeData(domesticForeign, page);

      if (lounges.length === 0) {
        consecutiveEmptyPages++;
        console.log(
          `ℹ️ 第${page}页: 没有数据 (连续空页: ${consecutiveEmptyPages})`
        );

        // 如果连续3页都没有数据，停止获取
        if (consecutiveEmptyPages >= 2) {
          console.log(`🛑 连续${consecutiveEmptyPages}页无数据，停止获取`);
          hasMore = false;
        } else {
          page++;
          // 请求间延迟
          await new Promise((resolve) =>
            setTimeout(resolve, CONFIG.REQUEST_DELAY)
          );
        }
      } else {
        allLounges.push(...lounges);
        totalPages = page;
        consecutiveEmptyPages = 0; // 重置空页面计数
        console.log(
          `✅ 第${page}页: 获取到 ${lounges.length} 个贵宾厅 (累计: ${allLounges.length} 个)`
        );

        // 如果返回的数据少于页面大小，说明可能是最后一页，但继续尝试下一页
        if (lounges.length < CONFIG.PAGE_SIZE) {
          console.log(
            `📋 第${page}页数据不足${CONFIG.PAGE_SIZE}个，但继续尝试下一页...`
          );
        }

        page++;
        // 请求间延迟
        await new Promise((resolve) =>
          setTimeout(resolve, CONFIG.REQUEST_DELAY)
        );
      }
    } catch (error) {
      console.error(`❌ 获取第${page}页失败:`, error.message);
      consecutiveEmptyPages++;

      // 如果连续3页都出错，停止获取
      if (consecutiveEmptyPages >= 2) {
        console.log(`🛑 连续${consecutiveEmptyPages}页出错，停止获取`);
        hasMore = false;
      } else {
        console.log(`🔄 继续尝试下一页...`);
        page++;
        // 请求间延迟
        await new Promise((resolve) =>
          setTimeout(resolve, CONFIG.REQUEST_DELAY)
        );
      }
    }
  }

  if (page > CONFIG.MAX_PAGES) {
    console.log(`⚠️ 已达到最大页数限制 (${CONFIG.MAX_PAGES}页)`);
  }

  console.log(
    `📊 ${
      domesticForeign === "1" ? "国内" : "国际"
    }贵宾厅获取完成: 共${totalPages}页, ${allLounges.length}个贵宾厅`
  );
  return allLounges;
}

// 主函数：获取迪拜机场所有贵宾厅数据
async function getDubaiAirportLounges() {
  try {
    console.log("🚀 开始获取迪拜国际机场贵宾厅数据...");
    console.log("=".repeat(60));
    console.log(
      `🏛️ 机场信息: ${DUBAI_AIRPORT.siteName} (${DUBAI_AIRPORT.siteCode})`
    );
    console.log(
      `🌍 国家: ${DUBAI_AIRPORT.countryName} (${DUBAI_AIRPORT.countryCode})`
    );
    console.log(
      `🏙️ 城市: ${DUBAI_AIRPORT.cityName} (${DUBAI_AIRPORT.cityCode})`
    );
    console.log("=".repeat(60));

    // 并发获取国内和国际贵宾厅
    console.log("\n📋 开始获取贵宾厅数据...");
    const [domesticLounges, internationalLounges] = await Promise.all([
      getAllPagesLounges("1"), // 国内贵宾厅
      getAllPagesLounges("2"), // 国际贵宾厅
    ]);

    // 更新统计信息
    stats.domesticLounges = domesticLounges.length;
    stats.internationalLounges = internationalLounges.length;
    stats.totalLounges = domesticLounges.length + internationalLounges.length;
    stats.success = true;

    // 合并所有贵宾厅数据
    const allLounges = [...domesticLounges, ...internationalLounges];

    console.log("\n" + "=".repeat(60));
    console.log("📊 获取结果统计:");
    console.log(`🏠 国内贵宾厅: ${stats.domesticLounges} 个`);
    console.log(`🌍 国际贵宾厅: ${stats.internationalLounges} 个`);
    console.log(`📈 总计贵宾厅: ${stats.totalLounges} 个`);

    const totalTime = Math.round((Date.now() - stats.startTime) / 1000);
    console.log(`⏱️ 总耗时: ${totalTime}秒`);

    if (allLounges.length > 0) {
      // 保存数据到文件
      await saveDubaiLoungesToFiles(allLounges);
      console.log("\n✅ 迪拜国际机场贵宾厅数据获取完成！");
    } else {
      console.log("\n⚠️ 未获取到任何贵宾厅数据");
    }
  } catch (error) {
    stats.error = error.message;
    console.error("\n❌ 获取迪拜机场贵宾厅数据失败:", error.message);
    console.error("错误详情:", error);
  }
}

// 保存迪拜机场贵宾厅数据到文件
async function saveDubaiLoungesToFiles(lounges) {
  const outputDir = path.join(__dirname);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

  // 保存JSON格式
  const jsonFile = path.join(outputDir, `dubai-lounges-${timestamp}.json`);
  fs.writeFileSync(jsonFile, JSON.stringify(lounges, null, 2), "utf8");
  console.log(`\n💾 JSON数据已保存到: ${jsonFile}`);

  // 保存CSV格式
  const csvFile = path.join(outputDir, `dubai-lounges-${timestamp}.csv`);
  const csvHeader =
    "loungeCode,loungeName,cityName,cityCode,cityEnName,countryCode,countryName,countryEnName,siteName,siteCode,siteType,terminalName,terminalCode,businessHours,deductPoints,loungeType,domesticForeign,address,latitude,longitude,serviceName,airportSiteCode,airportSiteName,airportCityName,airportCountryName\n";

  let csvData = "";
  for (const lounge of lounges) {
    const row =
      [
        lounge.loungeCode || "",
        lounge.loungeName || "",
        lounge.cityName || "",
        lounge.cityCode || "",
        lounge.cityEnName || "",
        lounge.countryCode || "",
        lounge.countryName || "",
        lounge.countryEnName || "",
        lounge.siteName || "",
        lounge.siteCode || "",
        lounge.siteType || "",
        lounge.terminalName || "",
        lounge.terminalCode || "",
        lounge.businessHours || "",
        lounge.deductPoints || "",
        lounge.loungeType || "",
        lounge.domesticForeign || "",
        lounge.address || "",
        lounge.latitude || "",
        lounge.longitude || "",
        lounge.serviceName || "",
        lounge.airportSiteCode || "",
        lounge.airportSiteName || "",
        lounge.airportCityName || "",
        lounge.airportCountryName || "",
      ]
        .map((field) => `"${field}"`)
        .join(",") + "\n";
    csvData += row;
  }

  fs.writeFileSync(csvFile, csvHeader + csvData, "utf8");
  console.log(`💾 CSV数据已保存到: ${csvFile}`);

  // 保存Excel格式
  const excelFile = path.join(outputDir, `dubai-lounges-${timestamp}.xlsx`);
  const worksheet = XLSX.utils.json_to_sheet(lounges);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "迪拜机场贵宾厅");
  XLSX.writeFile(workbook, excelFile);
  console.log(`💾 Excel数据已保存到: ${excelFile}`);

  // 创建贵宾厅代码列表
  const loungeCodes = lounges.map((lounge) => ({
    loungeCode: lounge.loungeCode,
    loungeName: lounge.loungeName,
    terminalName: lounge.terminalName,
    terminalCode: lounge.terminalCode,
    businessHours: lounge.businessHours,
    deductPoints: lounge.deductPoints,
    loungeType: lounge.loungeType,
    domesticForeign: lounge.domesticForeign,
    address: lounge.address,
  }));

  const codesFile = path.join(
    outputDir,
    `dubai-lounge-codes-${timestamp}.json`
  );
  fs.writeFileSync(codesFile, JSON.stringify(loungeCodes, null, 2), "utf8");
  console.log(`💾 贵宾厅代码列表已保存到: ${codesFile}`);

  // 保存贵宾厅代码Excel
  const codesExcelFile = path.join(
    outputDir,
    `dubai-lounge-codes-${timestamp}.xlsx`
  );
  const codesWorksheet = XLSX.utils.json_to_sheet(loungeCodes);
  const codesWorkbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(codesWorkbook, codesWorksheet, "迪拜贵宾厅代码");
  XLSX.writeFile(codesWorkbook, codesExcelFile);
  console.log(`💾 贵宾厅代码Excel已保存到: ${codesExcelFile}`);

  console.log("\n📋 文件保存完成:");
  console.log(`  - ${jsonFile}`);
  console.log(`  - ${csvFile}`);
  console.log(`  - ${excelFile}`);
  console.log(`  - ${codesFile}`);
  console.log(`  - ${codesExcelFile}`);

  // 显示贵宾厅详情
  console.log("\n🏛️ 迪拜国际机场贵宾厅详情:");
  lounges.forEach((lounge, index) => {
    console.log(`\n${index + 1}. ${lounge.loungeName || "未知贵宾厅"}`);
    console.log(`   📍 代码: ${lounge.loungeCode || "未知"}`);
    console.log(
      `   🏢 航站楼: ${lounge.terminalName || "未知"} (${
        lounge.terminalCode || "未知"
      })`
    );
    console.log(`   🌍 类型: ${lounge.domesticForeign || "未知"}`);
    console.log(`   ⏰ 营业时间: ${lounge.businessHours || "未知"}`);
    console.log(`   💰 积分: ${lounge.deductPoints || "未知"}`);
    console.log(`   📍 地址: ${lounge.address || "未知"}`);
  });
}

// 显示使用说明
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
迪拜国际机场贵宾厅数据获取脚本使用说明:

基本用法:
  node getDubaiLounges.js

功能特性:
  - 专门获取迪拜国际机场(DXB)的贵宾厅数据
  - 同时获取国内和国际贵宾厅
  - 支持分页获取，确保数据完整性
  - 自动重试机制，提高成功率
  - 多种格式输出(JSON, CSV, Excel)

输出文件:
  - dubai-lounges-{timestamp}.json     完整贵宾厅数据(JSON格式)
  - dubai-lounges-{timestamp}.csv      完整贵宾厅数据(CSV格式)
  - dubai-lounges-{timestamp}.xlsx     完整贵宾厅数据(Excel格式)
  - dubai-lounge-codes-{timestamp}.json 贵宾厅代码列表(JSON格式)
  - dubai-lounge-codes-{timestamp}.xlsx 贵宾厅代码列表(Excel格式)

机场信息:
  - 机场名称: 迪拜国际机场 (Dubai International Airport)
  - 机场代码: ZD13144
  - 城市代码: AREDU
  - 国家代码: ARE (阿联酋)

  --help, -h         显示此帮助信息
`);
  process.exit(0);
}

// 运行脚本
console.log("🏛️ 迪拜国际机场贵宾厅数据获取工具");
console.log("=".repeat(60));
getDubaiAirportLounges();
