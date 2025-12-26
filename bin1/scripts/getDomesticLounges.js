const axios = require("axios");
const { encryptRequest, decryptResponse } = require("./cryptoUtils");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

/**
 * 获取机场贵宾厅数据的脚本
 * 支持国内和国外机场，根据国家代码自动设置参数
 */

// 大洲类型映射函数
function getContinentType(countryCode) {
  const continentMap = {
    // 亚洲
    JPN: "AS",
    KOR: "AS",
    THA: "AS",
    SGP: "AS",
    MYS: "AS",
    IDN: "AS",
    PHL: "AS",
    VNM: "AS",
    IND: "AS",
    PAK: "AS",
    BGD: "AS",
    LKA: "AS",
    NPL: "AS",
    MMR: "AS",
    KHM: "AS",
    LAO: "AS",
    MNG: "AS",
    KAZ: "AS",
    UZB: "AS",
    KGZ: "AS",
    TJK: "AS",
    TKM: "AS",
    AFG: "AS",
    IRN: "AS",
    IRQ: "AS",
    SYR: "AS",
    LBN: "AS",
    JOR: "AS",
    ISR: "AS",
    PSE: "AS",
    SAU: "AS",
    ARE: "AS",
    QAT: "AS",
    BHR: "AS",
    KWT: "AS",
    OMN: "AS",
    YEM: "AS",
    TUR: "AS",
    GEO: "AS",
    ARM: "AS",
    AZE: "AS",
    CYP: "AS",
    HKG: "AS",
    MAC: "AS",
    TWN: "AS",
    HK: "AS",
    MO: "AS",
    TW: "AS",

    // 欧洲
    GBR: "EU",
    FRA: "EU",
    DEU: "EU",
    ITA: "EU",
    ESP: "EU",
    NLD: "EU",
    BEL: "EU",
    CHE: "EU",
    AUT: "EU",
    SWE: "EU",
    NOR: "EU",
    DNK: "EU",
    FIN: "EU",
    POL: "EU",
    CZE: "EU",
    HUN: "EU",
    ROU: "EU",
    BGR: "EU",
    HRV: "EU",
    SVN: "EU",
    SVK: "EU",
    EST: "EU",
    LVA: "EU",
    LTU: "EU",
    LUX: "EU",
    IRL: "EU",
    PRT: "EU",
    GRC: "EU",
    ALB: "EU",
    MKD: "EU",
    MNE: "EU",
    SRB: "EU",
    BIH: "EU",
    MLT: "EU",
    ISL: "EU",

    // 北美洲
    USA: "NA",
    CAN: "NA",
    MEX: "NA",
    GTM: "NA",
    BLZ: "NA",
    SLV: "NA",
    HND: "NA",
    NIC: "NA",
    CRI: "NA",
    PAN: "NA",
    CUB: "NA",
    JAM: "NA",
    HTI: "NA",
    DOM: "NA",
    PRI: "NA",
    TTO: "NA",
    BHS: "NA",
    BRB: "NA",
    ATG: "NA",
    DMA: "NA",
    GRD: "NA",
    KNA: "NA",
    LCA: "NA",
    VCT: "NA",
    ABW: "NA",
    CUW: "NA",
    SXM: "NA",
    BES: "NA",
    VIR: "NA",
    GUM: "NA",

    // 南美洲
    BRA: "SA",
    ARG: "SA",
    CHL: "SA",
    PER: "SA",
    COL: "SA",
    VEN: "SA",
    ECU: "SA",
    BOL: "SA",
    PRY: "SA",
    URY: "SA",
    GUY: "SA",
    SUR: "SA",
    GUF: "SA",

    // 非洲
    ZAF: "AF",
    EGY: "AF",
    NGA: "AF",
    KEN: "AF",
    TZA: "AF",
    UGA: "AF",
    ETH: "AF",
    GHA: "AF",
    MAR: "AF",
    TUN: "AF",
    DZA: "AF",
    LBY: "AF",
    SDN: "AF",
    SSD: "AF",
    CAF: "AF",
    TCD: "AF",
    NER: "AF",
    MLI: "AF",
    BFA: "AF",
    SEN: "AF",
    GMB: "AF",
    GIN: "AF",
    SLE: "AF",
    LBR: "AF",
    CIV: "AF",
    TGO: "AF",
    BEN: "AF",
    CMR: "AF",
    GAB: "AF",
    COG: "AF",
    COD: "AF",
    AGO: "AF",
    ZMB: "AF",
    ZWE: "AF",
    BWA: "AF",
    NAM: "AF",
    LSO: "AF",
    SWZ: "AF",
    MDG: "AF",
    MUS: "AF",
    SYC: "AF",
    COM: "AF",
    DJI: "AF",
    SOM: "AF",
    ERI: "AF",
    RWA: "AF",
    BDI: "AF",
    MWI: "AF",
    MOZ: "AF",
    REU: "AF",
    MYT: "AF",

    // 大洋洲
    AUS: "OC",
    NZL: "OC",
    PNG: "OC",
    FJI: "OC",
    VUT: "OC",
    SLB: "OC",
    NCL: "OC",
    PYF: "OC",
    COK: "OC",
    TON: "OC",
    WSM: "OC",
    KIR: "OC",
    TUV: "OC",
    NRU: "OC",
    PLW: "OC",
    FSM: "OC",
    MHL: "OC",
    ASM: "OC",
    MNP: "OC",
    WLF: "OC",
    AU: "OC",

    // 特殊处理
    MEXCONUTRY: "NA",
    LUXCONUTRY: "EU",
  };

  return continentMap[countryCode] || "";
}

// 读取cities.csv文件
function readCitiesData() {
  const csvPath = path.join(__dirname, "../data/cities.csv");
  const csvContent = fs.readFileSync(csvPath, "utf8");
  const lines = csvContent.split("\n");

  const cities = [];
  for (let i = 1; i < lines.length; i++) {
    // 跳过标题行
    const line = lines[i].trim();
    if (line) {
      const columns = line.split(",");
      if (columns.length >= 10) {
        const countryCode = columns[6].replace(/"/g, "");
        // 处理所有机场（国内和国外）
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

// 获取单个机场的贵宾厅数据
async function getLoungeDataForAirport(airport, page = 1, size = 50) {
  try {
    console.log(
      `🏛️ 获取 ${airport.cityName} - ${airport.siteName} 的贵宾厅数据 (第${page}页)...`
    );

    // 根据国家代码判断是国内还是国外机场
    const isDomestic = airport.countryCode === "CN";
    const continentType = getContinentType(airport.countryCode);

    // 构建请求数据
    const requestData = {
      serviceId: "5476",
      domesticForeign: isDomestic ? "1" : "2", // 1-国内，2-国外
      continentType: continentType,
      countryCode: airport.countryCode,
      cityCode: airport.cityCode,
      siteCode: airport.siteCode,
      page: page,
      size: size,
      loungeType: "1,2,3", // 所有类型的贵宾厅
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
        timeout: 15000,
      }
    );

    // 处理响应数据
    let data = response && response.data;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch (e) {
        console.warn(`⚠️ ${airport.siteName} 响应数据不是有效的JSON格式`);
        return [];
      }
    }

    // 解密响应数据
    if (data && data.sdData) {
      try {
        const decrypted = decryptResponse(data);
        if (decrypted && decrypted.data) {
          let loungeData = decrypted.data;

          // 如果data是字符串，尝试解析为JSON
          if (typeof loungeData === "string") {
            try {
              loungeData = JSON.parse(loungeData);
            } catch (e) {
              console.warn(`⚠️ ${airport.siteName} 无法解析data字段为JSON`);
              return [];
            }
          }

          // 处理贵宾厅数据
          if (Array.isArray(loungeData)) {
            console.log(
              `✅ ${airport.siteName} 找到 ${loungeData.length} 个贵宾厅`
            );
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
        console.error(`❌ ${airport.siteName} 解密失败:`, decryptError.message);
      }
    }

    return [];
  } catch (error) {
    console.error(`❌ ${airport.siteName} 获取贵宾厅数据失败:`, error.message);
    return [];
  }
}

// 获取所有机场的贵宾厅数据（国内和国外）
async function getAllLounges() {
  try {
    console.log("🏛️ 开始获取所有机场的贵宾厅数据...");
    console.log("=".repeat(60));

    // 读取机场数据
    console.log("📖 读取机场数据...");
    const cities = readCitiesData();
    console.log(`✅ 共读取到 ${cities.length} 个机场`);
    console.log("");

    const allLounges = [];
    const processedAirports = new Set(); // 用于去重
    let successCount = 0;
    let errorCount = 0;

    // 遍历所有机场
    for (let i = 0; i < cities.length; i++) {
      const airport = cities[i];

      // 跳过重复的机场
      if (processedAirports.has(airport.siteCode)) {
        console.log(`⏭️ 跳过重复机场: ${airport.siteName}`);
        continue;
      }
      processedAirports.add(airport.siteCode);

      const airportType = airport.countryCode === "CN" ? "国内" : "国外";
      console.log(
        `\n📍 处理${airportType}机场 ${i + 1}/${cities.length}: ${
          airport.cityName
        } - ${airport.siteName} (${airport.countryName})`
      );

      try {
        // 获取贵宾厅数据
        const lounges = await getLoungeDataForAirport(airport);

        allLounges.push(...lounges);

        if (lounges.length > 0) {
          successCount++;
          console.log(
            `✅ ${airport.siteName} 成功获取 ${lounges.length} 个贵宾厅`
          );
        } else {
          console.log(`ℹ️ ${airport.siteName} 暂无贵宾厅数据`);
        }

        // 添加延迟避免请求过于频繁
        await new Promise((resolve) => setTimeout(resolve, 500));

        // 每处理10个机场保存一次数据
        if ((i + 1) % 10 === 0) {
          console.log(`\n💾 中间保存数据... (已处理 ${i + 1} 个机场)`);
          await saveToFiles(allLounges, true);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ ${airport.siteName} 处理失败:`, error.message);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 数据收集完成统计:");
    console.log(`✅ 成功处理机场: ${successCount} 个`);
    console.log(`❌ 失败处理机场: ${errorCount} 个`);
    console.log(`🏛️ 总共收集贵宾厅: ${allLounges.length} 个`);
    console.log("");

    // 去重处理
    const uniqueLounges = [];
    const seenCodes = new Set();

    for (const lounge of allLounges) {
      if (lounge.loungeCode && !seenCodes.has(lounge.loungeCode)) {
        seenCodes.add(lounge.loungeCode);
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
    console.error("❌ 获取贵宾厅数据失败:", error.message);
    console.error("错误详情:", error);
    process.exit(1);
  }
}

// 保存数据到文件
async function saveToFiles(lounges, isIntermediate = false) {
  const baseDir = path.join(__dirname, "../data");
  const suffix = isIntermediate ? "-intermediate" : "";

  // 保存JSON格式到generated目录
  const jsonFile = path.join(
    baseDir,
    "generated/lounges",
    `all-lounges${suffix}.json`
  );
  fs.writeFileSync(jsonFile, JSON.stringify(lounges, null, 2), "utf8");
  console.log(`💾 JSON数据已保存到: ${jsonFile}`);

  // 保存CSV格式到exports目录
  const csvFile = path.join(baseDir, "exports/csv", `all-lounges${suffix}.csv`);
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

  // 保存Excel格式到exports目录
  const excelFile = path.join(
    baseDir,
    "exports/excel",
    `all-lounges${suffix}.xlsx`
  );
  const worksheet = XLSX.utils.json_to_sheet(lounges);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "所有贵宾厅数据");
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

  const codesFile = path.join(
    baseDir,
    "generated/codes",
    `all-lounge-codes${suffix}.json`
  );
  fs.writeFileSync(codesFile, JSON.stringify(loungeCodes, null, 2), "utf8");
  console.log(`💾 贵宾厅代码列表已保存到: ${codesFile}`);

  // 保存贵宾厅代码Excel到exports目录
  const codesExcelFile = path.join(
    baseDir,
    "exports/excel",
    `all-lounge-codes${suffix}.xlsx`
  );
  const codesWorksheet = XLSX.utils.json_to_sheet(loungeCodes);
  const codesWorkbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(codesWorkbook, codesWorksheet, "所有贵宾厅代码");
  XLSX.writeFile(codesWorkbook, codesExcelFile);
  console.log(`💾 贵宾厅代码Excel已保存到: ${codesExcelFile}`);

  if (!isIntermediate) {
    console.log("");
    console.log("📋 文件保存完成:");
    console.log(`  - ${jsonFile}`);
    console.log(`  - ${csvFile}`);
    console.log(`  - ${excelFile}`);
    console.log(`  - ${codesFile}`);
    console.log(`  - ${codesExcelFile}`);
  }
}

// 显示使用说明
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
获取所有机场贵宾厅数据脚本使用说明:

基本用法:
  node getDomesticLounges.js

功能:
  - 处理所有机场数据（国内和国外）
  - 根据国家代码自动设置domesticForeign参数
  - 为每个机场获取贵宾厅列表数据
  - 自动去重处理
  - 每10个机场自动保存中间数据
  - 保存为多种格式文件

输出文件:
  - all-lounges.json       完整贵宾厅数据(JSON格式)
  - all-lounges.csv        完整贵宾厅数据(CSV格式)
  - all-lounges.xlsx       完整贵宾厅数据(Excel格式)
  - all-lounge-codes.json  贵宾厅代码列表(JSON格式)
  - all-lounge-codes.xlsx  贵宾厅代码列表(Excel格式)

参数说明:
  - domesticForeign: "1" = 国内机场, "2" = 国外机场
  - continentType: 根据国家代码自动设置大洲类型

注意事项:
  - 脚本会自动添加请求延迟避免过于频繁
  - 会自动跳过重复的机场
  - 自动识别国内和国外机场并设置相应参数
  - 每10个机场自动保存中间数据防止数据丢失

  --help, -h         显示此帮助信息
`);
  process.exit(0);
}

// 运行获取所有贵宾厅数据
getAllLounges();
