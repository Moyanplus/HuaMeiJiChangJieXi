const axios = require("axios");
const {
  encryptRequest,
  decryptResponse,
  generateSign,
} = require("./cryptoUtils");
const cfg = require("./config");
const fs = require("fs");
const path = require("path");

/**
 * 创建贵宾厅订单的脚本
 * 提交订单到API并获取结果
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

async function createOrder() {
  try {
    console.log("🛒 开始创建贵宾厅订单...");
    console.log("=".repeat(50));

    // 使用固定的请求数据
    const requestData = {
      activityId: "5476",
      bespType: "VIP",
      bespeakCardType: "HXYX0803",
      phoneNo: "18576726817",
      name: "倪良辉",
      loungeCode: "GB3990",
      data: "Vy4Ycr+bvOiI7lbhsfLqwDepGU5QlCyvWFxRTv5FNdCpmpUVzjQD8i+YDXgx14sDqhQfbjktfvVcgr75cq97AAJS7+IK8aYiYBIyAQPiB8fgVt6GVbF+haOBqvtim7+J4avGNZ+GoJz46cMfvu65jqyhn3bpR0Y0zBlemMSz1gIU0ujLZk4nB50PMiBesk+5ABg+5DkP86VfrLQSYgvD3wg5ofSGNZaKNey7SG/uOdw3lS3C67txU/PFO29wxwz/qX+YWkTQ4XqwPPz7rbM7SCPOPbbsBdPM2E9tIsloLtfJLLfBG6rSZn+nKXFElAUPA66F4LRU0A1SE63IMPpjew==",
      accompanierNumber: "0",
      sdTimestamp: Date.now(),
    };

    console.log("📋 请求数据:");
    console.log(JSON.stringify(requestData, null, 2));
    console.log("");

    const sdData = encryptRequest(requestData);
    // 发送请求到创建订单的API
    console.log("📤 发送订单请求...");
    const url =
      "https://h5.schengle.com/ShengDaHXZHJSJHD/bespeak/VipHall/createProductOrder";

    const response = await axios.post(
      url,
      { sdData },
      {
        headers: cfg.DEFAULT_HEADERS,
        timeout: 15000,
      }
    );

    console.log(`✅ 请求完成，状态码: ${response.status}`);
    console.log("");

    // 处理响应数据
    let data = response && response.data;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch (e) {
        console.warn("⚠️ 响应数据不是有效的JSON格式");
      }
    }

    console.log("📥 原始响应数据:");
    console.log(JSON.stringify(data, null, 2));
    console.log("");

    // 解密响应数据
    if (data && data.sdData) {
      console.log("🔓 开始解密响应数据...");
      try {
        const decrypted = decryptResponse(data);
        console.log("✅ 解密成功");
        console.log("📊 解密后的订单响应数据:");
        console.log(JSON.stringify(decrypted, null, 2));

        // 解析订单响应数据
        if (decrypted) {
          // 保存到文件
          const outputDir = path.join(__dirname);
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          const outputFile = path.join(
            outputDir,
            `order-result-${timestamp}.json`
          );

          // 保存JSON格式
          fs.writeFileSync(
            outputFile,
            JSON.stringify(decrypted, null, 2),
            "utf8"
          );
          console.log(`💾 订单响应数据已保存到: ${outputFile}`);

          // 显示订单结果
          console.log("");
          console.log("📋 订单结果:");

          if (decrypted.resultCode === "0000") {
            console.log("✅ 订单创建成功!");

            if (decrypted.data) {
              let orderData = decrypted.data;

              // 如果data是字符串，尝试解析为JSON
              if (typeof orderData === "string") {
                try {
                  orderData = JSON.parse(orderData);
                } catch (e) {
                  console.warn("⚠️ 无法解析data字段为JSON");
                }
              }

              if (orderData && typeof orderData === "object") {
                // 从请求参数中获取用户信息，因为API响应中可能不包含完整的订单详情
                const requestOrderData = {
                  orderNo: orderData.orderNo || "未知",
                  loungeName: "未知", // API响应中通常不包含这些详细信息
                  siteName: "未知",
                  terminalName: "未知",
                  name: requestData.name || "未知", // 使用请求中的姓名
                  phoneNo: requestData.phoneNo || "未知", // 使用请求中的手机号
                  bespeakDate: "未知",
                  bespeakTime: "",
                  orderStatus: "未知",
                  qrCode: orderData.qrCode || null,
                  verificationCode: orderData.verificationCode || null,
                  // 添加API响应中的其他有用信息
                  h5OrderNo: orderData.h5OrderNo || null,
                  commCode: orderData.commCode || null,
                  couponCode: orderData.couponCode || null,
                  redirectUrl: orderData.redirectUrl || null,
                  directUrl: orderData.directUrl || null,
                };

                console.log(`   订单号: ${requestOrderData.orderNo}`);
                console.log(`   贵宾厅: ${requestOrderData.loungeName}`);
                console.log(
                  `   地点: ${requestOrderData.siteName} - ${requestOrderData.terminalName}`
                );
                console.log(`   预约人: ${requestOrderData.name}`);
                console.log(`   手机号: ${requestOrderData.phoneNo}`);
                console.log(
                  `   预约时间: ${requestOrderData.bespeakDate} ${requestOrderData.bespeakTime}`
                );
                console.log(`   状态: ${requestOrderData.orderStatus}`);

                if (requestOrderData.qrCode) {
                  console.log(`   二维码: ${requestOrderData.qrCode}`);
                }

                if (requestOrderData.verificationCode) {
                  console.log(
                    `   验证码: ${requestOrderData.verificationCode}`
                  );
                }

                // 显示其他有用信息
                if (requestOrderData.h5OrderNo) {
                  console.log(`   H5订单号: ${requestOrderData.h5OrderNo}`);
                }
                if (requestOrderData.couponCode) {
                  console.log(`   优惠券代码: ${requestOrderData.couponCode}`);
                }
                if (requestOrderData.redirectUrl) {
                  console.log(`   重定向URL: ${requestOrderData.redirectUrl}`);
                }
              }
            }
          } else {
            console.log("❌ 订单创建失败!");
            console.log(`   错误代码: ${decrypted.resultCode}`);
            console.log(`   错误描述: ${decrypted.resultDesc}`);

            // 常见错误处理建议
            if (decrypted.resultCode === "1001") {
              console.log("💡 提示: 可能是贵宾厅代码无效或不存在");
            } else if (decrypted.resultCode === "1002") {
              console.log("💡 提示: 可能是手机号格式错误");
            } else if (decrypted.resultCode === "1003") {
              console.log("💡 提示: 可能是姓名格式错误");
            } else if (decrypted.resultCode === "2001") {
              console.log("💡 提示: 可能是积分不足");
            }
          }
        }
      } catch (decryptError) {
        console.error("❌ 解密失败:", decryptError.message);
        console.error("解密错误详情:", decryptError);
      }
    } else {
      console.log("⚠️ 响应中没有sdData字段，无法解密");
      // 直接处理响应数据
      if (data) {
        console.log("📊 响应数据:");
        if (data.resultCode === "0000") {
          console.log("✅ 订单创建成功!");
        } else {
          console.log("❌ 订单创建失败!");
          console.log(`错误代码: ${data.resultCode}`);
          console.log(`错误描述: ${data.resultDesc}`);
        }
      }
    }

    console.log("");
    console.log("🏁 订单创建流程完成");
  } catch (error) {
    console.error("❌ 创建订单失败:", error.message);
    if (error.response) {
      console.error("响应状态:", error.response.status);
      console.error("响应数据:", error.response.data);
    }
    console.error("错误详情:", error);
    process.exit(1);
  }
}

// 显示使用说明
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
创建贵宾厅订单脚本使用说明:

基本用法:
  node createOrder.js --json='{"phoneNo":"18576726817","name":"倪良辉","loungeCode":"GB3990"}'

参数说明:
  --json=JSON_STRING  自定义请求参数，JSON格式
  
  必需参数:
  - phoneNo: 手机号码
  - name: 姓名
  - loungeCode: 贵宾厅代码
  
  可选参数:
  - activityId: 活动ID (默认: "5476")
  - bespType: 预约类型 (默认: "VIP")
  - bespeakCardType: 卡类型 (默认: "HXYX0803")
  - accompanierNumber: 陪同人数 (默认: "0")
  - sdTimestamp: 时间戳 (默认: 当前时间)
  
  --help, -h         显示此帮助信息

输出文件:
  - order-result-{TIMESTAMP}.json     JSON格式的订单响应数据

示例:
  # 创建特定贵宾厅的订单
  node createOrder.js --json='{"phoneNo":"18576726817","name":"倪良辉","loungeCode":"GB3990"}'
  
  # 创建带陪同人员的订单
  node createOrder.js --json='{"phoneNo":"18576726817","name":"倪良辉","loungeCode":"GB3990","accompanierNumber":"1"}'
  
  # 使用不同的卡类型
  node createOrder.js --json='{"phoneNo":"18576726817","name":"倪良辉","loungeCode":"GB3990","bespeakCardType":"OTHER_CARD"}'
`);
  process.exit(0);
}

// 运行创建订单
createOrder();
