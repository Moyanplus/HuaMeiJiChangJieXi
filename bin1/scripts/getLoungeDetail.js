const axios = require('axios');
const { encryptRequest, decryptResponse } = require('../utils/cryptoUtils');
const fs = require('fs');
const path = require('path');

/**
 * 获取贵宾厅详情数据的脚本
 * 从API获取特定贵宾厅的详细信息
 */

function parseArgJson() {
  const arg = process.argv.find(v => v.startsWith('--json='));
  if (!arg) return null;
  const s = arg.slice('--json='.length);
  try { return JSON.parse(s); } catch { return null; }
}

async function getLoungeDetail() {
  try {
    console.log('🏛️ 开始获取贵宾厅详情数据...');
    console.log('='.repeat(50));
    
    // 解析命令行参数
    const cli = parseArgJson() || {};
    
    // 构建请求数据 - 获取贵宾厅详情
    const requestData = {
      serviceId: "5476",
      loungeCode: "GB4744", // 默认值，可以通过命令行参数覆盖
      sdTimestamp: Date.now(),
      ...cli
    };
    
    // 确保有必要的参数
    if (!requestData.loungeCode) {
      console.error('❌ 错误: 必须提供 loungeCode 参数');
      console.log('使用 --json=\'{"loungeCode":"GB4744"}\' 来指定贵宾厅代码');
      process.exit(1);
    }
    
    console.log('📋 请求数据:');
    console.log(JSON.stringify(requestData, null, 2));
    console.log('');
    
    // 加密请求数据
    console.log('🔐 开始加密请求数据...');
    const sdData = encryptRequest(requestData);
    console.log('✅ 加密完成');
    console.log(`加密数据长度: ${sdData.length} 字符`);
    console.log('');
    
    // 发送请求到获取贵宾厅详情的API
    console.log('📤 发送请求到贵宾厅详情API...');
    const url = 'https://h5.schengle.com/ShengDaHXZHJSJHD/bespeak/VipHall/queryVipHallDetails';
    
    const response = await axios.post(url, { sdData }, {
      headers: {
        'referer': 'https://h5.schengle.com/ShengDaHXZHJSJ/',
        'user-agent': 'Mozilla/5.0 (Linux; Android 13; 23046RP50C Build/TKQ1.221114.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.180 Safari/537.36 XWEB/1380187 MMWEBSDK/20250201 MMWEBID/911 MicroMessenger/8.0.60.2860(0x28003C55) WeChat/arm64 Weixin Android Tablet NetType/WIFI Language/zh_CN ABI/arm64'
      },
      timeout: 10000,
    });
    
    console.log(`✅ 请求完成，状态码: ${response.status}`);
    console.log('');
    
    // 处理响应数据
    let data = response && response.data;
    if (typeof data === 'string') {
      try { 
        data = JSON.parse(data); 
      } catch (e) {
        console.warn('⚠️ 响应数据不是有效的JSON格式');
      }
    }
    
    console.log('📥 原始响应数据:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');
    
    // 解密响应数据
    if (data && data.sdData) {
      console.log('🔓 开始解密响应数据...');
      try {
        const decrypted = decryptResponse(data);
        console.log('✅ 解密成功');
        console.log('📊 解密后的贵宾厅详情数据:');
        console.log(JSON.stringify(decrypted, null, 2));
        
        // 解析贵宾厅详情数据
        if (decrypted && decrypted.data) {
          let loungeDetail = decrypted.data;
          
          // 如果data是字符串，尝试解析为JSON
          if (typeof loungeDetail === 'string') {
            try {
              loungeDetail = JSON.parse(loungeDetail);
            } catch (e) {
              console.warn('⚠️ 无法解析data字段为JSON');
            }
          }
          
          // 处理贵宾厅详情数据
          if (loungeDetail) {
            console.log('');
            console.log('🏛️ 贵宾厅详情信息:');
            console.log('');
            
            // 格式化贵宾厅详情数据
            const formattedLounge = {
              loungeCode: loungeDetail.loungeCode,
              loungeName: loungeDetail.loungeName,
              cityName: loungeDetail.cityName,
              cityCode: loungeDetail.cityCode,
              cityEnName: loungeDetail.cityEnName,
              countryCode: loungeDetail.countryCode,
              countryName: loungeDetail.countryName,
              countryEnName: loungeDetail.countryEnName,
              siteName: loungeDetail.siteName,
              siteCode: loungeDetail.siteCode,
              siteType: loungeDetail.siteType,
              terminalName: loungeDetail.terminalName,
              terminalCode: loungeDetail.terminalCode,
              terminalEnName: loungeDetail.terminalEnName,
              businessHours: loungeDetail.businessHours,
              deductPoints: loungeDetail.deductPoints,
              loungeType: loungeDetail.loungeType,
              domesticForeign: loungeDetail.domesticForeign,
              address: loungeDetail.address,
              latitude: loungeDetail.latitude,
              longitude: loungeDetail.longitude,
              continentName: loungeDetail.continentName,
              continentEnName: loungeDetail.continentEnName,
              serviceList: loungeDetail.serviceList || [],
              restrictionList: loungeDetail.restrictionList || [],
              positionInfo: loungeDetail.positionInfo || [],
              positionInfoEng: loungeDetail.positionInfoEng || [],
              supplierImageList: loungeDetail.supplierImageList || []
            };
            
            // 保存到文件
            const outputDir = path.join(__dirname);
            const outputFile = path.join(outputDir, `lounge-${requestData.loungeCode}.json`);
            const csvFile = path.join(outputDir, `lounge-${requestData.loungeCode}.csv`);
            
            // 保存JSON格式
            fs.writeFileSync(outputFile, JSON.stringify(formattedLounge, null, 2), 'utf8');
            console.log(`💾 贵宾厅详情数据已保存到: ${outputFile}`);
            
            // 保存CSV格式
            const csvHeader = '字段,值\n';
            let csvData = '';
            for (const [key, value] of Object.entries(formattedLounge)) {
              if (Array.isArray(value)) {
                csvData += `"${key}","${JSON.stringify(value)}"\n`;
              } else {
                csvData += `"${key}","${value}"\n`;
              }
            }
            
            fs.writeFileSync(csvFile, csvHeader + csvData, 'utf8');
            console.log(`💾 贵宾厅详情数据CSV已保存到: ${csvFile}`);
            
            // 显示贵宾厅详情
            console.log('');
            console.log('📋 贵宾厅基本信息:');
            console.log(`  名称: ${formattedLounge.loungeName}`);
            console.log(`  代码: ${formattedLounge.loungeCode}`);
            console.log(`  位置: ${formattedLounge.siteName} - ${formattedLounge.terminalName}`);
            console.log(`  城市: ${formattedLounge.cityName} (${formattedLounge.countryName})`);
            console.log(`  营业时间: ${formattedLounge.businessHours}`);
            console.log(`  所需积分: ${formattedLounge.deductPoints}`);
            console.log(`  地址: ${formattedLounge.address}`);
            
            // 显示服务设施
            if (formattedLounge.serviceList && formattedLounge.serviceList.length > 0) {
              console.log('');
              console.log('🛎️ 服务设施:');
              formattedLounge.serviceList.forEach(service => {
                console.log(`  • ${service.serviceName}`);
              });
            }
            
            // 显示使用限制
            if (formattedLounge.restrictionList && formattedLounge.restrictionList.length > 0) {
              console.log('');
              console.log('⚠️ 使用限制:');
              formattedLounge.restrictionList.forEach(restriction => {
                console.log(`  • ${restriction.labelDescribe} (${restriction.labelName})`);
              });
            }
            
            // 显示位置指引
            if (formattedLounge.positionInfo && formattedLounge.positionInfo.length > 0) {
              console.log('');
              console.log('📍 位置指引:');
              formattedLounge.positionInfo.forEach((position, index) => {
                console.log(`  ${index + 1}. ${position.locationGuidance}`);
                console.log(`     登机口: ${position.boardingGate}`);
                console.log(`     出发区域: ${position.setOutList}`);
                console.log(`     安检位置: ${position.securityCheckTypeValue}`);
              });
            }
            
            // 显示供应商信息
            if (formattedLounge.supplierImageList && formattedLounge.supplierImageList.length > 0) {
              console.log('');
              console.log('🏢 供应商信息:');
              formattedLounge.supplierImageList.forEach(supplier => {
                console.log(`  • ${supplier.supplierAbbrevia}`);
                console.log(`     Logo: ${supplier.supplierLogo}`);
                if (supplier.supplierLogo2) {
                  console.log(`     Logo2: ${supplier.supplierLogo2}`);
                }
              });
            }
          } else {
            console.log('⚠️ 未找到有效的贵宾厅详情数据');
          }
        }
        
      } catch (decryptError) {
        console.error('❌ 解密失败:', decryptError.message);
        console.error('解密错误详情:', decryptError);
      }
    } else {
      console.log('⚠️ 响应中没有sdData字段，无法解密');
    }
    
    console.log('');
    console.log('🏁 获取贵宾厅详情完成');
    
  } catch (error) {
    console.error('❌ 获取贵宾厅详情失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    console.error('错误详情:', error);
    process.exit(1);
  }
}

// 显示使用说明
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
获取贵宾厅详情数据脚本使用说明:

基本用法:
  node getLoungeDetail.js --json='{"loungeCode":"GB4744"}'

参数说明:
  --json=JSON_STRING  自定义请求参数，JSON格式
  
  必需参数:
  - loungeCode: 贵宾厅代码 (如: "GB4744")
  
  可选参数:
  - serviceId: 服务ID (默认: "5476")
  - sdTimestamp: 时间戳 (默认: 当前时间)
  
  --help, -h         显示此帮助信息

输出文件:
  - lounge-{CODE}.json     JSON格式的贵宾厅详情数据
  - lounge-{CODE}.csv      CSV格式的贵宾厅详情数据

示例:
  # 获取特定贵宾厅的详情
  node getLoungeDetail.js --json='{"loungeCode":"GB4744"}'
  
  # 获取另一个贵宾厅的详情
  node getLoungeDetail.js --json='{"loungeCode":"GB1234"}'
`);
  process.exit(0);
}

// 运行获取贵宾厅详情数据
getLoungeDetail();