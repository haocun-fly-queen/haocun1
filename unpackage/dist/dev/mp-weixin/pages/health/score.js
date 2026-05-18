"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const config = require("../../config.js");
const _sfc_main = {
  __name: "score",
  setup(__props) {
    const loading = common_vendor.ref(true);
    const scoreData = common_vendor.ref(null);
    const displayScore = common_vendor.ref(0);
    const categoryConfig = {
      blood_routine: { name: "血常规", color: "#f44336" },
      liver: { name: "肝功能", color: "#FF9800" },
      kidney: { name: "肾功能", color: "#795548" },
      lipid: { name: "血脂", color: "#FF5722" },
      blood_sugar: { name: "血糖", color: "#E91E63" },
      thyroid: { name: "甲状腺", color: "#9C27B0" },
      urine: { name: "尿常规", color: "#2196F3" },
      tumor_marker: { name: "肿瘤标志物", color: "#f44336" },
      other: { name: "其他", color: "#607D8B" }
    };
    const heroRingStyle = common_vendor.computed(() => {
      var _a;
      const s = ((_a = scoreData.value) == null ? void 0 : _a.overallScore) || 0;
      const deg = s / 100 * 360;
      const c = getScoreColor(s);
      return { background: `conic-gradient(${c} ${deg}deg, #f0ebe4 ${deg}deg)` };
    });
    const scoreLevel = common_vendor.computed(() => {
      var _a;
      const s = ((_a = scoreData.value) == null ? void 0 : _a.overallScore) || 0;
      if (s >= 90)
        return "非常健康";
      if (s >= 80)
        return "健康良好";
      if (s >= 60)
        return "需要关注";
      return "建议复查";
    });
    const categoryList = common_vendor.computed(() => {
      var _a;
      if (!((_a = scoreData.value) == null ? void 0 : _a.categoryScores))
        return [];
      return Object.entries(scoreData.value.categoryScores).map(([key, score]) => {
        const config2 = categoryConfig[key] || categoryConfig.other;
        return {
          key,
          name: config2.name,
          score: typeof score === "number" ? score : 0,
          color: config2.color
        };
      });
    });
    function getScoreColor(score) {
      if (score >= 80)
        return "#4CAF50";
      if (score >= 60)
        return "#FFD93D";
      return "#f44336";
    }
    function formatDate(d) {
      if (!d)
        return "";
      const dt = new Date(d);
      return `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, "0")}.${String(dt.getDate()).padStart(2, "0")}`;
    }
    function animateScore(target) {
      const duration = 1500;
      const start = Date.now();
      const step = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        displayScore.value = Math.round(eased * target);
        if (progress < 1)
          setTimeout(step, 16);
      };
      step();
    }
    async function loadData() {
      loading.value = true;
      try {
        const userId = common_vendor.index.getStorageSync("userId");
        const res = await utils_request.request({
          url: config.API.HEALTH_SCORE,
          method: "GET",
          data: { userId }
        });
        if (res.code === 200 && res.data) {
          scoreData.value = res.data;
          if (typeof scoreData.value.topConcerns === "string") {
            try {
              scoreData.value.topConcerns = JSON.parse(scoreData.value.topConcerns);
            } catch (e) {
              scoreData.value.topConcerns = [];
            }
          }
          if (typeof scoreData.value.positivePoints === "string") {
            try {
              scoreData.value.positivePoints = JSON.parse(scoreData.value.positivePoints);
            } catch (e) {
              scoreData.value.positivePoints = [];
            }
          }
          if (typeof scoreData.value.categoryScores === "string") {
            try {
              scoreData.value.categoryScores = JSON.parse(scoreData.value.categoryScores);
            } catch (e) {
              scoreData.value.categoryScores = {};
            }
          }
          animateScore(scoreData.value.overallScore || 0);
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/health/score.vue:223", "加载健康评分失败", e);
      } finally {
        loading.value = false;
      }
    }
    common_vendor.onMounted(() => {
      loadData();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: loading.value
      }, loading.value ? {} : {}, {
        b: !loading.value && scoreData.value
      }, !loading.value && scoreData.value ? common_vendor.e({
        c: common_vendor.s(heroRingStyle.value),
        d: common_vendor.t(displayScore.value),
        e: common_vendor.t(scoreLevel.value),
        f: common_vendor.t(formatDate(scoreData.value.reportDate)),
        g: common_vendor.f(categoryList.value, (cat, index, i0) => {
          return {
            a: cat.color,
            b: common_vendor.t(cat.name),
            c: common_vendor.t(cat.score),
            d: getScoreColor(cat.score),
            e: cat.score + "%",
            f: getScoreColor(cat.score),
            g: cat.key,
            h: index * 0.08 + "s"
          };
        }),
        h: scoreData.value.summary
      }, scoreData.value.summary ? {
        i: common_vendor.t(scoreData.value.summary)
      } : {}, {
        j: scoreData.value.positivePoints && scoreData.value.positivePoints.length
      }, scoreData.value.positivePoints && scoreData.value.positivePoints.length ? {
        k: common_vendor.f(scoreData.value.positivePoints, (point, i, i0) => {
          return {
            a: common_vendor.t(point),
            b: "g" + i
          };
        })
      } : {}, {
        l: scoreData.value.topConcerns && scoreData.value.topConcerns.length
      }, scoreData.value.topConcerns && scoreData.value.topConcerns.length ? {
        m: common_vendor.f(scoreData.value.topConcerns, (concern, i, i0) => {
          return {
            a: common_vendor.t(concern),
            b: "w" + i
          };
        })
      } : {}) : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-968282b2"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/health/score.js.map
