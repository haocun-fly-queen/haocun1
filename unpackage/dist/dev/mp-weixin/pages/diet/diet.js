"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const config = require("../../config.js");
const _sfc_main = {
  __name: "diet",
  setup(__props) {
    const userId = common_vendor.ref(null);
    const records = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const viewType = common_vendor.ref("day");
    const mealFilter = common_vendor.ref(0);
    const currentDate = common_vendor.ref(/* @__PURE__ */ new Date());
    const currentYear = common_vendor.ref(0);
    const currentMonth = common_vendor.ref(0);
    const currentDay = common_vendor.ref(0);
    const weekData = common_vendor.ref([]);
    const monthData = common_vendor.ref([]);
    const showCustomFoodDialog = common_vendor.ref(false);
    const showCustomFoodList = common_vendor.ref(false);
    const savingCustomFood = common_vendor.ref(false);
    const customFoodList = common_vendor.ref([]);
    const customFood = common_vendor.ref({
      name: "",
      calorie: "",
      carbs: "",
      protein: "",
      fat: ""
    });
    const selectedFoodIds = common_vendor.ref([]);
    const foodWeightMap = common_vendor.ref({});
    const selectedMealType = common_vendor.ref(2);
    const selectedTotalCalories = common_vendor.computed(() => {
      let total = 0;
      for (const foodId of selectedFoodIds.value) {
        const food = customFoodList.value.find((f) => f.id === foodId);
        if (food) {
          let weight = foodWeightMap.value[foodId];
          if (weight === "" || weight === null || weight === void 0 || weight <= 0) {
            weight = 100;
          }
          total += food.caloriePer100g * Number(weight) / 100;
        }
      }
      return Math.round(total);
    });
    const isTodayView = common_vendor.computed(() => {
      if (viewType.value !== "day")
        return false;
      const today = /* @__PURE__ */ new Date();
      const viewDate = currentDate.value;
      return today.toDateString() === viewDate.toDateString();
    });
    const initDate = () => {
      const date = currentDate.value;
      currentYear.value = date.getFullYear();
      currentMonth.value = date.getMonth() + 1;
      currentDay.value = date.getDate();
    };
    const displayDateRange = common_vendor.computed(() => {
      if (viewType.value === "day") {
        return formatDisplayDate(currentDate.value);
      } else if (viewType.value === "week") {
        const start = getWeekStart(currentDate.value);
        const end = getWeekEnd(currentDate.value);
        return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
      } else {
        return `${currentYear.value}年${currentMonth.value}月`;
      }
    });
    const formatDisplayDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
      const weekday = weekdays[date.getDay()];
      return `${year}.${month}.${day} ${weekday}`;
    };
    const getWeekStart = (date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = day === 0 ? 6 : day - 1;
      d.setDate(d.getDate() - diff);
      return d;
    };
    const getWeekEnd = (date) => {
      const d = getWeekStart(date);
      d.setDate(d.getDate() + 6);
      return d;
    };
    const prevPeriod = () => {
      const newDate = new Date(currentDate.value);
      if (viewType.value === "day") {
        newDate.setDate(newDate.getDate() - 1);
      } else if (viewType.value === "week") {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setMonth(newDate.getMonth() - 1);
      }
      currentDate.value = newDate;
      initDate();
      loadData();
    };
    const nextPeriod = () => {
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const newDate = new Date(currentDate.value);
      newDate.setHours(0, 0, 0, 0);
      if (viewType.value === "day") {
        newDate.setDate(newDate.getDate() + 1);
        if (newDate.getTime() > today.getTime()) {
          common_vendor.index.showToast({ title: "不能查看未来日期", icon: "none" });
          return;
        }
      } else if (viewType.value === "week") {
        newDate.setDate(newDate.getDate() + 7);
        const weekEnd = getWeekEnd(newDate);
        weekEnd.setHours(0, 0, 0, 0);
        if (weekEnd.getTime() > today.getTime()) {
          common_vendor.index.showToast({ title: "不能查看未来日期", icon: "none" });
          return;
        }
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
        const firstDayOfMonth = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
        firstDayOfMonth.setHours(0, 0, 0, 0);
        if (firstDayOfMonth.getTime() > today.getTime()) {
          common_vendor.index.showToast({ title: "不能查看未来日期", icon: "none" });
          return;
        }
      }
      currentDate.value = newDate;
      initDate();
      loadData();
    };
    const goToday = () => {
      currentDate.value = /* @__PURE__ */ new Date();
      initDate();
      loadData();
    };
    const switchView = (type) => {
      viewType.value = type;
      loadData();
    };
    const generateWeekData = () => {
      const start = getWeekStart(currentDate.value);
      const weekDays = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        const dateStr = date.toISOString().split("T")[0];
        const dayRecords = records.value.filter((r) => r.mealTime && r.mealTime.substring(0, 10) === dateStr);
        const totalCalories = dayRecords.reduce((sum, r) => sum + (r.totalCalorie || 0), 0);
        weekDays.push({
          date: dateStr,
          dayName: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"][i],
          totalCalories,
          isToday: date.toDateString() === (/* @__PURE__ */ new Date()).toDateString()
        });
      }
      weekData.value = weekDays;
    };
    const generateMonthData = () => {
      const year = currentYear.value;
      const month = currentMonth.value;
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      const startWeekday = firstDay.getDay() || 7;
      const daysInMonth = lastDay.getDate();
      const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
      const calendar = [];
      let week = [];
      for (let i = startWeekday - 1; i > 0; i--) {
        const day = prevMonthLastDay - i + 1;
        week.push({
          day,
          date: `${year}-${String(month - 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
          isCurrentMonth: false,
          isToday: false,
          hasRecord: false
        });
      }
      const today = /* @__PURE__ */ new Date();
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const dayRecords = records.value.filter((r) => r.mealTime && r.mealTime.substring(0, 10) === dateStr);
        week.push({
          day: d,
          date: dateStr,
          isCurrentMonth: true,
          isToday: today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === d,
          hasRecord: dayRecords.length > 0
        });
        if (week.length === 7) {
          calendar.push(week);
          week = [];
        }
      }
      if (week.length > 0) {
        let nextMonthDay = 1;
        while (week.length < 7) {
          week.push({
            day: nextMonthDay++,
            date: `${year}-${String(month + 1).padStart(2, "0")}-${String(nextMonthDay - 1).padStart(2, "0")}`,
            isCurrentMonth: false,
            isToday: false,
            hasRecord: false
          });
        }
        calendar.push(week);
      }
      monthData.value = calendar;
    };
    const selectWeekDay = (date) => {
      if (date) {
        currentDate.value = new Date(date);
        initDate();
        viewType.value = "day";
        loadData();
      }
    };
    const selectMonthDay = (date) => {
      if (date) {
        currentDate.value = new Date(date);
        initDate();
        viewType.value = "day";
        loadData();
      }
    };
    const getMealTypeName = (type) => {
      const names = { 1: "早餐", 2: "午餐", 3: "晚餐", 4: "加餐" };
      return names[type] || "未知";
    };
    const formatTime = (time) => {
      if (!time)
        return "";
      return time.substring(11, 16);
    };
    const filteredRecords = common_vendor.computed(() => {
      let result = records.value;
      if (viewType.value === "day") {
        const dateStr = currentDate.value.toISOString().split("T")[0];
        result = result.filter((r) => r.mealTime && r.mealTime.substring(0, 10) === dateStr);
      }
      if (mealFilter.value !== 0) {
        result = result.filter((r) => r.mealType === mealFilter.value);
      }
      return result.sort((a, b) => new Date(b.mealTime) - new Date(a.mealTime));
    });
    const filteredTotalCalories = common_vendor.computed(() => {
      if (viewType.value === "day") {
        return filteredRecords.value.reduce((sum, r) => sum + (r.totalCalorie || 0), 0);
      } else {
        return records.value.reduce((sum, r) => sum + (r.totalCalorie || 0), 0);
      }
    });
    const loadData = async () => {
      if (!userId.value)
        return;
      loading.value = true;
      let startDate, endDate;
      if (viewType.value === "day") {
        const dateStr = currentDate.value.toISOString().split("T")[0];
        startDate = dateStr;
        endDate = dateStr;
      } else if (viewType.value === "week") {
        const start = getWeekStart(currentDate.value);
        const end = getWeekEnd(currentDate.value);
        startDate = start.toISOString().split("T")[0];
        endDate = end.toISOString().split("T")[0];
      } else {
        const year = currentYear.value;
        const month = currentMonth.value;
        startDate = `${year}-${String(month).padStart(2, "0")}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;
      }
      try {
        const res = await utils_request.request({
          url: config.API.DIET_RECORDS,
          method: "GET",
          data: {
            userId: userId.value,
            startDate,
            endDate
          }
        });
        if (res.code === 200) {
          records.value = res.data || [];
          for (let record of records.value) {
            await loadRecordItems(record.id);
          }
          if (viewType.value === "week") {
            generateWeekData();
          } else if (viewType.value === "month") {
            generateMonthData();
          }
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/diet/diet.vue:622", "加载记录失败", err);
        common_vendor.index.showToast({ title: "加载失败", icon: "none" });
      } finally {
        loading.value = false;
      }
    };
    const loadRecordItems = async (recordId) => {
      try {
        const res = await utils_request.request({
          url: `${config.API.DIET_RECORD_DETAIL}/${recordId}`,
          method: "GET"
        });
        if (res.code === 200) {
          const record = records.value.find((r) => r.id === recordId);
          if (record) {
            record.items = res.items || [];
          }
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/diet/diet.vue:643", "加载详情失败", err);
      }
    };
    const deleteRecord = (recordId) => {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定删除这条记录吗？",
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await utils_request.request({
                url: `${config.API.DIET_RECORD_DETAIL}/${recordId}?userId=${userId.value}`,
                method: "DELETE"
              });
              if (result.code === 200) {
                common_vendor.index.showToast({ title: "删除成功", icon: "success" });
                loadData();
              } else {
                common_vendor.index.showToast({ title: result.message || "删除失败", icon: "none" });
              }
            } catch (err) {
              common_vendor.index.__f__("error", "at pages/diet/diet.vue:666", "删除失败", err);
              common_vendor.index.showToast({ title: "删除失败，请重试", icon: "none" });
            }
          }
        }
      });
    };
    const goToCamera = () => {
      let presetMealType = 1;
      if (mealFilter.value === 1)
        presetMealType = 1;
      else if (mealFilter.value === 2)
        presetMealType = 2;
      else if (mealFilter.value === 3)
        presetMealType = 3;
      else if (mealFilter.value === 4)
        presetMealType = 4;
      common_vendor.index.redirectTo({
        url: `/pages/camera/camera?mealType=${presetMealType}`
      });
    };
    const openCustomFoodDialog = () => {
      customFood.value = {
        name: "",
        calorie: "",
        carbs: "",
        protein: "",
        fat: ""
      };
      if (showCustomFoodList.value) {
        showCustomFoodList.value = false;
        setTimeout(() => {
          showCustomFoodDialog.value = true;
        }, 150);
      } else {
        showCustomFoodDialog.value = true;
      }
    };
    const closeCustomFoodDialog = () => {
      showCustomFoodDialog.value = false;
    };
    const openCustomFoodList = () => {
      loadCustomFoodList();
      selectedFoodIds.value = [];
      foodWeightMap.value = {};
      if (mealFilter.value !== 0) {
        selectedMealType.value = mealFilter.value;
      } else {
        selectedMealType.value = 2;
      }
      showCustomFoodList.value = true;
    };
    const closeCustomFoodList = () => {
      showCustomFoodList.value = false;
    };
    const loadCustomFoodList = async () => {
      try {
        const res = await utils_request.request({
          url: config.API.FOOD_CUSTOM_LIST,
          method: "GET",
          data: { userId: userId.value }
        });
        if (res.code === 200) {
          customFoodList.value = res.data || [];
          for (const food of customFoodList.value) {
            if (foodWeightMap.value[food.id] === void 0) {
              foodWeightMap.value[food.id] = 100;
            }
          }
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/diet/diet.vue:750", "加载自定义食物失败", err);
      }
    };
    const saveCustomFood = async () => {
      if (!customFood.value.name) {
        common_vendor.index.showToast({ title: "请输入食物名称", icon: "none" });
        return;
      }
      if (!customFood.value.calorie) {
        common_vendor.index.showToast({ title: "请输入热量", icon: "none" });
        return;
      }
      savingCustomFood.value = true;
      try {
        const res = await utils_request.request({
          url: config.API.FOOD_CUSTOM_ADD,
          method: "POST",
          data: {
            userId: userId.value,
            name: customFood.value.name,
            caloriePer100g: parseFloat(customFood.value.calorie),
            carbsPer100g: parseFloat(customFood.value.carbs) || 0,
            proteinPer100g: parseFloat(customFood.value.protein) || 0,
            fatPer100g: parseFloat(customFood.value.fat) || 0
          }
        });
        if (res.code === 200) {
          common_vendor.index.showToast({ title: "添加成功", icon: "success" });
          closeCustomFoodDialog();
          loadCustomFoodList();
        } else {
          common_vendor.index.showToast({ title: res.message || "添加失败", icon: "none" });
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/diet/diet.vue:788", "保存失败", err);
        common_vendor.index.showToast({ title: "添加失败", icon: "none" });
      } finally {
        savingCustomFood.value = false;
      }
    };
    const deleteCustomFood = async (foodId) => {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定删除这个自定义食物吗？",
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await utils_request.request({
                url: `${config.API.FOOD_CUSTOM_DELETE}/${foodId}?userId=${userId.value}`,
                method: "DELETE"
              });
              if (result.code === 200) {
                common_vendor.index.showToast({ title: "删除成功", icon: "success" });
                loadCustomFoodList();
              } else {
                common_vendor.index.showToast({ title: result.message || "删除失败", icon: "none" });
              }
            } catch (err) {
              common_vendor.index.__f__("error", "at pages/diet/diet.vue:814", "删除失败", err);
              common_vendor.index.showToast({ title: "删除失败", icon: "none" });
            }
          }
        }
      });
    };
    const toggleSelectFood = (food) => {
      const index = selectedFoodIds.value.indexOf(food.id);
      if (index === -1) {
        selectedFoodIds.value.push(food.id);
      } else {
        selectedFoodIds.value.splice(index, 1);
      }
    };
    const toggleSelectAll = () => {
      if (selectedFoodIds.value.length === customFoodList.value.length) {
        selectedFoodIds.value = [];
      } else {
        selectedFoodIds.value = customFoodList.value.map((f) => f.id);
      }
    };
    const updateFoodWeight = (foodId, value) => {
      if (value === "" || value === null || value === void 0) {
        foodWeightMap.value[foodId] = "";
        return;
      }
      let weight = parseFloat(value);
      if (!isNaN(weight) && weight > 0) {
        foodWeightMap.value[foodId] = weight;
      }
    };
    const batchAddSelectedFoods = async () => {
      if (selectedFoodIds.value.length === 0) {
        common_vendor.index.showToast({ title: "请先选择食物", icon: "none" });
        return;
      }
      common_vendor.index.showLoading({ title: "添加中...", mask: true });
      const mealType = selectedMealType.value;
      const items = [];
      for (const foodId of selectedFoodIds.value) {
        const food = customFoodList.value.find((f) => f.id === foodId);
        if (food) {
          let weight = foodWeightMap.value[foodId];
          if (weight === "" || weight === null || weight === void 0 || weight <= 0) {
            weight = 100;
          }
          weight = Number(weight);
          items.push({
            foodType: 2,
            foodId: food.id,
            foodName: food.name,
            eatWeight: weight,
            calorie: (food.caloriePer100g * weight / 100).toFixed(0),
            carbs: ((food.carbsPer100g || 0) * weight / 100).toFixed(1),
            protein: ((food.proteinPer100g || 0) * weight / 100).toFixed(1),
            fat: ((food.fatPer100g || 0) * weight / 100).toFixed(1)
          });
        }
      }
      try {
        const res = await utils_request.request({
          url: config.API.DIET_RECORD,
          method: "POST",
          data: {
            userId: userId.value,
            mealType,
            mealTime: (/* @__PURE__ */ new Date()).toISOString(),
            remark: `批量添加自定义食物`,
            items
          }
        });
        common_vendor.index.hideLoading();
        if (res.code === 200) {
          common_vendor.index.showToast({ title: `成功添加 ${items.length} 种食物`, icon: "success" });
          closeCustomFoodList();
          loadData();
        } else {
          common_vendor.index.showToast({ title: res.message || "添加失败", icon: "none" });
        }
      } catch (err) {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("error", "at pages/diet/diet.vue:912", "批量添加失败", err);
        common_vendor.index.showToast({ title: "添加失败", icon: "none" });
      }
    };
    const onPageShow = () => {
      common_vendor.index.__f__("log", "at pages/diet/diet.vue:919", "饮食记录页面显示，刷新数据");
      if (userId.value) {
        loadData();
        loadCustomFoodList();
      }
    };
    common_vendor.onMounted(() => {
      userId.value = common_vendor.index.getStorageSync("userId");
      initDate();
      if (userId.value) {
        loadData();
        loadCustomFoodList();
      } else {
        common_vendor.index.showToast({ title: "请先登录", icon: "none" });
        setTimeout(() => {
          common_vendor.index.reLaunch({ url: "/pages/login/login" });
        }, 1500);
      }
      common_vendor.index.$on("refreshDietRecords", () => {
        common_vendor.index.__f__("log", "at pages/diet/diet.vue:942", "收到刷新饮食记录事件");
        loadData();
      });
    });
    onPageShow();
    common_vendor.onUnmounted(() => {
      common_vendor.index.$off("refreshDietRecords");
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(viewType.value === "day" ? "日期" : viewType.value === "week" ? "周" : "月"),
        b: common_vendor.t(displayDateRange.value),
        c: viewType.value === "day" ? 1 : "",
        d: common_vendor.o(($event) => switchView("day"), "f2"),
        e: viewType.value === "week" ? 1 : "",
        f: common_vendor.o(($event) => switchView("week"), "39"),
        g: viewType.value === "month" ? 1 : "",
        h: common_vendor.o(($event) => switchView("month"), "f6"),
        i: common_vendor.t(viewType.value === "day" ? "天" : viewType.value === "week" ? "周" : "月"),
        j: common_vendor.o(prevPeriod, "b2"),
        k: common_vendor.o(goToday, "ba"),
        l: common_vendor.t(viewType.value === "day" ? "天" : viewType.value === "week" ? "周" : "月"),
        m: common_vendor.o(nextPeriod, "e8"),
        n: mealFilter.value === 0 ? 1 : "",
        o: common_vendor.o(($event) => mealFilter.value = 0, "e0"),
        p: mealFilter.value === 1 ? 1 : "",
        q: common_vendor.o(($event) => mealFilter.value = 1, "5d"),
        r: mealFilter.value === 2 ? 1 : "",
        s: common_vendor.o(($event) => mealFilter.value = 2, "37"),
        t: mealFilter.value === 3 ? 1 : "",
        v: common_vendor.o(($event) => mealFilter.value = 3, "28"),
        w: mealFilter.value === 4 ? 1 : "",
        x: common_vendor.o(($event) => mealFilter.value = 4, "4f"),
        y: common_vendor.t(viewType.value === "day" ? "当日总热量" : viewType.value === "week" ? "本周总热量" : "本月总热量"),
        z: common_vendor.t(filteredTotalCalories.value),
        A: viewType.value === "week"
      }, viewType.value === "week" ? {
        B: common_vendor.f(weekData.value, (day, k0, i0) => {
          return {
            a: common_vendor.t(day.dayName),
            b: common_vendor.t(day.date.substring(5)),
            c: common_vendor.t(day.totalCalories),
            d: day.date,
            e: day.isToday ? 1 : "",
            f: common_vendor.o(($event) => selectWeekDay(day.date), day.date)
          };
        })
      } : {}, {
        C: viewType.value === "month"
      }, viewType.value === "month" ? {
        D: common_vendor.f(["一", "二", "三", "四", "五", "六", "日"], (week, k0, i0) => {
          return {
            a: common_vendor.t(week),
            b: week
          };
        }),
        E: common_vendor.f(monthData.value, (week, weekIndex, i0) => {
          return {
            a: common_vendor.f(week, (day, dayIndex, i1) => {
              return common_vendor.e({
                a: common_vendor.t(day.day),
                b: day.hasRecord
              }, day.hasRecord ? {} : {}, {
                c: dayIndex,
                d: !day.isCurrentMonth ? 1 : "",
                e: day.isToday ? 1 : "",
                f: day.hasRecord ? 1 : "",
                g: common_vendor.o(($event) => selectMonthDay(day.date), dayIndex)
              });
            }),
            b: weekIndex
          };
        })
      } : {}, {
        F: common_vendor.o(openCustomFoodDialog, "f9"),
        G: common_vendor.o(openCustomFoodList, "00"),
        H: filteredRecords.value.length > 0
      }, filteredRecords.value.length > 0 ? {
        I: common_vendor.f(filteredRecords.value, (record, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(getMealTypeName(record.mealType)),
            b: common_vendor.t(formatTime(record.mealTime)),
            c: common_vendor.t(record.totalCalorie),
            d: record.items && record.items.length
          }, record.items && record.items.length ? {
            e: common_vendor.f(record.items, (item, index, i1) => {
              return {
                a: common_vendor.t(item.foodName),
                b: common_vendor.t(item.eatWeight),
                c: common_vendor.t(item.calorie),
                d: index
              };
            })
          } : {}, {
            f: common_vendor.t(record.remark || "无备注"),
            g: common_vendor.o(($event) => deleteRecord(record.id), record.id),
            h: record.id
          });
        })
      } : {}, {
        J: filteredRecords.value.length === 0 && !loading.value
      }, filteredRecords.value.length === 0 && !loading.value ? common_vendor.e({
        K: common_vendor.t(isTodayView.value ? "点击拍照识别添加记录" : "该日期暂无记录"),
        L: isTodayView.value
      }, isTodayView.value ? {
        M: common_vendor.o(goToCamera, "e3")
      } : {}) : {}, {
        N: loading.value
      }, loading.value ? {} : {}, {
        O: showCustomFoodDialog.value
      }, showCustomFoodDialog.value ? {
        P: common_vendor.o(closeCustomFoodDialog, "16"),
        Q: customFood.value.name,
        R: common_vendor.o(($event) => customFood.value.name = $event.detail.value, "c5"),
        S: customFood.value.calorie,
        T: common_vendor.o(($event) => customFood.value.calorie = $event.detail.value, "9f"),
        U: customFood.value.carbs,
        V: common_vendor.o(($event) => customFood.value.carbs = $event.detail.value, "50"),
        W: customFood.value.protein,
        X: common_vendor.o(($event) => customFood.value.protein = $event.detail.value, "ad"),
        Y: customFood.value.fat,
        Z: common_vendor.o(($event) => customFood.value.fat = $event.detail.value, "e4"),
        aa: common_vendor.o(closeCustomFoodDialog, "c1"),
        ab: common_vendor.o(saveCustomFood, "c0"),
        ac: savingCustomFood.value,
        ad: common_vendor.o(() => {
        }, "9d"),
        ae: common_vendor.o(closeCustomFoodDialog, "8a")
      } : {}, {
        af: showCustomFoodList.value
      }, showCustomFoodList.value ? common_vendor.e({
        ag: common_vendor.o(closeCustomFoodList, "8f"),
        ah: common_vendor.o(openCustomFoodDialog, "7b"),
        ai: selectedMealType.value === 1 ? 1 : "",
        aj: common_vendor.o(($event) => selectedMealType.value = 1, "eb"),
        ak: selectedMealType.value === 2 ? 1 : "",
        al: common_vendor.o(($event) => selectedMealType.value = 2, "98"),
        am: selectedMealType.value === 3 ? 1 : "",
        an: common_vendor.o(($event) => selectedMealType.value = 3, "54"),
        ao: selectedMealType.value === 4 ? 1 : "",
        ap: common_vendor.o(($event) => selectedMealType.value = 4, "0c"),
        aq: common_vendor.f(customFoodList.value, (food, k0, i0) => {
          return common_vendor.e({
            a: selectedFoodIds.value.includes(food.id)
          }, selectedFoodIds.value.includes(food.id) ? {} : {}, {
            b: selectedFoodIds.value.includes(food.id) ? 1 : "",
            c: common_vendor.t(food.name),
            d: common_vendor.t(food.caloriePer100g),
            e: foodWeightMap.value[food.id],
            f: common_vendor.o((e) => updateFoodWeight(food.id, e.detail.value), food.id),
            g: common_vendor.o(() => {
            }, food.id),
            h: common_vendor.o(($event) => deleteCustomFood(food.id), food.id),
            i: food.id,
            j: common_vendor.o(($event) => toggleSelectFood(food), food.id)
          });
        }),
        ar: customFoodList.value.length === 0
      }, customFoodList.value.length === 0 ? {} : {}, {
        as: customFoodList.value.length > 0
      }, customFoodList.value.length > 0 ? {
        at: common_vendor.t(selectedFoodIds.value.length),
        av: common_vendor.t(selectedTotalCalories.value),
        aw: common_vendor.t(selectedFoodIds.value.length === customFoodList.value.length ? "取消全选" : "全选"),
        ax: common_vendor.o(toggleSelectAll, "00"),
        ay: common_vendor.t(selectedMealType.value === 1 ? "早餐" : selectedMealType.value === 2 ? "午餐" : selectedMealType.value === 3 ? "晚餐" : "加餐"),
        az: common_vendor.t(selectedFoodIds.value.length),
        aA: common_vendor.o(batchAddSelectedFoods, "a7"),
        aB: selectedFoodIds.value.length === 0
      } : {}, {
        aC: common_vendor.o(() => {
        }, "bd"),
        aD: common_vendor.o(closeCustomFoodList, "26")
      }) : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-97323f43"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/diet/diet.js.map
