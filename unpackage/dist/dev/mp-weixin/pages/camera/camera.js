"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const config = require("../../config.js");
const _sfc_main = {
  __name: "camera",
  setup(__props) {
    const setMealType = (type) => {
      selectedMealType.value = type;
      common_vendor.index.setStorageSync("lastMealType", type);
    };
    const currentImage = common_vendor.ref("");
    const isLoading = common_vendor.ref(false);
    const recognitionResult = common_vendor.ref(null);
    const saving = common_vendor.ref(false);
    const selectedMealType = common_vendor.ref(1);
    const remark = common_vendor.ref("");
    const userId = common_vendor.ref(null);
    const showFoodSearch = common_vendor.ref(false);
    const searchKeyword = common_vendor.ref("");
    const searchResults = common_vendor.ref([]);
    const currentEditIndex = common_vendor.ref(-1);
    const showAddFood = common_vendor.ref(false);
    const newFood = common_vendor.ref({
      name: "",
      calorie: "",
      carbs: "",
      protein: "",
      fat: ""
    });
    const recordDate = common_vendor.ref("");
    const todayDate = common_vendor.ref("");
    let foodDatabase = [];
    const getTodayDate = () => {
      const today = /* @__PURE__ */ new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };
    common_vendor.onMounted(async () => {
      userId.value = common_vendor.index.getStorageSync("userId");
      const lastMealType = common_vendor.index.getStorageSync("lastMealType");
      if (lastMealType) {
        selectedMealType.value = lastMealType;
      }
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const options = currentPage.options;
      if (options && options.mealType) {
        selectedMealType.value = parseInt(options.mealType);
      }
      await loadFoodDatabase();
      todayDate.value = getTodayDate();
    });
    const onRecordDateChange = (e) => {
      recordDate.value = e.detail.value;
    };
    const loadFoodDatabase = async () => {
      try {
        const res = await utils_request.request({
          url: config.API.FOOD_LIST,
          method: "GET"
        });
        if (res.code === 200 && res.data) {
          foodDatabase = res.data;
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/camera/camera.vue:312", "加载食物库失败", err);
      }
    };
    const totalCalories = common_vendor.computed(() => {
      if (!recognitionResult.value || !recognitionResult.value.foods)
        return 0;
      return recognitionResult.value.foods.reduce((total, food) => {
        const weight = parseFloat(food.weight) || 0;
        const caloriePer100g = parseFloat(food.calorie) || 0;
        return total + caloriePer100g * weight / 100;
      }, 0).toFixed(0);
    });
    const imageToBase64 = (filePath) => {
      return new Promise((resolve, reject) => {
        common_vendor.index.getFileSystemManager().readFile({
          filePath,
          encoding: "base64",
          success: (res) => {
            resolve("data:image/jpeg;base64," + res.data);
          },
          fail: reject
        });
      });
    };
    const takePhoto = () => {
      common_vendor.index.chooseImage({
        count: 1,
        sourceType: ["camera"],
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0];
          cropImage(tempFilePath);
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/camera/camera.vue:406", "拍照失败", err);
          common_vendor.index.showToast({ title: "拍照失败，请重试", icon: "none" });
        }
      });
    };
    const chooseFromAlbum = () => {
      common_vendor.index.chooseImage({
        count: 1,
        sourceType: ["album"],
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0];
          cropImage(tempFilePath);
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/camera/camera.vue:442", "选择图片失败", err);
          common_vendor.index.showToast({ title: "选择图片失败", icon: "none" });
        }
      });
    };
    const cropImage = (imagePath) => {
      if (common_vendor.wx$1.cropImage) {
        common_vendor.wx$1.cropImage({
          src: imagePath,
          cropScale: "1:1",
          success: (res) => {
            const croppedPath = res.tempFilePath;
            currentImage.value = croppedPath;
            recognizeFood(croppedPath);
          },
          fail: (err) => {
            common_vendor.index.__f__("error", "at pages/camera/camera.vue:462", "裁剪失败", err);
            currentImage.value = imagePath;
            recognizeFood(imagePath);
          }
        });
        return;
      }
      currentImage.value = imagePath;
      recognizeFood(imagePath);
    };
    const chooseImage = () => {
      if (recognitionResult.value) {
        common_vendor.index.showModal({
          title: "提示",
          content: "重新识别会清除当前结果，是否继续？",
          success: (res) => {
            if (res.confirm) {
              resetRecognition();
              chooseFromAlbum();
            }
          }
        });
      } else if (!currentImage.value) {
        chooseFromAlbum();
      }
    };
    const recognizeFood = async (imagePathOrBase64, isBase64 = false) => {
      isLoading.value = true;
      try {
        common_vendor.index.showLoading({ title: "处理图片中...", mask: true });
        const base64Image = isBase64 ? imagePathOrBase64 : await imageToBase64(imagePathOrBase64);
        common_vendor.index.showLoading({ title: "AI识别中...", mask: true });
        const res = await utils_request.request({
          url: config.API.AI_RECOGNIZE,
          method: "POST",
          data: {
            imageBase64: base64Image,
            userId: userId.value
            // ✅ 添加了这一行
          }
        });
        if (res.code === 200 && res.data) {
          recognitionResult.value = res.data;
          if (recognitionResult.value.foods) {
            recognitionResult.value.foods.forEach((food) => {
              if (!food.weight)
                food.weight = 100;
              if (!food.carbs)
                food.carbs = 0;
              if (!food.protein)
                food.protein = 0;
              if (!food.fat)
                food.fat = 0;
            });
          }
          common_vendor.index.hideLoading();
          common_vendor.index.showToast({ title: "识别完成", icon: "success" });
        } else {
          throw new Error(res.message || "识别失败");
        }
      } catch (err) {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("error", "at pages/camera/camera.vue:529", "识别失败", err);
        common_vendor.index.showToast({ title: err.message || "识别失败，请重试", icon: "none" });
      } finally {
        isLoading.value = false;
      }
    };
    const openFoodSelector = (index) => {
      currentEditIndex.value = index;
      searchKeyword.value = "";
      searchResults.value = foodDatabase;
      showFoodSearch.value = true;
    };
    const searchFoods = () => {
      if (!searchKeyword.value.trim()) {
        searchResults.value = foodDatabase;
        return;
      }
      searchResults.value = foodDatabase.filter(
        (food) => food.name.includes(searchKeyword.value) || food.alias && food.alias.includes(searchKeyword.value)
      );
    };
    const selectFood = (food) => {
      if (currentEditIndex.value >= 0 && recognitionResult.value.foods[currentEditIndex.value]) {
        recognitionResult.value.foods[currentEditIndex.value] = {
          ...recognitionResult.value.foods[currentEditIndex.value],
          name: food.name,
          calorie: food.caloriePer100g,
          carbs: food.carbsPer100g || 0,
          protein: food.proteinPer100g || 0,
          fat: food.fatPer100g || 0,
          foodId: food.id,
          weight: recognitionResult.value.foods[currentEditIndex.value].weight || 100
        };
        updateTotalCalories();
        common_vendor.index.showToast({ title: "已修改", icon: "success" });
      }
      closeFoodSearch();
    };
    const addNewFood = () => {
      showAddFood.value = true;
    };
    const saveCustomFood = () => {
      if (!newFood.value.name) {
        common_vendor.index.showToast({ title: "请输入食物名称", icon: "none" });
        return;
      }
      if (!newFood.value.calorie) {
        common_vendor.index.showToast({ title: "请输入热量", icon: "none" });
        return;
      }
      const customFood = {
        name: newFood.value.name,
        calorie: parseFloat(newFood.value.calorie),
        carbs: parseFloat(newFood.value.carbs) || 0,
        protein: parseFloat(newFood.value.protein) || 0,
        fat: parseFloat(newFood.value.fat) || 0,
        weight: 100,
        confidence: 1,
        foodId: 0
      };
      if (!recognitionResult.value) {
        recognitionResult.value = { foods: [], confidence: 0.85 };
      }
      if (!recognitionResult.value.foods) {
        recognitionResult.value.foods = [];
      }
      recognitionResult.value.foods.push(customFood);
      newFood.value = { name: "", calorie: "", carbs: "", protein: "", fat: "" };
      closeAddFood();
      common_vendor.index.showToast({ title: "已添加", icon: "success" });
    };
    const closeFoodSearch = () => {
      showFoodSearch.value = false;
      currentEditIndex.value = -1;
      searchKeyword.value = "";
    };
    const closeAddFood = () => {
      showAddFood.value = false;
      newFood.value = { name: "", calorie: "", carbs: "", protein: "", fat: "" };
    };
    const updateTotalCalories = () => {
      totalCalories.value;
    };
    const saveToDiet = async () => {
      if (!recognitionResult.value || !recognitionResult.value.foods || recognitionResult.value.foods.length === 0) {
        common_vendor.index.showToast({ title: "没有可保存的食物", icon: "none" });
        return;
      }
      saving.value = true;
      common_vendor.index.showLoading({ title: "保存中...", mask: true });
      const targetDate = recordDate.value || todayDate.value;
      const mealDateTime = `${targetDate} 12:00:00`;
      const items = recognitionResult.value.foods.map((food) => {
        const weight = parseFloat(food.weight) || 100;
        const caloriePer100g = parseFloat(food.calorie) || 0;
        const carbsPer100g = parseFloat(food.carbs) || 0;
        const proteinPer100g = parseFloat(food.protein) || 0;
        const fatPer100g = parseFloat(food.fat) || 0;
        return {
          foodType: food.foodId === 0 ? 2 : 1,
          foodId: food.foodId || 0,
          foodName: food.name,
          eatWeight: weight,
          calorie: (caloriePer100g * weight / 100).toFixed(0),
          carbs: (carbsPer100g * weight / 100).toFixed(1),
          protein: (proteinPer100g * weight / 100).toFixed(1),
          fat: (fatPer100g * weight / 100).toFixed(1)
        };
      });
      try {
        const res = await utils_request.request({
          url: config.API.DIET_RECORD,
          method: "POST",
          data: {
            userId: userId.value,
            mealType: selectedMealType.value,
            mealTime: mealDateTime,
            remark: remark.value,
            items
          }
        });
        if (res.code === 200) {
          common_vendor.index.hideLoading();
          common_vendor.index.showToast({ title: "保存成功", icon: "success" });
          common_vendor.index.$emit("refreshHome");
          common_vendor.index.$emit("refreshDietRecords");
          setTimeout(() => {
            common_vendor.index.showModal({
              title: "保存成功",
              content: "是否继续识别其他食物？",
              confirmText: "继续识别",
              cancelText: "返回主页",
              success: (modalRes) => {
                if (modalRes.confirm) {
                  resetRecognition();
                } else {
                  common_vendor.index.navigateBack();
                }
              }
            });
          }, 500);
        } else {
          throw new Error(res.message);
        }
      } catch (err) {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("error", "at pages/camera/camera.vue:705", "保存失败", err);
        common_vendor.index.showToast({ title: err.message || "保存失败", icon: "none" });
      } finally {
        saving.value = false;
      }
    };
    const resetRecognition = () => {
      currentImage.value = "";
      recognitionResult.value = null;
      remark.value = "";
      isLoading.value = false;
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: currentImage.value
      }, currentImage.value ? {
        b: currentImage.value
      } : {}, {
        c: common_vendor.o(chooseImage, "67"),
        d: !currentImage.value && !isLoading.value
      }, !currentImage.value && !isLoading.value ? {
        e: common_vendor.o(takePhoto, "69"),
        f: common_vendor.o(chooseFromAlbum, "96")
      } : {}, {
        g: recognitionResult.value && !isLoading.value
      }, recognitionResult.value && !isLoading.value ? {
        h: common_vendor.t((recognitionResult.value.confidence * 100).toFixed(1)),
        i: common_vendor.o(($event) => showFoodSearch.value = true, "ba"),
        j: common_vendor.f(recognitionResult.value.foods, (food, index, i0) => {
          return {
            a: common_vendor.t(food.name),
            b: common_vendor.o(($event) => openFoodSelector(index), index),
            c: common_vendor.t(food.calorie),
            d: common_vendor.o(updateTotalCalories, index),
            e: food.weight,
            f: common_vendor.o(($event) => food.weight = $event.detail.value, index),
            g: index
          };
        }),
        k: common_vendor.o(addNewFood, "ff"),
        l: common_vendor.t(totalCalories.value),
        m: common_vendor.t(recordDate.value || todayDate.value),
        n: recordDate.value,
        o: todayDate.value,
        p: common_vendor.o(onRecordDateChange, "27"),
        q: selectedMealType.value === 1 ? 1 : "",
        r: common_vendor.o(($event) => setMealType(1), "62"),
        s: selectedMealType.value === 2 ? 1 : "",
        t: common_vendor.o(($event) => setMealType(2), "1b"),
        v: selectedMealType.value === 3 ? 1 : "",
        w: common_vendor.o(($event) => setMealType(3), "c7"),
        x: selectedMealType.value === 4 ? 1 : "",
        y: common_vendor.o(($event) => setMealType(4), "4d"),
        z: remark.value,
        A: common_vendor.o(($event) => remark.value = $event.detail.value, "45"),
        B: common_vendor.t(saving.value ? "保存中..." : "保存到饮食记录"),
        C: common_vendor.o(saveToDiet, "88"),
        D: saving.value,
        E: common_vendor.o(resetRecognition, "89")
      } : {}, {
        F: showFoodSearch.value
      }, showFoodSearch.value ? common_vendor.e({
        G: common_vendor.o(closeFoodSearch, "d9"),
        H: common_vendor.o([($event) => searchKeyword.value = $event.detail.value, searchFoods], "b9"),
        I: searchKeyword.value,
        J: common_vendor.f(searchResults.value, (food, k0, i0) => {
          return {
            a: common_vendor.t(food.name),
            b: common_vendor.t(food.caloriePer100g),
            c: food.id,
            d: common_vendor.o(($event) => selectFood(food), food.id)
          };
        }),
        K: searchResults.value.length === 0
      }, searchResults.value.length === 0 ? {} : {}, {
        L: common_vendor.o(() => {
        }, "27"),
        M: common_vendor.o(closeFoodSearch, "44")
      }) : {}, {
        N: showAddFood.value
      }, showAddFood.value ? {
        O: common_vendor.o(closeAddFood, "68"),
        P: newFood.value.name,
        Q: common_vendor.o(($event) => newFood.value.name = $event.detail.value, "19"),
        R: newFood.value.calorie,
        S: common_vendor.o(($event) => newFood.value.calorie = $event.detail.value, "e2"),
        T: newFood.value.carbs,
        U: common_vendor.o(($event) => newFood.value.carbs = $event.detail.value, "b0"),
        V: newFood.value.protein,
        W: common_vendor.o(($event) => newFood.value.protein = $event.detail.value, "b6"),
        X: newFood.value.fat,
        Y: common_vendor.o(($event) => newFood.value.fat = $event.detail.value, "b7"),
        Z: common_vendor.o(closeAddFood, "04"),
        aa: common_vendor.o(saveCustomFood, "ff"),
        ab: common_vendor.o(() => {
        }, "4d"),
        ac: common_vendor.o(closeAddFood, "e7")
      } : {}, {
        ad: isLoading.value
      }, isLoading.value ? {} : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-7b8d50ad"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/camera/camera.js.map
