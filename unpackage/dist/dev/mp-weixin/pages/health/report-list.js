"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const config = require("../../config.js");
const _sfc_main = {
  __name: "report-list",
  setup(__props) {
    const loading = common_vendor.ref(true);
    const healthScore = common_vendor.ref(null);
    const lastReportDate = common_vendor.ref("");
    const reportList = common_vendor.ref([]);
    const displayScore = common_vendor.ref(0);
    const ringStyle = common_vendor.computed(() => {
      const score = healthScore.value || 0;
      const deg = score / 100 * 360;
      const color = score >= 80 ? "#4CAF50" : score >= 60 ? "#FFD93D" : "#f44336";
      return {
        background: `conic-gradient(${color} ${deg}deg, #f0ebe4 ${deg}deg)`
      };
    });
    const scoreLevel = common_vendor.computed(() => {
      const s = healthScore.value || 0;
      if (s >= 90)
        return "非常健康";
      if (s >= 80)
        return "健康状况良好";
      if (s >= 60)
        return "需要关注";
      return "建议尽快复查";
    });
    function getStatusClass(item) {
      if (item.status === 0 || item.status === 1)
        return "pending";
      if (item.status === 3)
        return "failed";
      if (item.abnormalCount > 3)
        return "warning";
      return "normal";
    }
    function getStatusIcon(item) {
      if (item.status === 0 || item.status === 1)
        return "⏳";
      if (item.status === 3)
        return "✕";
      if (item.abnormalCount > 3)
        return "⚠";
      return "✓";
    }
    function formatDate(dateStr) {
      if (!dateStr)
        return "";
      const d = new Date(dateStr);
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
    }
    async function loadHealthScore() {
      try {
        const userId = common_vendor.index.getStorageSync("userId");
        const res = await utils_request.request({
          url: config.API.HEALTH_SCORE,
          method: "GET",
          data: { userId }
        });
        if (res.code === 200 && res.data) {
          healthScore.value = res.data.overallScore || 0;
          animateScore(healthScore.value);
        }
      } catch (e) {
        healthScore.value = null;
      }
    }
    async function loadReports() {
      loading.value = true;
      try {
        const userId = common_vendor.index.getStorageSync("userId");
        const res = await utils_request.request({
          url: config.API.HEALTH_REPORT_LIST,
          method: "GET",
          data: { userId }
        });
        if (res.code === 200) {
          reportList.value = res.data || [];
          if (reportList.value.length > 0 && reportList.value[0].reportDate) {
            lastReportDate.value = formatDate(reportList.value[0].reportDate);
          }
        }
      } catch (e) {
        reportList.value = [];
      } finally {
        loading.value = false;
      }
    }
    function animateScore(target) {
      const duration = 1500;
      const startTime = Date.now();
      const step = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        displayScore.value = Math.round(eased * target);
        if (progress < 1) {
          setTimeout(step, 16);
        }
      };
      step();
    }
    function confirmDelete(item) {
      common_vendor.index.showModal({
        title: "删除报告",
        content: `确定删除「${item.reportName}」吗？删除后不可恢复。`,
        confirmColor: "#f44336",
        success: async (res) => {
          if (res.confirm) {
            try {
              const userId = common_vendor.index.getStorageSync("userId");
              await utils_request.request({
                url: config.API.HEALTH_REPORT_DELETE + "/" + item.id,
                method: "DELETE",
                data: { userId }
              });
              common_vendor.index.showToast({ title: "已删除", icon: "success" });
              loadReports();
              loadHealthScore();
            } catch (e) {
              common_vendor.index.showToast({ title: "删除失败", icon: "none" });
            }
          }
        }
      });
    }
    function goToScore() {
      common_vendor.index.navigateTo({ url: "/pages/health/score" });
    }
    function goToDetail(id) {
      common_vendor.index.navigateTo({ url: `/pages/health/report-detail?id=${id}` });
    }
    function goToUpload() {
      common_vendor.index.navigateTo({ url: "/pages/health/report-upload" });
    }
    common_vendor.onMounted(() => {
      loadHealthScore();
      loadReports();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: healthScore.value !== null
      }, healthScore.value !== null ? {
        b: common_vendor.s(ringStyle.value),
        c: common_vendor.t(displayScore.value),
        d: common_vendor.t(scoreLevel.value),
        e: common_vendor.t(lastReportDate.value),
        f: common_vendor.o(goToScore, "36")
      } : {}, {
        g: reportList.value.length > 0
      }, reportList.value.length > 0 ? {
        h: common_vendor.t(reportList.value.length)
      } : {}, {
        i: reportList.value.length > 0
      }, reportList.value.length > 0 ? {
        j: common_vendor.f(reportList.value, (item, index, i0) => {
          return common_vendor.e({
            a: common_vendor.t(getStatusIcon(item)),
            b: common_vendor.n("status-" + getStatusClass(item)),
            c: common_vendor.t(item.reportName),
            d: common_vendor.t(formatDate(item.reportDate)),
            e: item.hospital
          }, item.hospital ? {} : {}, {
            f: common_vendor.t(item.hospital),
            g: item.overallScore
          }, item.overallScore ? {
            h: common_vendor.t(item.overallScore)
          } : {}, {
            i: item.abnormalCount > 0
          }, item.abnormalCount > 0 ? {
            j: common_vendor.t(item.abnormalCount)
          } : {}, {
            k: item.totalIndicators
          }, item.totalIndicators ? {
            l: common_vendor.t(item.totalIndicators)
          } : {}, {
            m: item.id,
            n: index * 0.08 + "s",
            o: common_vendor.o(($event) => goToDetail(item.id), item.id),
            p: common_vendor.o(($event) => confirmDelete(item), item.id)
          });
        })
      } : {}, {
        k: !loading.value && reportList.value.length === 0
      }, !loading.value && reportList.value.length === 0 ? {
        l: common_vendor.o(goToUpload, "4e")
      } : {}, {
        m: loading.value
      }, loading.value ? {} : {}, {
        n: !loading.value
      }, !loading.value ? {
        o: common_vendor.o(goToUpload, "4b")
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-6d4e5fd8"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/health/report-list.js.map
