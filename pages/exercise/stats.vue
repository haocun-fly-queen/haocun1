<template>
  <view class="container">
    <!-- Tab切换 -->
    <view class="tab-bar">
      <view class="tab-btn" :class="{ active: activeTab === 'week' }" @click="switchTab('week')">本周</view>
      <view class="tab-btn" :class="{ active: activeTab === 'month' }" @click="switchTab('month')">本月</view>
    </view>

    <!-- 运动消耗柱状图 -->
    <view class="section-card card animate-in">
      <view class="section-title">
        <text class="st-text">🔥 运动消耗</text>
      </view>
      <view class="bar-chart">
        <view class="bc-row" v-for="(d, i) in stats.dailyExercises" :key="i">
          <text class="bc-date">{{ d.date }}</text>
          <view class="bc-track">
            <view class="bc-target-line" :style="{ left: '100%' }"></view>
            <view class="bc-bar" :style="{
              width: barWidth(d.calories, d.target) + '%',
              background: d.calories >= d.target ? 'linear-gradient(90deg, #4caf50, #8bc34a)' : 'linear-gradient(90deg, #FF8C42, #FFD93D)'
            }"></view>
          </view>
          <text class="bc-val" :class="{ reached: d.calories >= d.target }">{{ d.calories }}</text>
        </view>
      </view>
    </view>

    <!-- 统计指标卡片 -->
    <view class="section-card card animate-in delay-1">
      <view class="section-title">
        <text class="st-text">📈 数据概览</text>
      </view>
      <view class="stat-cards">
        <view class="sc-item">
          <text class="sc-num">{{ stats.totalDays }}</text>
          <text class="sc-label">运动天数</text>
        </view>
        <view class="sc-item">
          <text class="sc-num">{{ stats.totalCalories }}</text>
          <text class="sc-label">总消耗 kcal</text>
        </view>
        <view class="sc-item">
          <text class="sc-num">{{ stats.avgDuration }}</text>
          <text class="sc-label">日均时长 min</text>
        </view>
        <view class="sc-item">
          <text class="sc-num">{{ stats.exerciseTypeCount }}</text>
          <text class="sc-label">运动类型</text>
        </view>
      </view>
    </view>

    <!-- 摄入 vs 消耗 -->
    <view class="section-card card animate-in delay-2">
      <view class="section-title">
        <text class="st-text">📊 摄入 vs 消耗</text>
        <text class="st-sub">热量平衡分析</text>
      </view>
      <view class="ivb-chart">
        <view class="ivb-row" v-for="(d, i) in stats.intakeVsBurn" :key="i">
          <text class="ivb-date">{{ d.date }}</text>
          <view class="ivb-bars">
            <view class="ivb-bar-row">
              <view class="ivb-bar intake" :style="{ width: intakeBarWidth(d.intake) + '%' }"></view>
            </view>
            <view class="ivb-bar-row">
              <view class="ivb-bar burn" :style="{ width: burnBarWidth(d.burn) + '%' }"></view>
            </view>
          </view>
          <text class="ivb-net" :class="{ surplus: d.net > 0, deficit: d.net < 0 }">
            {{ d.net > 0 ? '+' : '' }}{{ d.net }}
          </text>
        </view>
      </view>
      <view class="ivb-legend">
        <view class="ivb-legend-item">
          <view class="ivb-legend-dot intake-dot"></view>
          <text class="ivb-legend-text">饮食摄入</text>
        </view>
        <view class="ivb-legend-item">
          <view class="ivb-legend-dot burn-dot"></view>
          <text class="ivb-legend-text">运动消耗</text>
        </view>
        <view class="ivb-legend-item">
          <text class="ivb-legend-text" style="color: #4caf50;">绿色=赤字</text>
        </view>
        <view class="ivb-legend-item">
          <text class="ivb-legend-text" style="color: #f44336;">红色=盈余</text>
        </view>
      </view>
    </view>

    <!-- 运动类型分布 -->
    <view class="section-card card animate-in delay-3" v-if="stats.categoryRatios && stats.categoryRatios.length > 0">
      <view class="section-title">
        <text class="st-text">🏃 运动类型分布</text>
      </view>
      <view class="category-chart">
        <view class="cc-pie" :style="pieStyle">
          <view class="cc-pie-inner">
            <text class="cc-pie-label">总计</text>
            <text class="cc-pie-num">{{ stats.totalDays }}</text>
            <text class="cc-pie-unit">天</text>
          </view>
        </view>
        <view class="cc-legend">
          <view v-for="(cat, i) in stats.categoryRatios" :key="i" class="cc-legend-item">
            <view class="cc-dot" :class="'cc-dot-' + cat.category"></view>
            <text class="cc-name">{{ cat.categoryName }}</text>
            <text class="cc-pct">{{ cat.percent }}%</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import request from '../../utils/request'
import { API } from '../../config'

const userId = ref(null)
const activeTab = ref('week')

const stats = ref({
  dailyExercises: [],
  totalDays: 0,
  totalCalories: 0,
  avgDuration: 0,
  exerciseTypeCount: 0,
  categoryRatios: [],
  intakeVsBurn: []
})

const barWidth = (val, target) => {
  if (!target || target === 0) return 0
  return Math.min(100, val / target * 100)
}

const maxIntake = computed(() => {
  if (!stats.value.intakeVsBurn || stats.value.intakeVsBurn.length === 0) return 1
  return Math.max(1, ...stats.value.intakeVsBurn.map(d => Math.max(d.intake, d.burn)))
})

const intakeBarWidth = (val) => Math.min(100, val / maxIntake.value * 100)
const burnBarWidth = (val) => Math.min(100, val / maxIntake.value * 100)

const pieStyle = computed(() => {
  const ratios = stats.value.categoryRatios || []
  if (ratios.length === 0) return { background: '#FFE5D0' }
  const colors = { cardio: '#2196f3', strength: '#FF9800', flexibility: '#4CAF50', hiit: '#f44336' }
  let gradient = ''
  let acc = 0
  ratios.forEach(r => {
    const color = colors[r.category] || '#B8956A'
    gradient += `${color} ${acc}% ${acc + r.percent}%, `
    acc += r.percent
  })
  return { background: `conic-gradient(${gradient.slice(0, -2)})` }
})

const switchTab = (tab) => {
  activeTab.value = tab
  loadStats()
}

const loadStats = async () => {
  try {
    const days = activeTab.value === 'week' ? 7 : 30
    const res = await request({
      url: API.EXERCISE_STATS,
      method: 'GET',
      data: { userId: userId.value, days }
    })
    if (res.code === 200 && res.data) {
      stats.value = res.data
    }
  } catch (err) {
    console.error('加载统计数据失败', err)
  }
}

onMounted(() => {
  userId.value = uni.getStorageSync('userId')
  if (!userId.value) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => uni.reLaunch({ url: '/pages/login/login' }), 1500)
    return
  }
  loadStats()
})
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(180deg, #FFF3E0 0%, #FFF8F0 20%, #FFF8F0 100%);
  padding: 24rpx;
  padding-bottom: 120rpx;
}

.card {
  background: #ffffff;
  border-radius: 28rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 6rpx 24rpx rgba(92, 64, 51, 0.06);
}

.animate-in { opacity: 0; transform: translateY(40rpx); animation: slideUp 0.6s ease forwards; }
.delay-1 { animation-delay: 0.15s; }
.delay-2 { animation-delay: 0.3s; }
.delay-3 { animation-delay: 0.45s; }

@keyframes slideUp {
  to { opacity: 1; transform: translateY(0); }
}

/* Tab */
.tab-bar {
  display: flex;
  background: #FFF3E8;
  border-radius: 20rpx;
  padding: 6rpx;
  margin-bottom: 24rpx;
}

.tab-btn {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #B8956A;
  transition: all 0.3s ease;
}

.tab-btn.active {
  background: #ffffff;
  color: #FF8C42;
  font-weight: 600;
  box-shadow: 0 4rpx 12rpx rgba(255, 140, 66, 0.15);
}

.section-title { margin-bottom: 24rpx; }
.st-text { display: block; font-size: 32rpx; font-weight: bold; color: #5C4033; }
.st-sub { display: block; font-size: 22rpx; color: #B8956A; margin-top: 6rpx; }

/* 柱状图 */
.bar-chart { margin-bottom: 8rpx; }

.bc-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 14rpx;
}

.bc-date { font-size: 20rpx; color: #B8956A; width: 70rpx; text-align: right; }

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
}

.bc-val { font-size: 22rpx; font-weight: 600; color: #5C4033; width: 80rpx; }
.bc-val.reached { color: #4caf50; }

/* 统计卡片 */
.stat-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.sc-item {
  flex: 1;
  min-width: 40%;
  background: #FFF8F0;
  border-radius: 20rpx;
  padding: 24rpx;
  text-align: center;
}

.sc-num { display: block; font-size: 40rpx; font-weight: bold; color: #FF8C42; }
.sc-label { display: block; font-size: 22rpx; color: #B8956A; margin-top: 8rpx; }

/* 摄入vs消耗 */
.ivb-chart { margin-bottom: 20rpx; }

.ivb-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.ivb-date { font-size: 20rpx; color: #B8956A; width: 70rpx; text-align: right; }

.ivb-bars { flex: 1; display: flex; flex-direction: column; gap: 4rpx; }

.ivb-bar-row {
  height: 14rpx;
  background: #FFF3E8;
  border-radius: 7rpx;
  overflow: hidden;
}

.ivb-bar {
  height: 100%;
  border-radius: 7rpx;
  transition: width 0.8s ease;
}

.ivb-bar.intake { background: linear-gradient(90deg, #FF8C42, #FFD93D); }
.ivb-bar.burn { background: linear-gradient(90deg, #4caf50, #8bc34a); }

.ivb-net {
  font-size: 22rpx;
  font-weight: 600;
  width: 80rpx;
  text-align: right;
}

.ivb-net.surplus { color: #f44336; }
.ivb-net.deficit { color: #4caf50; }

.ivb-legend {
  display: flex;
  justify-content: center;
  gap: 24rpx;
  flex-wrap: wrap;
}

.ivb-legend-item { display: flex; align-items: center; gap: 6rpx; }

.ivb-legend-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
}

.intake-dot { background: #FF8C42; }
.burn-dot { background: #4caf50; }
.ivb-legend-text { font-size: 20rpx; color: #B8956A; }

/* 类型分布 */
.category-chart {
  display: flex;
  align-items: center;
  gap: 36rpx;
}

.cc-pie {
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cc-pie-inner {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.cc-pie-label { font-size: 20rpx; color: #B8956A; }
.cc-pie-num { font-size: 32rpx; font-weight: bold; color: #FF8C42; }
.cc-pie-unit { font-size: 18rpx; color: #B8956A; }

.cc-legend { flex: 1; }

.cc-legend-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.cc-dot { width: 20rpx; height: 20rpx; border-radius: 50%; }
.cc-dot-cardio { background: #2196f3; }
.cc-dot-strength { background: #FF9800; }
.cc-dot-flexibility { background: #4CAF50; }
.cc-dot-hiit { background: #f44336; }

.cc-name { font-size: 24rpx; color: #5C4033; flex: 1; }
.cc-pct { font-size: 24rpx; font-weight: 600; color: #FF8C42; }
</style>
