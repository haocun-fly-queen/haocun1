<!-- pages/health/indicator-detail.vue -->
<template>
  <view class="page">
    <!-- 加载态 -->
    <view class="loading-page" v-if="loading">
      <view class="loading-chicken-spin"></view>
      <text class="loading-text">小唧正在解读指标...</text>
    </view>

    <template v-if="!loading && indicator">
      <!-- 顶部指标概览 -->
      <view class="hero-section">
        <view class="hero-top">
          <text class="hero-name">{{ indicator.indicatorName }}</text>
          <view class="hero-status-tag" :style="statusTagFullStyle">
            <text class="hero-status-text">{{ statusLabel }}</text>
          </view>
        </view>

        <!-- 检测值 vs 参考范围 — 进度条可视化 -->
        <view class="value-visual">
          <view class="value-main">
            <text class="value-number">{{ indicator.value }}</text>
            <text class="value-unit" v-if="indicator.unit">{{ indicator.unit }}</text>
          </view>

          <view class="range-bar-wrap">
            <view class="range-bar-bg">
              <view
                class="range-bar-normal"
                :style="normalRangeStyle"
              ></view>
              <view
                class="range-bar-marker"
                :style="markerStyle"
              >
                <view class="marker-dot"></view>
                <view class="marker-line"></view>
              </view>
            </view>
            <view class="range-labels">
              <text class="range-label-left">{{ rangeMin }}</text>
              <text class="range-label-center">参考范围</text>
              <text class="range-label-right">{{ rangeMax }}</text>
            </view>
          </view>

          <view class="deviation-info">
            <text class="deviation-text" :style="{ color: statusColor }">
              {{ deviationText }}
            </text>
          </view>
        </view>
      </view>

      <!-- AI 解读区 — 多卡片模块 -->
      <view class="ai-cards-section" v-if="aiDetail">
        <view class="ai-card" v-if="aiDetail.explanation">
          <view class="ai-card-header">
            <text class="ai-card-icon">📖</text>
            <text class="ai-card-title">这是什么</text>
          </view>
          <view class="ai-card-body">
            <text class="ai-card-text">{{ aiDetail.explanation }}</text>
          </view>
        </view>

        <view class="ai-card" v-if="aiDetail.possible_causes && aiDetail.possible_causes.length">
          <view class="ai-card-header">
            <text class="ai-card-icon">🔍</text>
            <text class="ai-card-title">可能的原因</text>
          </view>
          <view class="ai-card-body">
            <view class="cause-list">
              <view class="cause-item" v-for="(cause, i) in aiDetail.possible_causes" :key="i">
                <view class="cause-dot"></view>
                <text class="cause-text">{{ cause }}</text>
              </view>
            </view>
          </view>
        </view>

        <view class="ai-card" v-if="aiDetail.food_benefit && aiDetail.food_benefit.length">
          <view class="ai-card-header">
            <text class="ai-card-icon">🥩</text>
            <text class="ai-card-title">推荐食物</text>
          </view>
          <view class="ai-card-body">
            <view class="food-tags">
              <view class="food-tag good" v-for="(food, i) in aiDetail.food_benefit" :key="i" @click="searchFood(food)">
                <text class="food-tag-text">{{ food }}</text>
              </view>
            </view>
          </view>
        </view>

        <view class="ai-card" v-if="aiDetail.food_avoid && aiDetail.food_avoid.length">
          <view class="ai-card-header">
            <text class="ai-card-icon">🚫</text>
            <text class="ai-card-title">需避免食物</text>
          </view>
          <view class="ai-card-body">
            <view class="food-tags">
              <view class="food-tag bad" v-for="(food, i) in aiDetail.food_avoid" :key="i">
                <text class="food-tag-text">{{ food }}</text>
              </view>
            </view>
          </view>
        </view>

        <view class="ai-card" v-if="aiDetail.lifestyle_tips && aiDetail.lifestyle_tips.length">
          <view class="ai-card-header">
            <text class="ai-card-icon">💡</text>
            <text class="ai-card-title">生活建议</text>
          </view>
          <view class="ai-card-body">
            <view class="tip-list">
              <view class="tip-item" v-for="(tip, i) in aiDetail.lifestyle_tips" :key="i">
                <view class="tip-index">{{ i + 1 }}</view>
                <text class="tip-text">{{ tip }}</text>
              </view>
            </view>
          </view>
        </view>

        <view class="ai-card" v-if="aiDetail.recheck_suggest">
          <view class="ai-card-header">
            <text class="ai-card-icon">📅</text>
            <text class="ai-card-title">复查建议</text>
          </view>
          <view class="ai-card-body">
            <text class="ai-card-text">{{ aiDetail.recheck_suggest }}</text>
            <view class="urgency-badge" v-if="aiDetail.urgency" :style="urgencyStyle">
              <text class="urgency-text">{{ urgencyLabel }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- AI 基础评语（兜底） -->
      <view class="ai-comment-section" v-if="!aiDetail && indicator.aiComment">
        <view class="ai-comment-header">
          <view class="ai-avatar-mini">
            <view class="mc-eye left"></view>
            <view class="mc-eye right"></view>
            <view class="mc-beak"></view>
          </view>
          <text class="ai-comment-title">小唧说</text>
        </view>
        <view class="ai-comment-bubble">
          <text class="ai-comment-text">{{ indicator.aiComment }}</text>
        </view>
      </view>

      <!-- 历史趋势区 -->
      <view class="trend-section" v-if="trendData.length >= 2">
        <view class="trend-header">
          <text class="trend-title">历史趋势</text>
        </view>
        <view class="trend-chart">
          <view class="chart-area">
            <view class="chart-y-axis">
              <text class="y-label">{{ chartYMax }}</text>
              <text class="y-label">{{ chartYMid }}</text>
              <text class="y-label">{{ chartYMin }}</text>
            </view>
            <view class="chart-body">
              <view class="chart-ref-zone" :style="refZoneStyle"></view>
              <view class="chart-points">
                <view
                  class="chart-point"
                  v-for="(point, i) in chartPoints"
                  :key="i"
                  :style="{ left: point.x + '%', bottom: point.y + '%' }"
                >
                  <view class="point-dot" :style="{ background: point.color }"></view>
                  <text class="point-val">{{ point.value }}</text>
                </view>
              </view>
              <view class="chart-lines">
                <view
                  class="chart-segment"
                  v-for="(seg, i) in chartSegments"
                  :key="i"
                  :style="seg.style"
                ></view>
              </view>
            </view>
          </view>
          <view class="chart-x-axis">
            <text
              class="x-label"
              v-for="(point, i) in chartPoints"
              :key="i"
              :style="{ left: point.x + '%' }"
            >{{ point.label }}</text>
          </view>
        </view>
      </view>

      <!-- 历史数据表格 -->
      <view class="history-table-section" v-if="trendData.length >= 2">
        <text class="table-title">历史数据</text>
        <view class="table-header">
          <text class="table-th flex2">日期</text>
          <text class="table-th flex1">数值</text>
          <text class="table-th flex1">状态</text>
        </view>
        <view class="table-row" v-for="(row, i) in trendData" :key="i">
          <text class="table-td flex2">{{ formatDate(row.reportDate) }}</text>
          <text class="table-td flex1 bold">{{ row.value }}{{ indicator.unit || '' }}</text>
          <view class="table-td flex1">
            <view class="mini-status-tag" :style="miniStatusStyle(row.status)">
              <text class="mini-status-text">{{ getStatusLabel(row.status) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-section">
        <view class="action-btn primary" @click="goToDietPlan">
          <text class="action-btn-text">查看推荐食谱</text>
        </view>
        <view class="action-btn secondary" @click="askChicken">
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
import { ref, computed, onMounted } from 'vue'
import request from '../../utils/request'
import { API } from '../../config'

const loading = ref(true)
const indicator = ref(null)
const aiDetail = ref(null)
const trendData = ref([])

const statusColors = { 0: '#4CAF50', 1: '#FFD93D', 2: '#FF9800', 3: '#FF5722', 4: '#f44336' }
const statusBgs = { 0: '#E8F5E9', 1: '#FFF8E1', 2: '#FFF3E0', 3: '#FBE9E7', 4: '#FFEBEE' }
const statusLabels = { 0: '正常', 1: '临界', 2: '轻度异常', 3: '中度异常', 4: '高度异常' }

function getStatusLabel(s) { return statusLabels[s] || '未知' }

const statusColor = computed(() => statusColors[indicator.value?.status] || '#999')
const statusLabel = computed(() => getStatusLabel(indicator.value?.status))

const statusTagFullStyle = computed(() => ({
  background: statusBgs[indicator.value?.status] || '#f5f5f5',
  color: statusColors[indicator.value?.status] || '#999'
}))

const rangeMin = computed(() => {
  const v = indicator.value?.referenceMin
  return v !== null && v !== undefined ? v : '—'
})
const rangeMax = computed(() => {
  const v = indicator.value?.referenceMax
  return v !== null && v !== undefined ? v : '—'
})

const normalRangeStyle = computed(() => {
  const ind = indicator.value
  if (!ind || ind.referenceMin == null || ind.referenceMax == null) return { display: 'none' }
  const total = getRangeTotal()
  const left = ((ind.referenceMin - total.min) / (total.max - total.min)) * 100
  const width = ((ind.referenceMax - ind.referenceMin) / (total.max - total.min)) * 100
  return { left: left + '%', width: width + '%' }
})

const markerStyle = computed(() => {
  const ind = indicator.value
  if (!ind) return { display: 'none' }
  const total = getRangeTotal()
  let pct = ((parseFloat(ind.value) - total.min) / (total.max - total.min)) * 100
  pct = Math.max(0, Math.min(100, pct))
  return { left: pct + '%' }
})

function getRangeTotal() {
  const ind = indicator.value
  const vals = [parseFloat(ind.value), ind.referenceMin, ind.referenceMax].filter(v => v != null && !isNaN(v))
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const padding = (max - min) * 0.2 || 1
  return { min: min - padding, max: max + padding }
}

const deviationText = computed(() => {
  const ind = indicator.value
  if (!ind || ind.status === 0) return '在正常范围内'
  if (ind.status === 1) return '接近临界值，建议关注'
  const direction = parseFloat(ind.value) > (ind.referenceMax || 0) ? '偏高' : '偏低'
  const level = { 2: '轻度', 3: '中度', 4: '明显' }
  return `${level[ind.status] || ''}${direction}，建议改善`
})

const urgencyLabel = computed(() => {
  const map = { low: '低优先级', medium: '建议关注', high: '建议尽快就医', urgent: '请尽快就医' }
  return map[aiDetail.value?.urgency] || ''
})

const urgencyStyle = computed(() => {
  const colorMap = { low: '#4CAF50', medium: '#FFD93D', high: '#FF9800', urgent: '#f44336' }
  const c = colorMap[aiDetail.value?.urgency] || '#ccc'
  return { background: c + '18', color: c, border: '1rpx solid ' + c + '40' }
})

const chartYMax = computed(() => {
  if (!trendData.value.length) return ''
  const vals = trendData.value.map(d => parseFloat(d.value))
  return Math.max(...vals).toFixed(1)
})
const chartYMin = computed(() => {
  if (!trendData.value.length) return ''
  const vals = trendData.value.map(d => parseFloat(d.value))
  return Math.min(...vals).toFixed(1)
})
const chartYMid = computed(() => {
  const max = parseFloat(chartYMax.value) || 0
  const min = parseFloat(chartYMin.value) || 0
  return ((max + min) / 2).toFixed(1)
})

const chartPoints = computed(() => {
  if (!trendData.value.length) return []
  const vals = trendData.value.map(d => parseFloat(d.value))
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const range = max - min || 1
  const padding = range * 0.15
  return trendData.value.map((d, i) => {
    const x = trendData.value.length === 1 ? 50 : (i / (trendData.value.length - 1)) * 100
    const y = ((parseFloat(d.value) - min + padding) / (range + padding * 2)) * 80 + 10
    return { x, y, value: d.value, label: formatShortDate(d.reportDate), color: statusColors[d.status] || '#999' }
  })
})

const chartSegments = computed(() => {
  const pts = chartPoints.value
  if (pts.length < 2) return []
  const segs = []
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.sqrt(dx * dx + dy * dy)
    const angle = Math.atan2(-dy, dx) * (180 / Math.PI)
    segs.push({
      style: {
        position: 'absolute', left: a.x + '%', bottom: a.y + '%',
        width: len + '%', height: '3rpx', background: a.color,
        transformOrigin: '0 50%', transform: `rotate(${angle}deg)`, opacity: 0.6
      }
    })
  }
  return segs
})

const refZoneStyle = computed(() => {
  const ind = indicator.value
  if (!ind || ind.referenceMin == null || ind.referenceMax == null) return { display: 'none' }
  const vals = trendData.value.map(d => parseFloat(d.value))
  const allVals = [...vals, ind.referenceMin, ind.referenceMax]
  const min = Math.min(...allVals)
  const max = Math.max(...allVals)
  const range = max - min || 1
  const padding = range * 0.15
  const bottom = ((ind.referenceMin - min + padding) / (range + padding * 2)) * 80 + 10
  const height = ((ind.referenceMax - ind.referenceMin) / (range + padding * 2)) * 80
  return { bottom: bottom + '%', height: height + '%' }
})

function miniStatusStyle(status) {
  return { background: statusBgs[status] || '#f5f5f5', color: statusColors[status] || '#999' }
}

function formatDate(d) {
  if (!d) return ''
  const dt = new Date(d)
  return `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, '0')}.${String(dt.getDate()).padStart(2, '0')}`
}

function formatShortDate(d) {
  if (!d) return ''
  const dt = new Date(d)
  return `${dt.getMonth() + 1}/${dt.getDate()}`
}

function searchFood(food) {
  uni.showToast({ title: `搜索「${food}」`, icon: 'none' })
}

function goToDietPlan() {
  uni.navigateTo({ url: '/pages/plan/plan' })
}

function askChicken() {
  uni.showToast({ title: '功能开发中，敬请期待', icon: 'none' })
}

async function loadData() {
  loading.value = true
  try {
    const userId = uni.getStorageSync('userId')
    const pages = getCurrentPages()
    const cur = pages[pages.length - 1]
    const opts = cur.options || cur.$page?.options || {}
    const reportId = opts.reportId
    const indicatorId = opts.indicatorId
    if (!reportId) {
      uni.showToast({ title: '参数缺失', icon: 'none' })
      loading.value = false
      return
    }

    // 加载报告详情获取指标
    const res = await request({
      url: API.HEALTH_REPORT_DETAIL + '/' + reportId,
      method: 'GET',
      data: { userId }
    })

    if (res.code === 200 && res.data) {
      const data = res.data
      const indicators = data.indicators || []
      const target = indicators.find(item => String(item.id) === String(indicatorId))
      if (target) {
        indicator.value = target
        if (target.aiDetail) {
          try {
            aiDetail.value = typeof target.aiDetail === 'string' ? JSON.parse(target.aiDetail) : target.aiDetail
          } catch (e) {
            aiDetail.value = null
          }
        }
      }
    }

    // 加载趋势数据
    if (indicator.value?.indicatorCode) {
      try {
        const trendRes = await request({
          url: API.HEALTH_INDICATOR_TREND,
          method: 'GET',
          data: { userId, code: indicator.value.indicatorCode }
        })
        if (trendRes.code === 200 && trendRes.data) {
          trendData.value = trendRes.data.trend || []
        }
      } catch (e) {
        console.warn('加载趋势数据失败', e)
      }
    }
  } catch (e) {
    console.error('加载指标详情失败', e)
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

.hero-section {
  margin: 24rpx 28rpx 0;
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx 28rpx;
  box-shadow: 0 4rpx 20rpx rgba(92, 64, 51, 0.07);
  animation: slideUp 0.5s ease forwards;
}

.hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28rpx;
}

.hero-name {
  font-size: 36rpx;
  font-weight: 700;
  color: #5C4033;
}

.hero-status-tag {
  padding: 8rpx 24rpx;
  border-radius: 24rpx;
  animation: breathe 3s ease-in-out infinite;
}

.hero-status-text {
  font-size: 24rpx;
  font-weight: 600;
}

.value-visual {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.value-main {
  display: flex;
  align-items: baseline;
  gap: 6rpx;
}

.value-number {
  font-size: 64rpx;
  font-weight: 700;
  color: #5C4033;
  line-height: 1;
}

.value-unit {
  font-size: 28rpx;
  color: #B8956A;
}

.range-bar-wrap { padding: 0 4rpx; }

.range-bar-bg {
  height: 16rpx;
  background: #f0ebe4;
  border-radius: 8rpx;
  position: relative;
  overflow: visible;
}

.range-bar-normal {
  position: absolute;
  top: 0;
  height: 100%;
  background: rgba(76, 175, 80, 0.2);
  border-radius: 8rpx;
  transition: all 0.6s ease;
}

.range-bar-marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 3;
  transition: left 0.8s ease;
}

.marker-dot {
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  background: #FF8C42;
  border: 4rpx solid #fff;
  box-shadow: 0 2rpx 8rpx rgba(255, 140, 66, 0.4);
}

.marker-line {
  width: 4rpx;
  height: 20rpx;
  background: #FF8C42;
  margin: 4rpx auto 0;
  border-radius: 2rpx;
}

.range-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 10rpx;
}

.range-label-left, .range-label-right { font-size: 20rpx; color: #B8956A; }
.range-label-center { font-size: 20rpx; color: #ccc; }

.deviation-info { text-align: center; }
.deviation-text { font-size: 26rpx; font-weight: 500; }

.ai-cards-section {
  padding: 0 28rpx;
  margin-top: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.ai-card {
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(92, 64, 51, 0.06);
  opacity: 0;
  animation: slideUp 0.4s ease forwards;
}

.ai-card:nth-child(1) { animation-delay: 0.05s; }
.ai-card:nth-child(2) { animation-delay: 0.1s; }
.ai-card:nth-child(3) { animation-delay: 0.15s; }
.ai-card:nth-child(4) { animation-delay: 0.2s; }
.ai-card:nth-child(5) { animation-delay: 0.25s; }
.ai-card:nth-child(6) { animation-delay: 0.3s; }

.ai-card-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 22rpx 24rpx 0;
}

.ai-card-icon { font-size: 28rpx; }
.ai-card-title { font-size: 28rpx; font-weight: 600; color: #5C4033; }
.ai-card-body { padding: 16rpx 24rpx 24rpx; }
.ai-card-text { font-size: 26rpx; color: #5C4033; line-height: 1.8; }

.cause-list { display: flex; flex-direction: column; gap: 14rpx; }

.cause-item { display: flex; align-items: flex-start; gap: 12rpx; }

.cause-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #FFB347;
  flex-shrink: 0;
  margin-top: 12rpx;
}

.cause-text { font-size: 26rpx; color: #5C4033; line-height: 1.7; }

.food-tags { display: flex; flex-wrap: wrap; gap: 12rpx; }

.food-tag {
  padding: 10rpx 24rpx;
  border-radius: 24rpx;
  transition: transform 0.15s ease;
}

.food-tag:active { transform: scale(0.95); }
.food-tag.good { background: #E8F5E9; }
.food-tag.good .food-tag-text { color: #2e7d32; font-size: 24rpx; }
.food-tag.bad { background: #FFEBEE; }
.food-tag.bad .food-tag-text { color: #c62828; font-size: 24rpx; }

.tip-list { display: flex; flex-direction: column; gap: 16rpx; }

.tip-item { display: flex; align-items: flex-start; gap: 14rpx; }

.tip-index {
  width: 36rpx;
  height: 36rpx;
  background: #FFB347;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  line-height: 36rpx;
  text-align: center;
}

.tip-text { font-size: 26rpx; color: #5C4033; line-height: 1.7; flex: 1; padding-top: 4rpx; }

.urgency-badge {
  display: inline-flex;
  margin-top: 16rpx;
  padding: 8rpx 20rpx;
  border-radius: 16rpx;
}

.urgency-text { font-size: 22rpx; font-weight: 600; }

.ai-comment-section {
  margin: 24rpx 28rpx 0;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(92, 64, 51, 0.06);
}

.ai-comment-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.ai-avatar-mini {
  width: 44rpx;
  height: 44rpx;
  background: #FFD030;
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
}

.mc-eye {
  position: absolute;
  width: 5rpx;
  height: 7rpx;
  background: #5C4033;
  border-radius: 50%;
  top: 14rpx;
}

.mc-eye.left { left: 10rpx; }
.mc-eye.right { right: 10rpx; }

.mc-beak {
  position: absolute;
  bottom: 8rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6rpx solid transparent;
  border-right: 6rpx solid transparent;
  border-top: 8rpx solid #FF8C42;
}

.ai-comment-title { font-size: 26rpx; font-weight: 600; color: #5C4033; }

.ai-comment-bubble {
  background: #FFF8F0;
  border-radius: 16rpx;
  padding: 20rpx;
}

.ai-comment-text { font-size: 26rpx; color: #5C4033; line-height: 1.8; }

.trend-section {
  margin: 24rpx 28rpx 0;
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(92, 64, 51, 0.06);
  animation: slideUp 0.5s ease 0.35s forwards;
  opacity: 0;
}

.trend-header { margin-bottom: 24rpx; }
.trend-title { font-size: 28rpx; font-weight: 600; color: #5C4033; }
.trend-chart { position: relative; }

.chart-area { display: flex; height: 320rpx; gap: 12rpx; }

.chart-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 80rpx;
  text-align: right;
}

.y-label { font-size: 18rpx; color: #B8956A; }

.chart-body {
  flex: 1;
  position: relative;
  border-left: 2rpx solid #f0ebe4;
  border-bottom: 2rpx solid #f0ebe4;
}

.chart-ref-zone {
  position: absolute;
  left: 0;
  right: 0;
  background: rgba(76, 175, 80, 0.08);
  border-top: 2rpx dashed rgba(76, 175, 80, 0.3);
  border-bottom: 2rpx dashed rgba(76, 175, 80, 0.3);
}

.chart-points { position: absolute; inset: 0; }

.chart-point {
  position: absolute;
  transform: translate(-50%, 50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
}

.point-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  border: 3rpx solid #fff;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.15);
}

.point-val {
  font-size: 18rpx;
  color: #5C4033;
  font-weight: 600;
  margin-bottom: 6rpx;
  white-space: nowrap;
}

.chart-lines { position: absolute; inset: 0; pointer-events: none; }

.chart-x-axis { position: relative; height: 40rpx; margin-left: 92rpx; }

.x-label {
  position: absolute;
  transform: translateX(-50%);
  font-size: 18rpx;
  color: #B8956A;
}

.history-table-section {
  margin: 24rpx 28rpx 0;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(92, 64, 51, 0.06);
  animation: slideUp 0.5s ease 0.4s forwards;
  opacity: 0;
}

.table-title { font-size: 28rpx; font-weight: 600; color: #5C4033; margin-bottom: 16rpx; display: block; }

.table-header {
  display: flex;
  padding: 12rpx 0;
  border-bottom: 2rpx solid #f0ebe4;
}

.table-th { font-size: 22rpx; color: #B8956A; font-weight: 600; }

.table-row {
  display: flex;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f8f4f0;
  align-items: center;
}

.table-row:last-child { border-bottom: none; }
.table-td { font-size: 24rpx; color: #5C4033; }
.table-td.bold { font-weight: 600; }
.flex1 { flex: 1; }
.flex2 { flex: 2; }

.mini-status-tag { display: inline-flex; padding: 4rpx 14rpx; border-radius: 12rpx; }
.mini-status-text { font-size: 20rpx; font-weight: 600; }

.action-section {
  margin: 32rpx 28rpx 0;
  display: flex;
  gap: 16rpx;
  animation: slideUp 0.5s ease 0.45s forwards;
  opacity: 0;
}

.action-btn {
  flex: 1;
  border-radius: 20rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease;
}

.action-btn:active { transform: scale(0.96); }

.action-btn.primary {
  background: linear-gradient(135deg, #FF8C42, #FFB347);
  box-shadow: 0 6rpx 20rpx rgba(255, 140, 66, 0.3);
}

.action-btn.primary .action-btn-text { color: #fff; font-size: 26rpx; font-weight: 600; }

.action-btn.secondary { background: #fff; border: 2rpx solid #FFB347; }

.action-btn.secondary .action-btn-text { color: #FF8C42; font-size: 26rpx; font-weight: 600; }

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

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-16rpx); }
}

@keyframes breathe {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>
