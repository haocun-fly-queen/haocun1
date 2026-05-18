<template>
  <view class="container">
    <!-- 顶部问候区 -->
    <view class="greeting-section">
      <view class="gs-chicken-wrap">
        <view class="gs-chicken">
          <view class="gc-body"></view>
          <view class="gc-eye gc-l"></view>
          <view class="gc-eye gc-r"></view>
          <view class="gc-beak"></view>
          <view class="gc-wing"></view>
        </view>
      </view>
      <view class="gs-text">
        <text class="gs-greeting">{{ greeting }}</text>
        <text class="gs-date">{{ todayStr }}</text>
      </view>
    </view>

    <!-- 今日运动概览 -->
    <view class="exercise-overview card">
      <view class="eo-ring-wrap">
        <view class="eo-ring">
          <view class="eo-ring-bg"></view>
          <view class="eo-ring-fill" :style="ringStyle"></view>
          <view class="eo-ring-cover">
            <text class="eo-remaining">{{ animatedCalories }}</text>
            <text class="eo-label">已消耗 kcal</text>
          </view>
        </view>
      </view>
      <view class="eo-stats">
        <view class="eo-stat">
          <view class="eo-stat-icon target-icon">🎯</view>
          <text class="eo-stat-num">{{ todayExercise.targetCalories }}</text>
          <text class="eo-stat-label">建议消耗</text>
        </view>
        <view class="eo-divider"></view>
        <view class="eo-stat">
          <view class="eo-stat-icon burned-icon">🔥</view>
          <text class="eo-stat-num">{{ todayExercise.consumedCalories }}</text>
          <text class="eo-stat-label">已消耗</text>
        </view>
        <view class="eo-divider"></view>
        <view class="eo-stat">
          <view class="eo-stat-icon remain-icon">⚡</view>
          <text class="eo-stat-num">{{ todayExercise.remainingCalories }}</text>
          <text class="eo-stat-label">剩余</text>
        </view>
      </view>

      <!-- 今日已记录运动 -->
      <view class="eo-records" v-if="todayExercise.records && todayExercise.records.length > 0">
        <view v-for="(r, i) in todayExercise.records" :key="i" class="eo-record-row">
          <text class="eo-rec-icon">{{ getExerciseIcon(r.icon) }}</text>
          <text class="eo-rec-name">{{ r.exerciseName }}</text>
          <text class="eo-rec-duration">{{ r.durationMinutes }}分钟</text>
          <text class="eo-rec-cal">{{ r.caloriesBurned }}kcal</text>
        </view>
      </view>
    </view>

    <!-- AI运动计划卡片 -->
    <view class="ai-plan-section card">
      <view v-if="!todayPlan.generated" class="plan-empty">
        <!-- 小唧推荐区 -->
        <view class="rec-chicken-anim">
          <view class="rec-chicken">
            <view class="rc-body"></view>
            <view class="rc-eye rc-l"></view>
            <view class="rc-eye rc-r"></view>
            <view class="rc-beak"></view>
            <view class="rc-wing"></view>
          </view>
          <view class="rec-speech">
            <view class="rec-bubble">
              <text class="rec-bubble-text">{{ chickenSays }}</text>
            </view>
            <view class="rec-bubble-tail"></view>
          </view>
        </view>

        <view class="rec-hint">
          <text class="rec-hint-text">{{ planHint }}</text>
        </view>

        <button class="rec-btn" :class="{ breathing: !isGenerating }" @click="generatePlan" :disabled="isGenerating">
          <view v-if="!isGenerating" class="rec-btn-content">
            <view class="rec-btn-chicken">
              <view class="rbc-body"></view>
              <view class="rbc-eye rbc-l"></view>
              <view class="rbc-eye rbc-r"></view>
              <view class="rbc-beak"></view>
            </view>
            <text class="rec-btn-text">点击小唧生成今日运动计划</text>
          </view>
          <view v-else class="btn-loader">
            <view class="rec-btn-chicken thinking">
              <view class="rbc-body"></view>
              <view class="rbc-eye rbc-l"></view>
              <view class="rbc-eye rbc-r"></view>
              <view class="rbc-beak"></view>
            </view>
            <text class="bl-text">小唧正在规划...</text>
            <view class="bl-dots">
              <view class="bl-dot"></view>
              <view class="bl-dot"></view>
              <view class="bl-dot"></view>
            </view>
          </view>
        </button>
      </view>

      <!-- 已生成的计划 -->
      <view v-else class="plan-content">
        <view class="plan-header">
          <text class="plan-title">🤖 小唧的运动推荐</text>
          <button class="plan-retry-btn" @click="generatePlan">🔄 重新生成</button>
        </view>

        <view
          v-for="(ex, idx) in todayPlan.exercises"
          :key="idx"
          class="plan-exercise-card"
          :style="{ animationDelay: (idx * 0.12) + 's' }"
        >
          <view class="pec-header">
            <view class="pec-icon-wrap" :class="'cat-' + ex.category">
              <text class="pec-icon">{{ getExerciseIcon(ex.icon) }}</text>
            </view>
            <view class="pec-info">
              <text class="pec-name">{{ ex.name }}</text>
              <text class="pec-intensity">强度：{{ ex.intensity }}</text>
            </view>
            <view class="pec-data">
              <text class="pec-duration">{{ ex.duration }}分钟</text>
              <text class="pec-cal">{{ ex.calories }}kcal</text>
            </view>
          </view>
          <view class="pec-reason" v-if="ex.reason">
            <text class="pec-reason-text">{{ ex.reason }}</text>
          </view>
        </view>

        <!-- 计划总结 -->
        <view class="plan-summary">
          <view class="ps-item">
            <text class="ps-num">{{ todayPlan.totalDuration }}</text>
            <text class="ps-label">总时长 min</text>
          </view>
          <view class="ps-divider"></view>
          <view class="ps-item">
            <text class="ps-num">{{ todayPlan.totalCalories }}</text>
            <text class="ps-label">预计消耗 kcal</text>
          </view>
        </view>

        <view class="plan-advice" v-if="todayPlan.advice">
          <text class="plan-advice-text">{{ todayPlan.advice }}</text>
        </view>
      </view>
    </view>

    <!-- 疲劳度提醒 -->
    <view class="fatigue-card card" v-if="fatigue.consecutiveDays > 0">
      <view class="fc-header">
        <text class="fc-icon">{{ fatigue.needRest ? '⚠️' : '💪' }}</text>
        <text class="fc-title">{{ fatigue.statusText }}</text>
      </view>
      <view class="fc-bar">
        <view class="fc-bar-track">
          <view class="fc-bar-fill" :style="{ width: Math.min(fatigue.consecutiveDays / 7 * 100, 100) + '%' }"
                :class="{ danger: fatigue.needRest }"></view>
        </view>
        <text class="fc-bar-label">连续运动 {{ fatigue.consecutiveDays }} 天</text>
      </view>
      <text class="fc-suggestion">{{ fatigue.suggestion }}</text>
    </view>

    <!-- 功能入口 -->
    <view class="entry-grid">
      <view class="entry-card" @click="goTo('/pages/exercise/record')">
        <view class="entry-icon-wrap cal-icon">
          <text class="entry-icon-text">📅</text>
        </view>
        <text class="entry-title">运动记录</text>
        <text class="entry-desc">记录与日历</text>
      </view>
      <view class="entry-card" @click="goTo('/pages/exercise/stats')">
        <view class="entry-icon-wrap stats-icon">
          <text class="entry-icon-text">📊</text>
        </view>
        <text class="entry-title">数据看板</text>
        <text class="entry-desc">统计与分析</text>
      </view>
      <view class="entry-card" @click="goTo('/pages/exercise/settings')">
        <view class="entry-icon-wrap settings-icon">
          <text class="entry-icon-text">⚙️</text>
        </view>
        <text class="entry-title">管理提醒</text>
        <text class="entry-desc">疲劳与提醒</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import request from '../../utils/request'
import { API } from '../../config'

const userId = ref(null)
const isGenerating = ref(false)
const animatedCalories = ref(0)
const ringPercent = ref(0)

const todayExercise = ref({
  targetCalories: 300,
  consumedCalories: 0,
  remainingCalories: 300,
  progressPercent: 0,
  records: []
})

const todayPlan = ref({
  generated: false,
  exercises: [],
  totalDuration: 0,
  totalCalories: 0,
  advice: ''
})

const fatigue = ref({
  consecutiveDays: 0,
  needRest: false,
  statusText: '',
  suggestion: ''
})

const todayStr = computed(() => {
  const d = new Date()
  const weekDay = ['日','一','二','三','四','五','六'][d.getDay()]
  return `${d.getMonth() + 1}月${d.getDate()}日 周${weekDay}`
})

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了，休息也是训练的一部分 🌙'
  if (h < 11) return '早上好！晨练是好习惯 ☀️'
  if (h < 14) return '中午好！午餐后散步一下 🚶'
  if (h < 18) return '下午好！适合来一组训练 💪'
  return '晚上好！运动后好好休息 🌆'
})

const chickenSays = computed(() => {
  const consumed = todayExercise.value.consumedCalories
  if (consumed === 0) return '今天还没运动呢！让我帮你安排~'
  if (fatigue.value.needRest) return '连续运动好几天了，今天休息一下吧~'
  return `已消耗 ${consumed} kcal，继续加油！`
})

const planHint = computed(() => {
  if (fatigue.value.needRest) return '检测到连续运动多天，小唧会推荐恢复性训练'
  return '综合你的饮食摄入和身体状况，量身定制运动方案'
})

const ringStyle = computed(() => {
  const deg = (ringPercent.value / 100) * 360
  return { background: `conic-gradient(#FF8C42 ${deg}deg, #FFE5D0 ${deg}deg)` }
})

const getExerciseIcon = (icon) => {
  const iconMap = {
    'running': '🏃', 'walking': '🚶', 'jump-rope': '🤸', 'swimming': '🏊',
    'cycling': '🚴', 'elliptical': '🏋️', 'squat': '🦵', 'bench-press': '💪',
    'deadlift': '🏋️', 'push-up': '💪', 'pull-up': '💪', 'curl': '💪',
    'yoga': '🧘', 'stretch': '🤸', 'hiit': '⚡', 'burpee': '🔥'
  }
  if (icon && iconMap[icon]) return iconMap[icon]
  return '🏃'
}

const animateNumber = (from, to, duration, callback) => {
  const start = Date.now()
  const diff = to - from
  const step = () => {
    const elapsed = Date.now() - start
    const progress = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    callback(Math.round(from + diff * eased))
    if (progress < 1) setTimeout(step, 16)
  }
  step()
}

const goTo = (url) => { uni.navigateTo({ url }) }

const loadDashboard = async () => {
  try {
    const res = await request({
      url: API.EXERCISE_DASHBOARD,
      method: 'GET',
      data: { userId: userId.value }
    })
    if (res.code === 200 && res.data) {
      const data = res.data
      todayExercise.value = data.todayExercise || todayExercise.value
      if (data.todayPlan && data.todayPlan.generated) {
        todayPlan.value = data.todayPlan
      }
      fatigue.value = data.fatigue || fatigue.value

      setTimeout(() => {
        animateNumber(0, todayExercise.value.consumedCalories, 1000, (v) => { animatedCalories.value = v })
        animateNumber(0, todayExercise.value.progressPercent, 800, (v) => { ringPercent.value = v })
      }, 300)
    }
  } catch (err) {
    console.error('加载运动看板失败', err)
  }
}

const generatePlan = async () => {
  console.log('点击了生成按钮, userId:', userId.value)
  if (isGenerating.value) return
  isGenerating.value = true
  try {
    const url = API.EXERCISE_PLAN_GENERATE + '?userId=' + userId.value
    console.log('请求URL:', url)
    const res = await request({
      url: url,
      method: 'POST',
      data: {}
    })
    console.log('AI运动规划返回:', JSON.stringify(res))
    if (res.code === 200 && res.data) {
      todayPlan.value = res.data
      uni.showToast({ title: '运动计划已生成', icon: 'success' })
    } else {
      throw new Error(res.message || '生成失败')
    }
  } catch (err) {
    console.error('生成运动计划失败', err)
    uni.showToast({ title: '小唧累了，请稍后再试', icon: 'none' })
  } finally {
    isGenerating.value = false
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

/* ========== 顶部问候区 ========== */
.greeting-section {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 16rpx 8rpx 24rpx;
  animation: slideDown 0.5s ease;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-20rpx); }
  to { opacity: 1; transform: translateY(0); }
}

.gs-chicken-wrap { position: relative; }

.gs-chicken {
  width: 100rpx;
  height: 100rpx;
  position: relative;
  animation: chickenIdle 3s ease-in-out infinite;
}

@keyframes chickenIdle {
  0%, 100% { transform: translateY(0) rotate(0); }
  25% { transform: translateY(-6rpx) rotate(-3deg); }
  75% { transform: translateY(-3rpx) rotate(3deg); }
}

.gc-body {
  width: 65rpx;
  height: 60rpx;
  background: linear-gradient(135deg, #FFD93D, #FFB347);
  border-radius: 50% 50% 45% 45%;
  position: absolute;
  top: 20rpx;
  left: 18rpx;
}

.gc-body::before {
  content: '';
  position: absolute;
  top: -10rpx;
  left: 50%;
  transform: translateX(-50%);
  border-left: 7rpx solid transparent;
  border-right: 7rpx solid transparent;
  border-bottom: 14rpx solid #FF6B35;
}

.gc-eye {
  position: absolute;
  width: 8rpx;
  height: 8rpx;
  background: #333;
  border-radius: 50%;
  top: 32rpx;
  z-index: 2;
  animation: blink 4s ease-in-out infinite;
}

@keyframes blink {
  0%, 90%, 100% { transform: scaleY(1); }
  95% { transform: scaleY(0.1); }
}

.gc-l { left: 32rpx; }
.gc-r { right: 32rpx; }

.gc-beak {
  position: absolute;
  bottom: 28rpx;
  left: 50%;
  transform: translateX(-50%);
  border-left: 7rpx solid transparent;
  border-right: 7rpx solid transparent;
  border-top: 10rpx solid #FF6B35;
}

.gc-wing {
  position: absolute;
  right: 10rpx;
  top: 32rpx;
  width: 20rpx;
  height: 28rpx;
  background: #FFB347;
  border-radius: 0 50% 50% 0;
  transform-origin: left center;
  animation: wingWave 2.5s ease-in-out infinite;
}

@keyframes wingWave {
  0%, 100% { transform: rotate(0); }
  50% { transform: rotate(-20deg); }
}

.gs-text { flex: 1; }

.gs-greeting {
  display: block;
  font-size: 34rpx;
  font-weight: bold;
  color: #5C4033;
}

.gs-date {
  display: block;
  font-size: 24rpx;
  color: #B8956A;
  margin-top: 6rpx;
}

/* ========== 今日运动概览 ========== */
.exercise-overview { animation: slideUp 0.4s ease 0.1s both; }

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30rpx); }
  to { opacity: 1; transform: translateY(0); }
}

.eo-ring-wrap { display: flex; justify-content: center; margin-bottom: 24rpx; }

.eo-ring { width: 260rpx; height: 260rpx; position: relative; }
.eo-ring-bg { position: absolute; inset: 0; border-radius: 50%; background: #FFE5D0; }
.eo-ring-fill { position: absolute; inset: 0; border-radius: 50%; transition: background 0.8s ease; }

.eo-ring-cover {
  position: absolute;
  inset: 18rpx;
  border-radius: 50%;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.eo-remaining { font-size: 56rpx; font-weight: bold; color: #FF8C42; }
.eo-label { font-size: 22rpx; color: #B8956A; }

.eo-stats { display: flex; align-items: center; justify-content: space-around; }
.eo-stat { display: flex; flex-direction: column; align-items: center; gap: 8rpx; }

.eo-stat-icon {
  font-size: 32rpx;
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.target-icon { background: #FFF3E0; }
.burned-icon { background: #FCE4EC; }
.remain-icon { background: #E3F2FD; }

.eo-stat-num { font-size: 36rpx; font-weight: bold; color: #5C4033; }
.eo-stat-label { font-size: 22rpx; color: #B8956A; }
.eo-divider { width: 2rpx; height: 60rpx; background: #FFE5D0; }

.eo-records { margin-top: 24rpx; border-top: 1rpx solid #FFF3E8; padding-top: 16rpx; }

.eo-record-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 12rpx 0;
}

.eo-rec-icon { font-size: 28rpx; }
.eo-rec-name { flex: 1; font-size: 26rpx; color: #5C4033; }
.eo-rec-duration { font-size: 24rpx; color: #B8956A; }
.eo-rec-cal { font-size: 26rpx; font-weight: 600; color: #FF8C42; }

/* ========== AI计划区域 ========== */
.ai-plan-section {
  animation: slideUp 0.4s ease 0.2s both;
  background: linear-gradient(135deg, #FFFBF0, #FFF8F0);
  border: 2rpx solid #FFE5D0;
}

/* 小唧说话 */
.rec-chicken-anim {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.rec-chicken {
  width: 80rpx;
  height: 80rpx;
  position: relative;
  flex-shrink: 0;
  animation: chickenTalk 2s ease-in-out infinite;
}

@keyframes chickenTalk {
  0%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6rpx); }
  60% { transform: translateY(-2rpx); }
}

.rc-body {
  width: 55rpx;
  height: 50rpx;
  background: linear-gradient(135deg, #FFD93D, #FFB347);
  border-radius: 50% 50% 45% 45%;
  position: absolute;
  top: 16rpx;
  left: 12rpx;
}

.rc-body::before {
  content: '';
  position: absolute;
  top: -9rpx;
  left: 50%;
  transform: translateX(-50%);
  border-left: 6rpx solid transparent;
  border-right: 6rpx solid transparent;
  border-bottom: 12rpx solid #FF6B35;
}

.rc-eye {
  position: absolute;
  width: 7rpx;
  height: 7rpx;
  background: #333;
  border-radius: 50%;
  top: 26rpx;
  z-index: 2;
  animation: blink 3s ease-in-out infinite;
}

.rc-l { left: 26rpx; }
.rc-r { right: 26rpx; }

.rc-beak {
  position: absolute;
  bottom: 24rpx;
  left: 50%;
  transform: translateX(-50%);
  border-left: 6rpx solid transparent;
  border-right: 6rpx solid transparent;
  border-top: 9rpx solid #FF6B35;
}

.rc-wing {
  position: absolute;
  right: 8rpx;
  top: 26rpx;
  width: 16rpx;
  height: 22rpx;
  background: #FFB347;
  border-radius: 0 50% 50% 0;
  transform-origin: left center;
  animation: wingWave 1.5s ease-in-out infinite;
}

.rec-speech { flex: 1; position: relative; padding-top: 8rpx; }

.rec-bubble {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 18rpx 24rpx;
  border: 2rpx solid #FFE5D0;
  animation: bubblePop 0.4s ease;
}

@keyframes bubblePop {
  0% { opacity: 0; transform: scale(0.8); }
  50% { transform: scale(1.03); }
  100% { opacity: 1; transform: scale(1); }
}

.rec-bubble-text { font-size: 26rpx; color: #5C4033; line-height: 1.5; font-weight: 500; }

.rec-bubble-tail {
  position: absolute;
  left: -14rpx;
  top: 24rpx;
  width: 0;
  height: 0;
  border-top: 10rpx solid transparent;
  border-bottom: 10rpx solid transparent;
  border-right: 14rpx solid #FFE5D0;
}

.rec-bubble-tail::after {
  content: '';
  position: absolute;
  left: 4rpx;
  top: -8rpx;
  width: 0;
  height: 0;
  border-top: 8rpx solid transparent;
  border-bottom: 8rpx solid transparent;
  border-right: 12rpx solid #ffffff;
}

.rec-hint { margin-bottom: 24rpx; }
.rec-hint-text { font-size: 26rpx; color: #8B6914; line-height: 1.5; }

.rec-btn {
  width: 100%;
  height: 100rpx;
  background: linear-gradient(135deg, #FF8C42 0%, #FFD93D 100%);
  color: #ffffff;
  border-radius: 50rpx;
  font-size: 30rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  position: relative;
  overflow: hidden;
}

.rec-btn::after { border: none; }
.rec-btn[disabled] { opacity: 0.7; }

.rec-btn.breathing::before {
  content: '';
  position: absolute;
  inset: -4rpx;
  border-radius: 54rpx;
  background: linear-gradient(135deg, #FF8C42, #FFD93D, #FF8C42);
  z-index: -1;
  animation: breathe 2s ease-in-out infinite;
  opacity: 0.5;
}

@keyframes breathe {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.02); }
}

.rec-btn-content { display: flex; align-items: center; gap: 16rpx; }
.rec-btn-text { font-size: 30rpx; }

.rec-btn-chicken { width: 48rpx; height: 48rpx; position: relative; flex-shrink: 0; }

.rec-btn-chicken.thinking { animation: thinkBounce 0.6s ease-in-out infinite; }

@keyframes thinkBounce {
  0%, 100% { transform: translateY(0) rotate(0); }
  50% { transform: translateY(-6rpx) rotate(5deg); }
}

.rbc-body {
  width: 34rpx;
  height: 30rpx;
  background: #ffffff;
  border-radius: 50% 50% 45% 45%;
  position: absolute;
  top: 10rpx;
  left: 7rpx;
}

.rbc-body::before {
  content: '';
  position: absolute;
  top: -6rpx;
  left: 50%;
  transform: translateX(-50%);
  border-left: 4rpx solid transparent;
  border-right: 4rpx solid transparent;
  border-bottom: 8rpx solid #FF8C42;
}

.rbc-eye {
  position: absolute;
  width: 4rpx;
  height: 4rpx;
  background: #5C4033;
  border-radius: 50%;
  top: 16rpx;
  z-index: 2;
}

.rbc-l { left: 15rpx; }
.rbc-r { right: 15rpx; }

.rbc-beak {
  position: absolute;
  bottom: 12rpx;
  left: 50%;
  transform: translateX(-50%);
  border-left: 4rpx solid transparent;
  border-right: 4rpx solid transparent;
  border-top: 6rpx solid #FF8C42;
}

.btn-loader { display: flex; align-items: center; gap: 12rpx; }
.bl-text { font-size: 26rpx; }
.bl-dots { display: flex; gap: 8rpx; }

.bl-dot {
  width: 10rpx;
  height: 10rpx;
  background: #FFFFFF;
  border-radius: 50%;
  animation: dotPulse 1.4s ease-in-out infinite;
}

.bl-dot:nth-child(2) { animation-delay: 0.2s; }
.bl-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes dotPulse {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

/* 已生成的计划 */
.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.plan-title { font-size: 30rpx; font-weight: bold; color: #5C4033; }

.plan-retry-btn {
  font-size: 24rpx;
  color: #FF8C42;
  background: #FFF3E0;
  border: none;
  border-radius: 20rpx;
  padding: 8rpx 20rpx;
  line-height: 1.5;
}

.plan-retry-btn::after { border: none; }

.plan-exercise-card {
  background: #FFF8F0;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  animation: mealSlideIn 0.5s ease both;
}

@keyframes mealSlideIn {
  from { opacity: 0; transform: translateY(40rpx) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.pec-header { display: flex; align-items: center; gap: 16rpx; }

.pec-icon-wrap {
  width: 60rpx;
  height: 60rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cat-cardio { background: #E3F2FD; }
.cat-strength { background: #FFF3E0; }
.cat-flexibility { background: #E8F5E9; }
.cat-hiit { background: #FCE4EC; }

.pec-icon { font-size: 28rpx; }
.pec-info { flex: 1; }
.pec-name { display: block; font-size: 28rpx; font-weight: 600; color: #5C4033; }
.pec-intensity { display: block; font-size: 22rpx; color: #B8956A; margin-top: 4rpx; }
.pec-data { text-align: right; }
.pec-duration { display: block; font-size: 24rpx; color: #B8956A; }
.pec-cal { display: block; font-size: 28rpx; font-weight: 600; color: #FF8C42; margin-top: 4rpx; }

.pec-reason {
  margin-top: 16rpx;
  padding: 16rpx;
  background: #ffffff;
  border-radius: 12rpx;
  border-left: 6rpx solid #FFD93D;
}

.pec-reason-text { font-size: 22rpx; color: #8B6914; line-height: 1.5; }

.plan-summary {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 24rpx 0;
  margin-top: 8rpx;
  border-top: 1rpx solid #FFF3E8;
}

.ps-item { display: flex; flex-direction: column; align-items: center; gap: 6rpx; }
.ps-num { font-size: 40rpx; font-weight: bold; color: #FF8C42; }
.ps-label { font-size: 22rpx; color: #B8956A; }
.ps-divider { width: 2rpx; height: 60rpx; background: #FFE5D0; }

.plan-advice {
  background: #FFF8F0;
  border-radius: 16rpx;
  padding: 20rpx;
  border-left: 6rpx solid #FFD93D;
  margin-top: 16rpx;
}

.plan-advice-text { font-size: 24rpx; color: #8B6914; line-height: 1.6; }

/* ========== 疲劳度卡片 ========== */
.fatigue-card { animation: slideUp 0.4s ease 0.3s both; }

.fc-header { display: flex; align-items: center; gap: 12rpx; margin-bottom: 16rpx; }
.fc-icon { font-size: 32rpx; }
.fc-title { font-size: 28rpx; font-weight: bold; color: #5C4033; }

.fc-bar { margin-bottom: 12rpx; }
.fc-bar-track {
  height: 16rpx;
  background: #FFE5D0;
  border-radius: 8rpx;
  overflow: hidden;
  margin-bottom: 8rpx;
}

.fc-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  border-radius: 8rpx;
  transition: width 0.8s ease;
}

.fc-bar-fill.danger { background: linear-gradient(90deg, #ff9800, #f44336); }
.fc-bar-label { font-size: 22rpx; color: #B8956A; }
.fc-suggestion { font-size: 24rpx; color: #8B6914; line-height: 1.5; }

/* ========== 功能入口 ========== */
.entry-grid {
  display: flex;
  gap: 16rpx;
  animation: slideUp 0.4s ease 0.4s both;
}

.entry-card {
  flex: 1;
  background: #ffffff;
  border-radius: 28rpx;
  padding: 28rpx 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  box-shadow: 0 6rpx 24rpx rgba(92, 64, 51, 0.06);
  transition: transform 0.2s ease;
}

.entry-card:active { transform: scale(0.95); }

.entry-icon-wrap {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cal-icon { background: linear-gradient(135deg, #FF8C42, #FFD93D); }
.stats-icon { background: linear-gradient(135deg, #4caf50, #8bc34a); }
.settings-icon { background: linear-gradient(135deg, #2196f3, #64b5f6); }

.entry-icon-text { font-size: 32rpx; }
.entry-title { font-size: 26rpx; font-weight: 600; color: #5C4033; }
.entry-desc { font-size: 20rpx; color: #B8956A; }
</style>
