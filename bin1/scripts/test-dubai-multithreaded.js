const axios = require("axios");
const { encryptRequest, decryptResponse } = require("./cryptoUtils");
const fs = require("fs");
const path = require("path");

/**
 * 测试迪拜国际机场的多线程分页获取
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
  REQUEST_DELAY: 1000,
  RETRY_ATTEMPTS: 3,
  TIMEOUT: 15000,
  BATCH_SIZE: 10,
};

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
      );
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

  console.log(
    `\n🔍 开始获取${airport.siteName} ${
      domesticForeign === "1" ? "国内" : "国际"
    }贵宾厅数据...`
  );

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
        console.log(
          `ℹ️ 第${page}页: 没有数据 (连续空页: ${consecutiveEmptyPages})`
        );
        if (consecutiveEmptyPages >= 2) {
          console.log(`🛑 连续${consecutiveEmptyPages}页无数据，停止获取`);
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
          } 第${page}页: ${lounges.length}个贵宾厅 (累计: ${
            allLounges.length
          }个)`
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
        console.log(`🛑 连续${consecutiveEmptyPages}页出错，停止获取`);
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

    console.log(`\n✅ ${airport.siteName} 成功获取 ${results.length} 个贵宾厅`);
    console.log(`   - 国内: ${domesticLounges.length} 个`);
    console.log(`   - 国际: ${internationalLounges.length} 个`);

    return {
      airport,
      lounges: results,
      success: true,
      error: null,
    };
  } catch (error) {
    console.error(`❌ ${airport.siteName} 处理失败:`, error.message);
    return {
      airport,
      lounges: [],
      success: false,
      error: error.message,
    };
  }
}

// 主函数
async function testDubaiAirport() {
  console.log("🏛️ 测试迪拜国际机场多线程分页获取");
  console.log("=".repeat(60));

  const result = await processAirport(DUBAI_AIRPORT);

  console.log("\n" + "=".repeat(60));
  console.log("📊 最终结果:");
  console.log(`✅ 成功: ${result.success ? "是" : "否"}`);
  console.log(`🏛️ 贵宾厅总数: ${result.lounges.length} 个`);

  if (result.lounges.length > 0) {
    console.log("\n🏛️ 贵宾厅详情:");
    result.lounges.forEach((lounge, index) => {
      console.log(
        `${index + 1}. ${lounge.loungeName} (${lounge.loungeCode}) - ${
          lounge.terminalName
        }`
      );
    });
  }
}

// 运行测试
testDubaiAirport();
