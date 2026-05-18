"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const config = require("../../config.js");
const _sfc_main = {
  __name: "trend",
  setup(__props) {
    const loading = common_vendor.ref(true);
    const indicatorOptions = common_vendor.ref([]);
    const selectedIndex = common_vendor.ref(-1);
    const trendData = common_vendor.ref([]);
    const trendAnalysis = common_vendor.ref("");
    const statusColors = { 0: "#4CAF50", 1: "#FFD93D", 2: "#FF9800", 3: "#FF5722", 4: "#f44336" };
    const statusBgs = { 0: "#E8F5E9", 1: "#FFF8E1", 2: "#FFF3E0", 3: "#FBE9E7", 4: "#FFEBEE" };
    const statusLabels = { 0: "正常", 1: "临界", 2: "轻度异常", 3: "中度异常", 4: "高度异常" };
    function getStatusLabel(s) {
      return statusLabels[s] || "未知";
    }
    const currentUnit = common_vendor.computed(() => {
      if (selectedIndex.value < 0 || !indicatorOptions.value[selectedIndex.value])
        return "";
      return indicatorOptions.value[selectedIndex.value].unit || "";
    });
    const chartYMax = common_vendor.computed(() => {
      if (!trendData.value.length)
        return "";
      const vals = trendData.value.map((d) => d.value);
      const allVals = [...vals];
      const ind = indicatorOptions.value[selectedIndex.value];
      if ((ind == null ? void 0 : ind.referenceMax) != null)
        allVals.push(ind.referenceMax);
      if ((ind == null ? void 0 : ind.referenceMin) != null)
        allVals.push(ind.referenceMin);
      return Math.max(...allVals).toFixed(1);
    });
    const chartYMin = common_vendor.computed(() => {
      if (!trendData.value.length)
        return "";
      const vals = trendData.value.map((d) => d.value);
      const allVals = [...vals];
      const ind = indicatorOptions.value[selectedIndex.value];
      if ((ind == null ? void 0 : ind.referenceMax) != null)
        allVals.push(ind.referenceMax);
      if ((ind == null ? void 0 : ind.referenceMin) != null)
        allVals.push(ind.referenceMin);
      return Math.min(...allVals).toFixed(1);
    });
    const chartYMid = common_vendor.computed(() => {
      const max = parseFloat(chartYMax.value) || 0;
      const min = parseFloat(chartYMin.value) || 0;
      return ((max + min) / 2).toFixed(1);
    });
    const refZoneStyle = common_vendor.computed(() => {
      const ind = indicatorOptions.value[selectedIndex.value];
      if (!ind || ind.referenceMin == null || ind.referenceMax == null)
        return { display: "none" };
      const total = getChartRange();
      const bottom = (ind.referenceMin - total.min) / (total.max - total.min) * 80 + 10;
      const height = (ind.referenceMax - ind.referenceMin) / (total.max - total.min) * 80;
      return { bottom: bottom + "%", height: Math.max(height, 2) + "%" };
    });
    const refZoneLabel = common_vendor.computed(() => {
      const ind = indicatorOptions.value[selectedIndex.value];
      if (!ind || ind.referenceMin == null)
        return "";
      return `${ind.referenceMin}~${ind.referenceMax}`;
    });
    function getChartRange() {
      const vals = trendData.value.map((d) => d.value);
      const ind = indicatorOptions.value[selectedIndex.value];
      const allVals = [...vals];
      if ((ind == null ? void 0 : ind.referenceMax) != null)
        allVals.push(ind.referenceMax);
      if ((ind == null ? void 0 : ind.referenceMin) != null)
        allVals.push(ind.referenceMin);
      const min = Math.min(...allVals);
      const max = Math.max(...allVals);
      const padding = (max - min) * 0.15 || 1;
      return { min: min - padding, max: max + padding };
    }
    const chartPoints = common_vendor.computed(() => {
      if (!trendData.value.length)
        return [];
      const total = getChartRange();
      return trendData.value.map((d, i) => {
        const x = trendData.value.length === 1 ? 50 : i / (trendData.value.length - 1) * 90 + 5;
        const y = (d.value - total.min) / (total.max - total.min) * 80 + 10;
        return {
          x,
          y,
          value: d.value,
          label: formatShortDate(d.reportDate),
          color: statusColors[d.status] || "#999"
        };
      });
    });
    const lineSegments = common_vendor.computed(() => {
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
            background: `linear-gradient(90deg, ${a.color}, ${b.color})`,
            transformOrigin: "0 50%",
            transform: `rotate(${angle}deg)`,
            borderRadius: "2rpx"
          }
        });
      }
      return segs;
    });
    const trendDirectionLabel = common_vendor.computed(() => {
      const pts = chartPoints.value;
      if (pts.length < 2)
        return "数据不足";
      const first = pts[0].value;
      const last = pts[pts.length - 1].value;
      const diff = last - first;
      if (Math.abs(diff) < 0.01)
        return "基本持平";
      return diff > 0 ? "整体上升趋势 ↑" : "整体下降趋势 ↓";
    });
    const trendDirectionStyle = common_vendor.computed(() => {
      const pts = chartPoints.value;
      if (pts.length < 2)
        return { background: "#f5f5f5", color: "#999" };
      const first = pts[0].value;
      const last = pts[pts.length - 1].value;
      const diff = last - first;
      if (Math.abs(diff) < 0.01)
        return { background: "#E8F5E9", color: "#2e7d32" };
      return { background: "#FFF3E0", color: "#e65100" };
    });
    const trendRange = common_vendor.computed(() => {
      if (!trendData.value.length)
        return "—";
      const vals = trendData.value.map((d) => d.value);
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      return `${min.toFixed(1)} ~ ${max.toFixed(1)}`;
    });
    function statusTagStyle(status) {
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
    async function onIndicatorChange(e) {
      selectedIndex.value = e.detail.value;
      await loadTrendData();
    }
    async function loadIndicatorList() {
      try {
        const userId = common_vendor.index.getStorageSync("userId");
        const res = await utils_request.request({
          url: config.API.HEALTH_REPORT_LIST,
          method: "GET",
          data: { userId }
        });
        if (res.code === 200 && res.data && res.data.length > 0) {
          const latestId = res.data[0].id;
          const detailRes = await utils_request.request({
            url: config.API.HEALTH_REPORT_DETAIL + "/" + latestId,
            method: "GET",
            data: { userId }
          });
          if (detailRes.code === 200 && detailRes.data) {
            const indicators = detailRes.data.indicators || [];
            const seen = /* @__PURE__ */ new Set();
            const options = [];
            for (const ind of indicators) {
              if (ind.indicatorCode && !seen.has(ind.indicatorCode)) {
                seen.add(ind.indicatorCode);
                options.push({
                  label: ind.indicatorName,
                  value: ind.indicatorCode,
                  unit: ind.unit,
                  referenceMin: ind.referenceMin,
                  referenceMax: ind.referenceMax
                });
              }
            }
            indicatorOptions.value = options;
            if (options.length > 0) {
              selectedIndex.value = 0;
              await loadTrendData();
            }
          }
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/health/trend.vue:363", "加载指标列表失败", e);
      }
    }
    async function loadTrendData() {
      if (selectedIndex.value < 0)
        return;
      loading.value = true;
      try {
        const userId = common_vendor.index.getStorageSync("userId");
        const code = indicatorOptions.value[selectedIndex.value].value;
        const res = await utils_request.request({
          url: config.API.HEALTH_INDICATOR_TREND,
          method: "GET",
          data: { userId, code }
        });
        if (res.code === 200 && res.data) {
          trendData.value = res.data.trend || [];
          trendAnalysis.value = res.data.analysis || "";
          if (!trendAnalysis.value) {
            generateTrendAnalysis();
          }
        } else {
          trendData.value = [];
          trendAnalysis.value = "";
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/health/trend.vue:393", "加载趋势数据失败", e);
        trendData.value = [];
        trendAnalysis.value = "";
      } finally {
        loading.value = false;
      }
    }
    function generateTrendAnalysis() {
      var _a;
      const data = trendData.value;
      if (data.length < 2) {
        trendAnalysis.value = "";
        return;
      }
      const vals = data.map((d) => d.value);
      const first = vals[0];
      const last = vals[vals.length - 1];
      const diff = last - first;
      const pct = first !== 0 ? (diff / first * 100).toFixed(1) : 0;
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const abnormalCount = data.filter((d) => d.status > 0).length;
      const name = ((_a = indicatorOptions.value[selectedIndex.value]) == null ? void 0 : _a.label) || "该指标";
      let text = `${name}共记录${data.length}次，`;
      if (Math.abs(diff) < 0.01) {
        text += "整体保持稳定。";
      } else if (diff > 0) {
        text += `从${first}上升至${last}，变化幅度约${Math.abs(pct)}%。`;
      } else {
        text += `从${first}下降至${last}，变化幅度约${Math.abs(pct)}%。`;
      }
      text += `波动范围为${min.toFixed(1)}~${max.toFixed(1)}。`;
      if (abnormalCount > 0) {
        text += `其中有${abnormalCount}次出现异常，建议持续关注。`;
      } else {
        text += "所有检测值均在正常范围内，继续保持。";
      }
      trendAnalysis.value = text;
    }
    common_vendor.onMounted(async () => {
      await loadIndicatorList();
      loading.value = false;
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: loading.value
      }, loading.value ? {} : {}, {
        b: !loading.value
      }, !loading.value ? common_vendor.e({
        c: common_vendor.t(selectedIndex.value >= 0 ? indicatorOptions.value[selectedIndex.value].label : "请选择指标"),
        d: indicatorOptions.value,
        e: selectedIndex.value,
        f: common_vendor.o(onIndicatorChange, "91"),
        g: trendData.value.length > 0
      }, trendData.value.length > 0 ? common_vendor.e({
        h: common_vendor.t(chartYMax.value),
        i: common_vendor.t(chartYMid.value),
        j: common_vendor.t(chartYMin.value),
        k: refZoneLabel.value
      }, refZoneLabel.value ? {
        l: common_vendor.t(refZoneLabel.value)
      } : {}, {
        m: common_vendor.s(refZoneStyle.value),
        n: common_vendor.f(chartPoints.value, (pt, i, i0) => {
          return {
            a: common_vendor.t(pt.value),
            b: pt.color,
            c: i,
            d: pt.x + "%",
            e: pt.y + "%"
          };
        }),
        o: common_vendor.f(lineSegments.value, (seg, i, i0) => {
          return {
            a: i,
            b: common_vendor.s(seg.style)
          };
        }),
        p: common_vendor.f(chartPoints.value, (pt, i, i0) => {
          return {
            a: common_vendor.t(pt.label),
            b: i,
            c: pt.x + "%"
          };
        })
      }) : {}, {
        q: trendData.value.length === 0 && !loading.value
      }, trendData.value.length === 0 && !loading.value ? {} : {}, {
        r: trendAnalysis.value && trendData.value.length >= 2
      }, trendAnalysis.value && trendData.value.length >= 2 ? {
        s: common_vendor.t(trendAnalysis.value),
        t: common_vendor.t(trendDirectionLabel.value),
        v: common_vendor.s(trendDirectionStyle.value),
        w: common_vendor.t(trendRange.value)
      } : {}, {
        x: trendData.value.length > 0
      }, trendData.value.length > 0 ? {
        y: common_vendor.f(trendData.value, (row, i, i0) => {
          return common_vendor.e({
            a: common_vendor.t(formatDate(row.reportDate)),
            b: common_vendor.t(row.value)
          }, currentUnit.value ? {
            c: common_vendor.t(currentUnit.value)
          } : {}, {
            d: common_vendor.t(getStatusLabel(row.status)),
            e: common_vendor.s(statusTagStyle(row.status)),
            f: i,
            g: i * 0.05 + "s"
          });
        }),
        z: currentUnit.value
      } : {}) : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-6e55c5d8"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/health/trend.js.map
