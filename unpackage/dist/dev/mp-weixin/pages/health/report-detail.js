"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const config = require("../../config.js");
const _sfc_main = {
  __name: "report-detail",
  setup(__props) {
    const loading = common_vendor.ref(true);
    const report = common_vendor.ref(null);
    const indicators = common_vendor.ref([]);
    const displayScore = common_vendor.ref(0);
    const expandedCategories = common_vendor.reactive({});
    const reportId = common_vendor.ref("");
    const typeMap = {
      annual: "年度体检",
      employment: "入职体检",
      special: "专项检查",
      prenatal: "孕检",
      other: "其他"
    };
    const reportTypeName = common_vendor.computed(() => {
      var _a;
      return typeMap[(_a = report.value) == null ? void 0 : _a.reportType] || "体检报告";
    });
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
    const ringStyle = common_vendor.computed(() => {
      var _a;
      const score = ((_a = report.value) == null ? void 0 : _a.overallScore) || 0;
      const deg = score / 100 * 360;
      const color = score >= 80 ? "#4CAF50" : score >= 60 ? "#FFD93D" : "#f44336";
      return {
        background: `conic-gradient(${color} ${deg}deg, #f0ebe4 ${deg}deg)`
      };
    });
    const categoryScores = common_vendor.computed(() => {
      var _a;
      if (!((_a = report.value) == null ? void 0 : _a.categoryScores))
        return [];
      return Object.entries(report.value.categoryScores).map(([key, score]) => {
        const config2 = categoryConfig[key] || categoryConfig.other;
        const s = typeof score === "number" ? score : 0;
        return {
          key,
          name: config2.name,
          score: s,
          color: s >= 80 ? "#4CAF50" : s >= 60 ? "#FFD93D" : "#f44336"
        };
      });
    });
    const groupedIndicators = common_vendor.computed(() => {
      const groups = {};
      const sorted = [...indicators.value].sort((a, b) => {
        if (a.status === 0 && b.status !== 0)
          return 1;
        if (a.status !== 0 && b.status === 0)
          return -1;
        return b.status - a.status;
      });
      for (const item of sorted) {
        const cat = item.category || "other";
        if (!groups[cat]) {
          const config2 = categoryConfig[cat] || categoryConfig.other;
          groups[cat] = { key: cat, name: config2.name, color: config2.color, items: [], abnormalCount: 0 };
        }
        groups[cat].items.push(item);
        if (item.status > 0)
          groups[cat].abnormalCount++;
      }
      return Object.values(groups);
    });
    function getStatusColor(status) {
      const map = { 0: "#4CAF50", 1: "#FFD93D", 2: "#FF9800", 3: "#FF5722", 4: "#f44336" };
      return map[status] || "#ccc";
    }
    function getStatusLabel(status) {
      const map = { 0: "正常", 1: "临界", 2: "轻度异常", 3: "中度异常", 4: "高度异常" };
      return map[status] || "未知";
    }
    function statusTagStyle(status) {
      const bgMap = { 0: "#E8F5E9", 1: "#FFF8E1", 2: "#FFF3E0", 3: "#FBE9E7", 4: "#FFEBEE" };
      const textMap = { 0: "#2e7d32", 1: "#f9a825", 2: "#e65100", 3: "#d84315", 4: "#c62828" };
      return { background: bgMap[status] || "#f5f5f5", color: textMap[status] || "#999" };
    }
    function formatDate(dateStr) {
      if (!dateStr)
        return "未填写";
      const d = new Date(dateStr);
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
    }
    function toggleCategory(key) {
      expandedCategories[key] = !expandedCategories[key];
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
    function goToIndicatorDetail(item) {
      common_vendor.index.navigateTo({
        url: `/pages/health/indicator-detail?reportId=${item.reportId}&indicatorId=${item.id}&indicatorName=${encodeURIComponent(item.indicatorName)}`
      });
    }
    function generatePlan() {
      common_vendor.index.showToast({ title: "功能开发中，敬请期待", icon: "none" });
    }
    function askChicken() {
      common_vendor.index.showToast({ title: "功能开发中，敬请期待", icon: "none" });
    }
    async function loadData() {
      loading.value = true;
      try {
        const userId = common_vendor.index.getStorageSync("userId");
        if (!reportId.value) {
          common_vendor.index.showToast({ title: "报告ID缺失", icon: "none" });
          loading.value = false;
          return;
        }
        const res = await utils_request.request({
          url: config.API.HEALTH_REPORT_DETAIL + "/" + reportId.value,
          method: "GET",
          data: { userId }
        });
        if (res.code === 200 && res.data) {
          const data = res.data;
          report.value = data;
          indicators.value = data.indicators || [];
          if (typeof report.value.topConcerns === "string") {
            try {
              report.value.topConcerns = JSON.parse(report.value.topConcerns);
            } catch (e) {
              report.value.topConcerns = [];
            }
          }
          if (typeof report.value.positivePoints === "string") {
            try {
              report.value.positivePoints = JSON.parse(report.value.positivePoints);
            } catch (e) {
              report.value.positivePoints = [];
            }
          }
          if (typeof report.value.categoryScores === "string") {
            try {
              report.value.categoryScores = JSON.parse(report.value.categoryScores);
            } catch (e) {
              report.value.categoryScores = {};
            }
          }
          for (const cat of groupedIndicators.value) {
            if (cat.abnormalCount > 0) {
              expandedCategories[cat.key] = true;
              break;
            }
          }
          if (groupedIndicators.value.length > 0 && !Object.values(expandedCategories).some((v) => v)) {
            expandedCategories[groupedIndicators.value[0].key] = true;
          }
          animateScore(report.value.overallScore || 0);
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/health/report-detail.vue:349", "加载报告详情失败", e);
      } finally {
        loading.value = false;
      }
    }
    common_vendor.onLoad((options) => {
      reportId.value = options.id || "";
      loadData();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: loading.value
      }, loading.value ? {} : {}, {
        b: !loading.value && report.value
      }, !loading.value && report.value ? common_vendor.e({
        c: common_vendor.t(report.value.reportName),
        d: common_vendor.t(formatDate(report.value.reportDate)),
        e: common_vendor.t(report.value.hospital || "未填写"),
        f: common_vendor.t(reportTypeName.value),
        g: common_vendor.s(ringStyle.value),
        h: common_vendor.t(displayScore.value),
        i: common_vendor.f(categoryScores.value, (cat, k0, i0) => {
          return {
            a: cat.color,
            b: common_vendor.t(cat.name),
            c: common_vendor.t(cat.score),
            d: cat.color,
            e: cat.key
          };
        }),
        j: common_vendor.t(report.value.summary),
        k: report.value.positivePoints && report.value.positivePoints.length
      }, report.value.positivePoints && report.value.positivePoints.length ? {
        l: common_vendor.f(report.value.positivePoints, (point, i, i0) => {
          return {
            a: common_vendor.t(point),
            b: "p" + i
          };
        })
      } : {}, {
        m: report.value.topConcerns && report.value.topConcerns.length
      }, report.value.topConcerns && report.value.topConcerns.length ? {
        n: common_vendor.f(report.value.topConcerns, (concern, i, i0) => {
          return {
            a: common_vendor.t(concern),
            b: "c" + i
          };
        })
      } : {}, {
        o: common_vendor.f(groupedIndicators.value, (cat, catIndex, i0) => {
          return common_vendor.e({
            a: cat.color,
            b: common_vendor.t(cat.name),
            c: common_vendor.t(cat.items.length),
            d: cat.abnormalCount > 0
          }, cat.abnormalCount > 0 ? {
            e: common_vendor.t(cat.abnormalCount)
          } : {}, {
            f: expandedCategories[cat.key] ? 1 : "",
            g: common_vendor.o(($event) => toggleCategory(cat.key), cat.key),
            h: common_vendor.f(cat.items, (item, idx, i1) => {
              return common_vendor.e({
                a: getStatusColor(item.status),
                b: common_vendor.t(item.indicatorName),
                c: common_vendor.t(getStatusLabel(item.status)),
                d: common_vendor.s(statusTagStyle(item.status)),
                e: common_vendor.t(item.value),
                f: item.unit
              }, item.unit ? {
                g: common_vendor.t(item.unit)
              } : {}, {
                h: common_vendor.t(item.referenceMin),
                i: common_vendor.t(item.referenceMax),
                j: common_vendor.t(item.unit || ""),
                k: item.id,
                l: idx * 0.05 + "s",
                m: common_vendor.o(($event) => goToIndicatorDetail(item), item.id)
              });
            }),
            i: expandedCategories[cat.key] ? 1 : "",
            j: expandedCategories[cat.key] ? cat.items.length * 140 + "rpx" : "0",
            k: cat.key,
            l: catIndex * 0.06 + "s"
          });
        }),
        p: common_vendor.o(generatePlan, "11"),
        q: common_vendor.o(askChicken, "44")
      }) : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-78e9b108"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/health/report-detail.js.map
