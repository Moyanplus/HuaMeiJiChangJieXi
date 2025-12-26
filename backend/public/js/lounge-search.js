/**
 * 贵宾厅搜索模块
 * 处理贵宾厅搜索和选择功能
 */

class LoungeSearch {
  /**
   * 初始化贵宾厅搜索实例与缓存。
   */
  constructor() {
    this.searchInput = document.getElementById("loungeSearchInput");
    this.dropdown = document.getElementById("loungeDropdown");
    this.options = document.getElementById("loungeOptions");
    this.createLoungeCode = document.getElementById("createLoungeCode");
    this.selectedLounge = null;
    this.filteredLounges = [];
    this.cache = new Map(); // 添加缓存
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
    this.searchTimeout = null; // 防抖定时器

    // 创建订单标签页的元素
    this.searchInputOrder = document.getElementById("loungeSearchInputOrder");
    this.dropdownOrder = document.getElementById("loungeDropdownOrder");
    this.optionsOrder = document.getElementById("loungeOptionsOrder");
    this.createLoungeCodeOrder = document.getElementById(
      "createLoungeCodeOrder"
    );

    this.init();
  }

  // Mock贵宾厅数据
  mockLounges = [
    {
      loungeCode: "GB4744",
      loungeName: "Plaza Premium Lounge(中国澳门)",
      cityName: "澳门",
      cityCode: "820100",
      cityEnName: "Macau",
      countryCode: "MO",
      countryName: "中国澳门",
      countryEnName: "China",
      siteName: "澳门国际机场",
      siteType: "机场",
      terminalName: "T1",
      terminalCode: "HZ38660",
      businessHours: "06:00-23:00",
      deductPoints: 2,
      loungeType: "1",
      domesticForeign: "境外",
      address: "澳门国际机场",
      latitude: "22.16052",
      longitude: "113.588002",
      serviceName: "机场贵宾厅服务",
    },
    {
      loungeCode: "GB937",
      loungeName: "PPL环亚休息室(澳门）",
      cityName: "澳门",
      cityCode: "820100",
      cityEnName: "Macau",
      countryCode: "MO",
      countryName: "中国澳门",
      countryEnName: "China",
      siteName: "澳门国际机场",
      siteType: "机场",
      terminalName: "T1",
      terminalCode: "HZ38660",
      businessHours: "06:00-23:59",
      deductPoints: 2,
      loungeType: "1",
      domesticForeign: "境外",
      address: "澳门国际机场",
      latitude: "22.16052",
      longitude: "113.588002",
      serviceName: "机场贵宾厅服务",
    },
    {
      loungeCode: "GB1234",
      loungeName: "北京首都机场T3贵宾厅",
      cityName: "北京",
      cityCode: "110100",
      cityEnName: "Beijing",
      countryCode: "CN",
      countryName: "中国",
      countryEnName: "China",
      siteName: "北京首都国际机场",
      siteType: "机场",
      terminalName: "T3",
      terminalCode: "PEK",
      businessHours: "05:00-24:00",
      deductPoints: 3,
      loungeType: "1",
      domesticForeign: "境内",
      address: "北京首都国际机场T3航站楼",
      latitude: "40.0799",
      longitude: "116.6031",
      serviceName: "机场贵宾厅服务",
    },
    {
      loungeCode: "GB5678",
      loungeName: "上海浦东机场T2贵宾厅",
      cityName: "上海",
      cityCode: "310100",
      cityEnName: "Shanghai",
      countryCode: "CN",
      countryName: "中国",
      countryEnName: "China",
      siteName: "上海浦东国际机场",
      siteType: "机场",
      terminalName: "T2",
      terminalCode: "PVG",
      businessHours: "06:00-23:30",
      deductPoints: 3,
      loungeType: "1",
      domesticForeign: "境内",
      address: "上海浦东国际机场T2航站楼",
      latitude: "31.1434",
      longitude: "121.8052",
      serviceName: "机场贵宾厅服务",
    },
    {
      loungeCode: "GB9999",
      loungeName: "广州白云机场T1贵宾厅",
      cityName: "广州",
      cityCode: "440100",
      cityEnName: "Guangzhou",
      countryCode: "CN",
      countryName: "中国",
      countryEnName: "China",
      siteName: "广州白云国际机场",
      siteType: "机场",
      terminalName: "T1",
      terminalCode: "CAN",
      businessHours: "05:30-24:00",
      deductPoints: 2,
      loungeType: "1",
      domesticForeign: "境内",
      address: "广州白云国际机场T1航站楼",
      latitude: "23.3924",
      longitude: "113.2988",
      serviceName: "机场贵宾厅服务",
    },
    {
      loungeCode: "GB8888",
      loungeName: "深圳宝安机场贵宾厅",
      cityName: "深圳",
      cityCode: "440300",
      cityEnName: "Shenzhen",
      countryCode: "CN",
      countryName: "中国",
      countryEnName: "China",
      siteName: "深圳宝安国际机场",
      siteType: "机场",
      terminalName: "T3",
      terminalCode: "SZX",
      businessHours: "06:00-23:00",
      deductPoints: 2,
      loungeType: "1",
      domesticForeign: "境内",
      address: "深圳宝安国际机场T3航站楼",
      latitude: "22.6392",
      longitude: "113.8106",
      serviceName: "机场贵宾厅服务",
    },
    {
      loungeCode: "GB7777",
      loungeName: "成都双流机场贵宾厅",
      cityName: "成都",
      cityCode: "510100",
      cityEnName: "Chengdu",
      countryCode: "CN",
      countryName: "中国",
      countryEnName: "China",
      siteName: "成都双流国际机场",
      siteType: "机场",
      terminalName: "T2",
      terminalCode: "CTU",
      businessHours: "05:00-24:00",
      deductPoints: 2,
      loungeType: "1",
      domesticForeign: "境内",
      address: "成都双流国际机场T2航站楼",
      latitude: "30.5785",
      longitude: "103.9469",
      serviceName: "机场贵宾厅服务",
    },
    {
      loungeCode: "GB6666",
      loungeName: "香港国际机场贵宾厅",
      cityName: "香港",
      cityCode: "810000",
      cityEnName: "Hong Kong",
      countryCode: "HK",
      countryName: "中国香港",
      countryEnName: "China",
      siteName: "香港国际机场",
      siteType: "机场",
      terminalName: "T1",
      terminalCode: "HKG",
      businessHours: "05:00-24:00",
      deductPoints: 3,
      loungeType: "1",
      domesticForeign: "境外",
      address: "香港国际机场T1航站楼",
      latitude: "22.3080",
      longitude: "113.9185",
      serviceName: "机场贵宾厅服务",
    },
  ];

  /**
   * 初始化模块入口。
   * @returns {void}
   */
  init() {
    this.bindEvents();
    // 预加载一些热门贵宾厅数据
    this.loadPopularLounges();
  }

  /**
   * 从API获取贵宾厅数据
   * @param {string} query - 搜索关键词
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 贵宾厅列表
   */
  async fetchLoungesFromAPI(query = "", limit = 50) {
    try {
      // 检查缓存
      const cacheKey = `${query}_${limit}`;
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log("📦 使用缓存的贵宾厅数据");
        return cached.data;
      }

      console.log("🌐 从API获取贵宾厅数据...");

      let url = "/api/lounges";
      if (query.trim()) {
        url = `/api/lounges/search?q=${encodeURIComponent(
          query.trim()
        )}&limit=${limit}`;
      } else {
        url += `?limit=${limit}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || "获取贵宾厅数据失败");
      }

      // 缓存结果
      this.cache.set(cacheKey, {
        data: result.data,
        timestamp: Date.now(),
      });

      console.log(`✅ 获取到 ${result.data.length} 条贵宾厅数据`);
      return result.data;
    } catch (error) {
      console.error("❌ 获取贵宾厅数据失败:", error.message);

      // 如果API失败，返回空数组而不是mock数据
      // 这样用户知道数据获取有问题
      return [];
    }
  }

  /**
   * 加载热门贵宾厅数据。
   * @returns {Promise<void>}
   */
  async loadPopularLounges() {
    try {
      const lounges = await this.fetchLoungesFromAPI("", 20);
      this.filteredLounges = lounges;
    } catch (error) {
      console.error("加载热门贵宾厅失败:", error.message);
    }
  }

  /**
   * 绑定搜索框与下拉框事件。
   * @returns {void}
   */
  bindEvents() {
    // 链接解析标签页的贵宾厅搜索
    if (this.searchInput && this.dropdown && this.options) {
      this.bindSearchEvents(
        this.searchInput,
        this.dropdown,
        this.options,
        this.createLoungeCode
      );
    }

    // 创建订单标签页的贵宾厅搜索
    if (this.searchInputOrder && this.dropdownOrder && this.optionsOrder) {
      this.bindSearchEvents(
        this.searchInputOrder,
        this.dropdownOrder,
        this.optionsOrder,
        this.createLoungeCodeOrder
      );
    }
  }

  /**
   * 绑定单个搜索框的交互事件。
   * @param {HTMLInputElement} searchInput - 搜索输入框
   * @param {HTMLElement} dropdown - 下拉容器
   * @param {HTMLElement} options - 选项容器
   * @param {HTMLInputElement} createLoungeCode - 隐藏字段
   * @returns {void}
   */
  bindSearchEvents(searchInput, dropdown, options, createLoungeCode) {
    // 输入事件（添加防抖）
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value;

      // 清除之前的定时器
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }

      if (query.trim()) {
        // 设置防抖延迟
        this.searchTimeout = setTimeout(async () => {
          await this.searchLounges(query, options);
          dropdown.style.display = "block";
        }, 300); // 300ms延迟
      } else {
        dropdown.style.display = "none";
        this.selectedLounge = null;
        createLoungeCode.value = "";
      }
    });

    // 聚焦事件
    searchInput.addEventListener("focus", async () => {
      if (searchInput.value.trim()) {
        await this.searchLounges(searchInput.value, options);
        dropdown.style.display = "block";
      } else {
        // 如果没有输入内容，显示热门贵宾厅
        if (this.filteredLounges.length === 0) {
          await this.loadPopularLounges();
        }
        this.renderLoungeOptions(this.filteredLounges, options);
        dropdown.style.display = "block";
      }
    });

    // 失焦事件（延迟隐藏，让点击事件先触发）
    searchInput.addEventListener("blur", () => {
      setTimeout(() => {
        dropdown.style.display = "none";
      }, 200);
    });

    // 键盘导航
    searchInput.addEventListener("keydown", (e) => {
      this.handleKeyboardNavigation(e, options);
    });

    // 点击外部关闭下拉菜单
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".lounge-selector")) {
        dropdown.style.display = "none";
      }
    });
  }

  /**
   * 渲染贵宾厅选项
   * @param {Array} lounges - 贵宾厅列表
   * @param {HTMLElement} options - 选项容器元素
   */
  /**
   * 渲染贵宾厅下拉选项。
   * @param {Array<Object>} lounges - 贵宾厅列表
   * @param {HTMLElement} options - 选项容器
   * @returns {void}
   */
  renderLoungeOptions(lounges, options) {
    if (lounges.length === 0) {
      options.innerHTML =
        '<div class="lounge-no-results">未找到匹配的贵宾厅</div>';
      return;
    }

    options.innerHTML = lounges
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

    // 绑定点击事件
    options.querySelectorAll(".lounge-option").forEach((option) => {
      option.addEventListener("click", () => {
        const code = option.dataset.code;
        const lounge = lounges.find((l) => l.loungeCode === code);
        this.selectLounge(lounge, options);
      });
    });
  }

  /**
   * 选择贵宾厅
   * @param {Object} lounge - 选中的贵宾厅
   * @param {HTMLElement} options - 选项容器元素
   */
  /**
   * 选择贵宾厅并写入输入框。
   * @param {Object} lounge - 贵宾厅对象
   * @param {HTMLElement} options - 选项容器
   * @returns {void}
   */
  selectLounge(lounge, options) {
    this.selectedLounge = lounge;

    // 根据选项容器确定对应的输入框和隐藏字段
    const searchInput =
      options.id === "loungeOptions" ? this.searchInput : this.searchInputOrder;
    const createLoungeCode =
      options.id === "loungeOptions"
        ? this.createLoungeCode
        : this.createLoungeCodeOrder;
    const dropdown =
      options.id === "loungeOptions" ? this.dropdown : this.dropdownOrder;

    if (searchInput)
      searchInput.value = `${lounge.loungeName} (${lounge.loungeCode})`;
    if (createLoungeCode) createLoungeCode.value = lounge.loungeCode;
    if (dropdown) dropdown.style.display = "none";

    // 添加选中状态
    options.querySelectorAll(".lounge-option").forEach((option) => {
      option.classList.remove("selected");
      if (option.dataset.code === lounge.loungeCode) {
        option.classList.add("selected");
      }
    });
  }

  /**
   * 搜索贵宾厅。
   * @param {string} query - 搜索关键词
   * @param {HTMLElement} options - 选项容器元素
   * @returns {Promise<void>}
   */
  async searchLounges(query, options) {
    try {
      // 如果查询为空，显示热门贵宾厅
      if (!query || query.trim().length === 0) {
        if (this.filteredLounges.length === 0) {
          await this.loadPopularLounges();
        }
        this.renderLoungeOptions(this.filteredLounges, options);
        return;
      }

      // 如果查询太短，显示提示
      if (query.trim().length === 1) {
        options.innerHTML =
          '<div class="lounge-loading">💡 请输入更多字符进行搜索...</div>';
        return;
      }

      // 显示加载状态
      options.innerHTML = '<div class="lounge-loading">🔍 搜索中...</div>';

      // 从API获取数据
      this.filteredLounges = await this.fetchLoungesFromAPI(query, 50);

      // 渲染结果
      this.renderLoungeOptions(this.filteredLounges, options);
    } catch (error) {
      console.error("搜索贵宾厅失败:", error.message);
      options.innerHTML =
        '<div class="lounge-error">❌ 搜索失败，请稍后重试</div>';
    }
  }

  /**
   * 处理键盘上下选择与回车确认。
   * @param {KeyboardEvent} e - 键盘事件
   * @param {HTMLElement} optionsContainer - 选项容器
   * @returns {void}
   */
  handleKeyboardNavigation(e, optionsContainer) {
    const options = optionsContainer.querySelectorAll(".lounge-option");
    const selectedOption = optionsContainer.querySelector(
      ".lounge-option.selected"
    );
    let currentIndex = -1;

    if (selectedOption) {
      currentIndex = Array.from(options).indexOf(selectedOption);
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        currentIndex = Math.min(currentIndex + 1, options.length - 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        currentIndex = Math.max(currentIndex - 1, 0);
        break;
      case "Enter":
        e.preventDefault();
        if (selectedOption) {
          selectedOption.click();
        }
        return;
      case "Escape":
        const dropdown = optionsContainer.closest(".lounge-dropdown");
        if (dropdown) dropdown.style.display = "none";
        return;
    }

    // 更新选中状态
    options.forEach((option, index) => {
      option.classList.toggle("selected", index === currentIndex);
    });

    // 滚动到选中项
    if (options[currentIndex]) {
      options[currentIndex].scrollIntoView({ block: "nearest" });
    }
  }
}

// 导出贵宾厅搜索类
window.LoungeSearch = LoungeSearch;
