"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const config = require("../../config.js");
const _sfc_main = {
  __name: "home",
  setup(__props) {
    const userName = common_vendor.ref("");
    const userAvatar = common_vendor.ref("/static/default-avatar.png");
    const userId = common_vendor.ref(null);
    const showBubble = common_vendor.ref(false);
    const chickenMsg = common_vendor.ref("叽叽！记得记录饮食哦~");
    const chickenMessages = [
      "叽叽！今天也要好好吃饭~",
      "拍照识别超好用！",
      "坚持记录，健康每一天！",
      "你是最棒的！加油！",
      "记得多喝水哦~",
      "合理饮食，快乐生活！",
      "体检报告可以AI解读啦！",
      "上传体检报告，小唧帮你分析~"
    ];
    const chickenSay = () => {
      const idx = Math.floor(Math.random() * chickenMessages.length);
      chickenMsg.value = chickenMessages[idx];
      showBubble.value = true;
      setTimeout(() => {
        showBubble.value = false;
      }, 2500);
    };
    const targetCalories = common_vendor.ref(2e3);
    const consumedCalories = common_vendor.ref(0);
    const remainingCalories = common_vendor.ref(2e3);
    const calorieProgress = common_vendor.ref(0);
    const recommendCards = common_vendor.ref([]);
    const getCurrentSeason = () => {
      const month = (/* @__PURE__ */ new Date()).getMonth() + 1;
      if (month >= 3 && month <= 5)
        return "spring";
      if (month >= 6 && month <= 8)
        return "summer";
      if (month >= 9 && month <= 11)
        return "autumn";
      return "winter";
    };
    const getSeasonName = () => {
      const season = getCurrentSeason();
      const names = { spring: "🌱 春季", summer: "☀️ 夏季", autumn: "🍂 秋季", winter: "❄️ 冬季" };
      return names[season];
    };
    const getSeasonalFoods = () => {
      const season = getCurrentSeason();
      const foods = {
        spring: [
          { name: "春笋", benefit: "清热解毒", calories: 25, image: "🎋" },
          { name: "草莓", benefit: "维C丰富", calories: 32, image: "🍓" },
          { name: "菠菜", benefit: "补铁养血", calories: 23, image: "🥬" },
          { name: "韭菜", benefit: "温阳补肾", calories: 26, image: "🌿" },
          { name: "豌豆", benefit: "高蛋白", calories: 105, image: "🟢" }
        ],
        summer: [
          { name: "西瓜", benefit: "解暑降温", calories: 30, image: "🍉" },
          { name: "黄瓜", benefit: "清热利水", calories: 15, image: "🥒" },
          { name: "苦瓜", benefit: "降火解毒", calories: 19, image: "🥗" },
          { name: "番茄", benefit: "美白防晒", calories: 20, image: "🍅" },
          { name: "桃子", benefit: "补气养血", calories: 42, image: "🍑" }
        ],
        autumn: [
          { name: "梨", benefit: "润肺止咳", calories: 44, image: "🍐" },
          { name: "南瓜", benefit: "养胃健脾", calories: 26, image: "🎃" },
          { name: "莲藕", benefit: "清热生津", calories: 74, image: "🪷" },
          { name: "柿子", benefit: "润肠通便", calories: 74, image: "🍊" },
          { name: "山药", benefit: "健脾益胃", calories: 57, image: "🥔" }
        ],
        winter: [
          { name: "白萝卜", benefit: "消食化痰", calories: 18, image: "🥕" },
          { name: "白菜", benefit: "养胃生津", calories: 17, image: "🥬" },
          { name: "羊肉", benefit: "温补驱寒", calories: 203, image: "🍖" },
          { name: "橙子", benefit: "维C增强免疫", calories: 47, image: "🍊" },
          { name: "红枣", benefit: "补气养血", calories: 276, image: "🔴" }
        ]
      };
      return foods[season];
    };
    const getSeasonalAdvice = () => {
      const season = getCurrentSeason();
      const advices = {
        spring: "春季是养肝的好时节，多吃绿色蔬菜，少吃油腻食物。",
        summer: "夏季炎热，多补充水分，多吃瓜果蔬菜，少吃辛辣。",
        autumn: "秋季干燥，注意润肺，多吃梨、百合等滋润食物。",
        winter: "冬季寒冷，适当进补，多吃温热食物，注意保暖。"
      };
      return advices[season];
    };
    const generateRecommendations = async () => {
      try {
        const newCards = [];
        const seasonalFoods = getSeasonalFoods();
        const randomFood = seasonalFoods[Math.floor(Math.random() * seasonalFoods.length)];
        newCards.push({
          icon: randomFood.image,
          title: `${getSeasonName()}时令推荐`,
          content: `${randomFood.name} · ${randomFood.benefit} · ${randomFood.calories}kcal/100g`,
          tag: "当季食材",
          type: "seasonal",
          action: "camera",
          foodName: randomFood.name
        });
        let dietAdvice = "";
        let dietTag = "";
        if (consumedCalories.value === 0) {
          dietAdvice = "今天还没有饮食记录，快去拍照识别记录你的餐食吧！";
          dietTag = "待记录";
        } else if (remainingCalories.value < 0) {
          dietAdvice = `今日热量已超标 ${Math.abs(remainingCalories.value)} kcal，建议增加运动消耗`;
          dietTag = "热量超标";
        } else if (remainingCalories.value < 300) {
          dietAdvice = `今日还剩 ${remainingCalories.value} kcal，建议吃点水果或酸奶`;
          dietTag = "热量提醒";
        } else {
          dietAdvice = `今日还有 ${remainingCalories.value} kcal 预算，试试吃些时令食材吧`;
          dietTag = "营养分析";
        }
        newCards.push({
          icon: "🍽️",
          title: "饮食建议",
          content: dietAdvice,
          tag: dietTag,
          type: consumedCalories.value === 0 ? "warning" : remainingCalories.value < 0 ? "warning" : "nutrition",
          action: "diet"
        });
        newCards.push({
          icon: "🩺",
          title: "AI体检报告解读",
          content: "上传体检报告，小唧帮你智能分析指标，给出饮食和运动改善建议！",
          tag: "新功能",
          type: "health",
          action: "health"
        });
        newCards.push({
          icon: getCurrentSeason() === "spring" ? "🌸" : getCurrentSeason() === "summer" ? "☀️" : getCurrentSeason() === "autumn" ? "🍂" : "❄️",
          title: `${getSeasonName()}养生`,
          content: getSeasonalAdvice(),
          tag: "养生知识",
          type: "habit",
          action: "plan"
        });
        recommendCards.value = newCards;
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/home/home.vue:318", "生成推荐失败", err);
        recommendCards.value = [{
          icon: "🍽️",
          title: "饮食建议",
          content: "午餐蛋白质摄入不足，建议增加鸡胸肉或鱼肉",
          tag: "营养分析",
          type: "nutrition",
          action: "diet"
        }];
      }
    };
    const handleRecommendAction = (action, foodName = "") => {
      if (action === "diet") {
        goToDiet();
      } else if (action === "weight") {
        goToWeight();
      } else if (action === "dashboard") {
        goToDashboard();
      } else if (action === "camera") {
        common_vendor.index.navigateTo({
          url: `/pages/camera/camera?searchFood=${encodeURIComponent(foodName)}`
        });
      } else if (action === "plan") {
        goToPlan();
      } else if (action === "health") {
        goToHealthReport();
      }
    };
    const onAvatarError = () => {
      userAvatar.value = "/static/default-avatar.png";
    };
    const getUserInfo = () => {
      const userInfo = common_vendor.index.getStorageSync("userInfo");
      if (userInfo) {
        userName.value = userInfo.nickname || "健康达人";
        let avatar = userInfo.avatar || userInfo.avatarUrl;
        if (avatar && avatar.startsWith("http://")) {
          avatar = avatar.replace("http://", "https://");
        }
        if (avatar && (avatar.startsWith("http") || avatar.startsWith("/static/") || avatar.startsWith("cloud://"))) {
          userAvatar.value = avatar;
        } else {
          userAvatar.value = "/static/default-avatar.png";
        }
      }
      const profile = common_vendor.index.getStorageSync("userProfile");
      if (profile && profile.nickname) {
        userName.value = profile.nickname;
      }
      if (profile && profile.avatarUrl && userAvatar.value === "/static/default-avatar.png") {
        const profileAvatar = profile.avatarUrl;
        if (profileAvatar.startsWith("http") || profileAvatar.startsWith("/static/") || profileAvatar.startsWith("cloud://")) {
          userAvatar.value = profileAvatar;
        }
      }
    };
    const loadCalorieGoal = async () => {
      try {
        const url = config.API.USER_CALORIE_GOAL.replace("{userId}", userId.value);
        const res = await utils_request.request({ url, method: "GET" });
        if (res.code === 200 && res.data) {
          targetCalories.value = res.data;
          updateCalorieDisplay();
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/home/home.vue:387", "获取热量目标失败", err);
        const profile = common_vendor.index.getStorageSync("userProfile");
        if (profile && profile.height && profile.weight) {
          const bmr = 10 * parseFloat(profile.weight) + 6.25 * parseFloat(profile.height) - 5 * (parseInt(profile.age) || 25);
          const baseCalories = profile.gender === 1 ? bmr + 5 : bmr - 161;
          let target = Math.round(baseCalories * 1.2);
          if (profile.goalType === 1)
            target = Math.round(target * 0.8);
          if (profile.goalType === 2)
            target = Math.round(target * 1.1);
          targetCalories.value = target;
          updateCalorieDisplay();
        }
      }
    };
    const loadTodayCalories = async () => {
      try {
        const res = await utils_request.request({
          url: config.API.DIET_TODAY,
          method: "GET",
          data: { userId: userId.value }
        });
        if (res.code === 200) {
          consumedCalories.value = res.data || 0;
          updateCalorieDisplay();
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/home/home.vue:413", "获取今日热量失败", err);
        const today = (/* @__PURE__ */ new Date()).toDateString();
        const savedIntake = common_vendor.index.getStorageSync(`intake_${today}`);
        if (savedIntake) {
          consumedCalories.value = savedIntake;
          updateCalorieDisplay();
        }
      }
    };
    const updateCalorieDisplay = () => {
      remainingCalories.value = Math.max(0, targetCalories.value - consumedCalories.value);
      calorieProgress.value = Math.min(100, consumedCalories.value / targetCalories.value * 100);
    };
    const refreshData = () => {
      if (userId.value) {
        loadTodayCalories();
        loadCalorieGoal();
        generateRecommendations();
      }
    };
    const goToCamera = () => {
      common_vendor.index.navigateTo({ url: "/pages/camera/camera" });
    };
    const goToDiet = () => {
      common_vendor.index.navigateTo({ url: "/pages/diet/diet" });
    };
    const goToDashboard = () => {
      common_vendor.index.navigateTo({ url: "/pages/dashboard/dashboard" });
    };
    const goToPlan = () => {
      common_vendor.index.navigateTo({ url: "/pages/plan/plan" });
    };
    const goToExercise = () => {
      common_vendor.index.navigateTo({ url: "/pages/exercise/index" });
    };
    const goToHealthReport = () => {
      common_vendor.index.navigateTo({ url: "/pages/health/report-list" });
    };
    const goToWeight = () => {
      common_vendor.index.navigateTo({ url: "/pages/weight/weight" });
    };
    const goToProfile = () => {
      common_vendor.index.navigateTo({ url: "/pages/profile/profile" });
    };
    const quickAddMeal = (mealType) => {
      const mealTypeMap = {
        "breakfast": 1,
        "lunch": 2,
        "dinner": 3,
        "snack": 4
      };
      common_vendor.index.navigateTo({
        url: `/pages/camera/camera?mealType=${mealTypeMap[mealType]}`
      });
    };
    common_vendor.onMounted(() => {
      const token = common_vendor.index.getStorageSync("token");
      const userIdStorage = common_vendor.index.getStorageSync("userId");
      if (!token || !userIdStorage) {
        common_vendor.index.reLaunch({ url: "/pages/login/login" });
        return;
      }
      userId.value = userIdStorage;
      getUserInfo();
      if (userId.value) {
        loadCalorieGoal();
        loadTodayCalories();
        generateRecommendations();
      } else {
        const profile = common_vendor.index.getStorageSync("userProfile");
        if (profile) {
          userName.value = profile.nickname || "健康达人";
          if (profile.avatarUrl) {
            userAvatar.value = profile.avatarUrl;
          }
          if (profile.height && profile.weight) {
            const bmr = 10 * parseFloat(profile.weight) + 6.25 * parseFloat(profile.height) - 5 * (parseInt(profile.age) || 25);
            const baseCalories = profile.gender === 1 ? bmr + 5 : bmr - 161;
            let target = Math.round(baseCalories * 1.2);
            if (profile.goalType === 1)
              target = Math.round(target * 0.8);
            if (profile.goalType === 2)
              target = Math.round(target * 1.1);
            targetCalories.value = target;
          }
          const today = (/* @__PURE__ */ new Date()).toDateString();
          const savedIntake = common_vendor.index.getStorageSync(`intake_${today}`);
          if (savedIntake) {
            consumedCalories.value = savedIntake;
            updateCalorieDisplay();
          }
        }
        generateRecommendations();
      }
      common_vendor.index.$on("refreshHome", refreshData);
    });
    common_vendor.onUnmounted(() => {
      common_vendor.index.$off("refreshHome", refreshData);
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: showBubble.value
      }, showBubble.value ? {
        b: common_vendor.t(chickenMsg.value)
      } : {}, {
        c: common_vendor.o(chickenSay, "31"),
        d: userAvatar.value,
        e: common_vendor.o(onAvatarError, "53"),
        f: common_vendor.t(userName.value),
        g: common_vendor.o(goToProfile, "04"),
        h: common_vendor.t(remainingCalories.value),
        i: calorieProgress.value + "%",
        j: common_vendor.t(consumedCalories.value),
        k: common_vendor.t(targetCalories.value),
        l: common_vendor.o(goToCamera, "71"),
        m: common_vendor.o(goToDiet, "48"),
        n: common_vendor.o(goToDashboard, "d0"),
        o: common_vendor.o(goToPlan, "cb"),
        p: common_vendor.o(goToExercise, "a8"),
        q: common_vendor.o(goToHealthReport, "07"),
        r: common_vendor.o(goToWeight, "b0"),
        s: common_vendor.o(goToProfile, "bc"),
        t: common_vendor.o(goToPlan, "8e"),
        v: common_vendor.f(recommendCards.value, (item, idx, i0) => {
          return {
            a: common_vendor.t(item.icon),
            b: common_vendor.t(item.title),
            c: common_vendor.t(item.content),
            d: common_vendor.t(item.tag),
            e: common_vendor.o(($event) => handleRecommendAction(item.action, item.foodName), idx),
            f: common_vendor.n(item.type),
            g: idx
          };
        }),
        w: common_vendor.o(($event) => quickAddMeal("breakfast"), "4e"),
        x: common_vendor.o(($event) => quickAddMeal("lunch"), "95"),
        y: common_vendor.o(($event) => quickAddMeal("dinner"), "a7"),
        z: common_vendor.o(($event) => quickAddMeal("snack"), "7f")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-07e72d3c"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/home/home.js.map
