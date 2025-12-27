# 华美机场解析项目

一个围绕华美机场 H5 链接解析的工具集合：提供加解密、用户信息查询、贵宾厅订单创建、优惠券查询、二维码生成、城市/贵宾厅数据管理，并配套前端页面与批量脚本。

## 目录结构

```
.
├── backend/            # Node.js 服务端（API、加解密、数据库、定时任务）
├── frontend/           # 静态前端页面（已构建产物）
├── bin1/               # 数据抓取/导出脚本
├── BIN/                # 解析与导出产物（归档/日志/导出文件）
├── cleanup.sh          # 清理与归档脚本
└── .gitignore
```

## 快速开始

### 1) 启动后端服务

```bash
cd backend
npm install
npm start
```

默认监听 `http://0.0.0.0:8081`，常用入口：

- `http://localhost:8081/health` 健康检查
- `http://localhost:8081/simple.html` 后端内置页面
- `http://localhost:8081/frontend/` 前端静态页面
- `http://localhost:8081/custom-page?name=张三` 自定义展示页面

### 2) 后端常用命令

```bash
cd backend
npm run dev                 # 服务器 + 定时任务
npm run sync-cities         # 手动同步城市数据
npm run scheduler           # 启动定时任务调度器
npm run scheduler-status    # 查看定时任务状态
npm run scheduler-stop      # 停止定时任务
npm run scheduler-sync      # 触发一次同步
npm run manage              # 管理脚本（更多命令）
```

> 注意：端口由 `backend/src/core/config.js` 的 `PORT` 控制，可通过 `.env` 覆盖。

## API 概览（backend）

基础接口：

- `GET /health` 健康检查
- `GET /api/config` 获取服务端配置（`ACTIVITY_ID`、`CARD_TYPE_CODE`）

加解密：

- `POST /api/decrypt` 解密响应数据（输入 `sdData` 等字段）
- `POST /api/encrypt` 加密请求数据（输入 `text`）

用户与链接解析：

- `POST /api/user-info` 解析链接中的 `data/sign` 并解密
- `POST /api/get-user-info` 根据 `cardTypeCode + data` 拉取用户信息

订单与优惠券：

- `POST /api/create-order` 创建订单（`phoneNo/name/loungeCode/data` 必填）
- `POST /api/query-orders` 查询订单列表
- `POST /api/cancel-order` 取消订单
- `POST /api/change-lounge` 更换贵宾厅
- `POST /api/coupon` 根据 `orderNo` 获取优惠券并生成二维码
- `POST /api/coupon-from-url` 通过订单数据获取优惠券
- `POST /api/sms/send` 发送短信验证码（`orderId`）
- `POST /api/sms/verify` 验证短信验证码，返回 `smsToken`（并写入数据库）
- `POST /api/coupon-by-sms` 使用 `orderId + smsToken` 获取券与二维码（含有效期）

一键流程：

- `POST /api/full-flow` 执行「解密 → 查询订单 → 获取券 → 落库」全流程

数据落库与查询：

- `POST /api/save-user-data` 保存用户数据
- `GET /api/user-by-order/:orderNo` 按订单号查询用户数据
- `GET /api/all-users` 查询全部用户数据

城市/贵宾厅数据：

- `GET /api/cities` 获取全部城市数据
- `GET /api/cities/country/:countryCode` 按国家筛选
- `GET /api/cities/search?keyword=关键词` 搜索城市
- `POST /api/cities/sync` 触发城市同步
- `GET /api/cities/sync-logs?limit=30` 获取同步日志
- `GET /api/lounges` 获取贵宾厅列表（支持筛选/分页）
- `GET /api/lounges/search?q=关键词` 搜索贵宾厅
- `GET /api/lounges/:loungeCode` 贵宾厅详情

## 典型业务流程

1. 从 H5 链接中拿到 `data/sign`
2. 调 `POST /api/user-info` 解密得到 `custNo` 等字段
3. 调 `POST /api/get-user-info` 获取用户信息（手机号/姓名等）
4. 调 `POST /api/create-order` 创建订单
5. 调 `POST /api/coupon` 拿券并生成二维码  
   或直接调用 `POST /api/full-flow` 一键完成

## 当前运行逻辑（详细）

### 1) custom-page 页面（前端独立展示）

访问：

```
GET /custom-page?name=可可可&orderUserName=倪良辉&type=pp
```

运行流程：

1. 服务端从 `user_data` 表中按 `orderUserName`（优先）或 `name` 查询最新记录。  
2. 如果找不到用户数据，返回 404（页面提示“未找到用户”）。
3. 找到用户后，服务端调用外部接口拉取券信息：
   - 若存在有效 `smsToken`，优先用 `user_data.h5OrderNo + smsToken` 调短信取券。
   - 否则使用 `user_data.orderNo` 调 `fetchCouponByOrderNo`（即 `/api/coupon` 同源逻辑）。
   - 解密返回结果，提取 `couponCode/couponNum` 作为本次券码。
4. 如果没有拿到 `couponCode`（过期或解密失败），`/api/vip-room` 直接返回 `410`：
   ```json
   { "ok": false, "error": "二维码已过期", "code": "COUPON_EXPIRED" }
   ```
5. 前端（custom-page）收到成功结果后，用 **couponCode** 本地生成二维码（不再依赖后端 `qrData` 图片）。
6. 如果收到 `COUPON_EXPIRED` 或 `couponCode` 为空，前端显示“二维码已过期”。

### 2) /api/vip-room 接口（custom-page 数据源）

请求：

```
GET /api/vip-room?name=可可可&orderUserName=倪良辉
```

返回：

- 成功：`ok=true` 且包含 `couponCode`（前端用它生成二维码）。
- 失败：`ok=false`，如 `COUPON_EXPIRED`（二维码过期）。

### 3) couponCode 获取与落库关系

- **couponCode 不入库**：它是实时可变的券码，只在接口响应中返回。
- **smsToken 会短期入库**：`/api/sms/verify` 会写入 `user_data.smsToken`，默认有效期约 5 分钟（可用 `SMS_TOKEN_TTL_SECONDS` 配置）。
- 数据库只存“订单与用户快照”：`user_data` 表记录订单号、手机号、贵宾厅、有效期等。
- 只有在 `POST /api/full-flow` 成功完成后，才会写入 `user_data` 表。

### 4) 数据库写入位置（user_data）

保存入口：

- `POST /api/save-user-data`：手动保存
- `POST /api/full-flow`：完整流程成功后自动保存

保存字段（简化）：

- 用户姓名、订单号、手机号、贵宾厅、权益剩余点数、有效期、状态等
- 订单关键字段来自 `orderInfo`，券信息仅用于流程判断，不存 `couponCode`

## 配置说明（.env 可选）

常用配置（默认值见 `backend/src/core/config.js`）：

- 加解密：`REQUEST_SALT` / `RESPONSE_SALT` / `SM2_PUBLIC_KEY` / `SM2_PRIVATE_KEY`
- API 地址：`API_BASE_URL` / `API_PREFIX`
- API 端点：`API_DECRYPT` / `API_COUPON` / `API_ORDER_INFO` / `API_BESPEAK_LIST` / `API_USER_INFO`
- 订单接口：`API_CREATE_ORDER` / `API_QUERY_ORDERS` / `API_CANCEL_ORDER` / `API_CHANGE_LOUNGE`
- 其他：`API_QUERY_STATION_LIST` / `ACTIVITY_ID` / `CARD_TYPE_CODE`
- 超时：`DEFAULT_TIMEOUT` / `COUPON_REQUEST_TIMEOUT` / `USER_INFO_REQUEST_TIMEOUT` / `ORDER_REQUEST_TIMEOUT`
- 服务端口：`PORT` / `HOST`
- 二维码：`QR_WIDTH` / `QR_MARGIN` / `QR_ERROR_CORRECTION_LEVEL` / `QR_VERSION`

## 数据与日志

- SQLite 数据库：`backend/data/vip_room.db`
- 任务日志：`backend/logs/`（可由 `cleanup.sh` 自动压缩清理）
- 归档日志：`BIN/_logs/`

## frontend

`frontend/` 为静态构建产物（HTML/CSS/JS），由后端通过 `/frontend` 与 `/image` 提供访问；也可直接用静态服务器部署。

## bin1 脚本

`bin1/` 用于数据抓取、导出与辅助脚本（依赖独立）：

```bash
cd bin1/scripts
npm install
npm run get-city
npm run get-lounge
npm run get-lounge-detail
npm run create-order
```

导出产物默认归档到 `BIN/_exports/`，避免干扰主仓库。

## 清理与归档

`cleanup.sh` 会执行：

- 将 `bin1` 的导出文件统一移动到 `BIN/_exports/`
- 归档/压缩旧日志
- 清理 `backend/node_modules` 与 `bin1/scripts/node_modules`

```bash
./cleanup.sh
```

## 许可与声明

仅供学习与研究使用，请在合规范围内使用本项目。
