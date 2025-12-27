(() => {
  "use strict";
  var e = {
      645: (e, t, s) => {
        var a = s(751),
          o = s(641),
          i = s(33);
        const r = {
            class: "container",
          },
          n = {
            key: 0,
            class: "logo3-container",
          },
          l = ["src"],
          c = {
            key: 1,
            class: "error-container",
          },
          d = {
            class: "content",
          },
          u = {
            class: "section",
          },
          v = {
            class: "title-container",
          },
          f = {
            class: "language-switch",
          },
          p = {
            class: "sub-title",
          },
          h = {
            class: "user-info",
          },
          m = {
            class: "info-item",
          },
          g = {
            class: "info-value",
          },
          L = {
            class: "info-item",
          },
          k = {
            class: "info-value",
          },
          b = {
            class: "info-item",
          },
          y = {
            class: "info-value",
          },
          C = {
            class: "info-item",
          },
          _ = {
            class: "info-value",
          },
          w = {
            class: "info-item",
          },
          D = {
            class: "info-value",
          };

        function q(e, t, s, a, q, E) {
          const I = (0, o.g2)("Header"),
            O = (0, o.g2)("QRCodeSection"),
            Q = (0, o.g2)("OrderDetails"),
            S = (0, o.g2)("NoticesSection");
          return (
            (0, o.uX)(),
            (0, o.CE)("div", r, [
              (0, o.bF)(I),
              E.showError
                ? (0, o.Q3)("", !0)
                : ((0, o.uX)(),
                  (0, o.CE)("div", n, [
                    (0, o.Lk)(
                      "img",
                      {
                        src: E.logoImage,
                        alt: "VIP LOUNGE",
                        class: "logo",
                      },
                      null,
                      8,
                      l
                    ),
                  ])),
              // 条件渲染：如果显示错误信息
              // E.showError
              //   ? ((0, o.uX)(), // 创建注释节点
              //     (0, o.CE)("div", c, [ // 创建div元素
              //       ...(t[2] || // 展开错误消息数组
              //         (t[2] = [ // 如果t[2]不存在，则创建错误消息
              //           (0, o.Lk)( // 创建p元素
              //             "p",
              //             {
              //               class: "error-message", // CSS类名
              //             },
              //             "路径错误", // 错误消息文本
              //             -1
              //           ),
              //         ])),
              //     ]))
              //   : (0, o.Q3)("", !0), // 如果不显示错误，则创建空注释节点
              t[10] ||
                (t[10] = (0, o.Lk)(
                  "div",
                  {
                    class: "provide-text",
                  },
                  [(0, o.Lk)("span", null, "为您提供")],
                  -1
                )),
              (0, o.Lk)("div", d, [
                (0, o.Lk)("div", u, [
                  (0, o.Lk)("div", v, [
                    (0, o.Lk)("div", f, [
                      (0, o.Lk)(
                        "span",
                        {
                          class: (0, i.C4)([
                            {
                              active: "en" === q.currentLang,
                            },
                            "lang-tab",
                          ]),
                          onClick:
                            t[0] || (t[0] = (e) => E.switchLanguage("en")),
                        },
                        " ENG ",
                        2
                      ),
                      (0, o.Lk)(
                        "span",
                        {
                          class: (0, i.C4)([
                            {
                              active: "zh" === q.currentLang,
                            },
                            "lang-tab",
                          ]),
                          onClick:
                            t[1] || (t[1] = (e) => E.switchLanguage("zh")),
                        },
                        " 中文 ",
                        2
                      ),
                    ]),
                    (0, o.Lk)("h2", null, (0, i.v_)(E.title), 1),
                  ]),
                  (0, o.Lk)("p", p, (0, i.v_)(E.subtitle), 1),
                  (0, o.bF)(
                    O,
                    {
                      qrData: q.qrData,
                      timeLeft: q.timeLeft,
                      onRefreshQrCode: E.refreshQRCode,
                    },
                    null,
                    8,
                    ["qrData", "timeLeft", "onRefreshQrCode"]
                  ),
                  
                  (0, o.Lk)("div", h, [
                    (0, o.Lk)("div", m, [
                      t[3] ||
                        (t[3] = (0, o.Lk)(
                          "div",
                          {
                            class: "info-label",
                          },
                          "姓名",
                          -1
                        )),
                      (0, o.Lk)("div", g, (0, i.v_)(q.userName), 1),
                    ]),
                    (0, o.Lk)("div", L, [
                      t[4] ||
                        (t[4] = (0, o.Lk)(
                          "div",
                          {
                            class: "info-label",
                          },
                          "参考代码",
                          -1
                        )),
                      (0, o.Lk)("div", k, (0, i.v_)(q.code), 1),
                    ]),
                    (0, o.Lk)("div", b, [
                      t[5] ||
                        (t[5] = (0, o.Lk)(
                          "div",
                          {
                            class: "info-label",
                          },
                          "开始日期",
                          -1
                        )),
                      (0, o.Lk)("div", y, (0, i.v_)(q.startDate), 1),
                    ]),
                    (0, o.Lk)("div", C, [
                      t[6] ||
                        (t[6] = (0, o.Lk)(
                          "div",
                          {
                            class: "info-label",
                          },
                          "截止日期",
                          -1
                        )),
                      (0, o.Lk)("div", _, (0, i.v_)(q.stopDate), 1),
                    ]),
                    (0, o.Lk)("div", w, [
                      t[7] ||
                        (t[7] = (0, o.Lk)(
                          "div",
                          {
                            class: "info-label",
                          },
                          "订单号",
                          -1
                        )),
                      (0, o.Lk)("div", D, (0, i.v_)(q.orderId), 1),
                    ]),
                  ]),
                  (0, o.bF)(Q),
                  t[8] ||
                    (t[8] = (0, o.Lk)(
                      "div",
                      {
                        class: "flex-center",
                      },
                      [
                        (0, o.Lk)(
                          "button",
                          {
                            class: "cancel-button",
                          },
                          "取消订单"
                        ),
                      ],
                      -1
                    )),
                  t[9] ||
                    (t[9] = (0, o.Lk)(
                      "div",
                      {
                        class: "divider",
                      },
                      null,
                      -1
                    )),
                  (0, o.bF)(S),
                ]),
              ]),
            ])
          );
        }

        function E(e, t, s, a, i, r) {
          return (0, o.uX)(), (0, o.CE)("header");
        }
        const I = {
          name: "Header",
        };
        var O = s(262);
        const Q = (0, O.A)(I, [["render", E]]),
          S = Q,
          R = {
            class: "qr-section",
          },
          N = {
            key: 0,
            class: "qr-section-img",
          },
          j = ["src"],
          A = {
            class: "logo-container",
          },
          x = ["src"],
          P = {
            class: "qr-refresh",
          },
          X = {
            id: "countdown",
          };

        function F(e, t, s, a, r, n) {
          return (
            (0, o.uX)(),
            (0, o.CE)("div", R, [
              s.qrData
                ? ((0, o.uX)(),
                  (0, o.CE)("div", N, [
                    (0, o.bF)(
                      z(),
                      {
                        value: s.qrData,
                        size: 133,
                        level: "H",
                        margin: 1,
                        renderAs: "canvas",
                        background: "#ffffff",
                        foreground: "#000000",
                      },
                      null,
                      8,
                      ["value"]
                    ),
                  ]))
                : ((0, o.uX)(),
                  (0, o.CE)("div",
                    {
                      class: "qr-expired",
                      style: {
                        color: "#ff6b6b",
                        fontSize: "14px",
                        fontWeight: "600",
                        padding: "12px 0",
                      },
                    },
                    "二维码已过期"
                  )),
              (0, o.Lk)("div", A, [
                (0, o.Lk)(
                  "img",
                  {
                    src: n.logoMiddleImage,
                    alt: "VIP LOUNGE",
                    class: "logo-middle",
                  },
                  null,
                  8,
                  x
                ),
              ]),
              (0, o.Lk)("div", P, [
                t[2] || (t[2] = (0, o.eW)(" 二维码将在 ", -1)),
                (0, o.Lk)("span", X, (0, i.v_)(s.timeLeft), 1),
                t[3] || (t[3] = (0, o.eW)(" 秒后刷新 ", -1)),
                (0, o.Lk)(
                  "span",
                  {
                    class: "refresh-btn",
                    onClick:
                      t[0] ||
                      (t[0] = (...e) =>
                        n.refreshQRCode && n.refreshQRCode(...e)),
                  },
                  [
                    ...(t[1] ||
                      (t[1] = [
                        (0, o.eW)("刷新", -1),
                        (0, o.Lk)(
                          "span",
                          {
                            class: "refresh-icon",
                            "aria-hidden": "true",
                          },
                          null,
                          -1
                        ),
                      ])),
                  ]
                ),
              ]),
            ])
          );
        }
        var M = s(862),
          z = s.n(M);
        const U = {
            name: "QRCodeSection",
            components: {
              QrcodeVue: z(),
            },
            props: {
              qrData: {
                type: String,
                required: !0,
              },
              timeLeft: {
                type: Number,
                required: !0,
              },
            },
            computed: {
              logoMiddleImage() {
                const e = this.$route.query.type;
                return "pp" === e
                  ? "./image/logo-middle-pp.jpg"
                  : "hy" === e
                  ? "./image/logo-middle-hy.jpg"
                  : "./image/logo-middle-pp.jpg";
              },
            },
            methods: {
              refreshQRCode() {
                this.$emit("refresh-qr-code");
              },
            },
          },
          $ = (0, O.A)(U, [
            ["render", F],
            ["__scopeId", "data-v-2b98b53a"],
          ]),
          T = $,
          G = {
            class: "user-info",
          },
          H = {
            class: "info-item",
          },
          V = {
            class: "info-value",
          },
          W = {
            class: "info-item",
          },
          B = {
            class: "info-value",
          },
          J = {
            class: "info-item",
          },
          K = {
            class: "info-value",
          },
          Y = {
            class: "info-item",
          },
          Z = {
            class: "info-value",
          },
          ee = {
            class: "info-item",
          },
          te = {
            class: "info-value",
          };

        function se(e, t, s, a, r, n) {
          return (
            (0, o.uX)(),
            (0, o.CE)("div", G, [
              (0, o.Lk)("div", H, [
                t[0] ||
                  (t[0] = (0, o.Lk)(
                    "div",
                    {
                      class: "info-label",
                    },
                    "姓名",
                    -1
                  )),
                (0, o.Lk)("div", V, (0, i.v_)(e.usseName), 1),
              ]),
              (0, o.Lk)("div", W, [
                t[1] ||
                  (t[1] = (0, o.Lk)(
                    "div",
                    {
                      class: "info-label",
                    },
                    "参考代码",
                    -1
                  )),
                (0, o.Lk)("div", B, (0, i.v_)(e.code), 1),
              ]),
              (0, o.Lk)("div", J, [
                t[2] ||
                  (t[2] = (0, o.Lk)(
                    "div",
                    {
                      class: "info-label",
                    },
                    "开始日期",
                    -1
                  )),
                (0, o.Lk)("div", K, (0, i.v_)(e.startDate), 1),
              ]),
              (0, o.Lk)("div", Y, [
                t[3] ||
                  (t[3] = (0, o.Lk)(
                    "div",
                    {
                      class: "info-label",
                    },
                    "截止日期",
                    -1
                  )),
                (0, o.Lk)("div", Z, (0, i.v_)(e.stopDate), 1),
              ]),
              (0, o.Lk)("div", ee, [
                t[4] ||
                  (t[4] = (0, o.Lk)(
                    "div",
                    {
                      class: "info-label",
                    },
                    "订单号",
                    -1
                  )),
                (0, o.Lk)("div", te, (0, i.v_)(e.orderId), 1),
              ]),
            ])
          );
        }
        const ae = {
            name: "UserInfo",
          },
          oe = (0, O.A)(ae, [["render", se]]),
          ie = oe;
        const re = {
          class: "notices",
        };

        function ne(e, t, s, a, i, r) {
          return (
            (0, o.uX)(),
            (0, o.CE)("div", re, [
              ...(t[0] ||
                (t[0] = [
                  (0, o.Fv)(
                    '<h3 class="notices-h3">注意事项</h3><div class="notice-item notice-item-red"> 1. 权益码未使用次日结束返回。 </div><div class="notice-item notice-item-red"> 2. 二维码和二维码参考编号每30秒刷新一次。 </div><div class="notice-item"> 3. 会员在机场贵宾厅权益上的姓名需与登机牌上的姓名一致。 </div><div class="notice-item"> 4. 若您的服务权益支持携伴使用，所有随行宾客须与持卡人本人同步完成登记后方可进入贵宾室。特别提醒：贵宾室到访记录完成登记后，工作人员将无法进行修改或撤销操作，请登记时仔细核对信息，感谢您的理解与配合。 </div><div class="notice-item"> 5. 将移动设备的屏幕亮度调整至最高以更好地扫描二维码。 </div><div class="notice-item"> 6. 若二维码无法扫描，贵宾室员工可以手动输入上方16位二维码参考编号以进行验证。 </div>',
                    7
                  ),
                ])),
            ])
          );
        }
        const le = {
            name: "NoticesSection",
          },
          ce = (0, O.A)(le, [["render", ne]]),
          de = ce;
        var ue = s(335);
        ue.A.defaults.timeout = 1e5;
        const ve = (e = {}) => {
            const t = new URLSearchParams(window.location.search),
              s = t.get("name"),
              o = t.get("orderUserName");
            s && (e.name = s);
            o && (e.orderUserName = o);
            let a = window.location.origin;
            return ue.A.get(`${a}/api/vip-room`, {
              params: e,
            });
          },
          fe = {
            name: "App",
            components: {
              Header: S,
              QRCodeSection: T,
              UserInfo: ie,
              NoticesSection: de,
            },
            data() {
              return {
                timeLeft: 10,
                qrData: "",
                userName: "",
                code: "",
                startDate: "",
                stopDate: "",
                orderId: "",
                currentLang: "zh",
                smsOrderId: "",
                smsToken: "",
                smsStatus: "",
                smsStatusType: "",
                smsFlowEnabled: !1,
                autoRefreshEnabled: !0,
              };
            },
            computed: {
              title() {
                return "zh" === this.currentLang
                  ? "机场贵宾室权益"
                  : "Airport Lounge Pass";
              },
              subtitle() {
                return "zh" === this.currentLang ? "1会员" : "1 Member";
              },
              logoImage() {
                const e = this.$route.query.type;
                return "pp" === e
                  ? "./image/logo-banner-pp.png"
                  : "hy" === e
                  ? "./image/logo-banner-hy.png"
                  : null;
              },
              showError() {
                const e = this.$route.query.type;
                return "pp" !== e && "hy" !== e;
              },
            },
            mounted() {
              const e = localStorage.getItem("language");
              e && (this.currentLang = e);

              // 调试信息
              console.log("当前域名:", window.location.origin);
              console.log("用户代理:", navigator.userAgent);
              console.log(
                "是否为移动设备:",
                /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                  navigator.userAgent
                )
              );

              this.startCountdown();
            },
            methods: {
              switchLanguage(e) {
                (this.currentLang = e), localStorage.setItem("language", e);
              },
              startCountdown() {
                this.refreshQRCode(),
                  setInterval(() => {
                    this.timeLeft--,
                      this.timeLeft <= 0 &&
                        (this.autoRefreshEnabled
                          ? ((this.timeLeft = 30), this.refreshQRCode())
                          : ((this.timeLeft = 0),
                            this.smsFlowEnabled &&
                              this.setSmsStatus(
                                "二维码已过期，请重新获取验证码",
                                "warning"
                              )));
                  }, 1e3);
              },
              refreshQRCode() {
                if (this.smsFlowEnabled && this.smsToken && this.smsOrderId)
                  return void this.fetchQrBySms();
                ve()
                  .then((e) => {
                    console.log(e);
                    const t = e && e.data ? e.data : {};
                    if (!t.ok || !t.data || !t.data.couponCode) {
                      (this.qrData = ""),
                        (this.userName = t.data ? t.data.userName : ""),
                        (this.code = "二维码已过期"),
                        (this.startDate = ""),
                        (this.stopDate = ""),
                        (this.orderId = ""),
                        (this.timeLeft = 0),
                        (this.autoRefreshEnabled = !1),
                        (this.smsFlowEnabled = !1);
                      return;
                    }
                    let n = t.data.couponCode || t.data.code;
                    (this.qrData = n || ""),
                      (this.userName = t.data.userName),
                      (this.code = n || t.data.code),
                      (this.startDate = t.data.startData),
                      (this.stopDate = t.data.stopDate),
                      (this.orderId = t.data.orderId),
                      (this.timeLeft = 30);
                  })
                  .catch((e) => {
                    console.log("请求失败:", e);
                    const t =
                      e && e.response && e.response.data ? e.response.data : {};
                    if (t && t.code === "COUPON_EXPIRED") {
                      (this.qrData = ""),
                        (this.userName = ""),
                        (this.code = "二维码已过期"),
                        (this.startDate = ""),
                        (this.stopDate = ""),
                        (this.orderId = ""),
                        (this.timeLeft = 0),
                        (this.autoRefreshEnabled = !1),
                        (this.smsFlowEnabled = !1);
                      return;
                    }
                    // 显示加载失败状态
                    this.qrData = "";
                    this.userName = "加载失败";
                    this.code = "请刷新重试";
                  }),
                  console.log("二维码已刷新");
              },
              setSmsStatus(e, t = "info") {
                (this.smsStatus = e || ""),
                  (this.smsStatusType = t || "info");
              },
              sendSmsCode() {
                const e = document.getElementById("smsOrderIdInput"),
                  t = e ? e.value.trim() : "";
                if (!t)
                  return void this.setSmsStatus("请输入订单号", "warning");
                this.setSmsStatus("正在发送验证码...", "info");
                const s = window.location.origin;
                ue.A.post(`${s}/api/sms/send`, {
                  orderId: t,
                })
                  .then((e) => {
                    const s = e && e.data ? e.data : {};
                    if (!s.ok)
                      throw new Error(s.error || "短信发送失败");
                    (this.smsOrderId = t),
                      this.setSmsStatus("验证码已发送", "success");
                  })
                  .catch((e) => {
                    const t =
                      (e &&
                        e.response &&
                        e.response.data &&
                        e.response.data.error) ||
                      (e && e.message) ||
                      "短信发送失败";
                    this.setSmsStatus(`发送失败: ${t}`, "error");
                  });
              },
              verifySmsCode() {
                const e = document.getElementById("smsOrderIdInput"),
                  t = document.getElementById("smsCodeInput"),
                  s = e ? e.value.trim() : "",
                  a = t ? t.value.trim() : "";
                if (!s)
                  return void this.setSmsStatus("请输入订单号", "warning");
                if (!a)
                  return void this.setSmsStatus("请输入短信验证码", "warning");
                this.setSmsStatus("正在验证验证码...", "info");
                const o = window.location.origin;
                ue.A.post(`${o}/api/sms/verify`, {
                  orderId: s,
                  smsCode: a,
                })
                  .then((e) => {
                    const t = e && e.data ? e.data : {};
                    if (!t.ok)
                      throw new Error(t.error || "验证码验证失败");
                    if (!t.smsToken)
                      throw new Error("未获取到smsToken");
                    (this.smsOrderId = s),
                      (this.smsToken = t.smsToken),
                      (this.smsFlowEnabled = !0),
                      (this.autoRefreshEnabled = !1),
                      this.fetchQrBySms();
                  })
                  .catch((e) => {
                    const t =
                      (e &&
                        e.response &&
                        e.response.data &&
                        e.response.data.error) ||
                      (e && e.message) ||
                      "验证码验证失败";
                    this.setSmsStatus(`验证失败: ${t}`, "error");
                  });
              },
              fetchQrBySms() {
                if (!this.smsOrderId || !this.smsToken)
                  return void this.setSmsStatus(
                    "请先完成短信验证",
                    "warning"
                  );
                this.setSmsStatus("正在获取二维码...", "info");
                const e = window.location.origin;
                ue.A.post(`${e}/api/coupon-by-sms`, {
                  orderId: this.smsOrderId,
                  smsToken: this.smsToken,
                })
                  .then((e) => {
                    const t = e && e.data ? e.data : {};
                    if (!t.ok)
                      throw new Error(t.error || "获取优惠券失败");
                    const s = t.meta || {},
                      a =
                        t.code ||
                        s.code ||
                        (t.result &&
                          t.result.data &&
                          t.result.data.couponCode) ||
                        null,
                      o =
                        "number" == typeof s.expiresInSeconds
                          ? s.expiresInSeconds
                          : 180;
                    if (s.expired || o <= 0)
                      return (
                        (this.timeLeft = 0),
                        void this.setSmsStatus(
                          "二维码已过期，请重新获取验证码",
                          "warning"
                        )
                      );
                    (this.qrData = t.qrDataUrl || ""),
                      a && (this.code = a),
                      (this.timeLeft = o),
                      this.setSmsStatus(`获取成功，有效期约 ${o}s`, "success");
                  })
                  .catch((e) => {
                    const t =
                      (e &&
                        e.response &&
                        e.response.data &&
                        e.response.data.error) ||
                      (e && e.message) ||
                      "获取优惠券失败";
                    this.setSmsStatus(`获取失败: ${t}`, "error");
                  });
              },
            },
          },
          pe = (0, O.A)(fe, [["render", q]]),
          he = pe;
        var me = s(220);
        const ge = [
            {
              path: "/",
              component: he,
            },
            {
              path: "/pp",
              component: he,
            },
            {
              path: "/hy",
              component: he,
            },
            {
              path: "/lounge",
              component: he,
            },
          ],
          Le = (0, me.aE)({
            history: (0, me.LA)(),
            routes: ge,
          }),
          ke = Le;
        (0, a.Ef)(he).use(ke).mount("#app");
      },
    },
    t = {};

  function s(a) {
    var o = t[a];
    if (void 0 !== o) return o.exports;
    var i = (t[a] = {
      exports: {},
    });
    return e[a].call(i.exports, i, i.exports, s), i.exports;
  }
  (s.m = e),
    (() => {
      var e = [];
      s.O = (t, a, o, i) => {
        if (!a) {
          var r = 1 / 0;
          for (d = 0; d < e.length; d++) {
            for (var [a, o, i] = e[d], n = !0, l = 0; l < a.length; l++)
              (!1 & i || r >= i) && Object.keys(s.O).every((e) => s.O[e](a[l]))
                ? a.splice(l--, 1)
                : ((n = !1), i < r && (r = i));
            if (n) {
              e.splice(d--, 1);
              var c = o();
              void 0 !== c && (t = c);
            }
          }
          return t;
        }
        i = i || 0;
        for (var d = e.length; d > 0 && e[d - 1][2] > i; d--) e[d] = e[d - 1];
        e[d] = [a, o, i];
      };
    })(),
    (() => {
      s.n = (e) => {
        var t = e && e.__esModule ? () => e["default"] : () => e;
        return (
          s.d(t, {
            a: t,
          }),
          t
        );
      };
    })(),
    (() => {
      s.d = (e, t) => {
        for (var a in t)
          s.o(t, a) &&
            !s.o(e, a) &&
            Object.defineProperty(e, a, {
              enumerable: !0,
              get: t[a],
            });
      };
    })(),
    (() => {
      s.g = (function () {
        if ("object" === typeof globalThis) return globalThis;
        try {
          return this || new Function("return this")();
        } catch (e) {
          if ("object" === typeof window) return window;
        }
      })();
    })(),
    (() => {
      s.o = (e, t) => Object.prototype.hasOwnProperty.call(e, t);
    })(),
    (() => {
      s.r = (e) => {
        "undefined" !== typeof Symbol &&
          Symbol.toStringTag &&
          Object.defineProperty(e, Symbol.toStringTag, {
            value: "Module",
          }),
          Object.defineProperty(e, "__esModule", {
            value: !0,
          });
      };
    })(),
    (() => {
      var e = {
        524: 0,
      };
      s.O.j = (t) => 0 === e[t];
      var t = (t, a) => {
          var o,
            i,
            [r, n, l] = a,
            c = 0;
          if (r.some((t) => 0 !== e[t])) {
            for (o in n) s.o(n, o) && (s.m[o] = n[o]);
            if (l) var d = l(s);
          }
          for (t && t(a); c < r.length; c++)
            (i = r[c]), s.o(e, i) && e[i] && e[i][0](), (e[i] = 0);
          return s.O(d);
        },
        a = (self["webpackChunkairport_lounge_vue"] =
          self["webpackChunkairport_lounge_vue"] || []);
      a.forEach(t.bind(null, 0)), (a.push = t.bind(null, a.push.bind(a)));
    })();
  var a = s.O(void 0, [504], () => s(645));
  a = s.O(a);
})();
//# sourceMappingURL=app.c2845d9d.js.map
