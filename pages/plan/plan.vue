<template>
  <view class="container">
    <!-- 热量概览 -->
    <view class="calorie-overview">
      <view class="calorie-card">
        <text class="calorie-label">每日目标</text>
        <text class="calorie-value">{{ planData.calorieGoal || 0 }}</text>
        <text class="calorie-unit">kcal</text>
      </view>
      <view class="calorie-card">
        <text class="calorie-label">今日已摄入</text>
        <text class="calorie-value">{{ planData.todayIntake || 0 }}</text>
        <text class="calorie-unit">kcal</text>
      </view>
      <view class="calorie-card">
        <text class="calorie-label">剩余预算</text>
        <text class="calorie-value" :class="remainingClass">{{ planData.remainingCalories || 0 }}</text>
        <text class="calorie-unit">kcal</text>
      </view>
    </view>

    <!-- 进度条 -->
    <view class="progress-card">
      <view class="progress-header">
        <text>今日热量进度</text>
        <text :class="getProgressTextClass()">{{ planData.progressPercent || 0 }}%</text>
      </view>
      <view class="progress-bar">
        <view class="progress-fill" :class="getProgressFillClass()" :style="{ width: (planData.progressPercent || 0) + '%' }"></view>
      </view>
    </view>

    <!-- 周期统计切换 -->
    <view class="stats-period">
      <view class="period-title">📊 周期数据统计</view>
      <view class="period-buttons">
        <button class="period-btn" :class="{ active: periodType === 'week' }" @click="periodType = 'week'">本周</button>
        <button class="period-btn" :class="{ active: periodType === 'month' }" @click="periodType = 'month'">本月</button>
        <button class="period-btn" :class="{ active: periodType === 'quarter' }" @click="periodType = 'quarter'">近90天</button>
      </view>
    </view>

    <!-- 周期统计卡片 -->
    <view class="stats-cards">
      <view class="stat-card-item">
        <text class="stat-icon">📈</text>
        <text class="stat-value">{{ avgCaloriesPeriod }}</text>
        <text class="stat-label">日均热量</text>
        <text class="stat-unit">kcal</text>
      </view>
      <view class="stat-card-item">
        <text class="stat-icon">🍽️</text>
        <text class="stat-value">{{ avgMealsPeriod }}</text>
        <text class="stat-label">日均餐数</text>
        <text class="stat-unit">次</text>
      </view>
      <view class="stat-card-item">
        <text class="stat-icon">⚖️</text>
        <text class="stat-value">{{ weightChangeText }}</text>
        <text class="stat-label">体重变化</text>
        <text class="stat-unit">kg</text>
      </view>
      <view class="stat-card-item">
        <text class="stat-icon">✅</text>
        <text class="stat-value">{{ recordRate }}%</text>
        <text class="stat-label">记录率</text>
        <text class="stat-unit"></text>
      </view>
    </view>

    <!-- 热量趋势图 -->
    <view class="section-card">
      <view class="section-title">
        <text>📊 热量趋势图</text>
        <text class="period-label">{{ periodLabel }}</text>
      </view>
      <view class="trend-chart">
        <view class="chart-bars">
          <view v-for="(item, index) in periodDataList" :key="index" class="chart-bar-item">
            <view class="bar-wrapper">
              <view class="bar" :style="{ height: getChartBarHeight(item.value) + 'rpx', backgroundColor: getChartBarColor(item.value) }"></view>
              <text class="bar-value">{{ item.value }}</text>
            </view>
            <text class="bar-label">{{ item.label }}</text>
          </view>
        </view>
      </view>
      <view class="trend-summary">
        <text>📌 周期总热量: {{ periodTotalCalories }} kcal</text>
        <text>📌 最高: {{ periodMaxCalories }} kcal | 最低: {{ periodMinCalories }} kcal</text>
      </view>
    </view>

    <!-- 饮食规律分析 -->
    <view class="section-card">
      <view class="section-title">
        <text>⏰ 饮食规律分析</text>
      </view>
      <view class="regularity-analysis">
        <view class="analysis-item">
          <text class="analysis-label">用餐规律性</text>
          <text class="analysis-value" :class="getRegularityClass()">{{ regularityText }}</text>
        </view>
        <view class="analysis-item">
          <text class="analysis-label">最活跃餐次</text>
          <text class="analysis-value">{{ activeMealText }}</text>
        </view>
        <view class="analysis-item">
          <text class="analysis-label">最常忽略</text>
          <text class="analysis-value">{{ skipMealText }}</text>
        </view>
        <view class="analysis-item">
          <text class="analysis-label">记录天数</text>
          <text class="analysis-value">{{ recordedDays }} / {{ totalDays }}</text>
        </view>
      </view>
      <view class="insight-tip">
        <text class="tip-icon">💡</text>
        <text class="tip-text">{{ regularityAdvice }}</text>
      </view>
    </view>

    <!-- 三餐分配建议 -->
    <view class="section-card">
      <view class="section-title">
        <text>🍽️ 三餐分配建议</text>
      </view>
      <view class="meal-grid">
        <view class="meal-item">
          <text class="meal-icon">🌅</text>
          <text class="meal-name">早餐</text>
          <text class="meal-calorie">{{ planData.breakfastGoal || 0 }} kcal</text>
        </view>
        <view class="meal-item">
          <text class="meal-icon">☀️</text>
          <text class="meal-name">午餐</text>
          <text class="meal-calorie">{{ planData.lunchGoal || 0 }} kcal</text>
        </view>
        <view class="meal-item">
          <text class="meal-icon">🌙</text>
          <text class="meal-name">晚餐</text>
          <text class="meal-calorie">{{ planData.dinnerGoal || 0 }} kcal</text>
        </view>
      </view>
    </view>

    <!-- 营养素建议 + 营养均衡分析 -->
    <view class="section-card">
      <view class="section-title">
        <text>🥗 营养素分析</text>
      </view>
      
      <!-- 营养素建议数值 -->
      <view class="nutrition-values">
        <view class="nutrition-value-item">
          <text class="value-label">碳水</text>
          <text class="value-num">{{ planData.carbsGoal || 0 }}g</text>
          <text class="value-unit">/日</text>
        </view>
        <view class="nutrition-value-item">
          <text class="value-label">蛋白质</text>
          <text class="value-num">{{ planData.proteinGoal || 0 }}g</text>
          <text class="value-unit">/日</text>
        </view>
        <view class="nutrition-value-item">
          <text class="value-label">脂肪</text>
          <text class="value-num">{{ planData.fatGoal || 0 }}g</text>
          <text class="value-unit">/日</text>
        </view>
      </view>

      <!-- 营养素占比饼图（使用 CSS 实现） -->
      <view class="pie-container">
        <view class="pie-title">今日营养素占比</view>
        <view class="simple-pie-chart">
          <view class="pie-item carbs" :style="{ width: (nutritionRatio.carbs || 0) + '%', backgroundColor: getCarbsColor() }">
            <text v-if="nutritionRatio.carbs > 15">{{ nutritionRatio.carbs }}%</text>
          </view>
          <view class="pie-item protein" :style="{ width: (nutritionRatio.protein || 0) + '%', backgroundColor: getProteinColor() }">
            <text v-if="nutritionRatio.protein > 15">{{ nutritionRatio.protein }}%</text>
          </view>
          <view class="pie-item fat" :style="{ width: (nutritionRatio.fat || 0) + '%', backgroundColor: getFatColor() }">
            <text v-if="nutritionRatio.fat > 15">{{ nutritionRatio.fat }}%</text>
          </view>
        </view>
        
        <!-- 图例 -->
        <view class="pie-legend">
          <view class="legend-item">
            <view class="legend-dot carbs-dot"></view>
            <text>碳水 {{ nutritionRatio.carbs || 0 }}%</text>
            <text class="standard-range">(标准: 50-65%)</text>
            <text class="status-tag" :class="getCarbsStatusClass()">{{ getCarbsStatus() }}</text>
          </view>
          <view class="legend-item">
            <view class="legend-dot protein-dot"></view>
            <text>蛋白质 {{ nutritionRatio.protein || 0 }}%</text>
            <text class="standard-range">(标准: 15-25%)</text>
            <text class="status-tag" :class="getProteinStatusClass()">{{ getProteinStatus() }}</text>
          </view>
          <view class="legend-item">
            <view class="legend-dot fat-dot"></view>
            <text>脂肪 {{ nutritionRatio.fat || 0 }}%</text>
            <text class="standard-range">(标准: 20-30%)</text>
            <text class="status-tag" :class="getFatStatusClass()">{{ getFatStatus() }}</text>
          </view>
        </view>
      </view>

      <!-- 营养均衡评价 -->
      <view class="balance-evaluation" :class="getEvaluationClass()">
        <text class="evaluation-icon">{{ getEvaluationIcon() }}</text>
        <view class="evaluation-content">
          <text class="evaluation-title">{{ getEvaluationTitle() }}</text>
          <text class="evaluation-text">{{ getEvaluationText() }}</text>
        </view>
      </view>

      <!-- 营养素进度条（带超出提示） -->
      <view class="nutrition-progress-section">
        <view class="progress-title">今日摄入进度</view>
        
        <!-- 碳水进度 -->
        <view class="nutrition-progress-item">
          <text class="progress-label">碳水</text>
          <view class="progress-bar-wrapper">
            <view class="progress-bg">
              <view class="progress-fill carbs-fill" :style="{ width: getCarbsProgress() + '%' }"></view>
            </view>
            <text class="progress-percent" :class="getCarbsExceedClass()">{{ getCarbsProgress() }}%</text>
          </view>
          <text v-if="getCarbsExceed()" class="exceed-tip">超出 {{ getCarbsExceedAmount() }}g</text>
        </view>
        
        <!-- 蛋白质进度 -->
        <view class="nutrition-progress-item">
          <text class="progress-label">蛋白质</text>
          <view class="progress-bar-wrapper">
            <view class="progress-bg">
              <view class="progress-fill protein-fill" :style="{ width: getProteinProgress() + '%' }"></view>
            </view>
            <text class="progress-percent" :class="getProteinExceedClass()">{{ getProteinProgress() }}%</text>
          </view>
          <text v-if="getProteinExceed()" class="exceed-tip">超出 {{ getProteinExceedAmount() }}g</text>
        </view>
        
        <!-- 脂肪进度 -->
        <view class="nutrition-progress-item">
          <text class="progress-label">脂肪</text>
          <view class="progress-bar-wrapper">
            <view class="progress-bg">
              <view class="progress-fill fat-fill" :style="{ width: getFatProgress() + '%' }"></view>
            </view>
            <text class="progress-percent" :class="getFatExceedClass()">{{ getFatProgress() }}%</text>
          </view>
          <text v-if="getFatExceed()" class="exceed-tip">超出 {{ getFatExceedAmount() }}g</text>
        </view>
      </view>
    </view>

    <!-- 饮食提醒 -->
    <view class="advice-card" v-if="planData.advice">
      <text class="advice-icon">💡</text>
      <text class="advice-text">{{ planData.advice }}</text>
    </view>

    <!-- 食物推荐 -->
    <view class="section-card">
      <view class="section-title">
        <text>🍱 今日食物推荐</text>
        <text class="goal-badge">{{ goalText }}</text>
      </view>
      
      <view class="meal-recommend">
        <view class="meal-recommend-title">
          <text>🌅 早餐推荐</text>
        </view>
        <view class="food-tags">
          <text v-for="(food, idx) in planData.recommendations?.breakfast" :key="idx" class="food-tag">{{ food }}</text>
        </view>
      </view>
      
      <view class="meal-recommend">
        <view class="meal-recommend-title">
          <text>☀️ 午餐推荐</text>
        </view>
        <view class="food-tags">
          <text v-for="(food, idx) in planData.recommendations?.lunch" :key="idx" class="food-tag">{{ food }}</text>
        </view>
      </view>
      
      <view class="meal-recommend">
        <view class="meal-recommend-title">
          <text>🌙 晚餐推荐</text>
        </view>
        <view class="food-tags">
          <text v-for="(food, idx) in planData.recommendations?.dinner" :key="idx" class="food-tag">{{ food }}</text>
        </view>
      </view>
      
      <view class="meal-recommend">
        <view class="meal-recommend-title">
          <text>🍎 加餐推荐</text>
        </view>
        <view class="food-tags">
          <text v-for="(food, idx) in planData.recommendations?.snack" :key="idx" class="food-tag">{{ food }}</text>
        </view>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import request from '../../utils/request'

const userId = ref(null)
const loading = ref(false)
const planData = ref({
  calorieGoal: 0,
  todayIntake: 0,
  remainingCalories: 0,
  progressPercent: 0,
  breakfastGoal: 0,
  lunchGoal: 0,
  dinnerGoal: 0,
  carbsGoal: 0,
  proteinGoal: 0,
  fatGoal: 0,
  advice: '',
  recommendations: {},
  goalType: 1
})

// 周期统计相关
const periodType = ref('week')
const periodData = ref({
  dailyCalories: {},
  mealTypeCount: { 早餐: 0, 午餐: 0, 晚餐: 0, 加餐: 0 },
  recordedDays: 0,
  totalDays: 0,
  totalCalories: 0,
  avgCalories: 0,
  maxCalories: 0,
  minCalories: 0,
  startWeight: null,
  endWeight: null,
  weightChange: 0
})

// 第一次记录日期（新增）
const firstRecordDate = ref('')

// 营养素占比数据
const nutritionRatio = ref({
  carbs: 0,
  protein: 0,
  fat: 0
})

// 今日实际摄入的营养素
const todayNutrients = ref({
  carbs: 0,
  protein: 0,
  fat: 0
})

// 周期标签
const periodLabel = computed(() => {
  if (firstRecordDate.value) {
    if (periodType.value === 'week') return `从 ${firstRecordDate.value} 开始`
    if (periodType.value === 'month') return `从 ${firstRecordDate.value} 开始`
    return `从 ${firstRecordDate.value} 开始`
  }
  if (periodType.value === 'week') return '最近7天'
  if (periodType.value === 'month') return '最近30天'
  return '最近90天'
})

// 周期数据列表
const periodDataList = computed(() => {
  const list = []
  const dailyCalories = periodData.value.dailyCalories || {}
  for (const [date, value] of Object.entries(dailyCalories)) {
    list.push({
      label: date.substring(5),
      value: value || 0
    })
  }
  return list
})

// 周期统计值
const periodTotalCalories = computed(() => periodData.value.totalCalories || 0)
const periodMaxCalories = computed(() => periodData.value.maxCalories || 0)
const periodMinCalories = computed(() => periodData.value.minCalories || 0)
const avgCaloriesPeriod = computed(() => periodData.value.avgCalories || 0)
const avgMealsPeriod = computed(() => {
  const totalMeals = Object.values(periodData.value.mealTypeCount || {}).reduce((a, b) => a + b, 0)
  const days = periodData.value.totalDays || 1
  return (totalMeals / days).toFixed(1)
})
const recordedDays = computed(() => periodData.value.recordedDays || 0)
const totalDays = computed(() => periodData.value.totalDays || 0)
const recordRate = computed(() => {
  if (totalDays.value === 0) return 0
  return Math.round(recordedDays.value / totalDays.value * 100)
})

// 体重变化
const weightChangeText = computed(() => {
  const change = periodData.value.weightChange || 0
  if (change > 0) return `+${change.toFixed(1)}`
  if (change < 0) return change.toFixed(1)
  return '0'
})

// 用餐规律性
const regularityText = computed(() => {
  const totalMeals = Object.values(periodData.value.mealTypeCount || {}).reduce((a, b) => a + b, 0)
  const days = periodData.value.totalDays || 1
  const avgMeals = totalMeals / days
  if (avgMeals >= 3) return '非常规律'
  if (avgMeals >= 2) return '比较规律'
  if (avgMeals >= 1) return '需要加强'
  return '很不规律'
})

const getRegularityClass = () => {
  const totalMeals = Object.values(periodData.value.mealTypeCount || {}).reduce((a, b) => a + b, 0)
  const days = periodData.value.totalDays || 1
  const avgMeals = totalMeals / days
  if (avgMeals >= 3) return 'regularity-good'
  if (avgMeals >= 2) return 'regularity-normal'
  return 'regularity-bad'
}

// 最活跃餐次
const activeMealText = computed(() => {
  const counts = periodData.value.mealTypeCount || { 早餐: 0, 午餐: 0, 晚餐: 0, 加餐: 0 }
  let maxMeal = '早餐'
  let maxCount = 0
  for (const [meal, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count
      maxMeal = meal
    }
  }
  return maxCount > 0 ? `${maxMeal} (${maxCount}次)` : '暂无记录'
})

// 最常忽略
const skipMealText = computed(() => {
  const counts = periodData.value.mealTypeCount || { 早餐: 0, 午餐: 0, 晚餐: 0, 加餐: 0 }
  let minMeal = '早餐'
  let minCount = Infinity
  for (const [meal, count] of Object.entries(counts)) {
    if (count < minCount) {
      minCount = count
      minMeal = meal
    }
  }
  return minCount === 0 ? minMeal : '无'
})

// 规律建议
const regularityAdvice = computed(() => {
  const totalMeals = Object.values(periodData.value.mealTypeCount || {}).reduce((a, b) => a + b, 0)
  const days = periodData.value.totalDays || 1
  const avgMeals = totalMeals / days
  const counts = periodData.value.mealTypeCount || {}
  
  if (avgMeals >= 3) {
    return '用餐规律很好！继续保持三餐定时定量的好习惯！'
  }
  if (counts['早餐'] === 0) {
    return '建议坚持吃早餐，早餐是一天能量的重要来源'
  }
  if (counts['午餐'] === 0) {
    return '午餐要吃饱，保证下午精力充沛'
  }
  if (counts['晚餐'] === 0) {
    return '晚餐要吃少，但不可不吃'
  }
  return '建议增加用餐次数，保持规律饮食'
})

// 获取图表柱状图高度
const getChartBarHeight = (value) => {
  const max = periodMaxCalories.value || 1
  if (max === 0) return 30
  return 30 + (value / max) * 150
}

const getChartBarColor = (value) => {
  const goal = planData.value.calorieGoal || 2000
  if (value > goal) return '#f44336'
  if (value > goal * 0.8) return '#ff9800'
  return '#FF8C42'
}

// 加载周期统计数据（以第一次记录日期为起点）
// 加载周期统计数据
const loadPeriodStats = async () => {
  if (!userId.value) return
  
  // 先获取第一次记录日期
  let startDate, endDate
  
  try {
    const dateRes = await request({
      url: '/api/diet/first-record-date',
      method: 'GET',
      data: { userId: userId.value }
    })
    
    if (dateRes.code === 200 && dateRes.data) {
      firstRecordDate.value = dateRes.data.firstDate
      const firstDate = new Date(firstRecordDate.value)
      
      if (periodType.value === 'week') {
        startDate = firstRecordDate.value
        const end = new Date(firstDate)
        end.setDate(end.getDate() + 6)
        endDate = end.toISOString().split('T')[0]
      } else if (periodType.value === 'month') {
        startDate = firstRecordDate.value
        const end = new Date(firstDate)
        end.setDate(end.getDate() + 29)
        endDate = end.toISOString().split('T')[0]
      } else {
        startDate = firstRecordDate.value
        const end = new Date(firstDate)
        end.setDate(end.getDate() + 89)
        endDate = end.toISOString().split('T')[0]
      }
      
      const today = new Date()
      const endDateObj = new Date(endDate)
      if (endDateObj > today) {
        endDate = today.toISOString().split('T')[0]
      }
    } else {
      // 降级处理
      const today = new Date()
      const defaultStart = new Date(today)
      defaultStart.setDate(today.getDate() - 6)
      startDate = defaultStart.toISOString().split('T')[0]
      endDate = today.toISOString().split('T')[0]
    }
  } catch (err) {
    console.error('获取第一次记录日期失败', err)
    const today = new Date()
    const defaultStart = new Date(today)
    defaultStart.setDate(today.getDate() - 6)
    startDate = defaultStart.toISOString().split('T')[0]
    endDate = today.toISOString().split('T')[0]
  }
  
  try {
    const res = await request({
      url: '/api/diet/dashboard',
      method: 'GET',
      data: { userId: userId.value, startDate: startDate, endDate: endDate }
    })
    
    if (res.code === 200 && res.data) {
      // 打印返回的数据，查看结构
      console.log('dashboard返回数据:', res.data)
      
      // 根据实际返回结构设置数据
      const dashboard = res.data
      
      // 计算总热量（从 dailyCalories 累加）
      let totalCalories = 0
      let maxCalories = 0
      let minCalories = Infinity
      let recordedDaysCount = 0
      const dailyCaloriesMap = dashboard.dailyCalories || {}
      
      for (const [date, value] of Object.entries(dailyCaloriesMap)) {
        totalCalories += value
        if (value > maxCalories) maxCalories = value
        if (value < minCalories) minCalories = value
        if (value > 0) recordedDaysCount++
      }
      if (minCalories === Infinity) minCalories = 0
      
      const days = Object.keys(dailyCaloriesMap).length || 1
      const avgCalories = Math.round(totalCalories / days)
      
      // 更新 periodData
      periodData.value = {
        dailyCalories: dailyCaloriesMap,
        mealTypeCount: dashboard.mealTypeCount || { 早餐: 0, 午餐: 0, 晚餐: 0, 加餐: 0 },
        recordedDays: recordedDaysCount,
        totalDays: days,
        totalCalories: totalCalories,
        avgCalories: avgCalories,
        maxCalories: maxCalories,
        minCalories: minCalories,
        startWeight: null,
        endWeight: null,
        weightChange: 0
      }
    }
  } catch (err) {
    console.error('加载周期统计失败', err)
  }
}

// 获取今日营养素摄入
const loadTodayNutrients = async () => {
  if (!userId.value) return
  
  try {
    const today = new Date().toISOString().split('T')[0]
    const res = await request({
      url: '/api/diet/today-nutrients',
      method: 'GET',
      data: { userId: userId.value, date: today }
    })
    
    if (res.code === 200 && res.data) {
      todayNutrients.value = res.data
      
      const total = todayNutrients.value.carbs + todayNutrients.value.protein + todayNutrients.value.fat
      if (total > 0) {
        nutritionRatio.value = {
          carbs: Math.round(todayNutrients.value.carbs / total * 100),
          protein: Math.round(todayNutrients.value.protein / total * 100),
          fat: Math.round(todayNutrients.value.fat / total * 100)
        }
      }
    }
  } catch (err) {
    console.error('获取今日营养素失败', err)
  }
}

// 进度条颜色类
const getProgressFillClass = () => {
  const percent = planData.value.progressPercent || 0
  if (percent >= 100) return 'progress-fill-danger'
  if (percent >= 80) return 'progress-fill-warning'
  return 'progress-fill'
}

const getProgressTextClass = () => {
  const percent = planData.value.progressPercent || 0
  if (percent >= 100) return 'text-danger'
  if (percent >= 80) return 'text-warning'
  return ''
}

// 碳水相关
const getCarbsProgress = () => {
  const goal = planData.value.carbsGoal || 200
  const actual = todayNutrients.value.carbs
  if (goal === 0) return 0
  const percent = Math.round(actual / goal * 100)
  return Math.min(200, percent)
}

const getCarbsExceed = () => {
  const goal = planData.value.carbsGoal || 200
  const actual = todayNutrients.value.carbs
  return actual > goal
}

const getCarbsExceedAmount = () => {
  const goal = planData.value.carbsGoal || 200
  const actual = todayNutrients.value.carbs
  return (actual - goal).toFixed(0)
}

const getCarbsExceedClass = () => {
  return getCarbsExceed() ? 'text-danger' : ''
}

const getCarbsStatus = () => {
  const ratio = nutritionRatio.value.carbs
  if (ratio >= 50 && ratio <= 65) return '合理'
  if (ratio > 65) return '偏高'
  return '偏低'
}

const getCarbsStatusClass = () => {
  const ratio = nutritionRatio.value.carbs
  if (ratio >= 50 && ratio <= 65) return 'status-good'
  if (ratio > 65) return 'status-high'
  return 'status-low'
}

// 蛋白质相关
const getProteinProgress = () => {
  const goal = planData.value.proteinGoal || 100
  const actual = todayNutrients.value.protein
  if (goal === 0) return 0
  const percent = Math.round(actual / goal * 100)
  return Math.min(200, percent)
}

const getProteinExceed = () => {
  const goal = planData.value.proteinGoal || 100
  const actual = todayNutrients.value.protein
  return actual > goal
}

const getProteinExceedAmount = () => {
  const goal = planData.value.proteinGoal || 100
  const actual = todayNutrients.value.protein
  return (actual - goal).toFixed(0)
}

const getProteinExceedClass = () => {
  return getProteinExceed() ? 'text-danger' : ''
}

const getProteinStatus = () => {
  const ratio = nutritionRatio.value.protein
  if (ratio >= 15 && ratio <= 25) return '合理'
  if (ratio > 25) return '偏高'
  return '偏低'
}

const getProteinStatusClass = () => {
  const ratio = nutritionRatio.value.protein
  if (ratio >= 15 && ratio <= 25) return 'status-good'
  if (ratio > 25) return 'status-high'
  return 'status-low'
}

// 脂肪相关
const getFatProgress = () => {
  const goal = planData.value.fatGoal || 50
  const actual = todayNutrients.value.fat
  if (goal === 0) return 0
  const percent = Math.round(actual / goal * 100)
  return Math.min(200, percent)
}

const getFatExceed = () => {
  const goal = planData.value.fatGoal || 50
  const actual = todayNutrients.value.fat
  return actual > goal
}

const getFatExceedAmount = () => {
  const goal = planData.value.fatGoal || 50
  const actual = todayNutrients.value.fat
  return (actual - goal).toFixed(0)
}

const getFatExceedClass = () => {
  return getFatExceed() ? 'text-danger' : ''
}

const getFatStatus = () => {
  const ratio = nutritionRatio.value.fat
  if (ratio >= 20 && ratio <= 30) return '合理'
  if (ratio > 30) return '偏高'
  return '偏低'
}

const getFatStatusClass = () => {
  const ratio = nutritionRatio.value.fat
  if (ratio >= 20 && ratio <= 30) return 'status-good'
  if (ratio > 30) return 'status-high'
  return 'status-low'
}

// 饼图颜色
const getCarbsColor = () => {
  const ratio = nutritionRatio.value.carbs
  if (ratio >= 50 && ratio <= 65) return '#4caf50'
  if (ratio > 65) return '#ff9800'
  return '#f44336'
}

const getProteinColor = () => {
  const ratio = nutritionRatio.value.protein
  if (ratio >= 15 && ratio <= 25) return '#4caf50'
  if (ratio > 25) return '#ff9800'
  return '#f44336'
}

const getFatColor = () => {
  const ratio = nutritionRatio.value.fat
  if (ratio >= 20 && ratio <= 30) return '#4caf50'
  if (ratio > 30) return '#ff9800'
  return '#f44336'
}

// 营养均衡评价
const getEvaluationClass = () => {
  const ratio = nutritionRatio.value
  const carbsOk = ratio.carbs >= 50 && ratio.carbs <= 65
  const proteinOk = ratio.protein >= 15 && ratio.protein <= 25
  const fatOk = ratio.fat >= 20 && ratio.fat <= 30
  
  if (carbsOk && proteinOk && fatOk) return 'evaluation-excellent'
  if (carbsOk && proteinOk) return 'evaluation-good'
  return 'evaluation-need-improve'
}

const getEvaluationIcon = () => {
  const ratio = nutritionRatio.value
  const carbsOk = ratio.carbs >= 50 && ratio.carbs <= 65
  const proteinOk = ratio.protein >= 15 && ratio.protein <= 25
  const fatOk = ratio.fat >= 20 && ratio.fat <= 30
  
  if (carbsOk && proteinOk && fatOk) return '🎉'
  if (carbsOk && proteinOk) return '👍'
  return '⚠️'
}

const getEvaluationTitle = () => {
  const ratio = nutritionRatio.value
  const carbsOk = ratio.carbs >= 50 && ratio.carbs <= 65
  const proteinOk = ratio.protein >= 15 && ratio.protein <= 25
  const fatOk = ratio.fat >= 20 && ratio.fat <= 30
  
  if (carbsOk && proteinOk && fatOk) return '营养均衡，非常棒！'
  if (carbsOk && proteinOk) return '营养搭配良好'
  return '营养需要调整'
}

const getEvaluationText = () => {
  const ratio = nutritionRatio.value
  const carbsOk = ratio.carbs >= 50 && ratio.carbs <= 65
  const proteinOk = ratio.protein >= 15 && ratio.protein <= 25
  const fatOk = ratio.fat >= 20 && ratio.fat <= 30
  
  let advice = ''
  
  if (!carbsOk) {
    if (ratio.carbs > 65) advice += '碳水摄入偏高，建议减少主食；'
    else if (ratio.carbs < 50) advice += '碳水摄入不足，建议增加主食；'
  }
  
  if (!proteinOk) {
    if (ratio.protein > 25) advice += '蛋白质摄入偏高，适量即可；'
    else if (ratio.protein < 15) advice += '蛋白质摄入不足，建议增加鱼、肉、蛋、豆制品；'
  }
  
  if (!fatOk) {
    if (ratio.fat > 30) advice += '脂肪摄入偏高，建议选择低脂烹饪方式；'
    else if (ratio.fat < 20) advice += '脂肪摄入不足，建议增加健康脂肪如坚果、橄榄油；'
  }
  
  if (advice === '') {
    advice = '各项营养素比例完美，继续保持健康的饮食习惯！'
  }
  
  return advice
}

const goalText = computed(() => {
  const type = planData.value.goalType
  if (type === 1) return '减脂模式'
  if (type === 2) return '增肌模式'
  return '保持模式'
})

const remainingClass = computed(() => {
  const remaining = planData.value.remainingCalories
  if (remaining < 0) return 'text-danger'
  if (remaining < 300) return 'text-warning'
  return 'text-success'
})

// 加载饮食规划
const loadPlan = async () => {
  if (!userId.value) return
  
  loading.value = true
  
  try {
    const res = await request({
      url: '/api/diet-plan/plan',
      method: 'GET',
      data: { userId: userId.value }
    })
    
    if (res.code === 200) {
      planData.value = res.data
    }
  } catch (err) {
    console.error('加载规划失败', err)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// 监听周期类型变化
watch(periodType, () => {
  loadPeriodStats()
})

onMounted(() => {
  userId.value = uni.getStorageSync('userId')
  if (userId.value) {
    loadPlan()
    loadTodayNutrients()
    loadPeriodStats()
  } else {
    uni.showToast({ title: '请先登录', icon: 'none' })
  }
})
</script>

<style scoped>
/* 样式保持不变 */
.container {
  min-height: 100vh;
  background-color: #FFF8F0;
  padding: 30rpx;
  padding-bottom: 60rpx;
}

/* 热量概览 */
.calorie-overview {
  display: flex;
  gap: 20rpx;
  margin-bottom: 30rpx;
}

.calorie-card {
  flex: 1;
  background: linear-gradient(135deg, #FF8C42 0%, #FFD93D 100%);
  border-radius: 20rpx;
  padding: 25rpx;
  text-align: center;
  color: #ffffff;
}

.calorie-label {
  display: block;
  font-size: 24rpx;
  opacity: 0.8;
  margin-bottom: 10rpx;
}

.calorie-value {
  display: block;
  font-size: 44rpx;
  font-weight: bold;
}

.calorie-unit {
  font-size: 22rpx;
  margin-left: 5rpx;
}

.text-success { color: #67c23a; }
.text-warning { color: #ff9800; }
.text-danger { color: #f44336; }

/* 进度卡片 */
.progress-card {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  font-size: 28rpx;
  color: #8B6914;
  margin-bottom: 15rpx;
}

.progress-bar {
  width: 100%;
  height: 16rpx;
  background-color: #e5e5e5;
  border-radius: 8rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FF8C42, #FFD93D);
  border-radius: 8rpx;
  transition: width 0.3s;
}

.progress-fill-warning {
  background: linear-gradient(90deg, #ff9800, #f57c00);
}

.progress-fill-danger {
  background: linear-gradient(90deg, #f44336, #d32f2f);
}

/* 周期统计切换 */
.stats-period {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 25rpx;
  margin-bottom: 20rpx;
}

.period-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #5C4033;
  margin-bottom: 15rpx;
}

.period-buttons {
  display: flex;
  gap: 15rpx;
}

.period-btn {
  flex: 1;
  height: 65rpx;
  line-height: 65rpx;
  font-size: 26rpx;
  background-color: #FFF8F0;
  color: #8B6914;
  border-radius: 35rpx;
}

.period-btn.active {
  background: linear-gradient(135deg, #FF8C42 0%, #FFD93D 100%);
  color: #ffffff;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  margin-bottom: 30rpx;
}

.stat-card-item {
  background: linear-gradient(135deg, #FF8C42 0%, #FFD93D 100%);
  border-radius: 20rpx;
  padding: 25rpx;
  text-align: center;
  color: #ffffff;
}

.stat-icon {
  display: block;
  font-size: 36rpx;
  margin-bottom: 10rpx;
}

.stat-value {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
}

.stat-label {
  display: block;
  font-size: 22rpx;
  opacity: 0.8;
  margin-top: 8rpx;
}

.stat-unit {
  font-size: 20rpx;
  opacity: 0.8;
}

/* 热量趋势图 */
.trend-chart {
  overflow-x: auto;
  margin-bottom: 20rpx;
}

.chart-bars {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  min-width: 500rpx;
  height: 220rpx;
}

.chart-bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.bar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bar {
  width: 40rpx;
  border-radius: 8rpx 8rpx 0 0;
  transition: height 0.3s;
}

.bar-value {
  font-size: 20rpx;
  color: #FF8C42;
  margin-top: 8rpx;
}

.bar-label {
  font-size: 20rpx;
  color: #B8956A;
  margin-top: 8rpx;
}

.trend-summary {
  font-size: 24rpx;
  color: #8B6914;
  padding-top: 15rpx;
  border-top: 1rpx solid #FFE5D0;
  line-height: 1.8;
}

/* 饮食规律分析 */
.regularity-analysis {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.analysis-item {
  flex: 1;
  min-width: 150rpx;
  text-align: center;
  padding: 15rpx;
  background-color: #f8f9fa;
  border-radius: 16rpx;
}

.analysis-label {
  display: block;
  font-size: 24rpx;
  color: #B8956A;
  margin-bottom: 8rpx;
}

.analysis-value {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #5C4033;
}

.regularity-good {
  color: #4caf50;
}

.regularity-normal {
  color: #ff9800;
}

.regularity-bad {
  color: #f44336;
}

.insight-tip {
  display: flex;
  align-items: center;
  gap: 15rpx;
  padding: 20rpx;
  background-color: #e3f2fd;
  border-radius: 16rpx;
}

.tip-icon {
  font-size: 32rpx;
}

.tip-text {
  font-size: 26rpx;
  color: #8B6914;
  flex: 1;
  line-height: 1.4;
}

/* 其他原有样式保持不变 */
.section-card {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #5C4033;
  margin-bottom: 25rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.goal-badge {
  font-size: 24rpx;
  color: #FF8C42;
  background-color: #f0e6ff;
  padding: 6rpx 16rpx;
  border-radius: 30rpx;
  font-weight: normal;
}

.meal-grid {
  display: flex;
  gap: 20rpx;
}

.meal-item {
  flex: 1;
  text-align: center;
  padding: 20rpx;
  background-color: #f8f9fa;
  border-radius: 16rpx;
}

.meal-icon {
  font-size: 44rpx;
  display: block;
  margin-bottom: 10rpx;
}

.meal-name {
  font-size: 26rpx;
  color: #8B6914;
  display: block;
  margin-bottom: 8rpx;
}

.meal-calorie {
  font-size: 28rpx;
  font-weight: bold;
  color: #FF8C42;
}

.nutrition-values {
  display: flex;
  justify-content: space-around;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #FFE5D0;
}

.nutrition-value-item {
  text-align: center;
}

.value-label {
  display: block;
  font-size: 24rpx;
  color: #B8956A;
  margin-bottom: 8rpx;
}

.value-num {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #5C4033;
}

.value-unit {
  font-size: 22rpx;
  color: #B8956A;
}

.pie-container {
  margin-bottom: 25rpx;
}

.pie-title {
  font-size: 26rpx;
  color: #8B6914;
  margin-bottom: 15rpx;
  text-align: center;
}

.simple-pie-chart {
  display: flex;
  height: 40rpx;
  border-radius: 20rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
}

.pie-item {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 22rpx;
  transition: width 0.3s;
}

.pie-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20rpx;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
}

.legend-dot {
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
}

.carbs-dot { background-color: #ff9800; }
.protein-dot { background-color: #4caf50; }
.fat-dot { background-color: #f44336; }

.standard-range {
  color: #B8956A;
  font-size: 20rpx;
}

.status-tag {
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  font-size: 20rpx;
}

.status-good {
  background-color: #e8f5e9;
  color: #4caf50;
}

.status-high {
  background-color: #fff3e0;
  color: #ff9800;
}

.status-low {
  background-color: #ffebee;
  color: #f44336;
}

.balance-evaluation {
  display: flex;
  align-items: flex-start;
  gap: 15rpx;
  padding: 20rpx;
  border-radius: 16rpx;
  margin-bottom: 25rpx;
}

.evaluation-excellent {
  background-color: #e8f5e9;
  border-left: 6rpx solid #4caf50;
}

.evaluation-good {
  background-color: #e3f2fd;
  border-left: 6rpx solid #2196f3;
}

.evaluation-need-improve {
  background-color: #fff3e0;
  border-left: 6rpx solid #ff9800;
}

.evaluation-icon {
  font-size: 40rpx;
}

.evaluation-content {
  flex: 1;
}

.evaluation-title {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #5C4033;
  margin-bottom: 8rpx;
}

.evaluation-text {
  display: block;
  font-size: 24rpx;
  color: #8B6914;
  line-height: 1.4;
}

.nutrition-progress-section {
  margin-top: 10rpx;
}

.progress-title {
  font-size: 26rpx;
  color: #8B6914;
  margin-bottom: 15rpx;
}

.nutrition-progress-item {
  display: flex;
  align-items: center;
  gap: 15rpx;
  margin-bottom: 15rpx;
  flex-wrap: wrap;
}

.progress-label {
  width: 70rpx;
  font-size: 26rpx;
  color: #8B6914;
}

.progress-bar-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10rpx;
  min-width: 200rpx;
}

.progress-bg {
  flex: 1;
  height: 16rpx;
  background-color: #FFE5D0;
  border-radius: 8rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 8rpx;
  transition: width 0.3s;
}

.carbs-fill { background-color: #ff9800; }
.protein-fill { background-color: #4caf50; }
.fat-fill { background-color: #f44336; }

.progress-percent {
  width: 50rpx;
  font-size: 24rpx;
  color: #B8956A;
  text-align: right;
}

.exceed-tip {
  font-size: 22rpx;
  color: #f44336;
  background-color: #ffebee;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
}

.advice-card {
  background-color: #fff9e6;
  border-left: 8rpx solid #ff9800;
  border-radius: 16rpx;
  padding: 25rpx;
  margin-bottom: 30rpx;
  display: flex;
  align-items: center;
  gap: 15rpx;
}

.advice-icon {
  font-size: 36rpx;
}

.advice-text {
  font-size: 28rpx;
  color: #8B6914;
  flex: 1;
  line-height: 1.4;
}

.meal-recommend {
  margin-bottom: 25rpx;
}

.meal-recommend:last-child {
  margin-bottom: 0;
}

.meal-recommend-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #5C4033;
  margin-bottom: 15rpx;
  padding-left: 10rpx;
  border-left: 6rpx solid #FF8C42;
}

.food-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
}

.food-tag {
  background-color: #f8f9fa;
  padding: 12rpx 24rpx;
  border-radius: 40rpx;
  font-size: 26rpx;
  color: #8B6914;
}

.loading {
  text-align: center;
  padding: 100rpx;
  color: #B8956A;
}
</style>

