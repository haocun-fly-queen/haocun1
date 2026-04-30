<template>
  <view class="container">
    <!-- 动画形象区域 -->
    <view class="character-area">
      <view class="rooster-animation" :class="{ 'running': isRunning }">
        <!-- 公鸡身体 -->
        <view class="rooster-body">
          <view class="body">
            <view class="head">
              <view class="comb">
                <view class="comb-part"></view>
                <view class="comb-part"></view>
                <view class="comb-part"></view>
              </view>
              <view class="beak">
                <view class="beak-top"></view>
                <view class="beak-bottom"></view>
              </view>
              <view class="wattle"></view>
              <view class="eyes">
                <view class="eye left-eye">
                  <view class="eyeball"></view>
                  <view class="eye-shine"></view>
                </view>
                <view class="eye right-eye">
                  <view class="eyeball"></view>
                  <view class="eye-shine"></view>
                </view>
              </view>
              <view class="blush left-blush"></view>
              <view class="blush right-blush"></view>
            </view>
            <view class="torso">
              <view class="wings">
                <view class="wing left-wing" :class="{ 'flapping': isRunning }">
                  <view class="feather"></view>
                  <view class="feather"></view>
                  <view class="feather"></view>
                </view>
                <view class="wing right-wing" :class="{ 'flapping': isRunning }">
                  <view class="feather"></view>
                  <view class="feather"></view>
                  <view class="feather"></view>
                </view>
              </view>
              <view class="belly"></view>
              <view class="tail" :class="{ 'wagging': isRunning }">
                <view class="tail-feather"></view>
                <view class="tail-feather"></view>
                <view class="tail-feather"></view>
                <view class="tail-feather"></view>
              </view>
            </view>
            <view class="legs">
              <view class="leg left-leg" :class="{ 'running': isRunning }">
                <view class="thigh left-thigh"></view>
                <view class="foot left-foot">
                  <view class="toe"></view>
                  <view class="toe"></view>
                  <view class="toe"></view>
                </view>
              </view>
              <view class="leg right-leg" :class="{ 'running': isRunning }">
                <view class="thigh right-thigh"></view>
                <view class="foot right-foot">
                  <view class="toe"></view>
                  <view class="toe"></view>
                  <view class="toe"></view>
                </view>
              </view>
            </view>
          </view>
          <view class="sweat" v-if="isRunning">
            <view class="sweat-drop drop1"></view>
            <view class="sweat-drop drop2"></view>
            <view class="sweat-drop drop3"></view>
          </view>
          <view class="speed-lines" v-if="isRunning">
            <view class="speed-line"></view>
            <view class="speed-line"></view>
            <view class="speed-line"></view>
          </view>
        </view>
      </view>
      <view class="encourage-text" v-if="isRunning">
        <text class="encourage-msg">{{ encourageMsg }}</text>
      </view>
    </view>

    <view class="logo-area">
      <text class="app-name">鸡仔健康</text>
      <text class="slogan">拍照识热量 · 健康每一餐</text>
    </view>

    <view class="login-area">
      <button 
        class="login-btn wechat-btn" 
        @click="handleWechatLogin"
        :disabled="isLoading"
      >
        <text class="btn-icon"></text>
        <text class="btn-text">{{ isLoading ? '登录中...' : '微信一键登录' }}</text>
      </button>

      <button class="login-btn phone-btn" @click="handlePhoneLogin" :disabled="isLoading">
        <text class="btn-icon"></text>
        <text class="btn-text">{{ isLoading ? '登录中...' : '手机号登录' }}</text>
      </button>

      <view class="agreement">
        <checkbox value="agree" :checked="agreeChecked" @click="toggleAgree" />
        <text class="agreement-text">登录即表示同意《用户协议》和《隐私政策》</text>
      </view>

     
    </view>

    <!-- ========== 手机号登录面板 ========== -->
    <view class="phone-panel-mask" v-if="showPhonePanel" @click="closePhonePanel">
      <view class="phone-panel" @click.stop>
        <!-- 面板头部 - 小鸡装饰 -->
        <view class="panel-header">
          <view class="panel-chicken">
            <view class="pc-body"></view>
            <view class="pc-eye pce-left"></view>
            <view class="pc-eye pce-right"></view>
            <view class="pc-beak"></view>
            <view class="pc-wing pcw-left"></view>
            <view class="pc-wing pcw-right"></view>
          </view>
          <text class="panel-title">手机号登录</text>
          <text class="panel-subtitle">小鸡仔欢迎你回来~</text>
          <view class="panel-close" @click="closePhonePanel">
            <text class="close-icon">✕</text>
          </view>
        </view>

        <!-- 输入区域 -->
        <view class="panel-body">
          <!-- 手机号输入 -->
          <view class="input-group" :class="{ 'input-focus': phoneFocus }">
            <text class="input-prefix">+86</text>
            <input
              class="phone-input"
              v-model="phoneNumber"
              type="number"
              maxlength="11"
              placeholder="请输入手机号"
              placeholder-class="input-placeholder"
              @focus="phoneFocus = true"
              @blur="phoneFocus = false"
              @input="onPhoneInput"
            />
            <view class="input-clear" v-if="phoneNumber" @click="phoneNumber = ''">
              <text class="clear-icon">✕</text>
            </view>
          </view>

          <!-- 验证码输入 -->
          <view class="input-group code-group" :class="{ 'input-focus': codeFocus }">
            <input
              class="code-input"
              v-model="verifyCode"
              type="number"
              maxlength="6"
              placeholder="请输入验证码"
              placeholder-class="input-placeholder"
              @focus="codeFocus = true"
              @blur="codeFocus = false"
            />
            <view class="code-btn" :class="{ 'code-counting': isCounting, 'code-ready': phoneValid && !isCounting }" @click="sendCode">
              <text class="code-btn-text">{{ isCounting ? `${countDown}s后重发` : '获取验证码' }}</text>
            </view>
          </view>

          <!-- 提示信息 -->
          <view class="panel-tip" v-if="panelTip">
            <text class="tip-text">{{ panelTip }}</text>
          </view>
        </view>

        <!-- 登录按钮 -->
        <view class="panel-footer">
          <button
            class="phone-login-btn"
            :class="{ 'btn-ready': phoneValid && verifyCode.length >= 4 }"
            :disabled="!phoneValid || verifyCode.length < 4 || isLoading"
            @click="doPhoneLogin"
          >
            <text v-if="!isLoading">🐥 立即登录</text>
            <view v-else class="btn-loader">
              <view class="bl-dot"></view>
              <view class="bl-dot"></view>
              <view class="bl-dot"></view>
            </view>
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import request from '../../utils/request'
import { API } from '../../config'

const agreeChecked = ref(false)
const isLoading = ref(false)
const isRunning = ref(true)
const encourageMsg = ref(' 叽叽叽！一起健康生活吧！🐥')
const msgIndex = ref(0)

// 手机号面板状态
const showPhonePanel = ref(false)
const phoneNumber = ref('')
const verifyCode = ref('')
const phoneFocus = ref(false)
const codeFocus = ref(false)
const phoneValid = ref(false)
const panelTip = ref('')
const isCounting = ref(false)
const countDown = ref(60)
let codeTimer = null

const encourageMessages = [
  ' 叽叽叽！今天也要好好吃饭哦！🐥',
  '🌽 三分练！七分吃！',
  ' 健康饮食，快乐每一天！',
  '✨ 每天进步一点点！',
  ' 向着健康目标前进！',
  ' 你是最棒的！',
  ' 加油！小鸡仔陪你一起自律！'
]

let interval = null

onMounted(() => {
  interval = setInterval(() => {
    msgIndex.value = (msgIndex.value + 1) % encourageMessages.length
    encourageMsg.value = encourageMessages[msgIndex.value]
  }, 3000)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})

const toggleAgree = () => {
  agreeChecked.value = !agreeChecked.value
}

// 判断用户是否需要填写个人档案
const checkNeedProfile = (user) => {
  const defaultNicknames = ['微信用户', '手机用户']
  const isDefaultNickname = defaultNicknames.includes(user.nickname)
  const hasNoHealthData = !user.height || !user.currentWeight || user.height === 0 || user.currentWeight === 0
  return isDefaultNickname || hasNoHealthData
}

// 跳转页面（根据是否完善档案）
const navigateAfterLogin = (user) => {
  const needProfile = checkNeedProfile(user)
  if (needProfile) {
    uni.reLaunch({ url: '/pages/profile/profile' })
  } else {
    uni.reLaunch({ url: '/pages/home/home' })
  }
}

// ========== 新增：清除旧登录状态 ==========
const clearLoginState = () => {
  uni.removeStorageSync('token')
  uni.removeStorageSync('userId')
  uni.removeStorageSync('userInfo')
  uni.removeStorageSync('userProfile')
  uni.removeStorageSync('isLogin')
  console.log('已清除旧登录状态')
}
// ========== 新增结束 ==========

// 真实的微信登录
const handleWechatLogin = () => {
  if (!agreeChecked.value) {
    uni.showToast({ title: '请先同意用户协议', icon: 'none' })
    return
  }
  
  // ========== 修改：登录前先清除旧状态 ==========
  clearLoginState()
  // ========== 修改结束 ==========
  
  isLoading.value = true
  uni.showLoading({ title: '登录中...', mask: true })

  uni.login({
    provider: 'weixin',
    success: (loginRes) => {
      const code = loginRes.code
      console.log('获取到微信code:', code)
      
      uni.getUserInfo({
        provider: 'weixin',
        success: (userInfoRes) => {
          const userInfo = userInfoRes.userInfo
          console.log('获取到用户信息:', userInfo)
          
          request({
            url: API.USER_LOGIN_WECHAT,
            method: 'POST',
            data: { 
              code: code,
              nickName: userInfo.nickName,
              avatarUrl: userInfo.avatarUrl,
              gender: userInfo.gender
            }
          }).then(res => {
            console.log('登录返回数据:', res)
            console.log('登录返回的data:', res.data)
            uni.hideLoading()
            isLoading.value = false
            
            if (res.code === 200) {
              const user = res.data
              
              if (user.token) {
                uni.setStorageSync('token', user.token)
                console.log('token已保存:', user.token)
              }
              
              // 处理头像 URL，强制转成 https
              let avatarUrl = user.avatarUrl || userInfo.avatarUrl || '/static/haocun.jpg'
              if (avatarUrl && avatarUrl.startsWith('http://')) {
                avatarUrl = avatarUrl.replace('http://', 'https://')
              }
              
              uni.setStorageSync('userId', user.id)
              uni.setStorageSync('userInfo', {
                id: user.id,
                nickname: user.nickname || userInfo.nickName || '微信用户',
                avatar: avatarUrl,
                height: user.height,
                currentWeight: user.currentWeight
              })
              uni.setStorageSync('isLogin', true)
              
              uni.showToast({ title: '登录成功', icon: 'success' })
              navigateAfterLogin(user)
            } else {
              uni.showToast({ title: res.message || '登录失败', icon: 'none' })
            }
          }).catch(err => {
            uni.hideLoading()
            isLoading.value = false
            console.error('登录请求失败', err)
            uni.showToast({ title: '网络错误，请重试', icon: 'none' })
          })
        },
        fail: (err) => {
          console.error('获取用户信息失败', err)
          silentLogin(code)
        }
      })
    },
    fail: (err) => {
      uni.hideLoading()
      isLoading.value = false
      console.error('微信登录失败', err)
      
      // ========== 修改：处理需要重新登录的错误 ==========
      if (err.errMsg && err.errMsg.includes('需要重新登录')) {
        uni.showModal({
          title: '提示',
          content: '微信登录状态已过期，请重新授权',
          showCancel: false,
          success: () => {
            // 强制刷新页面，重新初始化微信登录状态
            clearLoginState()
            uni.reLaunch({ url: '/pages/login/login' })
          }
        })
      } else {
        uni.showToast({ title: '微信登录失败，请重试', icon: 'none' })
      }
      // ========== 修改结束 ==========
    }
  })
}

// 静默登录（没有用户信息）
const silentLogin = (code) => {
  uni.showLoading({ title: '登录中...', mask: true })
  
  request({
    url: API.USER_LOGIN_WECHAT,
    method: 'POST',
    data: { 
      code: code,
      silent: true
    }
  }).then(res => {
    uni.hideLoading()
    isLoading.value = false
    
    if (res.code === 200) {
      const user = res.data
      
      if (user.token) {
        uni.setStorageSync('token', user.token)
      }
      
      // 处理头像 URL，强制转成 https
      let avatarUrl = user.avatarUrl || '/static/haocun.jpg'
      if (avatarUrl && avatarUrl.startsWith('http://')) {
        avatarUrl = avatarUrl.replace('http://', 'https://')
      }
      
      uni.setStorageSync('userId', user.id)
      uni.setStorageSync('userInfo', {
        id: user.id,
        nickname: user.nickname || '微信用户',
        avatar: avatarUrl,
        height: user.height,
        currentWeight: user.currentWeight
      })
      uni.setStorageSync('isLogin', true)
      
      uni.showToast({ title: '登录成功', icon: 'success' })
      navigateAfterLogin(user)
    } else {
      uni.showToast({ title: res.message || '登录失败', icon: 'none' })
    }
  }).catch(err => {
    uni.hideLoading()
    isLoading.value = false
    console.error('静默登录失败', err)
    uni.showToast({ title: '登录失败，请重试', icon: 'none' })
  })
}

// 打开手机号登录面板
const handlePhoneLogin = () => {
  if (!agreeChecked.value) {
    uni.showToast({ title: '请先同意用户协议', icon: 'none' })
    return
  }
  phoneNumber.value = ''
  verifyCode.value = ''
  phoneValid.value = false
  panelTip.value = ''
  showPhonePanel.value = true
}

// 关闭面板
const closePhonePanel = () => {
  showPhonePanel.value = false
  phoneFocus.value = false
  codeFocus.value = false
}

// 手机号输入处理
const onPhoneInput = () => {
  phoneValid.value = /^1[3-9]\d{9}$/.test(phoneNumber.value)
  if (panelTip.value) panelTip.value = ''
}

// 发送验证码
const sendCode = () => {
  if (isCounting.value) return
  if (!phoneValid.value) {
    panelTip.value = '请输入正确的11位手机号'
    return
  }

  isCounting.value = true
  countDown.value = 60
  codeTimer = setInterval(() => {
    countDown.value--
    if (countDown.value <= 0) {
      clearInterval(codeTimer)
      isCounting.value = false
      countDown.value = 60
    }
  }, 1000)

  request({
    url: API.USER_SEND_CODE,
    method: 'POST',
    data: { phone: phoneNumber.value }
  }).then(() => {
    panelTip.value = '验证码已发送至 ' + phoneNumber.value.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  }).catch(() => {
    panelTip.value = '验证码发送失败，请稍后重试'
    clearInterval(codeTimer)
    isCounting.value = false
    countDown.value = 60
  })
}

// 执行手机号登录
const doPhoneLogin = () => {
  if (!phoneValid.value) {
    panelTip.value = '请输入正确的手机号'
    return
  }
  if (verifyCode.value.length < 4) {
    panelTip.value = '请输入验证码'
    return
  }

  isLoading.value = true

  request({
    url: API.USER_LOGIN_PHONE,
    method: 'POST',
    data: {
      phone: phoneNumber.value,
      verifyCode: verifyCode.value
    }
  }).then(res => {
    isLoading.value = false

    if (res.code === 200) {
      const user = res.data
      if (user.token) uni.setStorageSync('token', user.token)

      let avatarUrl = user.avatarUrl || '/static/haocun.jpg'
      if (avatarUrl && avatarUrl.startsWith('http://')) {
        avatarUrl = avatarUrl.replace('http://', 'https://')
      }

      uni.setStorageSync('userId', user.id)
      uni.setStorageSync('userInfo', {
        id: user.id,
        nickname: user.nickname || '手机用户',
        avatar: avatarUrl,
        height: user.height,
        currentWeight: user.currentWeight
      })
      uni.setStorageSync('isLogin', true)

      showPhonePanel.value = false
      uni.showToast({ title: '登录成功', icon: 'success' })
      navigateAfterLogin(user)
    } else {
      panelTip.value = res.message || '登录失败，请重试'
    }
  }).catch(err => {
    isLoading.value = false
    panelTip.value = '网络错误，请检查网络后重试'
  })
}

onUnmounted(() => {
  if (codeTimer) clearInterval(codeTimer)
  if (interval) clearInterval(interval)
})

// 监听面板显示，自动聚焦
watch(showPhonePanel, (val) => {
  if (val) {
    setTimeout(() => { phoneFocus.value = true }, 300)
  }
})
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(135deg, #FF8C42 0%, #FFD93D 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
  overflow: hidden;
}

.character-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30rpx;
}

.rooster-animation {
  position: relative;
  width: 280rpx;
  height: 280rpx;
  animation: bounce 0.5s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10rpx); }
}

.rooster-body {
  position: relative;
  width: 100%;
  height: 100%;
}

.body {
  position: relative;
  width: 220rpx;
  height: 240rpx;
  margin: 0 auto;
}

.head {
  position: absolute;
  top: -10rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 100rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #FF8C42 0%, #FFB347 100%);
  border-radius: 50%;
  z-index: 3;
}

.comb {
  position: absolute;
  top: -25rpx;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 5rpx;
}

.comb-part {
  width: 22rpx;
  height: 35rpx;
  background-color: #FF6B35;
  border-radius: 50% 50% 40% 40%;
}

.comb-part:first-child { transform: rotate(-15deg); }
.comb-part:last-child { transform: rotate(15deg); }

.beak {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 15rpx;
  width: 40rpx;
  height: 25rpx;
  z-index: 4;
}

.beak-top {
  position: absolute;
  top: 0;
  left: 0;
  width: 40rpx;
  height: 15rpx;
  background: linear-gradient(135deg, #FFD93D 0%, #FFB347 100%);
  border-radius: 10rpx 10rpx 0 0;
}

.beak-bottom {
  position: absolute;
  bottom: 0;
  left: 5rpx;
  width: 30rpx;
  height: 10rpx;
  background: linear-gradient(135deg, #FFD93D 0%, #FFB347 100%);
  border-radius: 0 0 10rpx 10rpx;
}

.wattle {
  position: absolute;
  bottom: -10rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 20rpx;
  height: 20rpx;
  background-color: #FF6B35;
  border-radius: 50%;
}

.eyes {
  position: absolute;
  top: 35rpx;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 25rpx;
}

.eye {
  position: relative;
  width: 18rpx;
  height: 20rpx;
  background-color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.eyeball {
  width: 10rpx;
  height: 10rpx;
  background-color: #1a1a1a;
  border-radius: 50%;
}

.eye-shine {
  position: absolute;
  top: 3rpx;
  right: 3rpx;
  width: 4rpx;
  height: 4rpx;
  background-color: #ffffff;
  border-radius: 50%;
}

.blush {
  position: absolute;
  top: 60rpx;
  width: 18rpx;
  height: 12rpx;
  background-color: #FFB347;
  border-radius: 50%;
  opacity: 0.6;
}

.left-blush { left: 12rpx; }
.right-blush { right: 12rpx; }

.torso {
  position: absolute;
  top: 70rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 160rpx;
  height: 130rpx;
  background: linear-gradient(135deg, #FF8C42 0%, #FFD93D 100%);
  border-radius: 50% 50% 40% 40%;
  z-index: 2;
}

.belly {
  position: absolute;
  bottom: 15rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 110rpx;
  height: 60rpx;
  background: linear-gradient(135deg, #FFF3B0 0%, #FFE5D0 100%);
  border-radius: 50%;
}

.wings {
  position: absolute;
  top: 30rpx;
  left: 0;
  right: 0;
  width: 100%;
  height: 70rpx;
  pointer-events: none;
  z-index: 4;
}

.wing {
  position: absolute;
  width: 50rpx;
  height: 60rpx;
  background: linear-gradient(135deg, #FF8C42 0%, #FFB347 100%);
  border-radius: 40% 60% 50% 50%;
  transform-origin: top center;
}

.left-wing { left: -15rpx; transform: rotate(15deg); }
.right-wing { right: -15rpx; transform: rotate(-15deg); }

.left-wing.flapping { animation: flapLeft 0.3s ease-in-out infinite alternate; }
.right-wing.flapping { animation: flapRight 0.3s ease-in-out infinite alternate; }

@keyframes flapLeft {
  0% { transform: rotate(15deg); }
  100% { transform: rotate(-30deg); }
}

@keyframes flapRight {
  0% { transform: rotate(-15deg); }
  100% { transform: rotate(30deg); }
}

.feather {
  position: absolute;
  width: 20rpx;
  height: 25rpx;
  background-color: #FF8C42;
  border-radius: 0 50% 50% 0;
}

.wing .feather:first-child { top: 10rpx; right: 5rpx; transform: rotate(10deg); }
.wing .feather:nth-child(2) { top: 25rpx; right: 0; transform: rotate(5deg); }
.wing .feather:nth-child(3) { top: 40rpx; right: 5rpx; transform: rotate(0deg); }

.tail {
  position: absolute;
  bottom: 20rpx;
  right: -20rpx;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5rpx;
  z-index: 1;
}

.tail.wagging { animation: wag 0.3s ease-in-out infinite alternate; }

@keyframes wag {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(15deg); }
}

.tail-feather {
  width: 45rpx;
  height: 12rpx;
  background: linear-gradient(135deg, #FFB347 0%, #FF8C42 100%);
  border-radius: 20rpx;
}

.tail-feather:nth-child(1) { width: 55rpx; transform: rotate(5deg); }
.tail-feather:nth-child(2) { width: 50rpx; transform: rotate(0deg); }
.tail-feather:nth-child(3) { width: 45rpx; transform: rotate(-5deg); }
.tail-feather:nth-child(4) { width: 40rpx; transform: rotate(-10deg); }

.legs {
  position: absolute;
  bottom: -15rpx;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 45rpx;
  z-index: 1;
}

.leg { position: relative; width: 35rpx; }

.left-leg.running { animation: runLeft 0.25s ease-in-out infinite alternate; }
.right-leg.running { animation: runRight 0.25s ease-in-out infinite alternate; }

@keyframes runLeft {
  0% { transform: translateY(0) rotate(0deg); }
  100% { transform: translateY(12rpx) rotate(-8deg); }
}

@keyframes runRight {
  0% { transform: translateY(0) rotate(0deg); }
  100% { transform: translateY(12rpx) rotate(8deg); }
}

.thigh {
  width: 30rpx;
  height: 30rpx;
  background: linear-gradient(135deg, #FF8C42 0%, #FFD93D 100%);
  border-radius: 50%;
}

.left-thigh { margin-left: 3rpx; }
.right-thigh { margin-right: 3rpx; }

.foot {
  position: absolute;
  bottom: -15rpx;
  display: flex;
  gap: 5rpx;
}

.left-foot { left: 0; }
.right-foot { right: 0; }

.toe {
  width: 12rpx;
  height: 18rpx;
  background: linear-gradient(135deg, #FFD93D 0%, #FFB347 100%);
  border-radius: 0 0 6rpx 6rpx;
}

.sweat {
  position: absolute;
  top: 10rpx;
  right: -10rpx;
  width: 60rpx;
  height: 60rpx;
  z-index: 5;
}

.sweat-drop {
  position: absolute;
  font-size: 20rpx;
  animation: fall 0.8s ease-in infinite;
}

.drop1 { top: 0; right: 0; animation-delay: 0s; }
.drop2 { top: 15rpx; right: 10rpx; animation-delay: 0.3s; font-size: 16rpx; }
.drop3 { top: 30rpx; right: 0; animation-delay: 0.6s; font-size: 14rpx; }

@keyframes fall {
  0% { opacity: 0; transform: translateY(-10rpx); }
  50% { opacity: 1; }
  100% { opacity: 0; transform: translateY(30rpx); }
}

.speed-lines {
  position: absolute;
  left: -40rpx;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  z-index: 5;
}

.speed-line {
  width: 40rpx;
  height: 4rpx;
  background-color: rgba(255, 255, 255, 0.6);
  border-radius: 2rpx;
  animation: speed 0.5s linear infinite;
}

.speed-line:nth-child(1) { animation-delay: 0s; }
.speed-line:nth-child(2) { width: 25rpx; animation-delay: 0.2s; }
.speed-line:nth-child(3) { width: 15rpx; animation-delay: 0.4s; }

@keyframes speed {
  0% { opacity: 0; transform: translateX(0); }
  50% { opacity: 1; }
  100% { opacity: 0; transform: translateX(-30rpx); }
}

.encourage-text {
  margin-top: 25rpx;
  text-align: center;
}

.encourage-msg {
  display: inline-block;
  font-size: 26rpx;
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.25);
  padding: 12rpx 28rpx;
  border-radius: 40rpx;
  backdrop-filter: blur(10rpx);
  animation: fadeInOut 3s ease-in-out infinite;
}

@keyframes fadeInOut {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}

.logo-area {
  text-align: center;
  margin-bottom: 50rpx;
}

.app-name {
  display: block;
  font-size: 56rpx;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 12rpx;
  text-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
  letter-spacing: 4rpx;
}

.slogan {
  display: block;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.85);
}

.login-area {
  width: 100%;
  margin-bottom: 40rpx;
}

.login-btn {
  width: 100%;
  height: 90rpx;
  border-radius: 45rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28rpx;
  border: none;
  transition: all 0.2s ease;
}

.login-btn:active {
  transform: scale(0.97);
  opacity: 0.9;
}

.login-btn::after { border: none; }

.wechat-btn {
  background-color: #FF8C42;
  color: #ffffff;
  box-shadow: 0 4rpx 15rpx rgba(7, 193, 96, 0.3);
}

.phone-btn {
  background-color: #ffffff;
  color: #5C4033;
  border: 1rpx solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.1);
}

.btn-icon {
  font-size: 36rpx;
  margin-right: 16rpx;
}

.btn-text {
  font-size: 32rpx;
  font-weight: 500;
}

.agreement {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 20rpx;
}

.agreement-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-left: 12rpx;
}

.test-entry {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 40rpx;
  padding: 16rpx 0;
}

.test-line {
  width: 60rpx;
  height: 1rpx;
  background-color: rgba(255, 255, 255, 0.3);
}

.test-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 20rpx;
}

/* ========== 手机号登录面板 ========== */
.phone-panel-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.45);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  animation: maskFadeIn 0.3s ease;
}

@keyframes maskFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.phone-panel {
  width: 100%;
  background: linear-gradient(180deg, #FFFFFF 0%, #FFF8F0 100%);
  border-radius: 40rpx 40rpx 0 0;
  padding: 40rpx 40rpx 60rpx;
  animation: panelSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  box-shadow: 0 -10rpx 40rpx rgba(255, 140, 66, 0.15);
}

@keyframes panelSlideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

/* 面板头部 - 小鸡 */
.panel-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 50rpx;
  position: relative;
}

.panel-chicken {
  width: 120rpx;
  height: 110rpx;
  position: relative;
  margin-bottom: 20rpx;
}

.pc-body {
  width: 90rpx;
  height: 85rpx;
  background: linear-gradient(135deg, #FFD93D 0%, #FFB347 100%);
  border-radius: 50% 50% 45% 45%;
  position: absolute;
  top: 15rpx;
  left: 15rpx;
  animation: panelChickenBounce 2s ease-in-out infinite;
  box-shadow: 0 6rpx 18rpx rgba(255, 140, 66, 0.25);
}

@keyframes panelChickenBounce {
  0%, 100% { transform: translateY(0) rotate(-3deg); }
  50% { transform: translateY(-10rpx) rotate(3deg); }
}

.pc-body::before {
  content: '';
  position: absolute;
  top: -16rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8rpx solid transparent;
  border-right: 8rpx solid transparent;
  border-bottom: 16rpx solid #FF6B35;
}

.pc-eye {
  position: absolute;
  width: 10rpx;
  height: 10rpx;
  background: #333;
  border-radius: 50%;
  top: 38rpx;
  z-index: 2;
  animation: chickenBlink 3s ease-in-out infinite;
}

.pc-eye.pce-left { left: 38rpx; }
.pc-eye.pce-right { right: 38rpx; }

.pc-beak {
  position: absolute;
  bottom: 35rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 10rpx solid transparent;
  border-right: 10rpx solid transparent;
  border-top: 14rpx solid #FF6B35;
  z-index: 2;
}

.pc-wing {
  position: absolute;
  width: 22rpx;
  height: 26rpx;
  background: #FFB347;
  border-radius: 50%;
  top: 42rpx;
  z-index: 1;
  animation: wingFlap 1.5s ease-in-out infinite;
}

.pc-wing.pcw-left {
  left: 10rpx;
  transform: rotate(-25deg);
  animation-name: wingFlapLeft;
}

.pc-wing.pcw-right {
  right: 10rpx;
  transform: rotate(25deg);
  animation-name: wingFlapRight;
}

.panel-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #5C4033;
  margin-bottom: 10rpx;
}

.panel-subtitle {
  font-size: 26rpx;
  color: #B8956A;
}

.panel-close {
  position: absolute;
  top: 0;
  right: 0;
  width: 56rpx;
  height: 56rpx;
  background: rgba(255, 140, 66, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-icon {
  font-size: 24rpx;
  color: #FF8C42;
  font-weight: bold;
}

/* 输入区域 */
.panel-body {
  margin-bottom: 40rpx;
}

.input-group {
  display: flex;
  align-items: center;
  background-color: #FFF8F0;
  border: 2rpx solid transparent;
  border-radius: 20rpx;
  padding: 24rpx 30rpx;
  margin-bottom: 24rpx;
  transition: all 0.3s ease;
}

.input-group.input-focus {
  background-color: #FFFFFF;
  border-color: #FF8C42;
  box-shadow: 0 4rpx 16rpx rgba(255, 140, 66, 0.12);
  transform: translateY(-2rpx);
}

.input-prefix {
  font-size: 30rpx;
  color: #FF8C42;
  font-weight: 600;
  margin-right: 20rpx;
}

.phone-input {
  flex: 1;
  font-size: 32rpx;
  color: #5C4033;
  height: 50rpx;
  line-height: 50rpx;
}

.code-input {
  flex: 1;
  font-size: 32rpx;
  color: #5C4033;
  height: 50rpx;
  line-height: 50rpx;
}

.input-placeholder {
  color: #C8B89A;
  font-size: 30rpx;
}

.input-clear {
  width: 44rpx;
  height: 44rpx;
  background: rgba(255, 140, 66, 0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 16rpx;
}

.clear-icon {
  font-size: 20rpx;
  color: #FF8C42;
}

.code-group {
  padding-right: 20rpx;
}

.code-btn {
  padding: 16rpx 24rpx;
  border-radius: 16rpx;
  background-color: #FFE5D0;
  margin-left: 16rpx;
  transition: all 0.3s ease;
}

.code-btn.code-ready {
  background: linear-gradient(135deg, #FF8C42 0%, #FFD93D 100%);
}

.code-btn.code-counting {
  background-color: #F0E8DC;
}

.code-btn-text {
  font-size: 24rpx;
  color: #B8956A;
  white-space: nowrap;
}

.code-btn.code-ready .code-btn-text {
  color: #FFFFFF;
  font-weight: 500;
}

.code-btn.code-counting .code-btn-text {
  color: #C8B89A;
}

/* 提示信息 */
.panel-tip {
  text-align: center;
  margin-top: 10rpx;
  animation: tipFadeIn 0.3s ease;
}

@keyframes tipFadeIn {
  from { opacity: 0; transform: translateY(-5rpx); }
  to { opacity: 1; transform: translateY(0); }
}

.tip-text {
  font-size: 24rpx;
  color: #FF8C42;
}

/* 登录按钮 */
.panel-footer {
  padding: 0 10rpx;
}

.phone-login-btn {
  width: 100%;
  height: 96rpx;
  border-radius: 48rpx;
  background: linear-gradient(135deg, #FFE5D0 0%, #FFF3B0 100%);
  color: #C8B89A;
  font-size: 32rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  transition: all 0.3s ease;
}

.phone-login-btn::after { border: none; }

.phone-login-btn.btn-ready {
  background: linear-gradient(135deg, #FF8C42 0%, #FFD93D 100%);
  color: #FFFFFF;
  box-shadow: 0 8rpx 28rpx rgba(255, 140, 66, 0.35);
}

.phone-login-btn.btn-ready:active {
  transform: scale(0.97);
  box-shadow: 0 4rpx 14rpx rgba(255, 140, 66, 0.25);
}

/* 按钮加载动画 */
.btn-loader {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.bl-dot {
  width: 12rpx;
  height: 12rpx;
  background: #FFFFFF;
  border-radius: 50%;
  animation: btnLoader 1.4s ease-in-out infinite;
}

.bl-dot:nth-child(2) { animation-delay: 0.2s; }
.bl-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes btnLoader {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}
</style>