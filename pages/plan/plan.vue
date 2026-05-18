<template>
  <view class="container">
    <!-- ========== 顶部问候区 ========== -->
    <view class="greeting-section">
      <view class="gs-chicken-wrap">
        <view class="gs-chicken">
          <view class="gc-body"></view>
          <view class="gc-eye gc-l"></view>
          <view class="gc-eye gc-r"></view>
          <view class="gc-beak"></view>
          <view class="gc-wing"></view>
          <view class="gc-hat">🎓</view>
        </view>
      </view>
      <view class="gs-text">
        <text class="gs-greeting">{{ greeting }}</text>
        <text class="gs-date">{{ todayStr }}</text>
      </view>
    </view>

    <!-- ========== 今日进度条 ========== -->
    <view class="today-progress card">
      <view class="tp-header">
        <text class="tp-title">📋 今日进度</text>
        <text class="tp-count">{{ recordedCount }}/4 餐已记录</text>
      </view>
      <view class="tp-bar-track">
        <view class="tp-bar-fill" :style="{ width: (recordedCount / 4 * 100) + '%' }">
          <view class="tp-bar-shine"></view>
        </view>
      </view>
      <view class="tp-meals-indicator">
        <view v-for="m in mealIndicators" :key="m.type" class="tp-dot" :class="{ done: m.done }">
          <text class="tp-dot-icon">{{ m.done ? '✅' : m.icon }}</text>
          <text class="tp-dot-label">{{ m.name }}</text>
        </view>
      </view>
    </view>

    <!-- ========== 热量概览 ========== -->
    <view class="calorie-overview card">
      <view class="co-ring-wrap">
        <view class="co-ring">
          <view class="co-ring-bg"></view>
          <view class="co-ring-fill" :style="ringStyle"></view>
          <view class="co-ring-cover">
            <text class="co-remaining">{{ animatedCalories }}</text>
            <text class="co-label">剩余 kcal</text>
          </view>
        </view>
      </view>
      <view class="co-stats">
        <view class="co-stat">
          <view class="co-stat-icon target-icon">🎯</view>
          <text class="co-stat-num">{{ targetCalories }}</text>
          <text class="co-stat-label">目标</text>
        </view>
        <view class="co-divider"></view>
        <view class="co-stat">
          <view class="co-stat-icon eaten-icon">🍽️</view>
          <text class="co-stat-num">{{ consumedCalories }}</text>
          <text class="co-stat-label">已摄入</text>
        </view>
        <view class="co-divider"></view>
        <view class="co-stat">
          <view class="co-stat-icon remain-icon">⚡</view>
          <text class="co-stat-num">{{ remainingCalories }}</text>
          <text class="co-stat-label">剩余</text>
        </view>
      </view>
    </view>

    <!-- ========== 饮水打卡 ========== -->
    <view class="water-tracker card">
      <view class="wt-header">
        <text class="wt-title">💧 今日饮水</text>
        <text class="wt-count">{{ waterCount }}/8 杯</text>
      </view>
      <view class="wt-cups">
        <view
          v-for="i in 8" :key="i"
          class="wt-cup"
          :class="{ filled: i <= waterCount }"
          @click="toggleWater(i)"
        >
          <text class="wt-cup-icon">{{ i <= waterCount ? '💧' : '🫗' }}</text>
        </view>
      </view>
      <view class="wt-bar-track">
        <view class="wt-bar-fill" :style="{ width: (waterCount / 8 * 100) + '%' }"></view>
      </view>
    </view>

    <!-- ========== 小唧推荐（上移到饮水下方） ========== -->
    <view class="recommend-section card" v-if="!dailyPlan">
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
        <text class="rec-hint-text">{{ generateHint }}</text>
      </view>

      <button class="rec-btn" :class="{ breathing: !isGenerating }" @click="generateDailyPlan" :disabled="isGenerating">
        <view v-if="!isGenerating" class="rec-btn-content">
          <view class="rec-btn-chicken">
            <view class="rbc-body"></view>
            <view class="rbc-eye rbc-l"></view>
            <view class="rbc-eye rbc-r"></view>
            <view class="rbc-beak"></view>
          </view>
          <text class="rec-btn-text">点击小唧给您量身推荐剩余{{ remainingMealCount }}餐</text>
        </view>
        <view v-else class="btn-loader">
          <view class="rec-btn-chicken thinking">
            <view class="rbc-body"></view>
            <view class="rbc-eye rbc-l"></view>
            <view class="rbc-eye rbc-r"></view>
            <view class="rbc-beak"></view>
          </view>
          <text class="bl-text">小唧正在思考...</text>
          <view class="bl-dots">
            <view class="bl-dot"></view>
            <view class="bl-dot"></view>
            <view class="bl-dot"></view>
          </view>
        </view>
      </button>
    </view>

    <!-- ========== 已记录餐次（时间线样式） ========== -->
    <view class="recorded-section card" v-if="todayMeals.length > 0">
      <view class="rs-header">
        <text class="rs-title">📝 今日已记录</text>
      </view>
      <view class="timeline">
        <view v-for="(meal, index) in todayMeals" :key="index" class="tl-item">
          <view class="tl-dot-wrap">
            <view class="tl-dot" :class="'dot-' + meal.type"></view>
          </view>
          <view class="tl-content">
            <view class="tl-header">
              <view class="tl-badge" :class="'type-' + meal.type">{{ meal.typeName }}</view>
              <text class="tl-cal">{{ meal.calories }} kcal</text>
            </view>
            <view class="tl-foods">
              <text class="tl-food-text">{{ meal.foods || '未记录食物' }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- ========== 营养小贴士 ========== -->
    <view class="tip-card card" v-if="!dailyPlan">
      <view class="tip-header">
        <text class="tip-icon">📌</text>
        <text class="tip-title">营养小贴士</text>
      </view>
      <text class="tip-content">{{ dailyTip }}</text>
    </view>

    <!-- ========== 全天方案总览 ========== -->
    <view v-if="dailyPlan" class="daily-plan-section">

      <!-- 每餐方案卡片 -->
      <view
        v-for="(meal, idx) in dailyPlan.meals"
        :key="idx"
        class="meal-plan-card card"
        :class="{ 'meal-recorded': meal.recorded }"
        :style="{ animationDelay: (idx * 0.12) + 's' }"
      >
        <!-- 餐次头部 -->
        <view class="mp-header">
          <view class="mp-badge" :class="'type-' + meal.mealTypeCode">
            {{ meal.mealType }}
          </view>
          <view class="mp-cal">
            <text class="mp-cal-num">{{ meal.totalCalories }}</text>
            <text class="mp-cal-unit">kcal</text>
          </view>
          <view v-if="meal.recorded" class="mp-recorded-tag">✅ 已记录</view>
        </view>

        <!-- 食物列表（带分类图标） -->
        <view class="mp-foods">
          <view v-for="(food, fi) in meal.foods" :key="fi" class="mp-food-row">
            <view class="mp-food-icon">{{ getFoodIcon(food.name) }}</view>
            <view class="mp-food-main">
              <text class="mp-food-name">{{ food.name }}</text>
              <text class="mp-food-amount">{{ food.amount }}</text>
            </view>
            <view class="mp-food-nutrients">
              <text class="mp-food-cal">{{ food.calories }}kcal</text>
              <view class="mp-nutrient-tags">
                <text class="nt carbs">碳{{ food.carbs || 0 }}g</text>
                <text class="nt protein">蛋{{ food.protein || 0 }}g</text>
                <text class="nt fat">脂{{ food.fat || 0 }}g</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 营养占比条 -->
        <view class="mp-nutrition-bar" v-if="meal.nutrition">
          <view class="nb-track">
            <view class="nb-segment carbs" :style="{ width: (meal.nutrition.carbs || 33) + '%' }">
              <text v-if="(meal.nutrition.carbs || 0) > 15">{{ meal.nutrition.carbs }}%</text>
            </view>
            <view class="nb-segment protein" :style="{ width: (meal.nutrition.protein || 33) + '%' }">
              <text v-if="(meal.nutrition.protein || 0) > 15">{{ meal.nutrition.protein }}%</text>
            </view>
            <view class="nb-segment fat" :style="{ width: (meal.nutrition.fat || 34) + '%' }">
              <text v-if="(meal.nutrition.fat || 0) > 15">{{ meal.nutrition.fat }}%</text>
            </view>
          </view>
          <view class="nb-legend">
            <text class="nl-item"><view class="nl-dot carbs"></view>碳水</text>
            <text class="nl-item"><view class="nl-dot protein"></view>蛋白质</text>
            <text class="nl-item"><view class="nl-dot fat"></view>脂肪</text>
          </view>
        </view>

        <!-- 推荐理由 -->
        <view class="mp-reason" v-if="meal.reason">
          <text class="reason-text">{{ meal.reason }}</text>
        </view>

        <!-- 操作按钮 -->
        <view class="mp-actions" v-if="!meal.recorded">
          <button class="action-btn primary" @click="recordMealPlan(meal, idx)">
            ✅ 按此方案记录{{ meal.mealType }}
          </button>
        </view>
      </view>

      <!-- 每日总结 -->
      <view class="daily-summary card" v-if="dailyPlan.dailySummary">
        <view class="ds-title">📋 今日方案总结</view>
        <view class="ds-stats">
          <view class="ds-stat">
            <text class="ds-num">{{ dailyPlan.dailySummary.totalCalories }}</text>
            <text class="ds-label">总热量</text>
          </view>
          <view class="ds-stat">
            <text class="ds-num">{{ dailyPlan.dailySummary.totalCarbs || '-' }}</text>
            <text class="ds-label">碳水 g</text>
          </view>
          <view class="ds-stat">
            <text class="ds-num">{{ dailyPlan.dailySummary.totalProtein || '-' }}</text>
            <text class="ds-label">蛋白质 g</text>
          </view>
          <view class="ds-stat">
            <text class="ds-num">{{ dailyPlan.dailySummary.totalFat || '-' }}</text>
            <text class="ds-label">脂肪 g</text>
          </view>
        </view>
        <view class="ds-advice" v-if="dailyPlan.dailySummary.advice">
          <text>{{ dailyPlan.dailySummary.advice }}</text>
        </view>
      </view>

      <!-- 底部操作 -->
      <view class="bottom-actions">
        <button class="action-btn secondary" @click="regenerateDaily">🔄 让小唧重新推荐</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import request from '../../utils/request'
import { API } from '../../config'

const userId = ref(null)
const userProfile = ref(null)
const todayMeals = ref([])
const targetCalories = ref(2000)
const consumedCalories = ref(0)
const remainingCalories = ref(2000)
const isGenerating = ref(false)
const dailyPlan = ref(null)
const progressPercent = ref(0)
const generateHint = ref('')
const animatedCalories = ref(0)
const ringPercent = ref(0)
const waterCount = ref(0)

// ========== 营养小贴士库 ==========
const tips = [
  '蛋白质是减脂期的好朋友，每餐保证一个拳头大小的优质蛋白',
  '吃饭时细嚼慢咽，每口咀嚼20次以上，有助于消化和控制食量',
  '蔬菜应该占每餐的一半以上，颜色越丰富营养越全面',
  '减脂不等于不吃脂肪，适量的坚果和橄榄油对身体有益',
  '喝水不足会影响新陈代谢，每天至少喝8杯水',
  '睡前3小时尽量不要进食，给身体足够的消化时间',
  '主食不要完全不吃，选择粗粮替代精制米面更健康',
  '水果虽然健康但含糖量不低，每天控制在200-350克为宜',
  '鸡蛋是最完美的蛋白质来源之一，每天1-2个完全没问题',
  '烹饪方式很重要：蒸煮 > 炖 > 炒 > 煎 > 炸'
]

const dailyTip = computed(() => {
  const today = new Date()
  const idx = (today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate()) % tips.length
  return tips[idx]
})

// ========== 小唧台词 ==========
const chickenSays = computed(() => {
  const remaining = remainingMealCount.value
  const consumed = consumedCalories.value
  if (consumed === 0) return '今天还没吃呢！让我帮你安排~'
  if (remaining === 0) return '今天都吃好啦！真棒~'
  if (remainingCalories.value < 0) return '热量有点超了，下面要控制哦~'
  if (remaining === 1) return '还剩1餐，我来帮你安排！'
  return `还剩${remaining}餐，交给我吧！`
})

// ========== 计算属性 ==========

const todayStr = computed(() => {
  const d = new Date()
  const weekDay = ['日','一','二','三','四','五','六'][d.getDay()]
  return `${d.getMonth() + 1}月${d.getDate()}日 周${weekDay}`
})

const greeting = computed(() => {
  const h = new Date().getHours()
  const p = userProfile.value
  const name = p?.nickname || '你'
  if (h < 6) return `${name}，夜深了早点休息 🌙`
  if (h < 11) return `早上好${name}！记得吃早餐 ☀️`
  if (h < 14) return `中午好${name}！该吃午餐啦 🍚`
  if (h < 18) return `下午好${name}！补充能量 💪`
  return `晚上好${name}！晚餐别太晚 🌆`
})

const recordedCount = computed(() => todayMeals.value.length)

const remainingMealCount = computed(() => {
  const recordedTypes = todayMeals.value.map(m => m.type)
  return [1, 2, 3, 4].filter(t => !recordedTypes.includes(t)).length
})

const mealIndicators = computed(() => {
  const recordedTypes = todayMeals.value.map(m => m.type)
  return [
    { type: 1, name: '早餐', icon: '🌅', done: recordedTypes.includes(1) },
    { type: 2, name: '午餐', icon: '☀️', done: recordedTypes.includes(2) },
    { type: 3, name: '晚餐', icon: '🌙', done: recordedTypes.includes(3) },
    { type: 4, name: '加餐', icon: '🍎', done: recordedTypes.includes(4) }
  ]
})

const ringStyle = computed(() => {
  const deg = (ringPercent.value / 100) * 360
  return {
    background: `conic-gradient(#FF8C42 ${deg}deg, #FFE5D0 ${deg}deg)`
  }
})

// ========== 食物图标映射 ==========
const getFoodIcon = (name) => {
  if (!name) return '🍽️'
  const iconMap = {
    '饭': '🍚', '粥': '🍚', '面': '🍜', '馒头': '🍞', '面包': '🍞',
    '麦': '🥣', '薯': '🍠', '玉米': '🌽',
    '鸡': '🍗', '鸭': '🦆', '猪': '🥩', '牛': '🥩',
    '羊': '🥩', '鱼': '🐟', '虾': '🦐', '蟹': '🦀', '蛋': '🥚',
    '豆腐': '🧈', '豆': '🫘', '奶': '🥛', '酸奶': '🥛',
    '西兰花': '🥦', '菠菜': '🥬', '白菜': '🥬', '青菜': '🥬',
    '胡萝卜': '🥕', '番茄': '🍅', '黄瓜': '🥒', '茄子': '🍆',
    '土豆': '🥔', '洋葱': '🧅', '蘑菇': '🍄', '木耳': '🍄',
    '苹果': '🍎', '香蕉': '🍌', '橙': '🍊', '葡萄': '🍇',
    '草莓': '🍓', '西瓜': '🍉', '梨': '🍐', '桃': '🍑',
    '坚果': '🥜', '核桃': '🥜', '花生': '🥜',
    '汤': '🍲', '沙拉': '🥗'
  }
  for (const [key, icon] of Object.entries(iconMap)) {
    if (name.includes(key)) return icon
  }
  return '🍽️'
}

// ========== 数字滚动动画 ==========
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

// ========== 餐次类型映射 ==========
const getMealName = (type) => {
  const map = { 1: '早餐', 2: '午餐', 3: '晚餐', 4: '加餐' }
  return map[type] || '其他'
}

// ========== 饮水打卡 ==========
const toggleWater = (index) => {
  if (index === waterCount.value) {
    waterCount.value = index - 1
  } else {
    waterCount.value = index
  }
  const today = new Date().toDateString()
  uni.setStorageSync(`water_${today}`, waterCount.value)
}

const loadWaterCount = () => {
  const today = new Date().toDateString()
  waterCount.value = uni.getStorageSync(`water_${today}`) || 0
}

// ========== 用户数据加载 ==========

const loadUserProfile = () => {
  try {
    const profile = uni.getStorageSync('userProfile') || {}
    const userInfo = uni.getStorageSync('userInfo') || {}
    userProfile.value = {
      nickname: profile.nickname || userInfo.nickname || '',
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
  }
}

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
    calculateLocalGoal()
  }
  updateCalorieStatus()
}

const calculateLocalGoal = () => {
  const p = userProfile.value
  if (!p) return
  const bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age
  const base = p.gender === 1 ? bmr + 5 : bmr - 161
  const mult = [1.2, 1.375, 1.55, 1.725, 1.9][p.activityLevel - 1] || 1.2
  let target = Math.round(base * mult)
  if (p.goalType === 1) target = Math.round(target * 0.8)
  if (p.goalType === 2) target = Math.round(target * 1.1)
  targetCalories.value = target
}

// ========== 获取今日饮食记录 ==========
const loadTodayMeals = async () => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const res = await request({
      url: API.DIET_TODAY,
      method: 'GET',
      data: { userId: userId.value, date: today }
    })

    console.log('DIET_TODAY 返回:', JSON.stringify(res))

    if (res.code === 200) {
      consumedCalories.value = res.data || 0
      const meals = res.meals || []
      todayMeals.value = meals.map(m => ({
        type: m.type || 0,
        typeName: m.typeName || getMealName(m.type || 0),
        foods: m.foods || '',
        calories: m.calories || 0
      }))
      console.log('todayMeals:', JSON.stringify(todayMeals.value))
    } else {
      todayMeals.value = []
      consumedCalories.value = 0
    }
  } catch (err) {
    console.error('获取今日饮食失败', err)
    todayMeals.value = []
    consumedCalories.value = 0
  }
  updateCalorieStatus()
}

const updateCalorieStatus = () => {
  remainingCalories.value = targetCalories.value - consumedCalories.value
  const percent = targetCalories.value > 0
    ? Math.min(100, (consumedCalories.value / targetCalories.value) * 100)
    : 0
  progressPercent.value = percent

  setTimeout(() => {
    animateNumber(0, remainingCalories.value > 0 ? remainingCalories.value : 0, 1000, (v) => {
      animatedCalories.value = v
    })
    animateNumber(0, percent, 800, (v) => {
      ringPercent.value = v
    })
  }, 200)

  const recordedNames = todayMeals.value.map(m => m.typeName)
  const remainingMeals = ['早餐', '午餐', '晚餐', '加餐'].filter(n => !recordedNames.includes(n))

  if (consumedCalories.value === 0) {
    generateHint.value = `今天还没开始记录呢，让小唧帮你规划一日三餐吧`
  } else if (remainingCalories.value < 0) {
    generateHint.value = `热量超标了 ${Math.abs(remainingCalories.value)} kcal，小唧会推荐低卡方案`
  } else {
    generateHint.value = `已记录${recordedNames.join('、')}，剩余 ${remainingCalories.value} kcal`
  }
}

// ========== 核心：生成全天方案 ==========

const calculateBMR = () => {
  const p = userProfile.value
  if (!p) return 1500
  const bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age
  return (p.gender || 1) === 1 ? bmr + 5 : bmr - 161
}

const getNextMeals = () => {
  const allMeals = [
    { type: 1, name: '早餐' },
    { type: 2, name: '午餐' },
    { type: 3, name: '晚餐' },
    { type: 4, name: '加餐' }
  ]
  const recordedTypes = todayMeals.value.map(m => m.type)
  return allMeals.filter(m => !recordedTypes.includes(m.type))
}

const generateDailyPlan = async () => {
  if (isGenerating.value) return
  isGenerating.value = true

  try {
    await loadTodayMeals()

    const p = userProfile.value || {}
    const nextMeals = getNextMeals()

    if (nextMeals.length === 0) {
      uni.showToast({ title: '今日已全部记录完毕', icon: 'none' })
      isGenerating.value = false
      return
    }

    const params = {
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
        calories: m.calories
      })),
      targetMeals: nextMeals,
      targetMeal: nextMeals[0]
    }

    const res = await request({
      url: API.AI_DAILY_PLAN,
      method: 'POST',
      data: params,
      timeout: 30000
    })

    if (res.code === 200 && res.data) {
      dailyPlan.value = res.data
      const unrecorded = res.data.meals.filter(m => !m.recorded).length
      uni.showToast({ title: `小唧已推荐 ${unrecorded} 餐`, icon: 'success' })
    } else {
      throw new Error(res.message || '生成失败')
    }
  } catch (err) {
    console.error('全天规划失败', err)
    uni.showToast({ title: '小唧累了，请稍后再试', icon: 'none' })
  } finally {
    isGenerating.value = false
  }
}

// ========== 记录单餐方案 ==========
const recordMealPlan = async (meal, idx) => {
  uni.showModal({
    title: '确认记录',
    content: `确认记录${meal.mealType}方案（${meal.totalCalories} kcal）？`,
    success: async (res) => {
      if (!res.confirm) return
      try {
        const now = new Date()
        const mealTime = now.getFullYear() + '-' +
          String(now.getMonth() + 1).padStart(2, '0') + '-' +
          String(now.getDate()).padStart(2, '0') + ' ' +
          String(now.getHours()).padStart(2, '0') + ':' +
          String(now.getMinutes()).padStart(2, '0') + ':' +
          String(now.getSeconds()).padStart(2, '0')

        // =======================
        // 绝杀版重量解析（必生效）
        // =======================
        function getWeight(amount) {
          if (!amount) return 100;
          // 强制提取 g 前面的数字
          let reg = /(\d+)g/;
          let match = amount.match(reg);
          if (match && match[1]) {
            return parseInt(match[1]);
          }
          // 提取不到就返回 100，绝对不会 1
          return 100;
        }

        const items = meal.foods.map(f => ({
          foodName: f.name,
          eatWeight: getWeight(f.amount), // ✅ 这里必对
          calorie: f.calories || 0,
          carbs: f.carbs || 0,
          protein: f.protein || 0,
          fat: f.fat || 0
        }));

        const mealData = {
          userId: userId.value,
          mealType: meal.mealTypeCode,
          mealTime: mealTime,
          totalCalorie: meal.totalCalories,
          remark: meal.mealType + '（AI方案）',
          items: items
        }

        await request({ url: API.DIET_RECORD, method: 'POST', data: mealData })
        dailyPlan.value.meals[idx].recorded = true
        await loadTodayMeals()
        uni.showToast({ title: `${meal.mealType}记录成功`, icon: 'success' })
        uni.$emit('refreshHome')
        uni.$emit('refreshDashboard')
      } catch (err) {
        console.error('记录失败', err)
        uni.showToast({ title: '记录失败', icon: 'none' })
      }
    }
  })
}
const regenerateDaily = () => {
  dailyPlan.value = null
  generateDailyPlan()
}

// ========== 初始化 ==========
onMounted(() => {
  userId.value = uni.getStorageSync('userId')
  if (!userId.value) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => uni.reLaunch({ url: '/pages/login/login' }), 1500)
    return
  }
  loadUserProfile()
  loadTodayMeals()
  loadCalorieGoal()
  loadWaterCount()
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

.gc-hat {
  position: absolute;
  top: -8rpx;
  right: 6rpx;
  font-size: 28rpx;
  animation: hatWiggle 3s ease-in-out infinite;
}

@keyframes hatWiggle {
  0%, 100% { transform: rotate(-5deg); }
  50% { transform: rotate(5deg); }
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

/* ========== 今日进度条 ========== */
.today-progress { animation: slideUp 0.4s ease 0.1s both; }

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30rpx); }
  to { opacity: 1; transform: translateY(0); }
}

.tp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.tp-title { font-size: 28rpx; font-weight: bold; color: #5C4033; }
.tp-count { font-size: 24rpx; color: #FF8C42; font-weight: 600; }

.tp-bar-track {
  height: 16rpx;
  background: #FFE5D0;
  border-radius: 8rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
}

.tp-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #FF8C42, #FFD93D);
  border-radius: 8rpx;
  transition: width 0.8s ease;
  position: relative;
  overflow: hidden;
}

.tp-bar-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: shine 2s ease infinite;
}

@keyframes shine {
  0% { left: -100%; }
  100% { left: 100%; }
}

.tp-meals-indicator { display: flex; justify-content: space-around; }

.tp-dot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  opacity: 0.4;
  transition: all 0.3s ease;
}

.tp-dot.done { opacity: 1; transform: scale(1.05); }
.tp-dot-icon { font-size: 32rpx; }
.tp-dot-label { font-size: 22rpx; color: #B8956A; }
.tp-dot.done .tp-dot-label { color: #5C4033; font-weight: 500; }

/* ========== 热量概览 ========== */
.calorie-overview { animation: slideUp 0.4s ease 0.2s both; }

.co-ring-wrap { display: flex; justify-content: center; margin-bottom: 24rpx; }

.co-ring { width: 260rpx; height: 260rpx; position: relative; }

.co-ring-bg { position: absolute; inset: 0; border-radius: 50%; background: #FFE5D0; }
.co-ring-fill { position: absolute; inset: 0; border-radius: 50%; transition: background 0.8s ease; }

.co-ring-cover {
  position: absolute;
  inset: 18rpx;
  border-radius: 50%;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 4rpx 12rpx rgba(92, 64, 51, 0.05);
}

.co-remaining { font-size: 56rpx; font-weight: bold; color: #FF8C42; }
.co-label { font-size: 22rpx; color: #B8956A; }

.co-stats { display: flex; align-items: center; justify-content: space-around; }

.co-stat { display: flex; flex-direction: column; align-items: center; gap: 8rpx; }

.co-stat-icon {
  font-size: 32rpx;
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.target-icon { background: #FFF3E0; }
.eaten-icon { background: #E8F5E9; }
.remain-icon { background: #E3F2FD; }

.co-stat-num { font-size: 36rpx; font-weight: bold; color: #5C4033; }
.co-stat-label { font-size: 22rpx; color: #B8956A; }
.co-divider { width: 2rpx; height: 60rpx; background: #FFE5D0; }

/* ========== 饮水打卡 ========== */
.water-tracker { animation: slideUp 0.4s ease 0.3s both; }

.wt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.wt-title { font-size: 28rpx; font-weight: bold; color: #5C4033; }
.wt-count { font-size: 24rpx; color: #2196f3; font-weight: 600; }

.wt-cups { display: flex; justify-content: space-around; margin-bottom: 16rpx; }

.wt-cup {
  width: 64rpx;
  height: 64rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F5F5F5;
  transition: all 0.3s ease;
}

.wt-cup.filled { background: #E3F2FD; transform: scale(1.05); }
.wt-cup-icon { font-size: 28rpx; }

.wt-bar-track {
  height: 10rpx;
  background: #E3F2FD;
  border-radius: 5rpx;
  overflow: hidden;
}

.wt-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #42a5f5, #2196f3);
  border-radius: 5rpx;
  transition: width 0.5s ease;
}

/* ========== 小唧推荐区域 ========== */
.recommend-section {
  animation: slideUp 0.5s ease 0.35s both;
  background: linear-gradient(135deg, #FFFBF0, #FFF8F0);
  border: 2rpx solid #FFE5D0;
  overflow: hidden;
}

/* 小唧说话动画 */
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

/* 气泡 */
.rec-speech {
  flex: 1;
  position: relative;
  padding-top: 8rpx;
}

.rec-bubble {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 18rpx 24rpx;
  border: 2rpx solid #FFE5D0;
  position: relative;
  animation: bubblePop 0.4s ease;
}

@keyframes bubblePop {
  0% { opacity: 0; transform: scale(0.8); }
  50% { transform: scale(1.03); }
  100% { opacity: 1; transform: scale(1); }
}

.rec-bubble-text {
  font-size: 26rpx;
  color: #5C4033;
  line-height: 1.5;
  font-weight: 500;
}

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

/* 提示文字 */
.rec-hint {
  margin-bottom: 24rpx;
}

.rec-hint-text {
  font-size: 26rpx;
  color: #8B6914;
  line-height: 1.5;
}

/* 推荐按钮 */
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

.rec-btn-content {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.rec-btn-text { font-size: 30rpx; }

/* 按钮里的小鸡（更小版本） */
.rec-btn-chicken {
  width: 48rpx;
  height: 48rpx;
  position: relative;
  flex-shrink: 0;
}

.rec-btn-chicken.thinking {
  animation: thinkBounce 0.6s ease-in-out infinite;
}

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

.btn-loader {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

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

/* ========== 已记录餐次（时间线） ========== */
.recorded-section { animation: slideUp 0.4s ease 0.45s both; }

.rs-header { margin-bottom: 20rpx; }
.rs-title { font-size: 28rpx; font-weight: bold; color: #5C4033; }

.timeline { padding-left: 8rpx; }

.tl-item {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  padding-bottom: 20rpx;
}

.tl-item:last-child { padding-bottom: 0; }

.tl-dot-wrap {
  width: 28rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  z-index: 1;
  padding-top: 14rpx;
}

.tl-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  border: 4rpx solid #FF8C42;
  background: #fff;
}

.tl-dot.dot-1 { border-color: #FF8C42; }
.tl-dot.dot-2 { border-color: #4caf50; }
.tl-dot.dot-3 { border-color: #2196f3; }
.tl-dot.dot-4 { border-color: #9c27b0; }

.tl-content {
  flex: 1;
  background: #FFF8F0;
  border-radius: 16rpx;
  padding: 16rpx 20rpx;
}

.tl-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;
}

.tl-badge {
  padding: 4rpx 16rpx;
  border-radius: 12rpx;
  font-size: 22rpx;
  color: #fff;
  font-weight: 500;
}

.tl-badge.type-1 { background: linear-gradient(135deg, #FF8C42, #FFD93D); }
.tl-badge.type-2 { background: linear-gradient(135deg, #4caf50, #8bc34a); }
.tl-badge.type-3 { background: linear-gradient(135deg, #2196f3, #64b5f6); }
.tl-badge.type-4 { background: linear-gradient(135deg, #9c27b0, #ce93d8); }

.tl-cal { font-size: 26rpx; font-weight: 600; color: #FF8C42; }

.tl-food-text { font-size: 24rpx; color: #8B6914; line-height: 1.5; }

/* ========== 营养小贴士 ========== */
.tip-card {
  animation: slideUp 0.4s ease 0.55s both;
  background: linear-gradient(135deg, #FFF8E1, #FFFDE7);
  border: 2rpx solid #FFF3B0;
}

.tip-header { display: flex; align-items: center; gap: 10rpx; margin-bottom: 14rpx; }
.tip-icon { font-size: 28rpx; }
.tip-title { font-size: 26rpx; font-weight: bold; color: #5C4033; }
.tip-content { font-size: 24rpx; color: #8B6914; line-height: 1.6; }

/* ========== 全天方案卡片 ========== */
.meal-plan-card {
  border: 2rpx solid transparent;
  transition: all 0.3s ease;
  animation: mealSlideIn 0.5s ease both;
}

@keyframes mealSlideIn {
  from { opacity: 0; transform: translateY(40rpx) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.meal-plan-card.meal-recorded {
  opacity: 0.55;
  border-color: #c8e6c9;
  transform: scale(0.98);
}

.mp-header { display: flex; align-items: center; gap: 16rpx; margin-bottom: 24rpx; }

.mp-badge {
  padding: 10rpx 28rpx;
  border-radius: 30rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: #ffffff;
}

.mp-badge.type-1 { background: linear-gradient(135deg, #FF8C42, #FFD93D); }
.mp-badge.type-2 { background: linear-gradient(135deg, #4caf50, #8bc34a); }
.mp-badge.type-3 { background: linear-gradient(135deg, #2196f3, #64b5f6); }
.mp-badge.type-4 { background: linear-gradient(135deg, #9c27b0, #ce93d8); }

.mp-cal { display: flex; align-items: baseline; gap: 6rpx; }
.mp-cal-num { font-size: 40rpx; font-weight: bold; color: #FF8C42; }
.mp-cal-unit { font-size: 22rpx; color: #B8956A; }

.mp-recorded-tag { margin-left: auto; font-size: 24rpx; color: #4caf50; font-weight: 500; }

.mp-foods { margin-bottom: 24rpx; }

.mp-food-row {
  display: flex;
  align-items: flex-start;
  gap: 14rpx;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #FFF3E8;
}

.mp-food-row:last-child { border-bottom: none; }

.mp-food-icon {
  font-size: 32rpx;
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FFF8F0;
  border-radius: 12rpx;
  flex-shrink: 0;
}

.mp-food-main { flex: 1; }
.mp-food-name { display: block; font-size: 30rpx; font-weight: 500; color: #5C4033; }
.mp-food-amount { display: block; font-size: 24rpx; color: #B8956A; margin-top: 4rpx; }

.mp-food-nutrients { text-align: right; }
.mp-food-cal { display: block; font-size: 28rpx; font-weight: 600; color: #FF8C42; }

.mp-nutrient-tags { display: flex; gap: 8rpx; margin-top: 6rpx; }

.nt { font-size: 20rpx; padding: 3rpx 10rpx; border-radius: 10rpx; }
.nt.carbs { background: #FFF3E0; color: #e65100; }
.nt.protein { background: #E8F5E9; color: #2e7d32; }
.nt.fat { background: #FFEBEE; color: #c62828; }

.mp-nutrition-bar { margin-bottom: 20rpx; }

.nb-track {
  display: flex;
  height: 14rpx;
  border-radius: 7rpx;
  overflow: hidden;
  margin-bottom: 12rpx;
}

.nb-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.8s ease;
}

.nb-segment text { font-size: 14rpx; color: #ffffff; font-weight: 500; }
.nb-segment.carbs { background: #FF9800; }
.nb-segment.protein { background: #4CAF50; }
.nb-segment.fat { background: #f44336; }

.nb-legend { display: flex; justify-content: center; gap: 30rpx; }

.nl-item { display: flex; align-items: center; gap: 8rpx; font-size: 22rpx; color: #8B6914; }

.nl-dot { width: 14rpx; height: 14rpx; border-radius: 50%; }
.nl-dot.carbs { background: #FF9800; }
.nl-dot.protein { background: #4CAF50; }
.nl-dot.fat { background: #f44336; }

.mp-reason {
  background: #FFF8F0;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  border-left: 6rpx solid #FFD93D;
}

.reason-text { font-size: 24rpx; color: #8B6914; line-height: 1.6; }

.mp-actions { display: flex; gap: 16rpx; }

.action-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  transition: transform 0.2s ease;
}

.action-btn::after { border: none; }
.action-btn:active { transform: scale(0.96); }

.action-btn.primary { background: linear-gradient(135deg, #FF8C42, #FFD93D); color: #ffffff; }
.action-btn.secondary { background: #FFF3B0; color: #FF8C42; }

/* 每日总结 */
.daily-summary .ds-title { font-size: 30rpx; font-weight: bold; color: #5C4033; margin-bottom: 24rpx; }
.ds-stats { display: flex; justify-content: space-around; margin-bottom: 24rpx; }
.ds-stat { text-align: center; }
.ds-num { display: block; font-size: 36rpx; font-weight: bold; color: #FF8C42; }
.ds-label { font-size: 22rpx; color: #B8956A; margin-top: 6rpx; }

.ds-advice {
  background: #FFF8F0;
  border-radius: 16rpx;
  padding: 20rpx;
  font-size: 24rpx;
  color: #8B6914;
  line-height: 1.6;
  border-left: 6rpx solid #FFD93D;
}

.bottom-actions { padding: 20rpx 0 40rpx; }
</style>
