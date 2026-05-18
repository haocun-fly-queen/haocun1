<!-- pages/health/score.vue -->
<template>
  <view class="page">
    <!-- 加载态 -->
    <view class="loading-page" v-if="loading">
      <view class="loading-chicken-spin"></view>
      <text class="loading-text">小唧正在计算健康评分...</text>
    </view>

    <template v-if="!loading && scoreData">
      <!-- 中央大号环形评分 -->
      <view class="hero-score-section">
        <view class="hero-ring-wrap">
          <view class="hero-ring-outer">
            <view class="hero-ring-track"></view>
            <view class="hero-ring-fill" :style="heroRingStyle"></view>
            <view class="hero-ring-center">
              <text class="hero-score-number">{{ displayScore }}</text>
              <text class="hero-score-unit">分</text>
              <view class="hero-score-divider"></view>
              <text class="hero-score-level">{{ scoreLevel }}</text>
            </view>
          </view>
        </view>

        <view class="hero-meta">
          <text class="hero-date">评估日期：{{ formatDate(scoreData.reportDate) }}</text>
        </view>
      </view>

      <!-- 各分类评分 — 横向进度条 -->
      <view class="category-section">
        <text class="section-title">分类评分</text>
        <view class="category-list">
          <view
            class="category-row"
            v-for="(cat, index) in categoryList"
            :key="cat.key"
            :style="{ animationDelay: index * 0.08 + 's' }"
          >
            <view class="cat-row-top">
              <view class="cat-name-area">
                <view class="cat-dot" :style="{ background: cat.color }"></view>
                <text class="cat-name">{{ cat.name }}</text>
              </view>
              <text class="cat-score" :style="{ color: getScoreColor(cat.score) }">{{ cat.score }}</text>
            </view>
            <view class="cat-bar-wrap">
              <view class="cat-bar-bg">
                <view
                  class="cat-bar-fill"
                  :style="{
                    width: cat.score + '%',
                    background: getScoreColor(cat.score)
                  }"
                ></view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- AI 总结 -->
      <view class="ai-summary-section" v-if="scoreData.summary">
        <view class="ai-header">
          <view class="ai-avatar">
            <view class="mc-eye left"></view>
            <view class="mc-eye right"></view>
            <view class="mc-beak"></view>
          </view>
          <text class="ai-title">小唧的健康总结</text>
        </view>
        <view class="ai-bubble">
          <text class="ai-text">{{ scoreData.summary }}</text>
        </view>
      </view>

      <!-- 做得好的方面 / 需要关注的问题 -->
      <view class="highlights-section">
        <view
          class="highlight-card good"
          v-if="scoreData.positivePoints && scoreData.positivePoints.length"
        >
          <view class="highlight-header">
            <text class="highlight-icon">✨</text>
            <text class="highlight-title">做得好的方面</text>
          </view>
          <view class="highlight-list">
            <view class="highlight-item" v-for="(point, i) in scoreData.positivePoints" :key="'g' + i">
              <view class="highlight-dot good-dot"></view>
              <text class="highlight-text">{{ point }}</text>
            </view>
          </view>
        </view>

        <view
          class="highlight-card warn"
          v-if="scoreData.topConcerns && scoreData.topConcerns.length"
        >
          <view class="highlight-header">
            <text class="highlight-icon">🔔</text>
            <text class="highlight-title">需要关注的问题</text>
          </view>
          <view class="highlight-list">
            <view class="highlight-item" v-for="(concern, i) in scoreData.topConcerns" :key="'w' + i">
              <view class="highlight-dot warn-dot"></view>
              <text class="highlight-text">{{ concern }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 免责声明 -->
      <view class="disclaimer-section">
        <text class="disclaimer-text">
          ⚠️ AI分析结果仅供参考，不构成医学诊断。如有健康问题，请咨询专业医生。
        </text>
      </view>
    </template>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import request from '../../utils/request'
import { API } from '../../config'

const loading = ref(true)
const scoreData = ref(null)
const displayScore = ref(0)

const categoryConfig = {
  blood_routine: { name: '血常规', color: '#f44336' },
  liver: { name: '肝功能', color: '#FF9800' },
  kidney: { name: '肾功能', color: '#795548' },
  lipid: { name: '血脂', color: '#FF5722' },
  blood_sugar: { name: '血糖', color: '#E91E63' },
  thyroid: { name: '甲状腺', color: '#9C27B0' },
  urine: { name: '尿常规', color: '#2196F3' },
  tumor_marker: { name: '肿瘤标志物', color: '#f44336' },
  other: { name: '其他', color: '#607D8B' }
}

const heroRingStyle = computed(() => {
  const s = scoreData.value?.overallScore || 0
  const deg = (s / 100) * 360
  const c = getScoreColor(s)
  return { background: `conic-gradient(${c} ${deg}deg, #f0ebe4 ${deg}deg)` }
})

const scoreLevel = computed(() => {
  const s = scoreData.value?.overallScore || 0
  if (s >= 90) return '非常健康'
  if (s >= 80) return '健康良好'
  if (s >= 60) return '需要关注'
  return '建议复查'
})

const categoryList = computed(() => {
  if (!scoreData.value?.categoryScores) return []
  return Object.entries(scoreData.value.categoryScores).map(([key, score]) => {
    const config = categoryConfig[key] || categoryConfig.other
    return {
      key,
      name: config.name,
      score: typeof score === 'number' ? score : 0,
      color: config.color
    }
  })
})

function getScoreColor(score) {
  if (score >= 80) return '#4CAF50'
  if (score >= 60) return '#FFD93D'
  return '#f44336'
}

function formatDate(d) {
  if (!d) return ''
  const dt = new Date(d)
  return `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, '0')}.${String(dt.getDate()).padStart(2, '0')}`
}

function animateScore(target) {
  const duration = 1500
  const start = Date.now()
  const step = () => {
    const elapsed = Date.now() - start
    const progress = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    displayScore.value = Math.round(eased * target)
    if (progress < 1) setTimeout(step, 16)
  }
  step()
}

async function loadData() {
  loading.value = true
  try {
    const userId = uni.getStorageSync('userId')
    const res = await request({
      url: API.HEALTH_SCORE,
      method: 'GET',
      data: { userId }
    })

    if (res.code === 200 && res.data) {
      scoreData.value = res.data

      if (typeof scoreData.value.topConcerns === 'string') {
        try { scoreData.value.topConcerns = JSON.parse(scoreData.value.topConcerns) } catch (e) { scoreData.value.topConcerns = [] }
      }
      if (typeof scoreData.value.positivePoints === 'string') {
        try { scoreData.value.positivePoints = JSON.parse(scoreData.value.positivePoints) } catch (e) { scoreData.value.positivePoints = [] }
      }
      if (typeof scoreData.value.categoryScores === 'string') {
        try { scoreData.value.categoryScores = JSON.parse(scoreData.value.categoryScores) } catch (e) { scoreData.value.categoryScores = {} }
      }

      animateScore(scoreData.value.overallScore || 0)
    }
  } catch (e) {
    console.error('加载健康评分失败', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #FFF8F0;
  padding: 0 0 60rpx 0;
}

.loading-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.loading-chicken-spin {
  width: 100rpx;
  height: 100rpx;
  background: #FFD030;
  border-radius: 50%;
  animation: bounce 1.2s ease-in-out infinite;
}

.loading-text {
  font-size: 26rpx;
  color: #B8956A;
  margin-top: 32rpx;
}

.hero-score-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 28rpx 40rpx;
  animation: fadeIn 0.6s ease;
}

.hero-ring-wrap { position: relative; }

.hero-ring-outer {
  width: 320rpx;
  height: 320rpx;
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-ring-track {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: #f0ebe4;
}

.hero-ring-fill {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  animation: ringReveal 1s ease-in-out forwards;
}

.hero-ring-center {
  position: relative;
  z-index: 2;
  width: 260rpx;
  height: 260rpx;
  border-radius: 50%;
  background: #FFF8F0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 4rpx 16rpx rgba(92, 64, 51, 0.04);
}

.hero-score-number {
  font-size: 96rpx;
  font-weight: 700;
  color: #5C4033;
  line-height: 1;
}

.hero-score-unit {
  font-size: 28rpx;
  color: #B8956A;
  margin-top: 4rpx;
}

.hero-score-divider {
  width: 60rpx;
  height: 3rpx;
  background: #f0ebe4;
  margin: 12rpx 0;
  border-radius: 2rpx;
}

.hero-score-level {
  font-size: 28rpx;
  font-weight: 600;
  color: #FF8C42;
}

.hero-meta { margin-top: 24rpx; }
.hero-date { font-size: 24rpx; color: #B8956A; }

.category-section {
  margin: 0 28rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(92, 64, 51, 0.06);
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #5C4033;
  margin-bottom: 20rpx;
  display: block;
}

.category-list { display: flex; flex-direction: column; gap: 20rpx; }

.category-row {
  opacity: 0;
  animation: slideUp 0.4s ease forwards;
}

.cat-row-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10rpx;
}

.cat-name-area { display: flex; align-items: center; gap: 10rpx; }

.cat-dot { width: 14rpx; height: 14rpx; border-radius: 50%; }
.cat-name { font-size: 26rpx; color: #5C4033; font-weight: 500; }
.cat-score { font-size: 30rpx; font-weight: 700; }

.cat-bar-wrap { padding: 0 2rpx; }

.cat-bar-bg {
  height: 14rpx;
  background: #f0ebe4;
  border-radius: 7rpx;
  overflow: hidden;
}

.cat-bar-fill {
  height: 100%;
  border-radius: 7rpx;
  transition: width 1s ease;
  animation: barGrow 1s ease forwards;
  transform-origin: left;
}

@keyframes barGrow {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

.ai-summary-section {
  margin: 24rpx 28rpx 0;
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(92, 64, 51, 0.06);
  animation: slideUp 0.5s ease 0.3s forwards;
  opacity: 0;
}

.ai-header {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-bottom: 20rpx;
}

.ai-avatar {
  width: 52rpx;
  height: 52rpx;
  background: #FFD030;
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
}

.mc-eye {
  position: absolute;
  width: 6rpx;
  height: 8rpx;
  background: #5C4033;
  border-radius: 50%;
  top: 16rpx;
}

.mc-eye.left { left: 12rpx; }
.mc-eye.right { right: 12rpx; }

.mc-beak {
  position: absolute;
  bottom: 10rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 7rpx solid transparent;
  border-right: 7rpx solid transparent;
  border-top: 9rpx solid #FF8C42;
}

.ai-title { font-size: 28rpx; font-weight: 600; color: #5C4033; }

.ai-bubble {
  background: #FFF8F0;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
}

.ai-text { font-size: 26rpx; color: #5C4033; line-height: 1.8; }

.highlights-section {
  padding: 0 28rpx;
  margin-top: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.highlight-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(92, 64, 51, 0.06);
  opacity: 0;
  animation: slideUp 0.4s ease forwards;
}

.highlight-card.good { animation-delay: 0.35s; border-left: 6rpx solid #4CAF50; }
.highlight-card.warn { animation-delay: 0.4s; border-left: 6rpx solid #FF9800; }

.highlight-header {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 16rpx;
}

.highlight-icon { font-size: 28rpx; }
.highlight-title { font-size: 28rpx; font-weight: 600; color: #5C4033; }

.highlight-list { display: flex; flex-direction: column; gap: 14rpx; }

.highlight-item { display: flex; align-items: flex-start; gap: 12rpx; }

.highlight-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 10rpx;
}

.good-dot { background: #4CAF50; }
.warn-dot { background: #FF9800; }

.highlight-text { font-size: 26rpx; color: #5C4033; line-height: 1.7; }

.disclaimer-section {
  margin: 32rpx 28rpx 0;
  padding: 20rpx 24rpx;
  background: rgba(255, 140, 66, 0.04);
  border-radius: 12rpx;
  border: 1rpx solid rgba(255, 140, 66, 0.1);
}

.disclaimer-text { font-size: 22rpx; color: #B8956A; line-height: 1.6; }

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30rpx); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-16rpx); }
}

@keyframes ringReveal {
  from { opacity: 0; transform: scale(0.85); }
  to { opacity: 1; transform: scale(1); }
}
</style>
