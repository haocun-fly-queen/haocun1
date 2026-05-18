<template>
  <view class="container">
    <!-- 疲劳度管理 -->
    <view class="section-card card animate-in">
      <view class="section-title">
        <text class="st-text">🔥 运动疲劳管理</text>
      </view>

      <view class="fatigue-status">
        <view class="fs-header">
          <text class="fs-icon">{{ fatigue.needRest ? '⚠️' : '💪' }}</text>
          <text class="fs-title">{{ fatigue.statusText }}</text>
        </view>

        <view class="fs-progress">
          <view class="fs-bar-track">
            <view class="fs-bar-fill" :style="{ width: Math.min(fatigue.consecutiveDays / 7 * 100, 100) + '%' }"
                  :class="{ danger: fatigue.needRest, warning: fatigue.consecutiveDays >= 3 }"></view>
          </view>
          <view class="fs-bar-labels">
            <text>0天</text>
            <text>安全</text>
            <text>注意</text>
            <text>休息</text>
          </view>
        </view>

        <view class="fs-consecutive">
          <text class="fs-con-label">连续运动</text>
          <text class="fs-con-num" :class="{ danger: fatigue.needRest }">{{ fatigue.consecutiveDays }}</text>
          <text class="fs-con-unit">天</text>
        </view>

        <view class="fs-suggestion">
          <view class="fs-sug-icon">💡</view>
          <text class="fs-sug-text">{{ fatigue.suggestion }}</text>
        </view>
      </view>

      <!-- 本周运动日历点阵 -->
      <view class="week-dots">
        <text class="wd-title">本周运动情况</text>
        <view class="wd-row">
          <view v-for="(day, i) in weekDays" :key="i" class="wd-item">
            <view class="wd-dot" :class="{ active: day.hasExercise, today: day.isToday }">
              <text class="wd-dot-icon">{{ day.hasExercise ? '✅' : (day.isToday ? '📍' : '·') }}</text>
            </view>
            <text class="wd-label">{{ day.label }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 运动提醒设置 -->
    <view class="section-card card animate-in delay-1">
      <view class="section-title">
        <text class="st-text">⏰ 运动提醒</text>
      </view>

      <view class="reminder-form">
        <!-- 开关 -->
        <view class="rf-row">
          <text class="rf-label">开启提醒</text>
          <switch :checked="reminder.isEnabled === 1" @change="toggleReminder"
                  color="#FF8C42" style="transform: scale(0.8);" />
        </view>

        <!-- 提醒时间 -->
        <view class="rf-row" v-if="reminder.isEnabled === 1">
          <text class="rf-label">提醒时间</text>
          <picker mode="time" :value="reminder.remindTime" @change="onTimeChange">
            <text class="rf-value">{{ reminder.remindTime || '18:00' }}</text>
          </picker>
        </view>

        <!-- 提醒日 -->
        <view class="rf-days" v-if="reminder.isEnabled === 1">
          <text class="rf-label">提醒日</text>
          <view class="rf-day-btns">
            <view v-for="(day, idx) in dayOptions" :key="idx"
                  class="rf-day-btn" :class="{ selected: selectedDays.includes(day.value) }"
                  @click="toggleDay(day.value)">
              <text class="rf-day-text">{{ day.label }}</text>
            </view>
          </view>
        </view>

        <button class="save-btn" @click="saveReminder" v-if="reminder.isEnabled === 1">保存设置</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import request from '../../utils/request'
import { API } from '../../config'

const userId = ref(null)

const fatigue = ref({
  consecutiveDays: 0,
  needRest: false,
  statusText: '加载中...',
  suggestion: ''
})

const reminder = ref({
  remindTime: '18:00',
  remindDays: '1,2,3,4,5',
  isEnabled: 1
})

const dayOptions = [
  { label: '一', value: 1 },
  { label: '二', value: 2 },
  { label: '三', value: 3 },
  { label: '四', value: 4 },
  { label: '五', value: 5 },
  { label: '六', value: 6 },
  { label: '日', value: 7 }
]

const selectedDays = ref([1, 2, 3, 4, 5])

const weekDays = computed(() => {
  const labels = ['一', '二', '三', '四', '五', '六', '日']
  const today = new Date()
  const todayDay = today.getDay() === 0 ? 7 : today.getDay()
  return labels.map((label, i) => ({
    label,
    hasExercise: (i + 1) <= fatigue.value.consecutiveDays && (i + 1) < todayDay,
    isToday: (i + 1) === todayDay
  }))
})

const toggleReminder = (e) => {
  reminder.value.isEnabled = e.detail.value ? 1 : 0
}

const onTimeChange = (e) => {
  reminder.value.remindTime = e.detail.value
}

const toggleDay = (day) => {
  const idx = selectedDays.value.indexOf(day)
  if (idx >= 0) {
    selectedDays.value.splice(idx, 1)
  } else {
    selectedDays.value.push(day)
    selectedDays.value.sort()
  }
}

const loadFatigue = async () => {
  try {
    const res = await request({
      url: API.EXERCISE_FATIGUE,
      method: 'GET',
      data: { userId: userId.value }
    })
    if (res.code === 200 && res.data) fatigue.value = res.data
  } catch (err) {
    console.error('加载疲劳度失败', err)
  }
}

const loadReminder = async () => {
  try {
    const res = await request({
      url: API.EXERCISE_REMINDER,
      method: 'GET',
      data: { userId: userId.value }
    })
    if (res.code === 200 && res.data) {
      reminder.value = res.data
      if (res.data.remindDays) {
        selectedDays.value = res.data.remindDays.split(',').map(Number)
      }
    }
  } catch (err) {
    console.error('加载提醒设置失败', err)
  }
}

const saveReminder = async () => {
  try {
    const res = await request({
      url: API.EXERCISE_REMINDER,
      method: 'POST',
      data: {
        userId: userId.value,
        remindTime: reminder.value.remindTime,
        remindDays: selectedDays.value.join(','),
        isEnabled: reminder.value.isEnabled
      }
    })
    if (res.code === 200) {
      uni.showToast({ title: '保存成功', icon: 'success' })
    }
  } catch (err) {
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

onMounted(() => {
  userId.value = uni.getStorageSync('userId')
  if (!userId.value) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => uni.reLaunch({ url: '/pages/login/login' }), 1500)
    return
  }
  loadFatigue()
  loadReminder()
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

@keyframes slideUp {
  to { opacity: 1; transform: translateY(0); }
}

.section-title { margin-bottom: 24rpx; }
.st-text { display: block; font-size: 32rpx; font-weight: bold; color: #5C4033; }

/* ========== 疲劳度 ========== */
.fatigue-status { margin-bottom: 28rpx; }

.fs-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.fs-icon { font-size: 36rpx; }
.fs-title { font-size: 30rpx; font-weight: bold; color: #5C4033; }

.fs-progress { margin-bottom: 20rpx; }

.fs-bar-track {
  height: 20rpx;
  background: #FFE5D0;
  border-radius: 10rpx;
  overflow: hidden;
  margin-bottom: 8rpx;
}

.fs-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  border-radius: 10rpx;
  transition: width 0.8s ease;
}

.fs-bar-fill.warning { background: linear-gradient(90deg, #ff9800, #ffc107); }
.fs-bar-fill.danger { background: linear-gradient(90deg, #ff5722, #f44336); }

.fs-bar-labels {
  display: flex;
  justify-content: space-between;
}

.fs-bar-labels text { font-size: 18rpx; color: #B8956A; }

.fs-consecutive {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8rpx;
  margin-bottom: 20rpx;
}

.fs-con-label { font-size: 26rpx; color: #B8956A; }
.fs-con-num { font-size: 64rpx; font-weight: bold; color: #FF8C42; }
.fs-con-num.danger { color: #f44336; }
.fs-con-unit { font-size: 26rpx; color: #B8956A; }

.fs-suggestion {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  background: #FFF8F0;
  border-radius: 16rpx;
  padding: 20rpx;
  border-left: 6rpx solid #FFD93D;
}

.fs-sug-icon { font-size: 28rpx; flex-shrink: 0; }
.fs-sug-text { font-size: 24rpx; color: #8B6914; line-height: 1.6; }

/* 周点阵 */
.week-dots { padding-top: 20rpx; border-top: 1rpx solid #FFF3E8; }

.wd-title { display: block; font-size: 24rpx; color: #B8956A; margin-bottom: 16rpx; }

.wd-row { display: flex; justify-content: space-around; }

.wd-item { display: flex; flex-direction: column; align-items: center; gap: 8rpx; }

.wd-dot {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: #FFF3E8;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.wd-dot.active { background: #E8F5E9; transform: scale(1.05); }
.wd-dot.today { border: 3rpx solid #FF8C42; }
.wd-dot-icon { font-size: 24rpx; }
.wd-label { font-size: 22rpx; color: #B8956A; }

/* ========== 提醒设置 ========== */
.reminder-form { }

.rf-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #FFF3E8;
}

.rf-label { font-size: 28rpx; color: #5C4033; }
.rf-value { font-size: 32rpx; font-weight: bold; color: #FF8C42; }

.rf-days { padding: 20rpx 0; }

.rf-day-btns {
  display: flex;
  gap: 12rpx;
  margin-top: 16rpx;
}

.rf-day-btn {
  width: 68rpx;
  height: 68rpx;
  border-radius: 50%;
  background: #FFF3E8;
  border: 2rpx solid #FFE5D0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.rf-day-btn.selected {
  background: #FF8C42;
  border-color: #FF8C42;
}

.rf-day-text { font-size: 24rpx; color: #5C4033; }
.rf-day-btn.selected .rf-day-text { color: #ffffff; }

.save-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #FF8C42, #FFD93D);
  color: #ffffff;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: 600;
  border: none;
  margin-top: 32rpx;
}

.save-btn::after { border: none; }
</style>
