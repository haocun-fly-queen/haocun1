"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const config = require("../../config.js");
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const userId = common_vendor.ref(null);
    const isGenerating = common_vendor.ref(false);
    const animatedCalories = common_vendor.ref(0);
    const ringPercent = common_vendor.ref(0);
    const todayExercise = common_vendor.ref({
      targetCalories: 300,
      consumedCalories: 0,
      remainingCalories: 300,
      progressPercent: 0,
      records: []
    });
    const todayPlan = common_vendor.ref({
      generated: false,
      exercises: [],
      totalDuration: 0,
      totalCalories: 0,
      advice: ""
    });
    const fatigue = common_vendor.ref({
      consecutiveDays: 0,
      needRest: false,
      statusText: "",
      suggestion: ""
    });
    const todayStr = common_vendor.computed(() => {
      const d = /* @__PURE__ */ new Date();
      const weekDay = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
      return `${d.getMonth() + 1}月${d.getDate()}日 周${weekDay}`;
    });
    const greeting = common_vendor.computed(() => {
      const h = (/* @__PURE__ */ new Date()).getHours();
      if (h < 6)
        return "夜深了，休息也是训练的一部分 🌙";
      if (h < 11)
        return "早上好！晨练是好习惯 ☀️";
      if (h < 14)
        return "中午好！午餐后散步一下 🚶";
      if (h < 18)
        return "下午好！适合来一组训练 💪";
      return "晚上好！运动后好好休息 🌆";
    });
    const chickenSays = common_vendor.computed(() => {
      const consumed = todayExercise.value.consumedCalories;
      if (consumed === 0)
        return "今天还没运动呢！让我帮你安排~";
      if (fatigue.value.needRest)
        return "连续运动好几天了，今天休息一下吧~";
      return `已消耗 ${consumed} kcal，继续加油！`;
    });
    const planHint = common_vendor.computed(() => {
      if (fatigue.value.needRest)
        return "检测到连续运动多天，小唧会推荐恢复性训练";
      return "综合你的饮食摄入和身体状况，量身定制运动方案";
    });
    const ringStyle = common_vendor.computed(() => {
      const deg = ringPercent.value / 100 * 360;
      return { background: `conic-gradient(#FF8C42 ${deg}deg, #FFE5D0 ${deg}deg)` };
    });
    const getExerciseIcon = (icon) => {
      const iconMap = {
        "running": "🏃",
        "walking": "🚶",
        "jump-rope": "🤸",
        "swimming": "🏊",
        "cycling": "🚴",
        "elliptical": "🏋️",
        "squat": "🦵",
        "bench-press": "💪",
        "deadlift": "🏋️",
        "push-up": "💪",
        "pull-up": "💪",
        "curl": "💪",
        "yoga": "🧘",
        "stretch": "🤸",
        "hiit": "⚡",
        "burpee": "🔥"
      };
      if (icon && iconMap[icon])
        return iconMap[icon];
      return "🏃";
    };
    const animateNumber = (from, to, duration, callback) => {
      const start = Date.now();
      const diff = to - from;
      const step = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        callback(Math.round(from + diff * eased));
        if (progress < 1)
          setTimeout(step, 16);
      };
      step();
    };
    const goTo = (url) => {
      common_vendor.index.navigateTo({ url });
    };
    const loadDashboard = async () => {
      try {
        const res = await utils_request.request({
          url: config.API.EXERCISE_DASHBOARD,
          method: "GET",
          data: { userId: userId.value }
        });
        if (res.code === 200 && res.data) {
          const data = res.data;
          todayExercise.value = data.todayExercise || todayExercise.value;
          if (data.todayPlan && data.todayPlan.generated) {
            todayPlan.value = data.todayPlan;
          }
          fatigue.value = data.fatigue || fatigue.value;
          setTimeout(() => {
            animateNumber(0, todayExercise.value.consumedCalories, 1e3, (v) => {
              animatedCalories.value = v;
            });
            animateNumber(0, todayExercise.value.progressPercent, 800, (v) => {
              ringPercent.value = v;
            });
          }, 300);
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/exercise/index.vue:319", "加载运动看板失败", err);
      }
    };
    const generatePlan = async () => {
      common_vendor.index.__f__("log", "at pages/exercise/index.vue:324", "点击了生成按钮, userId:", userId.value);
      if (isGenerating.value)
        return;
      isGenerating.value = true;
      try {
        const url = config.API.EXERCISE_PLAN_GENERATE + "?userId=" + userId.value;
        common_vendor.index.__f__("log", "at pages/exercise/index.vue:329", "请求URL:", url);
        const res = await utils_request.request({
          url,
          method: "POST",
          data: {}
        });
        common_vendor.index.__f__("log", "at pages/exercise/index.vue:335", "AI运动规划返回:", JSON.stringify(res));
        if (res.code === 200 && res.data) {
          todayPlan.value = res.data;
          common_vendor.index.showToast({ title: "运动计划已生成", icon: "success" });
        } else {
          throw new Error(res.message || "生成失败");
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/exercise/index.vue:343", "生成运动计划失败", err);
        common_vendor.index.showToast({ title: "小唧累了，请稍后再试", icon: "none" });
      } finally {
        isGenerating.value = false;
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
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(greeting.value),
        b: common_vendor.t(todayStr.value),
        c: common_vendor.s(ringStyle.value),
        d: common_vendor.t(animatedCalories.value),
        e: common_vendor.t(todayExercise.value.targetCalories),
        f: common_vendor.t(todayExercise.value.consumedCalories),
        g: common_vendor.t(todayExercise.value.remainingCalories),
        h: todayExercise.value.records && todayExercise.value.records.length > 0
      }, todayExercise.value.records && todayExercise.value.records.length > 0 ? {
        i: common_vendor.f(todayExercise.value.records, (r, i, i0) => {
          return {
            a: common_vendor.t(getExerciseIcon(r.icon)),
            b: common_vendor.t(r.exerciseName),
            c: common_vendor.t(r.durationMinutes),
            d: common_vendor.t(r.caloriesBurned),
            e: i
          };
        })
      } : {}, {
        j: !todayPlan.value.generated
      }, !todayPlan.value.generated ? common_vendor.e({
        k: common_vendor.t(chickenSays.value),
        l: common_vendor.t(planHint.value),
        m: !isGenerating.value
      }, !isGenerating.value ? {} : {}, {
        n: !isGenerating.value ? 1 : "",
        o: common_vendor.o(generatePlan, "5c"),
        p: isGenerating.value
      }) : common_vendor.e({
        q: common_vendor.o(generatePlan, "ed"),
        r: common_vendor.f(todayPlan.value.exercises, (ex, idx, i0) => {
          return common_vendor.e({
            a: common_vendor.t(getExerciseIcon(ex.icon)),
            b: common_vendor.n("cat-" + ex.category),
            c: common_vendor.t(ex.name),
            d: common_vendor.t(ex.intensity),
            e: common_vendor.t(ex.duration),
            f: common_vendor.t(ex.calories),
            g: ex.reason
          }, ex.reason ? {
            h: common_vendor.t(ex.reason)
          } : {}, {
            i: idx,
            j: idx * 0.12 + "s"
          });
        }),
        s: common_vendor.t(todayPlan.value.totalDuration),
        t: common_vendor.t(todayPlan.value.totalCalories),
        v: todayPlan.value.advice
      }, todayPlan.value.advice ? {
        w: common_vendor.t(todayPlan.value.advice)
      } : {}), {
        x: fatigue.value.consecutiveDays > 0
      }, fatigue.value.consecutiveDays > 0 ? {
        y: common_vendor.t(fatigue.value.needRest ? "⚠️" : "💪"),
        z: common_vendor.t(fatigue.value.statusText),
        A: Math.min(fatigue.value.consecutiveDays / 7 * 100, 100) + "%",
        B: fatigue.value.needRest ? 1 : "",
        C: common_vendor.t(fatigue.value.consecutiveDays),
        D: common_vendor.t(fatigue.value.suggestion)
      } : {}, {
        E: common_vendor.o(($event) => goTo("/pages/exercise/record"), "ed"),
        F: common_vendor.o(($event) => goTo("/pages/exercise/stats"), "fd"),
        G: common_vendor.o(($event) => goTo("/pages/exercise/settings"), "58")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-e0dfadd1"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/exercise/index.js.map
