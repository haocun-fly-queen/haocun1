"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
if (!Math) {
  "./pages/login/login.js";
  "./pages/profile/profile.js";
  "./pages/home/home.js";
  "./pages/camera/camera.js";
  "./pages/diet/diet.js";
  "./pages/dashboard/dashboard.js";
  "./pages/plan/plan.js";
  "./pages/health/report-list.js";
  "./pages/health/report-upload.js";
  "./pages/health/report-detail.js";
  "./pages/health/indicator-detail.js";
  "./pages/health/score.js";
  "./pages/health/trend.js";
  "./pages/weight/weight.js";
  "./pages/exercise/index.js";
  "./pages/exercise/record.js";
  "./pages/exercise/stats.js";
  "./pages/exercise/settings.js";
}
const _sfc_main = {
  onLaunch: function() {
    if (common_vendor.wx$1.cloud) {
      common_vendor.wx$1.cloud.init({
        env: "cloudbase-d0gaofkdc3e053fea",
        traceUser: true
      });
    } else {
      common_vendor.index.__f__("warn", "at App.vue:28", "当前基础库版本不支持云开发");
    }
  },
  onShow: function() {
  },
  onHide: function() {
  }
};
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  return {
    app
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
