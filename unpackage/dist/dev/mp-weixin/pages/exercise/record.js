"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const config = require("../../config.js");
const _sfc_main = {
  __name: "record",
  setup(__props) {
    const userId = common_vendor.ref(null);
    const activeTab = common_vendor.ref("today");
    const showRecordModal = common_vendor.ref(false);
    const calendarYear = common_vendor.ref((/* @__PURE__ */ new Date()).getFullYear());
    const calendarMonth = common_vendor.ref((/* @__PURE__ */ new Date()).getMonth() + 1);
    const calendarData = common_vendor.ref({ days: [], totalDays: 0 });
    const todayRecords = common_vendor.ref([]);
    const allRecords = common_vendor.ref([]);
    const exerciseLibrary = common_vendor.ref([]);
    const selectedExercise = common_vendor.ref(null);
    const focusId = common_vendor.ref("");
    const form = common_vendor.ref({
      durationMinutes: "",
      intensity: 2,
      feeling: 2
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
    const exerciseCategories = common_vendor.computed(() => {
      const cats = {
        cardio: { key: "cardio", name: "有氧", items: [] },
        strength: { key: "strength", name: "无氧", items: [] },
        flexibility: { key: "flexibility", name: "拉伸", items: [] },
        hiit: { key: "hiit", name: "HIIT", items: [] }
      };
      exerciseLibrary.value.forEach((ex) => {
        if (cats[ex.category])
          cats[ex.category].items.push(ex);
      });
      return Object.values(cats).filter((c) => c.items.length > 0);
    });
    const estimatedCalories = common_vendor.computed(() => {
      var _a;
      if (!selectedExercise.value || !form.value.durationMinutes)
        return 0;
      const met = selectedExercise.value.metValue || 5;
      const weight = ((_a = common_vendor.index.getStorageSync("userProfile")) == null ? void 0 : _a.weight) || 65;
      return Math.round(met * weight * (form.value.durationMinutes / 60));
    });
    const canSubmit = common_vendor.computed(() => {
      return selectedExercise.value && form.value.durationMinutes > 0;
    });
    const calendarDays = common_vendor.computed(() => {
      const year = calendarYear.value;
      const month = calendarMonth.value;
      const firstDay = new Date(year, month - 1, 1).getDay();
      const daysInMonth = new Date(year, month, 0).getDate();
      const today = /* @__PURE__ */ new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      const days = [];
      for (let i = 0; i < firstDay; i++)
        days.push({ date: null, day: null, hasExercise: false, isToday: false });
      const exerciseDates = {};
      if (calendarData.value.days) {
        calendarData.value.days.forEach((d) => {
          if (d.hasExercise)
            exerciseDates[d.date] = true;
        });
      }
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        days.push({ date: dateStr, day: d, hasExercise: !!exerciseDates[dateStr], isToday: dateStr === todayStr });
      }
      return days;
    });
    const totalExerciseDays = common_vendor.computed(() => calendarData.value.totalDays || 0);
    const groupedRecords = common_vendor.computed(() => {
      const groups = {};
      allRecords.value.forEach((r) => {
        const date = r.recordTime ? r.recordTime.split("T")[0] || r.recordTime.split(" ")[0] : "unknown";
        if (!groups[date])
          groups[date] = [];
        groups[date].push(r);
      });
      return groups;
    });
    const formatGroupDate = (date) => {
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      if (date === today)
        return "今天";
      const yesterday = new Date(Date.now() - 864e5).toISOString().split("T")[0];
      if (date === yesterday)
        return "昨天";
      const parts = date.split("-");
      return `${parts[1]}月${parts[2]}日`;
    };
    const formatTime = (t) => {
      var _a, _b;
      if (!t)
        return "";
      if (t.includes("T"))
        return ((_a = t.split("T")[1]) == null ? void 0 : _a.substring(0, 5)) || "";
      if (t.includes(" "))
        return ((_b = t.split(" ")[1]) == null ? void 0 : _b.substring(0, 5)) || "";
      return t;
    };
    const changeMonth = (delta) => {
      let m = calendarMonth.value + delta;
      let y = calendarYear.value;
      if (m < 1) {
        m = 12;
        y--;
      }
      if (m > 12) {
        m = 1;
        y++;
      }
      calendarMonth.value = m;
      calendarYear.value = y;
      loadCalendar();
    };
    const selectExercise = (ex) => {
      selectedExercise.value = ex;
    };
    const loadCalendar = async () => {
      try {
        const res = await utils_request.request({
          url: config.API.EXERCISE_CALENDAR,
          method: "GET",
          data: { userId: userId.value, year: calendarYear.value, month: calendarMonth.value }
        });
        if (res.code === 200 && res.data)
          calendarData.value = res.data;
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/exercise/record.vue:307", "加载日历失败", err);
      }
    };
    const loadTodayRecords = async () => {
      try {
        const res = await utils_request.request({
          url: config.API.EXERCISE_RECORDS,
          method: "GET",
          data: { userId: userId.value, days: 1 }
        });
        if (res.code === 200 && res.data)
          todayRecords.value = res.data;
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/exercise/record.vue:320", "加载今日记录失败", err);
      }
    };
    const loadAllRecords = async () => {
      try {
        const res = await utils_request.request({
          url: config.API.EXERCISE_RECORDS,
          method: "GET",
          data: { userId: userId.value, days: 30 }
        });
        if (res.code === 200 && res.data)
          allRecords.value = res.data;
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/exercise/record.vue:333", "加载全部记录失败", err);
      }
    };
    const loadExerciseLibrary = async () => {
      try {
        const res = await utils_request.request({
          url: config.API.EXERCISE_LIBRARY,
          method: "GET"
        });
        if (res.code === 200 && res.data)
          exerciseLibrary.value = res.data;
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/exercise/record.vue:345", "加载运动库失败", err);
      }
    };
    const submitRecord = async () => {
      if (!canSubmit.value)
        return;
      try {
        const res = await utils_request.request({
          url: config.API.EXERCISE_RECORD,
          method: "POST",
          data: {
            userId: userId.value,
            exerciseId: selectedExercise.value.id,
            exerciseName: selectedExercise.value.name,
            category: selectedExercise.value.category,
            durationMinutes: parseInt(form.value.durationMinutes),
            caloriesBurned: estimatedCalories.value,
            intensity: form.value.intensity,
            feeling: form.value.feeling,
            recordTime: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").substring(0, 19)
          }
        });
        if (res.code === 200) {
          common_vendor.index.showToast({ title: "记录成功", icon: "success" });
          showRecordModal.value = false;
          selectedExercise.value = null;
          form.value = { durationMinutes: "", intensity: 2, feeling: 2 };
          loadTodayRecords();
          loadAllRecords();
          loadCalendar();
        }
      } catch (err) {
        common_vendor.index.showToast({ title: "记录失败", icon: "none" });
      }
    };
    const deleteRecord = (id) => {
      common_vendor.index.showModal({
        title: "确认删除",
        content: "确定要删除这条运动记录吗？",
        success: async (res) => {
          if (!res.confirm)
            return;
          try {
            await utils_request.request({
              url: config.API.EXERCISE_RECORD + "/" + id + "?userId=" + userId.value,
              method: "DELETE"
            });
            common_vendor.index.showToast({ title: "已删除", icon: "success" });
            loadTodayRecords();
            loadAllRecords();
            loadCalendar();
          } catch (err) {
            common_vendor.index.showToast({ title: "删除失败", icon: "none" });
          }
        }
      });
    };
    common_vendor.onMounted(() => {
      userId.value = common_vendor.index.getStorageSync("userId");
      if (!userId.value) {
        common_vendor.index.showToast({ title: "请先登录", icon: "none" });
        setTimeout(() => common_vendor.index.reLaunch({ url: "/pages/login/login" }), 1500);
        return;
      }
      loadCalendar();
      loadTodayRecords();
      loadAllRecords();
      loadExerciseLibrary();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(($event) => changeMonth(-1), "7f"),
        b: common_vendor.t(calendarYear.value),
        c: common_vendor.t(calendarMonth.value),
        d: common_vendor.o(($event) => changeMonth(1), "ca"),
        e: common_vendor.f(["日", "一", "二", "三", "四", "五", "六"], (d, k0, i0) => {
          return {
            a: common_vendor.t(d),
            b: d
          };
        }),
        f: common_vendor.f(calendarDays.value, (day, idx, i0) => {
          return common_vendor.e({
            a: day.date
          }, day.date ? {
            b: common_vendor.t(day.day)
          } : {}, {
            c: day.hasExercise
          }, day.hasExercise ? {} : {}, {
            d: idx,
            e: day.isToday ? 1 : "",
            f: day.hasExercise ? 1 : "",
            g: !day.date ? 1 : ""
          });
        }),
        g: common_vendor.t(totalExerciseDays.value),
        h: activeTab.value === "today" ? 1 : "",
        i: common_vendor.o(($event) => activeTab.value = "today", "d0"),
        j: activeTab.value === "all" ? 1 : "",
        k: common_vendor.o(($event) => activeTab.value = "all", "66"),
        l: activeTab.value === "today"
      }, activeTab.value === "today" ? common_vendor.e({
        m: todayRecords.value.length === 0
      }, todayRecords.value.length === 0 ? {} : {
        n: common_vendor.f(todayRecords.value, (r, i, i0) => {
          return {
            a: common_vendor.t(getExerciseIcon(r.icon)),
            b: common_vendor.n("cat-" + (r.category || "cardio")),
            c: common_vendor.t(r.exerciseName),
            d: common_vendor.t(r.recordTime),
            e: common_vendor.t(r.durationMinutes),
            f: common_vendor.t(r.caloriesBurned),
            g: common_vendor.t(["", "低强度", "中强度", "高强度"][r.intensity || 2]),
            h: common_vendor.n("intensity-" + r.intensity),
            i: common_vendor.o(($event) => deleteRecord(r.id), i),
            j: i,
            k: i * 0.1 + "s"
          };
        })
      }) : {}, {
        o: activeTab.value === "all"
      }, activeTab.value === "all" ? common_vendor.e({
        p: allRecords.value.length === 0
      }, allRecords.value.length === 0 ? {} : {
        q: common_vendor.f(groupedRecords.value, (group, date, i0) => {
          return {
            a: common_vendor.t(formatGroupDate(date)),
            b: common_vendor.f(group, (r, i, i1) => {
              return {
                a: common_vendor.t(getExerciseIcon(r.icon)),
                b: common_vendor.n("cat-" + (r.category || "cardio")),
                c: common_vendor.t(r.exerciseName),
                d: common_vendor.t(formatTime(r.recordTime)),
                e: common_vendor.t(r.durationMinutes),
                f: common_vendor.t(r.caloriesBurned),
                g: i
              };
            }),
            c: date
          };
        })
      }) : {}, {
        r: common_vendor.o(($event) => showRecordModal.value = true, "43"),
        s: showRecordModal.value
      }, showRecordModal.value ? common_vendor.e({
        t: common_vendor.o(($event) => showRecordModal.value = false, "e1"),
        v: common_vendor.f(exerciseCategories.value, (cat, k0, i0) => {
          return {
            a: common_vendor.t(cat.name),
            b: common_vendor.f(cat.items, (ex, k1, i1) => {
              return {
                a: common_vendor.t(ex.name),
                b: ex.id,
                c: selectedExercise.value && selectedExercise.value.id === ex.id ? 1 : "",
                d: common_vendor.o(($event) => selectExercise(ex), ex.id)
              };
            }),
            c: cat.key
          };
        }),
        w: common_vendor.o(($event) => focusId.value = "durationInput", "40"),
        x: common_vendor.o(($event) => focusId.value = "", "d6"),
        y: form.value.durationMinutes,
        z: common_vendor.o(($event) => form.value.durationMinutes = $event.detail.value, "dd"),
        A: form.value.intensity === 1 ? 1 : "",
        B: common_vendor.o(($event) => form.value.intensity = 1, "5f"),
        C: form.value.intensity === 2 ? 1 : "",
        D: common_vendor.o(($event) => form.value.intensity = 2, "06"),
        E: form.value.intensity === 3 ? 1 : "",
        F: common_vendor.o(($event) => form.value.intensity = 3, "f4"),
        G: form.value.feeling === 1 ? 1 : "",
        H: common_vendor.o(($event) => form.value.feeling = 1, "e8"),
        I: form.value.feeling === 2 ? 1 : "",
        J: common_vendor.o(($event) => form.value.feeling = 2, "1c"),
        K: form.value.feeling === 3 ? 1 : "",
        L: common_vendor.o(($event) => form.value.feeling = 3, "0f"),
        M: estimatedCalories.value > 0
      }, estimatedCalories.value > 0 ? {
        N: common_vendor.t(estimatedCalories.value)
      } : {}, {
        O: common_vendor.o(submitRecord, "85"),
        P: !canSubmit.value,
        Q: focusId.value,
        R: common_vendor.o(() => {
        }, "eb"),
        S: common_vendor.o(($event) => showRecordModal.value = false, "26")
      }) : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-2fd1083c"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/exercise/record.js.map
