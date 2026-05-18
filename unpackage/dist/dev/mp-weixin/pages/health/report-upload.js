"use strict";
const common_vendor = require("../../common/vendor.js");
const config = require("../../config.js");
const _sfc_main = {
  __name: "report-upload",
  setup(__props) {
    const imageList = common_vendor.ref([]);
    const analyzing = common_vendor.ref(false);
    const loadingPhase = common_vendor.ref(0);
    const typeIndex = common_vendor.ref(-1);
    const formData = common_vendor.reactive({
      reportName: "",
      reportDate: "",
      hospital: "",
      reportType: ""
    });
    const reportTypes = [
      { label: "年度体检", value: "annual" },
      { label: "入职体检", value: "employment" },
      { label: "专项检查", value: "special" },
      { label: "孕检", value: "prenatal" },
      { label: "其他", value: "other" }
    ];
    const loadingSteps = [
      "正在识别报告内容...",
      "正在分析指标...",
      "正在生成健康建议...",
      "分析完成！"
    ];
    const loadingTips = [
      "小唧戴上了眼镜，仔细查看你的报告",
      "小唧拿出计算器，逐项分析数据",
      "小唧在认真写笔记，为你整理建议",
      "小唧竖起大拇指，一切就绪！"
    ];
    common_vendor.computed(() => {
      return imageList.value.length > 0 && formData.reportName.trim().length > 0;
    });
    function chooseImage() {
      const remain = 5 - imageList.value.length;
      if (remain <= 0) {
        common_vendor.index.showToast({ title: "最多上传5张图片", icon: "none" });
        return;
      }
      common_vendor.index.chooseImage({
        count: remain,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: (res) => {
          imageList.value = [...imageList.value, ...res.tempFilePaths];
        }
      });
    }
    function previewImage(index) {
      common_vendor.index.previewImage({
        current: index,
        urls: imageList.value
      });
    }
    function removeImage(index) {
      imageList.value.splice(index, 1);
    }
    function onDateChange(e) {
      formData.reportDate = e.detail.value;
    }
    function onTypeChange(e) {
      typeIndex.value = e.detail.value;
      formData.reportType = reportTypes[e.detail.value].value;
    }
    function delay(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
    async function submitReport() {
      if (imageList.value.length === 0) {
        common_vendor.index.showToast({ title: "请先上传报告图片", icon: "none" });
        return;
      }
      if (!formData.reportName.trim()) {
        common_vendor.index.showToast({ title: "请填写报告名称", icon: "none" });
        return;
      }
      if (analyzing.value)
        return;
      analyzing.value = true;
      loadingPhase.value = 0;
      try {
        const userId = common_vendor.index.getStorageSync("userId");
        const token = common_vendor.index.getStorageSync("token");
        const uploadRes = await new Promise((resolve, reject) => {
          common_vendor.index.uploadFile({
            url: config.API_BASE_URL + "/api/health/report/upload",
            filePath: imageList.value[0],
            name: "file",
            formData: {
              userId: String(userId),
              reportName: formData.reportName,
              reportDate: formData.reportDate || "",
              hospital: formData.hospital || "",
              reportType: formData.reportType || ""
            },
            header: {
              "Authorization": token ? `Bearer ${token}` : ""
            },
            success: (res) => {
              try {
                resolve(JSON.parse(res.data));
              } catch (e) {
                reject(new Error("解析响应失败"));
              }
            },
            fail: (err) => reject(err)
          });
        });
        await delay(1e3);
        loadingPhase.value = 1;
        await delay(1200);
        loadingPhase.value = 2;
        await delay(1e3);
        loadingPhase.value = 3;
        await delay(800);
        if (uploadRes.code === 200 && uploadRes.data) {
          common_vendor.index.showToast({ title: "分析完成", icon: "success" });
          setTimeout(() => {
            analyzing.value = false;
            const reportId = uploadRes.data.id || uploadRes.data;
            if (reportId) {
              common_vendor.index.redirectTo({ url: `/pages/health/report-detail?id=${reportId}` });
            } else {
              common_vendor.index.navigateBack();
            }
          }, 600);
        } else {
          throw new Error(uploadRes.message || "提交失败");
        }
      } catch (e) {
        analyzing.value = false;
        common_vendor.index.__f__("error", "at pages/health/report-upload.vue:417", "提交报告失败", e);
        common_vendor.index.showToast({ title: e.message || "分析失败，请重试", icon: "none" });
      }
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: imageList.value.length === 0
      }, imageList.value.length === 0 ? {
        b: common_vendor.o(chooseImage, "88")
      } : {}, {
        c: imageList.value.length > 0
      }, imageList.value.length > 0 ? common_vendor.e({
        d: common_vendor.f(imageList.value, (img, index, i0) => {
          return {
            a: img,
            b: common_vendor.o(($event) => previewImage(index), index),
            c: common_vendor.o(($event) => removeImage(index), index),
            d: common_vendor.t(index + 1),
            e: index
          };
        }),
        e: imageList.value.length < 5
      }, imageList.value.length < 5 ? {
        f: common_vendor.o(chooseImage, "4b")
      } : {}, {
        g: common_vendor.t(imageList.value.length)
      }) : {}, {
        h: formData.reportName,
        i: common_vendor.o(($event) => formData.reportName = $event.detail.value, "cb"),
        j: common_vendor.t(formData.reportDate || "请选择体检日期"),
        k: common_vendor.n(formData.reportDate ? "picker-value" : "picker-placeholder"),
        l: formData.reportDate,
        m: common_vendor.o(onDateChange, "89"),
        n: formData.hospital,
        o: common_vendor.o(($event) => formData.hospital = $event.detail.value, "5c"),
        p: common_vendor.t(typeIndex.value >= 0 ? reportTypes[typeIndex.value].label : "请选择报告类型"),
        q: common_vendor.n(typeIndex.value >= 0 ? "picker-value" : "picker-placeholder"),
        r: reportTypes,
        s: typeIndex.value,
        t: common_vendor.o(onTypeChange, "5f"),
        v: common_vendor.o(submitReport, "15"),
        w: analyzing.value
      }, analyzing.value ? common_vendor.e({
        x: loadingPhase.value === 0
      }, loadingPhase.value === 0 ? {} : {}, {
        y: loadingPhase.value === 1
      }, loadingPhase.value === 1 ? {} : {}, {
        z: loadingPhase.value === 2
      }, loadingPhase.value === 2 ? {} : {}, {
        A: loadingPhase.value === 3
      }, loadingPhase.value === 3 ? {} : {}, {
        B: common_vendor.f(loadingSteps, (step, index, i0) => {
          return common_vendor.e({
            a: index < loadingPhase.value
          }, index < loadingPhase.value ? {} : {}, {
            b: index === loadingPhase.value
          }, index === loadingPhase.value ? {} : {}, {
            c: common_vendor.t(step),
            d: index,
            e: index === loadingPhase.value ? 1 : "",
            f: index < loadingPhase.value ? 1 : ""
          });
        }),
        C: common_vendor.t(loadingTips[loadingPhase.value])
      }) : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-518be96f"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/health/report-upload.js.map
