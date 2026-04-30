<template>
  <view class="container">
    <!-- 图片预览区域 -->
    <view class="preview-area" @click="chooseImage">
      <image 
        v-if="currentImage" 
        class="preview-image" 
        :src="currentImage" 
        mode="aspectFill"
      ></image>
      <view v-else class="placeholder">
        <text class="camera-icon">📸</text>
        <text class="placeholder-text">点击拍照或选择图片</text>
        <text class="placeholder-desc">支持拍摄食物照片或从相册选择</text>
      </view>
    </view>

    <!-- 操作按钮区域 -->
    <view class="action-area" v-if="!currentImage && !isLoading">
      <button class="action-btn camera-btn" @click="takePhoto">
        <text class="btn-icon">📷</text>
        <text>拍照</text>
      </button>
      <button class="action-btn album-btn" @click="chooseFromAlbum">
        <text class="btn-icon">🖼️</text>
        <text>相册选择</text>
      </button>
    </view>

    <!-- 识别结果区域 -->
    <view class="result-area" v-if="recognitionResult && !isLoading">
      <view class="result-header">
        <text class="result-title">识别结果</text>
        <text class="confidence">置信度: {{ (recognitionResult.confidence * 100).toFixed(1) }}%</text>
        <text class="edit-hint" @click="showFoodSearch = true">✏️ 添加/修正</text>
      </view>
      
      <!-- 食物列表 -->
      <view class="food-list">
        <view 
          v-for="(food, index) in recognitionResult.foods" 
          :key="index"
          class="food-item"
        >
          <view class="food-info">
            <view class="food-name-row">
              <text class="food-name">{{ food.name }}</text>
              <text class="edit-food" @click="openFoodSelector(index)">修改</text>
            </view>
            <text class="food-calorie">{{ food.calorie }} kcal/100g</text>
          </view>
          <view class="food-weight">
            <text class="weight-label">重量(g):</text>
            <input 
              class="weight-input" 
              v-model="food.weight" 
              type="digit"
              @blur="updateTotalCalories"
            />
          </view>
        </view>
      </view>

      <!-- 添加食物按钮 -->
      <view class="add-food-btn" @click="addNewFood">
        <text>+ 添加未识别的食物</text>
      </view>

      <!-- 总热量统计 -->
      <view class="total-calorie">
        <text class="total-label">预估总热量</text>
        <text class="total-value">{{ totalCalories }}</text>
        <text class="total-unit">kcal</text>
      </view>

      <!-- 日期选择（新增） -->
      <view class="date-section">
        <text class="section-label">📅 记录日期</text>
        <picker mode="date" :value="recordDate" :end="todayDate" @change="onRecordDateChange">
          <view class="date-picker">{{ recordDate || todayDate }}</view>
        </picker>
      </view>

      <!-- 餐次选择 -->
      <view class="meal-type-section">
        <text class="section-label">餐次</text>
        <view class="meal-type-buttons">
    <button 
      class="meal-btn" 
      :class="{ active: selectedMealType === 1 }"
      @click="setMealType(1)"
    >早餐</button>
    <button 
      class="meal-btn" 
      :class="{ active: selectedMealType === 2 }"
      @click="setMealType(2)"
    >午餐</button>
    <button 
      class="meal-btn" 
      :class="{ active: selectedMealType === 3 }"
      @click="setMealType(3)"
    >晚餐</button>
    <button 
      class="meal-btn" 
      :class="{ active: selectedMealType === 4 }"
      @click="setMealType(4)"
    >加餐</button>
        </view>
      </view>

      <!-- 备注 -->
      <view class="remark-section">
        <textarea 
          class="remark-input" 
          v-model="remark" 
          placeholder="添加备注（可选）"
          maxlength="200"
        />
      </view>

      <!-- 操作按钮 -->
      <view class="result-buttons">
        <button class="save-btn" @click="saveToDiet" :disabled="saving">
          {{ saving ? '保存中...' : '保存到饮食记录' }}
        </button>
        <button class="retry-btn" @click="resetRecognition">重新识别</button>
      </view>
    </view>

    <!-- 食物选择弹窗 -->
    <view class="modal-mask" v-if="showFoodSearch" @click="closeFoodSearch">
      <view class="modal-container" @click.stop>
        <view class="modal-header">
          <text class="modal-title">选择食物</text>
          <text class="modal-close" @click="closeFoodSearch">×</text>
        </view>
        <view class="modal-body">
          <input 
            class="search-input" 
            v-model="searchKeyword" 
            placeholder="搜索食物名称"
            @input="searchFoods"
          />
          <scroll-view class="food-list-scroll" scroll-y>
            <view 
              v-for="food in searchResults" 
              :key="food.id"
              class="search-food-item"
              @click="selectFood(food)"
            >
              <text class="search-food-name">{{ food.name }}</text>
              <text class="search-food-calorie">{{ food.caloriePer100g }} kcal/100g</text>
            </view>
            <view v-if="searchResults.length === 0" class="no-result">
              <text>未找到相关食物</text>
            </view>
          </scroll-view>
        </view>
      </view>
    </view>

    <!-- 添加自定义食物弹窗 -->
    <view class="modal-mask" v-if="showAddFood" @click="closeAddFood">
      <view class="modal-container" @click.stop>
        <view class="modal-header">
          <text class="modal-title">添加自定义食物</text>
          <text class="modal-close" @click="closeAddFood">×</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">食物名称</text>
            <input class="form-input" v-model="newFood.name" placeholder="请输入食物名称" />
          </view>
          <view class="form-item">
            <text class="form-label">热量 (kcal/100g)</text>
            <input class="form-input" type="digit" v-model="newFood.calorie" placeholder="请输入热量" />
          </view>
          <view class="form-item">
            <text class="form-label">碳水 (g/100g)</text>
            <input class="form-input" type="digit" v-model="newFood.carbs" placeholder="请输入碳水" />
          </view>
          <view class="form-item">
            <text class="form-label">蛋白质 (g/100g)</text>
            <input class="form-input" type="digit" v-model="newFood.protein" placeholder="请输入蛋白质" />
          </view>
          <view class="form-item">
            <text class="form-label">脂肪 (g/100g)</text>
            <input class="form-input" type="digit" v-model="newFood.fat" placeholder="请输入脂肪" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="cancel-btn" @click="closeAddFood">取消</button>
          <button class="confirm-btn" @click="saveCustomFood">添加</button>
        </view>
      </view>
    </view>

    <!-- 加载提示 -->
    <view class="loading-area" v-if="isLoading">
      <view class="loading-content">
        <view class="chicken-loader">
          <view class="cl-body"></view>
          <view class="cl-eye le"></view>
          <view class="cl-eye ri"></view>
          <view class="cl-wing lw"></view>
          <view class="cl-wing rw"></view>
          <view class="cl-dust d1"></view>
          <view class="cl-dust d2"></view>
          <view class="cl-dust d3"></view>
        </view>
        <text class="loading-text">AI识别中...</text>
        <text class="loading-desc">小鸡正在努力分析食物成分</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import request from '../../utils/request'
import { API } from '../../config'

// 设置餐次并保存到本地
const setMealType = (type) => {
  selectedMealType.value = type
  uni.setStorageSync('lastMealType', type)
}

// 图片数据
const currentImage = ref('')
const isLoading = ref(false)
const recognitionResult = ref(null)
const saving = ref(false)
const selectedMealType = ref(1)
const remark = ref('')
const userId = ref(null)

// 食物搜索相关
const showFoodSearch = ref(false)
const searchKeyword = ref('')
const searchResults = ref([])
const currentEditIndex = ref(-1)

// 添加食物相关
const showAddFood = ref(false)
const newFood = ref({
  name: '',
  calorie: '',
  carbs: '',
  protein: '',
  fat: ''
})

// 日期选择相关
const recordDate = ref('')
const todayDate = ref('')

// 食物库列表
let foodDatabase = []

// 获取今天的日期
const getTodayDate = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 从URL参数获取餐次
onMounted(async () => {
  userId.value = uni.getStorageSync('userId')
  
  // 1. 先读取上次保存的餐次
  const lastMealType = uni.getStorageSync('lastMealType')
  if (lastMealType) {
    selectedMealType.value = lastMealType
  }
  
  // 2. 获取页面参数（URL传参优先级更高）
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.options
  
  if (options && options.mealType) {
    selectedMealType.value = parseInt(options.mealType)
  }
  
  // 3. 加载食物库
  await loadFoodDatabase()

  // 初始化日期
  todayDate.value = getTodayDate()
})

// 日期变更
const onRecordDateChange = (e) => {
  recordDate.value = e.detail.value
}

// 加载食物库
const loadFoodDatabase = async () => {
  try {
    const res = await request({
      url: API.FOOD_LIST,
      method: 'GET'
    })
    if (res.code === 200 && res.data) {
      foodDatabase = res.data
    }
  } catch (err) {
    console.error('加载食物库失败', err)
  }
}

// 计算总热量
const totalCalories = computed(() => {
  if (!recognitionResult.value || !recognitionResult.value.foods) return 0
  return recognitionResult.value.foods.reduce((total, food) => {
    const weight = parseFloat(food.weight) || 0
    const caloriePer100g = parseFloat(food.calorie) || 0
    return total + (caloriePer100g * weight / 100)
  }, 0).toFixed(0)
})

// 将图片转为 Base64（兼容小程序、H5、App）
const imageToBase64 = (filePath) => {
  return new Promise((resolve, reject) => {
    // #ifdef MP
    // 微信小程序 / 各类小程序
    uni.getFileSystemManager().readFile({
      filePath: filePath,
      encoding: 'base64',
      success: (res) => {
        resolve('data:image/jpeg;base64,' + res.data)
      },
      fail: reject
    })
    // #endif

    // #ifdef APP-PLUS
    // App 端（5+引擎）
    plus.io.resolveLocalFileSystemURL(filePath, (entry) => {
      entry.file((file) => {
        const reader = new plus.io.FileReader()
        reader.onloadend = (e) => {
          resolve(e.target.result)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    }, reject)
    // #endif

    // #ifdef H5
    // H5 端
    uni.request({
      url: filePath,
      responseType: 'blob',
      success: (res) => {
        const blob = res.data
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      },
      fail: reject
    })
    // #endif
  })
}

// 拍照
const takePhoto = () => {
  uni.chooseImage({
    count: 1,
    sourceType: ['camera'],
    success: (res) => {
      const tempFilePath = res.tempFilePaths[0]
      cropImage(tempFilePath)
    },
    fail: (err) => {
      console.error('拍照失败', err)
      uni.showToast({ title: '拍照失败，请重试', icon: 'none' })
    }
  })
}

// 从相册选择
const chooseFromAlbum = () => {
  uni.chooseImage({
    count: 1,
    sourceType: ['album'],
    success: (res) => {
      const tempFilePath = res.tempFilePaths[0]
      cropImage(tempFilePath)
    },
    fail: (err) => {
      console.error('选择图片失败', err)
      uni.showToast({ title: '选择图片失败', icon: 'none' })
    }
  })
}

// 图片裁剪
const cropImage = (imagePath) => {
  // #ifdef MP-WEIXIN
  if (wx.cropImage) {
    wx.cropImage({
      src: imagePath,
      cropScale: '1:1',
      success: (res) => {
        const croppedPath = res.tempFilePath
        currentImage.value = croppedPath
        recognizeFood(croppedPath)
      },
      fail: (err) => {
        console.error('裁剪失败', err)
        currentImage.value = imagePath
        recognizeFood(imagePath)
      }
    })
    return
  }
  // #endif
  currentImage.value = imagePath
  recognizeFood(imagePath)
}

// 点击预览区域
const chooseImage = () => {
  if (recognitionResult.value) {
    uni.showModal({
      title: '提示',
      content: '重新识别会清除当前结果，是否继续？',
      success: (res) => {
        if (res.confirm) {
          resetRecognition()
          chooseFromAlbum()
        }
      }
    })
  } else if (!currentImage.value) {
    chooseFromAlbum()
  }
}

// ========== 修改点：AI识别食物（添加了 userId） ==========
const recognizeFood = async (imagePath) => {
  isLoading.value = true
  
  try {
    uni.showLoading({ title: '处理图片中...', mask: true })
    const base64Image = await imageToBase64(imagePath)
    
    uni.showLoading({ title: 'AI识别中...', mask: true })
    const res = await request({
      url: API.AI_RECOGNIZE,
      method: 'POST',
      data: { 
        imageBase64: base64Image,
        userId: userId.value   // ✅ 添加了这一行
      }
    })
    
    if (res.code === 200 && res.data) {
      recognitionResult.value = res.data
      
      if (recognitionResult.value.foods) {
        recognitionResult.value.foods.forEach(food => {
          if (!food.weight) food.weight = 100
          if (!food.carbs) food.carbs = 0
          if (!food.protein) food.protein = 0
          if (!food.fat) food.fat = 0
        })
      }
      
      uni.hideLoading()
      uni.showToast({ title: '识别完成', icon: 'success' })
    } else {
      throw new Error(res.message || '识别失败')
    }
  } catch (err) {
    uni.hideLoading()
    console.error('识别失败', err)
    uni.showToast({ title: err.message || '识别失败，请重试', icon: 'none' })
  } finally {
    isLoading.value = false
  }
}

// ========== 修正功能 ==========

const openFoodSelector = (index) => {
  currentEditIndex.value = index
  searchKeyword.value = ''
  searchResults.value = foodDatabase
  showFoodSearch.value = true
}

const searchFoods = () => {
  if (!searchKeyword.value.trim()) {
    searchResults.value = foodDatabase
    return
  }
  searchResults.value = foodDatabase.filter(food => 
    food.name.includes(searchKeyword.value) || 
    (food.alias && food.alias.includes(searchKeyword.value))
  )
}

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
    }
    updateTotalCalories()
    uni.showToast({ title: '已修改', icon: 'success' })
  }
  closeFoodSearch()
}

const addNewFood = () => {
  showAddFood.value = true
}

const saveCustomFood = () => {
  if (!newFood.value.name) {
    uni.showToast({ title: '请输入食物名称', icon: 'none' })
    return
  }
  if (!newFood.value.calorie) {
    uni.showToast({ title: '请输入热量', icon: 'none' })
    return
  }
  
  const customFood = {
    name: newFood.value.name,
    calorie: parseFloat(newFood.value.calorie),
    carbs: parseFloat(newFood.value.carbs) || 0,
    protein: parseFloat(newFood.value.protein) || 0,
    fat: parseFloat(newFood.value.fat) || 0,
    weight: 100,
    confidence: 1.0,
    foodId: 0
  }
  
  if (!recognitionResult.value) {
    recognitionResult.value = { foods: [], confidence: 0.85 }
  }
  if (!recognitionResult.value.foods) {
    recognitionResult.value.foods = []
  }
  
  recognitionResult.value.foods.push(customFood)
  
  newFood.value = { name: '', calorie: '', carbs: '', protein: '', fat: '' }
  closeAddFood()
  uni.showToast({ title: '已添加', icon: 'success' })
}

const closeFoodSearch = () => {
  showFoodSearch.value = false
  currentEditIndex.value = -1
  searchKeyword.value = ''
}

const closeAddFood = () => {
  showAddFood.value = false
  newFood.value = { name: '', calorie: '', carbs: '', protein: '', fat: '' }
}

const updateTotalCalories = () => {
  totalCalories.value
}

// 保存到饮食记录（支持选择日期）
const saveToDiet = async () => {
  if (!recognitionResult.value || !recognitionResult.value.foods || recognitionResult.value.foods.length === 0) {
    uni.showToast({ title: '没有可保存的食物', icon: 'none' })
    return
  }
  
  saving.value = true
  uni.showLoading({ title: '保存中...', mask: true })
  
  // 使用用户选择的日期，如果没有选择则用今天
  const targetDate = recordDate.value || todayDate.value
  // 使用中午12点作为默认时间，确保显示在当天
  const mealDateTime = `${targetDate} 12:00:00`
  
  const items = recognitionResult.value.foods.map(food => {
    const weight = parseFloat(food.weight) || 100
    const caloriePer100g = parseFloat(food.calorie) || 0
    const carbsPer100g = parseFloat(food.carbs) || 0
    const proteinPer100g = parseFloat(food.protein) || 0
    const fatPer100g = parseFloat(food.fat) || 0
    
    return {
      foodType: food.foodId === 0 ? 2 : 1,
      foodId: food.foodId || 0,
      foodName: food.name,
      eatWeight: weight,
      calorie: (caloriePer100g * weight / 100).toFixed(0),
      carbs: (carbsPer100g * weight / 100).toFixed(1),
      protein: (proteinPer100g * weight / 100).toFixed(1),
      fat: (fatPer100g * weight / 100).toFixed(1)
    }
  })
  
  try {
    const res = await request({
      url: API.DIET_RECORD,
      method: 'POST',
      data: {
        userId: userId.value,
        mealType: selectedMealType.value,
        mealTime: mealDateTime,
        remark: remark.value,
        items: items
      }
    })
    
    if (res.code === 200) {
      uni.hideLoading()
      uni.showToast({ title: '保存成功', icon: 'success' })
      
      // 触发主页刷新
      uni.$emit('refreshHome')
      
      // 触发饮食记录页面刷新
      uni.$emit('refreshDietRecords')
      
      setTimeout(() => {
        uni.showModal({
          title: '保存成功',
          content: '是否继续识别其他食物？',
          confirmText: '继续识别',
          cancelText: '返回主页',
          success: (modalRes) => {
            if (modalRes.confirm) {
              resetRecognition()
            } else {
              uni.navigateBack()
            }
          }
        })
      }, 500)
    } else {
      throw new Error(res.message)
    }
  } catch (err) {
    uni.hideLoading()
    console.error('保存失败', err)
    uni.showToast({ title: err.message || '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

const resetRecognition = () => {
  currentImage.value = ''
  recognitionResult.value = null
  remark.value = ''
  isLoading.value = false
}
</script>

<style scoped>
/* 保留原有样式，添加日期选择样式 */
.container {
  min-height: 100vh;
  background-color: #FFF8F0;
  padding: 30rpx;
}

/* 日期选择区域 */
.date-section {
  margin-bottom: 30rpx;
}

.section-label {
  font-size: 28rpx;
  color: #5C4033;
  margin-bottom: 15rpx;
  display: block;
}

.date-picker {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  background-color: #FFF3B0;
  border-radius: 16rpx;
  padding: 0 25rpx;
  font-size: 28rpx;
  color: #333;
  border: 2rpx solid #FFE5D0;
}

/* 预览区域 */
.preview-area {
  background-color: #ffffff;
  border-radius: 20rpx;
  min-height: 500rpx;
  margin-bottom: 30rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.preview-image {
  width: 100%;
  height: 500rpx;
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 500rpx;
  background: linear-gradient(135deg, #FFF8F0 0%, #FFE5D0 100%);
}

.camera-icon {
  font-size: 80rpx;
  margin-bottom: 30rpx;
}

.placeholder-text {
  font-size: 32rpx;
  color: #8B6914;
  margin-bottom: 16rpx;
}

.placeholder-desc {
  font-size: 24rpx;
  color: #B8956A;
}

/* 操作按钮区域 */
.action-area {
  display: flex;
  gap: 30rpx;
  margin-bottom: 30rpx;
}

.action-btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  font-size: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.camera-btn {
  background: linear-gradient(135deg, #FF8C42 0%, #FFD93D 100%);
  color: #ffffff;
}

.album-btn {
  background-color: #ffffff;
  color: #FF8C42;
  border: 2rpx solid #FF8C42;
}

.btn-icon {
  font-size: 36rpx;
}

/* 识别结果区域 */
.result-area {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-top: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #FFE5D0;
}

.result-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #5C4033;
}

.confidence {
  font-size: 24rpx;
  color: #FFB347;
}

.edit-hint {
  font-size: 24rpx;
  color: #FF8C42;
  padding: 8rpx 16rpx;
  background-color: #FFF3B0;
  border-radius: 30rpx;
}

/* 食物列表 */
.food-list {
  margin-bottom: 30rpx;
}

.food-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.food-info {
  margin-bottom: 15rpx;
}

.food-name-row {
  display: flex;
  align-items: center;
  gap: 15rpx;
  margin-bottom: 8rpx;
}

.food-name {
  font-size: 30rpx;
  font-weight: 500;
  color: #5C4033;
}

.edit-food {
  font-size: 22rpx;
  color: #FF8C42;
  padding: 4rpx 12rpx;
  background-color: #FFF3B0;
  border-radius: 20rpx;
}

.food-calorie {
  font-size: 24rpx;
  color: #B8956A;
}

.food-weight {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 20rpx;
}

.weight-label {
  font-size: 26rpx;
  color: #8B6914;
}

.weight-input {
  width: 120rpx;
  height: 60rpx;
  border: 2rpx solid #FFE5D0;
  border-radius: 8rpx;
  text-align: center;
  font-size: 26rpx;
  padding: 0 10rpx;
}

/* 添加食物按钮 */
.add-food-btn {
  text-align: center;
  padding: 20rpx;
  margin-bottom: 20rpx;
  background-color: #f8f9fa;
  border-radius: 16rpx;
  border: 2rpx dashed #FF8C42;
}

.add-food-btn text {
  font-size: 28rpx;
  color: #FF8C42;
}

/* 总热量 */
.total-calorie {
  background: linear-gradient(135deg, #FF8C42 0%, #FFD93D 100%);
  border-radius: 16rpx;
  padding: 30rpx;
  text-align: center;
  margin-bottom: 30rpx;
}

.total-label {
  display: block;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 10rpx;
}

.total-value {
  font-size: 56rpx;
  font-weight: bold;
  color: #ffffff;
  margin-right: 8rpx;
}

.total-unit {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

/* 餐次选择 */
.meal-type-section {
  margin-bottom: 30rpx;
}

.section-label {
  font-size: 28rpx;
  color: #5C4033;
  margin-bottom: 20rpx;
  display: block;
}

.meal-type-buttons {
  display: flex;
  gap: 20rpx;
}

.meal-btn {
  flex: 1;
  height: 70rpx;
  line-height: 70rpx;
  font-size: 28rpx;
  background-color: #FFF3B0;
  color: #8B6914;
  border-radius: 35rpx;
}

.meal-btn.active {
  background: linear-gradient(135deg, #FF8C42 0%, #FFD93D 100%);
  color: #ffffff;
}

/* 备注 */
.remark-section {
  margin-bottom: 30rpx;
}

.remark-input {
  width: 100%;
  min-height: 120rpx;
  background-color: #FFF3B0;
  border-radius: 16rpx;
  padding: 20rpx;
  font-size: 28rpx;
  color: #333;
}

/* 结果按钮 */
.result-buttons {
  display: flex;
  gap: 20rpx;
}

.save-btn {
  flex: 1;
  background: linear-gradient(135deg, #FF8C42 0%, #FFD93D 100%);
  color: #ffffff;
  border-radius: 44rpx;
  height: 80rpx;
  line-height: 80rpx;
  font-size: 28rpx;
}

.save-btn[disabled] {
  opacity: 0.6;
}

.retry-btn {
  flex: 1;
  background-color: #FFF3B0;
  color: #8B6914;
  border-radius: 44rpx;
  height: 80rpx;
  line-height: 80rpx;
  font-size: 28rpx;
}

/* 弹窗样式 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  width: 600rpx;
  max-height: 80%;
  background-color: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #eee;
}

.modal-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
}

.modal-close {
  font-size: 44rpx;
  color: #999;
  line-height: 1;
}

.modal-body {
  padding: 30rpx;
  flex: 1;
  overflow: auto;
}

.search-input {
  width: 100%;
  height: 70rpx;
  border: 2rpx solid #FFE5D0;
  border-radius: 35rpx;
  padding: 0 25rpx;
  font-size: 28rpx;
  margin-bottom: 20rpx;
}

.food-list-scroll {
  max-height: 500rpx;
}

.search-food-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.search-food-name {
  font-size: 28rpx;
  color: #333;
}

.search-food-calorie {
  font-size: 24rpx;
  color: #999;
}

.no-result {
  text-align: center;
  padding: 40rpx;
  color: #999;
}

.form-item {
  margin-bottom: 25rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 12rpx;
}

.form-input {
  width: 100%;
  height: 70rpx;
  border: 2rpx solid #FFE5D0;
  border-radius: 16rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
}

.modal-footer {
  display: flex;
  padding: 20rpx 30rpx 30rpx;
  gap: 20rpx;
}

.cancel-btn, .confirm-btn {
  flex: 1;
  height: 70rpx;
  line-height: 70rpx;
  border-radius: 35rpx;
  font-size: 28rpx;
}

.cancel-btn {
  background-color: #FFF3B0;
  color: #666;
}

.confirm-btn {
  background: linear-gradient(135deg, #FF8C42 0%, #FFD93D 100%);
  color: #ffffff;
}

/* 加载动画 */
.loading-area {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-content {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 60rpx;
  text-align: center;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  margin: 0 auto 30rpx;
  border: 4rpx solid #f3f3f3;
  border-top: 4rpx solid #FF8C42;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  display: block;
  font-size: 32rpx;
  color: #5C4033;
  margin-bottom: 10rpx;
}

.loading-desc {
  display: block;
  font-size: 24rpx;
  color: #B8956A;
}

/* ========== 小鸡加载动画 ========== */
.chicken-loader {
  width: 120rpx;
  height: 120rpx;
  position: relative;
  margin: 0 auto 30rpx;
}

.cl-body {
  width: 70rpx;
  height: 65rpx;
  background: linear-gradient(135deg, #FFD93D 0%, #FFB347 100%);
  border-radius: 50% 50% 45% 45%;
  position: absolute;
  top: 30rpx;
  left: 25rpx;
  animation: loaderBounce 0.6s ease-in-out infinite;
  box-shadow: 0 4rpx 12rpx rgba(255, 140, 66, 0.3);
}

.cl-body::before {
  content: '';
  position: absolute;
  top: -12rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 10rpx solid transparent;
  border-right: 10rpx solid transparent;
  border-bottom: 18rpx solid #FF6B35;
}

.cl-eye {
  position: absolute;
  width: 10rpx;
  height: 10rpx;
  background: #333;
  border-radius: 50%;
  top: 48rpx;
  z-index: 2;
  animation: chickenBlink 3s ease-in-out infinite;
}

.cl-eye.le { left: 38rpx; }
.cl-eye.ri { right: 38rpx; }

.cl-wing {
  position: absolute;
  width: 22rpx;
  height: 26rpx;
  background: #FFB347;
  border-radius: 50%;
  top: 50rpx;
  z-index: 1;
}

.cl-wing.lw {
  left: 18rpx;
  animation: wingFlapLeft 0.6s ease-in-out infinite;
}

.cl-wing.rw {
  right: 18rpx;
  animation: wingFlapRight 0.6s ease-in-out infinite;
}

.cl-dust {
  position: absolute;
  bottom: 15rpx;
  background: rgba(255, 140, 66, 0.25);
  border-radius: 50%;
  animation: dustFade 0.8s ease-out infinite;
}

.cl-dust.d1 { left: 15rpx; width: 10rpx; height: 10rpx; animation-delay: 0s; }
.cl-dust.d2 { left: 35rpx; width: 8rpx; height: 8rpx; animation-delay: 0.2s; }
.cl-dust.d3 { left: 55rpx; width: 12rpx; height: 12rpx; animation-delay: 0.4s; }

@keyframes loaderBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15rpx); }
}

@keyframes dustFade {
  0% { opacity: 0.6; transform: translateX(0) scale(1); }
  100% { opacity: 0; transform: translateX(-20rpx) scale(0.5); }
}
</style>