"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const config = require("../../config.js");
const _sfc_main = {
  __name: "settings",
  setup(__props) {
    const userId = common_vendor.ref(null);
    const fatigue = common_vendor.ref({
      consecutiveDays: 0,
      needRest: false,
      statusText: "加载中...",
      suggestion: ""
    });
    const reminder = common_vendor.ref({
      remindTime: "18:00",
      remindDays: "1,2,3,4,5",
      isEnabled: 1
    });
    const dayOptions = [
      { label: "一", value: 1 },
      { label: "二", value: 2 },
      { label: "三", value: 3 },
      { label: "四", value: 4 },
      { label: "五", value: 5 },
      { label: "六", value: 6 },
      { label: "日", value: 7 }
    ];
    const selectedDays = common_vendor.ref([1, 2, 3, 4, 5]);
    const weekDays = common_vendor.computed(() => {
      const labels = ["一", "二", "三", "四", "五", "六", "日"];
      const today = /* @__PURE__ */ new Date();
      const todayDay = today.getDay() === 0 ? 7 : today.getDay();
      return labels.map((label, i) => ({
        label,
        hasExercise: i + 1 <= fatigue.value.consecutiveDays && i + 1 < todayDay,
        isToday: i + 1 === todayDay
      }));
    });
    const toggleReminder = (e) => {
      reminder.value.isEnabled = e.detail.value ? 1 : 0;
    };
    const onTimeChange = (e) => {
      reminder.value.remindTime = e.detail.value;
    };
    const toggleDay = (day) => {
      const idx = selectedDays.value.indexOf(day);
      if (idx >= 0) {
        selectedDays.value.splice(idx, 1);
      } else {
        selectedDays.value.push(day);
        selectedDays.value.sort();
      }
    };
    const loadFatigue = async () => {
      try {
        const res = await utils_request.request({
          url: config.API.EXERCISE_FATIGUE,
          method: "GET",
          data: { userId: userId.value }
        });
        if (res.code === 200 && res.data)
          fatigue.value = res.data;
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/exercise/settings.vue:164", "加载疲劳度失败", err);
      }
    };
    const loadReminder = async () => {
      try {
        const res = await utils_request.request({
          url: config.API.EXERCISE_REMINDER,
          method: "GET",
          data: { userId: userId.value }
        });
        if (res.code === 200 && res.data) {
          reminder.value = res.data;
          if (res.data.remindDays) {
            selectedDays.value = res.data.remindDays.split(",").map(Number);
          }
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/exercise/settings.vue:182", "加载提醒设置失败", err);
      }
    };
    const saveReminder = async () => {
      try {
        const res = await utils_request.request({
          url: config.API.EXERCISE_REMINDER,
          method: "POST",
          data: {
            userId: userId.value,
            remindTime: reminder.value.remindTime,
            remindDays: selectedDays.value.join(","),
            isEnabled: reminder.value.isEnabled
          }
        });
        if (res.code === 200) {
          common_vendor.index.showToast({ title: "保存成功", icon: "success" });
        }
      } catch (err) {
        common_vendor.index.showToast({ title: "保存失败", icon: "none" });
      }
    };
    common_vendor.onMounted(() => {
      userId.value = common_vendor.index.getStorageSync("userId");
      if (!userId.value) {
        common_vendor.index.showToast({ title: "请先登录", icon: "none" });
        setTimeout(() => common_vendor.index.reLaunch({ url: "/pages/login/login" }), 1500);
        return;
      }
      loadFatigue();
      loadReminder();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(fatigue.value.needRest ? "⚠️" : "💪"),
        b: common_vendor.t(fatigue.value.statusText),
        c: Math.min(fatigue.value.consecutiveDays / 7 * 100, 100) + "%",
        d: fatigue.value.needRest ? 1 : "",
        e: fatigue.value.consecutiveDays >= 3 ? 1 : "",
        f: common_vendor.t(fatigue.value.consecutiveDays),
        g: fatigue.value.needRest ? 1 : "",
        h: common_vendor.t(fatigue.value.suggestion),
        i: common_vendor.f(weekDays.value, (day, i, i0) => {
          return {
            a: common_vendor.t(day.hasExercise ? "✅" : day.isToday ? "📍" : "·"),
            b: day.hasExercise ? 1 : "",
            c: day.isToday ? 1 : "",
            d: common_vendor.t(day.label),
            e: i
          };
        }),
        j: reminder.value.isEnabled === 1,
        k: common_vendor.o(toggleReminder, "20"),
        l: reminder.value.isEnabled === 1
      }, reminder.value.isEnabled === 1 ? {
        m: common_vendor.t(reminder.value.remindTime || "18:00"),
        n: reminder.value.remindTime,
        o: common_vendor.o(onTimeChange, "17")
      } : {}, {
        p: reminder.value.isEnabled === 1
      }, reminder.value.isEnabled === 1 ? {
        q: common_vendor.f(dayOptions, (day, idx, i0) => {
          return {
            a: common_vendor.t(day.label),
            b: idx,
            c: selectedDays.value.includes(day.value) ? 1 : "",
            d: common_vendor.o(($event) => toggleDay(day.value), idx)
          };
        })
      } : {}, {
        r: reminder.value.isEnabled === 1
      }, reminder.value.isEnabled === 1 ? {
        s: common_vendor.o(saveReminder, "c7")
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-f3f78a19"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/exercise/settings.js.map
