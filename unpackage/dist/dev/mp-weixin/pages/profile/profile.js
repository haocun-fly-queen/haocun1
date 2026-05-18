"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const config = require("../../config.js");
const _sfc_main = {
  __name: "profile",
  setup(__props) {
    const avatarUrl = common_vendor.ref("");
    const nickname = common_vendor.ref("");
    const gender = common_vendor.ref(1);
    const age = common_vendor.ref("");
    const height = common_vendor.ref("");
    const weight = common_vendor.ref("");
    const targetWeight = common_vendor.ref("");
    const activityLevel = common_vendor.ref(1);
    const activityText = common_vendor.ref("");
    const goalType = common_vendor.ref(1);
    const goalText = common_vendor.ref("");
    const allergies = common_vendor.ref("");
    const dietPreference = common_vendor.ref("none");
    const tabooDetail = common_vendor.ref("");
    const userId = common_vendor.ref(null);
    const isLoading = common_vendor.ref(false);
    const goalOptions = ["减脂", "增肌", "保持体重"];
    const activityOptions = ["久坐（很少运动）", "轻度活动（每周1-2天）", "中度活动（每周3-5天）", "重度活动（每天运动）", "极重度活动（体力劳动者）"];
    const convertCloudPath = (cloudPath) => {
      if (!cloudPath || !cloudPath.startsWith("cloud://")) {
        return cloudPath;
      }
      try {
        const withoutPrefix = cloudPath.replace("cloud://", "");
        const firstSlashIndex = withoutPrefix.indexOf("/");
        if (firstSlashIndex === -1)
          return cloudPath;
        const envId = withoutPrefix.substring(0, firstSlashIndex);
        const filePath = withoutPrefix.substring(firstSlashIndex + 1);
        return `https://${envId}.tcb.qcloud.la/${filePath}`;
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/profile/profile.vue:206", "云路径转换失败", e);
        return cloudPath;
      }
    };
    common_vendor.onMounted(() => {
      userId.value = common_vendor.index.getStorageSync("userId");
      const userInfo = common_vendor.index.getStorageSync("userInfo");
      if (userInfo) {
        nickname.value = userInfo.nickname || "";
      }
      let savedProfile = common_vendor.index.getStorageSync("userProfile");
      if (savedProfile) {
        if (savedProfile.activityLevel && (savedProfile.activityLevel < 1 || savedProfile.activityLevel > 5)) {
          savedProfile.activityLevel = 1;
          common_vendor.index.setStorageSync("userProfile", savedProfile);
        }
        if (savedProfile.goalType && (savedProfile.goalType < 1 || savedProfile.goalType > 3)) {
          savedProfile.goalType = 1;
          common_vendor.index.setStorageSync("userProfile", savedProfile);
        }
      }
      if (savedProfile) {
        nickname.value = savedProfile.nickname || nickname.value;
        gender.value = savedProfile.gender || 1;
        age.value = savedProfile.age || "";
        height.value = savedProfile.height || "";
        weight.value = savedProfile.weight || "";
        targetWeight.value = savedProfile.targetWeight || "";
        let rawActivity = Number(savedProfile.activityLevel);
        if (isNaN(rawActivity) || rawActivity < 1 || rawActivity > 5) {
          rawActivity = 1;
        }
        activityLevel.value = rawActivity;
        activityText.value = activityOptions[activityLevel.value - 1] || activityOptions[0];
        let rawGoal = Number(savedProfile.goalType);
        if (isNaN(rawGoal) || rawGoal < 1 || rawGoal > 3) {
          rawGoal = 1;
        }
        goalType.value = rawGoal;
        goalText.value = goalOptions[goalType.value - 1] || goalOptions[0];
        let savedAvatar = savedProfile.avatarUrl || "";
        if (savedAvatar && savedAvatar.startsWith("cloud://")) {
          savedAvatar = convertCloudPath(savedAvatar);
        }
        avatarUrl.value = savedAvatar || avatarUrl.value;
        allergies.value = savedProfile.allergies || "";
        dietPreference.value = savedProfile.dietPreference || "none";
        tabooDetail.value = savedProfile.tabooDetail || "";
      }
    });
    const handleLogout = () => {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要退出登录吗？",
        success: (res) => {
          if (res.confirm) {
            common_vendor.index.removeStorageSync("token");
            common_vendor.index.removeStorageSync("isLogin");
            common_vendor.index.removeStorageSync("userId");
            common_vendor.index.removeStorageSync("userInfo");
            common_vendor.index.removeStorageSync("userProfile");
            common_vendor.index.reLaunch({ url: "/pages/login/login" });
            common_vendor.index.showToast({ title: "已退出", icon: "success" });
          }
        }
      });
    };
    const selectActivity = (level) => {
      activityLevel.value = level;
      activityText.value = activityOptions[level - 1];
      common_vendor.index.__f__("log", "at pages/profile/profile.vue:298", "选择活动水平:", activityText.value);
    };
    const selectGoal = (goal) => {
      goalType.value = goal;
      goalText.value = goalOptions[goal - 1];
      common_vendor.index.__f__("log", "at pages/profile/profile.vue:305", "选择健康目标:", goalText.value);
    };
    const chooseAvatar = () => {
      common_vendor.index.chooseImage({
        count: 1,
        sourceType: ["album", "camera"],
        success: (res) => {
          const tempPath = res.tempFilePaths[0];
          uploadAvatarToCloud(tempPath);
        }
      });
    };
    const uploadAvatarToCloud = (filePath) => {
      if (!common_vendor.wx$1.cloud) {
        common_vendor.index.showToast({ title: "请先开通微信云开发", icon: "none" });
        return;
      }
      common_vendor.index.showLoading({ title: "上传头像中...", mask: true });
      const uid = userId.value || common_vendor.index.getStorageSync("userId") || "temp";
      const ext = filePath.substring(filePath.lastIndexOf(".")) || ".jpg";
      const cloudPath = `avatars/user_${uid}_${Date.now()}${ext}`;
      common_vendor.wx$1.cloud.uploadFile({
        cloudPath,
        filePath,
        success: (res) => {
          common_vendor.index.hideLoading();
          if (res.fileID) {
            avatarUrl.value = convertCloudPath(res.fileID);
            common_vendor.index.__f__("log", "at pages/profile/profile.vue:342", "头像上传成功，转换后URL:", avatarUrl.value);
            common_vendor.index.showToast({ title: "头像上传成功", icon: "success" });
          } else {
            fallbackAvatar(filePath);
          }
        },
        fail: (err) => {
          common_vendor.index.hideLoading();
          common_vendor.index.__f__("error", "at pages/profile/profile.vue:350", "云存储上传失败", err);
          fallbackAvatar(filePath);
        }
      });
    };
    const fallbackAvatar = (filePath) => {
      avatarUrl.value = filePath;
      common_vendor.index.showToast({ title: "云存储失败，使用临时头像", icon: "none" });
    };
    const saveProfile = async () => {
      if (!nickname.value) {
        common_vendor.index.showToast({ title: "请填写昵称", icon: "none" });
        return;
      }
      if (isLoading.value)
        return;
      isLoading.value = true;
      common_vendor.index.showLoading({ title: "保存中...", mask: true });
      let finalAvatarUrl = avatarUrl.value;
      if (finalAvatarUrl && finalAvatarUrl.startsWith("cloud://")) {
        finalAvatarUrl = convertCloudPath(finalAvatarUrl);
      }
      const profileData = {
        nickname: nickname.value,
        gender: gender.value,
        age: parseInt(age.value) || 0,
        height: parseFloat(height.value) || 0,
        currentWeight: parseFloat(weight.value) || 0,
        targetWeight: parseFloat(targetWeight.value) || 0,
        activityLevel: Number(activityLevel.value),
        goalType: Number(goalType.value),
        avatarUrl: finalAvatarUrl,
        allergies: allergies.value,
        dietPreference: dietPreference.value,
        tabooDetail: dietPreference.value === "taboo" ? tabooDetail.value : ""
      };
      try {
        const url = config.API.USER_PROFILE.replace("{userId}", userId.value);
        const res = await utils_request.request({
          url,
          method: "PUT",
          data: profileData
        });
        if (res.code === 200) {
          common_vendor.index.setStorageSync("userProfile", {
            nickname: nickname.value,
            gender: gender.value,
            age: age.value,
            height: height.value,
            weight: weight.value,
            targetWeight: targetWeight.value,
            activityLevel: Number(activityLevel.value),
            goalType: Number(goalType.value),
            avatarUrl: finalAvatarUrl,
            allergies: allergies.value,
            dietPreference: dietPreference.value,
            tabooDetail: tabooDetail.value
          });
          const userInfo = common_vendor.index.getStorageSync("userInfo") || {};
          userInfo.nickname = nickname.value;
          userInfo.avatar = finalAvatarUrl || "/static/haocun.jpg";
          common_vendor.index.setStorageSync("userInfo", userInfo);
          common_vendor.index.hideLoading();
          common_vendor.index.showToast({ title: "保存成功", icon: "success" });
          common_vendor.index.$emit("refreshHome");
          setTimeout(() => {
            common_vendor.index.reLaunch({ url: "/pages/home/home" });
          }, 1e3);
        } else {
          throw new Error(res.message);
        }
      } catch (err) {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("error", "at pages/profile/profile.vue:446", "保存失败", err);
        common_vendor.index.showToast({ title: err.message || "保存失败", icon: "none" });
      } finally {
        isLoading.value = false;
      }
    };
    const skipToMain = () => {
      common_vendor.index.reLaunch({ url: "/pages/home/home" });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: avatarUrl.value || "/static/haocun.jpg",
        b: common_vendor.o(($event) => avatarUrl.value = "", "7e"),
        c: common_vendor.o(chooseAvatar, "19"),
        d: nickname.value,
        e: common_vendor.o(($event) => nickname.value = $event.detail.value, "75"),
        f: gender.value === 1 ? 1 : "",
        g: common_vendor.o(($event) => gender.value = 1, "cc"),
        h: gender.value === 2 ? 1 : "",
        i: common_vendor.o(($event) => gender.value = 2, "61"),
        j: age.value,
        k: common_vendor.o(($event) => age.value = $event.detail.value, "b7"),
        l: height.value,
        m: common_vendor.o(($event) => height.value = $event.detail.value, "0c"),
        n: weight.value,
        o: common_vendor.o(($event) => weight.value = $event.detail.value, "08"),
        p: targetWeight.value,
        q: common_vendor.o(($event) => targetWeight.value = $event.detail.value, "0d"),
        r: common_vendor.f(activityOptions, (item, index, i0) => {
          return {
            a: common_vendor.t(item),
            b: index,
            c: activityLevel.value === index + 1 ? 1 : "",
            d: common_vendor.o(($event) => selectActivity(index + 1), index)
          };
        }),
        s: common_vendor.f(goalOptions, (item, index, i0) => {
          return {
            a: common_vendor.t(item),
            b: index,
            c: goalType.value === index + 1 ? 1 : "",
            d: common_vendor.o(($event) => selectGoal(index + 1), index)
          };
        }),
        t: allergies.value,
        v: common_vendor.o(($event) => allergies.value = $event.detail.value, "4d"),
        w: dietPreference.value === "vegetarian" ? 1 : "",
        x: common_vendor.o(($event) => dietPreference.value = "vegetarian", "09"),
        y: dietPreference.value === "halal" ? 1 : "",
        z: common_vendor.o(($event) => dietPreference.value = "halal", "1d"),
        A: dietPreference.value === "taboo" ? 1 : "",
        B: common_vendor.o(($event) => dietPreference.value = "taboo", "aa"),
        C: dietPreference.value === "none" ? 1 : "",
        D: common_vendor.o(($event) => dietPreference.value = "none", "8d"),
        E: dietPreference.value === "taboo"
      }, dietPreference.value === "taboo" ? {
        F: tabooDetail.value,
        G: common_vendor.o(($event) => tabooDetail.value = $event.detail.value, "34")
      } : {}, {
        H: common_vendor.t(isLoading.value ? "保存中..." : "保存档案"),
        I: common_vendor.o(saveProfile, "d9"),
        J: isLoading.value,
        K: common_vendor.o(handleLogout, "ee"),
        L: common_vendor.o(skipToMain, "8a")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-dd383ca2"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/profile/profile.js.map
