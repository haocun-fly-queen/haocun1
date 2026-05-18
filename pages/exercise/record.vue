<template>
  <view class="container">
    <!-- 月历视图 -->
    <view class="calendar-card card">
      <view class="cal-header">
        <view class="cal-nav" @click="changeMonth(-1)">
          <text class="cal-nav-arrow">‹</text>
        </view>
        <text class="cal-title">{{ calendarYear }}年{{ calendarMonth }}月</text>
        <view class="cal-nav" @click="changeMonth(1)">
          <text class="cal-nav-arrow">›</text>
        </view>
      </view>

      <view class="cal-weekdays">
        <text v-for="d in ['日','一','二','三','四','五','六']" :key="d" class="cal-weekday">{{ d }}</text>
      </view>

      <view class="cal-grid">
        <view v-for="(day, idx) in calendarDays" :key="idx" class="cal-day"
              :class="{ today: day.isToday, exercised: day.hasExercise, empty: !day.date }">
          <text class="cal-day-num" v-if="day.date">{{ day.day }}</text>
          <view v-if="day.hasExercise" class="cal-dot"></view>
        </view>
      </view>

      <view class="cal-summary">
        <text class="cal-summary-text">本月运动 {{ totalExerciseDays }} 天</text>
      </view>
    </view>

    <!-- Tab切换 -->
    <view class="tab-bar">
      <view class="tab-btn" :class="{ active: activeTab === 'today' }" @click="activeTab = 'today'">今日记录</view>
      <view class="tab-btn" :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'">全部记录</view>
    </view>

    <!-- 今日记录 -->
    <view v-if="activeTab === 'today'">
      <view v-if="todayRecords.length === 0" class="empty-state">
        <text class="empty-icon">🏃</text>
        <text class="empty-text">今天还没有运动记录</text>
      </view>
      <view v-else class="record-list">
        <view v-for="(r, i) in todayRecords" :key="i" class="record-item card"
              :style="{ animationDelay: (i * 0.1) + 's' }">
          <view class="ri-header">
            <view class="ri-icon-wrap" :class="'cat-' + (r.category || 'cardio')">
              <text class="ri-icon">{{ getExerciseIcon(r.icon) }}</text>
            </view>
            <view class="ri-info">
              <text class="ri-name">{{ r.exerciseName }}</text>
              <text class="ri-time">{{ r.recordTime }}</text>
            </view>
            <view class="ri-data">
              <text class="ri-duration">{{ r.durationMinutes }}分钟</text>
              <text class="ri-cal">{{ r.caloriesBurned }}kcal</text>
            </view>
          </view>
          <view class="ri-footer">
            <view class="ri-tag" :class="'intensity-' + r.intensity">
              {{ ['', '低强度', '中强度', '高强度'][r.intensity || 2] }}
            </view>
            <text class="ri-delete" @click="deleteRecord(r.id)">删除</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 全部记录 -->
    <view v-if="activeTab === 'all'">
      <view v-if="allRecords.length === 0" class="empty-state">
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无运动记录</text>
      </view>
      <view v-else class="record-list">
        <view v-for="(group, date) in groupedRecords" :key="date" class="record-group">
          <text class="group-date">{{ formatGroupDate(date) }}</text>
          <view v-for="(r, i) in group" :key="i" class="record-item card">
            <view class="ri-header">
              <view class="ri-icon-wrap" :class="'cat-' + (r.category || 'cardio')">
                <text class="ri-icon">{{ getExerciseIcon(r.icon) }}</text>
              </view>
              <view class="ri-info">
                <text class="ri-name">{{ r.exerciseName }}</text>
                <text class="ri-time">{{ formatTime(r.recordTime) }}</text>
              </view>
              <view class="ri-data">
                <text class="ri-duration">{{ r.durationMinutes }}分钟</text>
                <text class="ri-cal">{{ r.caloriesBurned }}kcal</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 记录运动按钮 -->
    <view class="bottom-bar">
      <button class="add-btn" @click="showRecordModal = true">+ 记录运动</button>
    </view>

    <!-- 记录弹窗 -->
    <view class="modal-mask" v-if="showRecordModal" @click="showRecordModal = false">
      <view class="modal-box" @click.stop>
        <view class="modal-header">
          <text class="modal-title">记录运动</text>
          <text class="modal-close" @click="showRecordModal = false">✕</text>
        </view>
        <scroll-view scroll-y class="modal-body" :scroll-into-view="focusId">
          <!-- 运动类型选择 -->
          <view class="form-group">
            <text class="form-label">运动类型</text>
            <view class="exercise-picker">
              <view v-for="cat in exerciseCategories" :key="cat.key" class="ep-category">
                <text class="ep-cat-name">{{ cat.name }}</text>
                <view class="ep-items">
                  <view v-for="ex in cat.items" :key="ex.id" class="ep-item"
                        :class="{ selected: selectedExercise && selectedExercise.id === ex.id }"
                        @click="selectExercise(ex)">
                    <text class="ep-item-name">{{ ex.name }}</text>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <!-- 时长 -->
          <view class="form-group" id="durationInput">
            <text class="form-label">运动时长（分钟）</text>
            <input
              class="form-input"
              type="number"
              v-model="form.durationMinutes"
              placeholder="请输入运动时长"
              :adjust-position="false"
              @focus="focusId = 'durationInput'"
              @blur="focusId = ''"
            />
          </view>

          <!-- 强度 -->
          <view class="form-group">
            <text class="form-label">运动强度</text>
            <view class="radio-group">
              <view class="radio-item" :class="{ selected: form.intensity === 1 }" @click="form.intensity = 1">低</view>
              <view class="radio-item" :class="{ selected: form.intensity === 2 }" @click="form.intensity = 2">中</view>
              <view class="radio-item" :class="{ selected: form.intensity === 3 }" @click="form.intensity = 3">高</view>
            </view>
          </view>

          <!-- 感受 -->
          <view class="form-group">
            <text class="form-label">运动感受</text>
            <view class="radio-group">
              <view class="radio-item" :class="{ selected: form.feeling === 1 }" @click="form.feeling = 1">轻松</view>
              <view class="radio-item" :class="{ selected: form.feeling === 2 }" @click="form.feeling = 2">适中</view>
              <view class="radio-item" :class="{ selected: form.feeling === 3 }" @click="form.feeling = 3">吃力</view>
            </view>
          </view>

          <!-- 预估消耗 -->
          <view class="calorie-preview" v-if="estimatedCalories > 0">
            <text class="cp-label">预估消耗</text>
            <text class="cp-value">{{ estimatedCalories }} kcal</text>
          </view>

          <button class="submit-btn" @click="submitRecord" :disabled="!canSubmit">保存记录</button>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import request from '../../utils/request'
import { API } from '../../config'

const userId = ref(null)
const activeTab = ref('today')
const showRecordModal = ref(false)
const calendarYear = ref(new Date().getFullYear())
const calendarMonth = ref(new Date().getMonth() + 1)
const calendarData = ref({ days: [], totalDays: 0 })
const todayRecords = ref([])
const allRecords = ref([])
const exerciseLibrary = ref([])
const selectedExercise = ref(null)
const focusId = ref('')

const form = ref({
  durationMinutes: '',
  intensity: 2,
  feeling: 2
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

const exerciseCategories = computed(() => {
  const cats = {
    cardio: { key: 'cardio', name: '有氧', items: [] },
    strength: { key: 'strength', name: '无氧', items: [] },
    flexibility: { key: 'flexibility', name: '拉伸', items: [] },
    hiit: { key: 'hiit', name: 'HIIT', items: [] }
  }
  exerciseLibrary.value.forEach(ex => {
    if (cats[ex.category]) cats[ex.category].items.push(ex)
  })
  return Object.values(cats).filter(c => c.items.length > 0)
})

const estimatedCalories = computed(() => {
  if (!selectedExercise.value || !form.value.durationMinutes) return 0
  const met = selectedExercise.value.metValue || 5
  const weight = uni.getStorageSync('userProfile')?.weight || 65
  return Math.round(met * weight * (form.value.durationMinutes / 60))
})

const canSubmit = computed(() => {
  return selectedExercise.value && form.value.durationMinutes > 0
})

const calendarDays = computed(() => {
  const year = calendarYear.value
  const month = calendarMonth.value
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const days = []
  for (let i = 0; i < firstDay; i++) days.push({ date: null, day: null, hasExercise: false, isToday: false })

  const exerciseDates = {}
  if (calendarData.value.days) {
    calendarData.value.days.forEach(d => {
      if (d.hasExercise) exerciseDates[d.date] = true
    })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push({ date: dateStr, day: d, hasExercise: !!exerciseDates[dateStr], isToday: dateStr === todayStr })
  }
  return days
})

const totalExerciseDays = computed(() => calendarData.value.totalDays || 0)

const groupedRecords = computed(() => {
  const groups = {}
  allRecords.value.forEach(r => {
    const date = r.recordTime ? r.recordTime.split('T')[0] || r.recordTime.split(' ')[0] : 'unknown'
    if (!groups[date]) groups[date] = []
    groups[date].push(r)
  })
  return groups
})

const formatGroupDate = (date) => {
  const today = new Date().toISOString().split('T')[0]
  if (date === today) return '今天'
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (date === yesterday) return '昨天'
  const parts = date.split('-')
  return `${parts[1]}月${parts[2]}日`
}

const formatTime = (t) => {
  if (!t) return ''
  if (t.includes('T')) return t.split('T')[1]?.substring(0, 5) || ''
  if (t.includes(' ')) return t.split(' ')[1]?.substring(0, 5) || ''
  return t
}

const changeMonth = (delta) => {
  let m = calendarMonth.value + delta
  let y = calendarYear.value
  if (m < 1) { m = 12; y-- }
  if (m > 12) { m = 1; y++ }
  calendarMonth.value = m
  calendarYear.value = y
  loadCalendar()
}

const selectExercise = (ex) => { selectedExercise.value = ex }

const loadCalendar = async () => {
  try {
    const res = await request({
      url: API.EXERCISE_CALENDAR,
      method: 'GET',
      data: { userId: userId.value, year: calendarYear.value, month: calendarMonth.value }
    })
    if (res.code === 200 && res.data) calendarData.value = res.data
  } catch (err) {
    console.error('加载日历失败', err)
  }
}

const loadTodayRecords = async () => {
  try {
    const res = await request({
      url: API.EXERCISE_RECORDS,
      method: 'GET',
      data: { userId: userId.value, days: 1 }
    })
    if (res.code === 200 && res.data) todayRecords.value = res.data
  } catch (err) {
    console.error('加载今日记录失败', err)
  }
}

const loadAllRecords = async () => {
  try {
    const res = await request({
      url: API.EXERCISE_RECORDS,
      method: 'GET',
      data: { userId: userId.value, days: 30 }
    })
    if (res.code === 200 && res.data) allRecords.value = res.data
  } catch (err) {
    console.error('加载全部记录失败', err)
  }
}

const loadExerciseLibrary = async () => {
  try {
    const res = await request({
      url: API.EXERCISE_LIBRARY,
      method: 'GET'
    })
    if (res.code === 200 && res.data) exerciseLibrary.value = res.data
  } catch (err) {
    console.error('加载运动库失败', err)
  }
}

const submitRecord = async () => {
  if (!canSubmit.value) return
  try {
    const res = await request({
      url: API.EXERCISE_RECORD,
      method: 'POST',
      data: {
        userId: userId.value,
        exerciseId: selectedExercise.value.id,
        exerciseName: selectedExercise.value.name,
        category: selectedExercise.value.category,
        durationMinutes: parseInt(form.value.durationMinutes),
        caloriesBurned: estimatedCalories.value,
        intensity: form.value.intensity,
        feeling: form.value.feeling,
        recordTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
      }
    })
    if (res.code === 200) {
      uni.showToast({ title: '记录成功', icon: 'success' })
      showRecordModal.value = false
      selectedExercise.value = null
      form.value = { durationMinutes: '', intensity: 2, feeling: 2 }
      loadTodayRecords()
      loadAllRecords()
      loadCalendar()
    }
  } catch (err) {
    uni.showToast({ title: '记录失败', icon: 'none' })
  }
}

const deleteRecord = (id) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条运动记录吗？',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await request({
          url: API.EXERCISE_RECORD + '/' + id + '?userId=' + userId.value,
          method: 'DELETE'
        })
        uni.showToast({ title: '已删除', icon: 'success' })
        loadTodayRecords()
        loadAllRecords()
        loadCalendar()
      } catch (err) {
        uni.showToast({ title: '删除失败', icon: 'none' })
      }
    }
  })
}

onMounted(() => {
  userId.value = uni.getStorageSync('userId')
  if (!userId.value) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => uni.reLaunch({ url: '/pages/login/login' }), 1500)
    return
  }
  loadCalendar()
  loadTodayRecords()
  loadAllRecords()
  loadExerciseLibrary()
})
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(180deg, #FFF3E0 0%, #FFF8F0 20%, #FFF8F0 100%);
  padding: 24rpx;
  padding-bottom: 180rpx;
}

.card {
  background: #ffffff;
  border-radius: 28rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 6rpx 24rpx rgba(92, 64, 51, 0.06);
}

.calendar-card { animation: slideUp 0.4s ease both; }

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30rpx); }
  to { opacity: 1; transform: translateY(0); }
}

.cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.cal-nav {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #FFF3E0;
}

.cal-nav-arrow { font-size: 36rpx; color: #FF8C42; font-weight: bold; }
.cal-title { font-size: 30rpx; font-weight: bold; color: #5C4033; }

.cal-weekdays {
  display: flex;
  margin-bottom: 12rpx;
}

.cal-weekday {
  flex: 1;
  text-align: center;
  font-size: 22rpx;
  color: #B8956A;
}

.cal-grid { display: flex; flex-wrap: wrap; }

.cal-day {
  width: 14.28%;
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.cal-day-num { font-size: 24rpx; color: #5C4033; }
.cal-day.today .cal-day-num { color: #FF8C42; font-weight: bold; }
.cal-day.empty { visibility: hidden; }

.cal-dot {
  width: 10rpx;
  height: 10rpx;
  background: #4caf50;
  border-radius: 50%;
  margin-top: 4rpx;
}

.cal-day.exercised .cal-day-num { color: #4caf50; font-weight: 600; }

.cal-summary {
  margin-top: 16rpx;
  text-align: center;
  padding-top: 16rpx;
  border-top: 1rpx solid #FFF3E8;
}

.cal-summary-text { font-size: 24rpx; color: #FF8C42; font-weight: 600; }

.tab-bar {
  display: flex;
  background: #FFF3E8;
  border-radius: 20rpx;
  padding: 6rpx;
  margin-bottom: 24rpx;
  animation: slideUp 0.4s ease 0.1s both;
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

.empty-state {
  text-align: center;
  padding: 60rpx 0;
}

.empty-icon { display: block; font-size: 60rpx; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: #B8956A; }

.record-item {
  animation: slideUp 0.4s ease both;
}

.record-group { margin-bottom: 16rpx; }

.group-date {
  display: block;
  font-size: 24rpx;
  font-weight: 600;
  color: #B8956A;
  margin-bottom: 12rpx;
  margin-left: 8rpx;
}

.ri-header { display: flex; align-items: center; gap: 16rpx; }

.ri-icon-wrap {
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

.ri-icon { font-size: 28rpx; }
.ri-info { flex: 1; }
.ri-name { display: block; font-size: 28rpx; font-weight: 600; color: #5C4033; }
.ri-time { display: block; font-size: 22rpx; color: #B8956A; margin-top: 4rpx; }
.ri-data { text-align: right; }
.ri-duration { display: block; font-size: 24rpx; color: #B8956A; }
.ri-cal { display: block; font-size: 28rpx; font-weight: 600; color: #FF8C42; margin-top: 4rpx; }

.ri-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16rpx;
  padding-top: 12rpx;
  border-top: 1rpx solid #FFF3E8;
}

.ri-tag {
  font-size: 20rpx;
  padding: 4rpx 16rpx;
  border-radius: 10rpx;
}

.intensity-1 { background: #E8F5E9; color: #2e7d32; }
.intensity-2 { background: #FFF3E0; color: #e65100; }
.intensity-3 { background: #FFEBEE; color: #c62828; }

.ri-delete {
  font-size: 22rpx;
  color: #B8956A;
  padding: 8rpx;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx;
  background: #FFF8F0;
  z-index: 10;
}

.add-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #FF8C42, #FFD93D);
  color: #ffffff;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.add-btn::after { border: none; }

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 999;
}

.modal-box {
  width: 100%;
  max-height: 85vh;
  background: #fff;
  border-radius: 28rpx 28rpx 0 0;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid #FFE5D0;
}

.modal-title { font-size: 32rpx; font-weight: bold; color: #5C4033; }
.modal-close { font-size: 36rpx; color: #B8956A; padding: 10rpx; }

.modal-body { padding: 24rpx 32rpx; max-height: 65vh; }

.form-group { margin-bottom: 28rpx; }
.form-label { display: block; font-size: 28rpx; font-weight: 600; color: #5C4033; margin-bottom: 16rpx; }

.form-input {
  width: 100%;
  height: 80rpx;
  background: #FFF8F0;
  border: 2rpx solid #FFE5D0;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #5C4033;
  box-sizing: border-box;
}

.exercise-picker { max-height: 300rpx; overflow-y: auto; }

.ep-category { margin-bottom: 16rpx; }
.ep-cat-name { font-size: 22rpx; color: #B8956A; margin-bottom: 8rpx; display: block; }
.ep-items { display: flex; flex-wrap: wrap; gap: 12rpx; }

.ep-item {
  padding: 12rpx 24rpx;
  background: #FFF8F0;
  border: 2rpx solid #FFE5D0;
  border-radius: 20rpx;
  transition: all 0.2s ease;
}

.ep-item.selected {
  background: #FF8C42;
  border-color: #FF8C42;
}

.ep-item-name { font-size: 24rpx; color: #5C4033; }
.ep-item.selected .ep-item-name { color: #ffffff; }

.radio-group { display: flex; gap: 16rpx; }

.radio-item {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  background: #FFF8F0;
  border: 2rpx solid #FFE5D0;
  border-radius: 16rpx;
  font-size: 26rpx;
  color: #5C4033;
  transition: all 0.2s ease;
}

.radio-item.selected {
  background: #FF8C42;
  border-color: #FF8C42;
  color: #ffffff;
}

.calorie-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 24rpx;
  background: #FFF3E0;
  border-radius: 16rpx;
  margin-bottom: 28rpx;
}

.cp-label { font-size: 26rpx; color: #5C4033; }
.cp-value { font-size: 32rpx; font-weight: bold; color: #FF8C42; }

.submit-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #FF8C42, #FFD93D);
  color: #ffffff;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: 600;
  border: none;
  margin-top: 16rpx;
}

.submit-btn::after { border: none; }
.submit-btn[disabled] { opacity: 0.5; }
</style>
