<template>
  <view class="container">
    <!-- 浮动小鸡 -->
    <view class="floating-chicken" @click="chickenSay">
      <view class="chicken-bubble" v-if="showBubble">{{ chickenMsg }}</view>
      <view class="chicken-mini">
        <view class="c-body"></view>
        <view class="c-eye left"></view>
        <view class="c-eye right"></view>
        <view class="c-beak"></view>
        <view class="c-wing left"></view>
        <view class="c-wing right"></view>
      </view>
    </view>

    <!-- 顶部用户信息区域 -->
    <view class="user-section card-animate card-animate-1">
      <view class="user-info" @click="goToProfile">
        <image class="avatar" :src="userAvatar" mode="aspectFill" @error="onAvatarError"></image>
        <view class="user-text">
          <text class="nickname">{{ userName }}</text>
          <text class="greeting">🐥 今天也要好好吃饭哦~</text>
        </view>
      </view>
      <view class="calorie-card">
        <view class="calorie-info">
          <text class="calorie-label">今日剩余热量</text>
          <text class="calorie-value">{{ remainingCalories }}</text>
          <text class="calorie-unit">kcal</text>
        </view>
        <view class="calorie-progress">
          <view class="progress-bar" :style="{ width: calorieProgress + '%' }"></view>
        </view>
        <view class="calorie-detail">
          <text>已摄入: {{ consumedCalories }} kcal</text>
          <text>目标: {{ targetCalories }} kcal</text>
        </view>
      </view>
    </view>

    <!-- 功能导航区域 — 4×2 网格，8 个模块 -->
    <view class="nav-section card-animate card-animate-2">
      <view class="nav-grid">
        <!-- 第一行 -->
        <view class="nav-item" @click="goToCamera">
          <view class="nav-icon camera-icon">
            <text class="icon-emoji">📸</text>
          </view>
          <text class="nav-name">拍照识别</text>
          <text class="nav-desc">AI识别食物热量</text>
        </view>

        <view class="nav-item" @click="goToDiet">
          <view class="nav-icon diet-icon">
            <text class="icon-emoji">📝</text>
          </view>
          <text class="nav-name">饮食记录</text>
          <text class="nav-desc">查看每日饮食</text>
        </view>

        <view class="nav-item" @click="goToDashboard">
          <view class="nav-icon dashboard-icon">
            <text class="icon-emoji">📊</text>
          </view>
          <text class="nav-name">数据看板</text>
          <text class="nav-desc">营养分析统计</text>
        </view>

        <view class="nav-item" @click="goToPlan">
          <view class="nav-icon plan-icon">
            <text class="icon-emoji">📋</text>
          </view>
          <text class="nav-name">饮食规划</text>
          <text class="nav-desc">个性化建议</text>
        </view>

        <!-- 第二行 -->
        <view class="nav-item" @click="goToExercise">
          <view class="nav-icon exercise-icon">
            <text class="icon-emoji">🏃</text>
          </view>
          <text class="nav-name">运动规划</text>
          <text class="nav-desc">AI定制运动方案</text>
        </view>

        <view class="nav-item highlight" @click="goToHealthReport">
          <view class="nav-icon health-icon">
            <text class="icon-emoji">🩺</text>
          </view>
          <text class="nav-name">体检报告</text>
          <text class="nav-desc">AI解读指标</text>
          <view class="new-badge">NEW</view>
        </view>

        <view class="nav-item" @click="goToWeight">
          <view class="nav-icon weight-icon">
            <text class="icon-emoji">⚖️</text>
          </view>
          <text class="nav-name">体重记录</text>
          <text class="nav-desc">追踪体重变化</text>
        </view>

        <view class="nav-item" @click="goToProfile">
          <view class="nav-icon profile-icon">
            <text class="icon-emoji">👤</text>
          </view>
          <text class="nav-name">个人中心</text>
          <text class="nav-desc">档案与设置</text>
        </view>
      </view>
    </view>

    <!-- 今日推荐区域 -->
    <view class="recommend-section card-animate card-animate-3">
      <view class="section-title">
        <text class="title-text">🤖 今日推荐</text>
        <text class="more" @click="goToPlan">查看更多 ></text>
      </view>

      <swiper class="recommend-swiper" indicator-dots circular autoplay interval="4000">
        <swiper-item v-for="(item, idx) in recommendCards" :key="idx">
          <view class="recommend-card" :class="item.type">
            <view class="card-header">
              <text class="card-icon">{{ item.icon }}</text>
              <text class="card-title">{{ item.title }}</text>
            </view>
            <text class="card-content">{{ item.content }}</text>
            <view class="card-footer">
              <text class="card-tag">{{ item.tag }}</text>
              <text class="card-action" @click="handleRecommendAction(item.action, item.foodName)">去看看 ></text>
            </view>
          </view>
        </swiper-item>
      </swiper>
    </view>

    <!-- 快捷记录区域 -->
    <view class="quick-section card-animate card-animate-4">
      <view class="section-title">
        <text class="title-text">⚡ 快捷记录</text>
      </view>
      <view class="quick-buttons">
        <button class="quick-btn" @click="quickAddMeal('breakfast')">🍳 早餐</button>
        <button class="quick-btn" @click="quickAddMeal('lunch')">🍱 午餐</button>
        <button class="quick-btn" @click="quickAddMeal('dinner')">🍲 晚餐</button>
        <button class="quick-btn" @click="quickAddMeal('snack')">🍎 加餐</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import request from '../../utils/request'
import { API } from '../../config'

// 用户信息
const userName = ref('')
const userAvatar = ref('/static/default-avatar.png')
const userId = ref(null)

// 浮动小鸡
const showBubble = ref(false)
const chickenMsg = ref('叽叽！记得记录饮食哦~')
const chickenMessages = [
  '叽叽！今天也要好好吃饭~',
  '拍照识别超好用！',
  '坚持记录，健康每一天！',
  '你是最棒的！加油！',
  '记得多喝水哦~',
  '合理饮食，快乐生活！',
  '体检报告可以AI解读啦！',
  '上传体检报告，小唧帮你分析~'
]
const chickenSay = () => {
  const idx = Math.floor(Math.random() * chickenMessages.length)
  chickenMsg.value = chickenMessages[idx]
  showBubble.value = true
  setTimeout(() => { showBubble.value = false }, 2500)
}

// 热量数据
const targetCalories = ref(2000)
const consumedCalories = ref(0)
const remainingCalories = ref(2000)
const calorieProgress = ref(0)

// 推荐卡片数据
const recommendCards = ref([])

// 获取当前季节
const getCurrentSeason = () => {
  const month = new Date().getMonth() + 1
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}

const getSeasonName = () => {
  const season = getCurrentSeason()
  const names = { spring: '🌱 春季', summer: '☀️ 夏季', autumn: '🍂 秋季', winter: '❄️ 冬季' }
  return names[season]
}

const getSeasonalFoods = () => {
  const season = getCurrentSeason()
  const foods = {
    spring: [
      { name: '春笋', benefit: '清热解毒', calories: 25, image: '🎋' },
      { name: '草莓', benefit: '维C丰富', calories: 32, image: '🍓' },
      { name: '菠菜', benefit: '补铁养血', calories: 23, image: '🥬' },
      { name: '韭菜', benefit: '温阳补肾', calories: 26, image: '🌿' },
      { name: '豌豆', benefit: '高蛋白', calories: 105, image: '🟢' }
    ],
    summer: [
      { name: '西瓜', benefit: '解暑降温', calories: 30, image: '🍉' },
      { name: '黄瓜', benefit: '清热利水', calories: 15, image: '🥒' },
      { name: '苦瓜', benefit: '降火解毒', calories: 19, image: '🥗' },
      { name: '番茄', benefit: '美白防晒', calories: 20, image: '🍅' },
      { name: '桃子', benefit: '补气养血', calories: 42, image: '🍑' }
    ],
    autumn: [
      { name: '梨', benefit: '润肺止咳', calories: 44, image: '🍐' },
      { name: '南瓜', benefit: '养胃健脾', calories: 26, image: '🎃' },
      { name: '莲藕', benefit: '清热生津', calories: 74, image: '🪷' },
      { name: '柿子', benefit: '润肠通便', calories: 74, image: '🍊' },
      { name: '山药', benefit: '健脾益胃', calories: 57, image: '🥔' }
    ],
    winter: [
      { name: '白萝卜', benefit: '消食化痰', calories: 18, image: '🥕' },
      { name: '白菜', benefit: '养胃生津', calories: 17, image: '🥬' },
      { name: '羊肉', benefit: '温补驱寒', calories: 203, image: '🍖' },
      { name: '橙子', benefit: '维C增强免疫', calories: 47, image: '🍊' },
      { name: '红枣', benefit: '补气养血', calories: 276, image: '🔴' }
    ]
  }
  return foods[season]
}

const getSeasonalAdvice = () => {
  const season = getCurrentSeason()
  const advices = {
    spring: '春季是养肝的好时节，多吃绿色蔬菜，少吃油腻食物。',
    summer: '夏季炎热，多补充水分，多吃瓜果蔬菜，少吃辛辣。',
    autumn: '秋季干燥，注意润肺，多吃梨、百合等滋润食物。',
    winter: '冬季寒冷，适当进补，多吃温热食物，注意保暖。'
  }
  return advices[season]
}

const generateRecommendations = async () => {
  try {
    const newCards = []

    // 1. 时令推荐卡片
    const seasonalFoods = getSeasonalFoods()
    const randomFood = seasonalFoods[Math.floor(Math.random() * seasonalFoods.length)]
    newCards.push({
      icon: randomFood.image,
      title: `${getSeasonName()}时令推荐`,
      content: `${randomFood.name} · ${randomFood.benefit} · ${randomFood.calories}kcal/100g`,
      tag: '当季食材',
      type: 'seasonal',
      action: 'camera',
      foodName: randomFood.name
    })

    // 2. 饮食建议卡片
    let dietAdvice = ''
    let dietTag = ''
    if (consumedCalories.value === 0) {
      dietAdvice = '今天还没有饮食记录，快去拍照识别记录你的餐食吧！'
      dietTag = '待记录'
    } else if (remainingCalories.value < 0) {
      dietAdvice = `今日热量已超标 ${Math.abs(remainingCalories.value)} kcal，建议增加运动消耗`
      dietTag = '热量超标'
    } else if (remainingCalories.value < 300) {
      dietAdvice = `今日还剩 ${remainingCalories.value} kcal，建议吃点水果或酸奶`
      dietTag = '热量提醒'
    } else {
      dietAdvice = `今日还有 ${remainingCalories.value} kcal 预算，试试吃些时令食材吧`
      dietTag = '营养分析'
    }
    newCards.push({
      icon: '🍽️',
      title: '饮食建议',
      content: dietAdvice,
      tag: dietTag,
      type: consumedCalories.value === 0 ? 'warning' : (remainingCalories.value < 0 ? 'warning' : 'nutrition'),
      action: 'diet'
    })

    // 3. 体检报告引导卡片
    newCards.push({
      icon: '🩺',
      title: 'AI体检报告解读',
      content: '上传体检报告，小唧帮你智能分析指标，给出饮食和运动改善建议！',
      tag: '新功能',
      type: 'health',
      action: 'health'
    })

    // 4. 季节养生建议卡片
    newCards.push({
      icon: getCurrentSeason() === 'spring' ? '🌸' :
            getCurrentSeason() === 'summer' ? '☀️' :
            getCurrentSeason() === 'autumn' ? '🍂' : '❄️',
      title: `${getSeasonName()}养生`,
      content: getSeasonalAdvice(),
      tag: '养生知识',
      type: 'habit',
      action: 'plan'
    })

    recommendCards.value = newCards
  } catch (err) {
    console.error('生成推荐失败', err)
    recommendCards.value = [{
      icon: '🍽️',
      title: '饮食建议',
      content: '午餐蛋白质摄入不足，建议增加鸡胸肉或鱼肉',
      tag: '营养分析',
      type: 'nutrition',
      action: 'diet'
    }]
  }
}

const handleRecommendAction = (action, foodName = '') => {
  if (action === 'diet') {
    goToDiet()
  } else if (action === 'weight') {
    goToWeight()
  } else if (action === 'dashboard') {
    goToDashboard()
  } else if (action === 'camera') {
    uni.navigateTo({
      url: `/pages/camera/camera?searchFood=${encodeURIComponent(foodName)}`
    })
  } else if (action === 'plan') {
    goToPlan()
  } else if (action === 'health') {
    goToHealthReport()
  }
}

const onAvatarError = () => {
  userAvatar.value = '/static/default-avatar.png'
}

const getUserInfo = () => {
  const userInfo = uni.getStorageSync('userInfo')
  if (userInfo) {
    userName.value = userInfo.nickname || '健康达人'
    let avatar = userInfo.avatar || userInfo.avatarUrl
    if (avatar && avatar.startsWith('http://')) {
      avatar = avatar.replace('http://', 'https://')
    }
    if (avatar && (avatar.startsWith('http') || avatar.startsWith('/static/') || avatar.startsWith('cloud://'))) {
      userAvatar.value = avatar
    } else {
      userAvatar.value = '/static/default-avatar.png'
    }
  }
  const profile = uni.getStorageSync('userProfile')
  if (profile && profile.nickname) {
    userName.value = profile.nickname
  }
  if (profile && profile.avatarUrl && userAvatar.value === '/static/default-avatar.png') {
    const profileAvatar = profile.avatarUrl
    if (profileAvatar.startsWith('http') || profileAvatar.startsWith('/static/') || profileAvatar.startsWith('cloud://')) {
      userAvatar.value = profileAvatar
    }
  }
}

const loadCalorieGoal = async () => {
  try {
    const url = API.USER_CALORIE_GOAL.replace('{userId}', userId.value)
    const res = await request({ url, method: 'GET' })
    if (res.code === 200 && res.data) {
      targetCalories.value = res.data
      updateCalorieDisplay()
    }
  } catch (err) {
    console.error('获取热量目标失败', err)
    const profile = uni.getStorageSync('userProfile')
    if (profile && profile.height && profile.weight) {
      const bmr = 10 * parseFloat(profile.weight) + 6.25 * parseFloat(profile.height) - 5 * (parseInt(profile.age) || 25)
      const baseCalories = profile.gender === 1 ? bmr + 5 : bmr - 161
      let target = Math.round(baseCalories * 1.2)
      if (profile.goalType === 1) target = Math.round(target * 0.8)
      if (profile.goalType === 2) target = Math.round(target * 1.1)
      targetCalories.value = target
      updateCalorieDisplay()
    }
  }
}

const loadTodayCalories = async () => {
  try {
    const res = await request({
      url: API.DIET_TODAY,
      method: 'GET',
      data: { userId: userId.value }
    })
    if (res.code === 200) {
      consumedCalories.value = res.data || 0
      updateCalorieDisplay()
    }
  } catch (err) {
    console.error('获取今日热量失败', err)
    const today = new Date().toDateString()
    const savedIntake = uni.getStorageSync(`intake_${today}`)
    if (savedIntake) {
      consumedCalories.value = savedIntake
      updateCalorieDisplay()
    }
  }
}

const updateCalorieDisplay = () => {
  remainingCalories.value = Math.max(0, targetCalories.value - consumedCalories.value)
  calorieProgress.value = Math.min(100, (consumedCalories.value / targetCalories.value) * 100)
}

const refreshData = () => {
  if (userId.value) {
    loadTodayCalories()
    loadCalorieGoal()
    generateRecommendations()
  }
}

// ========== 导航函数（8个模块） ==========
const goToCamera = () => {
  uni.navigateTo({ url: '/pages/camera/camera' })
}

const goToDiet = () => {
  uni.navigateTo({ url: '/pages/diet/diet' })
}

const goToDashboard = () => {
  uni.navigateTo({ url: '/pages/dashboard/dashboard' })
}

const goToPlan = () => {
  uni.navigateTo({ url: '/pages/plan/plan' })
}

const goToExercise = () => {
  uni.navigateTo({ url: '/pages/exercise/index' })
}

const goToHealthReport = () => {
  uni.navigateTo({ url: '/pages/health/report-list' })
}

const goToWeight = () => {
  uni.navigateTo({ url: '/pages/weight/weight' })
}

const goToProfile = () => {
  uni.navigateTo({ url: '/pages/profile/profile' })
}

const quickAddMeal = (mealType) => {
  const mealTypeMap = {
    'breakfast': 1,
    'lunch': 2,
    'dinner': 3,
    'snack': 4
  }
  uni.navigateTo({
    url: `/pages/camera/camera?mealType=${mealTypeMap[mealType]}`
  })
}

onMounted(() => {
  const token = uni.getStorageSync('token')
  const userIdStorage = uni.getStorageSync('userId')

  if (!token || !userIdStorage) {
    uni.reLaunch({ url: '/pages/login/login' })
    return
  }

  userId.value = userIdStorage
  getUserInfo()

  if (userId.value) {
    loadCalorieGoal()
    loadTodayCalories()
    generateRecommendations()
  } else {
    const profile = uni.getStorageSync('userProfile')
    if (profile) {
      userName.value = profile.nickname || '健康达人'
      if (profile.avatarUrl) {
        userAvatar.value = profile.avatarUrl
      }
      if (profile.height && profile.weight) {
        const bmr = 10 * parseFloat(profile.weight) + 6.25 * parseFloat(profile.height) - 5 * (parseInt(profile.age) || 25)
        const baseCalories = profile.gender === 1 ? bmr + 5 : bmr - 161
        let target = Math.round(baseCalories * 1.2)
        if (profile.goalType === 1) target = Math.round(target * 0.8)
        if (profile.goalType === 2) target = Math.round(target * 1.1)
        targetCalories.value = target
      }
      const today = new Date().toDateString()
      const savedIntake = uni.getStorageSync(`intake_${today}`)
      if (savedIntake) {
        consumedCalories.value = savedIntake
        updateCalorieDisplay()
      }
    }
    generateRecommendations()
  }

  uni.$on('refreshHome', refreshData)
})

onUnmounted(() => {
  uni.$off('refreshHome', refreshData)
})
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #FFF8F0;
  padding-bottom: 30rpx;
}

/* ========== 用户信息区域 ========== */
.user-section {
  background: linear-gradient(135deg, #FF8C42 0%, #FFD93D 100%);
  padding: 40rpx 30rpx 60rpx;
  border-radius: 0 0 40rpx 40rpx;
}

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 40rpx;
}

.avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255, 255, 255, 0.5);
  margin-right: 20rpx;
}

.user-text {
  flex: 1;
}

.nickname {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 8rpx;
}

.greeting {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

/* ========== 热量卡片 ========== */
.calorie-card {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 8rpx 24rpx rgba(255, 140, 66, 0.15);
}

.calorie-info {
  text-align: center;
  margin-bottom: 20rpx;
}

.calorie-label {
  display: block;
  font-size: 24rpx;
  color: #B8956A;
  margin-bottom: 10rpx;
}

.calorie-value {
  font-size: 64rpx;
  font-weight: bold;
  color: #FF8C42;
}

.calorie-unit {
  font-size: 28rpx;
  color: #B8956A;
  margin-left: 8rpx;
}

.calorie-progress {
  width: 100%;
  height: 16rpx;
  background-color: #FFE5D0;
  border-radius: 8rpx;
  overflow: hidden;
  margin-bottom: 15rpx;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #FF8C42, #FFD93D);
  border-radius: 8rpx;
  transition: width 0.3s;
}

.calorie-detail {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
  color: #8B6914;
}

/* ========== 功能导航区域 — 4列网格 ========== */
.nav-section {
  padding: 40rpx 30rpx 20rpx;
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20rpx;
}

.nav-item {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 24rpx 8rpx 18rpx;
  text-align: center;
  box-shadow: 0 4rpx 16rpx rgba(255, 140, 66, 0.08);
  transition: transform 0.2s;
  position: relative;
}

.nav-item:active {
  transform: scale(0.96);
}

/* 体检报告卡片高亮样式 */
.nav-item.highlight {
  background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
  border: 2rpx solid rgba(76, 175, 80, 0.3);
  box-shadow: 0 4rpx 20rpx rgba(76, 175, 80, 0.15);
}

.new-badge {
  position: absolute;
  top: -6rpx;
  right: -6rpx;
  background: linear-gradient(135deg, #f44336, #FF5722);
  color: #fff;
  font-size: 18rpx;
  font-weight: bold;
  padding: 2rpx 12rpx;
  border-radius: 16rpx;
  animation: badgePulse 2s ease-in-out infinite;
}

@keyframes badgePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.nav-icon {
  width: 72rpx;
  height: 72rpx;
  margin: 0 auto 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 36rpx;
}

.icon-emoji {
  font-size: 42rpx;
}

.camera-icon { background-color: #FFF3B0; }
.diet-icon { background-color: #FFE5D0; }
.dashboard-icon { background-color: #E8F5E9; }
.plan-icon { background-color: #FFF3E0; }
.exercise-icon { background-color: #E3F2FD; }
.health-icon { background-color: #E8F5E9; }
.weight-icon { background-color: #FCE4EC; }
.profile-icon { background-color: #F3E5F5; }

.nav-name {
  display: block;
  font-size: 24rpx;
  font-weight: 600;
  color: #5C4033;
  margin-bottom: 4rpx;
  white-space: nowrap;
}

.nav-desc {
  display: block;
  font-size: 18rpx;
  color: #B8956A;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ========== 推荐区域 ========== */
.recommend-section {
  padding: 0 30rpx 30rpx;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 20rpx;
}

.title-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #5C4033;
}

.more {
  font-size: 24rpx;
  color: #FF8C42;
}

.recommend-swiper {
  height: 220rpx;
  border-radius: 20rpx;
}

.recommend-card {
  border-radius: 20rpx;
  padding: 25rpx;
  height: 100%;
  box-sizing: border-box;
}

.recommend-card.nutrition {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border-left: 8rpx solid #4caf50;
}

.recommend-card.seasonal {
  background: linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%);
  border-left: 8rpx solid #e91e63;
}

.recommend-card.weight {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdef5 100%);
  border-left: 8rpx solid #2196f3;
}

.recommend-card.habit {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  border-left: 8rpx solid #ff9800;
}

.recommend-card.warning {
  background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
  border-left: 8rpx solid #f44336;
}

/* 体检报告推荐卡片 */
.recommend-card.health {
  background: linear-gradient(135deg, #e8f5e9 0%, #dcedc8 100%);
  border-left: 8rpx solid #4CAF50;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 15rpx;
  margin-bottom: 12rpx;
}

.card-icon {
  font-size: 36rpx;
}

.card-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.card-content {
  font-size: 26rpx;
  color: #555;
  line-height: 1.4;
  display: block;
  margin-bottom: 12rpx;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-tag {
  font-size: 22rpx;
  color: #999;
  background-color: rgba(0, 0, 0, 0.05);
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.card-action {
  font-size: 24rpx;
  color: #FF8C42;
}

/* ========== 快捷记录区域 ========== */
.quick-section {
  padding: 0 30rpx;
}

.quick-buttons {
  display: flex;
  gap: 20rpx;
}

.quick-btn {
  flex: 1;
  background-color: #ffffff;
  border-radius: 44rpx;
  height: 80rpx;
  line-height: 80rpx;
  font-size: 26rpx;
  color: #FF8C42;
  border: 2rpx solid #FFE5D0;
}

.quick-btn::after {
  border: none;
}

/* ========== 浮动小鸡 ========== */
.floating-chicken {
  position: fixed;
  bottom: 120rpx;
  right: 30rpx;
  z-index: 999;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: chickenFloat 3s ease-in-out infinite;
}

@keyframes chickenFloat {
  0%, 100% { transform: translateY(0) rotate(-3deg); }
  50% { transform: translateY(-20rpx) rotate(3deg); }
}

.chicken-bubble {
  background: linear-gradient(135deg, #FFF8F0 0%, #FFE5D0 100%);
  border: 2rpx solid rgba(255, 140, 66, 0.2);
  border-radius: 24rpx;
  padding: 16rpx 24rpx;
  font-size: 24rpx;
  color: #8B6914;
  margin-bottom: 20rpx;
  position: relative;
  white-space: nowrap;
  box-shadow: 0 4rpx 16rpx rgba(255, 140, 66, 0.15);
  animation: fadeInScale 0.3s ease;
}

@keyframes fadeInScale {
  from { opacity: 0; transform: scale(0.8) translateY(10rpx); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.chicken-bubble::after {
  content: '';
  position: absolute;
  bottom: -16rpx;
  right: 30rpx;
  width: 0;
  height: 0;
  border-left: 12rpx solid transparent;
  border-right: 12rpx solid transparent;
  border-top: 18rpx solid #FFE5D0;
}

.chicken-mini {
  width: 90rpx;
  height: 90rpx;
  position: relative;
}

.c-body {
  width: 70rpx;
  height: 65rpx;
  background: linear-gradient(135deg, #FFD93D 0%, #FFB347 100%);
  border-radius: 50% 50% 45% 45%;
  position: absolute;
  top: 15rpx;
  left: 10rpx;
  box-shadow: 0 4rpx 12rpx rgba(255, 140, 66, 0.3);
}

.c-body::before {
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

.c-eye {
  position: absolute;
  width: 8rpx;
  height: 8rpx;
  background: #333;
  border-radius: 50%;
  top: 30rpx;
  z-index: 2;
  animation: chickenBlink 4s ease-in-out infinite;
}

@keyframes chickenBlink {
  0%, 45%, 55%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(0.1); }
}

.c-eye.left { left: 28rpx; }
.c-eye.right { right: 28rpx; }

.c-beak {
  position: absolute;
  bottom: 32rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8rpx solid transparent;
  border-right: 8rpx solid transparent;
  border-top: 12rpx solid #FF6B35;
  z-index: 2;
}

.c-wing {
  position: absolute;
  width: 18rpx;
  height: 22rpx;
  background: #FFB347;
  border-radius: 50%;
  top: 38rpx;
  z-index: 1;
}

.c-wing.left {
  left: 5rpx;
  transform: rotate(-25deg);
  animation: wingFlapLeft 2s ease-in-out infinite;
}

.c-wing.right {
  right: 5rpx;
  transform: rotate(25deg);
  animation: wingFlapRight 2s ease-in-out infinite;
}

@keyframes wingFlapLeft {
  0%, 100% { transform: rotate(-25deg); }
  50% { transform: rotate(-45deg); }
}

@keyframes wingFlapRight {
  0%, 100% { transform: rotate(25deg); }
  50% { transform: rotate(45deg); }
}
</style>
