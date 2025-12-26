/**
 * 订单管理模块
 * 处理订单相关的所有业务逻辑
 */

class OrderManager {
  /**
   * 初始化订单管理器。
   * @param {ApiService} apiService - API 服务实例
   * @param {StatusManager} statusManager - 状态管理实例
   */
  constructor(apiService, statusManager) {
    this.apiService = apiService;
    this.statusManager = statusManager;
    this.cachedOrders = []; // 存储从一键运行获取的订单数据
    this.cachedStep1Data = null; // 存储步骤1的数据，用于获取手机号
  }

  /**
   * 存储从一键运行流程中获取的订单数据。
   * @param {Object} result - 完整流程结果
   * @returns {void}
   */
  storeOrdersFromFlow(result) {
    try {
      console.log("🔍 开始存储订单数据，完整结果:", result);

      // 保存步骤1的数据，用于获取手机号
      this.cachedStep1Data = result.step1_decrypt_data;
      console.log("保存步骤1数据:", this.cachedStep1Data);

      // 优先使用步骤3的结果（更完整的订单信息）
      const step3Data = result.step3_orderId;
      console.log("步骤3数据:", step3Data);

      if (step3Data && step3Data.data && !step3Data.error) {
        console.log("步骤3.data:", step3Data.data);
        console.log("步骤3.data类型:", typeof step3Data.data);

        // 步骤3的结果是单个订单的详细信息，需要转换为数组格式
        let orderData = step3Data.data;

        // 如果data是字符串，尝试解析为JSON
        if (typeof orderData === "string") {
          try {
            orderData = JSON.parse(orderData);
          } catch (e) {
            console.warn("解析步骤3数据失败:", e.message);
          }
        }

        if (orderData && typeof orderData === "object") {
          // 将单个订单数据转换为数组格式，以便与现有代码兼容
          this.cachedOrders = [orderData];
          console.log(
            "✅ 已存储步骤3订单数据:",
            this.cachedOrders.length,
            "个订单"
          );
          console.log("订单数据详情:", this.cachedOrders);

          // 自动填充查询订单的手机号码
          this.autoFillQueryPhoneNumber(result);

          // 如果当前在查询订单标签页，自动显示订单
          this.autoDisplayCachedOrders();
          return;
        }
      }

      // 如果步骤3没有有效数据，查询订单功能不回退，直接使用步骤3数据
      console.log("⚠️ 步骤3数据无效，查询订单功能不回退，直接使用步骤3数据");

      // 对于查询订单功能，即使步骤3数据无效也不回退到步骤2
      // 保持使用步骤3的数据结构，即使数据可能不完整
      if (step3Data) {
        console.log("查询订单功能：使用步骤3数据结构，不回退到步骤2");
        // 尝试从步骤3数据中提取任何可用的订单信息
        let orderData = step3Data.data;
        if (typeof orderData === "string") {
          try {
            orderData = JSON.parse(orderData);
          } catch (e) {
            console.warn("解析步骤3数据失败:", e.message);
            orderData = null;
          }
        }

        if (orderData && typeof orderData === "object") {
          this.cachedOrders = [orderData];
        } else {
          // 即使数据无效，也保持空数组，不回退到步骤2
          this.cachedOrders = [];
        }

        console.log("查询订单功能：已设置订单数据，不回退到步骤2");

        // 自动填充查询订单的手机号码
        this.autoFillQueryPhoneNumber(result);

        // 如果当前在查询订单标签页，自动显示订单
        this.autoDisplayCachedOrders();
        return;
      }

      // 如果连步骤3数据都没有，则保持空数组
      this.cachedOrders = [];
      console.log("查询订单功能：无步骤3数据，保持空数组，不回退到步骤2");

      // 自动填充查询订单的手机号码
      this.autoFillQueryPhoneNumber(result);

      // 如果当前在查询订单标签页，自动显示订单
      this.autoDisplayCachedOrders();
      return;

      // 以下代码已被注释，因为查询订单功能不再回退到步骤2
      /*
      console.log("⚠️ 步骤3数据无效，回退到步骤2数据");
      const step2Data = result.step2_custNo;
      console.log("步骤2数据:", step2Data);

      if (step2Data && step2Data.data) {
        console.log("步骤2.data:", step2Data.data);
        console.log("步骤2.data类型:", typeof step2Data.data);
        console.log("是否为数组:", Array.isArray(step2Data.data));

        if (Array.isArray(step2Data.data)) {
          this.cachedOrders = step2Data.data;
          console.log(
            "✅ 已存储步骤2订单数据:",
            this.cachedOrders.length,
            "个订单"
          );
          console.log("订单数据详情:", this.cachedOrders);

          // 自动填充查询订单的手机号码
          this.autoFillQueryPhoneNumber(result);

          // 如果当前在查询订单标签页，自动显示订单
          this.autoDisplayCachedOrders();
        } else {
          console.log("⚠️ 步骤2.data不是数组，尝试其他方式提取订单数据");

          // 尝试从其他可能的字段中提取订单数据
          if (step2Data.data && typeof step2Data.data === "object") {
            // 检查是否有订单列表字段
            const possibleOrderFields = ["orders", "orderList", "data", "list"];
            for (const field of possibleOrderFields) {
              if (
                step2Data.data[field] &&
                Array.isArray(step2Data.data[field])
              ) {
                this.cachedOrders = step2Data.data[field];
                console.log(
                  `✅ 从字段 ${field} 中提取到订单数据:`,
                  this.cachedOrders.length,
                  "个订单"
                );
                console.log("订单数据详情:", this.cachedOrders);

                // 自动填充查询订单的手机号码
                this.autoFillQueryPhoneNumber(result);

                // 如果当前在查询订单标签页，自动显示订单
                this.autoDisplayCachedOrders();
                return;
              }
            }
          }

          console.log("⚠️ 步骤2中未找到有效的订单数据");
        }
      } else {
        console.log("⚠️ 步骤2数据为空或格式不正确");
        console.log("步骤2数据结构:", step2Data);
      }
      */
    } catch (error) {
      console.error("存储订单数据失败:", error);
    }
  }

  /**
   * 自动填充查询订单的手机号码。
   * @param {Object} result - 完整流程结果
   * @returns {void}
   */
  autoFillQueryPhoneNumber(result) {
    try {
      // 从步骤1的结果中提取手机号码
      const step1Data = result.step1_decrypt_data;
      console.log("步骤1数据:", step1Data);

      if (step1Data && step1Data.data) {
        let phone = null;

        // 尝试从步骤1的data中提取手机号
        if (typeof step1Data.data === "string") {
          try {
            const parsedData = JSON.parse(step1Data.data);
            phone = parsedData.phone;
          } catch (e) {
            console.warn("解析步骤1数据失败:", e.message);
          }
        } else if (step1Data.data && typeof step1Data.data === "object") {
          phone = step1Data.data.phone;
        }

        if (phone) {
          const queryPhoneInput = document.getElementById("queryPhoneNo");
          if (queryPhoneInput && !queryPhoneInput.value) {
            queryPhoneInput.value = phone;
            console.log("✅ 已自动填充查询订单手机号码:", phone);
          }
        } else {
          console.log("⚠️ 步骤1中未找到手机号码");
        }
      } else {
        console.log("⚠️ 步骤1数据为空或格式不正确");
      }
    } catch (error) {
      console.error("自动填充手机号码失败:", error);
    }
  }

  /**
   * 自动显示缓存的订单数据。
   * @returns {void}
   */
  autoDisplayCachedOrders() {
    // 检查当前是否在查询订单标签页
    const queryTab = document.getElementById("tab-query");
    if (queryTab && queryTab.classList.contains("active")) {
      if (this.cachedOrders && this.cachedOrders.length > 0) {
        this.displayOrders(this.cachedOrders);
        this.statusManager.showQueryStatus(
          `已显示缓存的订单数据，共 ${this.cachedOrders.length} 个订单`,
          "success"
        );
      }
    }
  }

  /**
   * 处理查询订单（查询订单标签页）。
   * @returns {Promise<void>}
   */
  async handleQueryOrders() {
    // 查询订单模块只显示从链接解析获取的订单数据，不调用API
    if (this.cachedOrders && this.cachedOrders.length > 0) {
      console.log("显示缓存的订单数据");
      this.displayOrders(this.cachedOrders);
      this.statusManager.showQueryStatus(
        `显示订单数据，共 ${this.cachedOrders.length} 个订单`,
        "success"
      );
    } else {
      console.log("没有缓存的订单数据");
      this.displayOrders([]);
      this.statusManager.showQueryStatus(
        "暂无订单数据，请先执行链接解析获取订单信息",
        "warning"
      );
    }
  }

  /**
   * 显示订单列表。
   * @param {Array<Object>} orders - 订单数组
   * @returns {void}
   */
  displayOrders(orders) {
    const orderList = document.getElementById("orderList");
    const orderCount = document.getElementById("orderCount");

    if (!orderList || !orderCount) return;

    // 更新订单数量
    orderCount.textContent = `共 ${orders.length} 个订单`;

    if (orders.length === 0) {
      orderList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <div class="empty-text">暂无订单数据</div>
          <div class="empty-desc">请检查手机号码或稍后再试</div>
        </div>
      `;
      return;
    }

    // 渲染订单列表
    orderList.innerHTML = orders
      .map((order) => this.renderOrderItem(order))
      .join("");
  }

  /**
   * 渲染单个订单项。
   * @param {Object} order - 订单对象
   * @returns {string} 订单 HTML 片段
   */
  renderOrderItem(order) {
    const statusClass = this.getOrderStatusClass(order.status);
    const statusText = this.getOrderStatusText(order.status);
    const orderId =
      order.h5OrderId || order.orderId || order.id || order.orderNo || "未知";
    const isCancelled =
      order.status === "CANCELLED" ||
      order.status === "cancelled" ||
      order.status === 3;
    const isCompleted =
      order.status === "COMPLETED" || order.status === "completed";
    const canCancel = !isCancelled && !isCompleted;

    // 调试输出订单数据结构
    console.log("渲染订单项:", order);

    return `
      <div class="order-item ${isCancelled ? "order-cancelled" : ""} ${
      isCompleted ? "order-completed" : ""
    }">
        <div class="order-header">
          <div class="order-id">订单号: ${orderId}</div>
          <div class="order-status ${statusClass}">
            <span class="status-icon">${this.getStatusIcon(order.status)}</span>
            ${statusText}
          </div>
        </div>
        <div class="order-details">
          <div class="order-detail-item">
            <div class="order-detail-label">用户名</div>
            <div class="order-detail-value">${
              order.userName || order.user_name || "未知"
            }</div>
          </div>
          <div class="order-detail-item">
            <div class="order-detail-label">手机号</div>
            <div class="order-detail-value">${
              order.telephone || order.phone || order.phoneNo || "未知"
            }</div>
          </div>
          <div class="order-detail-item">
            <div class="order-detail-label">贵宾厅代码</div>
            <div class="order-detail-value">${
              order.loungeCode || order.lounge_code || "未知"
            }</div>
          </div>
          <div class="order-detail-item">
            <div class="order-detail-label">服务名称</div>
            <div class="order-detail-value">${
              order.serverName || order.server_name || "机场贵宾厅"
            }</div>
          </div>
          <div class="order-detail-item">
            <div class="order-detail-label">剩余权益点数</div>
            <div class="order-detail-value">${
              order.rightsRemainPoint || order.rights_remain_point || "未知"
            }</div>
          </div>
          <div class="order-detail-item">
            <div class="order-detail-label">订单时间</div>
            <div class="order-detail-value">${
              order.orderTime || order.order_time || order.createTime || "未知"
            }</div>
          </div>
          <div class="order-detail-item">
            <div class="order-detail-label">结束时间</div>
            <div class="order-detail-value">${
              order.endTime || order.end_time || "未知"
            }</div>
          </div>
          ${
            order.couponNum
              ? `
          <div class="order-detail-item">
            <div class="order-detail-label">优惠券号码</div>
            <div class="order-detail-value">${
              order.couponNum || order.coupon_num || "未知"
            }</div>
          </div>
          `
              : ""
          }
        </div>
        <div class="order-actions">
          <button 
            class="btn-change-lounge ${!canCancel ? "btn-disabled" : ""}" 
            onclick="${
              canCancel
                ? `window.app.orderManager.showChangeLoungeModal('${orderId}', '${
                    order.loungeCode || order.lounge_code || ""
                  }')`
                : "return false;"
            }"
            ${!canCancel ? "disabled" : ""}
            title="${!canCancel ? "该订单无法更换贵宾厅" : "点击更换贵宾厅"}"
            style="
              background: linear-gradient(135deg, #4f8cff 0%, #00d4ff 100%);
              margin-right: 8px;
            "
          >
            <span class="btn-icon">🔄</span>
            更换贵宾厅
          </button>
          <button 
            class="btn-cancel ${!canCancel ? "btn-disabled" : ""}" 
            onclick="${
              canCancel
                ? `window.app.orderManager.cancelOrder('${orderId}')`
                : "return false;"
            }"
            ${!canCancel ? "disabled" : ""}
            title="${!canCancel ? "该订单无法取消" : "点击取消订单"}"
          >
            <span class="btn-icon">${
              canCancel ? "❌" : isCancelled ? "🚫" : "✅"
            }</span>
            ${isCancelled ? "已取消" : isCompleted ? "已完成" : "取消订单"}
          </button>
        </div>
      </div>
    `;
  }

  /**
   * 获取状态图标。
   * @param {string} status - 状态值
   * @returns {string} 图标字符
   */
  getStatusIcon(status) {
    switch (status) {
      case "ACTIVE":
      case 1: // 进行中
      case 2: // 可用
        return "🟢";
      case "PENDING":
        return "🟡";
      case "CANCELLED":
      case "cancelled":
      case 3: // 已取消
        return "🔴";
      case "COMPLETED":
      case "completed":
        return "✅";
      default:
        return "❓";
    }
  }

  /**
   * 获取订单状态样式类。
   * @param {string} status - 订单状态
   * @returns {string} 状态样式类
   */
  getOrderStatusClass(status) {
    switch (status) {
      case "ACTIVE":
      case "PENDING":
      case 1: // 进行中
      case 2: // 可用
        return "active";
      case "CANCELLED":
      case 3: // 已取消
        return "cancelled";
      case "COMPLETED":
        return "completed";
      default:
        return "active";
    }
  }

  /**
   * 获取订单状态文本。
   * @param {string} status - 订单状态
   * @returns {string} 状态文本
   */
  getOrderStatusText(status) {
    switch (status) {
      case "ACTIVE":
      case 1:
        return "进行中";
      case "PENDING":
        return "待处理";
      case 2:
        return "可用";
      case "CANCELLED":
      case 3:
        return "已取消";
      case "COMPLETED":
        return "已完成";
      default:
        return "未知";
    }
  }

  /**
   * 取消订单。
   * @param {string} orderId - 订单号
   * @returns {Promise<void>}
   */
  async cancelOrder(orderId) {
    if (!orderId) {
      this.statusManager.showQueryStatus("订单ID不能为空", "error");
      return;
    }

    console.log("🔍 取消订单调试信息:");
    console.log("订单ID:", orderId);
    console.log("订单ID类型:", typeof orderId);
    console.log("订单ID长度:", orderId.length);

    // 显示订单详情
    let orderInfo = "";
    if (this.cachedOrders && this.cachedOrders.length > 0) {
      const order = this.cachedOrders.find(
        (order) =>
          (order.h5OrderId || order.orderId || order.id || order.orderNo) ===
          orderId
      );
      if (order) {
        console.log("找到的订单详情:", order);
        orderInfo = `\n\n订单详情：\n订单号: ${
          order.h5OrderId || order.orderId || order.id || order.orderNo
        }\n贵宾厅: ${
          order.loungeName || order.lounge_name || order.name || "未知"
        }`;
      } else {
        console.log("⚠️ 在缓存订单中未找到该订单ID");
        console.log(
          "所有缓存的订单ID:",
          this.cachedOrders.map(
            (o) => o.h5OrderId || o.orderId || o.id || o.orderNo
          )
        );
      }
    }

    // 使用自定义弹窗替换原生confirm
    try {
      const confirmed = await window.modalManager.confirm(
        `确定要取消这个订单吗？${orderInfo}`,
        {
          confirmText: "确认取消",
          cancelText: "取消操作",
          confirmType: "danger",
        }
      );

      if (!confirmed) {
        return;
      }
    } catch (error) {
      console.error("弹窗显示失败:", error);
      // 如果自定义弹窗失败，回退到原生confirm
      if (!confirm("确定要取消这个订单吗？")) {
        return;
      }
    }

    try {
      this.statusManager.showQueryStatus("正在取消订单...", "info");

      // 使用简化的参数：只需要 orderId, sdTimestamp
      const cancelData = {
        orderId,
        sdTimestamp: Date.now(),
      };

      console.log("取消订单请求数据:", cancelData);
      const response = await this.apiService.cancelOrder(cancelData);

      console.log("取消订单响应:", response);

      // 修复响应处理逻辑
      if (response.ok) {
        const result = response.result;
        console.log("取消订单结果:", result);

        // 检查业务逻辑是否成功
        if (result && result.success === true) {
          this.statusManager.showQueryStatus("订单取消成功", "success");

          // 更新本地缓存的订单状态
          this.updateLocalOrderStatus(orderId, "CANCELLED");

          // 重新查询订单列表
          setTimeout(() => {
            this.handleQueryOrders();
          }, 1000);
        } else {
          // 即使API调用成功，但业务逻辑失败
          const errorMessage = result?.message || "取消订单失败";
          this.statusManager.showQueryStatus(
            `取消失败: ${errorMessage}`,
            "error"
          );
          console.error("取消订单业务逻辑失败:", result);
        }
      } else {
        // API调用失败
        const errorMessage =
          response.error || response.result?.message || "网络请求失败";
        this.statusManager.showQueryStatus(
          `取消失败: ${errorMessage}`,
          "error"
        );
        console.error("取消订单API调用失败:", response);
      }
    } catch (error) {
      console.error("取消订单失败:", error);
      this.statusManager.showQueryStatus(`取消失败: ${error.message}`, "error");
    }
  }

  /**
   * 更新本地缓存的订单状态。
   * @param {string} orderId - 订单号
   * @param {string} newStatus - 新状态
   * @returns {void}
   */
  updateLocalOrderStatus(orderId, newStatus) {
    if (this.cachedOrders && this.cachedOrders.length > 0) {
      const orderIndex = this.cachedOrders.findIndex(
        (order) =>
          (order.h5OrderId || order.orderId || order.id || order.orderNo) ===
          orderId
      );

      if (orderIndex !== -1) {
        this.cachedOrders[orderIndex].status = newStatus;
        console.log(`✅ 已更新本地订单状态: ${orderId} -> ${newStatus}`);

        // 立即更新UI显示
        this.displayOrders(this.cachedOrders);
      }
    }
  }

  /**
   * 显示更换贵宾厅弹窗。
   * @param {string} orderId - 订单号
   * @param {string} currentLoungeCode - 当前贵宾厅代码
   * @returns {void}
   */
  showChangeLoungeModal(orderId, currentLoungeCode) {
    console.log("显示更换贵宾厅弹窗:", orderId, currentLoungeCode);

    // 创建更换贵宾厅弹窗的HTML
    const modalHtml = `
      <div id="changeLoungeModal" class="custom-modal" style="display: block; position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999;">
        <div class="custom-modal-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5);"></div>
        <div class="custom-modal-content" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; background: var(--card); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 12px; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);">
          <div class="custom-modal-header" style="padding: 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
            <h3 style="margin: 0; color: var(--text); font-size: 16px; font-weight: 600;">更换贵宾厅</h3>
          </div>
          <div class="custom-modal-body" style="padding: 16px;">
            <div class="input-group" style="margin-bottom: 16px;">
              <label class="input-label" style="display: block; margin-bottom: 8px; color: var(--muted); font-size: 14px; font-weight: 500;">当前贵宾厅代码:</label>
              <input type="text" id="currentLoungeCode" value="${currentLoungeCode}" readonly 
                     style="width: 100%; padding: 10px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px; color: var(--muted); font-size: 14px;">
            </div>
            <div class="input-group" style="margin-bottom: 16px;">
              <label class="input-label" style="display: block; margin-bottom: 8px; color: var(--muted); font-size: 14px; font-weight: 500;">选择新贵宾厅:</label>
              <div class="lounge-selector" style="position: relative; width: 100%;">
                <input
                  type="text"
                  id="newLoungeSearchInput"
                  placeholder="搜索贵宾厅名称或代码..."
                  autocomplete="off"
                  style="width: 100%; padding: 10px; background: var(--card); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px; color: var(--text); font-size: 14px;"
                />
                <div
                  class="lounge-dropdown"
                  id="newLoungeDropdown"
                  style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: var(--card); border: 1px solid rgba(255, 255, 255, 0.08); border-top: none; border-radius: 0 0 6px 6px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); z-index: 1000; max-height: 200px; overflow-y: auto;"
                >
                  <div class="lounge-options" id="newLoungeOptions"></div>
                </div>
                <input type="hidden" id="newLoungeCode" value="" />
              </div>
            </div>
            <div style="color: var(--muted); font-size: 12px; line-height: 1.4;">
              <p style="margin: 0;">💡 提示：输入贵宾厅名称或代码进行搜索，选择新的贵宾厅后点击确认更换。</p>
            </div>
          </div>
          <div class="custom-modal-footer" style="padding: 16px; border-top: 1px solid rgba(255, 255, 255, 0.06); display: flex; gap: 12px; justify-content: flex-end;">
            <button id="changeLoungeCancel" class="btn-secondary" style="padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; font-size: 14px; font-weight: 500;">取消</button>
            <button id="changeLoungeConfirm" class="btn-primary" disabled style="padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; font-size: 14px; font-weight: 500; background: linear-gradient(135deg, #4f8cff 0%, #00d4ff 100%); color: white;">确认更换</button>
          </div>
        </div>
      </div>
    `;

    // 移除已存在的弹窗
    const existingModal = document.getElementById("changeLoungeModal");
    if (existingModal) {
      existingModal.remove();
    }

    // 添加新弹窗到页面
    document.body.insertAdjacentHTML("beforeend", modalHtml);

    // 绑定事件
    this.bindChangeLoungeModalEvents(orderId);
  }

  /**
   * 绑定更换贵宾厅弹窗事件。
   * @param {string} orderId - 订单号
   * @returns {void}
   */
  bindChangeLoungeModalEvents(orderId) {
    const modal = document.getElementById("changeLoungeModal");
    const cancelBtn = document.getElementById("changeLoungeCancel");
    const confirmBtn = document.getElementById("changeLoungeConfirm");
    const searchInput = document.getElementById("newLoungeSearchInput");
    const dropdown = document.getElementById("newLoungeDropdown");
    const options = document.getElementById("newLoungeOptions");
    const hiddenInput = document.getElementById("newLoungeCode");

    // 取消按钮事件
    cancelBtn.addEventListener("click", () => {
      modal.remove();
    });

    // 点击遮罩层关闭弹窗
    modal
      .querySelector(".custom-modal-overlay")
      .addEventListener("click", () => {
        modal.remove();
      });

    // 搜索输入事件
    let searchTimeout;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      const query = e.target.value.trim();

      if (query.length < 2) {
        dropdown.style.display = "none";
        confirmBtn.disabled = true;
        return;
      }

      searchTimeout = setTimeout(() => {
        this.searchLoungesForChange(
          query,
          options,
          dropdown,
          hiddenInput,
          confirmBtn
        );
      }, 300);
    });

    // 确认按钮事件
    confirmBtn.addEventListener("click", () => {
      const newLoungeCode = hiddenInput.value;
      if (newLoungeCode) {
        this.changeLounge(orderId, newLoungeCode);
        modal.remove();
      }
    });
  }

  /**
   * 搜索贵宾厅（用于更换贵宾厅弹窗）。
   * @param {string} query - 搜索关键词
   * @param {HTMLElement} optionsContainer - 选项容器
   * @param {HTMLElement} dropdown - 下拉容器
   * @param {HTMLInputElement} hiddenInput - 隐藏字段
   * @param {HTMLButtonElement} confirmBtn - 确认按钮
   * @returns {Promise<void>}
   */
  async searchLoungesForChange(
    query,
    optionsContainer,
    dropdown,
    hiddenInput,
    confirmBtn
  ) {
    try {
      // 如果查询为空，显示热门贵宾厅
      if (!query || query.trim().length === 0) {
        optionsContainer.innerHTML =
          '<div class="lounge-loading">💡 请输入贵宾厅名称或代码进行搜索...</div>';
        dropdown.style.display = "block";
        return;
      }

      // 如果查询太短，显示提示
      if (query.trim().length === 1) {
        optionsContainer.innerHTML =
          '<div class="lounge-loading">💡 请输入更多字符进行搜索...</div>';
        dropdown.style.display = "block";
        return;
      }

      // 显示加载状态
      optionsContainer.innerHTML =
        '<div class="lounge-loading">🔍 搜索中...</div>';
      dropdown.style.display = "block";

      // 使用与创建订单相同的API调用方式
      let url = "/api/lounges";
      if (query.trim()) {
        url = `/api/lounges/search?q=${encodeURIComponent(
          query.trim()
        )}&limit=20`;
      } else {
        url += `?limit=20`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || "获取贵宾厅数据失败");
      }

      const lounges = result.data || [];

      if (lounges.length > 0) {
        // 使用与创建订单相同的样式
        optionsContainer.innerHTML = lounges
          .map(
            (lounge) => `
          <div class="lounge-option" data-code="${lounge.loungeCode}">
            <div class="lounge-name">${lounge.loungeName || "未知贵宾厅"}</div>
            <div class="lounge-details">
              <span class="lounge-code">${lounge.loungeCode}</span>
              <span class="lounge-location">${lounge.cityName || ""} ${
              lounge.siteName || ""
            } ${lounge.terminalName || ""}</span>
              <span class="lounge-hours">${
                lounge.businessHours || "营业时间未知"
              }</span>
            </div>
          </div>
        `
          )
          .join("");

        // 绑定选项点击事件
        optionsContainer
          .querySelectorAll(".lounge-option")
          .forEach((option) => {
            option.addEventListener("click", () => {
              const code = option.dataset.code;
              const lounge = lounges.find((l) => l.loungeCode === code);

              if (lounge) {
                hiddenInput.value = code;
                document.getElementById(
                  "newLoungeSearchInput"
                ).value = `${lounge.loungeName} (${lounge.loungeCode})`;
                dropdown.style.display = "none";
                confirmBtn.disabled = false;

                // 添加选中状态
                optionsContainer
                  .querySelectorAll(".lounge-option")
                  .forEach((opt) => {
                    opt.classList.remove("selected");
                  });
                option.classList.add("selected");
              }
            });
          });

        dropdown.style.display = "block";
      } else {
        optionsContainer.innerHTML =
          '<div class="lounge-no-results">未找到匹配的贵宾厅</div>';
        dropdown.style.display = "block";
      }
    } catch (error) {
      console.error("搜索贵宾厅失败:", error);
      optionsContainer.innerHTML =
        '<div class="lounge-error">❌ 搜索失败，请稍后重试</div>';
      dropdown.style.display = "block";
    }
  }

  /**
   * 更换贵宾厅。
   * @param {string} orderId - 订单号
   * @param {string} newLoungeCode - 新贵宾厅代码
   * @returns {Promise<void>}
   */
  async changeLounge(orderId, newLoungeCode) {
    if (!orderId || !newLoungeCode) {
      this.statusManager.showQueryStatus(
        "订单ID和新贵宾厅代码不能为空",
        "error"
      );
      return;
    }

    console.log("更换贵宾厅:", orderId, newLoungeCode);

    try {
      this.statusManager.showQueryStatus("正在更换贵宾厅...", "info");

      const changeData = {
        orderId,
        loungeCode: newLoungeCode,
        sdTimestamp: Date.now(),
      };

      console.log("更换贵宾厅请求数据:", changeData);
      const response = await this.apiService.changeLounge(changeData);

      console.log("更换贵宾厅响应:", response);

      if (response.ok) {
        const result = response.result;
        console.log("更换贵宾厅结果:", result);

        if (result && result.success === true) {
          this.statusManager.showQueryStatus("贵宾厅更换成功", "success");

          // 更新本地缓存的订单贵宾厅信息
          this.updateLocalOrderLounge(orderId, newLoungeCode);

          // 重新显示订单列表
          setTimeout(() => {
            this.handleQueryOrders();
          }, 1000);
        } else {
          const errorMessage = result?.message || "更换贵宾厅失败";
          console.log("显示错误消息:", errorMessage);
          console.log("完整result对象:", result);
          this.statusManager.showQueryStatus(
            `更换失败: ${errorMessage}`,
            "error"
          );
          console.error("更换贵宾厅业务逻辑失败:", result);
        }
      } else {
        const errorMessage =
          response.error || response.result?.message || "网络请求失败";
        this.statusManager.showQueryStatus(
          `更换失败: ${errorMessage}`,
          "error"
        );
        console.error("更换贵宾厅API调用失败:", response);
      }
    } catch (error) {
      console.error("更换贵宾厅失败:", error);
      this.statusManager.showQueryStatus(`更换失败: ${error.message}`, "error");
    }
  }

  /**
   * 更新本地缓存的订单贵宾厅信息。
   * @param {string} orderId - 订单号
   * @param {string} newLoungeCode - 新贵宾厅代码
   * @returns {void}
   */
  updateLocalOrderLounge(orderId, newLoungeCode) {
    if (this.cachedOrders && this.cachedOrders.length > 0) {
      const orderIndex = this.cachedOrders.findIndex(
        (order) =>
          (order.h5OrderId || order.orderId || order.id || order.orderNo) ===
          orderId
      );

      if (orderIndex !== -1) {
        this.cachedOrders[orderIndex].loungeCode = newLoungeCode;
        console.log(`✅ 已更新本地订单贵宾厅: ${orderId} -> ${newLoungeCode}`);

        // 立即更新UI显示
        this.displayOrders(this.cachedOrders);
      }
    }
  }

  /**
   * 处理创建订单（链接解析标签页）。
   * @param {string} currentData - 当前 data 参数
   * @param {string|null} currentActivityId - 当前活动 ID
   * @param {string|null} currentCardTypeCode - 当前卡类型代码
   * @returns {Promise<void>}
   */
  async handleCreateOrder(currentData, currentActivityId, currentCardTypeCode) {
    const phoneNo = document.getElementById("createPhoneNo")?.value?.trim();
    const name = document.getElementById("createName")?.value?.trim();
    let loungeCode = document.getElementById("createLoungeCode")?.value?.trim();
    const accompanierNumber =
      document.getElementById("createAccompanierNumber")?.value || "0";

    // 如果隐藏字段中没有贵宾厅代码，尝试从输入框中提取
    if (!loungeCode) {
      const searchInput = document
        .getElementById("loungeSearchInput")
        ?.value?.trim();
      if (searchInput) {
        // 尝试从输入框中提取贵宾厅代码
        // 格式可能是 "贵宾厅名称 (代码)" 或直接是代码
        const match = searchInput.match(/\(([^)]+)\)$/);
        if (match) {
          // 如果匹配到 "名称 (代码)" 格式，提取代码
          loungeCode = match[1];
        } else {
          // 否则直接使用输入的值作为代码
          loungeCode = searchInput;
        }
        console.log(`从输入框提取贵宾厅代码: ${loungeCode}`);
      }
    }

    // 验证必需参数
    if (!phoneNo || !name || !loungeCode) {
      this.statusManager.showCreateOrderStatus(
        "请填写手机号码、姓名和贵宾厅代码",
        "error"
      );
      return;
    }

    // 检查是否有从链接解析得到的data参数
    if (!currentData) {
      this.statusManager.showCreateOrderStatus(
        "请先通过链接解析获取 data 参数",
        "error"
      );
      return;
    }

    try {
      this.statusManager.showCreateOrderStatus("正在创建订单...", "info");

      const orderData = {
        phoneNo,
        name,
        loungeCode,
        accompanierNumber,
        data: currentData, // 使用从链接解析得到的data参数
      };

      // 如果当前有从链接解析得到的activityId，则使用它
      if (currentActivityId) {
        orderData.activityId = currentActivityId;
        console.log("使用从链接解析得到的activityId:", currentActivityId);
      }

      // 如果当前有从链接解析得到的cardTypeCode，则使用它
      if (currentCardTypeCode) {
        orderData.bespeakCardType = currentCardTypeCode;
        console.log("使用从链接解析得到的cardTypeCode:", currentCardTypeCode);
      }

      const resp = await this.apiService.createOrder(orderData);

      if (resp.ok) {
        const result = resp.result;
        this.displayCreateOrderResult(result);
      } else {
        throw new Error(resp.error || "创建订单失败");
      }
    } catch (e) {
      this.handleCreateOrderError(e);
    }
  }

  /**
   * 处理创建订单（创建订单标签页）。
   * @param {string} currentData - 当前 data 参数
   * @param {string|null} currentActivityId - 当前活动 ID
   * @param {string|null} currentCardTypeCode - 当前卡类型代码
   * @returns {Promise<void>}
   */
  async handleCreateOrderTab(
    currentData,
    currentActivityId,
    currentCardTypeCode
  ) {
    const phoneNo = document
      .getElementById("createPhoneNoOrder")
      ?.value?.trim();
    const name = document.getElementById("createNameOrder")?.value?.trim();
    let loungeCode = document
      .getElementById("createLoungeCodeOrder")
      ?.value?.trim();
    const accompanierNumber =
      document.getElementById("createAccompanierNumberOrder")?.value || "0";

    // 如果隐藏字段中没有贵宾厅代码，尝试从输入框中提取
    if (!loungeCode) {
      const searchInput = document
        .getElementById("loungeSearchInputOrder")
        ?.value?.trim();
      if (searchInput) {
        // 尝试从输入框中提取贵宾厅代码
        // 格式可能是 "贵宾厅名称 (代码)" 或直接是代码
        const match = searchInput.match(/\(([^)]+)\)$/);
        if (match) {
          // 如果匹配到 "名称 (代码)" 格式，提取代码
          loungeCode = match[1];
        } else {
          // 否则直接使用输入的值作为代码
          loungeCode = searchInput;
        }
        console.log(`从输入框提取贵宾厅代码: ${loungeCode}`);
      }
    }

    // 验证必需参数
    if (!phoneNo || !name || !loungeCode) {
      this.statusManager.showCreateOrderStatusTab(
        "请填写手机号码、姓名和贵宾厅代码",
        "error"
      );
      return;
    }

    try {
      this.statusManager.showCreateOrderStatusTab(
        "正在获取用户信息...",
        "info"
      );

      // 先获取用户信息
      let userInfo = null;
      try {
        const userInfoResp = await this.apiService.getUserInfo(
          currentCardTypeCode || window.CONFIG?.CARD_TYPE_CODE,
          currentData // 传递当前解析的data参数
        );
        if (userInfoResp.ok) {
          userInfo = userInfoResp.data;
          this.statusManager.showCreateOrderStatusTab(
            "用户信息获取成功，正在创建订单...",
            "info"
          );
        } else {
          console.warn("获取用户信息失败，使用默认参数创建订单");
          this.statusManager.showCreateOrderStatusTab(
            "用户信息获取失败，使用默认参数创建订单...",
            "warning"
          );
        }
      } catch (userInfoError) {
        console.warn("获取用户信息失败:", userInfoError);
        this.statusManager.showCreateOrderStatusTab(
          "用户信息获取失败，使用默认参数创建订单...",
          "warning"
        );
      }

      // 创建订单（如果当前有data参数则使用，否则让后端自动获取用户信息）
      const orderData = {
        phoneNo,
        name,
        loungeCode,
        accompanierNumber,
      };

      // 如果当前有从链接解析得到的data参数，则使用它
      if (currentData) {
        orderData.data = currentData;
        orderData.autoGetUserInfo = false; // 不需要自动获取用户信息
      } else {
        orderData.autoGetUserInfo = true; // 启用自动获取用户信息
      }

      // 如果当前有从链接解析得到的activityId，则使用它
      if (currentActivityId) {
        orderData.activityId = currentActivityId;
        console.log("使用从链接解析得到的activityId:", currentActivityId);
      }

      // 如果当前有从链接解析得到的cardTypeCode，则使用它
      if (currentCardTypeCode) {
        orderData.bespeakCardType = currentCardTypeCode;
        console.log("使用从链接解析得到的cardTypeCode:", currentCardTypeCode);
      }

      const resp = await this.apiService.createOrder(orderData);

      if (resp.ok) {
        const result = resp.result;
        // 在结果中显示用户信息
        if (resp.userInfo) {
          result.userInfo = resp.userInfo;
          result.usedAutoData = resp.usedAutoData;
        }
        this.displayCreateOrderResultTab(result);
      } else {
        throw new Error(resp.error || "创建订单失败");
      }
    } catch (e) {
      this.handleCreateOrderErrorTab(e);
    }
  }

  /**
   * 显示创建订单结果。
   * @param {Object} result - 创建订单结果
   * @returns {void}
   */
  displayCreateOrderResult(result) {
    const createOrderResult = document.getElementById("createOrderResult");
    const createOrderOutput = document.getElementById("createOrderOutput");

    if (createOrderResult) createOrderResult.style.display = "block";
    if (createOrderOutput)
      createOrderOutput.textContent = JSON.stringify(result, null, 2);

    if (result.success) {
      this.statusManager.showCreateOrderStatus("订单创建成功！", "success");

      // 如果成功，显示订单详情
      if (result.orderData) {
        const orderData = result.orderData;
        let orderInfo = `订单创建成功！\n\n`;

        // 显示用户信息（如果可用）
        if (result.userInfo) {
          orderInfo += `用户信息：\n`;
          orderInfo += `用户名: ${result.userInfo.userName || "未知"}\n`;
          orderInfo += `手机号: ${result.userInfo.phone || "未知"}\n`;
          orderInfo += `卡类型: ${result.userInfo.cardTypeCode || "未知"}\n\n`;
        }

        // 显示是否使用了自动获取的数据
        if (result.usedAutoData) {
          orderInfo += `✅ 使用了自动获取的用户数据\n\n`;
        }

        orderInfo += `订单详情：\n`;
        orderInfo += `订单号: ${orderData.orderNo}\n`;
        orderInfo += `贵宾厅: ${orderData.loungeName}\n`;
        orderInfo += `地点: ${orderData.siteName} - ${orderData.terminalName}\n`;
        orderInfo += `预约人: ${orderData.name}\n`;
        orderInfo += `手机号: ${orderData.phoneNo}\n`;
        orderInfo += `预约时间: ${orderData.bespeakDate} ${orderData.bespeakTime}\n`;
        orderInfo += `状态: ${orderData.orderStatus}\n`;

        // 显示其他有用信息
        if (orderData.h5OrderNo)
          orderInfo += `H5订单号: ${orderData.h5OrderNo}\n`;
        if (orderData.couponCode)
          orderInfo += `优惠券代码: ${orderData.couponCode}\n`;
        if (orderData.commCode)
          orderInfo += `通信代码: ${orderData.commCode}\n`;
        if (orderData.redirectUrl)
          orderInfo += `重定向URL: ${orderData.redirectUrl}\n`;
        if (orderData.directUrl)
          orderInfo += `直接URL: ${orderData.directUrl}\n`;

        if (orderData.qrCode) orderInfo += `二维码: ${orderData.qrCode}\n`;
        if (orderData.verificationCode)
          orderInfo += `验证码: ${orderData.verificationCode}\n`;

        this.statusManager.showCreateOrderStatus(orderInfo, "success");
      }
    } else {
      this.statusManager.showCreateOrderStatus(
        `订单创建失败: ${result.message}`,
        "error"
      );
    }
  }

  /**
   * 处理创建订单错误。
   * @param {Error} error - 异常对象
   * @returns {void}
   */
  handleCreateOrderError(error) {
    const createOrderResult = document.getElementById("createOrderResult");
    const createOrderOutput = document.getElementById("createOrderOutput");

    if (createOrderResult) createOrderResult.style.display = "block";
    if (createOrderOutput) {
      createOrderOutput.textContent =
        "创建订单失败: " + (error && error.message ? error.message : error);
    }
    this.statusManager.showCreateOrderStatus(
      "创建订单失败: " + error.message,
      "error"
    );
  }

  /**
   * 显示创建订单结果（创建订单标签页）。
   * @param {Object} result - 创建订单结果
   * @returns {void}
   */
  displayCreateOrderResultTab(result) {
    const createOrderResult = document.getElementById("createOrderResultTab");
    const createOrderOutput = document.getElementById("createOrderOutputTab");

    if (createOrderResult) createOrderResult.style.display = "block";
    if (createOrderOutput)
      createOrderOutput.textContent = JSON.stringify(result, null, 2);

    if (result.success) {
      this.statusManager.showCreateOrderStatusTab("订单创建成功！", "success");

      // 如果成功，显示订单详情
      if (result.orderData) {
        const orderData = result.orderData;
        let orderInfo = `订单创建成功！\n\n`;

        // 显示用户信息（如果可用）
        if (result.userInfo) {
          orderInfo += `用户信息：\n`;
          orderInfo += `用户名: ${result.userInfo.userName || "未知"}\n`;
          orderInfo += `手机号: ${result.userInfo.phone || "未知"}\n`;
          orderInfo += `卡类型: ${result.userInfo.cardTypeCode || "未知"}\n\n`;
        }

        // 显示是否使用了自动获取的数据
        if (result.usedAutoData) {
          orderInfo += `✅ 使用了自动获取的用户数据\n\n`;
        }

        orderInfo += `订单详情：\n`;
        orderInfo += `订单号: ${orderData.orderNo}\n`;
        orderInfo += `贵宾厅: ${orderData.loungeName}\n`;
        orderInfo += `地点: ${orderData.siteName} - ${orderData.terminalName}\n`;
        orderInfo += `预约人: ${orderData.name}\n`;
        orderInfo += `手机号: ${orderData.phoneNo}\n`;
        orderInfo += `预约时间: ${orderData.bespeakDate} ${orderData.bespeakTime}\n`;
        orderInfo += `状态: ${orderData.orderStatus}\n`;

        // 显示其他有用信息
        if (orderData.h5OrderNo)
          orderInfo += `H5订单号: ${orderData.h5OrderNo}\n`;
        if (orderData.couponCode)
          orderInfo += `优惠券代码: ${orderData.couponCode}\n`;
        if (orderData.commCode)
          orderInfo += `通信代码: ${orderData.commCode}\n`;
        if (orderData.redirectUrl)
          orderInfo += `重定向URL: ${orderData.redirectUrl}\n`;
        if (orderData.directUrl)
          orderInfo += `直接URL: ${orderData.directUrl}\n`;

        if (orderData.qrCode) orderInfo += `二维码: ${orderData.qrCode}\n`;
        if (orderData.verificationCode)
          orderInfo += `验证码: ${orderData.verificationCode}\n`;

        this.statusManager.showCreateOrderStatusTab(orderInfo, "success");
      }
    } else {
      this.statusManager.showCreateOrderStatusTab(
        `订单创建失败: ${result.message}`,
        "error"
      );
    }
  }

  /**
   * 处理创建订单错误（创建订单标签页）。
   * @param {Error} error - 异常对象
   * @returns {void}
   */
  handleCreateOrderErrorTab(error) {
    const createOrderResult = document.getElementById("createOrderResultTab");
    const createOrderOutput = document.getElementById("createOrderOutputTab");

    if (createOrderResult) createOrderResult.style.display = "block";
    if (createOrderOutput) {
      createOrderOutput.textContent =
        "创建订单失败: " + (error && error.message ? error.message : error);
    }
    this.statusManager.showCreateOrderStatusTab(
      "创建订单失败: " + error.message,
      "error"
    );
  }
}

// 导出订单管理器类
window.OrderManager = OrderManager;
