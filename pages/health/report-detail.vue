<!-- pages/health/report-detail.vue -->
<template>
  <view class="page">
    <!-- 加载态 -->
    <view class="loading-page" v-if="loading">
      <view class="loading-chicken-spin"></view>
      <text class="loading-text">小唧正在翻阅报告...</text>
    </view>

    <template v-if="!loading && report">
      <!-- 报告信息区 -->
      <view class="report-info-card">
        <view class="info-row">
          <text class="info-label">报告名称</text>
          <text class="info-value">{{ report.reportName }}</text>
        </view>
        <view class="info-divider"></view>
        <view class="info-grid">
          <view class="info-grid-item">
            <text class="info-grid-label">体检日期</text>
            <text class="info-grid-value">{{ formatDate(report.reportDate) }}</text>
          </view>
          <view class="info-grid-item">
            <text class="info-grid-label">体检机构</text>
            <text class="info-grid-value">{{ report.hospital || '未填写' }}</text>
          </view>
          <view class="info-grid-item">
            <text class="info-grid-label">报告类型</text>
            <text class="info-grid-value">{{ reportTypeName }}</text>
          </view>
        </view>
      </view>

      <!-- 健康评分区 -->
      <view class="score-section">
        <view class="score-ring-large">
          <view class="ring-track"></view>
          <view class="ring-fill" :style="ringStyle"></view>
          <view class="ring-center">
            <text class="ring-score">{{ displayScore }}</text>
            <text class="ring-unit">分</text>
          </view>
        </view>
        <view class="category-scores">
          <view
            class="cat-item"
            v-for="cat in categoryScores"
            :key="cat.key"
          >
            <view class="cat-dot" :style="{ background: cat.color }"></view>
            <text class="cat-name">{{ cat.name }}</text>
            <text class="cat-value" :style="{ color: cat.color }">{{ cat.score }}</text>
          </view>
        </view>
      </view>

      <!-- AI 总结区 -->
      <view class="ai-summary-section">
        <view class="ai-header">
          <view class="ai-avatar">
            <view class="mini-chicken">
              <view class="mc-eye left"></view>
              <view class="mc-eye right"></view>
              <view class="mc-beak"></view>
            </view>
          </view>
          <text class="ai-title">小唧的健康总结</text>
        </view>
        <view class="ai-bubble">
          <text class="ai-text">{{ report.summary }}</text>
        </view>

        <!-- 好/坏标签 -->
        <view class="tag-section" v-if="report.positivePoints && report.positivePoints.length">
          <view class="tag-row good" v-for="(point, i) in report.positivePoints" :key="'p' + i">
            <text class="tag-icon">✅</text>
            <text class="tag-text">{{ point }}</text>
          </view>
        </view>
        <view class="tag-section" v-if="report.topConcerns && report.topConcerns.length">
          <view class="tag-row warn" v-for="(concern, i) in report.topConcerns" :key="'c' + i">
            <text class="tag-icon">⚠️</text>
            <text class="tag-text">{{ concern }}</text>
          </view>
        </view>
      </view>

      <!-- 指标分类列表 -->
      <view class="indicators-section">
        <text class="section-title">详细指标</text>

        <view
          class="category-block"
          v-for="(cat, catIndex) in groupedIndicators"
          :key="cat.key"
          :style="{ animationDelay: catIndex * 0.06 + 's' }"
        >
          <view class="cat-header" @click="toggleCategory(cat.key)">
            <view class="cat-header-left">
              <view class="cat-color-bar" :style="{ background: cat.color }"></view>
              <text class="cat-header-name">{{ cat.name }}</text>
              <view class="cat-count-badges">
                <text class="cat-total">{{ cat.items.length }}项</text>
                <text class="cat-abnormal" v-if="cat.abnormalCount > 0">{{ cat.abnormalCount }}项异常</text>
              </view>
            </view>
            <view class="cat-header-right">
              <text class="cat-arrow" :class="{ expanded: expandedCategories[cat.key] }">›</text>
            </view>
          </view>

          <view
            class="cat-body"
            :class="{ expanded: expandedCategories[cat.key] }"
            :style="{ maxHeight: expandedCategories[cat.key] ? cat.items.length * 140 + 'rpx' : '0' }"
          >
            <view
              class="indicator-row"
              v-for="(item, idx) in cat.items"
              :key="item.id"
              :style="{ animationDelay: idx * 0.05 + 's' }"
              @click="goToIndicatorDetail(item)"
            >
              <view class="indicator-bar" :style="{ background: getStatusColor(item.status) }"></view>
              <view class="indicator-body">
                <view class="indicator-top">
                  <text class="indicator-name">{{ item.indicatorName }}</text>
                  <view class="status-tag" :style="statusTagStyle(item.status)">
                    <text class="status-tag-text">{{ getStatusLabel(item.status) }}</text>
                  </view>
                </view>
                <view class="indicator-bottom">
                  <view class="indicator-value-area">
                    <text class="indicator-val">{{ item.value }}</text>
                    <text class="indicator-unit" v-if="item.unit">{{ item.unit }}</text>
                  </view>
                  <text class="indicator-ref">
                    参考：{{ item.referenceMin }}~{{ item.referenceMax }}{{ item.unit || '' }}
                  </text>
                </view>
              </view>
              <view class="indicator-arrow">
                <text class="arrow-sm">›</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 操作按钮区 -->
      <view class="action-section">
        <view class="action-btn primary" @click="generatePlan">
          <text class="action-btn-icon">🩺</text>
          <text class="action-btn-text">一键生成改善方案</text>
        </view>
        <view class="action-btn secondary" @click="askChicken">
          <text class="action-btn-icon">💬</text>
          <text class="action-btn-text">追问小唧</text>
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
import { ref, reactive, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import request from '../../utils/request'
import { API } from '../../config'

const loading = ref(true)
const report = ref(null)
const indicators = ref([])
const displayScore = ref(0)
const expandedCategories = reactive({})
const reportId = ref('')

const typeMap = {
  annual: '年度体检',
  employment: '入职体检',
  special: '专项检查',
  prenatal: '孕检',
  other: '其他'
}

const reportTypeName = computed(() => {
  return typeMap[report.value?.reportType] || '体检报告'
})

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

const ringStyle = computed(() => {
  const score = report.value?.overallScore || 0
  const deg = (score / 100) * 360
  const color = score >= 80 ? '#4CAF50' : score >= 60 ? '#FFD93D' : '#f44336'
  return {
    background: `conic-gradient(${color} ${deg}deg, #f0ebe4 ${deg}deg)`
  }
})

const categoryScores = computed(() => {
  if (!report.value?.categoryScores) return []
  return Object.entries(report.value.categoryScores).map(([key, score]) => {
    const config = categoryConfig[key] || categoryConfig.other
    const s = typeof score === 'number' ? score : 0
    return {
      key,
      name: config.name,
      score: s,
      color: s >= 80 ? '#4CAF50' : s >= 60 ? '#FFD93D' : '#f44336'
    }
  })
})

const groupedIndicators = computed(() => {
  const groups = {}
  const sorted = [...indicators.value].sort((a, b) => {
    if (a.status === 0 && b.status !== 0) return 1
    if (a.status !== 0 && b.status === 0) return -1
    return b.status - a.status
  })
  for (const item of sorted) {
    const cat = item.category || 'other'
    if (!groups[cat]) {
      const config = categoryConfig[cat] || categoryConfig.other
      groups[cat] = { key: cat, name: config.name, color: config.color, items: [], abnormalCount: 0 }
    }
    groups[cat].items.push(item)
    if (item.status > 0) groups[cat].abnormalCount++
  }
  return Object.values(groups)
})

function getStatusColor(status) {
  const map = { 0: '#4CAF50', 1: '#FFD93D', 2: '#FF9800', 3: '#FF5722', 4: '#f44336' }
  return map[status] || '#ccc'
}

function getStatusLabel(status) {
  const map = { 0: '正常', 1: '临界', 2: '轻度异常', 3: '中度异常', 4: '高度异常' }
  return map[status] || '未知'
}

function statusTagStyle(status) {
  const bgMap = { 0: '#E8F5E9', 1: '#FFF8E1', 2: '#FFF3E0', 3: '#FBE9E7', 4: '#FFEBEE' }
  const textMap = { 0: '#2e7d32', 1: '#f9a825', 2: '#e65100', 3: '#d84315', 4: '#c62828' }
  return { background: bgMap[status] || '#f5f5f5', color: textMap[status] || '#999' }
}

function formatDate(dateStr) {
  if (!dateStr) return '未填写'
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function toggleCategory(key) {
  expandedCategories[key] = !expandedCategories[key]
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

function goToIndicatorDetail(item) {
  uni.navigateTo({
    url: `/pages/health/indicator-detail?reportId=${item.reportId}&indicatorId=${item.id}&indicatorName=${encodeURIComponent(item.indicatorName)}`
  })
}

function generatePlan() {
  uni.showToast({ title: '功能开发中，敬请期待', icon: 'none' })
}

function askChicken() {
  uni.showToast({ title: '功能开发中，敬请期待', icon: 'none' })
}

async function loadData() {
  loading.value = true
  try {
    const userId = uni.getStorageSync('userId')

    if (!reportId.value) {
      uni.showToast({ title: '报告ID缺失', icon: 'none' })
      loading.value = false
      return
    }

    const res = await request({
      url: API.HEALTH_REPORT_DETAIL + '/' + reportId.value,
      method: 'GET',
      data: { userId }
    })

    if (res.code === 200 && res.data) {
      const data = res.data
      report.value = data
      indicators.value = data.indicators || []

      if (typeof report.value.topConcerns === 'string') {
        try { report.value.topConcerns = JSON.parse(report.value.topConcerns) } catch (e) { report.value.topConcerns = [] }
      }
      if (typeof report.value.positivePoints === 'string') {
        try { report.value.positivePoints = JSON.parse(report.value.positivePoints) } catch (e) { report.value.positivePoints = [] }
      }
      if (typeof report.value.categoryScores === 'string') {
        try { report.value.categoryScores = JSON.parse(report.value.categoryScores) } catch (e) { report.value.categoryScores = {} }
      }

      for (const cat of groupedIndicators.value) {
        if (cat.abnormalCount > 0) {
          expandedCategories[cat.key] = true
          break
        }
      }
      if (groupedIndicators.value.length > 0 && !Object.values(expandedCategories).some(v => v)) {
        expandedCategories[groupedIndicators.value[0].key] = true
      }

      animateScore(report.value.overallScore || 0)
    }
  } catch (e) {
    console.error('加载报告详情失败', e)
  } finally {
    loading.value = false
  }
}

onLoad((options) => {
  reportId.value = options.id || ''
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

.report-info-card {
  margin: 24rpx 28rpx 0;
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(92, 64, 51, 0.06);
  animation: slideUp 0.5s ease forwards;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.info-label {
  font-size: 24rpx;
  color: #B8956A;
  flex-shrink: 0;
}

.info-value {
  font-size: 32rpx;
  font-weight: 600;
  color: #5C4033;
}

.info-divider {
  height: 1rpx;
  background: #f0ebe4;
  margin: 20rpx 0;
}

.info-grid {
  display: flex;
  gap: 12rpx;
}

.info-grid-item {
  flex: 1;
  background: #FFF8F0;
  border-radius: 12rpx;
  padding: 16rpx;
}

.info-grid-label {
  font-size: 20rpx;
  color: #B8956A;
  display: block;
  margin-bottom: 6rpx;
}

.info-grid-value {
  font-size: 24rpx;
  font-weight: 600;
  color: #5C4033;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.score-section {
  margin: 24rpx 28rpx 0;
  background: #fff;
  border-radius: 20rpx;
  padding: 40rpx 28rpx;
  display: flex;
  align-items: center;
  gap: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(92, 64, 51, 0.06);
  animation: slideUp 0.5s ease 0.08s forwards;
  opacity: 0;
}

.score-ring-large {
  width: 180rpx;
  height: 180rpx;
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring-track {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: #f0ebe4;
}

.ring-fill {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  animation: ringReveal 1s ease-in-out forwards;
}

.ring-center {
  position: relative;
  z-index: 2;
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ring-score {
  font-size: 52rpx;
  font-weight: 700;
  color: #5C4033;
  line-height: 1;
}

.ring-unit {
  font-size: 20rpx;
  color: #B8956A;
  margin-top: 4rpx;
}

.category-scores {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.cat-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.cat-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.cat-name {
  font-size: 24rpx;
  color: #8B7355;
  flex: 1;
}

.cat-value {
  font-size: 26rpx;
  font-weight: 600;
}

.ai-summary-section {
  margin: 24rpx 28rpx 0;
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(92, 64, 51, 0.06);
  animation: slideUp 0.5s ease 0.16s forwards;
  opacity: 0;
}

.ai-header {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-bottom: 20rpx;
}

.ai-avatar {
  width: 56rpx;
  height: 56rpx;
  background: #FFD030;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
}

.mini-chicken {
  position: relative;
  width: 100%;
  height: 100%;
}

.mc-eye {
  position: absolute;
  width: 6rpx;
  height: 8rpx;
  background: #5C4033;
  border-radius: 50%;
  top: 18rpx;
}

.mc-eye.left { left: 14rpx; }
.mc-eye.right { right: 14rpx; }

.mc-beak {
  position: absolute;
  bottom: 12rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 7rpx solid transparent;
  border-right: 7rpx solid transparent;
  border-top: 9rpx solid #FF8C42;
}

.ai-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #5C4033;
}

.ai-bubble {
  background: #FFF8F0;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 20rpx;
}

.ai-text {
  font-size: 26rpx;
  color: #5C4033;
  line-height: 1.8;
}

.tag-section {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.tag-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 10rpx 16rpx;
  border-radius: 12rpx;
}

.tag-row.good { background: #E8F5E9; }
.tag-row.warn { background: #FFF3E0; }

.tag-icon { font-size: 24rpx; flex-shrink: 0; }

.tag-text {
  font-size: 24rpx;
  color: #5C4033;
  line-height: 1.5;
}

.indicators-section {
  margin: 24rpx 28rpx 0;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #5C4033;
  margin-bottom: 16rpx;
  display: block;
}

.category-block {
  background: #fff;
  border-radius: 20rpx;
  margin-bottom: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(92, 64, 51, 0.06);
  opacity: 0;
  animation: slideUp 0.4s ease forwards;
}

.cat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  transition: background 0.2s ease;
}

.cat-header:active { background: #FFF8F0; }

.cat-header-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex: 1;
  min-width: 0;
}

.cat-color-bar {
  width: 6rpx;
  height: 32rpx;
  border-radius: 3rpx;
  flex-shrink: 0;
}

.cat-header-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #5C4033;
  flex-shrink: 0;
}

.cat-count-badges {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-left: 8rpx;
}

.cat-total { font-size: 22rpx; color: #B8956A; }

.cat-abnormal {
  font-size: 20rpx;
  color: #FF5722;
  background: #FBE9E7;
  padding: 2rpx 12rpx;
  border-radius: 12rpx;
}

.cat-header-right {
  flex-shrink: 0;
  width: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cat-arrow {
  font-size: 36rpx;
  color: #ccc;
  font-weight: 300;
  transition: transform 0.3s ease;
  display: inline-block;
}

.cat-arrow.expanded { transform: rotate(90deg); }

.cat-body {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.cat-body.expanded { border-top: 1rpx solid #f5f0eb; }

.indicator-row {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  border-bottom: 1rpx solid #f8f4f0;
  transition: background 0.15s ease;
}

.indicator-row:last-child { border-bottom: none; }
.indicator-row:active { background: #FFF8F0; }

.indicator-bar {
  width: 6rpx;
  height: 56rpx;
  border-radius: 3rpx;
  flex-shrink: 0;
  margin-right: 16rpx;
}

.indicator-body { flex: 1; min-width: 0; }

.indicator-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.indicator-name {
  font-size: 26rpx;
  font-weight: 500;
  color: #5C4033;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-tag {
  flex-shrink: 0;
  padding: 4rpx 14rpx;
  border-radius: 12rpx;
}

.status-tag-text { font-size: 20rpx; font-weight: 600; }

.indicator-bottom {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16rpx;
}

.indicator-value-area {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}

.indicator-val { font-size: 30rpx; font-weight: 700; color: #5C4033; }
.indicator-unit { font-size: 20rpx; color: #B8956A; }

.indicator-ref { font-size: 20rpx; color: #B8956A; flex-shrink: 0; }

.indicator-arrow {
  flex-shrink: 0;
  width: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8rpx;
}

.arrow-sm { font-size: 28rpx; color: #ddd; font-weight: 300; }

.action-section {
  margin: 32rpx 28rpx 0;
  display: flex;
  gap: 16rpx;
  animation: slideUp 0.5s ease 0.3s forwards;
  opacity: 0;
}

.action-btn {
  flex: 1;
  border-radius: 20rpx;
  padding: 24rpx 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  transition: transform 0.15s ease;
}

.action-btn:active { transform: scale(0.96); }

.action-btn.primary {
  background: linear-gradient(135deg, #FF8C42, #FFB347);
  box-shadow: 0 6rpx 20rpx rgba(255, 140, 66, 0.3);
}

.action-btn.secondary {
  background: #fff;
  border: 2rpx solid #FFB347;
}

.action-btn-icon { font-size: 28rpx; }
.action-btn-text { font-size: 26rpx; font-weight: 600; }
.action-btn.primary .action-btn-text { color: #fff; }
.action-btn.secondary .action-btn-text { color: #FF8C42; }

.disclaimer-section {
  margin: 32rpx 28rpx 0;
  padding: 20rpx 24rpx;
  background: rgba(255, 140, 66, 0.04);
  border-radius: 12rpx;
  border: 1rpx solid rgba(255, 140, 66, 0.1);
}

.disclaimer-text {
  font-size: 22rpx;
  color: #B8956A;
  line-height: 1.6;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30rpx); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-16rpx); }
}

@keyframes ringReveal {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}
</style>
