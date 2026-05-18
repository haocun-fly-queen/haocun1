"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const config = require("../../config.js");
const _sfc_main = {
  __name: "dashboard",
  setup(__props) {
    const userId = common_vendor.ref(null);
    const loading = common_vendor.ref(true);
    const activeTab = common_vendor.ref("week");
    const showAlertModal = common_vendor.ref(false);
    const todaySummary = common_vendor.ref({
      targetCalories: 2e3,
      consumedCalories: 0,
      remainingCalories: 2e3,
      progressPercent: 0,
      meals: [],
      macros: {
        carbs: { actual: 0, target: 0, unit: "g" },
        protein: { actual: 0, target: 0, unit: "g" },
        fat: { actual: 0, target: 0, unit: "g" }
      }
    });
    const nutritionStandard = common_vendor.ref({
      calories: 2e3,
      carbsPercent: 50,
      proteinPercent: 20,
      fatPercent: 30,
      carbsGram: 0,
      proteinGram: 0,
      fatGram: 0,
      description: ""
    });
    const weeklyStats = common_vendor.ref({
      dailyCalories: [],
      avgCalories: 0,
      mealRegularRate: 0,
      foodDiversityScore: 0,
      calorieFluctuation: 0,
      weightTrend: []
    });
    const monthlyStats = common_vendor.ref({
      dailyCalories: [],
      avgCalories: 0,
      mealRegularRate: 0,
      foodDiversityScore: 0,
      calorieFluctuation: 0,
      weightTrend: []
    });
    const alerts = common_vendor.ref([]);
    const animatedCalories = common_vendor.ref(0);
    const ringPercent = common_vendor.ref(0);
    const todayStr = common_vendor.computed(() => {
      const d = /* @__PURE__ */ new Date();
      return `${d.getMonth() + 1}月${d.getDate()}日 ${["日", "一", "二", "三", "四", "五", "六"][d.getDay()]}`;
    });
    const greeting = common_vendor.computed(() => {
      const h = (/* @__PURE__ */ new Date()).getHours();
      if (h < 6)
        return "夜深了，早点休息 🌙";
      if (h < 11)
        return "早上好！记得吃早餐 ☀️";
      if (h < 14)
        return "中午好！午餐时间 🍚";
      if (h < 18)
        return "下午好！补充能量 💪";
      return "晚上好！晚餐别太晚 🌆";
    });
    const macros = common_vendor.computed(() => todaySummary.value.macros);
    const ringStyle = common_vendor.computed(() => {
      const deg = ringPercent.value / 100 * 360;
      return {
        background: `conic-gradient(#FF8C42 ${deg}deg, #FFE5D0 ${deg}deg)`
      };
    });
    const pieStyle = common_vendor.computed(() => {
      const m = macros.value;
      const total = (m.carbs.actual || 0) + (m.protein.actual || 0) + (m.fat.actual || 0);
      if (total === 0)
        return { background: "#FFE5D0" };
      const cPct = m.carbs.actual / total * 100;
      const pPct = m.protein.actual / total * 100;
      return {
        background: `conic-gradient(#FF9800 0% ${cPct}%, #4CAF50 ${cPct}% ${cPct + pPct}%, #f44336 ${cPct + pPct}% 100%)`
      };
    });
    const compareItems = common_vendor.computed(() => {
      const m = macros.value;
      const items = [];
      if (m.carbs.target > 0) {
        items.push({ name: "碳水", percent: m.carbs.actual / m.carbs.target * 100, color: "#FF9800" });
      }
      if (m.protein.target > 0) {
        items.push({ name: "蛋白质", percent: m.protein.actual / m.protein.target * 100, color: "#4CAF50" });
      }
      if (m.fat.target > 0) {
        items.push({ name: "脂肪", percent: m.fat.actual / m.fat.target * 100, color: "#f44336" });
      }
      return items;
    });
    const currentPeriod = common_vendor.computed(() => {
      return activeTab.value === "week" ? weeklyStats.value : monthlyStats.value;
    });
    const barWidth = (cal, target) => {
      if (!target || target === 0)
        return 0;
      return Math.min(100, cal / target * 100);
    };
    const dotStyle = (point, index) => {
      const trend = currentPeriod.value.weightTrend;
      if (!trend || trend.length < 2)
        return {};
      const weights = trend.map((p) => p.weight);
      const min = Math.min(...weights) - 1;
      const max = Math.max(...weights) + 1;
      const range = max - min || 1;
      const left = index / (trend.length - 1) * 100;
      const bottom = (point.weight - min) / range * 100;
      return {
        left: left + "%",
        bottom: bottom + "%"
      };
    };
    const goTo = (url) => {
      common_vendor.index.navigateTo({ url });
    };
    const animateNumber = (from, to, duration, callback) => {
      const start = Date.now();
      const diff = to - from;
      const step = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        callback(Math.round(from + diff * eased));
        if (progress < 1) {
          setTimeout(step, 16);
        }
      };
      step();
    };
    const loadDashboard = async () => {
      loading.value = true;
      try {
        const res = await utils_request.request({
          url: config.API.DASHBOARD_OVERVIEW,
          method: "GET",
          data: { userId: userId.value }
        });
        if (res.code === 200 && res.data) {
          const data = res.data;
          todaySummary.value = data.todaySummary || todaySummary.value;
          nutritionStandard.value = data.nutritionStandard || nutritionStandard.value;
          weeklyStats.value = data.weeklyStats || weeklyStats.value;
          monthlyStats.value = data.monthlyStats || monthlyStats.value;
          alerts.value = data.alerts || [];
          loading.value = false;
          setTimeout(() => {
            animateNumber(0, todaySummary.value.remainingCalories, 1200, (val) => {
              animatedCalories.value = val;
            });
            animateNumber(0, todaySummary.value.progressPercent, 1e3, (val) => {
              ringPercent.value = val;
            });
          }, 300);
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/dashboard/dashboard.vue:427", "加载看板数据失败", err);
        loading.value = false;
      }
    };
    common_vendor.onMounted(() => {
      userId.value = common_vendor.index.getStorageSync("userId");
      if (!userId.value) {
        common_vendor.index.showToast({ title: "请先登录", icon: "none" });
        setTimeout(() => common_vendor.index.reLaunch({ url: "/pages/login/login" }), 1500);
        return;
      }
      loadDashboard();
    });
    common_vendor.index.$on("refreshDashboard", () => {
      loadDashboard();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: loading.value
      }, loading.value ? {
        b: common_vendor.f(3, (i, k0, i0) => {
          return {
            a: i
          };
        })
      } : common_vendor.e({
        c: common_vendor.t(greeting.value),
        d: common_vendor.t(todayStr.value),
        e: alerts.value.length > 0
      }, alerts.value.length > 0 ? common_vendor.e({
        f: alerts.value[0].level === "danger"
      }, alerts.value[0].level === "danger" ? {} : {}, {
        g: common_vendor.t(alerts.value[0].title),
        h: common_vendor.t(alerts.value[0].message),
        i: common_vendor.n("alert-" + alerts.value[0].level),
        j: common_vendor.o(($event) => showAlertModal.value = true, "71")
      }) : {}, {
        k: common_vendor.s(ringStyle.value),
        l: common_vendor.t(animatedCalories.value),
        m: common_vendor.t(todaySummary.value.consumedCalories),
        n: common_vendor.t(todaySummary.value.targetCalories),
        o: todaySummary.value.meals && todaySummary.value.meals.length > 0
      }, todaySummary.value.meals && todaySummary.value.meals.length > 0 ? {
        p: common_vendor.f(todaySummary.value.meals, (m, i, i0) => {
          return {
            a: common_vendor.t(m.typeName),
            b: common_vendor.n("type-" + m.type),
            c: common_vendor.t(m.foods),
            d: common_vendor.t(m.calories),
            e: i
          };
        })
      } : {}, {
        q: common_vendor.o(($event) => goTo("/pages/camera/camera"), "60"),
        r: common_vendor.o(($event) => goTo("/pages/diet/diet"), "87"),
        s: common_vendor.o(($event) => goTo("/pages/plan/plan"), "b8"),
        t: common_vendor.t(nutritionStandard.value.description),
        v: common_vendor.t(todaySummary.value.consumedCalories),
        w: common_vendor.s(pieStyle.value),
        x: common_vendor.t(macros.value.carbs.actual),
        y: common_vendor.t(macros.value.carbs.target),
        z: common_vendor.t(macros.value.protein.actual),
        A: common_vendor.t(macros.value.protein.target),
        B: common_vendor.t(macros.value.fat.actual),
        C: common_vendor.t(macros.value.fat.target),
        D: common_vendor.f(compareItems.value, (item, key, i0) => {
          return {
            a: common_vendor.t(item.name),
            b: item.percent + "%",
            c: item.color,
            d: common_vendor.t(Math.round(item.percent)),
            e: item.percent > 110 ? 1 : "",
            f: key
          };
        }),
        E: activeTab.value === "week" ? 1 : "",
        F: common_vendor.o(($event) => activeTab.value = "week", "8e"),
        G: activeTab.value === "month" ? 1 : "",
        H: common_vendor.o(($event) => activeTab.value = "month", "b0"),
        I: common_vendor.f(currentPeriod.value.dailyCalories, (d, i, i0) => {
          return {
            a: common_vendor.t(d.date),
            b: barWidth(d.calories, d.target) + "%",
            c: d.calories > d.target ? "#f44336" : "linear-gradient(90deg, #FF8C42, #FFD93D)",
            d: common_vendor.t(d.calories),
            e: d.calories > d.target ? 1 : "",
            f: i
          };
        }),
        J: common_vendor.t(currentPeriod.value.avgCalories),
        K: common_vendor.t(Math.round(currentPeriod.value.mealRegularRate * 100)),
        L: common_vendor.t(currentPeriod.value.calorieFluctuation),
        M: common_vendor.t(currentPeriod.value.foodDiversityScore),
        N: currentPeriod.value.weightTrend && currentPeriod.value.weightTrend.length > 1
      }, currentPeriod.value.weightTrend && currentPeriod.value.weightTrend.length > 1 ? {
        O: common_vendor.f(currentPeriod.value.weightTrend, (p, i, i0) => {
          return {
            a: common_vendor.t(p.date),
            b: common_vendor.t(p.weight),
            c: i,
            d: common_vendor.s(dotStyle(p, i))
          };
        }),
        P: common_vendor.t(currentPeriod.value.weightTrend[0].date),
        Q: common_vendor.t(currentPeriod.value.weightTrend[currentPeriod.value.weightTrend.length - 1].date)
      } : {}, {
        R: showAlertModal.value
      }, showAlertModal.value ? common_vendor.e({
        S: common_vendor.o(($event) => showAlertModal.value = false, "35"),
        T: common_vendor.f(alerts.value, (alert, i, i0) => {
          return {
            a: common_vendor.t(alert.title),
            b: common_vendor.t(alert.message),
            c: common_vendor.t(alert.suggestion),
            d: i,
            e: common_vendor.n("ac-" + alert.level)
          };
        }),
        U: alerts.value.length === 0
      }, alerts.value.length === 0 ? {} : {}, {
        V: common_vendor.o(() => {
        }, "6f"),
        W: common_vendor.o(($event) => showAlertModal.value = false, "f9")
      }) : {}));
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-75e816e7"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/dashboard/dashboard.js.map
