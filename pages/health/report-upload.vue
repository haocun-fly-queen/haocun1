<!-- pages/health/report-upload.vue -->
<template>
  <view class="page">
    <!-- 引导区 -->
    <view class="guide-section">
      <view class="guide-chicken">
        <view class="chicken-speak">
          <view class="chicken-body-mini">
            <view class="chicken-head-mini">
              <view class="chicken-eye-mini left"></view>
              <view class="chicken-eye-mini right"></view>
              <view class="chicken-beak-mini"></view>
            </view>
          </view>
        </view>
        <view class="guide-bubble">
          <text class="guide-text">拍一拍你的体检报告，小唧帮你解读~</text>
          <view class="bubble-tail"></view>
        </view>
      </view>
    </view>

    <!-- 上传区域 -->
    <view class="upload-section">
      <view
        class="upload-area"
        v-if="imageList.length === 0"
        @click="chooseImage"
      >
        <view class="upload-icon-wrap">
          <view class="upload-camera">
            <view class="camera-body"></view>
            <view class="camera-lens"></view>
          </view>
        </view>
        <text class="upload-title">拍照或选择报告图片</text>
        <text class="upload-hint">支持 JPG / PNG，可多张上传</text>
      </view>

      <!-- 图片预览区 -->
      <view class="preview-area" v-if="imageList.length > 0">
        <scroll-view scroll-x class="preview-scroll">
          <view class="preview-list">
            <view
              class="preview-item"
              v-for="(img, index) in imageList"
              :key="index"
            >
              <image
                class="preview-img"
                :src="img"
                mode="aspectFill"
                @click="previewImage(index)"
              />
              <view class="preview-remove" @click.stop="removeImage(index)">
                <text class="remove-icon">×</text>
              </view>
              <view class="preview-index">
                <text class="index-text">{{ index + 1 }}</text>
              </view>
            </view>
            <view class="preview-add" @click="chooseImage" v-if="imageList.length < 5">
              <text class="add-icon">+</text>
              <text class="add-text">继续添加</text>
            </view>
          </view>
        </scroll-view>
        <text class="preview-count">已选择 {{ imageList.length }} 张图片</text>
      </view>
    </view>

    <!-- 表单区 -->
    <view class="form-section">
      <view class="form-group">
        <view class="form-label-row">
          <text class="form-label">报告名称</text>
          <text class="form-required">*</text>
        </view>
        <input
          class="form-input"
          v-model="formData.reportName"
          placeholder="如：2026年年度体检"
          placeholder-class="placeholder-style"
          maxlength="50"
        />
      </view>

      <view class="form-group">
        <text class="form-label">体检日期</text>
        <picker mode="date" :value="formData.reportDate" @change="onDateChange">
          <view class="form-picker">
            <text :class="formData.reportDate ? 'picker-value' : 'picker-placeholder'">
              {{ formData.reportDate || '请选择体检日期' }}
            </text>
            <text class="picker-arrow">›</text>
          </view>
        </picker>
      </view>

      <view class="form-group">
        <text class="form-label">体检机构</text>
        <input
          class="form-input"
          v-model="formData.hospital"
          placeholder="如：协和医院"
          placeholder-class="placeholder-style"
          maxlength="50"
        />
      </view>

      <view class="form-group">
        <text class="form-label">报告类型</text>
        <picker :range="reportTypes" :range-key="'label'" :value="typeIndex" @change="onTypeChange">
          <view class="form-picker">
            <text :class="typeIndex >= 0 ? 'picker-value' : 'picker-placeholder'">
              {{ typeIndex >= 0 ? reportTypes[typeIndex].label : '请选择报告类型' }}
            </text>
            <text class="picker-arrow">›</text>
          </view>
        </picker>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="action-section">
      <view class="submit-btn" @click="submitReport">
        <text class="submit-text">开始 AI 分析</text>
      </view>

      <!-- 免责声明 -->
      <view class="disclaimer">
        <view class="disclaimer-icon">
          <text class="shield-icon">🛡</text>
        </view>
        <view class="disclaimer-content">
          <text class="disclaimer-title">隐私安全提示</text>
          <text class="disclaimer-text">
            您的体检报告仅用于 AI 分析，数据加密存储，不会泄露给第三方。AI 分析结果仅供参考，不构成医学诊断，如有健康问题请咨询专业医生。
          </text>
        </view>
      </view>
    </view>

    <!-- 全屏 Loading 覆盖层 -->
    <view class="loading-overlay" v-if="analyzing">
      <view class="loading-content">
        <view class="loading-chicken-area">
          <view class="chicken-loading-body">
            <view class="chicken-loading-head">
              <view class="chicken-eye-loading left"></view>
              <view class="chicken-eye-loading right"></view>
              <view class="chicken-beak-loading"></view>
            </view>
            <view class="chicken-accessory glasses" v-if="loadingPhase === 0">
              <view class="glass-lens left"></view>
              <view class="glass-lens right"></view>
              <view class="glass-bridge"></view>
            </view>
            <view class="chicken-accessory calculator" v-if="loadingPhase === 1">
              <view class="calc-body">
                <view class="calc-screen"></view>
              </view>
            </view>
            <view class="chicken-accessory notepad" v-if="loadingPhase === 2">
              <view class="notepad-body">
                <view class="notepad-line"></view>
                <view class="notepad-line short"></view>
                <view class="notepad-line"></view>
              </view>
            </view>
            <view class="chicken-accessory thumb" v-if="loadingPhase === 3">
              <view class="thumb-up">👍</view>
            </view>
          </view>
        </view>

        <view class="loading-steps">
          <view
            class="loading-step"
            v-for="(step, index) in loadingSteps"
            :key="index"
            :class="{
              active: index === loadingPhase,
              done: index < loadingPhase
            }"
          >
            <view class="step-dot">
              <text class="step-check" v-if="index < loadingPhase">✓</text>
              <view class="step-pulse" v-if="index === loadingPhase"></view>
            </view>
            <text class="step-text">{{ step }}</text>
          </view>
        </view>

        <text class="loading-tip">{{ loadingTips[loadingPhase] }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { API_BASE_URL } from '../../config'

const imageList = ref([])
const analyzing = ref(false)
const loadingPhase = ref(0)
const typeIndex = ref(-1)

const formData = reactive({
  reportName: '',
  reportDate: '',
  hospital: '',
  reportType: ''
})

const reportTypes = [
  { label: '年度体检', value: 'annual' },
  { label: '入职体检', value: 'employment' },
  { label: '专项检查', value: 'special' },
  { label: '孕检', value: 'prenatal' },
  { label: '其他', value: 'other' }
]

const loadingSteps = [
  '正在识别报告内容...',
  '正在分析指标...',
  '正在生成健康建议...',
  '分析完成！'
]

const loadingTips = [
  '小唧戴上了眼镜，仔细查看你的报告',
  '小唧拿出计算器，逐项分析数据',
  '小唧在认真写笔记，为你整理建议',
  '小唧竖起大拇指，一切就绪！'
]

const canSubmit = computed(() => {
  return imageList.value.length > 0 && formData.reportName.trim().length > 0
})

function chooseImage() {
  const remain = 5 - imageList.value.length
  if (remain <= 0) {
    uni.showToast({ title: '最多上传5张图片', icon: 'none' })
    return
  }
  
  // #ifdef H5
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/jpeg,image/png'
  input.multiple = true
  input.addEventListener('change', (e) => {
    const files = Array.from(e.target.files).slice(0, remain)
    const newImages = []
    let loaded = 0
    
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (evt) => {
        newImages.push(evt.target.result)
        loaded++
        if (loaded === files.length) {
          imageList.value = [...imageList.value, ...newImages]
        }
      }
      reader.readAsDataURL(file)
    })
  })
  input.click()
  // #endif
  
  // #ifndef H5
  uni.chooseImage({
    count: remain,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      imageList.value = [...imageList.value, ...res.tempFilePaths]
    }
  })
  // #endif
}

function previewImage(index) {
  uni.previewImage({
    current: index,
    urls: imageList.value
  })
}

function removeImage(index) {
  imageList.value.splice(index, 1)
}

function onDateChange(e) {
  formData.reportDate = e.detail.value
}

function onTypeChange(e) {
  typeIndex.value = e.detail.value
  formData.reportType = reportTypes[e.detail.value].value
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function submitReport() {
  if (imageList.value.length === 0) {
    uni.showToast({ title: '请先上传报告图片', icon: 'none' })
    return
  }
  if (!formData.reportName.trim()) {
    uni.showToast({ title: '请填写报告名称', icon: 'none' })
    return
  }
  if (analyzing.value) return

  analyzing.value = true
  loadingPhase.value = 0

  try {
    const userId = uni.getStorageSync('userId')
    const token = uni.getStorageSync('token')

    // #ifdef H5
    // H5端：imageList中已是base64数据，需要转为Blob上传
    const base64Data = imageList.value[0]
    const formDataObj = new FormData()

    if (base64Data.startsWith('data:')) {
      const parts = base64Data.split(',')
      const mimeType = parts[0].match(/:(.*?);/)[1]
      const bstr = atob(parts[1])
      const n = bstr.length
      const u8arr = new Uint8Array(n)
      for (let i = 0; i < n; i++) {
        u8arr[i] = bstr.charCodeAt(i)
      }
      const blob = new Blob([u8arr], { type: mimeType })
      formDataObj.append('file', blob, 'report.jpg')
    }

    formDataObj.append('userId', String(userId))
    formDataObj.append('reportName', formData.reportName)
    formDataObj.append('reportDate', formData.reportDate || '')
    formDataObj.append('hospital', formData.hospital || '')
    formDataObj.append('reportType', formData.reportType || '')

    const uploadRes = await fetch(API_BASE_URL + '/api/health/report/upload', {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: formDataObj
    }).then(r => r.json())
    // #endif

    // #ifndef H5
    // 用 uni.uploadFile 发 multipart 请求（带文件 + 表单数据）
    const uploadRes = await new Promise((resolve, reject) => {
      uni.uploadFile({
        url: API_BASE_URL + '/api/health/report/upload',
        filePath: imageList.value[0],
        name: 'file',
        formData: {
          userId: String(userId),
          reportName: formData.reportName,
          reportDate: formData.reportDate || '',
          hospital: formData.hospital || '',
          reportType: formData.reportType || ''
        },
        header: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        success: (res) => {
          try {
            resolve(JSON.parse(res.data))
          } catch (e) {
            reject(new Error('解析响应失败'))
          }
        },
        fail: (err) => reject(err)
      })
    })
    // #endif

    // 分步动画
    await delay(1000)
    loadingPhase.value = 1
    await delay(1200)
    loadingPhase.value = 2
    await delay(1000)
    loadingPhase.value = 3
    await delay(800)

    if (uploadRes.code === 200 && uploadRes.data) {
      uni.showToast({ title: '分析完成', icon: 'success' })
      setTimeout(() => {
        analyzing.value = false
        const reportId = uploadRes.data.id || uploadRes.data
        if (reportId) {
          uni.redirectTo({ url: `/pages/health/report-detail?id=${reportId}` })
        } else {
          uni.navigateBack()
        }
      }, 600)
    } else {
      throw new Error(uploadRes.message || '提交失败')
    }

  } catch (e) {
    analyzing.value = false
    console.error('提交报告失败', e)
    uni.showToast({ title: e.message || '分析失败，请重试', icon: 'none' })
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #FFF8F0;
  padding-bottom: 60rpx;
}

/* ========== 引导区 ========== */
.guide-section {
  padding: 32rpx 32rpx 0;
}

.guide-chicken {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
}

.chicken-speak { flex-shrink: 0; }

.chicken-body-mini {
  width: 80rpx;
  height: 80rpx;
  background: #FFD030;
  border-radius: 50%;
  position: relative;
  animation: bounce 2.5s ease-in-out infinite;
}

.chicken-head-mini {
  position: absolute;
  top: -20rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 50rpx;
  height: 50rpx;
  background: #FFD030;
  border-radius: 50%;
}

.chicken-eye-mini {
  position: absolute;
  width: 8rpx;
  height: 10rpx;
  background: #5C4033;
  border-radius: 50%;
  top: 16rpx;
}

.chicken-eye-mini.left { left: 12rpx; }
.chicken-eye-mini.right { right: 12rpx; }

.chicken-beak-mini {
  position: absolute;
  bottom: 6rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8rpx solid transparent;
  border-right: 8rpx solid transparent;
  border-top: 10rpx solid #FF8C42;
}

.guide-bubble {
  background: #fff;
  border-radius: 20rpx;
  padding: 20rpx 28rpx;
  position: relative;
  box-shadow: 0 4rpx 12rpx rgba(92, 64, 51, 0.06);
  margin-top: 8rpx;
  animation: slideUp 0.5s ease forwards;
}

.bubble-tail {
  position: absolute;
  left: -14rpx;
  top: 24rpx;
  width: 0;
  height: 0;
  border-top: 10rpx solid transparent;
  border-bottom: 10rpx solid transparent;
  border-right: 14rpx solid #fff;
}

.guide-text {
  font-size: 28rpx;
  color: #5C4033;
  line-height: 1.6;
}

/* ========== 上传区域 ========== */
.upload-section { padding: 32rpx; }

.upload-area {
  background: #fff;
  border: 3rpx dashed #FFB347;
  border-radius: 24rpx;
  padding: 64rpx 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.15s ease, border-color 0.2s ease;
}

.upload-area:active {
  transform: scale(0.98);
  border-color: #FF8C42;
}

.upload-icon-wrap { margin-bottom: 24rpx; }

.upload-camera {
  width: 96rpx;
  height: 76rpx;
  position: relative;
}

.camera-body {
  width: 96rpx;
  height: 64rpx;
  background: #FFB347;
  border-radius: 12rpx;
  position: absolute;
  bottom: 0;
}

.camera-lens {
  width: 36rpx;
  height: 36rpx;
  border: 4rpx solid #fff;
  border-radius: 50%;
  background: #FFD93D;
  position: absolute;
  top: 14rpx;
  left: 50%;
  transform: translateX(-50%);
}

.upload-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #5C4033;
  margin-bottom: 8rpx;
}

.upload-hint {
  font-size: 22rpx;
  color: #B8956A;
}

/* ========== 图片预览 ========== */
.preview-area { animation: fadeIn 0.3s ease; }

.preview-scroll { white-space: nowrap; }

.preview-list {
  display: inline-flex;
  gap: 16rpx;
  padding: 8rpx 0;
}

.preview-item {
  position: relative;
  width: 200rpx;
  height: 260rpx;
  border-radius: 16rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.preview-img { width: 100%; height: 100%; }

.preview-remove {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 40rpx;
  height: 40rpx;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-icon {
  font-size: 28rpx;
  color: #fff;
  line-height: 1;
}

.preview-index {
  position: absolute;
  bottom: 8rpx;
  left: 8rpx;
  background: rgba(255, 140, 66, 0.9);
  border-radius: 12rpx;
  padding: 2rpx 12rpx;
}

.index-text {
  font-size: 20rpx;
  color: #fff;
  font-weight: 600;
}

.preview-add {
  width: 200rpx;
  height: 260rpx;
  border: 3rpx dashed #FFB347;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  flex-shrink: 0;
  transition: transform 0.15s ease;
}

.preview-add:active { transform: scale(0.95); }

.add-icon {
  font-size: 48rpx;
  color: #FFB347;
  font-weight: 300;
  line-height: 1;
}

.add-text {
  font-size: 22rpx;
  color: #B8956A;
}

.preview-count {
  display: block;
  text-align: center;
  font-size: 22rpx;
  color: #B8956A;
  margin-top: 16rpx;
}

/* ========== 表单区 ========== */
.form-section { padding: 0 32rpx; margin-top: 8rpx; }

.form-group {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx 28rpx;
  margin-bottom: 16rpx;
  animation: slideUp 0.4s ease forwards;
}

.form-group:nth-child(2) { animation-delay: 0.05s; }
.form-group:nth-child(3) { animation-delay: 0.1s; }
.form-group:nth-child(4) { animation-delay: 0.15s; }

.form-label-row {
  display: flex;
  align-items: center;
  gap: 4rpx;
  margin-bottom: 12rpx;
}

.form-label {
  font-size: 26rpx;
  font-weight: 600;
  color: #5C4033;
  margin-bottom: 12rpx;
  display: block;
}

.form-label-row .form-label { margin-bottom: 0; }

.form-required {
  font-size: 26rpx;
  color: #f44336;
}

.form-input {
  width: 100%;
  font-size: 28rpx;
  color: #5C4033;
  padding: 8rpx 0;
  border: none;
  background: transparent;
}

.placeholder-style {
  color: #ccc;
  font-size: 28rpx;
}

.form-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8rpx 0;
}

.picker-value {
  font-size: 28rpx;
  color: #5C4033;
}

.picker-placeholder {
  font-size: 28rpx;
  color: #ccc;
}

.picker-arrow {
  font-size: 32rpx;
  color: #ccc;
  font-weight: 300;
}

/* ========== 提交按钮 ========== */
.action-section { padding: 20rpx 32rpx 0; }

.submit-btn {
  background: linear-gradient(135deg, #FF8C42, #FFB347);
  border-radius: 44rpx;
  padding: 26rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 28rpx rgba(255, 140, 66, 0.3);
  transition: transform 0.15s ease, opacity 0.2s ease;
}

.submit-btn:active { transform: scale(0.97); }

.submit-text {
  font-size: 30rpx;
  font-weight: 600;
  color: #fff;
}

/* ========== 免责声明 ========== */
.disclaimer {
  display: flex;
  gap: 16rpx;
  margin-top: 32rpx;
  padding: 24rpx;
  background: rgba(255, 140, 66, 0.06);
  border-radius: 16rpx;
  border: 1rpx solid rgba(255, 140, 66, 0.12);
}

.disclaimer-icon { flex-shrink: 0; margin-top: 2rpx; }

.shield-icon { font-size: 28rpx; }

.disclaimer-content { flex: 1; }

.disclaimer-title {
  font-size: 24rpx;
  font-weight: 600;
  color: #5C4033;
  display: block;
  margin-bottom: 6rpx;
}

.disclaimer-text {
  font-size: 22rpx;
  color: #8B7355;
  line-height: 1.6;
}

/* ========== Loading 覆盖层 ========== */
.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(255, 248, 240, 0.97);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 60rpx;
  width: 100%;
}

.loading-chicken-area { margin-bottom: 60rpx; }

.chicken-loading-body {
  width: 160rpx;
  height: 160rpx;
  background: #FFD030;
  border-radius: 50%;
  position: relative;
  animation: bounce 2s ease-in-out infinite;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chicken-loading-head {
  position: absolute;
  top: -40rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 100rpx;
  height: 100rpx;
  background: #FFD030;
  border-radius: 50%;
}

.chicken-eye-loading {
  position: absolute;
  width: 14rpx;
  height: 16rpx;
  background: #5C4033;
  border-radius: 50%;
  top: 30rpx;
  animation: blink 3s ease-in-out infinite;
}

.chicken-eye-loading.left { left: 22rpx; }
.chicken-eye-loading.right { right: 22rpx; }

.chicken-beak-loading {
  position: absolute;
  bottom: 16rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 14rpx solid transparent;
  border-right: 14rpx solid transparent;
  border-top: 18rpx solid #FF8C42;
}

.chicken-accessory { position: absolute; }

.chicken-accessory.glasses {
  top: -10rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 70rpx;
  height: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
}

.glass-lens {
  width: 26rpx;
  height: 22rpx;
  border: 3rpx solid #5C4033;
  border-radius: 50%;
  background: rgba(135, 206, 250, 0.2);
}

.glass-bridge {
  width: 10rpx;
  height: 3rpx;
  background: #5C4033;
}

.chicken-accessory.calculator {
  right: -30rpx;
  top: 30rpx;
}

.calc-body {
  width: 48rpx;
  height: 64rpx;
  background: #8B7355;
  border-radius: 8rpx;
  padding: 6rpx;
}

.calc-screen {
  width: 100%;
  height: 16rpx;
  background: #a8e6cf;
  border-radius: 4rpx;
}

.chicken-accessory.notepad {
  right: -36rpx;
  top: 20rpx;
}

.notepad-body {
  width: 48rpx;
  height: 60rpx;
  background: #fff;
  border: 2rpx solid #B8956A;
  border-radius: 6rpx;
  padding: 10rpx 8rpx;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.notepad-line {
  height: 3rpx;
  background: #FFB347;
  border-radius: 2rpx;
}

.notepad-line.short { width: 60%; }

.chicken-accessory.thumb {
  right: -24rpx;
  top: 20rpx;
}

.thumb-up {
  font-size: 40rpx;
  animation: bounce 1s ease-in-out infinite;
}

/* ========== Loading 步骤 ========== */
.loading-steps {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  margin-bottom: 40rpx;
}

.loading-step {
  display: flex;
  align-items: center;
  gap: 20rpx;
  opacity: 0.35;
  transition: opacity 0.4s ease;
}

.loading-step.active { opacity: 1; }
.loading-step.done { opacity: 0.7; }

.step-dot {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background: #f0ebe4;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  transition: background 0.3s ease;
}

.loading-step.active .step-dot { background: #FFB347; }
.loading-step.done .step-dot { background: #4CAF50; }

.step-check {
  font-size: 20rpx;
  color: #fff;
  font-weight: 700;
}

.step-pulse {
  width: 16rpx;
  height: 16rpx;
  background: #fff;
  border-radius: 50%;
  animation: pulse 1s ease-in-out infinite;
}

.step-text {
  font-size: 28rpx;
  color: #5C4033;
  transition: color 0.3s ease;
}

.loading-step.active .step-text {
  font-weight: 600;
  color: #FF8C42;
}

.loading-step.done .step-text {
  color: #4CAF50;
  text-decoration: line-through;
}

.loading-tip {
  font-size: 24rpx;
  color: #B8956A;
  text-align: center;
  animation: fadeIn 0.4s ease;
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

@keyframes blink {
  0%, 90%, 100% { transform: scaleY(1); }
  95% { transform: scaleY(0.1); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.6); }
}
</style>
