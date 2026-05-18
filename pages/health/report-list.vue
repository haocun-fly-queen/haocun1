<!-- pages/health/report-list.vue -->
<template>
  <view class="page">
    <!-- 顶部健康评分卡片 -->
    <view class="score-card" @click="goToScore" v-if="healthScore !== null">
      <view class="score-ring-wrap">
        <view class="score-ring">
          <view class="score-ring-bg"></view>
          <view class="score-ring-progress" :style="ringStyle"></view>
          <view class="score-ring-inner">
            <text class="score-number">{{ displayScore }}</text>
            <text class="score-label">健康评分</text>
          </view>
        </view>
      </view>
      <view class="score-info">
        <text class="score-level">{{ scoreLevel }}</text>
        <text class="score-date">上次体检：{{ lastReportDate }}</text>
      </view>
      <view class="score-arrow">
        <text class="arrow-icon">›</text>
      </view>
    </view>

    <!-- 报告列表 -->
    <view class="section-header" v-if="reportList.length > 0">
      <text class="section-title">历史报告</text>
      <text class="section-count">共 {{ reportList.length }} 份</text>
    </view>

    <view class="report-list" v-if="reportList.length > 0">
      <view
        class="report-card"
        v-for="(item, index) in reportList"
        :key="item.id"
        :style="{ animationDelay: index * 0.08 + 's' }"
        @click="goToDetail(item.id)"
        @longpress="confirmDelete(item)"
      >
        <view class="report-card-left">
          <view class="report-icon" :class="'status-' + getStatusClass(item)">
            <text class="report-icon-text">{{ getStatusIcon(item) }}</text>
          </view>
        </view>
        <view class="report-card-body">
          <text class="report-name">{{ item.reportName }}</text>
          <view class="report-meta">
            <text class="report-date">{{ formatDate(item.reportDate) }}</text>
            <text class="report-sep" v-if="item.hospital">·</text>
            <text class="report-hospital">{{ item.hospital }}</text>
          </view>
          <view class="report-stats">
            <view class="stat-badge" v-if="item.overallScore">
              <text class="stat-value">{{ item.overallScore }}</text>
              <text class="stat-unit">分</text>
            </view>
            <view class="stat-badge abnormal" v-if="item.abnormalCount > 0">
              <text class="stat-value">{{ item.abnormalCount }}</text>
              <text class="stat-unit">项异常</text>
            </view>
            <view class="stat-badge total" v-if="item.totalIndicators">
              <text class="stat-value">{{ item.totalIndicators }}</text>
              <text class="stat-unit">项指标</text>
            </view>
          </view>
        </view>
        <view class="report-card-arrow">
          <text class="arrow-icon">›</text>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="!loading && reportList.length === 0">
      <view class="empty-chicken">
        <view class="chicken-body">
          <view class="chicken-head">
            <view class="chicken-eye left"></view>
            <view class="chicken-eye right"></view>
            <view class="chicken-beak"></view>
          </view>
          <view class="chicken-wing left"></view>
          <view class="chicken-wing right"></view>
        </view>
        <view class="magnifier">
          <view class="magnifier-glass"></view>
          <view class="magnifier-handle"></view>
        </view>
      </view>
      <text class="empty-title">还没有体检报告</text>
      <text class="empty-desc">上传一份体检报告，小唧帮你解读~</text>
      <view class="empty-btn" @click="goToUpload">
        <text class="empty-btn-text">上传第一份报告</text>
      </view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <view class="loading-chicken">
        <view class="chicken-loading-body bounce"></view>
      </view>
      <text class="loading-text">小唧正在翻找你的报告...</text>
    </view>

    <!-- 悬浮上传按钮 -->
    <view class="fab-btn" @click="goToUpload" v-if="!loading">
      <text class="fab-icon">+</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import request from '../../utils/request'
import { API } from '../../config'

const loading = ref(true)
const healthScore = ref(null)
const lastReportDate = ref('')
const reportList = ref([])
const displayScore = ref(0)

// 环形进度样式
const ringStyle = computed(() => {
  const score = healthScore.value || 0
  const deg = (score / 100) * 360
  const color = score >= 80 ? '#4CAF50' : score >= 60 ? '#FFD93D' : '#f44336'
  return {
    background: `conic-gradient(${color} ${deg}deg, #f0ebe4 ${deg}deg)`
  }
})

// 评分等级
const scoreLevel = computed(() => {
  const s = healthScore.value || 0
  if (s >= 90) return '非常健康'
  if (s >= 80) return '健康状况良好'
  if (s >= 60) return '需要关注'
  return '建议尽快复查'
})

function getStatusClass(item) {
  if (item.status === 0 || item.status === 1) return 'pending'
  if (item.status === 3) return 'failed'
  if (item.abnormalCount > 3) return 'warning'
  return 'normal'
}

function getStatusIcon(item) {
  if (item.status === 0 || item.status === 1) return '⏳'
  if (item.status === 3) return '✕'
  if (item.abnormalCount > 3) return '⚠'
  return '✓'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

// 加载健康评分 — 静默处理无数据
async function loadHealthScore() {
  try {
    const userId = uni.getStorageSync('userId')
    const res = await request({
      url: API.HEALTH_SCORE,
      method: 'GET',
      data: { userId }
    })
    if (res.code === 200 && res.data) {
      healthScore.value = res.data.overallScore || 0
      animateScore(healthScore.value)
    }
  } catch (e) {
    // 暂无报告数据属于正常情况，不报错
    healthScore.value = null
  }
}

// 加载报告列表 — 静默处理无数据
async function loadReports() {
  loading.value = true
  try {
    const userId = uni.getStorageSync('userId')
    const res = await request({
      url: API.HEALTH_REPORT_LIST,
      method: 'GET',
      data: { userId }
    })
    if (res.code === 200) {
      reportList.value = res.data || []
      if (reportList.value.length > 0 && reportList.value[0].reportDate) {
        lastReportDate.value = formatDate(reportList.value[0].reportDate)
      }
    }
  } catch (e) {
    reportList.value = []
  } finally {
    loading.value = false
  }
}




// 评分数字滚动
function animateScore(target) {
  const duration = 1500
  const startTime = Date.now()
  const step = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    displayScore.value = Math.round(eased * target)
    if (progress < 1) {
      setTimeout(step, 16)
    }
  }
  step()
}

// 删除报告
function confirmDelete(item) {
  uni.showModal({
    title: '删除报告',
    content: `确定删除「${item.reportName}」吗？删除后不可恢复。`,
    confirmColor: '#f44336',
    success: async (res) => {
      if (res.confirm) {
        try {
          const userId = uni.getStorageSync('userId')
          await request({
            url: API.HEALTH_REPORT_DELETE + '/' + item.id,
            method: 'DELETE',
            data: { userId }
          })
          uni.showToast({ title: '已删除', icon: 'success' })
          loadReports()
          loadHealthScore()
        } catch (e) {
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
  })
}

function goToScore() {
  uni.navigateTo({ url: '/pages/health/score' })
}

function goToDetail(id) {
  uni.navigateTo({ url: `/pages/health/report-detail?id=${id}` })
}

function goToUpload() {
  uni.navigateTo({ url: '/pages/health/report-upload' })
}

onMounted(() => {
  loadHealthScore()
  loadReports()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #FFF8F0;
  padding: 0 0 120rpx 0;
  position: relative;
}

/* ========== 评分卡片 ========== */
.score-card {
  margin: 24rpx 28rpx 0;
  background: linear-gradient(135deg, #FF8C42 0%, #FFB347 100%);
  border-radius: 28rpx;
  padding: 36rpx 32rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 8rpx 32rpx rgba(255, 140, 66, 0.3);
  animation: slideUp 0.5s ease forwards;
}

.score-ring-wrap { flex-shrink: 0; }

.score-ring {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.score-ring-bg {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
}

.score-ring-progress {
  position: absolute;
  inset: 6rpx;
  border-radius: 50%;
  animation: ringFadeIn 1s ease-in-out;
}

.score-ring-inner {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
}

.score-number {
  font-size: 36rpx;
  font-weight: 700;
  color: #FF8C42;
  line-height: 1;
}

.score-label {
  font-size: 16rpx;
  color: #8B7355;
  margin-top: 2rpx;
}

.score-info { flex: 1; margin-left: 28rpx; }

.score-level {
  font-size: 32rpx;
  font-weight: 600;
  color: #fff;
  display: block;
}

.score-date {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 8rpx;
  display: block;
}

.score-arrow {
  flex-shrink: 0;
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.arrow-icon {
  font-size: 36rpx;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 300;
}

/* ========== 区域标题 ========== */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 36rpx 32rpx 16rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #5C4033;
}

.section-count {
  font-size: 24rpx;
  color: #B8956A;
}

/* ========== 报告卡片 ========== */
.report-card {
  margin: 0 28rpx 20rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx 24rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 4rpx 16rpx rgba(92, 64, 51, 0.06);
  opacity: 0;
  animation: slideUp 0.5s ease forwards;
  transition: transform 0.15s ease;
}

.report-card:active { transform: scale(0.97); }

.report-card-left { flex-shrink: 0; margin-right: 20rpx; }

.report-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.report-icon.status-normal { background: #E8F5E9; }
.report-icon.status-warning { background: #FFF3E0; }
.report-icon.status-pending { background: #f5f5f5; }
.report-icon.status-failed { background: #FFEBEE; }

.report-icon-text { font-size: 32rpx; }

.report-card-body { flex: 1; min-width: 0; }

.report-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #5C4033;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.report-meta {
  display: flex;
  align-items: center;
  margin-top: 8rpx;
  gap: 8rpx;
}

.report-date { font-size: 22rpx; color: #B8956A; }
.report-sep { font-size: 22rpx; color: #ddd; }

.report-hospital {
  font-size: 22rpx;
  color: #B8956A;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.report-stats {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 12rpx;
  flex-wrap: wrap;
}

.stat-badge {
  display: inline-flex;
  align-items: baseline;
  gap: 2rpx;
  background: #FFF3E0;
  padding: 4rpx 14rpx;
  border-radius: 20rpx;
}

.stat-badge.abnormal { background: #FFEBEE; }
.stat-badge.total { background: #f5f0eb; }

.stat-value { font-size: 22rpx; font-weight: 600; color: #5C4033; }
.stat-unit { font-size: 18rpx; color: #8B7355; }

.report-card-arrow {
  flex-shrink: 0;
  width: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.report-card-arrow .arrow-icon { font-size: 32rpx; color: #ccc; }

/* ========== 空状态 ========== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 160rpx;
  animation: fadeIn 0.6s ease;
}

.empty-chicken {
  position: relative;
  width: 200rpx;
  height: 220rpx;
  margin-bottom: 40rpx;
}

.chicken-body {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 120rpx;
  height: 120rpx;
  background: #FFD030;
  border-radius: 50%;
  animation: bounce 2s ease-in-out infinite;
}

.chicken-head {
  position: absolute;
  top: -40rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 80rpx;
  height: 80rpx;
  background: #FFD030;
  border-radius: 50%;
}

.chicken-eye {
  position: absolute;
  width: 12rpx;
  height: 14rpx;
  background: #5C4033;
  border-radius: 50%;
  top: 24rpx;
}

.chicken-eye.left { left: 18rpx; }
.chicken-eye.right { right: 18rpx; }

.chicken-beak {
  position: absolute;
  bottom: 12rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 12rpx solid transparent;
  border-right: 12rpx solid transparent;
  border-top: 16rpx solid #FF8C42;
}

.chicken-wing {
  position: absolute;
  width: 36rpx;
  height: 50rpx;
  background: #FFB347;
  border-radius: 50% 50% 50% 50%;
  top: 20rpx;
}

.chicken-wing.left {
  left: -12rpx;
  transform: rotate(15deg);
  animation: wingWave 1.5s ease-in-out infinite;
}

.chicken-wing.right {
  right: -12rpx;
  transform: rotate(-15deg);
  animation: wingWave 1.5s ease-in-out infinite reverse;
}

.magnifier { position: absolute; bottom: 10rpx; right: -10rpx; }

.magnifier-glass {
  width: 56rpx;
  height: 56rpx;
  border: 6rpx solid #B8956A;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
}

.magnifier-handle {
  width: 8rpx;
  height: 28rpx;
  background: #B8956A;
  border-radius: 4rpx;
  transform: rotate(45deg);
  margin-top: -12rpx;
  margin-left: 38rpx;
}

.empty-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #5C4033;
  margin-bottom: 12rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: #B8956A;
  margin-bottom: 48rpx;
}

.empty-btn {
  background: linear-gradient(135deg, #FF8C42, #FFB347);
  padding: 22rpx 64rpx;
  border-radius: 44rpx;
  box-shadow: 0 6rpx 24rpx rgba(255, 140, 66, 0.3);
  transition: transform 0.15s ease;
}

.empty-btn:active { transform: scale(0.95); }

.empty-btn-text {
  font-size: 28rpx;
  font-weight: 600;
  color: #fff;
}

/* ========== 加载状态 ========== */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 200rpx;
}

.loading-chicken {
  width: 100rpx;
  height: 100rpx;
  background: #FFD030;
  border-radius: 50%;
  animation: bounce 1s ease-in-out infinite;
}

.loading-text {
  font-size: 26rpx;
  color: #B8956A;
  margin-top: 32rpx;
}

/* ========== 悬浮按钮 ========== */
.fab-btn {
  position: fixed;
  right: 40rpx;
  bottom: 140rpx;
  width: 100rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #FF8C42, #FFB347);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 28rpx rgba(255, 140, 66, 0.4);
  z-index: 100;
  transition: transform 0.15s ease;
}

.fab-btn:active { transform: scale(0.9); }

.fab-icon {
  font-size: 52rpx;
  color: #fff;
  font-weight: 300;
  line-height: 1;
  margin-top: -4rpx;
}

/* ========== 动画 ========== */
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

@keyframes wingWave {
  0%, 100% { transform: rotate(15deg); }
  50% { transform: rotate(30deg); }
}

@keyframes ringFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
