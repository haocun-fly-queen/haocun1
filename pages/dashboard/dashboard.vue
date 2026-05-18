<template>
  <view class="container">
    <!-- ========== 骨架屏加载 ========== -->
    <view v-if="loading" class="skeleton-wrap">
      <view class="skel-header">
        <view class="skel-circle"></view>
        <view class="skel-lines">
          <view class="skel-line w60"></view>
          <view class="skel-line w40"></view>
        </view>
      </view>
      <view class="skel-card" v-for="i in 3" :key="i">
        <view class="skel-line w80"></view>
        <view class="skel-line w60"></view>
        <view class="skel-bar"></view>
      </view>
    </view>

    <!-- ========== 正式内容 ========== -->
    <view v-else class="content-wrap">

      <!-- 顶部问候 + 小鸡 -->
      <view class="dash-header">
        <view class="dh-left">
          <view class="dh-chicken">
            <view class="dc-body"></view>
            <view class="dc-eye dc-l"></view>
            <view class="dc-eye dc-r"></view>
            <view class="dc-beak"></view>
            <view class="dc-wing"></view>
          </view>
        </view>
        <view class="dh-right">
          <text class="dh-greeting">{{ greeting }}</text>
          <text class="dh-date">{{ todayStr }}</text>
        </view>
      </view>

      <!-- 异常提醒 -->
      <view v-if="alerts.length > 0" class="alert-banner"
            :class="'alert-' + alerts[0].level"
            @click="showAlertModal = true">
        <view class="alert-icon">
          <text v-if="alerts[0].level === 'danger'">⚠️</text>
          <text v-else>💡</text>
        </view>
        <view class="alert-content">
          <text class="alert-title">{{ alerts[0].title }}</text>
          <text class="alert-msg">{{ alerts[0].message }}</text>
        </view>
        <text class="alert-arrow">›</text>
      </view>

      <!-- ===== 模块1：每日摄入概览 ===== -->
      <view class="section-card intake-card animate-in">
        <view class="intake-ring-wrap">
          <view class="intake-ring">
            <view class="ir-bg"></view>
            <view class="ir-fill" :style="ringStyle"></view>
            <view class="ir-cover">
              <text class="ir-value">{{ animatedCalories }}</text>
              <text class="ir-label">剩余 kcal</text>
            </view>
          </view>
          <view class="intake-arc-labels">
            <view class="arc-label top">
              <text class="arc-num">{{ todaySummary.consumedCalories }}</text>
              <text class="arc-txt">已摄入</text>
            </view>
            <view class="arc-label bottom">
              <text class="arc-num">{{ todaySummary.targetCalories }}</text>
              <text class="arc-txt">目标</text>
            </view>
          </view>
        </view>

        <!-- 今日餐次列表 -->
        <view class="intake-meals" v-if="todaySummary.meals && todaySummary.meals.length > 0">
          <view v-for="(m, i) in todaySummary.meals" :key="i" class="im-row">
            <view class="im-badge" :class="'type-' + m.type">{{ m.typeName }}</view>
            <text class="im-foods">{{ m.foods }}</text>
            <text class="im-cal">{{ m.calories }}kcal</text>
          </view>
        </view>
        <view v-else class="intake-empty">
          <text class="ie-text">今天还没有记录哦，开始记录第一餐吧！</text>
        </view>

        <!-- 快捷记录按钮 -->
        <view class="quick-actions">
          <view class="qa-btn" @click="goTo('/pages/camera/camera')">
            <view class="qa-icon camera-icon">📷</view>
            <text class="qa-label">拍照记录</text>
          </view>
          <view class="qa-btn" @click="goTo('/pages/diet/diet')">
            <view class="qa-icon manual-icon">📝</view>
            <text class="qa-label">手动记录</text>
          </view>
          <view class="qa-btn" @click="goTo('/pages/plan/plan')">
            <view class="qa-icon ai-icon">🤖</view>
            <text class="qa-label">AI 规划</text>
          </view>
        </view>
      </view>

      <!-- ===== 模块2：营养均衡分析 ===== -->
      <view class="section-card animate-in delay-1">
        <view class="section-title">
          <text class="st-text">📊 营养均衡分析</text>
          <text class="st-sub">{{ nutritionStandard.description }}</text>
        </view>

        <!-- 今日宏量营养素饼图 -->
        <view class="macro-chart-wrap">
          <view class="macro-pie" :style="pieStyle">
            <view class="pie-inner">
              <text class="pie-label">今日</text>
              <text class="pie-cal">{{ todaySummary.consumedCalories }}</text>
              <text class="pie-unit">kcal</text>
            </view>
          </view>
          <view class="macro-legend">
            <view class="ml-item">
              <view class="ml-dot carbs"></view>
              <text class="ml-name">碳水</text>
              <text class="ml-val">{{ macros.carbs.actual }}g / {{ macros.carbs.target }}g</text>
            </view>
            <view class="ml-item">
              <view class="ml-dot protein"></view>
              <text class="ml-name">蛋白质</text>
              <text class="ml-val">{{ macros.protein.actual }}g / {{ macros.protein.target }}g</text>
            </view>
            <view class="ml-item">
              <view class="ml-dot fat"></view>
              <text class="ml-name">脂肪</text>
              <text class="ml-val">{{ macros.fat.actual }}g / {{ macros.fat.target }}g</text>
            </view>
          </view>
        </view>

        <!-- 实际 vs 推荐对比条 -->
        <view class="compare-bars">
          <view class="cb-row" v-for="(item, key) in compareItems" :key="key">
            <text class="cb-name">{{ item.name }}</text>
            <view class="cb-track">
              <view class="cb-target-bar" :style="{ width: '100%' }"></view>
              <view class="cb-actual-bar" :style="{ width: item.percent + '%', background: item.color }"></view>
            </view>
            <text class="cb-pct" :class="{ 'over': item.percent > 110 }">
              {{ Math.round(item.percent) }}%
            </text>
          </view>
        </view>
      </view>

      <!-- ===== 模块3：周期数据统计 ===== -->
      <view class="section-card animate-in delay-2">
        <view class="section-title">
          <text class="st-text">📈 数据统计</text>
        </view>

        <!-- Tab 切换 -->
        <view class="period-tabs">
          <view class="pt-btn" :class="{ active: activeTab === 'week' }" @click="activeTab = 'week'">本周</view>
          <view class="pt-btn" :class="{ active: activeTab === 'month' }" @click="activeTab = 'month'">本月</view>
        </view>

        <!-- 每日热量柱状图 -->
        <view class="bar-chart">
          <view class="bc-row" v-for="(d, i) in currentPeriod.dailyCalories" :key="i">
            <text class="bc-date">{{ d.date }}</text>
            <view class="bc-track">
              <view class="bc-target-line" :style="{ left: '100%' }"></view>
              <view class="bc-bar" :style="{
                width: barWidth(d.calories, d.target) + '%',
                background: d.calories > d.target ? '#f44336' : 'linear-gradient(90deg, #FF8C42, #FFD93D)'
              }"></view>
            </view>
            <text class="bc-val" :class="{ 'over': d.calories > d.target }">{{ d.calories }}</text>
          </view>
        </view>

        <!-- 统计指标卡片 -->
        <view class="stat-cards">
          <view class="sc-item">
            <text class="sc-num">{{ currentPeriod.avgCalories }}</text>
            <text class="sc-label">日均热量 kcal</text>
          </view>
          <view class="sc-item">
            <text class="sc-num">{{ Math.round(currentPeriod.mealRegularRate * 100) }}%</text>
            <text class="sc-label">用餐规律率</text>
          </view>
          <view class="sc-item">
            <text class="sc-num">{{ currentPeriod.calorieFluctuation }}</text>
            <text class="sc-label">热量波动值</text>
          </view>
          <view class="sc-item">
            <text class="sc-num">{{ currentPeriod.foodDiversityScore }}</text>
            <text class="sc-label">食物多样性</text>
          </view>
        </view>

        <!-- 体重趋势 -->
        <view class="weight-trend" v-if="currentPeriod.weightTrend && currentPeriod.weightTrend.length > 1">
          <text class="wt-title">⚖️ 体重变化趋势</text>
          <view class="wt-chart">
            <view class="wt-line">
              <view
                v-for="(p, i) in currentPeriod.weightTrend"
                :key="i"
                class="wt-dot"
                :style="dotStyle(p, i)"
              >
                <view class="wt-tooltip">
                  <text>{{ p.date }}</text>
                  <text>{{ p.weight }}kg</text>
                </view>
              </view>
            </view>
          </view>
          <view class="wt-range">
            <text>{{ currentPeriod.weightTrend[0].date }}</text>
            <text>{{ currentPeriod.weightTrend[currentPeriod.weightTrend.length - 1].date }}</text>
          </view>
        </view>
      </view>

      <!-- ===== 模块4：异常提醒弹窗 ===== -->
      <view class="modal-mask" v-if="showAlertModal" @click="showAlertModal = false">
        <view class="modal-box" @click.stop>
          <view class="modal-header">
            <text class="modal-title">⚠️ 异常提醒</text>
            <text class="modal-close" @click="showAlertModal = false">✕</text>
          </view>
          <scroll-view scroll-y class="modal-body">
            <view v-for="(alert, i) in alerts" :key="i" class="alert-card" :class="'ac-' + alert.level">
              <text class="ac-title">{{ alert.title }}</text>
              <text class="ac-msg">{{ alert.message }}</text>
              <view class="ac-suggestion">
                <text class="ac-sug-label">💡 建议：</text>
                <text class="ac-sug-text">{{ alert.suggestion }}</text>
              </view>
            </view>
            <view v-if="alerts.length === 0" class="no-alert">
              <text class="na-icon">🎉</text>
              <text class="na-text">太棒了！暂无异常提醒</text>
            </view>
          </scroll-view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import request from '../../utils/request'
import { API } from '../../config'

const userId = ref(null)
const loading = ref(true)
const activeTab = ref('week')
const showAlertModal = ref(false)

const todaySummary = ref({
  targetCalories: 2000,
  consumedCalories: 0,
  remainingCalories: 2000,
  progressPercent: 0,
  meals: [],
  macros: {
    carbs: { actual: 0, target: 0, unit: 'g' },
    protein: { actual: 0, target: 0, unit: 'g' },
    fat: { actual: 0, target: 0, unit: 'g' }
  }
})

const nutritionStandard = ref({
  calories: 2000, carbsPercent: 50, proteinPercent: 20, fatPercent: 30,
  carbsGram: 0, proteinGram: 0, fatGram: 0, description: ''
})

const weeklyStats = ref({
  dailyCalories: [], avgCalories: 0, mealRegularRate: 0,
  foodDiversityScore: 0, calorieFluctuation: 0, weightTrend: []
})

const monthlyStats = ref({
  dailyCalories: [], avgCalories: 0, mealRegularRate: 0,
  foodDiversityScore: 0, calorieFluctuation: 0, weightTrend: []
})

const alerts = ref([])

// 动画相关
const animatedCalories = ref(0)
const ringPercent = ref(0)

// ========== 计算属性 ==========

const todayStr = computed(() => {
  const d = new Date()
  return `${d.getMonth() + 1}月${d.getDate()}日 ${['日','一','二','三','四','五','六'][d.getDay()]}`
})

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了，早点休息 🌙'
  if (h < 11) return '早上好！记得吃早餐 ☀️'
  if (h < 14) return '中午好！午餐时间 🍚'
  if (h < 18) return '下午好！补充能量 💪'
  return '晚上好！晚餐别太晚 🌆'
})

const macros = computed(() => todaySummary.value.macros)

const ringStyle = computed(() => {
  const deg = (ringPercent.value / 100) * 360
  return {
    background: `conic-gradient(#FF8C42 ${deg}deg, #FFE5D0 ${deg}deg)`
  }
})

const pieStyle = computed(() => {
  const m = macros.value
  const total = (m.carbs.actual || 0) + (m.protein.actual || 0) + (m.fat.actual || 0)
  if (total === 0) return { background: '#FFE5D0' }
  const cPct = (m.carbs.actual / total * 100)
  const pPct = (m.protein.actual / total * 100)
  return {
    background: `conic-gradient(#FF9800 0% ${cPct}%, #4CAF50 ${cPct}% ${cPct + pPct}%, #f44336 ${cPct + pPct}% 100%)`
  }
})

const compareItems = computed(() => {
  const m = macros.value
  const items = []
  if (m.carbs.target > 0) {
    items.push({ name: '碳水', percent: m.carbs.actual / m.carbs.target * 100, color: '#FF9800' })
  }
  if (m.protein.target > 0) {
    items.push({ name: '蛋白质', percent: m.protein.actual / m.protein.target * 100, color: '#4CAF50' })
  }
  if (m.fat.target > 0) {
    items.push({ name: '脂肪', percent: m.fat.actual / m.fat.target * 100, color: '#f44336' })
  }
  return items
})

const currentPeriod = computed(() => {
  return activeTab.value === 'week' ? weeklyStats.value : monthlyStats.value
})

// ========== 方法 ==========

const barWidth = (cal, target) => {
  if (!target || target === 0) return 0
  return Math.min(100, cal / target * 100)
}

const dotStyle = (point, index) => {
  const trend = currentPeriod.value.weightTrend
  if (!trend || trend.length < 2) return {}
  const weights = trend.map(p => p.weight)
  const min = Math.min(...weights) - 1
  const max = Math.max(...weights) + 1
  const range = max - min || 1
  const left = index / (trend.length - 1) * 100
  const bottom = (point.weight - min) / range * 100
  return {
    left: left + '%',
    bottom: bottom + '%'
  }
}

const goTo = (url) => {
  uni.navigateTo({ url })
}

// 数字滚动动画
const animateNumber = (from, to, duration, callback) => {
  const start = Date.now()
  const diff = to - from
  const step = () => {
    const elapsed = Date.now() - start
    const progress = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
    callback(Math.round(from + diff * eased))
    if (progress < 1) {
      setTimeout(step, 16)
    }
  }
  step()
}

// 加载数据
const loadDashboard = async () => {
  loading.value = true
  try {
    const res = await request({
      url: API.DASHBOARD_OVERVIEW,
      method: 'GET',
      data: { userId: userId.value }
    })

    if (res.code === 200 && res.data) {
      const data = res.data
      todaySummary.value = data.todaySummary || todaySummary.value
      nutritionStandard.value = data.nutritionStandard || nutritionStandard.value
      weeklyStats.value = data.weeklyStats || weeklyStats.value
      monthlyStats.value = data.monthlyStats || monthlyStats.value
      alerts.value = data.alerts || []

      // 动画：热量数字滚动
      loading.value = false

      setTimeout(() => {
        animateNumber(0, todaySummary.value.remainingCalories, 1200, (val) => {
          animatedCalories.value = val
        })
        animateNumber(0, todaySummary.value.progressPercent, 1000, (val) => {
          ringPercent.value = val
        })
      }, 300)
    }
  } catch (err) {
    console.error('加载看板数据失败', err)
    loading.value = false
  }
}

onMounted(() => {
  userId.value = uni.getStorageSync('userId')
  if (!userId.value) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => uni.reLaunch({ url: '/pages/login/login' }), 1500)
    return
  }
  loadDashboard()
})

// 监听刷新事件
uni.$on('refreshDashboard', () => {
  loadDashboard()
})
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #FFF8F0;
  padding: 24rpx;
  padding-bottom: 120rpx;
}

/* ========== 骨架屏 ========== */
.skeleton-wrap { padding: 20rpx; }

.skel-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 30rpx;
}

.skel-circle {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0e6d6 25%, #f8efe3 50%, #f0e6d6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skel-lines { flex: 1; }

.skel-line {
  height: 24rpx;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
  background: linear-gradient(90deg, #f0e6d6 25%, #f8efe3 50%, #f0e6d6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skel-line.w60 { width: 60%; }
.skel-line.w40 { width: 40%; }
.skel-line.w80 { width: 80%; }

.skel-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
}

.skel-bar {
  height: 60rpx;
  border-radius: 12rpx;
  margin-top: 20rpx;
  background: linear-gradient(90deg, #f0e6d6 25%, #f8efe3 50%, #f0e6d6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ========== 入场动画 ========== */
.animate-in {
  opacity: 0;
  transform: translateY(40rpx);
  animation: slideUp 0.6s ease forwards;
}

.delay-1 { animation-delay: 0.15s; }
.delay-2 { animation-delay: 0.3s; }

@keyframes slideUp {
  to { opacity: 1; transform: translateY(0); }
}

/* ========== 顶部问候 ========== */
.dash-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 24rpx;
  padding: 10rpx 0;
}

.dh-left { position: relative; }

.dh-chicken {
  width: 90rpx;
  height: 90rpx;
  position: relative;
  animation: chickenBounce 3s ease-in-out infinite;
}

@keyframes chickenBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8rpx); }
}

.dc-body {
  width: 60rpx;
  height: 55rpx;
  background: linear-gradient(135deg, #FFD93D, #FFB347);
  border-radius: 50% 50% 45% 45%;
  position: absolute;
  top: 18rpx;
  left: 15rpx;
}

.dc-body::before {
  content: '';
  position: absolute;
  top: -10rpx;
  left: 50%;
  transform: translateX(-50%);
  border-left: 7rpx solid transparent;
  border-right: 7rpx solid transparent;
  border-bottom: 14rpx solid #FF6B35;
}

.dc-eye {
  position: absolute;
  width: 7rpx;
  height: 7rpx;
  background: #333;
  border-radius: 50%;
  top: 30rpx;
  z-index: 2;
}

.dc-l { left: 28rpx; }
.dc-r { right: 28rpx; }

.dc-beak {
  position: absolute;
  bottom: 28rpx;
  left: 50%;
  transform: translateX(-50%);
  border-left: 7rpx solid transparent;
  border-right: 7rpx solid transparent;
  border-top: 10rpx solid #FF6B35;
}

.dc-wing {
  position: absolute;
  right: 8rpx;
  top: 30rpx;
  width: 18rpx;
  height: 25rpx;
  background: #FFB347;
  border-radius: 0 50% 50% 0;
  transform-origin: left center;
  animation: wingFlap 2s ease-in-out infinite;
}

@keyframes wingFlap {
  0%, 100% { transform: rotate(0); }
  50% { transform: rotate(-15deg); }
}

.dh-right { flex: 1; }

.dh-greeting {
  display: block;
  font-size: 34rpx;
  font-weight: bold;
  color: #5C4033;
}

.dh-date {
  display: block;
  font-size: 24rpx;
  color: #B8956A;
  margin-top: 6rpx;
}

/* ========== 异常提醒横幅 ========== */
.alert-banner {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx;
  border-radius: 20rpx;
  margin-bottom: 24rpx;
}

.alert-danger {
  background: linear-gradient(135deg, #fff3e0, #ffe0b2);
  border: 2rpx solid #ff9800;
}

.alert-warning {
  background: linear-gradient(135deg, #fff8e1, #ffecb3);
  border: 2rpx solid #ffc107;
}

.alert-info {
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  border: 2rpx solid #2196f3;
}

.alert-icon { font-size: 36rpx; }

.alert-content { flex: 1; }

.alert-title {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #5C4033;
}

.alert-msg {
  display: block;
  font-size: 24rpx;
  color: #8B6914;
  margin-top: 6rpx;
}

.alert-arrow {
  font-size: 36rpx;
  color: #B8956A;
}

/* ========== 通用卡片 ========== */
.section-card {
  background: #ffffff;
  border-radius: 28rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 32rpx rgba(92, 64, 51, 0.06);
}

.section-title {
  margin-bottom: 28rpx;
}

.st-text {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #5C4033;
}

.st-sub {
  display: block;
  font-size: 22rpx;
  color: #B8956A;
  margin-top: 8rpx;
}

/* ========== 模块1：摄入概览 ========== */
.intake-ring-wrap {
  display: flex;
  justify-content: center;
  position: relative;
  margin-bottom: 28rpx;
  height: 300rpx;
}

.intake-ring {
  width: 280rpx;
  height: 280rpx;
  position: relative;
}

.ir-bg {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: #FFE5D0;
}

.ir-fill {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  transition: background 0.8s ease;
}

.ir-cover {
  position: absolute;
  inset: 20rpx;
  border-radius: 50%;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ir-value {
  font-size: 56rpx;
  font-weight: bold;
  color: #FF8C42;
}

.ir-label {
  font-size: 22rpx;
  color: #B8956A;
  margin-top: 4rpx;
}

.intake-arc-labels {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.arc-label {
  position: absolute;
  text-align: center;
}

.arc-label.top {
  top: 30rpx;
  right: 0;
}

.arc-label.bottom {
  bottom: 30rpx;
  left: 0;
}

.arc-num {
  display: block;
  font-size: 30rpx;
  font-weight: bold;
  color: #5C4033;
}

.arc-txt {
  font-size: 20rpx;
  color: #B8956A;
}

/* 餐次列表 */
.intake-meals { margin-bottom: 24rpx; }

.im-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #FFF3E8;
}

.im-row:last-child { border-bottom: none; }

.im-badge {
  padding: 6rpx 18rpx;
  border-radius: 16rpx;
  font-size: 22rpx;
  color: #fff;
  white-space: nowrap;
}

.im-badge.type-1 { background: linear-gradient(135deg, #FF8C42, #FFD93D); }
.im-badge.type-2 { background: linear-gradient(135deg, #4caf50, #8bc34a); }
.im-badge.type-3 { background: linear-gradient(135deg, #2196f3, #64b5f6); }
.im-badge.type-4 { background: linear-gradient(135deg, #9c27b0, #ce93d8); }

.im-foods {
  flex: 1;
  font-size: 26rpx;
  color: #5C4033;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.im-cal {
  font-size: 26rpx;
  font-weight: 600;
  color: #FF8C42;
  white-space: nowrap;
}

.intake-empty {
  text-align: center;
  padding: 30rpx 0;
}

.ie-text {
  font-size: 26rpx;
  color: #B8956A;
}

/* 快捷操作 */
.quick-actions {
  display: flex;
  justify-content: space-around;
  padding-top: 20rpx;
  border-top: 1rpx solid #FFF3E8;
}

.qa-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  padding: 16rpx 24rpx;
  border-radius: 20rpx;
  transition: transform 0.2s ease;
}

.qa-btn:active { transform: scale(0.92); }

.qa-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}

.camera-icon { background: linear-gradient(135deg, #FF8C42, #FFD93D); }
.manual-icon { background: linear-gradient(135deg, #4caf50, #8bc34a); }
.ai-icon { background: linear-gradient(135deg, #2196f3, #64b5f6); }

.qa-label {
  font-size: 22rpx;
  color: #5C4033;
}

/* ========== 模块2：营养分析 ========== */
.macro-chart-wrap {
  display: flex;
  align-items: center;
  gap: 36rpx;
  margin-bottom: 28rpx;
}

.macro-pie {
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.8s ease;
}

.pie-inner {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.pie-label { font-size: 20rpx; color: #B8956A; }
.pie-cal { font-size: 32rpx; font-weight: bold; color: #FF8C42; }
.pie-unit { font-size: 18rpx; color: #B8956A; }

.macro-legend { flex: 1; }

.ml-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.ml-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
}

.ml-dot.carbs { background: #FF9800; }
.ml-dot.protein { background: #4CAF50; }
.ml-dot.fat { background: #f44336; }

.ml-name {
  font-size: 24rpx;
  color: #5C4033;
  width: 80rpx;
}

.ml-val {
  font-size: 22rpx;
  color: #B8956A;
}

/* 对比条 */
.compare-bars { margin-top: 10rpx; }

.cb-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 18rpx;
}

.cb-name {
  font-size: 24rpx;
  color: #5C4033;
  width: 80rpx;
}

.cb-track {
  flex: 1;
  height: 20rpx;
  border-radius: 10rpx;
  background: #FFE5D0;
  position: relative;
  overflow: hidden;
}

.cb-target-bar {
  position: absolute;
  inset: 0;
  background: #FFE5D0;
}

.cb-actual-bar {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  border-radius: 10rpx;
  transition: width 1s ease;
  max-width: 100%;
}

.cb-pct {
  font-size: 24rpx;
  font-weight: 600;
  color: #5C4033;
  width: 80rpx;
  text-align: right;
}

.cb-pct.over { color: #f44336; }

/* ========== 模块3：周期统计 ========== */
.period-tabs {
  display: flex;
  gap: 0;
  background: #FFF3E8;
  border-radius: 20rpx;
  padding: 6rpx;
  margin-bottom: 28rpx;
}

.pt-btn {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #B8956A;
  transition: all 0.3s ease;
}

.pt-btn.active {
  background: #ffffff;
  color: #FF8C42;
  font-weight: 600;
  box-shadow: 0 4rpx 12rpx rgba(255, 140, 66, 0.15);
}

/* 柱状图 */
.bar-chart { margin-bottom: 28rpx; }

.bc-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 14rpx;
}

.bc-date {
  font-size: 20rpx;
  color: #B8956A;
  width: 70rpx;
  text-align: right;
}

.bc-track {
  flex: 1;
  height: 24rpx;
  border-radius: 12rpx;
  background: #FFF3E8;
  position: relative;
  overflow: hidden;
}

.bc-target-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 3rpx;
  background: #FF8C42;
  opacity: 0.4;
  z-index: 1;
}

.bc-bar {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  border-radius: 12rpx;
  transition: width 0.8s ease;
  animation: barGrow 0.8s ease forwards;
}

@keyframes barGrow {
  from { width: 0 !important; }
}

.bc-val {
  font-size: 22rpx;
  font-weight: 600;
  color: #5C4033;
  width: 80rpx;
}

.bc-val.over { color: #f44336; }

/* 统计卡片 */
.stat-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 28rpx;
}

.sc-item {
  flex: 1;
  min-width: 40%;
  background: #FFF8F0;
  border-radius: 20rpx;
  padding: 24rpx;
  text-align: center;
}

.sc-num {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  color: #FF8C42;
}

.sc-label {
  display: block;
  font-size: 22rpx;
  color: #B8956A;
  margin-top: 8rpx;
}

/* 体重趋势 */
.weight-trend { margin-top: 10rpx; }

.wt-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #5C4033;
  margin-bottom: 20rpx;
}

.wt-chart {
  height: 200rpx;
  position: relative;
  margin: 0 20rpx;
}

.wt-line {
  position: relative;
  width: 100%;
  height: 100%;
}

.wt-dot {
  position: absolute;
  width: 16rpx;
  height: 16rpx;
  background: #FF8C42;
  border: 3rpx solid #fff;
  border-radius: 50%;
  transform: translate(-50%, 50%);
  z-index: 2;
}

.wt-dot:hover .wt-tooltip {
  display: flex;
}

.wt-tooltip {
  display: none;
  position: absolute;
  bottom: 28rpx;
  left: 50%;
  transform: translateX(-50%);
  background: #5C4033;
  color: #fff;
  padding: 8rpx 16rpx;
  border-radius: 12rpx;
  font-size: 20rpx;
  white-space: nowrap;
  flex-direction: column;
  align-items: center;
}

.wt-range {
  display: flex;
  justify-content: space-between;
  padding: 10rpx 20rpx 0;
}

.wt-range text {
  font-size: 20rpx;
  color: #B8956A;
}

/* ========== 模块4：弹窗 ========== */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
}

.modal-box {
  width: 85%;
  max-height: 70vh;
  background: #fff;
  border-radius: 28rpx;
  overflow: hidden;
  animation: modalSlide 0.3s ease;
}

@keyframes modalSlide {
  from { transform: translateY(40rpx); opacity: 0; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid #FFE5D0;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #5C4033;
}

.modal-close {
  font-size: 36rpx;
  color: #B8956A;
  padding: 10rpx;
}

.modal-body {
  padding: 24rpx 32rpx;
  max-height: 55vh;
}

.alert-card {
  padding: 24rpx;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
}

.ac-danger { background: #fff3e0; border-left: 8rpx solid #f44336; }
.ac-warning { background: #fff8e1; border-left: 8rpx solid #ff9800; }
.ac-info { background: #e3f2fd; border-left: 8rpx solid #2196f3; }

.ac-title {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #5C4033;
  margin-bottom: 10rpx;
}

.ac-msg {
  display: block;
  font-size: 26rpx;
  color: #8B6914;
  margin-bottom: 16rpx;
}

.ac-suggestion {
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12rpx;
  padding: 16rpx;
}

.ac-sug-label {
  font-size: 24rpx;
  font-weight: 600;
  color: #5C4033;
}

.ac-sug-text {
  font-size: 24rpx;
  color: #8B6914;
}

.no-alert {
  text-align: center;
  padding: 60rpx 0;
}

.na-icon {
  display: block;
  font-size: 60rpx;
  margin-bottom: 16rpx;
}

.na-text {
  font-size: 28rpx;
  color: #B8956A;
}
</style>
