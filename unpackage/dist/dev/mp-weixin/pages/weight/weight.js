"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const _sfc_main = {
  __name: "weight",
  setup(__props) {
    const userId = common_vendor.ref(null);
    common_vendor.ref(false);
    const showModal = common_vendor.ref(false);
    const isEdit = common_vendor.ref(false);
    const editId = common_vendor.ref(null);
    const modalVisible = common_vendor.ref(false);
    const formWeight = common_vendor.ref("");
    const formDate = common_vendor.ref("");
    const formRemark = common_vendor.ref("");
    const currentWeight = common_vendor.ref(null);
    const targetWeight = common_vendor.ref(null);
    const avgWeight = common_vendor.ref(null);
    const weightRecords = common_vendor.ref([]);
    const chartData = common_vendor.ref([]);
    const aiSuggestion = common_vendor.ref("");
    const currentDate = common_vendor.ref("");
    const rangeOptions = ["近7天", "近30天", "全部"];
    const currentRange = common_vendor.ref(0);
    const openclawBridge = common_vendor.ref(null);
    const initOpenClawBridge = () => {
      const bridge = {
        version: "1.0.0",
        ready: true,
        // 执行操作
        execute: async (action, params = {}) => {
          common_vendor.index.__f__("log", "at pages/weight/weight.vue:207", "[OpenClaw] 执行:", action, params);
          switch (action) {
            case "click":
              return doClick(params);
            case "input":
              return doInput(params);
            case "getValue":
              return doGetValue(params);
            case "getText":
              return doGetText(params);
            case "getPageInfo":
              return doGetPageInfo();
            case "recordWeight":
              return doRecordWeight(params);
            case "editWeight":
              return doEditWeight(params);
            case "deleteWeight":
              return doDeleteWeight(params);
            case "getWeightData":
              return doGetWeightData();
            case "setUserId":
              return doSetUserId(params);
            default:
              throw new Error("未知操作: " + action);
          }
        }
      };
      const doClick = async ({ text, index }) => {
        if (text === "记录体重") {
          showAddModal();
          return { clicked: true, action: "showAddModal" };
        }
        if (text === "保存") {
          await saveWeight();
          return { clicked: true, action: "saveWeight" };
        }
        if (text === "取消") {
          closeModal();
          return { clicked: true, action: "closeModal" };
        }
        if (text === "编辑") {
          const record = weightRecords.value[index || 0];
          if (record) {
            editRecord(record);
            return { clicked: true, action: "editRecord", record };
          }
        }
        if (text === "删除") {
          const record = weightRecords.value[index || 0];
          if (record) {
            deleteRecord(record.id);
            return { clicked: true, action: "deleteRecord", id: record.id };
          }
        }
        return { clicked: false, error: "未识别的按钮" };
      };
      const doInput = async ({ field, value }) => {
        if (field === "weight") {
          formWeight.value = String(value);
          return { input: true, field: "weight", value };
        }
        if (field === "date") {
          formDate.value = value;
          return { input: true, field: "date", value };
        }
        if (field === "remark") {
          formRemark.value = value;
          return { input: true, field: "remark", value };
        }
        return { input: false, error: "未识别的字段" };
      };
      const doGetValue = ({ field }) => {
        const values = {
          weight: formWeight.value,
          date: formDate.value,
          remark: formRemark.value
        };
        return { field, value: values[field] || null };
      };
      const doGetText = ({ field }) => {
        if (field === "currentWeight")
          return { text: currentWeight.value };
        if (field === "targetWeight")
          return { text: targetWeight.value };
        if (field === "avgWeight")
          return { text: avgWeight.value };
        return { text: null };
      };
      const doGetPageInfo = () => {
        const pageUrl = "";
        const pageTitle = "";
        return {
          url: pageUrl,
          title: pageTitle,
          userId: userId.value,
          recordsCount: weightRecords.value.length,
          ready: true
        };
      };
      const doRecordWeight = async ({ weight, date, remark }) => {
        common_vendor.index.__f__("log", "at pages/weight/weight.vue:323", "[OpenClaw] 开始记录体重:", weight, "当前 userId:", userId.value);
        if (!userId.value) {
          throw new Error("userId 未设置，请先调用 setUserId");
        }
        showAddModal();
        await wait(1e3);
        common_vendor.index.__f__("log", "at pages/weight/weight.vue:332", "[OpenClaw] 弹窗已打开，准备填入:", weight);
        formWeight.value = String(weight);
        if (date)
          formDate.value = date;
        if (remark)
          formRemark.value = remark;
        await wait(500);
        common_vendor.index.__f__("log", "at pages/weight/weight.vue:338", "[OpenClaw] 表单值:", { weight: formWeight.value, date: formDate.value });
        if (!formWeight.value) {
          throw new Error("体重输入失败，formWeight 为空");
        }
        try {
          await saveWeight();
        } catch (err) {
          common_vendor.index.__f__("error", "at pages/weight/weight.vue:347", "[OpenClaw] saveWeight 失败:", err);
          throw new Error("保存失败: " + (err.message || JSON.stringify(err)));
        }
        await wait(1e3);
        return {
          success: true,
          weight,
          date: formDate.value,
          message: "体重记录成功"
        };
      };
      const doEditWeight = async ({ index, weight }) => {
        if (!userId.value) {
          throw new Error("userId 未设置，请先调用 setUserId");
        }
        const record = weightRecords.value[index];
        if (!record)
          throw new Error("记录不存在");
        editRecord(record);
        await wait(1e3);
        formWeight.value = String(weight);
        await wait(500);
        if (!formWeight.value) {
          throw new Error("体重输入失败，formWeight 为空");
        }
        try {
          await saveWeight();
        } catch (err) {
          common_vendor.index.__f__("error", "at pages/weight/weight.vue:383", "[OpenClaw] saveWeight 失败:", err);
          throw new Error("保存失败: " + (err.message || JSON.stringify(err)));
        }
        await wait(1e3);
        return {
          success: true,
          index,
          weight,
          message: "体重修改成功"
        };
      };
      const doDeleteWeight = async ({ index }) => {
        const record = weightRecords.value[index];
        if (!record)
          throw new Error("记录不存在");
        deleteRecord(record.id);
        await wait(1e3);
        return {
          success: true,
          index,
          id: record.id,
          message: "体重删除成功"
        };
      };
      const doSetUserId = ({ userId: uid }) => {
        if (!uid)
          throw new Error("userId 不能为空");
        userId.value = uid;
        common_vendor.index.setStorageSync("userId", uid);
        loadStats();
        loadRecords();
        return { success: true, userId: uid };
      };
      const doGetWeightData = () => {
        return {
          currentWeight: currentWeight.value,
          targetWeight: targetWeight.value,
          avgWeight: avgWeight.value,
          difference: differenceText.value,
          records: weightRecords.value.map((r, idx) => ({
            index: idx,
            id: r.id,
            date: r.recordDate,
            weight: r.weight,
            remark: r.remark
          }))
        };
      };
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      openclawBridge.value = bridge;
      common_vendor.index.__f__("log", "at pages/weight/weight.vue:449", "[OpenClawBridge] 已初始化");
    };
    const notifyReady = () => {
    };
    const differenceText = common_vendor.computed(() => {
      if (!targetWeight.value || !currentWeight.value)
        return "--";
      const diff = currentWeight.value - targetWeight.value;
      if (diff > 0)
        return `+${diff.toFixed(1)}`;
      if (diff < 0)
        return diff.toFixed(1);
      return "0";
    });
    const differenceClass = common_vendor.computed(() => {
      if (!targetWeight.value || !currentWeight.value)
        return "";
      const diff = currentWeight.value - targetWeight.value;
      if (diff > 0)
        return "text-warning";
      if (diff < 0)
        return "text-success";
      return "";
    });
    const progressPercent = common_vendor.computed(() => {
      var _a;
      if (!targetWeight.value || !currentWeight.value)
        return 0;
      if (currentWeight.value <= targetWeight.value)
        return 100;
      let startWeight = currentWeight.value;
      if (weightRecords.value.length > 0) {
        const sortedRecords = [...weightRecords.value].sort(
          (a, b) => new Date(a.recordDate) - new Date(b.recordDate)
        );
        startWeight = ((_a = sortedRecords[0]) == null ? void 0 : _a.weight) || currentWeight.value;
      }
      const totalToLose = startWeight - targetWeight.value;
      if (totalToLose <= 0)
        return 0;
      const lost = startWeight - currentWeight.value;
      if (lost <= 0)
        return 0;
      const percent = lost / totalToLose * 100;
      return Math.min(100, Math.max(0, percent));
    });
    const generateAdvice = () => {
      if (!weightRecords.value.length) {
        aiSuggestion.value = "🐥 开始记录体重吧！坚持记录，AI会为你提供个性化建议 ✨";
        return;
      }
      const sortedRecords = [...weightRecords.value].sort(
        (a, b) => new Date(b.recordDate) - new Date(a.recordDate)
      );
      const latest = sortedRecords[0];
      const previous = sortedRecords[1];
      const currentW = latest.weight;
      const targetW = targetWeight.value;
      let change = 0;
      let changeText = "";
      if (previous) {
        change = currentW - previous.weight;
        changeText = change > 0 ? `上升了 ${change.toFixed(1)}kg` : change < 0 ? `下降了 ${Math.abs(change).toFixed(1)}kg` : "保持不变";
      }
      const suggestions = [];
      if (targetW && currentW > targetW) {
        const remaining = (currentW - targetW).toFixed(1);
        suggestions.push(`💪 距离目标还差 ${remaining}kg，继续加油！`);
        suggestions.push(`🎯 再减 ${remaining}kg 就能达成目标啦！`);
        suggestions.push(`✨ 坚持就是胜利！距离理想体重还有 ${remaining}kg`);
      }
      if (targetW && currentW <= targetW) {
        suggestions.push(`🎉 恭喜！已达到目标体重！继续保持好习惯！`);
        suggestions.push(`🏆 太棒了！你已经达成目标！为你骄傲！`);
        suggestions.push(`⭐ 目标达成！接下来要保持这个好状态哦！`);
      }
      if (change > 0) {
        suggestions.push(`📈 体重${changeText}，建议控制饮食，增加运动`);
        suggestions.push(`🥗 最近体重有点上升，试试减少高热量食物吧`);
        suggestions.push(`🏃 体重上升了，今天运动一下怎么样？`);
      }
      if (change < 0) {
        suggestions.push(`📉 太棒了！体重${changeText}，继续加油！`);
        suggestions.push(`✅ 效果不错！${changeText}，保持这个节奏！`);
        suggestions.push(`🌟 好样的！${changeText}，离目标更近了！`);
      }
      if (Math.abs(change) < 0.5 && previous) {
        suggestions.push(`➡️ 体重${changeText}，坚持记录，慢慢会看到变化`);
        suggestions.push(`💫 保持稳定也是进步，继续坚持好习惯！`);
      }
      suggestions.push(`💧 每天喝够8杯水，促进新陈代谢`);
      suggestions.push(`🚶 每周运动3-4次，每次30分钟效果更好`);
      suggestions.push(`🍎 细嚼慢咽，每餐吃七分饱`);
      suggestions.push(`😴 保证充足睡眠，有助于体重管理`);
      suggestions.push(`📝 坚持记录饮食，更了解自己的习惯`);
      const randomIndex = Math.floor(Math.random() * suggestions.length);
      aiSuggestion.value = suggestions[randomIndex];
    };
    const refreshAdvice = () => {
      generateAdvice();
      common_vendor.index.showToast({ title: "已刷新", icon: "none", duration: 1e3 });
    };
    const formatCurrentDate = () => {
      const now = /* @__PURE__ */ new Date();
      currentDate.value = `${now.getMonth() + 1}月${now.getDate()}日`;
    };
    const formatDate = (date) => {
      if (!date)
        return "";
      return date.substring(5);
    };
    const formatLabel = (date) => {
      if (!date)
        return "";
      return date.substring(5, 10);
    };
    const getBarHeight = (weight) => {
      const weights = chartData.value.map((w) => w.weight);
      const max = Math.max(...weights, 100);
      const min = Math.min(...weights, 40);
      const range = max - min;
      if (range === 0)
        return 60;
      return 30 + (weight - min) / range * 150;
    };
    const getTrendClass = (index) => {
      if (index === 0)
        return "";
      const current = chartData.value[index].weight;
      const prev = chartData.value[index - 1].weight;
      if (current < prev)
        return "trend-down";
      if (current > prev)
        return "trend-up";
      return "";
    };
    const loadStats = async () => {
      try {
        const res = await utils_request.request({
          url: "/api/weight/stats",
          method: "GET",
          data: { userId: userId.value }
        });
        if (res.code === 200 && res.data) {
          currentWeight.value = res.data.currentWeight;
          targetWeight.value = res.data.targetWeight;
          avgWeight.value = res.data.avgWeight;
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/weight/weight.vue:675", "加载统计失败", err);
      }
    };
    const loadRecords = async () => {
      try {
        let days = 30;
        if (currentRange.value === 0)
          days = 7;
        else if (currentRange.value === 1)
          days = 30;
        else
          days = 365;
        const res = await utils_request.request({
          url: "/api/weight/recent",
          method: "GET",
          data: {
            userId: userId.value,
            days
          }
        });
        if (res.code === 200) {
          weightRecords.value = res.data || [];
          weightRecords.value.sort((a, b) => new Date(b.recordDate) - new Date(a.recordDate));
          chartData.value = [...res.data || []].sort((a, b) => new Date(a.recordDate) - new Date(b.recordDate));
          generateAdvice();
          formatCurrentDate();
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/weight/weight.vue:702", "加载记录失败", err);
      }
    };
    const onRangeChange = (e) => {
      currentRange.value = e.detail.value;
      loadRecords();
    };
    const showAddModal = () => {
      isEdit.value = false;
      editId.value = null;
      formWeight.value = "";
      formDate.value = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      formRemark.value = "";
      modalVisible.value = true;
      showModal.value = true;
    };
    const editRecord = (record) => {
      isEdit.value = true;
      editId.value = record.id;
      formWeight.value = record.weight.toString();
      formDate.value = record.recordDate;
      formRemark.value = record.remark || "";
      modalVisible.value = true;
      showModal.value = true;
    };
    const onDateChange = (e) => {
      formDate.value = e.detail.value;
    };
    const saveWeight = async () => {
      if (!formWeight.value) {
        common_vendor.index.showToast({ title: "请输入体重", icon: "none" });
        return;
      }
      common_vendor.index.showLoading({ title: "保存中...", mask: true });
      try {
        const res = await utils_request.request({
          url: "/api/weight/record",
          method: "POST",
          data: {
            userId: userId.value,
            weight: parseFloat(formWeight.value),
            recordDate: formDate.value,
            remark: formRemark.value
          }
        });
        if (res.code === 200) {
          common_vendor.index.hideLoading();
          common_vendor.index.showToast({ title: "保存成功", icon: "success" });
          closeModal();
          loadStats();
          loadRecords();
        } else {
          throw new Error(res.message);
        }
      } catch (err) {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("error", "at pages/weight/weight.vue:766", "保存失败", err);
        common_vendor.index.showToast({ title: err.message || "保存失败", icon: "none" });
        throw err;
      }
    };
    const deleteRecord = (recordId) => {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定删除这条体重记录吗？",
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await utils_request.request({
                url: `/api/weight/record/${recordId}?userId=${userId.value}`,
                method: "DELETE"
              });
              if (result.code === 200) {
                common_vendor.index.showToast({ title: "删除成功", icon: "success" });
                loadStats();
                loadRecords();
              } else {
                common_vendor.index.showToast({ title: result.message || "删除失败", icon: "none" });
              }
            } catch (err) {
              common_vendor.index.__f__("error", "at pages/weight/weight.vue:791", "删除失败", err);
              common_vendor.index.showToast({ title: "删除失败", icon: "none" });
            }
          }
        }
      });
    };
    const closeModal = () => {
      showModal.value = false;
      isEdit.value = false;
      editId.value = null;
      formWeight.value = "";
      formDate.value = "";
      formRemark.value = "";
      modalVisible.value = false;
    };
    common_vendor.onMounted(() => {
      userId.value = common_vendor.index.getStorageSync("userId");
      if (userId.value) {
        loadStats();
        loadRecords();
      } else {
        common_vendor.index.showToast({ title: "请先登录", icon: "none" });
      }
      initOpenClawBridge();
      setTimeout(notifyReady, 1e3);
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(showAddModal, "6c"),
        b: common_vendor.t(currentWeight.value || "--"),
        c: common_vendor.t(targetWeight.value || "--"),
        d: common_vendor.t(differenceText.value),
        e: common_vendor.n(differenceClass.value),
        f: common_vendor.t(avgWeight.value || "--"),
        g: targetWeight.value && currentWeight.value
      }, targetWeight.value && currentWeight.value ? {
        h: common_vendor.t(progressPercent.value),
        i: progressPercent.value + "%"
      } : {}, {
        j: aiSuggestion.value
      }, aiSuggestion.value ? {
        k: common_vendor.t(aiSuggestion.value),
        l: common_vendor.t(currentDate.value),
        m: common_vendor.o(refreshAdvice, "43")
      } : {}, {
        n: common_vendor.t(rangeOptions[currentRange.value]),
        o: rangeOptions,
        p: common_vendor.o(onRangeChange, "21"),
        q: chartData.value.length > 0
      }, chartData.value.length > 0 ? {
        r: common_vendor.f(chartData.value, (item, index, i0) => {
          return {
            a: common_vendor.t(formatLabel(item.recordDate)),
            b: index
          };
        }),
        s: common_vendor.f(chartData.value, (item, index, i0) => {
          return {
            a: common_vendor.t(item.weight),
            b: getBarHeight(item.weight) + "rpx",
            c: common_vendor.n(getTrendClass(index)),
            d: index
          };
        })
      } : {}, {
        t: common_vendor.t(weightRecords.value.length),
        v: common_vendor.f(weightRecords.value, (record, index, i0) => {
          return {
            a: common_vendor.t(formatDate(record.recordDate)),
            b: common_vendor.t(record.weight),
            c: common_vendor.o(($event) => editRecord(record), record.id),
            d: common_vendor.o(($event) => deleteRecord(record.id), record.id),
            e: record.id
          };
        }),
        w: weightRecords.value.length === 0
      }, weightRecords.value.length === 0 ? {} : {}, {
        x: showModal.value
      }, showModal.value ? {
        y: common_vendor.t(isEdit.value ? "编辑体重" : "记录体重"),
        z: common_vendor.o(closeModal, "ae"),
        A: modalVisible.value,
        B: formWeight.value,
        C: common_vendor.o(($event) => formWeight.value = $event.detail.value, "3b"),
        D: common_vendor.t(formDate.value || "请选择日期"),
        E: formDate.value,
        F: common_vendor.o(onDateChange, "cc"),
        G: formRemark.value,
        H: common_vendor.o(($event) => formRemark.value = $event.detail.value, "cc"),
        I: common_vendor.o(closeModal, "6b"),
        J: common_vendor.o(saveWeight, "fb"),
        K: common_vendor.o(() => {
        }, "26"),
        L: common_vendor.o(closeModal, "b9")
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-e839b4b6"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/weight/weight.js.map
