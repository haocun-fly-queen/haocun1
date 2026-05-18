"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const config = require("../../config.js");
const _sfc_main = {
  __name: "stats",
  setup(__props) {
    const userId = common_vendor.ref(null);
    const activeTab = common_vendor.ref("week");
    const stats = common_vendor.ref({
      dailyExercises: [],
      totalDays: 0,
      totalCalories: 0,
      avgDuration: 0,
      exerciseTypeCount: 0,
      categoryRatios: [],
      intakeVsBurn: []
    });
    const barWidth = (val, target) => {
      if (!target || target === 0)
        return 0;
      return Math.min(100, val / target * 100);
    };
    const maxIntake = common_vendor.computed(() => {
      if (!stats.value.intakeVsBurn || stats.value.intakeVsBurn.length === 0)
        return 1;
      return Math.max(1, ...stats.value.intakeVsBurn.map((d) => Math.max(d.intake, d.burn)));
    });
    const intakeBarWidth = (val) => Math.min(100, val / maxIntake.value * 100);
    const burnBarWidth = (val) => Math.min(100, val / maxIntake.value * 100);
    const pieStyle = common_vendor.computed(() => {
      const ratios = stats.value.categoryRatios || [];
      if (ratios.length === 0)
        return { background: "#FFE5D0" };
      const colors = { cardio: "#2196f3", strength: "#FF9800", flexibility: "#4CAF50", hiit: "#f44336" };
      let gradient = "";
      let acc = 0;
      ratios.forEach((r) => {
        const color = colors[r.category] || "#B8956A";
        gradient += `${color} ${acc}% ${acc + r.percent}%, `;
        acc += r.percent;
      });
      return { background: `conic-gradient(${gradient.slice(0, -2)})` };
    });
    const switchTab = (tab) => {
      activeTab.value = tab;
      loadStats();
    };
    const loadStats = async () => {
      try {
        const days = activeTab.value === "week" ? 7 : 30;
        const res = await utils_request.request({
          url: config.API.EXERCISE_STATS,
          method: "GET",
          data: { userId: userId.value, days }
        });
        if (res.code === 200 && res.data) {
          stats.value = res.data;
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/exercise/stats.vue:181", "加载统计数据失败", err);
      }
    };
    common_vendor.onMounted(() => {
      userId.value = common_vendor.index.getStorageSync("userId");
      if (!userId.value) {
        common_vendor.index.showToast({ title: "请先登录", icon: "none" });
        setTimeout(() => common_vendor.index.reLaunch({ url: "/pages/login/login" }), 1500);
        return;
      }
      loadStats();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: activeTab.value === "week" ? 1 : "",
        b: common_vendor.o(($event) => switchTab("week"), "22"),
        c: activeTab.value === "month" ? 1 : "",
        d: common_vendor.o(($event) => switchTab("month"), "d0"),
        e: common_vendor.f(stats.value.dailyExercises, (d, i, i0) => {
          return {
            a: common_vendor.t(d.date),
            b: barWidth(d.calories, d.target) + "%",
            c: d.calories >= d.target ? "linear-gradient(90deg, #4caf50, #8bc34a)" : "linear-gradient(90deg, #FF8C42, #FFD93D)",
            d: common_vendor.t(d.calories),
            e: d.calories >= d.target ? 1 : "",
            f: i
          };
        }),
        f: common_vendor.t(stats.value.totalDays),
        g: common_vendor.t(stats.value.totalCalories),
        h: common_vendor.t(stats.value.avgDuration),
        i: common_vendor.t(stats.value.exerciseTypeCount),
        j: common_vendor.f(stats.value.intakeVsBurn, (d, i, i0) => {
          return {
            a: common_vendor.t(d.date),
            b: intakeBarWidth(d.intake) + "%",
            c: burnBarWidth(d.burn) + "%",
            d: common_vendor.t(d.net > 0 ? "+" : ""),
            e: common_vendor.t(d.net),
            f: d.net > 0 ? 1 : "",
            g: d.net < 0 ? 1 : "",
            h: i
          };
        }),
        k: stats.value.categoryRatios && stats.value.categoryRatios.length > 0
      }, stats.value.categoryRatios && stats.value.categoryRatios.length > 0 ? {
        l: common_vendor.t(stats.value.totalDays),
        m: common_vendor.s(pieStyle.value),
        n: common_vendor.f(stats.value.categoryRatios, (cat, i, i0) => {
          return {
            a: common_vendor.n("cc-dot-" + cat.category),
            b: common_vendor.t(cat.categoryName),
            c: common_vendor.t(cat.percent),
            d: i
          };
        })
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-c9e5188a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/exercise/stats.js.map
