<template>
  <view class="container">
    <view class="form-section">
      <view class="form-title">基本信息</view>
      
      <!-- 头像 -->
      <view class="form-item avatar-item" @click="chooseAvatar">
        <text class="label">头像</text>
        <image class="avatar" :src="avatarUrl || '/static/haocun.jpg'" mode="aspectFill" @error="avatarUrl = ''"></image>
        <text class="arrow"></text>
      </view>
      
      <!-- 昵称 -->
      <view class="form-item">
        <text class="label">昵称</text>
        <input class="input" v-model="nickname" placeholder="请输入昵称" />
      </view>
      
      <!-- 性别 -->
      <view class="form-item">
        <text class="label">性别</text>
        <view class="gender-group">
          <view 
            class="gender-option" 
            :class="{ active: gender === 1 }"
            @click="gender = 1"
          >
            <text>男</text>
          </view>
          <view 
            class="gender-option" 
            :class="{ active: gender === 2 }"
            @click="gender = 2"
          >
            <text>女</text>
          </view>
        </view>
      </view>
      
      <!-- 年龄 -->
      <view class="form-item">
        <text class="label">年龄</text>
        <input class="input" v-model="age" type="number" placeholder="请输入年龄" />
      </view>
      
      <!-- 身高 -->
      <view class="form-item">
        <text class="label">身高 (cm)</text>
        <input class="input" v-model="height" type="digit" placeholder="请输入身高" />
      </view>
      
      <!-- 当前体重 -->
      <view class="form-item">
        <text class="label">当前体重 (kg)</text>
        <input class="input" v-model="weight" type="digit" placeholder="请输入当前体重" />
      </view>
      
      <!-- 目标体重 -->
      <view class="form-item">
        <text class="label">目标体重 (kg)</text>
        <input class="input" v-model="targetWeight" type="digit" placeholder="请输入目标体重" />
      </view>
      
      <!-- 身体活动水平 -->
      <view class="form-item">
        <text class="label">活动水平</text>
        <view class="activity-buttons">
          <view 
            v-for="(item, index) in activityOptions" 
            :key="index"
            class="activity-btn"
            :class="{ active: activityLevel === index + 1 }"
            @click="selectActivity(index + 1)"
          >
            {{ item }}
          </view>
        </view>
      </view>
      
      <!-- 健康目标 -->
      <view class="form-item">
        <text class="label">健康目标</text>
        <view class="goal-buttons">
          <view 
            v-for="(item, index) in goalOptions" 
            :key="index"
            class="goal-btn"
            :class="{ active: goalType === index + 1 }"
            @click="selectGoal(index + 1)"
          >
            {{ item }}
          </view>
        </view>
      </view>
      
      <!-- 过敏源 -->
      <view class="form-item">
        <text class="label">过敏源</text>
        <input class="input" v-model="allergies" placeholder="如：海鲜、花生、牛奶" />
      </view>
      
      <!-- 饮食偏好 -->
      <view class="form-item">
        <text class="label">饮食偏好</text>
        <view class="preference-group">
          <view 
            class="preference-option" 
            :class="{ active: dietPreference === 'vegetarian' }"
            @click="dietPreference = 'vegetarian'"
          >
            <text>🥬 素食</text>
          </view>
          <view 
            class="preference-option" 
            :class="{ active: dietPreference === 'halal' }"
            @click="dietPreference = 'halal'"
          >
            <text>🕌 清真</text>
          </view>
          <view 
            class="preference-option" 
            :class="{ active: dietPreference === 'taboo' }"
            @click="dietPreference = 'taboo'"
          >
            <text>🚫 忌口</text>
          </view>
          <view 
            class="preference-option" 
            :class="{ active: dietPreference === 'none' }"
            @click="dietPreference = 'none'"
          >
            <text>🍽️ 无特殊</text>
          </view>
        </view>
      </view>
      
      <!-- 忌口详情（当选择忌口时显示） -->
      <view class="form-item" v-if="dietPreference === 'taboo'">
        <text class="label">忌口详情</text>
        <input class="input" v-model="tabooDetail" placeholder="如：不吃猪肉、不吃辣" />
      </view>
    </view>
    
    <!-- 保存按钮 -->
    <view class="btn-area">
      <button class="save-btn" @click="saveProfile" :disabled="isLoading">
        {{ isLoading ? '保存中...' : '保存档案' }}
      </button>
    </view>
    
    <!-- 退出登录按钮 -->
    <view class="logout-area">
      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </view>
    
    <!-- 跳过按钮 -->
    <view class="skip-area" @click="skipToMain">
      <text>稍后填写</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../../utils/request'
import { API } from '../../config'

// 表单数据
const avatarUrl = ref('')
const nickname = ref('')
const gender = ref(1)
const age = ref('')
const height = ref('')
const weight = ref('')
const targetWeight = ref('')
const activityLevel = ref(1)
const activityText = ref('')
const goalType = ref(1)
const goalText = ref('')
const allergies = ref('')
const dietPreference = ref('none')
const tabooDetail = ref('')
const userId = ref(null)
const isLoading = ref(false)

// 选项
const goalOptions = ['减脂', '增肌', '保持体重']
const activityOptions = ['久坐（很少运动）', '轻度活动（每周1-2天）', '中度活动（每周3-5天）', '重度活动（每天运动）', '极重度活动（体力劳动者）']

// 云存储路径转 HTTPS
const convertCloudPath = (cloudPath) => {
  if (!cloudPath || !cloudPath.startsWith('cloud://')) {
    return cloudPath
  }
  
  try {
    const withoutPrefix = cloudPath.replace('cloud://', '')
    const firstSlashIndex = withoutPrefix.indexOf('/')
    if (firstSlashIndex === -1) return cloudPath
    
    const envId = withoutPrefix.substring(0, firstSlashIndex)
    const filePath = withoutPrefix.substring(firstSlashIndex + 1)
    
    return `https://${envId}.tcb.qcloud.la/${filePath}`
  } catch (e) {
    console.error('云路径转换失败', e)
    return cloudPath
  }
}

// 页面加载
onMounted(() => {
  userId.value = uni.getStorageSync('userId')
  
  const userInfo = uni.getStorageSync('userInfo')
  if (userInfo) {
    nickname.value = userInfo.nickname || ''
  }
  
  let savedProfile = uni.getStorageSync('userProfile')
  
  // 修复错误数据
  if (savedProfile) {
    if (savedProfile.activityLevel && (savedProfile.activityLevel < 1 || savedProfile.activityLevel > 5)) {
      savedProfile.activityLevel = 1
      uni.setStorageSync('userProfile', savedProfile)
    }
    if (savedProfile.goalType && (savedProfile.goalType < 1 || savedProfile.goalType > 3)) {
      savedProfile.goalType = 1
      uni.setStorageSync('userProfile', savedProfile)
    }
  }
  
  if (savedProfile) {
    nickname.value = savedProfile.nickname || nickname.value
    gender.value = savedProfile.gender || 1
    age.value = savedProfile.age || ''
    height.value = savedProfile.height || ''
    weight.value = savedProfile.weight || ''
    targetWeight.value = savedProfile.targetWeight || ''
    
    // 活动水平
    let rawActivity = Number(savedProfile.activityLevel)
    if (isNaN(rawActivity) || rawActivity < 1 || rawActivity > 5) {
      rawActivity = 1
    }
    activityLevel.value = rawActivity
    activityText.value = activityOptions[activityLevel.value - 1] || activityOptions[0]
    
    // 健康目标
    let rawGoal = Number(savedProfile.goalType)
    if (isNaN(rawGoal) || rawGoal < 1 || rawGoal > 3) {
      rawGoal = 1
    }
    goalType.value = rawGoal
    goalText.value = goalOptions[goalType.value - 1] || goalOptions[0]
    
    // 加载时转换云存储路径
    let savedAvatar = savedProfile.avatarUrl || ''
    if (savedAvatar && savedAvatar.startsWith('cloud://')) {
      savedAvatar = convertCloudPath(savedAvatar)
    }
    avatarUrl.value = savedAvatar || avatarUrl.value
    
    allergies.value = savedProfile.allergies || ''
    dietPreference.value = savedProfile.dietPreference || 'none'
    tabooDetail.value = savedProfile.tabooDetail || ''
  }
})

// ========== 修改：退出登录彻底清理所有数据 ==========
const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        // 彻底清理所有登录相关数据
        uni.removeStorageSync('token')
        uni.removeStorageSync('isLogin')
        uni.removeStorageSync('userId')
        uni.removeStorageSync('userInfo')
        uni.removeStorageSync('userProfile')
        
        // 跳转到登录页
        uni.reLaunch({ url: '/pages/login/login' })
        uni.showToast({ title: '已退出', icon: 'success' })
      }
    }
  })
}
// ========== 修改结束 ==========

// 选择活动水平
const selectActivity = (level) => {
  activityLevel.value = level
  activityText.value = activityOptions[level - 1]
  console.log('选择活动水平:', activityText.value)
}

// 选择健康目标
const selectGoal = (goal) => {
  goalType.value = goal
  goalText.value = goalOptions[goal - 1]
  console.log('选择健康目标:', goalText.value)
}

// 选择头像并上传到微信云存储
const chooseAvatar = () => {
  uni.chooseImage({
    count: 1,
    sourceType: ['album', 'camera'],
    success: (res) => {
      const tempPath = res.tempFilePaths[0]
      uploadAvatarToCloud(tempPath)
    }
  })
}

// 上传头像到微信云存储（获取永久链接）
const uploadAvatarToCloud = (filePath) => {
  // #ifdef MP-WEIXIN
  if (!wx.cloud) {
    uni.showToast({ title: '请先开通微信云开发', icon: 'none' })
    return
  }
  
  uni.showLoading({ title: '上传头像中...', mask: true })
  
  const uid = userId.value || uni.getStorageSync('userId') || 'temp'
  const ext = filePath.substring(filePath.lastIndexOf('.')) || '.jpg'
  const cloudPath = `avatars/user_${uid}_${Date.now()}${ext}`
  
  wx.cloud.uploadFile({
    cloudPath: cloudPath,
    filePath: filePath,
    success: (res) => {
      uni.hideLoading()
      if (res.fileID) {
        // 上传成功后立即转换为 HTTPS
        avatarUrl.value = convertCloudPath(res.fileID)
        console.log('头像上传成功，转换后URL:', avatarUrl.value)
        uni.showToast({ title: '头像上传成功', icon: 'success' })
      } else {
        fallbackAvatar(filePath)
      }
    },
    fail: (err) => {
      uni.hideLoading()
      console.error('云存储上传失败', err)
      fallbackAvatar(filePath)
    }
  })
  // #endif
  
  // #ifndef MP-WEIXIN
  // 非微信小程序环境，使用临时路径
  avatarUrl.value = filePath
  uni.showToast({ title: '头像已选择', icon: 'success' })
  // #endif
}

// 云存储失败时的降级处理
const fallbackAvatar = (filePath) => {
  avatarUrl.value = filePath
  uni.showToast({ title: '云存储失败，使用临时头像', icon: 'none' })
}

// 保存档案
const saveProfile = async () => {
  if (!nickname.value) {
    uni.showToast({ title: '请填写昵称', icon: 'none' })
    return
  }
  
  if (isLoading.value) return
  
  isLoading.value = true
  uni.showLoading({ title: '保存中...', mask: true })
  
  // 保存前确保 avatarUrl 是 HTTPS
  let finalAvatarUrl = avatarUrl.value
  if (finalAvatarUrl && finalAvatarUrl.startsWith('cloud://')) {
    finalAvatarUrl = convertCloudPath(finalAvatarUrl)
  }
  
  const profileData = {
    nickname: nickname.value,
    gender: gender.value,
    age: parseInt(age.value) || 0,
    height: parseFloat(height.value) || 0,
    currentWeight: parseFloat(weight.value) || 0,
    targetWeight: parseFloat(targetWeight.value) || 0,
    activityLevel: Number(activityLevel.value),
    goalType: Number(goalType.value),
    avatarUrl: finalAvatarUrl,
    allergies: allergies.value,
    dietPreference: dietPreference.value,
    tabooDetail: dietPreference.value === 'taboo' ? tabooDetail.value : ''
  }
  
  try {
    const url = API.USER_PROFILE.replace('{userId}', userId.value)
    const res = await request({
      url: url,
      method: 'PUT',
      data: profileData
    })
    
    if (res.code === 200) {
      // 保存到本地
      uni.setStorageSync('userProfile', {
        nickname: nickname.value,
        gender: gender.value,
        age: age.value,
        height: height.value,
        weight: weight.value,
        targetWeight: targetWeight.value,
        activityLevel: Number(activityLevel.value),
        goalType: Number(goalType.value),
        avatarUrl: finalAvatarUrl,
        allergies: allergies.value,
        dietPreference: dietPreference.value,
        tabooDetail: tabooDetail.value
      })
      
      const userInfo = uni.getStorageSync('userInfo') || {}
      userInfo.nickname = nickname.value
      userInfo.avatar = finalAvatarUrl || '/static/haocun.jpg'
      uni.setStorageSync('userInfo', userInfo)
      
      uni.hideLoading()
      uni.showToast({ title: '保存成功', icon: 'success' })
      
      // 通知其他页面刷新
      uni.$emit('refreshHome')
      
      setTimeout(() => {
        uni.reLaunch({ url: '/pages/home/home' })
      }, 1000)
    } else {
      throw new Error(res.message)
    }
  } catch (err) {
    uni.hideLoading()
    console.error('保存失败', err)
    uni.showToast({ title: err.message || '保存失败', icon: 'none' })
  } finally {
    isLoading.value = false
  }
}

// 跳过
const skipToMain = () => {
  uni.reLaunch({ url: '/pages/home/home' })
}
</script>

<style scoped>
.activity-buttons, .goal-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  flex: 1;
  justify-content: flex-end;
}

.activity-btn, .goal-btn {
  padding: 16rpx 32rpx;
  border-radius: 32rpx;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  color: #5C4033;
  font-size: 26rpx;
  font-weight: 500;
  transition: all 0.25s ease;
  box-shadow: 0 4rpx 12rpx rgba(255, 140, 66, 0.1);
}

.activity-btn.active, .goal-btn.active {
  background: linear-gradient(135deg, #FF8C42 0%, #FFD93D 100%);
  color: #ffffff;
  box-shadow: 0 6rpx 16rpx rgba(255, 140, 66, 0.35);
  transform: translateY(-2rpx);
}

.activity-btn:active, .goal-btn:active {
  transform: scale(0.97);
}

.container {
  min-height: 100vh;
  background-color: #FFF8F0;
  padding: 30rpx;
}

.form-section {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 0 30rpx;
  margin-bottom: 40rpx;
}

.form-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #5C4033;
  padding: 30rpx 0 20rpx;
  border-bottom: 1rpx solid #FFE5D0;
}

.form-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #FFE5D0;
}

.form-item:last-child {
  border-bottom: none;
}

.label {
  font-size: 28rpx;
  color: #5C4033;
  width: 160rpx;
}

.input {
  flex: 1;
  font-size: 28rpx;
  text-align: right;
  color: #8B6914;
}

.avatar-item {
  justify-content: flex-start;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-left: auto;
  margin-right: 20rpx;
}

.gender-group {
  display: flex;
  gap: 30rpx;
}

.gender-option {
  padding: 10rpx 40rpx;
  border-radius: 40rpx;
  background-color: #FFF3B0;
  color: #8B6914;
}

.gender-option.active {
  background: linear-gradient(135deg, #FF8C42 0%, #FFB347 100%);
  color: #ffffff;
}

.preference-group {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
  flex: 1;
  justify-content: flex-end;
}

.preference-option {
  padding: 8rpx 20rpx;
  border-radius: 40rpx;
  background-color: #FFF3B0;
  color: #8B6914;
  font-size: 26rpx;
}

.preference-option.active {
  background: linear-gradient(135deg, #FF8C42 0%, #FFB347 100%);
  color: #ffffff;
}

.picker-value {
  font-size: 28rpx;
  color: #8B6914;
}

.btn-area {
  padding: 20rpx;
}

.save-btn {
  background: linear-gradient(135deg, #FF8C42 0%, #FFD93D 100%);
  color: #ffffff;
  border-radius: 44rpx;
  height: 88rpx;
  line-height: 88rpx;
  font-size: 32rpx;
}

.save-btn[disabled] {
  opacity: 0.6;
}

/* 退出登录按钮样式 */
.logout-area {
  padding: 20rpx;
  margin-top: 20rpx;
}

.logout-btn {
  background: linear-gradient(135deg, #FF8C42 0%, #E86A33 100%);
  color: #ffffff;
  border-radius: 44rpx;
  height: 88rpx;
  line-height: 88rpx;
  font-size: 32rpx;
  border: none;
}

.skip-area {
  text-align: center;
  padding: 30rpx;
}

.skip-area text {
  font-size: 28rpx;
  color: #B8956A;
}
</style>