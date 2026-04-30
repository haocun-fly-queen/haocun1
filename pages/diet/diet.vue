<template>
  <view class="container">
    <!-- 日期显示和视图切换 -->
    <view class="header-section">
      <view class="date-display-card">
        <view class="date-icon">📅</view>
        <view class="date-info">
          <text class="date-label">{{ viewType === 'day' ? '日期' : (viewType === 'week' ? '周' : '月') }}</text>
          <text class="date-value">{{ displayDateRange }}</text>
        </view>
      </view>
      
      <!-- 视图切换按钮 -->
      <view class="view-switch">
        <button class="view-btn" :class="{ active: viewType === 'day' }" @click="switchView('day')">日</button>
        <button class="view-btn" :class="{ active: viewType === 'week' }" @click="switchView('week')">周</button>
        <button class="view-btn" :class="{ active: viewType === 'month' }" @click="switchView('month')">月</button>
      </view>
      
      <!-- 日期导航 -->
      <view class="date-nav">
        <text class="nav-btn" @click="prevPeriod">← 上一{{ viewType === 'day' ? '天' : (viewType === 'week' ? '周' : '月') }}</text>
        <text class="nav-today" @click="goToday">今天</text>
        <text class="nav-btn" @click="nextPeriod">下一{{ viewType === 'day' ? '天' : (viewType === 'week' ? '周' : '月') }} →</text>
      </view>
    </view>

    <!-- 餐次筛选 -->
    <view class="meal-filter">
      <text class="filter-label">餐次筛选：</text>
      <view class="filter-buttons">
        <button class="filter-btn" :class="{ active: mealFilter === 0 }" @click="mealFilter = 0">全部</button>
        <button class="filter-btn" :class="{ active: mealFilter === 1 }" @click="mealFilter = 1">早餐</button>
        <button class="filter-btn" :class="{ active: mealFilter === 2 }" @click="mealFilter = 2">午餐</button>
        <button class="filter-btn" :class="{ active: mealFilter === 3 }" @click="mealFilter = 3">晚餐</button>
        <button class="filter-btn" :class="{ active: mealFilter === 4 }" @click="mealFilter = 4">加餐</button>
      </view>
    </view>

    <!-- 当日总热量 -->
    <view class="total-calories">
      <text class="label">{{ viewType === 'day' ? '当日总热量' : (viewType === 'week' ? '本周总热量' : '本月总热量') }}</text>
      <text class="value">{{ filteredTotalCalories }}</text>
      <text class="unit">kcal</text>
    </view>

    <!-- 周视图：周统计卡片 -->
    <view class="week-stats" v-if="viewType === 'week'">
      <view class="week-grid">
        <view v-for="day in weekData" :key="day.date" class="week-day" :class="{ today: day.isToday }" @click="selectWeekDay(day.date)">
          <text class="week-day-name">{{ day.dayName }}</text>
          <text class="week-day-date">{{ day.date.substring(5) }}</text>
          <text class="week-day-calorie">{{ day.totalCalories }} kcal</text>
        </view>
      </view>
    </view>

    <!-- 月视图：日历 -->
    <view class="month-view" v-if="viewType === 'month'">
      <view class="calendar-header">
        <text v-for="week in ['一', '二', '三', '四', '五', '六', '日']" :key="week" class="calendar-weekday">{{ week }}</text>
      </view>
      <view class="calendar-body">
        <view v-for="(week, weekIndex) in monthData" :key="weekIndex" class="calendar-week">
          <view v-for="(day, dayIndex) in week" :key="dayIndex" class="calendar-day" :class="{ 'other-month': !day.isCurrentMonth, 'today': day.isToday, 'has-record': day.hasRecord }" @click="selectMonthDay(day.date)">
            <text class="calendar-day-num">{{ day.day }}</text>
            <text v-if="day.hasRecord" class="calendar-day-dot">●</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 自定义食物按钮区域 -->
    <view class="custom-food-btn-area">
      <button class="custom-food-btn add-btn" @click="openCustomFoodDialog">+ 新增自定义食物</button>
      <button class="custom-food-btn list-btn" @click="openCustomFoodList">📋 我的自定义食物</button>
    </view>

    <!-- 饮食记录列表 -->
    <view class="record-list" v-if="filteredRecords.length > 0">
      <view v-for="record in filteredRecords" :key="record.id" class="record-item">
        <view class="record-header">
          <text class="meal-type">{{ getMealTypeName(record.mealType) }}</text>
          <text class="time">{{ formatTime(record.mealTime) }}</text>
          <text class="calorie">{{ record.totalCalorie }} kcal</text>
        </view>
        
        <view class="food-list" v-if="record.items && record.items.length">
          <view v-for="(item, index) in record.items" :key="index" class="food-item">
            <text class="food-name">{{ item.foodName }}</text>
            <text class="food-weight">{{ item.eatWeight }}g</text>
            <text class="food-calorie">{{ item.calorie }} kcal</text>
          </view>
        </view>
        
        <view class="record-footer">
          <text class="remark">{{ record.remark || '无备注' }}</text>
          <text class="delete" @click="deleteRecord(record.id)">删除</text>
        </view>
      </view>
    </view>
    
    <!-- 空状态 -->
    <view v-if="filteredRecords.length === 0 && !loading" class="empty">
      <view class="empty-chicken">
        <view class="ec-body"></view>
        <view class="ec-eye el"></view>
        <view class="ec-eye er"></view>
        <view class="ec-beak"></view>
        <view class="ec-blush bl"></view>
        <view class="ec-blush br"></view>
      </view>
      <text class="empty-text">暂无饮食记录</text>
      <text class="empty-hint">{{ isTodayView ? '点击拍照识别添加记录' : '该日期暂无记录' }}</text>
      <button v-if="isTodayView" class="goto-camera-btn" @click="goToCamera">去拍照识别</button>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading">
      <view class="mini-loader">
        <view class="ml-body"></view>
        <view class="ml-eye me1"></view>
        <view class="ml-eye me2"></view>
      </view>
      <text>小鸡正在加载...</text>
    </view>

    <!-- 自定义食物添加弹窗 -->
    <view class="modal-mask add-food-mask" v-if="showCustomFoodDialog" @click="closeCustomFoodDialog">
      <view class="modal-container" @click.stop>
        <view class="modal-header">
          <text class="modal-title">添加自定义食物</text>
          <text class="modal-close" @click="closeCustomFoodDialog">×</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">食物名称</text>
            <input class="form-input" v-model="customFood.name" placeholder="请输入食物名称" />
          </view>
          <view class="form-item">
            <text class="form-label">热量 (kcal/100g)</text>
            <input class="form-input" type="digit" v-model="customFood.calorie" placeholder="请输入热量" />
          </view>
          <view class="form-item">
            <text class="form-label">碳水 (g/100g)</text>
            <input class="form-input" type="digit" v-model="customFood.carbs" placeholder="请输入碳水" />
          </view>
          <view class="form-item">
            <text class="form-label">蛋白质 (g/100g)</text>
            <input class="form-input" type="digit" v-model="customFood.protein" placeholder="请输入蛋白质" />
          </view>
          <view class="form-item">
            <text class="form-label">脂肪 (g/100g)</text>
            <input class="form-input" type="digit" v-model="customFood.fat" placeholder="请输入脂肪" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="cancel-btn" @click="closeCustomFoodDialog">取消</button>
          <button class="confirm-btn" @click="saveCustomFood" :disabled="savingCustomFood">保存</button>
        </view>
      </view>
    </view>

    <!-- 自定义食物列表弹窗（多选模式） -->
    <view class="modal-mask" v-if="showCustomFoodList" @click="closeCustomFoodList">
      <view class="modal-container food-select-modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">我的自定义食物</text>
          <text class="modal-close" @click="closeCustomFoodList">×</text>
        </view>
        
        <view class="modal-body">
          <view class="add-food-tip" @click="openCustomFoodDialog">
            <text>+ 添加新食物</text>
          </view>
          
          <!-- 餐次选择 -->
          <view class="meal-selector">
            <text class="meal-label">添加到：</text>
            <view class="meal-buttons">
              <button 
                class="meal-option-btn" 
                :class="{ active: selectedMealType === 1 }"
                @click="selectedMealType = 1"
              >早餐</button>
              <button 
                class="meal-option-btn" 
                :class="{ active: selectedMealType === 2 }"
                @click="selectedMealType = 2"
              >午餐</button>
              <button 
                class="meal-option-btn" 
                :class="{ active: selectedMealType === 3 }"
                @click="selectedMealType = 3"
              >晚餐</button>
              <button 
                class="meal-option-btn" 
                :class="{ active: selectedMealType === 4 }"
                @click="selectedMealType = 4"
              >加餐</button>
            </view>
          </view>
          
          <!-- 多选食物列表 -->
          <scroll-view class="food-list-scroll" scroll-y>
            <view v-for="food in customFoodList" :key="food.id" class="custom-food-item" @click="toggleSelectFood(food)">
              <view class="custom-food-checkbox">
                <view class="checkbox-icon" :class="{ checked: selectedFoodIds.includes(food.id) }">
                  <text v-if="selectedFoodIds.includes(food.id)" class="checkbox-check">✓</text>
                </view>
              </view>
              <view class="custom-food-info">
                <text class="custom-food-name">{{ food.name }}</text>
                <text class="custom-food-calorie">{{ food.caloriePer100g }} kcal/100g</text>
              </view>
              <view class="custom-food-weight-input" @click.stop>
                <text class="weight-label">重量(g)</text>
                <input 
                  class="weight-input" 
                  type="number" 
                  :value="foodWeightMap[food.id]"
                  @input="(e) => updateFoodWeight(food.id, e.detail.value)"
                  placeholder="克"
                />
              </view>
              <text class="custom-food-delete" @click.stop="deleteCustomFood(food.id)">删除</text>
            </view>
            <view v-if="customFoodList.length === 0" class="no-custom-food">
              <text>暂无自定义食物，点击上方添加</text>
            </view>
          </scroll-view>
        </view>
        
        <!-- 底部操作栏 -->
        <view class="modal-footer-bar" v-if="customFoodList.length > 0">
          <view class="selected-info">
            <text class="selected-count">已选 {{ selectedFoodIds.length }} 种食物</text>
            <text class="selected-calorie">合计 {{ selectedTotalCalories }} kcal</text>
          </view>
          <view class="action-buttons">
            <button class="select-all-btn" @click="toggleSelectAll">
              {{ selectedFoodIds.length === customFoodList.length ? '取消全选' : '全选' }}
            </button>
            <button class="confirm-add-btn" @click="batchAddSelectedFoods" :disabled="selectedFoodIds.length === 0">
              添加到{{ selectedMealType === 1 ? '早餐' : (selectedMealType === 2 ? '午餐' : (selectedMealType === 3 ? '晚餐' : '加餐')) }} ({{ selectedFoodIds.length }})
            </button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import request from '../../utils/request'
import { API } from '../../config'

const userId = ref(null)
const records = ref([])
const loading = ref(false)

// 视图类型：day, week, month
const viewType = ref('day')
// 餐次筛选：0-全部，1-早餐，2-午餐，3-晚餐，4-加餐
const mealFilter = ref(0)

// 日期相关
const currentDate = ref(new Date())
const currentYear = ref(0)
const currentMonth = ref(0)
const currentDay = ref(0)

// 周数据
const weekData = ref([])
// 月数据
const monthData = ref([])

// 自定义食物相关
const showCustomFoodDialog = ref(false)
const showCustomFoodList = ref(false)
const savingCustomFood = ref(false)
const customFoodList = ref([])
const customFood = ref({
  name: '',
  calorie: '',
  carbs: '',
  protein: '',
  fat: ''
})

// 多选相关
const selectedFoodIds = ref([])
const foodWeightMap = ref({})

// 当前选择的餐次
const selectedMealType = ref(2)

// 合计热量
const selectedTotalCalories = computed(() => {
  let total = 0
  for (const foodId of selectedFoodIds.value) {
    const food = customFoodList.value.find(f => f.id === foodId)
    if (food) {
      let weight = foodWeightMap.value[foodId]
      if (weight === '' || weight === null || weight === undefined || weight <= 0) {
        weight = 100
      }
      total += (food.caloriePer100g * Number(weight) / 100)
    }
  }
  return Math.round(total)
})

// 判断当前查看的日期是否是今天（仅日视图有效）
const isTodayView = computed(() => {
  if (viewType.value !== 'day') return false
  const today = new Date()
  const viewDate = currentDate.value
  return today.toDateString() === viewDate.toDateString()
})

// 初始化当前年月日
const initDate = () => {
  const date = currentDate.value
  currentYear.value = date.getFullYear()
  currentMonth.value = date.getMonth() + 1
  currentDay.value = date.getDate()
}

// 获取日期范围显示文本
const displayDateRange = computed(() => {
  if (viewType.value === 'day') {
    return formatDisplayDate(currentDate.value)
  } else if (viewType.value === 'week') {
    const start = getWeekStart(currentDate.value)
    const end = getWeekEnd(currentDate.value)
    return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`
  } else {
    return `${currentYear.value}年${currentMonth.value}月`
  }
})

// 格式化显示日期
const formatDisplayDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const weekday = weekdays[date.getDay()]
  return `${year}.${month}.${day} ${weekday}`
}

// 获取周开始（周一）
const getWeekStart = (date) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - diff)
  return d
}

// 获取周结束（周日）
const getWeekEnd = (date) => {
  const d = getWeekStart(date)
  d.setDate(d.getDate() + 6)
  return d
}

// 上一周期
const prevPeriod = () => {
  const newDate = new Date(currentDate.value)
  if (viewType.value === 'day') {
    newDate.setDate(newDate.getDate() - 1)
  } else if (viewType.value === 'week') {
    newDate.setDate(newDate.getDate() - 7)
  } else {
    newDate.setMonth(newDate.getMonth() - 1)
  }
  currentDate.value = newDate
  initDate()
  loadData()
}

// 下一周期
const nextPeriod = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const newDate = new Date(currentDate.value)
  newDate.setHours(0, 0, 0, 0)
  
  if (viewType.value === 'day') {
    newDate.setDate(newDate.getDate() + 1)
    if (newDate.getTime() > today.getTime()) {
      uni.showToast({ title: '不能查看未来日期', icon: 'none' })
      return
    }
  } else if (viewType.value === 'week') {
    newDate.setDate(newDate.getDate() + 7)
    const weekEnd = getWeekEnd(newDate)
    weekEnd.setHours(0, 0, 0, 0)
    if (weekEnd.getTime() > today.getTime()) {
      uni.showToast({ title: '不能查看未来日期', icon: 'none' })
      return
    }
  } else {
    newDate.setMonth(newDate.getMonth() + 1)
    const firstDayOfMonth = new Date(newDate.getFullYear(), newDate.getMonth(), 1)
    firstDayOfMonth.setHours(0, 0, 0, 0)
    if (firstDayOfMonth.getTime() > today.getTime()) {
      uni.showToast({ title: '不能查看未来日期', icon: 'none' })
      return
    }
  }
  
  currentDate.value = newDate
  initDate()
  loadData()
}

// 回到今天
const goToday = () => {
  currentDate.value = new Date()
  initDate()
  loadData()
}

// 切换视图
const switchView = (type) => {
  viewType.value = type
  loadData()
}

// 生成周数据
const generateWeekData = () => {
  const start = getWeekStart(currentDate.value)
  const weekDays = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    const dayRecords = records.value.filter(r => r.mealTime && r.mealTime.substring(0, 10) === dateStr)
    const totalCalories = dayRecords.reduce((sum, r) => sum + (r.totalCalorie || 0), 0)
    weekDays.push({
      date: dateStr,
      dayName: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i],
      totalCalories: totalCalories,
      isToday: date.toDateString() === new Date().toDateString()
    })
  }
  weekData.value = weekDays
}

// 生成月数据
const generateMonthData = () => {
  const year = currentYear.value
  const month = currentMonth.value
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const startWeekday = firstDay.getDay() || 7
  const daysInMonth = lastDay.getDate()
  
  const prevMonthLastDay = new Date(year, month - 1, 0).getDate()
  
  const calendar = []
  let week = []
  
  for (let i = startWeekday - 1; i > 0; i--) {
    const day = prevMonthLastDay - i + 1
    week.push({
      day: day,
      date: `${year}-${String(month - 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      isCurrentMonth: false,
      isToday: false,
      hasRecord: false
    })
  }
  
  const today = new Date()
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dayRecords = records.value.filter(r => r.mealTime && r.mealTime.substring(0, 10) === dateStr)
    week.push({
      day: d,
      date: dateStr,
      isCurrentMonth: true,
      isToday: today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === d,
      hasRecord: dayRecords.length > 0
    })
    
    if (week.length === 7) {
      calendar.push(week)
      week = []
    }
  }
  
  if (week.length > 0) {
    let nextMonthDay = 1
    while (week.length < 7) {
      week.push({
        day: nextMonthDay++,
        date: `${year}-${String(month + 1).padStart(2, '0')}-${String(nextMonthDay - 1).padStart(2, '0')}`,
        isCurrentMonth: false,
        isToday: false,
        hasRecord: false
      })
    }
    calendar.push(week)
  }
  
  monthData.value = calendar
}

// 选择周视图中的某一天
const selectWeekDay = (date) => {
  if (date) {
    currentDate.value = new Date(date)
    initDate()
    viewType.value = 'day'
    loadData()
  }
}

// 选择月视图中的某一天
const selectMonthDay = (date) => {
  if (date) {
    currentDate.value = new Date(date)
    initDate()
    viewType.value = 'day'
    loadData()
  }
}

// 获取餐次名称
const getMealTypeName = (type) => {
  const names = { 1: '早餐', 2: '午餐', 3: '晚餐', 4: '加餐' }
  return names[type] || '未知'
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  return time.substring(11, 16)
}

// 筛选后的记录
const filteredRecords = computed(() => {
  let result = records.value
  
  if (viewType.value === 'day') {
    const dateStr = currentDate.value.toISOString().split('T')[0]
    result = result.filter(r => r.mealTime && r.mealTime.substring(0, 10) === dateStr)
  }
  
  if (mealFilter.value !== 0) {
    result = result.filter(r => r.mealType === mealFilter.value)
  }
  
  return result.sort((a, b) => new Date(b.mealTime) - new Date(a.mealTime))
})

// 筛选后的总热量
const filteredTotalCalories = computed(() => {
  if (viewType.value === 'day') {
    return filteredRecords.value.reduce((sum, r) => sum + (r.totalCalorie || 0), 0)
  } else {
    return records.value.reduce((sum, r) => sum + (r.totalCalorie || 0), 0)
  }
})

// 加载饮食记录
const loadData = async () => {
  if (!userId.value) return
  
  loading.value = true
  
  let startDate, endDate
  
  if (viewType.value === 'day') {
    const dateStr = currentDate.value.toISOString().split('T')[0]
    startDate = dateStr
    endDate = dateStr
  } else if (viewType.value === 'week') {
    const start = getWeekStart(currentDate.value)
    const end = getWeekEnd(currentDate.value)
    startDate = start.toISOString().split('T')[0]
    endDate = end.toISOString().split('T')[0]
  } else {
    const year = currentYear.value
    const month = currentMonth.value
    startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`
  }
  
  try {
    const res = await request({
      url: API.DIET_RECORDS,
      method: 'GET',
      data: { 
        userId: userId.value, 
        startDate: startDate,
        endDate: endDate
      }
    })
    
    if (res.code === 200) {
      records.value = res.data || []
      for (let record of records.value) {
        await loadRecordItems(record.id)
      }
      
      if (viewType.value === 'week') {
        generateWeekData()
      } else if (viewType.value === 'month') {
        generateMonthData()
      }
    }
  } catch (err) {
    console.error('加载记录失败', err)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// 加载记录详情
const loadRecordItems = async (recordId) => {
  try {
    const res = await request({
      url: `${API.DIET_RECORD_DETAIL}/${recordId}`,
      method: 'GET'
    })
    if (res.code === 200) {
      const record = records.value.find(r => r.id === recordId)
      if (record) {
        record.items = res.items || []
      }
    }
  } catch (err) {
    console.error('加载详情失败', err)
  }
}

// 删除记录
const deleteRecord = (recordId) => {
  uni.showModal({
    title: '提示',
    content: '确定删除这条记录吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          const result = await request({
            url: `${API.DIET_RECORD_DETAIL}/${recordId}?userId=${userId.value}`,
            method: 'DELETE'
          })
          if (result.code === 200) {
            uni.showToast({ title: '删除成功', icon: 'success' })
            loadData()
          } else {
            uni.showToast({ title: result.message || '删除失败', icon: 'none' })
          }
        } catch (err) {
          console.error('删除失败', err)
          uni.showToast({ title: '删除失败，请重试', icon: 'none' })
        }
      }
    }
  })
}

// 跳转到拍照页面
const goToCamera = () => {
  let presetMealType = 1
  if (mealFilter.value === 1) presetMealType = 1
  else if (mealFilter.value === 2) presetMealType = 2
  else if (mealFilter.value === 3) presetMealType = 3
  else if (mealFilter.value === 4) presetMealType = 4
  
  uni.redirectTo({
    url: `/pages/camera/camera?mealType=${presetMealType}`
  })
}

// ==================== 自定义食物相关方法 ====================

// 打开自定义食物添加弹窗
const openCustomFoodDialog = () => {
  customFood.value = {
    name: '',
    calorie: '',
    carbs: '',
    protein: '',
    fat: ''
  }
  
  if (showCustomFoodList.value) {
    showCustomFoodList.value = false
    setTimeout(() => {
      showCustomFoodDialog.value = true
    }, 150)
  } else {
    showCustomFoodDialog.value = true
  }
}

// 关闭自定义食物添加弹窗
const closeCustomFoodDialog = () => {
  showCustomFoodDialog.value = false
}

// 打开自定义食物列表
const openCustomFoodList = () => {
  loadCustomFoodList()
  selectedFoodIds.value = []
  foodWeightMap.value = {}
  // 初始化餐次选择：优先使用当前筛选的餐次
  if (mealFilter.value !== 0) {
    selectedMealType.value = mealFilter.value
  } else {
    selectedMealType.value = 2
  }
  showCustomFoodList.value = true
}

// 关闭自定义食物列表
const closeCustomFoodList = () => {
  showCustomFoodList.value = false
}

// 加载自定义食物列表
const loadCustomFoodList = async () => {
  try {
    const res = await request({
      url: API.FOOD_CUSTOM_LIST,
      method: 'GET',
      data: { userId: userId.value }
    })
    if (res.code === 200) {
      customFoodList.value = res.data || []
      for (const food of customFoodList.value) {
        if (foodWeightMap.value[food.id] === undefined) {
          foodWeightMap.value[food.id] = 100
        }
      }
    }
  } catch (err) {
    console.error('加载自定义食物失败', err)
  }
}

// 保存自定义食物
const saveCustomFood = async () => {
  if (!customFood.value.name) {
    uni.showToast({ title: '请输入食物名称', icon: 'none' })
    return
  }
  if (!customFood.value.calorie) {
    uni.showToast({ title: '请输入热量', icon: 'none' })
    return
  }
  
  savingCustomFood.value = true
  try {
    const res = await request({
      url: API.FOOD_CUSTOM_ADD,
      method: 'POST',
      data: {
        userId: userId.value,
        name: customFood.value.name,
        caloriePer100g: parseFloat(customFood.value.calorie),
        carbsPer100g: parseFloat(customFood.value.carbs) || 0,
        proteinPer100g: parseFloat(customFood.value.protein) || 0,
        fatPer100g: parseFloat(customFood.value.fat) || 0
      }
    })
    
    if (res.code === 200) {
      uni.showToast({ title: '添加成功', icon: 'success' })
      closeCustomFoodDialog()
      loadCustomFoodList()
    } else {
      uni.showToast({ title: res.message || '添加失败', icon: 'none' })
    }
  } catch (err) {
    console.error('保存失败', err)
    uni.showToast({ title: '添加失败', icon: 'none' })
  } finally {
    savingCustomFood.value = false
  }
}

// 删除自定义食物
const deleteCustomFood = async (foodId) => {
  uni.showModal({
    title: '提示',
    content: '确定删除这个自定义食物吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          const result = await request({
            url: `${API.FOOD_CUSTOM_DELETE}/${foodId}?userId=${userId.value}`,
            method: 'DELETE'
          })
          if (result.code === 200) {
            uni.showToast({ title: '删除成功', icon: 'success' })
            loadCustomFoodList()
          } else {
            uni.showToast({ title: result.message || '删除失败', icon: 'none' })
          }
        } catch (err) {
          console.error('删除失败', err)
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
  })
}

// 切换食物选中状态
const toggleSelectFood = (food) => {
  const index = selectedFoodIds.value.indexOf(food.id)
  if (index === -1) {
    selectedFoodIds.value.push(food.id)
  } else {
    selectedFoodIds.value.splice(index, 1)
  }
}

// 全选/取消全选
const toggleSelectAll = () => {
  if (selectedFoodIds.value.length === customFoodList.value.length) {
    selectedFoodIds.value = []
  } else {
    selectedFoodIds.value = customFoodList.value.map(f => f.id)
  }
}

// 更新食物重量
const updateFoodWeight = (foodId, value) => {
  if (value === '' || value === null || value === undefined) {
    foodWeightMap.value[foodId] = ''
    return
  }
  
  let weight = parseFloat(value)
  if (!isNaN(weight) && weight > 0) {
    foodWeightMap.value[foodId] = weight
  }
}

// 批量添加选中的食物
const batchAddSelectedFoods = async () => {
  if (selectedFoodIds.value.length === 0) {
    uni.showToast({ title: '请先选择食物', icon: 'none' })
    return
  }
  
  uni.showLoading({ title: '添加中...', mask: true })
  
  const mealType = selectedMealType.value
  
  const items = []
  for (const foodId of selectedFoodIds.value) {
    const food = customFoodList.value.find(f => f.id === foodId)
    if (food) {
      let weight = foodWeightMap.value[foodId]
      if (weight === '' || weight === null || weight === undefined || weight <= 0) {
        weight = 100
      }
      weight = Number(weight)
      
      items.push({
        foodType: 2,
        foodId: food.id,
        foodName: food.name,
        eatWeight: weight,
        calorie: (food.caloriePer100g * weight / 100).toFixed(0),
        carbs: ((food.carbsPer100g || 0) * weight / 100).toFixed(1),
        protein: ((food.proteinPer100g || 0) * weight / 100).toFixed(1),
        fat: ((food.fatPer100g || 0) * weight / 100).toFixed(1)
      })
    }
  }
  
  try {
    const res = await request({
      url: API.DIET_RECORD,
      method: 'POST',
      data: {
        userId: userId.value,
        mealType: mealType,
        mealTime: new Date().toISOString(),
        remark: `批量添加自定义食物`,
        items: items
      }
    })
    
    uni.hideLoading()
    
    if (res.code === 200) {
      uni.showToast({ title: `成功添加 ${items.length} 种食物`, icon: 'success' })
      closeCustomFoodList()
      loadData()
    } else {
      uni.showToast({ title: res.message || '添加失败', icon: 'none' })
    }
  } catch (err) {
    uni.hideLoading()
    console.error('批量添加失败', err)
    uni.showToast({ title: '添加失败', icon: 'none' })
  }
}

// 页面显示时刷新数据
const onPageShow = () => {
  console.log('饮食记录页面显示，刷新数据')
  if (userId.value) {
    loadData()
    loadCustomFoodList()
  }
}

// 页面加载
onMounted(() => {
  userId.value = uni.getStorageSync('userId')
  initDate()
  
  if (userId.value) {
    loadData()
    loadCustomFoodList()
  } else {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/login/login' })
    }, 1500)
  }
  
  uni.$on('refreshDietRecords', () => {
    console.log('收到刷新饮食记录事件')
    loadData()
  })
})

// 监听页面显示（uni-app 生命周期，兼容所有平台）
onPageShow(() => {
  console.log('饮食记录页面显示，刷新数据')
  if (userId.value) {
    loadData()
    loadCustomFoodList()
  }
})

onUnmounted(() => {
  uni.$off('refreshDietRecords')
})
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #FFF8F0;
  padding: 30rpx;
}

/* 自定义食物按钮区域 */
.custom-food-btn-area {
  display: flex;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.custom-food-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  font-size: 28rpx;
  border-radius: 44rpx;
  color: #ffffff;
  border: none;
}

.custom-food-btn.add-btn {
  background: linear-gradient(135deg, #FF8C42 0%, #FFD93D 100%);
}

.custom-food-btn.list-btn {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
}

.custom-food-btn:active {
  transform: scale(0.98);
  opacity: 0.9;
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

.add-food-mask {
  z-index: 2000 !important;
}

.modal-container {
  width: 650rpx;
  max-height: 85%;
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
  border-bottom: 1rpx solid #FFE5D0;
}

.modal-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #5C4033;
}

.modal-close {
  font-size: 44rpx;
  color: #B8956A;
  line-height: 1;
  padding: 0 10rpx;
}

.modal-body {
  padding: 20rpx 30rpx;
  flex: 1;
  overflow: auto;
  max-height: 60vh;
}

/* 餐次选择器 */
.meal-selector {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #eee;
  margin-bottom: 10rpx;
}

.meal-label {
  font-size: 28rpx;
  color: #8B6914;
  display: block;
  margin-bottom: 15rpx;
}

.meal-buttons {
  display: flex;
  gap: 15rpx;
}

.meal-option-btn {
  flex: 1;
  height: 60rpx;
  line-height: 60rpx;
  font-size: 26rpx;
  background-color: #FFF8F0;
  color: #8B6914;
  border-radius: 30rpx;
  border: none;
}

.meal-option-btn.active {
  background: linear-gradient(135deg, #FF8C42 0%, #FFD93D 100%);
  color: #ffffff;
}

/* 多选食物列表样式 */
.custom-food-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.custom-food-checkbox {
  margin-right: 20rpx;
}

.checkbox-icon {
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid #ddd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
}

.checkbox-icon.checked {
  background: linear-gradient(135deg, #FF8C42 0%, #FFD93D 100%);
  border-color: #FF8C42;
}

.checkbox-check {
  color: #fff;
  font-size: 24rpx;
  font-weight: bold;
}

.custom-food-info {
  flex: 2;
}

.custom-food-name {
  display: block;
  font-size: 30rpx;
  color: #5C4033;
  margin-bottom: 8rpx;
}

.custom-food-calorie {
  font-size: 24rpx;
  color: #B8956A;
}

.custom-food-weight-input {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.weight-label {
  font-size: 24rpx;
  color: #8B6914;
}

.weight-input {
  width: 100rpx;
  height: 60rpx;
  border: 1rpx solid #e5e5e5;
  border-radius: 8rpx;
  text-align: center;
  font-size: 26rpx;
  background-color: #f8f9fa;
}

.custom-food-delete {
  color: #ff6b6b;
  font-size: 26rpx;
  padding: 10rpx 20rpx;
  margin-left: 10rpx;
}

.add-food-tip {
  text-align: center;
  padding: 20rpx;
  background-color: #f5f7fa;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  color: #FF8C42;
  font-size: 28rpx;
}

.no-custom-food {
  text-align: center;
  padding: 60rpx;
  color: #B8956A;
}

.food-list-scroll {
  max-height: 500rpx;
}

/* 底部操作栏 */
.modal-footer-bar {
  padding: 20rpx 30rpx 30rpx;
  border-top: 1rpx solid #eee;
  background-color: #fff;
}

.selected-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;
  padding: 10rpx 0;
}

.selected-count {
  font-size: 28rpx;
  color: #5C4033;
  font-weight: 500;
}

.selected-calorie {
  font-size: 28rpx;
  color: #FF8C42;
  font-weight: bold;
}

.action-buttons {
  display: flex;
  gap: 20rpx;
}

.select-all-btn {
  flex: 1;
  height: 70rpx;
  line-height: 70rpx;
  border-radius: 35rpx;
  font-size: 28rpx;
  background-color: #FFF8F0;
  color: #8B6914;
  border: none;
}

.confirm-add-btn {
  flex: 2;
  height: 70rpx;
  line-height: 70rpx;
  border-radius: 35rpx;
  font-size: 28rpx;
  background: linear-gradient(135deg, #FF8C42 0%, #FFD93D 100%);
  color: #ffffff;
  border: none;
}

.confirm-add-btn[disabled] {
  opacity: 0.5;
}

.form-item {
  margin-bottom: 25rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #8B6914;
  margin-bottom: 12rpx;
}

.form-input {
  width: 100%;
  height: 70rpx;
  border: 1rpx solid #e5e5e5;
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
  background-color: #FFF8F0;
  color: #8B6914;
}

.confirm-btn {
  background: linear-gradient(135deg, #FF8C42 0%, #FFD93D 100%);
  color: #ffffff;
}

/* 以下为原有样式 */
.header-section {
  margin-bottom: 30rpx;
}

.date-display-card {
  background: linear-gradient(135deg, #FF8C42 0%, #FFD93D 100%);
  border-radius: 20rpx;
  padding: 25rpx 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(102, 126, 234, 0.3);
}

.date-icon {
  font-size: 48rpx;
}

.date-info {
  flex: 1;
}

.date-label {
  display: block;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8rpx;
}

.date-value {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #ffffff;
}

.view-switch {
  display: flex;
  gap: 15rpx;
  margin-bottom: 20rpx;
}

.view-btn {
  flex: 1;
  height: 70rpx;
  line-height: 70rpx;
  font-size: 28rpx;
  background-color: #ffffff;
  color: #8B6914;
  border-radius: 35rpx;
}

.view-btn.active {
  background: linear-gradient(135deg, #FF8C42 0%, #FFD93D 100%);
  color: #ffffff;
}

.date-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 20rpx;
}

.nav-btn {
  font-size: 26rpx;
  color: #FF8C42;
  padding: 10rpx;
}

.nav-today {
  font-size: 28rpx;
  font-weight: bold;
  color: #5C4033;
  padding: 10rpx 20rpx;
  background-color: #f0e6ff;
  border-radius: 30rpx;
}

.meal-filter {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 30rpx;
}

.filter-label {
  font-size: 26rpx;
  color: #8B6914;
  display: block;
  margin-bottom: 15rpx;
}

.filter-buttons {
  display: flex;
  gap: 15rpx;
  flex-wrap: wrap;
}

.filter-btn {
  flex: 1;
  min-width: 100rpx;
  height: 60rpx;
  line-height: 60rpx;
  font-size: 26rpx;
  background-color: #FFF8F0;
  color: #8B6914;
  border-radius: 30rpx;
}

.filter-btn.active {
  background: linear-gradient(135deg, #FF8C42 0%, #FFD93D 100%);
  color: #ffffff;
}

.total-calories {
  background: linear-gradient(135deg, #FF8C42 0%, #FFD93D 100%);
  border-radius: 20rpx;
  padding: 40rpx;
  text-align: center;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(102, 126, 234, 0.3);
}

.total-calories .label {
  display: block;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 15rpx;
}

.total-calories .value {
  font-size: 72rpx;
  font-weight: bold;
  color: #ffffff;
  line-height: 1;
}

.total-calories .unit {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-left: 10rpx;
}

.week-stats {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 20rpx;
  margin-bottom: 30rpx;
}

.week-grid {
  display: flex;
  justify-content: space-around;
}

.week-day {
  text-align: center;
  padding: 15rpx 10rpx;
  border-radius: 16rpx;
  min-width: 80rpx;
}

.week-day.today {
  background-color: #f0e6ff;
}

.week-day-name {
  display: block;
  font-size: 26rpx;
  color: #8B6914;
  margin-bottom: 8rpx;
}

.week-day-date {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #5C4033;
  margin-bottom: 8rpx;
}

.week-day-calorie {
  display: block;
  font-size: 22rpx;
  color: #FF8C42;
}

.month-view {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 20rpx;
  margin-bottom: 30rpx;
  overflow-x: auto;
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  padding-bottom: 15rpx;
  border-bottom: 1rpx solid #eee;
}

.calendar-weekday {
  font-size: 26rpx;
  color: #B8956A;
}

.calendar-body {
  margin-top: 15rpx;
}

.calendar-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 15rpx;
}

.calendar-day {
  text-align: center;
  padding: 15rpx 0;
  position: relative;
  border-radius: 12rpx;
}

.calendar-day-num {
  font-size: 28rpx;
  color: #5C4033;
}

.calendar-day.other-month .calendar-day-num {
  color: #ccc;
}

.calendar-day.today {
  background-color: #f0e6ff;
}

.calendar-day.has-record {
  background-color: #FFF8F0;
}

.calendar-day-dot {
  position: absolute;
  bottom: 2rpx;
  left: 50%;
  transform: translateX(-50%);
  font-size: 16rpx;
  color: #4caf50;
}

.record-list {
  margin-bottom: 30rpx;
}

.record-item {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.record-header {
  display: flex;
  align-items: baseline;
  margin-bottom: 20rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.meal-type {
  font-size: 32rpx;
  font-weight: bold;
  color: #5C4033;
  flex: 1;
}

.time {
  font-size: 24rpx;
  color: #B8956A;
  margin-right: 20rpx;
}

.calorie {
  font-size: 30rpx;
  font-weight: bold;
  color: #FF8C42;
}

.food-list {
  margin-bottom: 20rpx;
  background-color: #f8f9fa;
  border-radius: 12rpx;
  padding: 10rpx 0;
}

.food-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15rpx 20rpx;
  border-bottom: 1rpx solid #FFE5D0;
}

.food-item:last-child {
  border-bottom: none;
}

.food-name {
  font-size: 28rpx;
  color: #5C4033;
  flex: 1;
}

.food-weight {
  font-size: 26rpx;
  color: #8B6914;
  margin-right: 20rpx;
}

.food-calorie {
  font-size: 26rpx;
  color: #ff6b6b;
  font-weight: 500;
}

.record-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15rpx;
}

.remark {
  font-size: 24rpx;
  color: #B8956A;
  flex: 1;
}

.delete {
  font-size: 26rpx;
  color: #ff6b6b;
  padding: 10rpx 20rpx;
  background-color: #fff5f5;
  border-radius: 30rpx;
}

.empty {
  text-align: center;
  padding: 100rpx 40rpx;
  background-color: #ffffff;
  border-radius: 20rpx;
}

.empty-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #8B6914;
  display: block;
  margin-bottom: 15rpx;
}

.empty-hint {
  font-size: 26rpx;
  color: #B8956A;
  display: block;
  margin-bottom: 40rpx;
}

.goto-camera-btn {
  background: linear-gradient(135deg, #FF8C42 0%, #FFD93D 100%);
  color: #ffffff;
  border-radius: 44rpx;
  width: 60%;
  height: 80rpx;
  line-height: 80rpx;
  font-size: 28rpx;
}

.loading {
  text-align: center;
  padding: 60rpx;
  color: #B8956A;
}

/* ========== 空状态小鸡 ========== */
.empty-chicken {
  width: 180rpx;
  height: 170rpx;
  position: relative;
  margin: 0 auto 40rpx;
}

.ec-body {
  width: 140rpx;
  height: 130rpx;
  background: linear-gradient(135deg, #FFD93D 0%, #FFB347 100%);
  border-radius: 50% 50% 45% 45%;
  position: absolute;
  top: 20rpx;
  left: 20rpx;
  animation: chickenBounce 2s ease-in-out infinite;
  box-shadow: 0 8rpx 24rpx rgba(255, 140, 66, 0.2);
}

.ec-body::before {
  content: '';
  position: absolute;
  top: -22rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 26rpx;
  height: 26rpx;
  background: #FF6B35;
  border-radius: 50% 50% 30% 30%;
  box-shadow: -14rpx 6rpx 0 -4rpx #FF6B35, 14rpx 6rpx 0 -4rpx #FF6B35;
}

.ec-eye {
  position: absolute;
  width: 14rpx;
  height: 14rpx;
  background: #333;
  border-radius: 50%;
  top: 55rpx;
  z-index: 2;
  animation: chickenBlink 4s ease-in-out infinite;
}

.ec-eye.el { left: 52rpx; }
.ec-eye.er { right: 52rpx; }

.ec-beak {
  position: absolute;
  bottom: 55rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 12rpx solid transparent;
  border-right: 12rpx solid transparent;
  border-top: 16rpx solid #FF6B35;
  z-index: 2;
}

.ec-blush {
  position: absolute;
  top: 78rpx;
  width: 18rpx;
  height: 10rpx;
  background: rgba(255, 107, 53, 0.2);
  border-radius: 50%;
}

.ec-blush.bl { left: 42rpx; }
.ec-blush.br { right: 42rpx; }

/* ========== 迷你加载小鸡 ========== */
.mini-loader {
  width: 80rpx;
  height: 80rpx;
  position: relative;
  margin: 0 auto 20rpx;
}

.ml-body {
  width: 50rpx;
  height: 45rpx;
  background: linear-gradient(135deg, #FFD93D 0%, #FFB347 100%);
  border-radius: 50% 50% 45% 45%;
  position: absolute;
  top: 20rpx;
  left: 15rpx;
  animation: loaderBounce 0.8s ease-in-out infinite;
}

.ml-body::before {
  content: '';
  position: absolute;
  top: -10rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6rpx solid transparent;
  border-right: 6rpx solid transparent;
  border-bottom: 12rpx solid #FF6B35;
}

.ml-eye {
  position: absolute;
  width: 6rpx;
  height: 6rpx;
  background: #333;
  border-radius: 50%;
  top: 32rpx;
  z-index: 2;
  animation: chickenBlink 3s ease-in-out infinite;
}

.ml-eye.me1 { left: 28rpx; }
.ml-eye.me2 { right: 28rpx; }
</style>