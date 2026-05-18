<!-- pages/health/trend.vue -->
<template>
  <view class="page">
    <!-- 加载态 -->
    <view class="loading-page" v-if="loading">
      <view class="loading-chicken-spin"></view>
      <text class="loading-text">小唧正在整理趋势数据...</text>
    </view>

    <template v-if="!loading">
      <!-- 顶部下拉选择器 -->
      <view class="selector-section">
        <text class="selector-label">查看指标</text>
        <picker
          :range="indicatorOptions"
          :range-key="'label'"
          :value="selectedIndex"
          @change="onIndicatorChange"
        >
          <view class="selector-picker">
            <text class="selector-value">
              {{ selectedIndex >= 0 ? indicatorOptions[selectedIndex].label : '请选择指标' }}
            </text>
            <text class="selector-arrow">▾</text>
          </view>
        </picker>
      </view>

      <!-- 折线图区 -->
      <view class="chart-section" v-if="trendData.length > 0">
        <view class="chart-container">
          <view class="chart-y-axis">
            <text class="y-label">{{ chartYMax }}</text>
            <text class="y-label">{{ chartYMid }}</text>
            <text class="y-label">{{ chartYMin }}</text>
          </view>

          <view class="chart-body">
            <view class="ref-zone" :style="refZoneStyle">
              <text class="ref-zone-label" v-if="refZoneLabel">{{ refZoneLabel }}</text>
            </view>

            <view class="grid-line" style="bottom: 25%"></view>
            <view class="grid-line" style="bottom: 50%"></view>
            <view class="grid-line" style="bottom: 75%"></view>

            <view class="chart-points-layer">
              <view
                class="chart-point-group"
                v-for="(pt, i) in chartPoints"
                :key="i"
                :style="{ left: pt.x + '%', bottom: pt.y + '%' }"
              >
                <view class="point-tooltip">
                  <text class="tooltip-value">{{ pt.value }}</text>
                </view>
                <view class="point-dot" :style="{ background: pt.color }"></view>
              </view>
            </view>

            <view class="chart-svg-layer">
              <view
                class="chart-line-seg"
                v-for="(seg, i) in lineSegments"
                :key="i"
                :style="seg.style"
              ></view>
            </view>
          </view>
        </view>

        <view class="chart-x-axis">
          <text
            class="x-label"
            v-for="(pt, i) in chartPoints"
            :key="i"
            :style="{ left: pt.x + '%' }"
          >{{ pt.label }}</text>
        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty-chart" v-if="trendData.length === 0 && !loading">
        <view class="empty-icon">📊</view>
        <text class="empty-text">暂无趋势数据</text>
        <text class="empty-hint">上传多份体检报告后可查看指标变化趋势</text>
      </view>

      <!-- AI 趋势分析 -->
      <view class="trend-analysis-section" v-if="trendAnalysis && trendData.length >= 2">
        <view class="analysis-header">
          <view class="analysis-avatar">
            <view class="mc-eye left"></view>
            <view class="mc-eye right"></view>
            <view class="mc-beak"></view>
          </view>
          <text class="analysis-title">趋势分析</text>
        </view>
        <view class="analysis-bubble">
          <text class="analysis-text">{{ trendAnalysis }}</text>
        </view>
        <view class="trend-summary-badges">
          <view class="trend-badge" :style="trendDirectionStyle">
            <text class="badge-text">{{ trendDirectionLabel }}</text>
          </view>
          <view class="trend-badge range-badge">
            <text class="badge-text">波动范围：{{ trendRange }}</text>
          </view>
        </view>
      </view>

      <!-- 历史数据表格 -->
      <view class="history-section" v-if="trendData.length > 0">
        <text class="table-title">历史数据</text>
        <view class="table-card">
          <view class="table-header">
            <text class="th col-date">日期</text>
            <text class="th col-value">数值</text>
            <text class="th col-status">状态</text>
          </view>
          <view
            class="table-row"
            v-for="(row, i) in trendData"
            :key="i"
            :style="{ animationDelay: i * 0.05 + 's' }"
          >
            <text class="td col-date">{{ formatDate(row.reportDate) }}</text>
            <view class="td col-value">
              <text class="td-value">{{ row.value }}</text>
              <text class="td-unit" v-if="currentUnit">{{ currentUnit }}</text>
            </view>
            <view class="td col-status">
              <view class="status-mini-tag" :style="statusTagStyle(row.status)">
                <text class="status-mini-text">{{ getStatusLabel(row.status) }}</text>
              </view>
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
const indicatorOptions = ref([])
const selectedIndex = ref(-1)
const trendData = ref([])
const trendAnalysis = ref('')

const statusColors = { 0: '#4CAF50', 1: '#FFD93D', 2: '#FF9800', 3: '#FF5722', 4: '#f44336' }
const statusBgs = { 0: '#E8F5E9', 1: '#FFF8E1', 2: '#FFF3E0', 3: '#FBE9E7', 4: '#FFEBEE' }
const statusLabels = { 0: '正常', 1: '临界', 2: '轻度异常', 3: '中度异常', 4: '高度异常' }

function getStatusLabel(s) { return statusLabels[s] || '未知' }

const currentUnit = computed(() => {
  if (selectedIndex.value < 0 || !indicatorOptions.value[selectedIndex.value]) return ''
  return indicatorOptions.value[selectedIndex.value].unit || ''
})

const chartYMax = computed(() => {
  if (!trendData.value.length) return ''
  const vals = trendData.value.map(d => d.value)
  const allVals = [...vals]
  const ind = indicatorOptions.value[selectedIndex.value]
  if (ind?.referenceMax != null) allVals.push(ind.referenceMax)
  if (ind?.referenceMin != null) allVals.push(ind.referenceMin)
  return Math.max(...allVals).toFixed(1)
})

const chartYMin = computed(() => {
  if (!trendData.value.length) return ''
  const vals = trendData.value.map(d => d.value)
  const allVals = [...vals]
  const ind = indicatorOptions.value[selectedIndex.value]
  if (ind?.referenceMax != null) allVals.push(ind.referenceMax)
  if (ind?.referenceMin != null) allVals.push(ind.referenceMin)
  return Math.min(...allVals).toFixed(1)
})

const chartYMid = computed(() => {
  const max = parseFloat(chartYMax.value) || 0
  const min = parseFloat(chartYMin.value) || 0
  return ((max + min) / 2).toFixed(1)
})

const refZoneStyle = computed(() => {
  const ind = indicatorOptions.value[selectedIndex.value]
  if (!ind || ind.referenceMin == null || ind.referenceMax == null) return { display: 'none' }
  const total = getChartRange()
  const bottom = ((ind.referenceMin - total.min) / (total.max - total.min)) * 80 + 10
  const height = ((ind.referenceMax - ind.referenceMin) / (total.max - total.min)) * 80
  return { bottom: bottom + '%', height: Math.max(height, 2) + '%' }
})

const refZoneLabel = computed(() => {
  const ind = indicatorOptions.value[selectedIndex.value]
  if (!ind || ind.referenceMin == null) return ''
  return `${ind.referenceMin}~${ind.referenceMax}`
})

function getChartRange() {
  const vals = trendData.value.map(d => d.value)
  const ind = indicatorOptions.value[selectedIndex.value]
  const allVals = [...vals]
  if (ind?.referenceMax != null) allVals.push(ind.referenceMax)
  if (ind?.referenceMin != null) allVals.push(ind.referenceMin)
  const min = Math.min(...allVals)
  const max = Math.max(...allVals)
  const padding = (max - min) * 0.15 || 1
  return { min: min - padding, max: max + padding }
}

const chartPoints = computed(() => {
  if (!trendData.value.length) return []
  const total = getChartRange()
  return trendData.value.map((d, i) => {
    const x = trendData.value.length === 1 ? 50 : (i / (trendData.value.length - 1)) * 90 + 5
    const y = ((d.value - total.min) / (total.max - total.min)) * 80 + 10
    return {
      x, y,
      value: d.value,
      label: formatShortDate(d.reportDate),
      color: statusColors[d.status] || '#999'
    }
  })
})

const lineSegments = computed(() => {
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
        position: 'absolute',
        left: a.x + '%',
        bottom: a.y + '%',
        width: len + '%',
        height: '3rpx',
        background: `linear-gradient(90deg, ${a.color}, ${b.color})`,
        transformOrigin: '0 50%',
        transform: `rotate(${angle}deg)`,
        borderRadius: '2rpx'
      }
    })
  }
  return segs
})

const trendDirectionLabel = computed(() => {
  const pts = chartPoints.value
  if (pts.length < 2) return '数据不足'
  const first = pts[0].value
  const last = pts[pts.length - 1].value
  const diff = last - first
  if (Math.abs(diff) < 0.01) return '基本持平'
  return diff > 0 ? '整体上升趋势 ↑' : '整体下降趋势 ↓'
})

const trendDirectionStyle = computed(() => {
  const pts = chartPoints.value
  if (pts.length < 2) return { background: '#f5f5f5', color: '#999' }
  const first = pts[0].value
  const last = pts[pts.length - 1].value
  const diff = last - first
  if (Math.abs(diff) < 0.01) return { background: '#E8F5E9', color: '#2e7d32' }
  return { background: '#FFF3E0', color: '#e65100' }
})

const trendRange = computed(() => {
  if (!trendData.value.length) return '—'
  const vals = trendData.value.map(d => d.value)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  return `${min.toFixed(1)} ~ ${max.toFixed(1)}`
})

function statusTagStyle(status) {
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

async function onIndicatorChange(e) {
  selectedIndex.value = e.detail.value
  await loadTrendData()
}

// 加载指标列表
async function loadIndicatorList() {
  try {
    const userId = uni.getStorageSync('userId')

    // 获取报告列表
    const res = await request({
      url: API.HEALTH_REPORT_LIST,
      method: 'GET',
      data: { userId }
    })

    if (res.code === 200 && res.data && res.data.length > 0) {
      const latestId = res.data[0].id

      // 获取最新报告详情
      const detailRes = await request({
        url: API.HEALTH_REPORT_DETAIL + '/' + latestId,
        method: 'GET',
        data: { userId }
      })

      if (detailRes.code === 200 && detailRes.data) {
        const indicators = detailRes.data.indicators || []
        const seen = new Set()
        const options = []
        for (const ind of indicators) {
          if (ind.indicatorCode && !seen.has(ind.indicatorCode)) {
            seen.add(ind.indicatorCode)
            options.push({
              label: ind.indicatorName,
              value: ind.indicatorCode,
              unit: ind.unit,
              referenceMin: ind.referenceMin,
              referenceMax: ind.referenceMax
            })
          }
        }
        indicatorOptions.value = options
        if (options.length > 0) {
          selectedIndex.value = 0
          await loadTrendData()
        }
      }
    }
  } catch (e) {
    console.error('加载指标列表失败', e)
  }
}

// 加载趋势数据
async function loadTrendData() {
  if (selectedIndex.value < 0) return
  loading.value = true
  try {
    const userId = uni.getStorageSync('userId')
    const code = indicatorOptions.value[selectedIndex.value].value

    const res = await request({
      url: API.HEALTH_INDICATOR_TREND,
      method: 'GET',
      data: { userId, code }
    })

    if (res.code === 200 && res.data) {
      trendData.value = res.data.trend || []
      trendAnalysis.value = res.data.analysis || ''
      // 如果后端没返回分析文本，前端自动生成
      if (!trendAnalysis.value) {
        generateTrendAnalysis()
      }
    } else {
      trendData.value = []
      trendAnalysis.value = ''
    }
  } catch (e) {
    console.error('加载趋势数据失败', e)
    trendData.value = []
    trendAnalysis.value = ''
  } finally {
    loading.value = false
  }
}

function generateTrendAnalysis() {
  const data = trendData.value
  if (data.length < 2) {
    trendAnalysis.value = ''
    return
  }
  const vals = data.map(d => d.value)
  const first = vals[0]
  const last = vals[vals.length - 1]
  const diff = last - first
  const pct = first !== 0 ? ((diff / first) * 100).toFixed(1) : 0
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const abnormalCount = data.filter(d => d.status > 0).length
  const name = indicatorOptions.value[selectedIndex.value]?.label || '该指标'

  let text = `${name}共记录${data.length}次，`
  if (Math.abs(diff) < 0.01) {
    text += '整体保持稳定。'
  } else if (diff > 0) {
    text += `从${first}上升至${last}，变化幅度约${Math.abs(pct)}%。`
  } else {
    text += `从${first}下降至${last}，变化幅度约${Math.abs(pct)}%。`
  }
  text += `波动范围为${min.toFixed(1)}~${max.toFixed(1)}。`
  if (abnormalCount > 0) {
    text += `其中有${abnormalCount}次出现异常，建议持续关注。`
  } else {
    text += '所有检测值均在正常范围内，继续保持。'
  }
  trendAnalysis.value = text
}

onMounted(async () => {
  await loadIndicatorList()
  loading.value = false
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

.selector-section {
  margin: 24rpx 28rpx 0;
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4rpx 16rpx rgba(92, 64, 51, 0.06);
  animation: slideUp 0.4s ease forwards;
}

.selector-label {
  font-size: 26rpx;
  font-weight: 600;
  color: #5C4033;
  flex-shrink: 0;
}

.selector-picker {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: #FFF8F0;
  padding: 12rpx 20rpx;
  border-radius: 12rpx;
}

.selector-value {
  font-size: 26rpx;
  color: #FF8C42;
  font-weight: 500;
}

.selector-arrow {
  font-size: 24rpx;
  color: #B8956A;
}

.chart-section {
  margin: 24rpx 28rpx 0;
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx 24rpx 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(92, 64, 51, 0.06);
  animation: slideUp 0.4s ease 0.08s forwards;
  opacity: 0;
}

.chart-container {
  display: flex;
  gap: 12rpx;
  height: 360rpx;
}

.chart-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 80rpx;
  text-align: right;
  padding: 10rpx 0;
}

.y-label {
  font-size: 18rpx;
  color: #B8956A;
}

.chart-body {
  flex: 1;
  position: relative;
  border-left: 2rpx solid #f0ebe4;
  border-bottom: 2rpx solid #f0ebe4;
  overflow: hidden;
}

.ref-zone {
  position: absolute;
  left: 0;
  right: 0;
  background: rgba(76, 175, 80, 0.08);
  border-top: 2rpx dashed rgba(76, 175, 80, 0.25);
  border-bottom: 2rpx dashed rgba(76, 175, 80, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.ref-zone-label {
  font-size: 18rpx;
  color: rgba(76, 175, 80, 0.6);
  white-space: nowrap;
}

.grid-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 1rpx;
  background: #f8f4f0;
}

.chart-points-layer {
  position: absolute;
  inset: 0;
  z-index: 3;
}

.chart-point-group {
  position: absolute;
  transform: translate(-50%, 50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.point-tooltip {
  margin-bottom: 8rpx;
  background: rgba(92, 64, 51, 0.85);
  padding: 4rpx 14rpx;
  border-radius: 10rpx;
  white-space: nowrap;
}

.tooltip-value {
  font-size: 20rpx;
  color: #fff;
  font-weight: 600;
}

.point-dot {
  width: 18rpx;
  height: 18rpx;
  border-radius: 50%;
  border: 4rpx solid #fff;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.12);
}

.chart-svg-layer {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

.chart-line-seg {
  position: absolute;
}

.chart-x-axis {
  position: relative;
  height: 44rpx;
  margin-left: 92rpx;
}

.x-label {
  position: absolute;
  transform: translateX(-50%);
  font-size: 18rpx;
  color: #B8956A;
  white-space: nowrap;
}

.empty-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 60rpx;
  animation: fadeIn 0.5s ease;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 24rpx;
}

.empty-text {
  font-size: 30rpx;
  font-weight: 600;
  color: #5C4033;
  margin-bottom: 12rpx;
}

.empty-hint {
  font-size: 24rpx;
  color: #B8956A;
  text-align: center;
  line-height: 1.6;
}

.trend-analysis-section {
  margin: 24rpx 28rpx 0;
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(92, 64, 51, 0.06);
  animation: slideUp 0.4s ease 0.16s forwards;
  opacity: 0;
}

.analysis-header {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-bottom: 16rpx;
}

.analysis-avatar {
  width: 48rpx;
  height: 48rpx;
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

.analysis-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #5C4033;
}

.analysis-bubble {
  background: #FFF8F0;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 16rpx;
}

.analysis-text {
  font-size: 26rpx;
  color: #5C4033;
  line-height: 1.8;
}

.trend-summary-badges {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
}

.trend-badge {
  padding: 8rpx 20rpx;
  border-radius: 16rpx;
}

.range-badge {
  background: #f5f0eb;
  color: #8B7355;
}

.badge-text {
  font-size: 22rpx;
  font-weight: 500;
}

.history-section {
  margin: 24rpx 28rpx 0;
}

.table-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #5C4033;
  margin-bottom: 16rpx;
  display: block;
}

.table-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 20rpx 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(92, 64, 51, 0.06);
}

.table-header {
  display: flex;
  padding: 8rpx 0 16rpx;
  border-bottom: 2rpx solid #f0ebe4;
}

.th {
  font-size: 22rpx;
  color: #B8956A;
  font-weight: 600;
}

.table-row {
  display: flex;
  align-items: center;
  padding: 18rpx 0;
  border-bottom: 1rpx solid #f8f4f0;
  opacity: 0;
  animation: slideUp 0.3s ease forwards;
}

.table-row:last-child {
  border-bottom: none;
}

.td {
  font-size: 24rpx;
  color: #5C4033;
}

.col-date {
  flex: 2;
}

.col-value {
  flex: 1.5;
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}

.td-value {
  font-size: 26rpx;
  font-weight: 600;
  color: #5C4033;
}

.td-unit {
  font-size: 20rpx;
  color: #B8956A;
}

.col-status {
  flex: 1.2;
  display: flex;
  justify-content: flex-end;
}

.status-mini-tag {
  display: inline-flex;
  padding: 4rpx 14rpx;
  border-radius: 12rpx;
}

.status-mini-text {
  font-size: 20rpx;
  font-weight: 600;
}

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

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-16rpx); }
}
</style>
