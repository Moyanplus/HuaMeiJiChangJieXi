const axios = require("axios");
const { encryptRequest, decryptResponse } = require("./cryptoUtils");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

/**
 * 多线程优化版本 - 获取所有机场贵宾厅数据的脚本
 * 使用并发处理大幅提升处理速度
 */

// 并发控制配置
const CONFIG = {
  MAX_CONCURRENT: 20, // 最大并发数
  BATCH_SIZE: 180, // 批处理大小
  REQUEST_DELAY: 100, // 请求间延迟(毫秒)
  RETRY_ATTEMPTS: 3, // 重试次数
  TIMEOUT: 15000, // 请求超时时间
};

// 统计信息
const stats = {
  total: 0,
  processed: 0,
  success: 0,
  failed: 0,
  startTime: Date.now(),
  lounges: 0,
};

// 读取cities.csv文件
function readCitiesData() {
  const csvPath = path.join(__dirname, "../data/cities.csv");
  const csvContent = fs.readFileSync(csvPath, "utf8");
  const lines = csvContent.split("\n");

  const cities = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      const columns = line.split(",");
      if (columns.length >= 10) {
        cities.push({
          siteCode: columns[0].replace(/"/g, ""),
          cityName: columns[1].replace(/"/g, ""),
          cityCode: columns[2].replace(/"/g, ""),
          cityEnName: columns[3].replace(/"/g, ""),
          siteName: columns[4].replace(/"/g, ""),
          siteEnName: columns[5].replace(/"/g, ""),
          countryCode: columns[6].replace(/"/g, ""),
          countryName: columns[7].replace(/"/g, ""),
          countryEnName: columns[8].replace(/"/g, ""),
          siteType: columns[9].replace(/"/g, ""),
        });
      }
    }
  }

  return cities;
}

// 获取单个机场的贵宾厅数据（带重试机制）
async function getLoungeDataForAirport(
  airport,
  page = 1,
  size = 10,
  retryCount = 0
) {
  try {
    // 构建请求数据
    const requestData = {
      serviceId: "5476",
      domesticForeign: airport.domesticForeign || "1",
      continentType: "",
      countryCode: airport.countryCode,
      cityCode: airport.cityCode,
      siteCode: airport.siteCode,
      page: page,
      size: size,
      loungeType: "1,2,3",
      sdTimestamp: Date.now(),
    };

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
              airportSiteCode: airport.siteCode,
              airportSiteName: airport.siteName,
              airportCityName: airport.cityName,
              airportCountryName: airport.countryName,
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
        `🔄 ${airport.siteName} 请求失败，正在重试 (${retryCount + 1}/${
          CONFIG.RETRY_ATTEMPTS
        })...`
      );
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * (retryCount + 1))
      ); // 递增延迟
      return getLoungeDataForAirport(airport, page, size, retryCount + 1);
    }
    throw error;
  }
}

// 获取所有页面的贵宾厅数据
async function getAllPagesForAirport(airport, domesticForeign) {
  const allLounges = [];
  let page = 1;
  let hasMore = true;
  let consecutiveEmptyPages = 0;

  while (hasMore && page <= 5) {
    // 最多获取5页
    try {
      const lounges = await getLoungeDataForAirport(
        { ...airport, domesticForeign },
        page,
        CONFIG.BATCH_SIZE
      );

      if (lounges.length === 0) {
        consecutiveEmptyPages++;
        if (consecutiveEmptyPages >= 2) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        allLounges.push(...lounges);
        consecutiveEmptyPages = 0;
        console.log(
          `📄 ${airport.siteName} ${
            domesticForeign === "1" ? "国内" : "国际"
          } 第${page}页: ${lounges.length}个贵宾厅`
        );
        page++;
      }
    } catch (error) {
      console.error(
        `❌ ${airport.siteName} 第${page}页获取失败:`,
        error.message
      );
      consecutiveEmptyPages++;
      if (consecutiveEmptyPages >= 2) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  return allLounges;
}

// 处理单个机场（获取国内和境外贵宾厅）
async function processAirport(airport) {
  try {
    const results = [];

    // 并发获取国内和境外贵宾厅（支持分页）
    const [domesticLounges, internationalLounges] = await Promise.all([
      getAllPagesForAirport(airport, "1"),
      getAllPagesForAirport(airport, "2"),
    ]);

    results.push(...domesticLounges, ...internationalLounges);

    stats.success++;
    stats.lounges += results.length;

    return {
      airport,
      lounges: results,
      success: true,
      error: null,
    };
  } catch (error) {
    stats.failed++;
    return {
      airport,
      lounges: [],
      success: false,
      error: error.message,
    };
  }
}

// 并发控制函数
async function processBatch(airports) {
  const semaphore = new Array(CONFIG.MAX_CONCURRENT).fill(null);
  const results = [];

  const processWithSemaphore = async (airport) => {
    const index = semaphore.findIndex((slot) => slot === null);
    if (index === -1) {
      // 等待可用槽位
      await new Promise((resolve) => {
        const checkSlot = () => {
          const availableIndex = semaphore.findIndex((slot) => slot === null);
          if (availableIndex !== -1) {
            resolve(availableIndex);
          } else {
            setTimeout(checkSlot, 50);
          }
        };
        checkSlot();
      });
    }

    const slotIndex = semaphore.findIndex((slot) => slot === null);
    semaphore[slotIndex] = airport.siteCode;

    try {
      const result = await processAirport(airport);
      return result;
    } finally {
      semaphore[slotIndex] = null;
    }
  };

  // 并发处理所有机场
  const promises = airports.map((airport) => processWithSemaphore(airport));
  const batchResults = await Promise.all(promises);

  return batchResults;
}

// 显示进度
function showProgress() {
  const elapsed = Math.round((Date.now() - stats.startTime) / 1000);
  const rate = stats.processed > 0 ? Math.round(stats.processed / elapsed) : 0;
  const remaining = stats.total - stats.processed;
  const eta = rate > 0 ? Math.round(remaining / rate) : 0;

  console.log(
    `\n📊 进度: ${stats.processed}/${stats.total} (${Math.round(
      (stats.processed / stats.total) * 100
    )}%) | 成功: ${stats.success} | 失败: ${stats.failed} | 贵宾厅: ${
      stats.lounges
    } | 耗时: ${elapsed}s | 速度: ${rate}/s | 预计剩余: ${eta}s`
  );
}

// 获取所有机场的贵宾厅数据（多线程版本）
async function getAllLounges() {
  try {
    console.log("🚀 开始多线程获取所有机场的贵宾厅数据...");
    console.log(
      `⚙️ 配置: 最大并发=${CONFIG.MAX_CONCURRENT}, 批处理=${CONFIG.BATCH_SIZE}, 延迟=${CONFIG.REQUEST_DELAY}ms`
    );
    console.log("=".repeat(80));

    // 读取机场数据
    console.log("📖 读取机场数据...");
    const cities = readCitiesData();
    console.log(`✅ 共读取到 ${cities.length} 个机场`);

    // 去重处理
    const uniqueAirports = [];
    const seenCodes = new Set();
    for (const airport of cities) {
      if (!seenCodes.has(airport.siteCode)) {
        seenCodes.add(airport.siteCode);
        uniqueAirports.push(airport);
      }
    }

    stats.total = uniqueAirports.length;
    console.log(`🔄 去重后机场数量: ${uniqueAirports.length} 个`);
    console.log("");

    const allLounges = [];
    const allResults = [];

    // 分批处理
    for (let i = 0; i < uniqueAirports.length; i += CONFIG.BATCH_SIZE) {
      const batch = uniqueAirports.slice(i, i + CONFIG.BATCH_SIZE);
      const batchNumber = Math.floor(i / CONFIG.BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(uniqueAirports.length / CONFIG.BATCH_SIZE);

      console.log(
        `\n🔄 处理批次 ${batchNumber}/${totalBatches} (${batch.length} 个机场)...`
      );

      const batchResults = await processBatch(batch);
      allResults.push(...batchResults);

      // 更新统计
      stats.processed += batch.length;

      // 收集贵宾厅数据
      for (const result of batchResults) {
        if (result.success && result.lounges.length > 0) {
          allLounges.push(...result.lounges);
          console.log(
            `✅ ${result.airport.siteName}: ${result.lounges.length} 个贵宾厅`
          );
        } else if (result.success) {
          console.log(`ℹ️ ${result.airport.siteName}: 暂无贵宾厅数据`);
        } else {
          console.log(`❌ ${result.airport.siteName}: ${result.error}`);
        }
      }

      // 显示进度
      showProgress();

      // 批次间延迟
      if (i + CONFIG.BATCH_SIZE < uniqueAirports.length) {
        await new Promise((resolve) =>
          setTimeout(resolve, CONFIG.REQUEST_DELAY)
        );
      }
    }

    console.log("\n" + "=".repeat(80));
    console.log("📊 最终统计:");
    console.log(`✅ 成功处理机场: ${stats.success} 个`);
    console.log(`❌ 失败处理机场: ${stats.failed} 个`);
    console.log(`🏛️ 总共收集贵宾厅: ${allLounges.length} 个`);

    const totalTime = Math.round((Date.now() - stats.startTime) / 1000);
    const avgTime =
      stats.processed > 0 ? Math.round(totalTime / stats.processed) : 0;
    console.log(`⏱️ 总耗时: ${totalTime}秒 | 平均每个机场: ${avgTime}秒`);
    console.log("");

    // 去重处理
    const uniqueLounges = [];
    const seenLoungeCodes = new Set();

    for (const lounge of allLounges) {
      if (lounge.loungeCode && !seenLoungeCodes.has(lounge.loungeCode)) {
        seenLoungeCodes.add(lounge.loungeCode);
        uniqueLounges.push(lounge);
      }
    }

    console.log(`🔄 去重后贵宾厅数量: ${uniqueLounges.length} 个`);
    console.log("");

    // 保存数据
    if (uniqueLounges.length > 0) {
      await saveToFiles(uniqueLounges);
    } else {
      console.log("⚠️ 没有收集到任何贵宾厅数据");
    }

    console.log("🏁 所有机场贵宾厅数据获取完成");
  } catch (error) {
    console.error("❌ 获取所有贵宾厅数据失败:", error.message);
    console.error("错误详情:", error);
    process.exit(1);
  }
}

// 保存数据到文件
async function saveToFiles(lounges) {
  const outputDir = path.join(__dirname);

  // 保存JSON格式
  const jsonFile = path.join(outputDir, "all-lounges.json");
  fs.writeFileSync(jsonFile, JSON.stringify(lounges, null, 2), "utf8");
  console.log(`💾 JSON数据已保存到: ${jsonFile}`);

  // 保存CSV格式
  const csvFile = path.join(outputDir, "all-lounges.csv");
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
  const excelFile = path.join(outputDir, "all-lounges.xlsx");
  const worksheet = XLSX.utils.json_to_sheet(lounges);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "贵宾厅数据");
  XLSX.writeFile(workbook, excelFile);
  console.log(`💾 Excel数据已保存到: ${excelFile}`);

  // 创建贵宾厅代码列表
  const loungeCodes = lounges.map((lounge) => ({
    loungeCode: lounge.loungeCode,
    loungeName: lounge.loungeName,
    cityName: lounge.cityName,
    countryName: lounge.countryName,
    siteName: lounge.siteName,
  }));

  const codesFile = path.join(outputDir, "lounge-codes.json");
  fs.writeFileSync(codesFile, JSON.stringify(loungeCodes, null, 2), "utf8");
  console.log(`💾 贵宾厅代码列表已保存到: ${codesFile}`);

  // 保存贵宾厅代码Excel
  const codesExcelFile = path.join(outputDir, "lounge-codes.xlsx");
  const codesWorksheet = XLSX.utils.json_to_sheet(loungeCodes);
  const codesWorkbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(codesWorkbook, codesWorksheet, "贵宾厅代码");
  XLSX.writeFile(codesWorkbook, codesExcelFile);
  console.log(`💾 贵宾厅代码Excel已保存到: ${codesExcelFile}`);

  console.log("");
  console.log("📋 文件保存完成:");
  console.log(`  - ${jsonFile}`);
  console.log(`  - ${csvFile}`);
  console.log(`  - ${excelFile}`);
  console.log(`  - ${codesFile}`);
  console.log(`  - ${codesExcelFile}`);
}

// 显示使用说明
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
多线程优化版 - 获取所有机场贵宾厅数据脚本使用说明:

基本用法:
  node getAllLounges-multithreaded.js

配置参数:
  --concurrent=N    设置最大并发数 (默认: 10)
  --batch=N         设置批处理大小 (默认: 20)
  --delay=N         设置请求延迟毫秒 (默认: 200)

示例:
  node getAllLounges-multithreaded.js --concurrent=15 --batch=30 --delay=100

性能优化特性:
  - 多线程并发处理，大幅提升速度
  - 智能重试机制，提高成功率
  - 实时进度显示和统计
  - 可配置的并发数和批处理大小
  - 自动去重和错误处理

输出文件:
  - all-lounges.json       完整贵宾厅数据(JSON格式)
  - all-lounges.csv        完整贵宾厅数据(CSV格式)
  - all-lounges.xlsx       完整贵宾厅数据(Excel格式)
  - lounge-codes.json      贵宾厅代码列表(JSON格式)
  - lounge-codes.xlsx      贵宾厅代码列表(Excel格式)

注意事项:
  - 建议并发数不要超过20，避免被服务器限制
  - 可以根据网络情况调整延迟参数
  - 处理时间相比原版大幅缩短
  - 自动处理网络错误和重试

  --help, -h         显示此帮助信息
`);
  process.exit(0);
}

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);

  for (const arg of args) {
    if (arg.startsWith("--concurrent=")) {
      CONFIG.MAX_CONCURRENT = parseInt(arg.split("=")[1]) || 10;
    } else if (arg.startsWith("--batch=")) {
      CONFIG.BATCH_SIZE = parseInt(arg.split("=")[1]) || 20;
    } else if (arg.startsWith("--delay=")) {
      CONFIG.REQUEST_DELAY = parseInt(arg.split("=")[1]) || 200;
    }
  }
}

// 运行获取所有贵宾厅数据
parseArgs();
getAllLounges();
