/**
 * 链接管理模块
 * 处理专属链接生成相关的业务逻辑
 */

class LinkManager {
  /**
   * 初始化链接管理器。
   * @param {StatusManager} statusManager - 状态管理实例
   */
  constructor(statusManager) {
    this.statusManager = statusManager;
  }

  /**
   * 处理生成专属链接（链接解析标签页）。
   * @returns {Promise<void>}
   */
  async handleGenerateLink() {
    const userNameInput = document.getElementById("userNameInput");
    const typeSelect = document.getElementById("typeSelect");
    const orderUserNameInput = document.getElementById("orderUserNameInput");
    const btnGenerateLink = document.getElementById("btn-generate-link");

    if (!userNameInput || !typeSelect || !btnGenerateLink) return;

    const userName = userNameInput.value.trim();
    if (!userName) {
      this.statusManager.showStatus("请输入用户姓名", "error");
      return;
    }

    try {
      this.statusManager.showStatus("正在生成专属链接...", "info");

      // 生成专属链接，包含用户名参数
      const baseUrl = window.location.origin;
      const selectedType = typeSelect.value;
      let customUrl = `${baseUrl}/custom-page?name=${encodeURIComponent(
        userName
      )}&type=${selectedType}`;

      // 如果存在订单用户名，也添加到链接中
      let orderUserName = orderUserNameInput
        ? orderUserNameInput.value.trim()
        : null;

      // 如果链接解析标签页的订单用户名为空，尝试从二维码标签页获取
      if (!orderUserName) {
        const orderUserNameFromQR = document.getElementById(
          "orderUserNameInputQR"
        );
        if (orderUserNameFromQR && orderUserNameFromQR.value.trim()) {
          orderUserName = orderUserNameFromQR.value.trim();
          console.log("从二维码标签页获取订单用户名:", orderUserName);
        }
      }

      console.log("生成链接调试信息 (链接解析标签页):");
      console.log("userName:", userName);
      console.log("orderUserName:", orderUserName);
      console.log("orderUserNameInput元素:", orderUserNameInput);
      console.log(
        "orderUserNameInput.value:",
        orderUserNameInput ? orderUserNameInput.value : "元素不存在"
      );

      if (orderUserName && orderUserName !== userName) {
        customUrl += `&orderUserName=${encodeURIComponent(orderUserName)}`;
        console.log("添加了orderUserName参数到链接");
      } else {
        console.log(
          "未添加orderUserName参数，原因:",
          !orderUserName ? "orderUserName为空" : "orderUserName与userName相同"
        );
      }

      // 显示生成的链接
      this.statusManager.showStatus(`专属链接已生成: ${customUrl}`, "success");

      // 将链接复制到剪贴板
      try {
        await navigator.clipboard.writeText(customUrl);
        this.statusManager.showStatus(
          `专属链接已生成并复制到剪贴板: ${customUrl}`,
          "success"
        );
      } catch (e) {
        console.log("剪贴板复制失败，但链接已生成");
      }

      // 在页面上显示链接
      this.displayGeneratedLink(customUrl, btnGenerateLink);
    } catch (e) {
      this.statusManager.showStatus("生成链接失败: " + e.message, "error");
    }
  }

  /**
   * 处理生成专属链接（二维码标签页）。
   * @returns {Promise<void>}
   */
  async handleGenerateLinkTab() {
    const userNameInput = document.getElementById("userNameInputQR");
    const typeSelect = document.getElementById("typeSelectQR");
    const orderUserNameInput = document.getElementById("orderUserNameInputQR");
    const btnGenerateLink = document.getElementById("btn-generate-link-tab");

    if (!userNameInput || !typeSelect || !btnGenerateLink) return;

    const userName = userNameInput.value.trim();
    if (!userName) {
      this.statusManager.showStatus("请输入用户姓名", "error");
      return;
    }

    try {
      this.statusManager.showStatus("正在生成专属链接...", "info");

      // 生成专属链接，包含用户名参数
      const baseUrl = window.location.origin;
      const selectedType = typeSelect.value;
      let customUrl = `${baseUrl}/custom-page?name=${encodeURIComponent(
        userName
      )}&type=${selectedType}`;

      // 如果存在订单用户名，也添加到链接中
      let orderUserName = orderUserNameInput
        ? orderUserNameInput.value.trim()
        : null;

      // 如果二维码标签页的订单用户名为空，尝试从链接解析标签页获取
      if (!orderUserName) {
        const orderUserNameFromDecrypt =
          document.getElementById("orderUserNameInput");
        if (orderUserNameFromDecrypt && orderUserNameFromDecrypt.value.trim()) {
          orderUserName = orderUserNameFromDecrypt.value.trim();
          console.log("从链接解析标签页获取订单用户名:", orderUserName);
        }
      }

      console.log("生成链接调试信息 (二维码标签页):");
      console.log("userName:", userName);
      console.log("orderUserName:", orderUserName);
      console.log("orderUserNameInput元素:", orderUserNameInput);
      console.log(
        "orderUserNameInput.value:",
        orderUserNameInput ? orderUserNameInput.value : "元素不存在"
      );

      if (orderUserName && orderUserName !== userName) {
        customUrl += `&orderUserName=${encodeURIComponent(orderUserName)}`;
        console.log("添加了orderUserName参数到链接");
      } else {
        console.log(
          "未添加orderUserName参数，原因:",
          !orderUserName ? "orderUserName为空" : "orderUserName与userName相同"
        );
      }

      // 显示生成的链接
      this.statusManager.showStatus(`专属链接已生成: ${customUrl}`, "success");

      // 将链接复制到剪贴板
      try {
        await navigator.clipboard.writeText(customUrl);
        this.statusManager.showStatus(
          `专属链接已生成并复制到剪贴板: ${customUrl}`,
          "success"
        );
      } catch (e) {
        console.log("剪贴板复制失败，但链接已生成");
      }

      // 在页面上显示链接
      this.displayGeneratedLink(customUrl, btnGenerateLink);
    } catch (e) {
      this.statusManager.showStatus("生成链接失败: " + e.message, "error");
    }
  }

  /**
   * 显示生成的链接。
   * @param {string} customUrl - 生成的链接
   * @param {HTMLElement} btnGenerateLink - 触发按钮
   * @returns {void}
   */
  displayGeneratedLink(customUrl, btnGenerateLink) {
    const linkDisplay = document.createElement("div");
    linkDisplay.style.cssText = `
      margin-top: 12px;
      padding: 10px;
      background: #0f1628;
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 10px;
      word-break: break-all;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 12px;
      color: #67a8ff;
    `;
    linkDisplay.innerHTML = `
      <div style="color: #a6c1ff; margin-bottom: 5px;">专属链接:</div>
      <a href="${customUrl}" target="_blank" style="color: #67a8ff; text-decoration: none;">${customUrl}</a>
    `;

    // 移除之前的链接显示
    const existingLink = document.getElementById("generated-link");
    if (existingLink) {
      existingLink.remove();
    }

    linkDisplay.id = "generated-link";
    btnGenerateLink.parentNode.insertBefore(
      linkDisplay,
      btnGenerateLink.nextSibling
    );
  }

  /**
   * 设置示例链接。
   * @returns {void}
   */
  setExampleUrl() {
    const urlInput = document.getElementById("urlInput");
    if (urlInput) {
      urlInput.value =
        "https://h5.schengle.com/ShengDaHXZHJSJ/#/airTrainVIP/hxVipHall?data=JnLbTvXqXZX7WUzS1tnXMKuminY68JHvRHTc2yZK7NM%2BqaPw8YUhjIEXmz0wDd0RKSy6jMIKi4GtbWeg9IkSqWLP5%2B%2FxM3p2r2DB0knRDhR58VkvxnDAxodhjhIk1LglxUv0CeHDketCXdSeKrSfD1voXgUtj56YLzezJjV1tV6LRccdCCimo1EyYL3gJ6VliIcH17ljlQ5Piy0IrG9Eoq7KlNd18AFWqGoN62Z2jYJsvf19UHnDz3%2Bfj3T68Pc%2FwphkTTrNCu0FBQLXNxDkgALA4PdjewMhvfmWJ9zACYzUE8E0JqIl7DViUOdU83xw11qxVqnij%2FK0tRwGP737Dg%3D%3D";
    }
  }
}

// 导出链接管理器类
window.LinkManager = LinkManager;
