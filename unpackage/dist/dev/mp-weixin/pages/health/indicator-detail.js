"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const config = require("../../config.js");
const _sfc_main = {
  __name: "indicator-detail",
  setup(__props) {
    const loading = common_vendor.ref(true);
    const indicator = common_vendor.ref(null);
    const aiDetail = common_vendor.ref(null);
    const trendData = common_vendor.ref([]);
    const statusColors = { 0: "#4CAF50", 1: "#FFD93D", 2: "#FF9800", 3: "#FF5722", 4: "#f44336" };
    const statusBgs = { 0: "#E8F5E9", 1: "#FFF8E1", 2: "#FFF3E0", 3: "#FBE9E7", 4: "#FFEBEE" };
    const statusLabels = { 0: "正常", 1: "临界", 2: "轻度异常", 3: "中度异常", 4: "高度异常" };
    function getStatusLabel(s) {
      return statusLabels[s] || "未知";
    }
    const statusColor = common_vendor.computed(() => {
      var _a;
      return statusColors[(_a = indicator.value) == null ? void 0 : _a.status] || "#999";
    });
    const statusLabel = common_vendor.computed(() => {
      var _a;
      return getStatusLabel((_a = indicator.value) == null ? void 0 : _a.status);
    });
    const statusTagFullStyle = common_vendor.computed(() => {
      var _a, _b;
      return {
        background: statusBgs[(_a = indicator.value) == null ? void 0 : _a.status] || "#f5f5f5",
        color: statusColors[(_b = indicator.value) == null ? void 0 : _b.status] || "#999"
      };
    });
    const rangeMin = common_vendor.computed(() => {
      var _a;
      const v = (_a = indicator.value) == null ? void 0 : _a.referenceMin;
      return v !== null && v !== void 0 ? v : "—";
    });
    const rangeMax = common_vendor.computed(() => {
      var _a;
      const v = (_a = indicator.value) == null ? void 0 : _a.referenceMax;
      return v !== null && v !== void 0 ? v : "—";
    });
    const normalRangeStyle = common_vendor.computed(() => {
      const ind = indicator.value;
      if (!ind || ind.referenceMin == null || ind.referenceMax == null)
        return { display: "none" };
      const total = getRangeTotal();
      const left = (ind.referenceMin - total.min) / (total.max - total.min) * 100;
      const width = (ind.referenceMax - ind.referenceMin) / (total.max - total.min) * 100;
      return { left: left + "%", width: width + "%" };
    });
    const markerStyle = common_vendor.computed(() => {
      const ind = indicator.value;
      if (!ind)
        return { display: "none" };
      const total = getRangeTotal();
      let pct = (parseFloat(ind.value) - total.min) / (total.max - total.min) * 100;
      pct = Math.max(0, Math.min(100, pct));
      return { left: pct + "%" };
    });
    function getRangeTotal() {
      const ind = indicator.value;
      const vals = [parseFloat(ind.value), ind.referenceMin, ind.referenceMax].filter((v) => v != null && !isNaN(v));
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const padding = (max - min) * 0.2 || 1;
      return { min: min - padding, max: max + padding };
    }
    const deviationText = common_vendor.computed(() => {
      const ind = indicator.value;
      if (!ind || ind.status === 0)
        return "在正常范围内";
      if (ind.status === 1)
        return "接近临界值，建议关注";
      const direction = parseFloat(ind.value) > (ind.referenceMax || 0) ? "偏高" : "偏低";
      const level = { 2: "轻度", 3: "中度", 4: "明显" };
      return `${level[ind.status] || ""}${direction}，建议改善`;
    });
    const urgencyLabel = common_vendor.computed(() => {
      var _a;
      const map = { low: "低优先级", medium: "建议关注", high: "建议尽快就医", urgent: "请尽快就医" };
      return map[(_a = aiDetail.value) == null ? void 0 : _a.urgency] || "";
    });
    const urgencyStyle = common_vendor.computed(() => {
      var _a;
      const colorMap = { low: "#4CAF50", medium: "#FFD93D", high: "#FF9800", urgent: "#f44336" };
      const c = colorMap[(_a = aiDetail.value) == null ? void 0 : _a.urgency] || "#ccc";
      return { background: c + "18", color: c, border: "1rpx solid " + c + "40" };
    });
    const chartYMax = common_vendor.computed(() => {
      if (!trendData.value.length)
        return "";
      const vals = trendData.value.map((d) => parseFloat(d.value));
      return Math.max(...vals).toFixed(1);
    });
    const chartYMin = common_vendor.computed(() => {
      if (!trendData.value.length)
        return "";
      const vals = trendData.value.map((d) => parseFloat(d.value));
      return Math.min(...vals).toFixed(1);
    });
    const chartYMid = common_vendor.computed(() => {
      const max = parseFloat(chartYMax.value) || 0;
      const min = parseFloat(chartYMin.value) || 0;
      return ((max + min) / 2).toFixed(1);
    });
    const chartPoints = common_vendor.computed(() => {
      if (!trendData.value.length)
        return [];
      const vals = trendData.value.map((d) => parseFloat(d.value));
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const range = max - min || 1;
      const padding = range * 0.15;
      return trendData.value.map((d, i) => {
        const x = trendData.value.length === 1 ? 50 : i / (trendData.value.length - 1) * 100;
        const y = (parseFloat(d.value) - min + padding) / (range + padding * 2) * 80 + 10;
        return { x, y, value: d.value, label: formatShortDate(d.reportDate), color: statusColors[d.status] || "#999" };
      });
    });
    const chartSegments = common_vendor.computed(() => {
      const pts = chartPoints.value;
      if (pts.length < 2)
        return [];
      const segs = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(-dy, dx) * (180 / Math.PI);
        segs.push({
          style: {
            position: "absolute",
            left: a.x + "%",
            bottom: a.y + "%",
            width: len + "%",
            height: "3rpx",
            background: a.color,
            transformOrigin: "0 50%",
            transform: `rotate(${angle}deg)`,
            opacity: 0.6
          }
        });
      }
      return segs;
    });
    const refZoneStyle = common_vendor.computed(() => {
      const ind = indicator.value;
      if (!ind || ind.referenceMin == null || ind.referenceMax == null)
        return { display: "none" };
      const vals = trendData.value.map((d) => parseFloat(d.value));
      const allVals = [...vals, ind.referenceMin, ind.referenceMax];
      const min = Math.min(...allVals);
      const max = Math.max(...allVals);
      const range = max - min || 1;
      const padding = range * 0.15;
      const bottom = (ind.referenceMin - min + padding) / (range + padding * 2) * 80 + 10;
      const height = (ind.referenceMax - ind.referenceMin) / (range + padding * 2) * 80;
      return { bottom: bottom + "%", height: height + "%" };
    });
    function miniStatusStyle(status) {
      return { background: statusBgs[status] || "#f5f5f5", color: statusColors[status] || "#999" };
    }
    function formatDate(d) {
      if (!d)
        return "";
      const dt = new Date(d);
      return `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, "0")}.${String(dt.getDate()).padStart(2, "0")}`;
    }
    function formatShortDate(d) {
      if (!d)
        return "";
      const dt = new Date(d);
      return `${dt.getMonth() + 1}/${dt.getDate()}`;
    }
    function searchFood(food) {
      common_vendor.index.showToast({ title: `搜索「${food}」`, icon: "none" });
    }
    function goToDietPlan() {
      common_vendor.index.navigateTo({ url: "/pages/plan/plan" });
    }
    function askChicken() {
      common_vendor.index.showToast({ title: "功能开发中，敬请期待", icon: "none" });
    }
    async function loadData() {
      var _a, _b;
      loading.value = true;
      try {
        const userId = common_vendor.index.getStorageSync("userId");
        const pages = getCurrentPages();
        const cur = pages[pages.length - 1];
        const opts = cur.options || ((_a = cur.$page) == null ? void 0 : _a.options) || {};
        const reportId = opts.reportId;
        const indicatorId = opts.indicatorId;
        if (!reportId) {
          common_vendor.index.showToast({ title: "参数缺失", icon: "none" });
          loading.value = false;
          return;
        }
        const res = await utils_request.request({
          url: config.API.HEALTH_REPORT_DETAIL + "/" + reportId,
          method: "GET",
          data: { userId }
        });
        if (res.code === 200 && res.data) {
          const data = res.data;
          const indicators = data.indicators || [];
          const target = indicators.find((item) => String(item.id) === String(indicatorId));
          if (target) {
            indicator.value = target;
            if (target.aiDetail) {
              try {
                aiDetail.value = typeof target.aiDetail === "string" ? JSON.parse(target.aiDetail) : target.aiDetail;
              } catch (e) {
                aiDetail.value = null;
              }
            }
          }
        }
        if ((_b = indicator.value) == null ? void 0 : _b.indicatorCode) {
          try {
            const trendRes = await utils_request.request({
              url: config.API.HEALTH_INDICATOR_TREND,
              method: "GET",
              data: { userId, code: indicator.value.indicatorCode }
            });
            if (trendRes.code === 200 && trendRes.data) {
              trendData.value = trendRes.data.trend || [];
            }
          } catch (e) {
            common_vendor.index.__f__("warn", "at pages/health/indicator-detail.vue:463", "加载趋势数据失败", e);
          }
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/health/indicator-detail.vue:467", "加载指标详情失败", e);
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
        b: !loading.value && indicator.value
      }, !loading.value && indicator.value ? common_vendor.e({
        c: common_vendor.t(indicator.value.indicatorName),
        d: common_vendor.t(statusLabel.value),
        e: common_vendor.s(statusTagFullStyle.value),
        f: common_vendor.t(indicator.value.value),
        g: indicator.value.unit
      }, indicator.value.unit ? {
        h: common_vendor.t(indicator.value.unit)
      } : {}, {
        i: common_vendor.s(normalRangeStyle.value),
        j: common_vendor.s(markerStyle.value),
        k: common_vendor.t(rangeMin.value),
        l: common_vendor.t(rangeMax.value),
        m: common_vendor.t(deviationText.value),
        n: statusColor.value,
        o: aiDetail.value
      }, aiDetail.value ? common_vendor.e({
        p: aiDetail.value.explanation
      }, aiDetail.value.explanation ? {
        q: common_vendor.t(aiDetail.value.explanation)
      } : {}, {
        r: aiDetail.value.possible_causes && aiDetail.value.possible_causes.length
      }, aiDetail.value.possible_causes && aiDetail.value.possible_causes.length ? {
        s: common_vendor.f(aiDetail.value.possible_causes, (cause, i, i0) => {
          return {
            a: common_vendor.t(cause),
            b: i
          };
        })
      } : {}, {
        t: aiDetail.value.food_benefit && aiDetail.value.food_benefit.length
      }, aiDetail.value.food_benefit && aiDetail.value.food_benefit.length ? {
        v: common_vendor.f(aiDetail.value.food_benefit, (food, i, i0) => {
          return {
            a: common_vendor.t(food),
            b: i,
            c: common_vendor.o(($event) => searchFood(food), i)
          };
        })
      } : {}, {
        w: aiDetail.value.food_avoid && aiDetail.value.food_avoid.length
      }, aiDetail.value.food_avoid && aiDetail.value.food_avoid.length ? {
        x: common_vendor.f(aiDetail.value.food_avoid, (food, i, i0) => {
          return {
            a: common_vendor.t(food),
            b: i
          };
        })
      } : {}, {
        y: aiDetail.value.lifestyle_tips && aiDetail.value.lifestyle_tips.length
      }, aiDetail.value.lifestyle_tips && aiDetail.value.lifestyle_tips.length ? {
        z: common_vendor.f(aiDetail.value.lifestyle_tips, (tip, i, i0) => {
          return {
            a: common_vendor.t(i + 1),
            b: common_vendor.t(tip),
            c: i
          };
        })
      } : {}, {
        A: aiDetail.value.recheck_suggest
      }, aiDetail.value.recheck_suggest ? common_vendor.e({
        B: common_vendor.t(aiDetail.value.recheck_suggest),
        C: aiDetail.value.urgency
      }, aiDetail.value.urgency ? {
        D: common_vendor.t(urgencyLabel.value),
        E: common_vendor.s(urgencyStyle.value)
      } : {}) : {}) : {}, {
        F: !aiDetail.value && indicator.value.aiComment
      }, !aiDetail.value && indicator.value.aiComment ? {
        G: common_vendor.t(indicator.value.aiComment)
      } : {}, {
        H: trendData.value.length >= 2
      }, trendData.value.length >= 2 ? {
        I: common_vendor.t(chartYMax.value),
        J: common_vendor.t(chartYMid.value),
        K: common_vendor.t(chartYMin.value),
        L: common_vendor.s(refZoneStyle.value),
        M: common_vendor.f(chartPoints.value, (point, i, i0) => {
          return {
            a: point.color,
            b: common_vendor.t(point.value),
            c: i,
            d: point.x + "%",
            e: point.y + "%"
          };
        }),
        N: common_vendor.f(chartSegments.value, (seg, i, i0) => {
          return {
            a: i,
            b: common_vendor.s(seg.style)
          };
        }),
        O: common_vendor.f(chartPoints.value, (point, i, i0) => {
          return {
            a: common_vendor.t(point.label),
            b: i,
            c: point.x + "%"
          };
        })
      } : {}, {
        P: trendData.value.length >= 2
      }, trendData.value.length >= 2 ? {
        Q: common_vendor.f(trendData.value, (row, i, i0) => {
          return {
            a: common_vendor.t(formatDate(row.reportDate)),
            b: common_vendor.t(row.value),
            c: common_vendor.t(getStatusLabel(row.status)),
            d: common_vendor.s(miniStatusStyle(row.status)),
            e: i
          };
        }),
        R: common_vendor.t(indicator.value.unit || "")
      } : {}, {
        S: common_vendor.o(goToDietPlan, "98"),
        T: common_vendor.o(askChicken, "bb")
      }) : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-c59fb2be"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/health/indicator-detail.js.map
