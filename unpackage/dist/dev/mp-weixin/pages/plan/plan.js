"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const config = require("../../config.js");
const _sfc_main = {
  __name: "plan",
  setup(__props) {
    const userId = common_vendor.ref(null);
    const userProfile = common_vendor.ref(null);
    const todayMeals = common_vendor.ref([]);
    const targetCalories = common_vendor.ref(2e3);
    const consumedCalories = common_vendor.ref(0);
    const remainingCalories = common_vendor.ref(2e3);
    const isGenerating = common_vendor.ref(false);
    const dailyPlan = common_vendor.ref(null);
    const progressPercent = common_vendor.ref(0);
    const generateHint = common_vendor.ref("");
    const animatedCalories = common_vendor.ref(0);
    const ringPercent = common_vendor.ref(0);
    const waterCount = common_vendor.ref(0);
    const tips = [
      "蛋白质是减脂期的好朋友，每餐保证一个拳头大小的优质蛋白",
      "吃饭时细嚼慢咽，每口咀嚼20次以上，有助于消化和控制食量",
      "蔬菜应该占每餐的一半以上，颜色越丰富营养越全面",
      "减脂不等于不吃脂肪，适量的坚果和橄榄油对身体有益",
      "喝水不足会影响新陈代谢，每天至少喝8杯水",
      "睡前3小时尽量不要进食，给身体足够的消化时间",
      "主食不要完全不吃，选择粗粮替代精制米面更健康",
      "水果虽然健康但含糖量不低，每天控制在200-350克为宜",
      "鸡蛋是最完美的蛋白质来源之一，每天1-2个完全没问题",
      "烹饪方式很重要：蒸煮 > 炖 > 炒 > 煎 > 炸"
    ];
    const dailyTip = common_vendor.computed(() => {
      const today = /* @__PURE__ */ new Date();
      const idx = (today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate()) % tips.length;
      return tips[idx];
    });
    const chickenSays = common_vendor.computed(() => {
      const remaining = remainingMealCount.value;
      const consumed = consumedCalories.value;
      if (consumed === 0)
        return "今天还没吃呢！让我帮你安排~";
      if (remaining === 0)
        return "今天都吃好啦！真棒~";
      if (remainingCalories.value < 0)
        return "热量有点超了，下面要控制哦~";
      if (remaining === 1)
        return "还剩1餐，我来帮你安排！";
      return `还剩${remaining}餐，交给我吧！`;
    });
    const todayStr = common_vendor.computed(() => {
      const d = /* @__PURE__ */ new Date();
      const weekDay = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
      return `${d.getMonth() + 1}月${d.getDate()}日 周${weekDay}`;
    });
    const greeting = common_vendor.computed(() => {
      const h = (/* @__PURE__ */ new Date()).getHours();
      const p = userProfile.value;
      const name = (p == null ? void 0 : p.nickname) || "你";
      if (h < 6)
        return `${name}，夜深了早点休息 🌙`;
      if (h < 11)
        return `早上好${name}！记得吃早餐 ☀️`;
      if (h < 14)
        return `中午好${name}！该吃午餐啦 🍚`;
      if (h < 18)
        return `下午好${name}！补充能量 💪`;
      return `晚上好${name}！晚餐别太晚 🌆`;
    });
    const recordedCount = common_vendor.computed(() => todayMeals.value.length);
    const remainingMealCount = common_vendor.computed(() => {
      const recordedTypes = todayMeals.value.map((m) => m.type);
      return [1, 2, 3, 4].filter((t) => !recordedTypes.includes(t)).length;
    });
    const mealIndicators = common_vendor.computed(() => {
      const recordedTypes = todayMeals.value.map((m) => m.type);
      return [
        { type: 1, name: "早餐", icon: "🌅", done: recordedTypes.includes(1) },
        { type: 2, name: "午餐", icon: "☀️", done: recordedTypes.includes(2) },
        { type: 3, name: "晚餐", icon: "🌙", done: recordedTypes.includes(3) },
        { type: 4, name: "加餐", icon: "🍎", done: recordedTypes.includes(4) }
      ];
    });
    const ringStyle = common_vendor.computed(() => {
      const deg = ringPercent.value / 100 * 360;
      return {
        background: `conic-gradient(#FF8C42 ${deg}deg, #FFE5D0 ${deg}deg)`
      };
    });
    const getFoodIcon = (name) => {
      if (!name)
        return "🍽️";
      const iconMap = {
        "饭": "🍚",
        "粥": "🍚",
        "面": "🍜",
        "馒头": "🍞",
        "面包": "🍞",
        "麦": "🥣",
        "薯": "🍠",
        "玉米": "🌽",
        "鸡": "🍗",
        "鸭": "🦆",
        "猪": "🥩",
        "牛": "🥩",
        "羊": "🥩",
        "鱼": "🐟",
        "虾": "🦐",
        "蟹": "🦀",
        "蛋": "🥚",
        "豆腐": "🧈",
        "豆": "🫘",
        "奶": "🥛",
        "酸奶": "🥛",
        "西兰花": "🥦",
        "菠菜": "🥬",
        "白菜": "🥬",
        "青菜": "🥬",
        "胡萝卜": "🥕",
        "番茄": "🍅",
        "黄瓜": "🥒",
        "茄子": "🍆",
        "土豆": "🥔",
        "洋葱": "🧅",
        "蘑菇": "🍄",
        "木耳": "🍄",
        "苹果": "🍎",
        "香蕉": "🍌",
        "橙": "🍊",
        "葡萄": "🍇",
        "草莓": "🍓",
        "西瓜": "🍉",
        "梨": "🍐",
        "桃": "🍑",
        "坚果": "🥜",
        "核桃": "🥜",
        "花生": "🥜",
        "汤": "🍲",
        "沙拉": "🥗"
      };
      for (const [key, icon] of Object.entries(iconMap)) {
        if (name.includes(key))
          return icon;
      }
      return "🍽️";
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
    const getMealName = (type) => {
      const map = { 1: "早餐", 2: "午餐", 3: "晚餐", 4: "加餐" };
      return map[type] || "其他";
    };
    const toggleWater = (index) => {
      if (index === waterCount.value) {
        waterCount.value = index - 1;
      } else {
        waterCount.value = index;
      }
      const today = (/* @__PURE__ */ new Date()).toDateString();
      common_vendor.index.setStorageSync(`water_${today}`, waterCount.value);
    };
    const loadWaterCount = () => {
      const today = (/* @__PURE__ */ new Date()).toDateString();
      waterCount.value = common_vendor.index.getStorageSync(`water_${today}`) || 0;
    };
    const loadUserProfile = () => {
      try {
        const profile = common_vendor.index.getStorageSync("userProfile") || {};
        const userInfo = common_vendor.index.getStorageSync("userInfo") || {};
        userProfile.value = {
          nickname: profile.nickname || userInfo.nickname || "",
          gender: profile.gender || 1,
          age: profile.age || 25,
          height: profile.height || 170,
          weight: profile.weight || 65,
          targetWeight: profile.targetWeight || 60,
          activityLevel: profile.activityLevel || 1,
          goalType: profile.goalType || 1,
          dietPreference: profile.dietPreference || "none",
          tabooDetail: profile.tabooDetail || "",
          allergies: profile.allergies || ""
        };
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/plan/plan.vue:456", "加载用户档案失败", e);
      }
    };
    const loadCalorieGoal = async () => {
      try {
        const url = config.API.USER_CALORIE_GOAL.replace("{userId}", userId.value);
        const res = await utils_request.request({ url, method: "GET" });
        if (res.code === 200 && res.data) {
          targetCalories.value = res.data;
        } else {
          calculateLocalGoal();
        }
      } catch (err) {
        calculateLocalGoal();
      }
      updateCalorieStatus();
    };
    const calculateLocalGoal = () => {
      const p = userProfile.value;
      if (!p)
        return;
      const bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age;
      const base = p.gender === 1 ? bmr + 5 : bmr - 161;
      const mult = [1.2, 1.375, 1.55, 1.725, 1.9][p.activityLevel - 1] || 1.2;
      let target = Math.round(base * mult);
      if (p.goalType === 1)
        target = Math.round(target * 0.8);
      if (p.goalType === 2)
        target = Math.round(target * 1.1);
      targetCalories.value = target;
    };
    const loadTodayMeals = async () => {
      try {
        const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        const res = await utils_request.request({
          url: config.API.DIET_TODAY,
          method: "GET",
          data: { userId: userId.value, date: today }
        });
        common_vendor.index.__f__("log", "at pages/plan/plan.vue:497", "DIET_TODAY 返回:", JSON.stringify(res));
        if (res.code === 200) {
          consumedCalories.value = res.data || 0;
          const meals = res.meals || [];
          todayMeals.value = meals.map((m) => ({
            type: m.type || 0,
            typeName: m.typeName || getMealName(m.type || 0),
            foods: m.foods || "",
            calories: m.calories || 0
          }));
          common_vendor.index.__f__("log", "at pages/plan/plan.vue:508", "todayMeals:", JSON.stringify(todayMeals.value));
        } else {
          todayMeals.value = [];
          consumedCalories.value = 0;
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/plan/plan.vue:514", "获取今日饮食失败", err);
        todayMeals.value = [];
        consumedCalories.value = 0;
      }
      updateCalorieStatus();
    };
    const updateCalorieStatus = () => {
      remainingCalories.value = targetCalories.value - consumedCalories.value;
      const percent = targetCalories.value > 0 ? Math.min(100, consumedCalories.value / targetCalories.value * 100) : 0;
      progressPercent.value = percent;
      setTimeout(() => {
        animateNumber(0, remainingCalories.value > 0 ? remainingCalories.value : 0, 1e3, (v) => {
          animatedCalories.value = v;
        });
        animateNumber(0, percent, 800, (v) => {
          ringPercent.value = v;
        });
      }, 200);
      const recordedNames = todayMeals.value.map((m) => m.typeName);
      ["早餐", "午餐", "晚餐", "加餐"].filter((n) => !recordedNames.includes(n));
      if (consumedCalories.value === 0) {
        generateHint.value = `今天还没开始记录呢，让小唧帮你规划一日三餐吧`;
      } else if (remainingCalories.value < 0) {
        generateHint.value = `热量超标了 ${Math.abs(remainingCalories.value)} kcal，小唧会推荐低卡方案`;
      } else {
        generateHint.value = `已记录${recordedNames.join("、")}，剩余 ${remainingCalories.value} kcal`;
      }
    };
    const calculateBMR = () => {
      const p = userProfile.value;
      if (!p)
        return 1500;
      const bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age;
      return (p.gender || 1) === 1 ? bmr + 5 : bmr - 161;
    };
    const getNextMeals = () => {
      const allMeals = [
        { type: 1, name: "早餐" },
        { type: 2, name: "午餐" },
        { type: 3, name: "晚餐" },
        { type: 4, name: "加餐" }
      ];
      const recordedTypes = todayMeals.value.map((m) => m.type);
      return allMeals.filter((m) => !recordedTypes.includes(m.type));
    };
    const generateDailyPlan = async () => {
      if (isGenerating.value)
        return;
      isGenerating.value = true;
      try {
        await loadTodayMeals();
        const p = userProfile.value || {};
        const nextMeals = getNextMeals();
        if (nextMeals.length === 0) {
          common_vendor.index.showToast({ title: "今日已全部记录完毕", icon: "none" });
          isGenerating.value = false;
          return;
        }
        const params = {
          userId: userId.value,
          profile: {
            gender: p.gender || 1,
            age: p.age || 25,
            height: p.height || 170,
            weight: p.weight || 65,
            targetWeight: p.targetWeight || 60,
            activityLevel: p.activityLevel || 1,
            goalType: p.goalType || 1,
            bmr: calculateBMR()
          },
          restrictions: {
            dietPreference: p.dietPreference || "none",
            tabooDetail: p.tabooDetail || "",
            allergies: p.allergies ? p.allergies.split(/[,，、]/) : []
          },
          calorieStatus: {
            target: targetCalories.value,
            consumed: consumedCalories.value,
            remaining: remainingCalories.value,
            progressPercent: progressPercent.value
          },
          recordedMeals: todayMeals.value.map((m) => ({
            type: m.type,
            typeName: m.typeName,
            foods: m.foods,
            calories: m.calories
          })),
          targetMeals: nextMeals,
          targetMeal: nextMeals[0]
        };
        const res = await utils_request.request({
          url: config.API.AI_DAILY_PLAN,
          method: "POST",
          data: params,
          timeout: 3e4
        });
        if (res.code === 200 && res.data) {
          dailyPlan.value = res.data;
          const unrecorded = res.data.meals.filter((m) => !m.recorded).length;
          common_vendor.index.showToast({ title: `小唧已推荐 ${unrecorded} 餐`, icon: "success" });
        } else {
          throw new Error(res.message || "生成失败");
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/plan/plan.vue:633", "全天规划失败", err);
        common_vendor.index.showToast({ title: "小唧累了，请稍后再试", icon: "none" });
      } finally {
        isGenerating.value = false;
      }
    };
    const recordMealPlan = async (meal, idx) => {
      common_vendor.index.showModal({
        title: "确认记录",
        content: `确认记录${meal.mealType}方案（${meal.totalCalories} kcal）？`,
        success: async (res) => {
          if (!res.confirm)
            return;
          try {
            let getWeight = function(amount) {
              if (!amount)
                return 100;
              let reg = /(\d+)g/;
              let match = amount.match(reg);
              if (match && match[1]) {
                return parseInt(match[1]);
              }
              return 100;
            };
            const now = /* @__PURE__ */ new Date();
            const mealTime = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0") + " " + String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0") + ":" + String(now.getSeconds()).padStart(2, "0");
            const items = meal.foods.map((f) => ({
              foodName: f.name,
              eatWeight: getWeight(f.amount),
              // ✅ 这里必对
              calorie: f.calories || 0,
              carbs: f.carbs || 0,
              protein: f.protein || 0,
              fat: f.fat || 0
            }));
            const mealData = {
              userId: userId.value,
              mealType: meal.mealTypeCode,
              mealTime,
              totalCalorie: meal.totalCalories,
              remark: meal.mealType + "（AI方案）",
              items
            };
            await utils_request.request({ url: config.API.DIET_RECORD, method: "POST", data: mealData });
            dailyPlan.value.meals[idx].recorded = true;
            await loadTodayMeals();
            common_vendor.index.showToast({ title: `${meal.mealType}记录成功`, icon: "success" });
            common_vendor.index.$emit("refreshHome");
            common_vendor.index.$emit("refreshDashboard");
          } catch (err) {
            common_vendor.index.__f__("error", "at pages/plan/plan.vue:696", "记录失败", err);
            common_vendor.index.showToast({ title: "记录失败", icon: "none" });
          }
        }
      });
    };
    const regenerateDaily = () => {
      dailyPlan.value = null;
      generateDailyPlan();
    };
    common_vendor.onMounted(() => {
      userId.value = common_vendor.index.getStorageSync("userId");
      if (!userId.value) {
        common_vendor.index.showToast({ title: "请先登录", icon: "none" });
        setTimeout(() => common_vendor.index.reLaunch({ url: "/pages/login/login" }), 1500);
        return;
      }
      loadUserProfile();
      loadTodayMeals();
      loadCalorieGoal();
      loadWaterCount();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(greeting.value),
        b: common_vendor.t(todayStr.value),
        c: common_vendor.t(recordedCount.value),
        d: recordedCount.value / 4 * 100 + "%",
        e: common_vendor.f(mealIndicators.value, (m, k0, i0) => {
          return {
            a: common_vendor.t(m.done ? "✅" : m.icon),
            b: common_vendor.t(m.name),
            c: m.type,
            d: m.done ? 1 : ""
          };
        }),
        f: common_vendor.s(ringStyle.value),
        g: common_vendor.t(animatedCalories.value),
        h: common_vendor.t(targetCalories.value),
        i: common_vendor.t(consumedCalories.value),
        j: common_vendor.t(remainingCalories.value),
        k: common_vendor.t(waterCount.value),
        l: common_vendor.f(8, (i, k0, i0) => {
          return {
            a: common_vendor.t(i <= waterCount.value ? "💧" : "🫗"),
            b: i,
            c: i <= waterCount.value ? 1 : "",
            d: common_vendor.o(($event) => toggleWater(i), i)
          };
        }),
        m: waterCount.value / 8 * 100 + "%",
        n: !dailyPlan.value
      }, !dailyPlan.value ? common_vendor.e({
        o: common_vendor.t(chickenSays.value),
        p: common_vendor.t(generateHint.value),
        q: !isGenerating.value
      }, !isGenerating.value ? {
        r: common_vendor.t(remainingMealCount.value)
      } : {}, {
        s: !isGenerating.value ? 1 : "",
        t: common_vendor.o(generateDailyPlan, "a0"),
        v: isGenerating.value
      }) : {}, {
        w: todayMeals.value.length > 0
      }, todayMeals.value.length > 0 ? {
        x: common_vendor.f(todayMeals.value, (meal, index, i0) => {
          return {
            a: common_vendor.n("dot-" + meal.type),
            b: common_vendor.t(meal.typeName),
            c: common_vendor.n("type-" + meal.type),
            d: common_vendor.t(meal.calories),
            e: common_vendor.t(meal.foods || "未记录食物"),
            f: index
          };
        })
      } : {}, {
        y: !dailyPlan.value
      }, !dailyPlan.value ? {
        z: common_vendor.t(dailyTip.value)
      } : {}, {
        A: dailyPlan.value
      }, dailyPlan.value ? common_vendor.e({
        B: common_vendor.f(dailyPlan.value.meals, (meal, idx, i0) => {
          return common_vendor.e({
            a: common_vendor.t(meal.mealType),
            b: common_vendor.n("type-" + meal.mealTypeCode),
            c: common_vendor.t(meal.totalCalories),
            d: meal.recorded
          }, meal.recorded ? {} : {}, {
            e: common_vendor.f(meal.foods, (food, fi, i1) => {
              return {
                a: common_vendor.t(getFoodIcon(food.name)),
                b: common_vendor.t(food.name),
                c: common_vendor.t(food.amount),
                d: common_vendor.t(food.calories),
                e: common_vendor.t(food.carbs || 0),
                f: common_vendor.t(food.protein || 0),
                g: common_vendor.t(food.fat || 0),
                h: fi
              };
            }),
            f: meal.nutrition
          }, meal.nutrition ? common_vendor.e({
            g: (meal.nutrition.carbs || 0) > 15
          }, (meal.nutrition.carbs || 0) > 15 ? {
            h: common_vendor.t(meal.nutrition.carbs)
          } : {}, {
            i: (meal.nutrition.carbs || 33) + "%",
            j: (meal.nutrition.protein || 0) > 15
          }, (meal.nutrition.protein || 0) > 15 ? {
            k: common_vendor.t(meal.nutrition.protein)
          } : {}, {
            l: (meal.nutrition.protein || 33) + "%",
            m: (meal.nutrition.fat || 0) > 15
          }, (meal.nutrition.fat || 0) > 15 ? {
            n: common_vendor.t(meal.nutrition.fat)
          } : {}, {
            o: (meal.nutrition.fat || 34) + "%"
          }) : {}, {
            p: meal.reason
          }, meal.reason ? {
            q: common_vendor.t(meal.reason)
          } : {}, {
            r: !meal.recorded
          }, !meal.recorded ? {
            s: common_vendor.t(meal.mealType),
            t: common_vendor.o(($event) => recordMealPlan(meal, idx), idx)
          } : {}, {
            v: idx,
            w: meal.recorded ? 1 : "",
            x: idx * 0.12 + "s"
          });
        }),
        C: dailyPlan.value.dailySummary
      }, dailyPlan.value.dailySummary ? common_vendor.e({
        D: common_vendor.t(dailyPlan.value.dailySummary.totalCalories),
        E: common_vendor.t(dailyPlan.value.dailySummary.totalCarbs || "-"),
        F: common_vendor.t(dailyPlan.value.dailySummary.totalProtein || "-"),
        G: common_vendor.t(dailyPlan.value.dailySummary.totalFat || "-"),
        H: dailyPlan.value.dailySummary.advice
      }, dailyPlan.value.dailySummary.advice ? {
        I: common_vendor.t(dailyPlan.value.dailySummary.advice)
      } : {}) : {}, {
        J: common_vendor.o(regenerateDaily, "35")
      }) : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-bee4c29d"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/plan/plan.js.map
