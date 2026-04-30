<template>
  <view class="container">
    <!-- 顶部 AI 助手区域 -->
    <view class="ai-header">
      <view class="ai-avatar">
        <view class="ai-chicken">
          <view class="ac-body"></view>
          <view class="ac-eye ac-left"></view>
          <view class="ac-eye ac-right"></view>
          <view class="ac-beak"></view>
          <view class="ac-hat">🎓</view>
        </view>
      </view>
      <view class="ai-info">
        <text class="ai-name">🐥 AI 饮食规划师</text>
        <text class="ai-status">{{ aiStatus }}</text>
      </view>
    </view>

    <!-- 今日热量概览 -->
    <view class="calorie-overview card">
      <view class="overview-title">📊 今日热量进度</view>
      <view class="calorie-ring">
        <view class="ring-bg">
          <view class="ring-fill" :style="{ 
            background: `conic-gradient(#FF8C42 ${progressPercent}%, #FFE5D0 ${progressPercent}%)` 
          }">
            <view class="ring-inner">
              <text class="ring-value">{{ remainingCalories }}</text>
              <text class="ring-label">剩余 kcal</text>
            </view>
          </view>
        </view>
      </view>
      <view class="calorie-detail">
        <view class="detail-item">
          <text class="detail-num">{{ targetCalories }}</text>
          <text class="detail-label">目标</text>
        </view>
        <view class="detail-item">
          <text class="detail-num">{{ consumedCalories }}</text>
          <text class="detail-label">已摄入</text>
        </view>
        <view class="detail-item">
          <text class="detail-num">{{ remainingCalories }}</text>
          <text class="detail-label">剩余</text>
        </view>
      </view>
    </view>

    <!-- 已记录餐次 -->
    <view class="recorded-meals card" v-if="todayMeals.length > 0">
      <view class="card-title">📝 今日已记录</view>
      <view v-for="(meal, index) in todayMeals" :key="index" class="meal-record">
        <view class="meal-badge" :class="'type-' + meal.type">{{ meal.typeName }}</view>
        <view class="meal-info">
          <text class="meal-foods">{{ meal.foods || '未记录食物' }}</text>
          <text class="meal-cal">{{ meal.calories || 0 }} kcal</text>
        </view>
      </view>
    </view>

    <!-- AI 生成按钮 -->
    <view class="generate-section" v-if="!currentPlan">
      <view class="generate-hint">
        <text class="hint-icon">💡</text>
        <text class="hint-text">{{ generateHint }}</text>
      </view>
      <button class="generate-btn" @click="generateAIPlan" :disabled="isGenerating">
        <text v-if="!isGenerating">🤖 AI 生成下一餐建议</text>
        <view v-else class="btn-loader">
          <view class="bl-dot"></view>
          <view class="bl-dot"></view>
          <view class="bl-dot"></view>
        </view>
      </button>
    </view>

    <!-- AI 规划结果 -->
    <view class="ai-plan card" v-if="currentPlan && currentPlan.foods">
      <view class="plan-header">
        <view class="plan-badge">{{ currentPlan.mealType || '建议' }}</view>
        <text class="plan-cal">{{ currentPlan.totalCalories || 0 }} kcal</text>
      </view>
      
      <view class="plan-foods">
        <view v-for="(food, idx) in currentPlan.foods" :key="idx" class="food-item">
          <image class="food-img" :src="food.image || '/static/haocun.jpg'" mode="aspectFill"></image>
          <view class="food-info">
            <text class="food-name">{{ food.name || '未知食物' }}</text>
            <text class="food-amount">{{ food.amount || '适量' }}</text>
            <text class="food-cal">{{ food.calories || 0 }} kcal</text>
          </view>
        </view>
      </view>

      <view class="plan-nutrition" v-if="currentPlan.nutrition">
        <view class="nutrition-item">
          <view class="nutrition-bar carbs" :style="{ width: (currentPlan.nutrition.carbs || 0) + '%' }"></view>
          <text>碳水 {{ currentPlan.nutrition.carbs || 0 }}%</text>
        </view>
        <view class="nutrition-item">
          <view class="nutrition-bar protein" :style="{ width: (currentPlan.nutrition.protein || 0) + '%' }"></view>
          <text>蛋白质 {{ currentPlan.nutrition.protein || 0 }}%</text>
        </view>
        <view class="nutrition-item">
          <view class="nutrition-bar fat" :style="{ width: (currentPlan.nutrition.fat || 0) + '%' }"></view>
          <text>脂肪 {{ currentPlan.nutrition.fat || 0 }}%</text>
        </view>
      </view>

      <view class="plan-reason" v-if="currentPlan.reason">
        <text class="reason-title">🎯 推荐理由</text>
        <text class="reason-text">{{ currentPlan.reason }}</text>
      </view>

      <view class="plan-actions">
        <button class="action-btn secondary" @click="regeneratePlan">🔄 重新生成</button>
        <button class="action-btn primary" @click="recordPlan">✅ 按此方案记录</button>
      </view>
    </view>

    <!-- 历史规划记录 -->
    <view class="history-plans card" v-if="planHistory.length > 0">
      <view class="card-title">📚 今日规划记录</view>
      <view v-for="(plan, idx) in planHistory" :key="idx" class="history-item">
        <view class="history-meal">{{ plan.mealType || '未知' }}</view>
        <text class="history-foods">{{ getPlanFoodsText(plan) }}</text>
        <text class="history-cal">{{ plan.totalCalories || 0 }} kcal</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../../utils/request'
import { API } from '../../config'

const userId = ref(null)
const userProfile = ref(null)
const todayMeals = ref([])
const targetCalories = ref(2000)
const consumedCalories = ref(0)
const remainingCalories = ref(2000)
const isGenerating = ref(false)
const currentPlan = ref(null)
const planHistory = ref([])
const aiStatus = ref('准备为您规划下一餐...')
const progressPercent = ref(0)
const generateHint = ref('点击按钮生成饮食建议')

// 页面加载
onMounted(() => {
  userId.value = uni.getStorageSync('userId')
  if (!userId.value) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/login/login' })
    }, 1500)
    return
  }
  
  loadUserProfile()
  loadTodayMeals()
  loadCalorieGoal()
})

// 获取用户档案
const loadUserProfile = () => {
  try {
    const profile = uni.getStorageSync('userProfile') || {}
    const userInfo = uni.getStorageSync('userInfo') || {}
    
    userProfile.value = {
      nickname: profile.nickname || userInfo.nickname || '用户',
      gender: profile.gender || 1,
      age: profile.age || 25,
      height: profile.height || 170,
      weight: profile.weight || 65,
      targetWeight: profile.targetWeight || 60,
      activityLevel: profile.activityLevel || 1,
      goalType: profile.goalType || 1,
      dietPreference: profile.dietPreference || 'none',
      tabooDetail: profile.tabooDetail || '',
      allergies: profile.allergies || ''
    }
  } catch (e) {
    console.error('加载用户档案失败', e)
    userProfile.value = {
      nickname: '用户', gender: 1, age: 25, height: 170, weight: 65,
      targetWeight: 60, activityLevel: 1, goalType: 1,
      dietPreference: 'none', tabooDetail: '', allergies: ''
    }
  }
}

// 获取热量目标
const loadCalorieGoal = async () => {
  try {
    const url = API.USER_CALORIE_GOAL.replace('{userId}', userId.value)
    const res = await request({ url, method: 'GET' })
    if (res.code === 200 && res.data) {
      targetCalories.value = res.data
    } else {
      calculateLocalGoal()
    }
  } catch (err) {
    console.error('获取热量目标失败', err)
    calculateLocalGoal()
  }
  updateCalorieStatus()
}

// 本地计算热量目标（备用）
const calculateLocalGoal = () => {
  const p = userProfile.value
  if (!p) return
  
  const bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age
  const baseCalories = p.gender === 1 ? bmr + 5 : bmr - 161
  
  const activityMultipliers = [1.2, 1.375, 1.55, 1.725, 1.9]
  const multiplier = activityMultipliers[p.activityLevel - 1] || 1.2
  let target = Math.round(baseCalories * multiplier)
  
  if (p.goalType === 1) target = Math.round(target * 0.8)
  if (p.goalType === 2) target = Math.round(target * 1.1)
  
  targetCalories.value = target
}

// 获取今日饮食记录
const loadTodayMeals = async () => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const res = await request({
      url: API.DIET_TODAY,
      method: 'GET',
      data: { userId: userId.value, date: today }
    })
    
    if (res.code === 200 && res.data) {
      todayMeals.value = res.data.meals || []
      consumedCalories.value = res.data.totalCalories || 0
    } else {
      loadLocalMeals()
    }
  } catch (err) {
    console.error('获取今日饮食失败', err)
    loadLocalMeals()
  }
  updateCalorieStatus()
}

// 从本地获取（备用）
const loadLocalMeals = () => {
  try {
    const today = new Date().toDateString()
    const meals = uni.getStorageSync(`meals_${today}`) || []
    todayMeals.value = meals
    consumedCalories.value = meals.reduce((sum, m) => sum + (m.calories || 0), 0)
  } catch (e) {
    todayMeals.value = []
    consumedCalories.value = 0
  }
}

// 更新热量状态
const updateCalorieStatus = () => {
  remainingCalories.value = targetCalories.value - consumedCalories.value
  
  const percent = targetCalories.value > 0 
    ? Math.min(100, (consumedCalories.value / targetCalories.value) * 100) 
    : 0
  progressPercent.value = percent
  
  if (consumedCalories.value === 0) {
    aiStatus.value = '今天还没有记录，让我来规划您的第一餐吧！'
    generateHint.value = '今天还没有记录哦！让 AI 帮您规划早餐吧'
  } else if (remainingCalories.value < 0) {
    aiStatus.value = `已超标 ${Math.abs(remainingCalories.value)} kcal`
    generateHint.value = `今日热量已超标 ${Math.abs(remainingCalories.value)} kcal，AI 将推荐低卡方案`
  } else if (remainingCalories.value < 300) {
    aiStatus.value = `仅剩 ${remainingCalories.value} kcal`
    generateHint.value = `今日仅剩 ${remainingCalories.value} kcal，AI 推荐轻食方案`
  } else {
    aiStatus.value = `已摄入 ${consumedCalories.value} kcal，剩余 ${remainingCalories.value} kcal`
    const recordedTypes = todayMeals.value.map(m => m.typeName).join('、')
    generateHint.value = `已记录 ${recordedTypes}，让 AI 规划下一餐（剩余 ${remainingCalories.value} kcal）`
  }
}

// ========== 核心：调用 AI 生成饮食方案 ==========
const generateAIPlan = async () => {
  if (isGenerating.value) return
  
  isGenerating.value = true
  aiStatus.value = 'AI 正在分析您的饮食数据...'
  
  try {
    const aiParams = buildAIParams()
    
    const res = await request({
      url: API.AI_DIET_PLAN,
      method: 'POST',
      data: aiParams,
      timeout: 15000
    })
    
    if (res.code === 200 && res.data) {
      currentPlan.value = res.data
      aiStatus.value = `已为您生成${res.data.mealType}方案！`
    } else {
      throw new Error(res.message || 'AI 生成失败')
    }
  } catch (err) {
    console.error('AI 生成失败', err)
    aiStatus.value = 'AI 服务繁忙，使用本地智能推荐...'
    generateLocalPlan()
  } finally {
    isGenerating.value = false
  }
}

// 构建 AI 请求参数
const buildAIParams = () => {
  const p = userProfile.value || {}
  const nextMeal = getNextMealType()
  
  return {
    userId: userId.value,
    profile: {
      gender: p.gender || 1,
      age: p.age || 25,
      height: p.height || 170,
      weight: p.weight || 65,
      targetWeight: p.targetWeight || 60,
      activityLevel: p.activityLevel || 1,
      goalType: p.goalType || 1,
      bmr: calculateBMR()
    },
    restrictions: {
      dietPreference: p.dietPreference || 'none',
      tabooDetail: p.tabooDetail || '',
      allergies: p.allergies ? p.allergies.split(/[,，、]/) : []
    },
    calorieStatus: {
      target: targetCalories.value,
      consumed: consumedCalories.value,
      remaining: remainingCalories.value,
      progressPercent: progressPercent.value
    },
    recordedMeals: todayMeals.value.map(m => ({
      type: m.type,
      typeName: m.typeName,
      foods: m.foods,
      calories: m.calories,
      nutrition: m.nutrition
    })),
    targetMeal: nextMeal
  }
}

// 计算基础代谢率
const calculateBMR = () => {
  const p = userProfile.value
  if (!p) return 1500
  const bmr = 10 * (p.weight || 65) + 6.25 * (p.height || 170) - 5 * (p.age || 25)
  return (p.gender || 1) === 1 ? bmr + 5 : bmr - 161
}

// 判断下一餐是什么
const getNextMealType = () => {
  const mealOrder = [
    { type: 1, name: '早餐' },
    { type: 2, name: '午餐' },
    { type: 3, name: '晚餐' },
    { type: 4, name: '加餐' }
  ]
  
  const recordedTypes = todayMeals.value.map(m => m.type)
  for (const meal of mealOrder) {
    if (!recordedTypes.includes(meal.type)) {
      return { type: meal.type, name: meal.name }
    }
  }
  
  return { type: 4, name: '加餐' }
}

// 本地智能推荐（AI 失败时的降级方案）
const generateLocalPlan = () => {
  const nextMeal = getNextMealType()
  const remaining = remainingCalories.value
  const p = userProfile.value || {}
  
  let suggestCalories = 0
  const mealRatios = { '早餐': 0.3, '午餐': 0.4, '晚餐': 0.25, '加餐': 0.05 }
  const ratio = mealRatios[nextMeal.name] || 0.25
  
  if (remaining > 0) {
    const remainingRatio = 1 - (progressPercent.value / 100)
    suggestCalories = remainingRatio > 0 ? Math.round(remaining * (ratio / remainingRatio)) : 200
  } else {
    suggestCalories = 200
  }
  
  const foodDatabase = getFilteredFoods(p)
  
  const staple = pickFood(foodDatabase.staples, suggestCalories * 0.5)
  const protein = pickFood(foodDatabase.proteins, suggestCalories * 0.3)
  const veg = pickFood(foodDatabase.vegetables, suggestCalories * 0.2)
  
  currentPlan.value = {
    mealType: nextMeal.name,
    totalCalories: (staple?.calories || 0) + (protein?.calories || 0) + (veg?.calories || 0),
    foods: [
      { name: staple?.name || '主食', amount: staple?.amount || '适量', calories: staple?.calories || 0, image: staple?.image || '' },
      { name: protein?.name || '蛋白质', amount: protein?.amount || '适量', calories: protein?.calories || 0, image: protein?.image || '' },
      { name: veg?.name || '蔬菜', amount: veg?.amount || '适量', calories: veg?.calories || 0, image: veg?.image || '' }
    ],
    nutrition: { carbs: 50, protein: 25, fat: 25 },
    reason: `基于您的${p.goalType === 1 ? '减脂' : p.goalType === 2 ? '增肌' : '保持'}目标，今日剩余 ${remaining} kcal，${nextMeal.name}建议摄入约 ${suggestCalories} kcal。`
  }
}

// 根据偏好过滤食物
const getFilteredFoods = (profile) => {
  const allFoods = {
    staples: [
      { name: '全麦面包', calories: 120, amount: '2片', tags: ['vegetarian', 'halal'] },
      { name: '糙米饭', calories: 150, amount: '1碗', tags: ['vegetarian', 'halal'] },
      { name: '燕麦粥', calories: 100, amount: '1碗', tags: ['vegetarian', 'halal'] },
      { name: '红薯', calories: 90, amount: '1个', tags: ['vegetarian', 'halal'] },
      { name: '藜麦饭', calories: 130, amount: '1碗', tags: ['vegetarian', 'halal'] }
    ],
    proteins: [
      { name: '水煮蛋', calories: 70, amount: '1个', tags: ['vegetarian', 'halal'] },
      { name: '鸡胸肉', calories: 120, amount: '100g', tags: ['halal'] },
      { name: '豆腐', calories: 80, amount: '150g', tags: ['vegetarian', 'halal'] },
      { name: '三文鱼', calories: 150, amount: '100g', tags: ['halal'] },
      { name: '牛肉', calories: 130, amount: '100g', tags: ['halal'] }
    ],
    vegetables: [
      { name: '西兰花', calories: 35, amount: '150g', tags: ['vegetarian', 'halal'] },
      { name: '菠菜', calories: 25, amount: '150g', tags: ['vegetarian', 'halal'] },
      { name: '胡萝卜', calories: 30, amount: '100g', tags: ['vegetarian', 'halal'] },
      { name: '黄瓜', calories: 15, amount: '1根', tags: ['vegetarian', 'halal'] },
      { name: '番茄', calories: 20, amount: '1个', tags: ['vegetarian', 'halal'] }
    ]
  }
  
  const preference = profile.dietPreference || 'none'
  if (preference === 'none') return allFoods
  
  const filterByPreference = (foods) => {
    if (preference === 'vegetarian') {
      return foods.filter(f => f.tags.includes('vegetarian'))
    }
    if (preference === 'halal') {
      return foods.filter(f => f.tags.includes('halal'))
    }
    if (preference === 'taboo' && profile.tabooDetail) {
      const taboos = profile.tabooDetail.split(/[,，、]/)
      return foods.filter(f => !taboos.some(t => f.name.includes(t)))
    }
    return foods
  }
  
  return {
    staples: filterByPreference(allFoods.staples),
    proteins: filterByPreference(allFoods.proteins),
    vegetables: filterByPreference(allFoods.vegetables)
  }
}

// 从列表中挑选食物
const pickFood = (foods, targetCalories) => {
  if (!foods || foods.length === 0) {
    return { name: '蔬菜沙拉', calories: 50, amount: '1份' }
  }
  const sorted = [...foods].sort((a, b) => 
    Math.abs((a.calories || 0) - targetCalories) - Math.abs((b.calories || 0) - targetCalories)
  )
  return sorted[0]
}

// 重新生成
const regeneratePlan = () => {
  currentPlan.value = null
  generateAIPlan()
}

// 按方案记录
const recordPlan = () => {
  if (!currentPlan.value) return
  
  const plan = currentPlan.value
  const nextMeal = getNextMealType()
  
  const mealData = {
    userId: userId.value,
    type: nextMeal.type,
    typeName: plan.mealType || nextMeal.name,
    foods: (plan.foods || []).map(f => `${f.name || ''}${f.amount || ''}`).join('、'),
    calories: plan.totalCalories || 0,
    nutrition: plan.nutrition || { carbs: 0, protein: 0, fat: 0 },
    date: new Date().toISOString().split('T')[0]
  }
  
  planHistory.value.push({ ...plan, timestamp: Date.now() })
  
  request({
    url: API.DIET_RECORD,
    method: 'POST',
    data: mealData
  }).then(() => {
    uni.showToast({ title: '记录成功', icon: 'success' })
    loadTodayMeals()
    currentPlan.value = null
    uni.$emit('refreshHome')
    uni.$emit('refreshDashboard')
  }).catch(err => {
    console.error('记录失败', err)
    uni.showToast({ title: '记录失败', icon: 'none' })
  })
}

// 获取历史食物文本
const getPlanFoodsText = (plan) => {
  if (!plan || !plan.foods) return ''
  return plan.foods.map(f => f.name || '未知').join('、')
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #FFF8F0;
  padding: 30rpx;
}

.card {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

/* AI 头部 */
.ai-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 30rpx;
}

.ai-avatar {
  width: 100rpx;
  height: 100rpx;
  position: relative;
}

.ai-chicken {
  width: 100%;
  height: 100%;
  position: relative;
}

.ac-body {
  width: 70rpx;
  height: 65rpx;
  background: linear-gradient(135deg, #FFD93D 0%, #FFB347 100%);
  border-radius: 50% 50% 45% 45%;
  position: absolute;
  top: 20rpx;
  left: 15rpx;
}

.ac-body::before {
  content: '';
  position: absolute;
  top: -12rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8rpx solid transparent;
  border-right: 8rpx solid transparent;
  border-bottom: 16rpx solid #FF6B35;
}

.ac-eye {
  position: absolute;
  width: 8rpx;
  height: 8rpx;
  background: #333;
  border-radius: 50%;
  top: 35rpx;
  z-index: 2;
}

.ac-left { left: 32rpx; }
.ac-right { right: 32rpx; }

.ac-beak {
  position: absolute;
  bottom: 30rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8rpx solid transparent;
  border-right: 8rpx solid transparent;
  border-top: 12rpx solid #FF6B35;
}

.ac-hat {
  position: absolute;
  top: -15rpx;
  right: 10rpx;
  font-size: 32rpx;
  animation: hatBounce 2s ease-in-out infinite;
}

@keyframes hatBounce {
  0%, 100% { transform: translateY(0) rotate(-5deg); }
  50% { transform: translateY(-5rpx) rotate(5deg); }
}

.ai-info {
  flex: 1;
}

.ai-name {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #5C4033;
}

.ai-status {
  display: block;
  font-size: 24rpx;
  color: #B8956A;
  margin-top: 8rpx;
}

/* 热量概览 */
.overview-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #5C4033;
  margin-bottom: 30rpx;
}

.calorie-ring {
  display: flex;
  justify-content: center;
  margin-bottom: 30rpx;
}

.ring-bg {
  width: 240rpx;
  height: 240rpx;
  border-radius: 50%;
  padding: 12rpx;
  background: #FFE5D0;
}

.ring-fill {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring-inner {
  width: 200rpx;
  height: 200rpx;
  background: #ffffff;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ring-value {
  font-size: 48rpx;
  font-weight: bold;
  color: #FF8C42;
}

.ring-label {
  font-size: 24rpx;
  color: #B8956A;
}

.calorie-detail {
  display: flex;
  justify-content: space-around;
}

.detail-item {
  text-align: center;
}

.detail-num {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #5C4033;
}

.detail-label {
  font-size: 24rpx;
  color: #B8956A;
  margin-top: 8rpx;
}

/* 已记录餐次 */
.meal-record {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #FFE5D0;
}

.meal-record:last-child {
  border-bottom: none;
}

.meal-badge {
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  color: #ffffff;
}

.meal-badge.type-1 { background: linear-gradient(135deg, #FF8C42, #FFD93D); }
.meal-badge.type-2 { background: linear-gradient(135deg, #4caf50, #8bc34a); }
.meal-badge.type-3 { background: linear-gradient(135deg, #2196f3, #64b5f6); }
.meal-badge.type-4 { background: linear-gradient(135deg, #9c27b0, #ce93d8); }

.meal-info {
  flex: 1;
}

.meal-foods {
  display: block;
  font-size: 28rpx;
  color: #5C4033;
}

.meal-cal {
  font-size: 24rpx;
  color: #FF8C42;
}

/* 生成区域 */
.generate-section {
  margin-bottom: 30rpx;
}

.generate-hint {
  display: flex;
  align-items: center;
  gap: 15rpx;
  background: linear-gradient(135deg, #FFF3B0, #FFE5D0);
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.hint-icon {
  font-size: 40rpx;
}

.hint-text {
  flex: 1;
  font-size: 28rpx;
  color: #8B6914;
  line-height: 1.5;
}

.generate-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #FF8C42 0%, #FFD93D 100%);
  color: #ffffff;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.generate-btn::after { border: none; }

.generate-btn[disabled] {
  opacity: 0.7;
}

/* AI 规划结果 */
.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.plan-badge {
  padding: 10rpx 30rpx;
  background: linear-gradient(135deg, #FF8C42, #FFD93D);
  color: #ffffff;
  border-radius: 30rpx;
  font-size: 28rpx;
  font-weight: 500;
}

.plan-cal {
  font-size: 36rpx;
  font-weight: bold;
  color: #FF8C42;
}

.plan-foods {
  margin-bottom: 30rpx;
}

.food-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx;
  background: #FFF8F0;
  border-radius: 16rpx;
  margin-bottom: 16rpx;
}

.food-img {
  width: 100rpx;
  height: 100rpx;
  border-radius: 16rpx;
  background: #FFE5D0;
}

.food-info {
  flex: 1;
}

.food-name {
  display: block;
  font-size: 30rpx;
  font-weight: 500;
  color: #5C4033;
}

.food-amount {
  display: block;
  font-size: 24rpx;
  color: #B8956A;
  margin-top: 8rpx;
}

.food-cal {
  font-size: 24rpx;
  color: #FF8C42;
}

/* 营养占比 */
.plan-nutrition {
  display: flex;
  gap: 20rpx;
  margin-bottom: 30rpx;
}

.nutrition-item {
  flex: 1;
  text-align: center;
}

.nutrition-bar {
  height: 12rpx;
  border-radius: 6rpx;
  margin-bottom: 10rpx;
}

.nutrition-bar.carbs { background: linear-gradient(90deg, #ff9800, #ffc107); }
.nutrition-bar.protein { background: linear-gradient(90deg, #4caf50, #8bc34a); }
.nutrition-bar.fat { background: linear-gradient(90deg, #f44336, #ff5722); }

/* 推荐理由 */
.plan-reason {
  background: linear-gradient(135deg, #FFF3B0, #FFF8F0);
  border-radius: 16rpx;
  padding: 25rpx;
  margin-bottom: 30rpx;
}

.reason-title {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #5C4033;
  margin-bottom: 15rpx;
}

.reason-text {
  font-size: 26rpx;
  color: #8B6914;
  line-height: 1.6;
}

/* 操作按钮 */
.plan-actions {
  display: flex;
  gap: 20rpx;
}

.action-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.action-btn::after { border: none; }

.action-btn.primary {
  background: linear-gradient(135deg, #FF8C42, #FFD93D);
  color: #ffffff;
}

.action-btn.secondary {
  background: #FFF3B0;
  color: #FF8C42;
}

/* 历史记录 */
.history-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #FFE5D0;
}

.history-meal {
  padding: 6rpx 16rpx;
  background: #FFE5D0;
  border-radius: 12rpx;
  font-size: 22rpx;
  color: #FF8C42;
}

.history-foods {
  flex: 1;
  font-size: 26rpx;
  color: #5C4033;
}

.history-cal {
  font-size: 24rpx;
  color: #FF8C42;
}

/* 加载动画 */
.btn-loader {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.bl-dot {
  width: 12rpx;
  height: 12rpx;
  background: #FFFFFF;
  border-radius: 50%;
  animation: btnLoader 1.4s ease-in-out infinite;
}

.bl-dot:nth-child(2) { animation-delay: 0.2s; }
.bl-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes btnLoader {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}
</style>