<template>
  <view class="container">
    <!-- 添加体重按钮 -->
    <view class="add-btn" @click="showAddModal">
      <text class="add-icon">+</text>
      <text class="add-text">记录体重</text>
    </view>

    <!-- 体重统计卡片 -->
    <view class="stats-card">
      <view class="stats-header">
        <text class="stats-title">体重统计</text>
        <text class="stats-unit">kg</text>
      </view>
      <view class="stats-grid">
        <view class="stat-item">
          <text class="stat-value">{{ currentWeight || '--' }}</text>
          <text class="stat-label">当前体重</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ targetWeight || '--' }}</text>
          <text class="stat-label">目标体重</text>
        </view>
        <view class="stat-item">
          <text class="stat-value" :class="differenceClass">{{ differenceText }}</text>
          <text class="stat-label">距离目标</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ avgWeight || '--' }}</text>
          <text class="stat-label">平均体重</text>
        </view>
      </view>

      <!-- 进度条 -->
      <view class="progress-section" v-if="targetWeight && currentWeight">
        <view class="progress-label">
          <text>目标进度</text>
          <text>{{ progressPercent }}%</text>
        </view>
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
        </view>
      </view>
    </view>

    <!-- AI 智能建议卡片 -->
    <view class="ai-card" v-if="aiSuggestion">
      <view class="ai-header">
        <text class="ai-icon">🤖</text>
        <text class="ai-title">AI 健康助手</text>
      </view>
      <view class="ai-content">
        <text class="ai-message">{{ aiSuggestion }}</text>
      </view>
      <view class="ai-footer">
        <text class="ai-time">{{ currentDate }}</text>
        <text class="ai-refresh" @click="refreshAdvice">换一换 🔄</text>
      </view>
    </view>

    <!-- 体重趋势图 -->
    <view class="chart-card">
      <view class="card-title">
        <text>📊 体重趋势</text>
        <picker mode="selector" :range="rangeOptions" @change="onRangeChange">
          <text class="range-picker">{{ rangeOptions[currentRange] }}</text>
        </picker>
      </view>
      <view class="chart-container" v-if="chartData.length > 0">
        <view class="line-chart">
          <view class="chart-labels">
            <text v-for="(item, index) in chartData" :key="index" class="chart-label">
              {{ formatLabel(item.recordDate) }}
            </text>
          </view>
          <view class="chart-bars">
            <view v-for="(item, index) in chartData" :key="index" class="chart-bar-item">
              <view class="bar-wrapper">
                <view class="bar-value">{{ item.weight }}</view>
                <view class="bar" :style="{ height: getBarHeight(item.weight) + 'rpx' }"></view>
              </view>
              <view class="bar-dot" :class="getTrendClass(index)"></view>
            </view>
          </view>
        </view>
      </view>
      <view v-else class="empty-chart">
        <view class="empty-chicken-small">
          <view class="ecs-body"></view>
          <view class="ecs-eye"></view>
        </view>
        <text>暂无体重数据</text>
        <text class="empty-hint">点击上方按钮记录体重</text>
      </view>
    </view>

    <!-- 历史记录列表 -->
    <view class="history-card">
      <view class="card-title">
        <text>📝 历史记录</text>
        <text class="record-count">{{ weightRecords.length }}条</text>
      </view>

      <view class="record-list">
        <view v-for="(record, index) in weightRecords" :key="record.id" class="record-item">
          <view class="record-info">
            <text class="record-date">{{ formatDate(record.recordDate) }}</text>
            <text class="record-weight">{{ record.weight }} kg</text>
          </view>
          <view class="record-actions">
            <text class="edit-btn" @click="editRecord(record)">编辑</text>
            <text class="delete-btn" @click="deleteRecord(record.id)">删除</text>
          </view>
        </view>
      </view>

      <view v-if="weightRecords.length === 0" class="empty-list">
        <view class="empty-chicken-small">
          <view class="ecs-body"></view>
          <view class="ecs-eye"></view>
        </view>
        <text>暂无体重记录</text>
      </view>
    </view>

    <!-- 添加/编辑弹窗 -->
    <view class="modal-mask" v-if="showModal" @click="closeModal">
      <view class="modal-container" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ isEdit ? '编辑体重' : '记录体重' }}</text>
          <text class="modal-close" @click="closeModal">×</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">体重 (kg)</text>
            <input
              class="form-input"
              type="digit"
              v-model="formWeight"
              placeholder="请输入体重"
              :focus="modalVisible"
            />
          </view>
          <view class="form-item">
            <text class="form-label">日期</text>
            <picker mode="date" :value="formDate" @change="onDateChange">
              <view class="form-picker">{{ formDate || '请选择日期' }}</view>
            </picker>
          </view>
          <view class="form-item">
            <text class="form-label">备注</text>
            <input class="form-input" v-model="formRemark" placeholder="可选" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="cancel-btn" @click="closeModal">取消</button>
          <button class="confirm-btn" @click="saveWeight">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import request from '../../utils/request'

// ============ 响应式数据 ============
const userId = ref(null)
const loading = ref(false)
const showModal = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const modalVisible = ref(false)

// 表单数据
const formWeight = ref('')
const formDate = ref('')
const formRemark = ref('')

// 统计数据
const currentWeight = ref(null)
const targetWeight = ref(null)
const avgWeight = ref(null)
const weightRecords = ref([])
const chartData = ref([])

// AI 建议相关
const aiSuggestion = ref('')
const currentDate = ref('')

// 范围选项
const rangeOptions = ['近7天', '近30天', '全部']
const currentRange = ref(0)

// ============ OpenClaw Bridge ============
const openclawBridge = ref(null)

// 初始化 OpenClaw Bridge
const initOpenClawBridge = () => {
  const bridge = {
    version: '1.0.0',
    ready: true,
    
    // 执行操作
    execute: async (action, params = {}) => {
      console.log('[OpenClaw] 执行:', action, params)
      
      switch (action) {
        case 'click':
          return doClick(params)
        case 'input':
          return doInput(params)
        case 'getValue':
          return doGetValue(params)
        case 'getText':
          return doGetText(params)
        case 'getPageInfo':
          return doGetPageInfo()
        case 'recordWeight':
          return doRecordWeight(params)
        case 'editWeight':
          return doEditWeight(params)
        case 'deleteWeight':
          return doDeleteWeight(params)
        case 'getWeightData':
          return doGetWeightData()
        case 'setUserId':
          return doSetUserId(params)
        default:
          throw new Error('未知操作: ' + action)
      }
    }
  }
  
  // 点击操作
  const doClick = async ({ text, index }) => {
    if (text === '记录体重') {
      showAddModal()
      return { clicked: true, action: 'showAddModal' }
    }
    if (text === '保存') {
      await saveWeight()
      return { clicked: true, action: 'saveWeight' }
    }
    if (text === '取消') {
      closeModal()
      return { clicked: true, action: 'closeModal' }
    }
    if (text === '编辑') {
      const record = weightRecords.value[index || 0]
      if (record) {
        editRecord(record)
        return { clicked: true, action: 'editRecord', record }
      }
    }
    if (text === '删除') {
      const record = weightRecords.value[index || 0]
      if (record) {
        deleteRecord(record.id)
        return { clicked: true, action: 'deleteRecord', id: record.id }
      }
    }
    return { clicked: false, error: '未识别的按钮' }
  }
  
  // 输入操作
  const doInput = async ({ field, value }) => {
    if (field === 'weight') {
      formWeight.value = String(value)
      return { input: true, field: 'weight', value }
    }
    if (field === 'date') {
      formDate.value = value
      return { input: true, field: 'date', value }
    }
    if (field === 'remark') {
      formRemark.value = value
      return { input: true, field: 'remark', value }
    }
    return { input: false, error: '未识别的字段' }
  }
  
  // 获取值
  const doGetValue = ({ field }) => {
    const values = {
      weight: formWeight.value,
      date: formDate.value,
      remark: formRemark.value
    }
    return { field, value: values[field] || null }
  }
  
  // 获取文本
  const doGetText = ({ field }) => {
    if (field === 'currentWeight') return { text: currentWeight.value }
    if (field === 'targetWeight') return { text: targetWeight.value }
    if (field === 'avgWeight') return { text: avgWeight.value }
    return { text: null }
  }
  
  // 获取页面信息
  const doGetPageInfo = () => {
    // #ifdef H5
    const pageUrl = window.location.href
    const pageTitle = document.title
    // #endif
    // #ifndef H5
    const pageUrl = ''
    const pageTitle = ''
    // #endif
    return {
      url: pageUrl,
      title: pageTitle,
      userId: userId.value,
      recordsCount: weightRecords.value.length,
      ready: true
    }
  }
  
  // 记录体重（完整流程）
  const doRecordWeight = async ({ weight, date, remark }) => {
    console.log('[OpenClaw] 开始记录体重:', weight, '当前 userId:', userId.value)
    
    if (!userId.value) {
      throw new Error('userId 未设置，请先调用 setUserId')
    }
    
    showAddModal()
    await wait(1000)
    
    console.log('[OpenClaw] 弹窗已打开，准备填入:', weight)
    formWeight.value = String(weight)
    if (date) formDate.value = date
    if (remark) formRemark.value = remark
    await wait(500)
    
    console.log('[OpenClaw] 表单值:', { weight: formWeight.value, date: formDate.value })
    
    if (!formWeight.value) {
      throw new Error('体重输入失败，formWeight 为空')
    }
    
    try {
      await saveWeight()
    } catch (err) {
      console.error('[OpenClaw] saveWeight 失败:', err)
      throw new Error('保存失败: ' + (err.message || JSON.stringify(err)))
    }
    
    await wait(1000)
    
    return { 
      success: true, 
      weight, 
      date: formDate.value,
      message: '体重记录成功' 
    }
  }
  
  // 修改体重（完整流程）
  const doEditWeight = async ({ index, weight }) => {
    if (!userId.value) {
      throw new Error('userId 未设置，请先调用 setUserId')
    }
    
    const record = weightRecords.value[index]
    if (!record) throw new Error('记录不存在')
    
    editRecord(record)
    await wait(1000)
    
    formWeight.value = String(weight)
    await wait(500)
    
    if (!formWeight.value) {
      throw new Error('体重输入失败，formWeight 为空')
    }
    
    try {
      await saveWeight()
    } catch (err) {
      console.error('[OpenClaw] saveWeight 失败:', err)
      throw new Error('保存失败: ' + (err.message || JSON.stringify(err)))
    }
    
    await wait(1000)
    
    return { 
      success: true, 
      index, 
      weight,
      message: '体重修改成功' 
    }
  }
  
  // 删除体重
  const doDeleteWeight = async ({ index }) => {
    const record = weightRecords.value[index]
    if (!record) throw new Error('记录不存在')
    
    deleteRecord(record.id)
    await wait(1000)
    
    return { 
      success: true, 
      index, 
      id: record.id,
      message: '体重删除成功' 
    }
  }
  
  // 设置用户ID（用于自动登录）
  const doSetUserId = ({ userId: uid }) => {
    if (!uid) throw new Error('userId 不能为空')
    userId.value = uid
    uni.setStorageSync('userId', uid)
    loadStats()
    loadRecords()
    return { success: true, userId: uid }
  }
  
  // 获取体重数据
  const doGetWeightData = () => {
    return {
      currentWeight: currentWeight.value,
      targetWeight: targetWeight.value,
      avgWeight: avgWeight.value,
      difference: differenceText.value,
      records: weightRecords.value.map((r, idx) => ({
        index: idx,
        id: r.id,
        date: r.recordDate,
        weight: r.weight,
        remark: r.remark
      }))
    }
  }
  
  // 工具函数
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))
  
  // 暴露到全局
  // #ifdef H5
  window.OpenClawBridge = bridge
  // #endif
  openclawBridge.value = bridge
  
  console.log('[OpenClawBridge] 已初始化')
}

// 设置消息监听
const setupMessageListener = () => {
  // #ifdef H5
  window.addEventListener('message', async (event) => {
    const { data } = event
    
    // 安全检查
    if (data.type !== 'OPENCLAW_REQUEST') return
    
    const { id, action, params } = data
    
    console.log('[OpenClawBridge] 收到请求:', action, params)
    
    try {
      const result = await openclawBridge.value.execute(action, params)
      
      // 返回成功结果
      if (event.source) {
        event.source.postMessage({
          type: 'OPENCLAW_RESPONSE',
          id: id,
          success: true,
          data: result
        }, '*')
      }
    } catch (error) {
      console.error('[OpenClawBridge] 执行出错:', error)
      // 返回错误
      if (event.source) {
        event.source.postMessage({
          type: 'OPENCLAW_RESPONSE',
          id: id,
          success: false,
          error: error.message || error.toString() || '未知错误'
        }, '*')
      }
    }
  })
  // #endif
}

// 通知 OpenClaw 页面已就绪
const notifyReady = () => {
  // #ifdef H5
  // 向父窗口发送就绪消息
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({
      type: 'OPENCLAW_READY',
      version: '1.0.0',
      url: window.location.href,
      page: 'weight'
    }, '*')
  }
  
  // 也向顶层窗口发送
  if (window.top && window.top !== window) {
    window.top.postMessage({
      type: 'OPENCLAW_READY',
      version: '1.0.0',
      url: window.location.href,
      page: 'weight'
    }, '*')
  }
  // #endif
}

// ============ 计算属性 ============
const differenceText = computed(() => {
  if (!targetWeight.value || !currentWeight.value) return '--'
  const diff = currentWeight.value - targetWeight.value
  if (diff > 0) return `+${diff.toFixed(1)}`
  if (diff < 0) return diff.toFixed(1)
  return '0'
})

const differenceClass = computed(() => {
  if (!targetWeight.value || !currentWeight.value) return ''
  const diff = currentWeight.value - targetWeight.value
  if (diff > 0) return 'text-warning'
  if (diff < 0) return 'text-success'
  return ''
})

const progressPercent = computed(() => {
  if (!targetWeight.value || !currentWeight.value) return 0
  if (currentWeight.value <= targetWeight.value) return 100
  
  let startWeight = currentWeight.value
  if (weightRecords.value.length > 0) {
    const sortedRecords = [...weightRecords.value].sort((a, b) =>
      new Date(a.recordDate) - new Date(b.recordDate)
    )
    startWeight = sortedRecords[0]?.weight || currentWeight.value
  }
  
  const totalToLose = startWeight - targetWeight.value
  if (totalToLose <= 0) return 0
  
  const lost = startWeight - currentWeight.value
  if (lost <= 0) return 0
  
  const percent = (lost / totalToLose) * 100
  return Math.min(100, Math.max(0, percent))
})

// ============ 方法 ============
const generateAdvice = () => {
  if (!weightRecords.value.length) {
    aiSuggestion.value = '🐥 开始记录体重吧！坚持记录，AI会为你提供个性化建议 ✨'
    return
  }
  
  const sortedRecords = [...weightRecords.value].sort((a, b) =>
    new Date(b.recordDate) - new Date(a.recordDate)
  )
  const latest = sortedRecords[0]
  const previous = sortedRecords[1]
  const firstRecord = sortedRecords[sortedRecords.length - 1]
  
  const currentW = latest.weight
  const targetW = targetWeight.value
  
  let change = 0
  let changeText = ''
  if (previous) {
    change = currentW - previous.weight
    changeText = change > 0 ? `上升了 ${change.toFixed(1)}kg` :
      change < 0 ? `下降了 ${Math.abs(change).toFixed(1)}kg` : '保持不变'
  }
  
  const suggestions = []
  
  if (targetW && currentW > targetW) {
    const remaining = (currentW - targetW).toFixed(1)
    suggestions.push(`💪 距离目标还差 ${remaining}kg，继续加油！`)
    suggestions.push(`🎯 再减 ${remaining}kg 就能达成目标啦！`)
    suggestions.push(`✨ 坚持就是胜利！距离理想体重还有 ${remaining}kg`)
  }
  
  if (targetW && currentW <= targetW) {
    suggestions.push(`🎉 恭喜！已达到目标体重！继续保持好习惯！`)
    suggestions.push(`🏆 太棒了！你已经达成目标！为你骄傲！`)
    suggestions.push(`⭐ 目标达成！接下来要保持这个好状态哦！`)
  }
  
  if (change > 0) {
    suggestions.push(`📈 体重${changeText}，建议控制饮食，增加运动`)
    suggestions.push(`🥗 最近体重有点上升，试试减少高热量食物吧`)
    suggestions.push(`🏃 体重上升了，今天运动一下怎么样？`)
  }
  
  if (change < 0) {
    suggestions.push(`📉 太棒了！体重${changeText}，继续加油！`)
    suggestions.push(`✅ 效果不错！${changeText}，保持这个节奏！`)
    suggestions.push(`🌟 好样的！${changeText}，离目标更近了！`)
  }
  
  if (Math.abs(change) < 0.5 && previous) {
    suggestions.push(`➡️ 体重${changeText}，坚持记录，慢慢会看到变化`)
    suggestions.push(`💫 保持稳定也是进步，继续坚持好习惯！`)
  }
  
  suggestions.push(`💧 每天喝够8杯水，促进新陈代谢`)
  suggestions.push(`🚶 每周运动3-4次，每次30分钟效果更好`)
  suggestions.push(`🍎 细嚼慢咽，每餐吃七分饱`)
  suggestions.push(`😴 保证充足睡眠，有助于体重管理`)
  suggestions.push(`📝 坚持记录饮食，更了解自己的习惯`)
  
  const randomIndex = Math.floor(Math.random() * suggestions.length)
  aiSuggestion.value = suggestions[randomIndex]
}

const refreshAdvice = () => {
  generateAdvice()
  uni.showToast({ title: '已刷新', icon: 'none', duration: 1000 })
}

const formatCurrentDate = () => {
  const now = new Date()
  currentDate.value = `${now.getMonth() + 1}月${now.getDate()}日`
}

const formatDate = (date) => {
  if (!date) return ''
  return date.substring(5)
}

const formatLabel = (date) => {
  if (!date) return ''
  return date.substring(5, 10)
}

const getBarHeight = (weight) => {
  const weights = chartData.value.map(w => w.weight)
  const max = Math.max(...weights, 100)
  const min = Math.min(...weights, 40)
  const range = max - min
  if (range === 0) return 60
  return 30 + ((weight - min) / range) * 150
}

const getTrendClass = (index) => {
  if (index === 0) return ''
  const current = chartData.value[index].weight
  const prev = chartData.value[index - 1].weight
  if (current < prev) return 'trend-down'
  if (current > prev) return 'trend-up'
  return ''
}

const loadStats = async () => {
  try {
    const res = await request({
      url: '/api/weight/stats',
      method: 'GET',
      data: { userId: userId.value }
    })
    if (res.code === 200 && res.data) {
      currentWeight.value = res.data.currentWeight
      targetWeight.value = res.data.targetWeight
      avgWeight.value = res.data.avgWeight
    }
  } catch (err) {
    console.error('加载统计失败', err)
  }
}

const loadRecords = async () => {
  try {
    let days = 30
    if (currentRange.value === 0) days = 7
    else if (currentRange.value === 1) days = 30
    else days = 365

    const res = await request({
      url: '/api/weight/recent',
      method: 'GET',
      data: {
        userId: userId.value,
        days: days
      }
    })
    if (res.code === 200) {
      weightRecords.value = res.data || []
      weightRecords.value.sort((a, b) => new Date(b.recordDate) - new Date(a.recordDate))
      chartData.value = [...(res.data || [])].sort((a, b) => new Date(a.recordDate) - new Date(b.recordDate))
      generateAdvice()
      formatCurrentDate()
    }
  } catch (err) {
    console.error('加载记录失败', err)
  }
}

const onRangeChange = (e) => {
  currentRange.value = e.detail.value
  loadRecords()
}

const showAddModal = () => {
  isEdit.value = false
  editId.value = null
  formWeight.value = ''
  formDate.value = new Date().toISOString().split('T')[0]
  formRemark.value = ''
  modalVisible.value = true
  showModal.value = true
}

const editRecord = (record) => {
  isEdit.value = true
  editId.value = record.id
  formWeight.value = record.weight.toString()
  formDate.value = record.recordDate
  formRemark.value = record.remark || ''
  modalVisible.value = true
  showModal.value = true
}

const onDateChange = (e) => {
  formDate.value = e.detail.value
}

const saveWeight = async () => {
  if (!formWeight.value) {
    uni.showToast({ title: '请输入体重', icon: 'none' })
    return
  }

  uni.showLoading({ title: '保存中...', mask: true })

  try {
    const res = await request({
      url: '/api/weight/record',
      method: 'POST',
      data: {
        userId: userId.value,
        weight: parseFloat(formWeight.value),
        recordDate: formDate.value,
        remark: formRemark.value
      }
    })

    if (res.code === 200) {
      uni.hideLoading()
      uni.showToast({ title: '保存成功', icon: 'success' })
      closeModal()
      loadStats()
      loadRecords()
    } else {
      throw new Error(res.message)
    }
  } catch (err) {
    uni.hideLoading()
    console.error('保存失败', err)
    uni.showToast({ title: err.message || '保存失败', icon: 'none' })
    throw err
  }
}

const deleteRecord = (recordId) => {
  uni.showModal({
    title: '提示',
    content: '确定删除这条体重记录吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          const result = await request({
            url: `/api/weight/record/${recordId}?userId=${userId.value}`,
            method: 'DELETE'
          })
          if (result.code === 200) {
            uni.showToast({ title: '删除成功', icon: 'success' })
            loadStats()
            loadRecords()
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

const closeModal = () => {
  showModal.value = false
  isEdit.value = false
  editId.value = null
  formWeight.value = ''
  formDate.value = ''
  formRemark.value = ''
  modalVisible.value = false
}

// ============ 生命周期 ============
onMounted(() => {
  userId.value = uni.getStorageSync('userId')
  if (userId.value) {
    loadStats()
    loadRecords()
  } else {
    uni.showToast({ title: '请先登录', icon: 'none' })
  }
  
  // 初始化 OpenClaw Bridge
  initOpenClawBridge()
  setupMessageListener()
  
  // 通知 OpenClaw 已就绪
  setTimeout(notifyReady, 1000)
})
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #FFF8F0;
  padding: 30rpx;
}

/* 添加按钮 */
.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15rpx;
  background: linear-gradient(135deg, #FF8C42 0%, #FFD93D 100%);
  border-radius: 50rpx;
  padding: 25rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 15rpx rgba(102, 126, 234, 0.3);
}

.add-icon {
  font-size: 40rpx;
  color: #ffffff;
  font-weight: bold;
}

.add-text {
  font-size: 32rpx;
  color: #ffffff;
  font-weight: 500;
}

/* 统计卡片 */
.stats-card {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 25rpx;
}

.stats-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #5C4033;
}

.stats-unit {
  font-size: 24rpx;
  color: #B8956A;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  margin-bottom: 25rpx;
}

.stat-item {
  text-align: center;
  padding: 15rpx;
  background-color: #f8f9fa;
  border-radius: 16rpx;
}

.stat-value {
  display: block;
  font-size: 44rpx;
  font-weight: bold;
  color: #FF8C42;
}

.stat-label {
  display: block;
  font-size: 24rpx;
  color: #B8956A;
  margin-top: 8rpx;
}

.text-success {
  color: #67c23a;
}

.text-warning {
  color: #f44336;
}

/* 进度条 */
.progress-section {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #FFE5D0;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 26rpx;
  color: #8B6914;
  margin-bottom: 15rpx;
}

.progress-bar {
  width: 100%;
  height: 16rpx;
  background-color: #e5e5e5;
  border-radius: 8rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FF8C42, #FFD93D);
  border-radius: 8rpx;
  transition: width 0.3s;
}

/* AI 建议卡片 */
.ai-card {
  background: linear-gradient(135deg, #FF8C42 0%, #FFD93D 100%);
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 8rpx 20rpx rgba(102, 126, 234, 0.3);
}

.ai-header {
  display: flex;
  align-items: center;
  gap: 15rpx;
  margin-bottom: 20rpx;
}

.ai-icon {
  font-size: 44rpx;
}

.ai-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #ffffff;
}

.ai-content {
  margin-bottom: 20rpx;
}

.ai-message {
  font-size: 30rpx;
  color: #ffffff;
  line-height: 1.5;
}

.ai-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.2);
}

.ai-time {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}

.ai-refresh {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
  padding: 8rpx 20rpx;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 30rpx;
}

/* 图表卡片 */
.chart-card, .history-card {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25rpx;
  font-size: 32rpx;
  font-weight: bold;
  color: #5C4033;
}

.range-picker {
  font-size: 26rpx;
  color: #FF8C42;
  font-weight: normal;
  padding: 8rpx 20rpx;
  background-color: #f0f0f0;
  border-radius: 30rpx;
}

.record-count {
  font-size: 26rpx;
  color: #B8956A;
  font-weight: normal;
}

/* 图表 */
.chart-container {
  overflow-x: auto;
}

.line-chart {
  min-width: 600rpx;
}

.chart-labels {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20rpx;
}

.chart-label {
  font-size: 22rpx;
  color: #B8956A;
  text-align: center;
  flex: 1;
}

.chart-bars {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 280rpx;
}

.chart-bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.bar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bar-value {
  font-size: 22rpx;
  color: #FF8C42;
  margin-bottom: 8rpx;
}

.bar {
  width: 40rpx;
  background: linear-gradient(180deg, #FF8C42 0%, #FFD93D 100%);
  border-radius: 8rpx 8rpx 0 0;
  min-height: 30rpx;
}

.bar-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  margin-top: 10rpx;
}

.trend-up {
  background-color: #f44336;
}

.trend-down {
  background-color: #67c23a;
}

.empty-chart {
  text-align: center;
  padding: 60rpx;
  color: #B8956A;
}

.empty-hint {
  display: block;
  font-size: 24rpx;
  margin-top: 15rpx;
  color: #ccc;
}

/* 历史记录列表 */
.record-list {
  max-height: 500rpx;
  overflow-y: auto;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.record-item:last-child {
  border-bottom: none;
}

.record-info {
  display: flex;
  gap: 30rpx;
}

.record-date {
  font-size: 28rpx;
  color: #8B6914;
}

.record-weight {
  font-size: 32rpx;
  font-weight: bold;
  color: #FF8C42;
}

.record-actions {
  display: flex;
  gap: 25rpx;
}

.edit-btn, .delete-btn {
  font-size: 26rpx;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
}

.edit-btn {
  color: #FF8C42;
  background-color: #f0e6ff;
}

.delete-btn {
  color: #f44336;
  background-color: #ffe6e6;
}

.empty-list {
  text-align: center;
  padding: 50rpx;
  color: #B8956A;
}

/* 弹窗 */
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

.modal-container {
  width: 600rpx;
  background-color: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;
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
}

.modal-body {
  padding: 30rpx;
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
  height: 80rpx;
  border: 1rpx solid #e5e5e5;
  border-radius: 16rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
}

.form-picker {
  height: 80rpx;
  line-height: 80rpx;
  border: 1rpx solid #e5e5e5;
  border-radius: 16rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: #5C4033;
}

.modal-footer {
  display: flex;
  padding: 20rpx 30rpx 30rpx;
  gap: 20rpx;
}

.cancel-btn, .confirm-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 40rpx;
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

/* ========== 空状态小鸡 ========== */
.empty-chicken-small {
  width: 120rpx;
  height: 110rpx;
  position: relative;
  margin: 0 auto 30rpx;
}

.ecs-body {
  width: 90rpx;
  height: 85rpx;
  background: linear-gradient(135deg, #FFD93D 0%, #FFB347 100%);
  border-radius: 50% 50% 45% 45%;
  position: absolute;
  top: 15rpx;
  left: 15rpx;
  animation: chickenBounce 2s ease-in-out infinite;
  box-shadow: 0 6rpx 18rpx rgba(255, 140, 66, 0.2);
}

.ecs-body::before {
  content: '';
  position: absolute;
  top: -16rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8rpx solid transparent;
  border-right: 8rpx solid transparent;
  border-bottom: 14rpx solid #FF6B35;
}

.ecs-eye {
  position: absolute;
  width: 10rpx;
  height: 10rpx;
  background: #5C4033;
  border-radius: 50%;
  top: 38rpx;
  left: 38rpx;
  z-index: 2;
  box-shadow: 34rpx 0 0 #5C4033;
  animation: chickenBlink 4s ease-in-out infinite;
}
</style>
