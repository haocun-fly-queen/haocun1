<template>
  <view class="container">
    <!-- ====== 动态绒毛背景 ====== -->
    <view class="fluff-bg">
      <view class="orb orb-1"></view>
      <view class="orb orb-2"></view>
      <view class="orb orb-3"></view>
      <view class="orb orb-4"></view>
      <view class="orb orb-5"></view>
    </view>

    <!-- ====== 动画形象区域 ====== -->
    <view class="character-area">
      <view class="rooster-animation" :class="{ 'running': isRunning }">
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

    <!-- ========== 登录按钮区 ========== -->
    <view class="login-area">
      <button
        class="login-btn account-btn"
        @click="handleAccountLogin"
        :disabled="isLoading"
      >
        <text class="btn-icon">🔑</text>
        <text class="btn-text">账号密码登录</text>
      </button>

      <button class="login-btn phone-btn" @click="handlePhoneLogin" :disabled="isLoading">
        <text class="btn-icon">📱</text>
        <text class="btn-text">{{ isLoading ? '登录中...' : '手机号登录' }}</text>
      </button>

      <view class="agreement">
        <checkbox value="agree" :checked="agreeChecked" @click="toggleAgree" />
        <text class="agreement-text">登录即表示同意《用户协议》和《隐私政策》</text>
      </view>
    </view>

    <!-- ========== 其他登录方式 ========== -->
    <view class="other-section">
      <view class="other-divider">
        <view class="div-line"></view>
        <text class="div-text">其他登录方式</text>
        <view class="div-line"></view>
      </view>
      <view class="other-icons">
        <view class="wechat-circle" @click="handleWechatLogin">
          <text class="wechat-icon">微</text>
        </view>
        <view class="email-circle" @click="handleEmailLogin">
          <text class="email-icon-text">✉</text>
        </view>
      </view>
    </view>


    <!-- ========== 手机号登录面板 ========== -->
    <view class="phone-panel-mask" v-if="showPhonePanel" @click="closePhonePanel">
      <view class="phone-panel" @click.stop>
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
        <view class="panel-body">
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
              <text class="code-btn-text">{{ isCounting ? countDown + 's后重发' : '获取验证码' }}</text>
            </view>
          </view>
          <view class="panel-tip" v-if="panelTip">
            <text class="tip-text">{{ panelTip }}</text>
          </view>
        </view>
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

    <!-- ========== 账号密码登录面板 ========== -->
    <view class="phone-panel-mask" v-if="showAccountPanel" @click="closeAccountPanel">
      <view class="phone-panel" @click.stop>
        <view class="panel-header">
          <view class="panel-chicken">
            <view class="pc-body"></view>
            <view class="pc-eye pce-left"></view>
            <view class="pc-eye pce-right"></view>
            <view class="pc-beak"></view>
            <view class="pc-wing pcw-left"></view>
            <view class="pc-wing pcw-right"></view>
          </view>
          <text class="panel-title">账号密码登录</text>
          <text class="panel-subtitle">小鸡仔等你来~</text>
          <view class="panel-close" @click="closeAccountPanel">
            <text class="close-icon">✕</text>
          </view>
        </view>

        <view class="sub-tabs">
          <view class="sub-tab" :class="{ active: accountSubTab === 'login' }" @click="switchSubTab('login')">
            <text>登录</text>
          </view>
          <view class="sub-tab" :class="{ active: accountSubTab === 'register' }" @click="switchSubTab('register')">
            <text>注册</text>
          </view>
        </view>

        <!-- 登录表单 -->
        <view class="panel-body" v-if="accountSubTab === 'login'">
          <view class="input-group" :class="{ 'input-focus': luFocus }">
            <input
              class="phone-input"
              v-model="loginUsername"
              placeholder="请输入账号"
              placeholder-class="input-placeholder"
              @focus="luFocus = true"
              @blur="luFocus = false"
            />
            <view class="input-clear" v-if="loginUsername" @click="loginUsername = ''">
              <text class="clear-icon">✕</text>
            </view>
          </view>
          <view class="input-group" :class="{ 'input-focus': lpFocus }">
            <input
              class="phone-input"
              v-model="loginPassword"
              :password="!showLoginPwd"
              placeholder="请输入密码"
              placeholder-class="input-placeholder"
              @focus="lpFocus = true"
              @blur="lpFocus = false"
            />
            <view class="pwd-toggle" @click="showLoginPwd = !showLoginPwd">
              <text class="pwd-toggle-text">{{ showLoginPwd ? '🙈' : '👁' }}</text>
            </view>
          </view>
          <view class="panel-tip" v-if="accountTip">
            <text class="tip-text">{{ accountTip }}</text>
          </view>
        </view>

        <!-- 注册表单 -->
        <view class="panel-body" v-if="accountSubTab === 'register'">
          <view class="input-group" :class="{ 'input-focus': ruFocus }">
            <input
              class="phone-input"
              v-model="regUsername"
              placeholder="请设置账号（3-20位）"
              placeholder-class="input-placeholder"
              @focus="ruFocus = true"
              @blur="ruFocus = false"
              @input="onRegUsernameInput"
            />
            <view class="username-status" v-if="usernameStatus === 'checking'">
              <view class="status-spinner"></view>
            </view>
            <view class="username-status ok" v-else-if="usernameStatus === 'available'">
              <text class="status-icon">✓</text>
            </view>
            <view class="username-status no" v-else-if="usernameStatus === 'taken'">
              <text class="status-icon">✕</text>
            </view>
          </view>
          <view class="field-hint" v-if="usernameStatus === 'taken'">
            <text class="hint-red">该账号已被占用</text>
          </view>

          <view class="input-group" :class="{ 'input-focus': rpFocus }">
            <input
              class="phone-input"
              v-model="regPassword"
              :password="!showRegPwd"
              placeholder="请设置密码（6-20位）"
              placeholder-class="input-placeholder"
              @focus="rpFocus = true"
              @blur="rpFocus = false"
            />
            <view class="pwd-toggle" @click="showRegPwd = !showRegPwd">
              <text class="pwd-toggle-text">{{ showRegPwd ? '🙈' : '👁' }}</text>
            </view>
          </view>

          <view class="input-group" :class="{ 'input-focus': rcpFocus }">
            <input
              class="phone-input"
              v-model="regConfirmPwd"
              :password="!showRegConfirmPwd"
              placeholder="请确认密码"
              placeholder-class="input-placeholder"
              @focus="rcpFocus = true"
              @blur="rcpFocus = false"
            />
            <view class="pwd-toggle" @click="showRegConfirmPwd = !showRegConfirmPwd">
              <text class="pwd-toggle-text">{{ showRegConfirmPwd ? '🙈' : '👁' }}</text>
            </view>
          </view>
          <view class="field-hint" v-if="regConfirmPwd && regPassword !== regConfirmPwd">
            <text class="hint-red">两次密码不一致</text>
          </view>

          <view class="input-group" :class="{ 'input-focus': rphFocus }">
            <text class="input-prefix">+86</text>
            <input
              class="phone-input"
              v-model="regPhone"
              type="number"
              maxlength="11"
              placeholder="请输入手机号"
              placeholder-class="input-placeholder"
              @focus="rphFocus = true"
              @blur="rphFocus = false"
              @input="onRegPhoneInput"
            />
          </view>

          <view class="input-group code-group" :class="{ 'input-focus': rcFocus }">
            <input
              class="code-input"
              v-model="regCode"
              type="number"
              maxlength="6"
              placeholder="请输入验证码"
              placeholder-class="input-placeholder"
              @focus="rcFocus = true"
              @blur="rcFocus = false"
            />
            <view class="code-btn" :class="{ 'code-counting': regIsCounting, 'code-ready': regPhoneValid && !regIsCounting }" @click="sendRegCode">
              <text class="code-btn-text">{{ regIsCounting ? regCountdown + 's后重发' : '获取验证码' }}</text>
            </view>
          </view>

          <view class="panel-tip" v-if="accountTip">
            <text class="tip-text">{{ accountTip }}</text>
          </view>
        </view>

        <view class="panel-footer">
          <button
            v-if="accountSubTab === 'login'"
            class="phone-login-btn"
            :class="{ 'btn-ready': loginUsername && loginPassword }"
            :disabled="!loginUsername || !loginPassword || isLoading"
            @click="doAccountLogin"
          >
            <text v-if="!isLoading">🐥 立即登录</text>
            <view v-else class="btn-loader">
              <view class="bl-dot"></view>
              <view class="bl-dot"></view>
              <view class="bl-dot"></view>
            </view>
          </button>
          <button
            v-else
            class="phone-login-btn"
            :class="{ 'btn-ready': canRegister }"
            :disabled="!canRegister || isLoading"
            @click="doRegister"
          >
            <text v-if="!isLoading">🐥 立即注册</text>
            <view v-else class="btn-loader">
              <view class="bl-dot"></view>
              <view class="bl-dot"></view>
              <view class="bl-dot"></view>
            </view>
          </button>
        </view>
      </view>
    </view>

    <!-- ========== 邮箱登录面板（独立于账号面板，移到同级） ========== -->
    <view class="phone-panel-mask" v-if="showEmailPanel" @click="closeEmailPanel">
      <view class="phone-panel" @click.stop>
        <view class="panel-header">
          <view class="panel-chicken">
            <view class="pc-body"></view>
            <view class="pc-eye pce-left"></view>
            <view class="pc-eye pce-right"></view>
            <view class="pc-beak"></view>
            <view class="pc-wing pcw-left"></view>
            <view class="pc-wing pcw-right"></view>
          </view>
          <text class="panel-title">邮箱登录</text>
          <text class="panel-subtitle">用邮箱也能登录哦~</text>
          <view class="panel-close" @click="closeEmailPanel">
            <text class="close-icon">✕</text>
          </view>
        </view>

        <!-- 子 Tab：验证码登录 / 密码登录 / 注册 -->
        <view class="sub-tabs">
          <view class="sub-tab" :class="{ active: emailSubTab === 'code' }" @click="emailSubTab = 'code'; emailTip = ''">
            <text>验证码登录</text>
          </view>
          <view class="sub-tab" :class="{ active: emailSubTab === 'password' }" @click="emailSubTab = 'password'; emailTip = ''">
            <text>密码登录</text>
          </view>
          <view class="sub-tab" :class="{ active: emailSubTab === 'register' }" @click="emailSubTab = 'register'; emailTip = ''">
            <text>注册</text>
          </view>
        </view>

        <!-- 验证码登录 -->
        <view class="panel-body" v-if="emailSubTab === 'code'">
          <view class="input-group" :class="{ 'input-focus': emFocus }">
            <input
              class="phone-input"
              v-model="emailAddr"
              placeholder="请输入邮箱"
              placeholder-class="input-placeholder"
              @focus="emFocus = true"
              @blur="emFocus = false"
            />
            <view class="input-clear" v-if="emailAddr" @click="emailAddr = ''">
              <text class="clear-icon">✕</text>
            </view>
          </view>
          <view class="input-group code-group" :class="{ 'input-focus': emcFocus }">
            <input
              class="code-input"
              v-model="emailCode"
              type="number"
              maxlength="6"
              placeholder="请输入验证码"
              placeholder-class="input-placeholder"
              @focus="emcFocus = true"
              @blur="emcFocus = false"
            />
            <view
              class="code-btn"
              :class="{ 'code-counting': emailIsCounting, 'code-ready': emailValid && !emailIsCounting }"
              @click="sendEmailCode"
            >
              <text class="code-btn-text">{{ emailIsCounting ? emailCountdown + 's后重发' : '获取验证码' }}</text>
            </view>
          </view>
          <view class="panel-tip" v-if="emailTip">
            <text class="tip-text">{{ emailTip }}</text>
          </view>
        </view>

        <!-- 密码登录 -->
        <view class="panel-body" v-if="emailSubTab === 'password'">
          <view class="input-group" :class="{ 'input-focus': empFocus }">
            <input
              class="phone-input"
              v-model="emailPwdAddr"
              placeholder="请输入邮箱"
              placeholder-class="input-placeholder"
              @focus="empFocus = true"
              @blur="empFocus = false"
            />
            <view class="input-clear" v-if="emailPwdAddr" @click="emailPwdAddr = ''">
              <text class="clear-icon">✕</text>
            </view>
          </view>
          <view class="input-group" :class="{ 'input-focus': emppFocus }">
            <input
              class="phone-input"
              v-model="emailPwd"
              :password="!showEmailPwd"
              placeholder="请输入密码"
              placeholder-class="input-placeholder"
              @focus="emppFocus = true"
              @blur="emppFocus = false"
            />
            <view class="pwd-toggle" @click="showEmailPwd = !showEmailPwd">
              <text class="pwd-toggle-text">{{ showEmailPwd ? '🙈' : '👁' }}</text>
            </view>
          </view>
          <view class="panel-tip" v-if="emailTip">
            <text class="tip-text">{{ emailTip }}</text>
          </view>
        </view>

        <!-- 注册 -->
        <view class="panel-body" v-if="emailSubTab === 'register'">
          <view class="input-group" :class="{ 'input-focus': emrFocus }">
            <input
              class="phone-input"
              v-model="regEmailAddr"
              placeholder="请输入邮箱"
              placeholder-class="input-placeholder"
              @focus="emrFocus = true"
              @blur="emrFocus = false"
            />
            <view class="input-clear" v-if="regEmailAddr" @click="regEmailAddr = ''">
              <text class="clear-icon">✕</text>
            </view>
          </view>
          <view class="input-group" :class="{ 'input-focus': emrpFocus }">
            <input
              class="phone-input"
              v-model="regEmailPwd"
              :password="!showRegEmailPwd"
              placeholder="请设置密码（6位以上）"
              placeholder-class="input-placeholder"
              @focus="emrpFocus = true"
              @blur="emrpFocus = false"
            />
            <view class="pwd-toggle" @click="showRegEmailPwd = !showRegEmailPwd">
              <text class="pwd-toggle-text">{{ showRegEmailPwd ? '🙈' : '👁' }}</text>
            </view>
          </view>
          <view class="input-group" :class="{ 'input-focus': emrcFocus }">
            <input
              class="code-input"
              v-model="regEmailCode"
              type="number"
              maxlength="6"
              placeholder="请输入验证码"
              placeholder-class="input-placeholder"
              @focus="emrcFocus = true"
              @blur="emrcFocus = false"
            />
            <view
              class="code-btn"
              :class="{ 'code-counting': regEmailIsCounting, 'code-ready': regEmailValid && !regEmailIsCounting }"
              @click="sendRegEmailCode"
            >
              <text class="code-btn-text">{{ regEmailIsCounting ? regEmailCountdown + 's后重发' : '获取验证码' }}</text>
            </view>
          </view>
          <view class="panel-tip" v-if="emailTip">
            <text class="tip-text">{{ emailTip }}</text>
          </view>
        </view>

        <view class="panel-footer">
          <!-- 验证码登录按钮 -->
          <button
            v-if="emailSubTab === 'code'"
            class="phone-login-btn"
            :class="{ 'btn-ready': emailValid && emailCode.length >= 4 }"
            :disabled="!emailValid || emailCode.length < 4 || isLoading"
            @click="doEmailCodeLogin"
          >
            <text v-if="!isLoading">🐥 立即登录</text>
            <view v-else class="btn-loader">
              <view class="bl-dot"></view>
              <view class="bl-dot"></view>
              <view class="bl-dot"></view>
            </view>
          </button>
          <!-- 密码登录按钮 -->
          <button
            v-if="emailSubTab === 'password'"
            class="phone-login-btn"
            :class="{ 'btn-ready': emailPwdAddr && emailPwd }"
            :disabled="!emailPwdAddr || !emailPwd || isLoading"
            @click="doEmailPwdLogin"
          >
            <text v-if="!isLoading">🐥 立即登录</text>
            <view v-else class="btn-loader">
              <view class="bl-dot"></view>
              <view class="bl-dot"></view>
              <view class="bl-dot"></view>
            </view>
          </button>
          <!-- 注册按钮 -->
          <button
            v-if="emailSubTab === 'register'"
            class="phone-login-btn"
            :class="{ 'btn-ready': canEmailRegister }"
            :disabled="!canEmailRegister || isLoading"
            @click="doEmailRegister"
          >
            <text v-if="!isLoading">🐥 立即注册</text>
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import request from '../../utils/request'
import { API } from '../../config'

// ==================== 通用状态 ====================
const agreeChecked = ref(false)
const isLoading = ref(false)
const isRunning = ref(true)
const encourageMsg = ref(' 叽叽叽！一起健康生活吧！🐥')
const msgIndex = ref(0)

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

// ==================== 手机号面板状态 ====================
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

// ==================== 账号密码面板状态 ====================
const showAccountPanel = ref(false)
const accountSubTab = ref('login')
const accountTip = ref('')

const loginUsername = ref('')
const loginPassword = ref('')
const luFocus = ref(false)
const lpFocus = ref(false)
const showLoginPwd = ref(false)

const regUsername = ref('')
const regPassword = ref('')
const regConfirmPwd = ref('')
const regPhone = ref('')
const regCode = ref('')
const ruFocus = ref(false)
const rpFocus = ref(false)
const rcpFocus = ref(false)
const rphFocus = ref(false)
const rcFocus = ref(false)
const showRegPwd = ref(false)
const showRegConfirmPwd = ref(false)
const usernameStatus = ref(null)
const regPhoneValid = ref(false)
const regIsCounting = ref(false)
const regCountdown = ref(60)
let regCodeTimer = null
let checkUsernameTimer = null

// ==================== 邮箱登录状态 ====================
const showEmailPanel = ref(false)
const emailSubTab = ref('code')
const emailTip = ref('')

// 验证码登录
const emailAddr = ref('')
const emailCode = ref('')
const emFocus = ref(false)
const emcFocus = ref(false)
const emailValid = ref(false)
const emailIsCounting = ref(false)
const emailCountdown = ref(60)
let emailCodeTimer = null

// 密码登录
const emailPwdAddr = ref('')
const emailPwd = ref('')
const empFocus = ref(false)
const emppFocus = ref(false)
const showEmailPwd = ref(false)

// 注册
const regEmailAddr = ref('')
const regEmailPwd = ref('')
const regEmailCode = ref('')
const emrFocus = ref(false)
const emrpFocus = ref(false)
const emrcFocus = ref(false)
const showRegEmailPwd = ref(false)
const regEmailValid = ref(false)
const regEmailIsCounting = ref(false)
const regEmailCountdown = ref(60)
let regEmailCodeTimer = null

const canEmailRegister = computed(() => {
  return regEmailAddr.value.includes('@')
    && regEmailPwd.value.length >= 6
    && regEmailCode.value.length >= 4
})

// ==================== 公共方法 ====================
const toggleAgree = () => {
  agreeChecked.value = !agreeChecked.value
}

const checkNeedProfile = (user) => {
  const defaultNicknames = ['微信用户', '手机用户', '用户']
  const isDefaultNickname = defaultNicknames.includes(user.nickname)
  const hasNoHealthData = !user.height || !user.currentWeight || user.height === 0 || user.currentWeight === 0
  return isDefaultNickname || hasNoHealthData
}

const navigateAfterLogin = (user) => {
  const needProfile = checkNeedProfile(user)
  if (needProfile) {
    uni.reLaunch({ url: '/pages/profile/profile' })
  } else {
    uni.reLaunch({ url: '/pages/home/home' })
  }
}

const clearLoginState = () => {
  uni.removeStorageSync('token')
  uni.removeStorageSync('userId')
  uni.removeStorageSync('userInfo')
  uni.removeStorageSync('userProfile')
  uni.removeStorageSync('isLogin')
}

const saveLoginState = (user, defaultName) => {
  if (user.token) uni.setStorageSync('token', user.token)
  let avatarUrl = user.avatarUrl || '/static/haocun.jpg'
  if (avatarUrl && avatarUrl.startsWith('http://')) {
    avatarUrl = avatarUrl.replace('http://', 'https://')
  }
  uni.setStorageSync('userId', user.id)
  uni.setStorageSync('userInfo', {
    id: user.id,
    nickname: user.nickname || defaultName,
    avatar: avatarUrl,
    height: user.height,
    currentWeight: user.currentWeight
  })
  uni.setStorageSync('isLogin', true)
}

// ==================== 微信登录 ====================
const handleWechatLogin = () => {
  if (!agreeChecked.value) {
    uni.showToast({ title: '请先同意用户协议', icon: 'none' })
    return
  }
  clearLoginState()
  isLoading.value = true
  uni.showLoading({ title: '登录中...', mask: true })

  uni.login({
    provider: 'weixin',
    success: (loginRes) => {
      const code = loginRes.code
      // 直接使用code登录（uni.getUserInfo已废弃，不再调用）
      silentLogin(code)
    },
    fail: (err) => {
      uni.hideLoading()
      isLoading.value = false
      console.error('微信登录失败', err)
      if (err.errMsg && err.errMsg.includes('需要重新登录')) {
        uni.showModal({
          title: '提示',
          content: '微信登录状态已过期，请重新授权',
          showCancel: false,
          success: () => {
            clearLoginState()
            uni.reLaunch({ url: '/pages/login/login' })
          }
        })
      } else {
        uni.showToast({ title: '微信登录失败，请重试', icon: 'none' })
      }
    }
  })
}

const silentLogin = (code) => {
  uni.showLoading({ title: '登录中...', mask: true })
  request({
    url: API.USER_LOGIN_WECHAT,
    method: 'POST',
    data: { code: code, silent: true }
  }).then(res => {
    uni.hideLoading()
    isLoading.value = false
    if (res.code === 200) {
      saveLoginState(res.data, '微信用户')
      uni.showToast({ title: '登录成功', icon: 'success' })
      navigateAfterLogin(res.data)
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

// ==================== 手机号登录 ====================
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

const closePhonePanel = () => {
  showPhonePanel.value = false
  phoneFocus.value = false
  codeFocus.value = false
}

const onPhoneInput = () => {
  phoneValid.value = /^1[3-9]\d{9}$/.test(phoneNumber.value)
  if (panelTip.value) panelTip.value = ''
}

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
    data: { phone: phoneNumber.value, verifyCode: verifyCode.value }
  }).then(res => {
    isLoading.value = false
    if (res.code === 200) {
      saveLoginState(res.data, '手机用户')
      showPhonePanel.value = false
      uni.showToast({ title: '登录成功', icon: 'success' })
      navigateAfterLogin(res.data)
    } else {
      panelTip.value = res.message || '登录失败，请重试'
    }
  }).catch(() => {
    isLoading.value = false
    panelTip.value = '网络错误，请检查网络后重试'
  })
}

// ==================== 账号密码登录 ====================
const handleAccountLogin = () => {
  if (!agreeChecked.value) {
    uni.showToast({ title: '请先同意用户协议', icon: 'none' })
    return
  }
  loginUsername.value = ''
  loginPassword.value = ''
  showLoginPwd.value = false
  accountSubTab.value = 'login'
  accountTip.value = ''
  regUsername.value = ''
  regPassword.value = ''
  regConfirmPwd.value = ''
  regPhone.value = ''
  regCode.value = ''
  showRegPwd.value = false
  showRegConfirmPwd.value = false
  usernameStatus.value = null
  regPhoneValid.value = false
  if (regCodeTimer) { clearInterval(regCodeTimer); regCodeTimer = null }
  regIsCounting.value = false
  regCountdown.value = 60
  showAccountPanel.value = true
}

const closeAccountPanel = () => {
  showAccountPanel.value = false
}

const switchSubTab = (tab) => {
  accountSubTab.value = tab
  accountTip.value = ''
}

const doAccountLogin = () => {
  if (!loginUsername.value || !loginPassword.value) return
  accountTip.value = ''
  isLoading.value = true
  request({
    url: API.USER_LOGIN_PASSWORD,
    method: 'POST',
    data: { username: loginUsername.value, password: loginPassword.value }
  }).then(res => {
    isLoading.value = false
    if (res.code === 200) {
      saveLoginState(res.data, '用户')
      showAccountPanel.value = false
      uni.showToast({ title: '登录成功', icon: 'success' })
      navigateAfterLogin(res.data)
    } else {
      accountTip.value = res.message || '登录失败，请检查账号密码'
    }
  }).catch(() => {
    isLoading.value = false
    accountTip.value = '网络错误，请重试'
  })
}

const onRegUsernameInput = () => {
  if (checkUsernameTimer) clearTimeout(checkUsernameTimer)
  usernameStatus.value = null
  if (!regUsername.value || regUsername.value.length < 3) return
  usernameStatus.value = 'checking'
  checkUsernameTimer = setTimeout(() => {
    request({
      url: API.USER_CHECK_USERNAME,
      method: 'GET',
      data: { username: regUsername.value }
    }).then(res => {
      if (res.code === 200) {
        usernameStatus.value = res.data.available ? 'available' : 'taken'
      }
    }).catch(() => { usernameStatus.value = null })
  }, 500)
}

const onRegPhoneInput = () => {
  regPhoneValid.value = /^1[3-9]\d{9}$/.test(regPhone.value)
}

const sendRegCode = () => {
  if (regIsCounting.value || !regPhoneValid.value) return
  regIsCounting.value = true
  regCountdown.value = 60
  regCodeTimer = setInterval(() => {
    regCountdown.value--
    if (regCountdown.value <= 0) {
      clearInterval(regCodeTimer)
      regIsCounting.value = false
      regCountdown.value = 60
    }
  }, 1000)
  request({
    url: API.USER_SEND_CODE,
    method: 'POST',
    data: { phone: regPhone.value }
  }).then(() => {
    accountTip.value = '验证码已发送至 ' + regPhone.value.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  }).catch(() => {
    accountTip.value = '验证码发送失败，请稍后重试'
    clearInterval(regCodeTimer)
    regIsCounting.value = false
    regCountdown.value = 60
  })
}

const canRegister = computed(() => {
  return regUsername.value.length >= 3
    && usernameStatus.value === 'available'
    && regPassword.value.length >= 6
    && regPassword.value === regConfirmPwd.value
    && regPhoneValid.value
    && regCode.value.length >= 4
})

const doRegister = () => {
  if (!canRegister.value) return
  accountTip.value = ''
  isLoading.value = true
  request({
    url: API.USER_REGISTER,
    method: 'POST',
    data: {
      username: regUsername.value,
      password: regPassword.value,
      phone: regPhone.value,
      verifyCode: regCode.value
    }
  }).then(res => {
    isLoading.value = false
    if (res.code === 200) {
      uni.showToast({ title: '注册成功', icon: 'success' })
      loginUsername.value = regUsername.value
      accountSubTab.value = 'login'
      accountTip.value = ''
      regUsername.value = ''
      regPassword.value = ''
      regConfirmPwd.value = ''
      regPhone.value = ''
      regCode.value = ''
      usernameStatus.value = null
      regPhoneValid.value = false
      if (regCodeTimer) { clearInterval(regCodeTimer); regCodeTimer = null }
      regIsCounting.value = false
      regCountdown.value = 60
    } else {
      accountTip.value = res.message || '注册失败'
    }
  }).catch(() => {
    isLoading.value = false
    accountTip.value = '网络错误，请重试'
  })
}

// ==================== 生命周期 ====================
onMounted(() => {
  interval = setInterval(() => {
    msgIndex.value = (msgIndex.value + 1) % encourageMessages.length
    encourageMsg.value = encourageMessages[msgIndex.value]
  }, 3000)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
  if (codeTimer) clearInterval(codeTimer)
  if (regCodeTimer) clearInterval(regCodeTimer)
  if (checkUsernameTimer) clearTimeout(checkUsernameTimer)
  if (emailCodeTimer) clearInterval(emailCodeTimer)
  if (regEmailCodeTimer) clearInterval(regEmailCodeTimer)

})

watch(showPhonePanel, (val) => {
  if (val) { setTimeout(() => { phoneFocus.value = true }, 300) }
})

watch(showAccountPanel, (val) => {
  if (val) { setTimeout(() => { luFocus.value = true }, 300) }
})

// ==================== 邮箱登录 ====================
const handleEmailLogin = () => {
  if (!agreeChecked.value) {
    uni.showToast({ title: '请先同意用户协议', icon: 'none' })
    return
  }
  emailAddr.value = ''
  emailCode.value = ''
  emailPwdAddr.value = ''
  emailPwd.value = ''
  regEmailAddr.value = ''
  regEmailPwd.value = ''
  regEmailCode.value = ''
  emailSubTab.value = 'code'
  emailTip.value = ''
  showEmailPwd.value = false
  showRegEmailPwd.value = false
  emailValid.value = false
  regEmailValid.value = false
  emailIsCounting.value = false
  regEmailIsCounting.value = false
  showEmailPanel.value = true
}

const closeEmailPanel = () => {
  showEmailPanel.value = false
}

const sendEmailCode = () => {
  if (emailIsCounting.value) return
  if (!emailAddr.value || !emailAddr.value.includes('@')) {
    emailTip.value = '请输入正确的邮箱'
    return
  }
  emailValid.value = true
  emailIsCounting.value = true
  emailCountdown.value = 60
  emailCodeTimer = setInterval(() => {
    emailCountdown.value--
    if (emailCountdown.value <= 0) {
      clearInterval(emailCodeTimer)
      emailIsCounting.value = false
      emailCountdown.value = 60
    }
  }, 1000)

  // ✅ 正确：POST + data（你的后端就是这个格式）
  request({
    url: API.USER_SEND_EMAIL_CODE,
    method: 'POST',
    data: { email: emailAddr.value }
  }).then(() => {
    emailTip.value = '验证码已发送至 ' + emailAddr.value
  }).catch(() => {
    emailTip.value = '发送失败，请稍后重试'
    clearInterval(emailCodeTimer)
    emailIsCounting.value = false
    emailCountdown.value = 60
  })
}

const doEmailCodeLogin = () => {
  if (!emailValid.value || emailCode.value.length < 4) return
  emailTip.value = ''
  isLoading.value = true
  request({
    url: API.USER_LOGIN_EMAIL,
    method: 'POST',
    data: { email: emailAddr.value, verifyCode: emailCode.value }
  }).then(res => {
    isLoading.value = false
    if (res.code === 200) {
      saveLoginState(res.data, '邮箱用户')
      showEmailPanel.value = false
      uni.showToast({ title: '登录成功', icon: 'success' })
      navigateAfterLogin(res.data)
    } else {
      emailTip.value = res.message || '登录失败'
    }
  }).catch(() => {
    isLoading.value = false
    emailTip.value = '网络错误，请重试'
  })
}

const doEmailPwdLogin = () => {
  if (!emailPwdAddr.value || !emailPwd.value) return
  emailTip.value = ''
  isLoading.value = true
  request({
    url: API.USER_LOGIN_EMAIL_PASSWORD,
    method: 'POST',
    data: { email: emailPwdAddr.value, password: emailPwd.value }
  }).then(res => {
    isLoading.value = false
    if (res.code === 200) {
      saveLoginState(res.data, '用户')
      showEmailPanel.value = false
      uni.showToast({ title: '登录成功', icon: 'success' })
      navigateAfterLogin(res.data)
    } else {
      emailTip.value = res.message || '登录失败'
    }
  }).catch(() => {
    isLoading.value = false
    emailTip.value = '网络错误，请重试'
  })
}

const sendRegEmailCode = () => {
  if (regEmailIsCounting.value) return
  if (!regEmailAddr.value || !regEmailAddr.value.includes('@')) {
    emailTip.value = '请输入正确的邮箱'
    return
  }
  regEmailValid.value = true
  regEmailIsCounting.value = true
  regEmailCountdown.value = 60
  regEmailCodeTimer = setInterval(() => {
    regEmailCountdown.value--
    if (regEmailCountdown.value <= 0) {
      clearInterval(regEmailCodeTimer)
      regEmailIsCounting.value = false
      regEmailCountdown.value = 60
    }
  }, 1000)

  // ✅ 正确：POST + data
  request({
    url: API.USER_SEND_EMAIL_CODE,
    method: 'POST',
    data: { email: regEmailAddr.value }
  }).then(() => {
    emailTip.value = '验证码已发送至 ' + regEmailAddr.value
  }).catch(() => {
    emailTip.value = '发送失败，请稍后重试'
    clearInterval(regEmailCodeTimer)
    regEmailIsCounting.value = false
    regEmailCountdown.value = 60
  })
}

const doEmailRegister = () => {
  if (!canEmailRegister.value) return
  emailTip.value = ''
  isLoading.value = true
  request({
    url: API.USER_REGISTER_EMAIL,
    method: 'POST',
    data: {
      email: regEmailAddr.value,
      password: regEmailPwd.value,
      verifyCode: regEmailCode.value
    }
  }).then(res => {
    isLoading.value = false
    if (res.code === 200) {
      uni.showToast({ title: '注册成功', icon: 'success' })
      // 切到密码登录并回填
      emailPwdAddr.value = regEmailAddr.value
      emailSubTab.value = 'password'
      emailTip.value = ''
    } else {
      emailTip.value = res.message || '注册失败'
    }
  }).catch(() => {
    isLoading.value = false
    emailTip.value = '网络错误，请重试'
  })
}




</script>

<style scoped>
	.other-icons {
	  display: flex;
	  justify-content: center;
	  gap: 48rpx;
	}
	
	.email-circle {
	  width: 76rpx;
	  height: 76rpx;
	  background: #ffffff;
	  border-radius: 50%;
	  display: flex;
	  align-items: center;
	  justify-content: center;
	  box-shadow: 0 2rpx 16rpx rgba(160, 120, 70, 0.08);
	  transition: transform 0.2s;
	}
	
	.email-circle:active {
	  transform: scale(0.93);
	}
	
	.email-icon-text {
	  font-size: 36rpx;
	  color: #FF8C42;
	}

/* ============================================================
   1. 页面 & 动态绒毛背景
   ============================================================ */
.container {
  height: 100vh;
  background: #FFC770;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 40rpx;
  overflow: hidden;
  position: relative;
  box-sizing: border-box;
}

.fluff-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80rpx);
  opacity: 0.6;
}

.orb-1 {
  width: 500rpx;
  height: 500rpx;
  background: radial-gradient(circle, #FFE4A0 0%, #FFD080 50%, transparent 70%);
  top: -10%;
  left: -10%;
  animation: orbFloat1 12s ease-in-out infinite;
}

.orb-2 {
  width: 400rpx;
  height: 400rpx;
  background: radial-gradient(circle, #FFB860 0%, #FF9D3D 50%, transparent 70%);
  top: 20%;
  right: -15%;
  animation: orbFloat2 10s ease-in-out infinite;
  opacity: 0.4;
}

.orb-3 {
  width: 450rpx;
  height: 350rpx;
  background: radial-gradient(circle, #FFDA90 0%, #FFC060 50%, transparent 70%);
  bottom: -5%;
  left: 20%;
  animation: orbFloat3 14s ease-in-out infinite;
  opacity: 0.5;
}

.orb-4 {
  width: 250rpx;
  height: 250rpx;
  background: radial-gradient(circle, #FFF0C0 0%, #FFD870 50%, transparent 70%);
  top: 45%;
  left: 60%;
  animation: orbFloat4 8s ease-in-out infinite;
  opacity: 0.45;
}

.orb-5 {
  width: 300rpx;
  height: 300rpx;
  background: radial-gradient(circle, #FF9040 0%, #FF7820 50%, transparent 70%);
  bottom: 15%;
  right: 5%;
  animation: orbFloat5 11s ease-in-out infinite;
  opacity: 0.25;
}

@keyframes orbFloat1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25%      { transform: translate(40rpx, 30rpx) scale(1.05); }
  50%      { transform: translate(-20rpx, 60rpx) scale(0.95); }
  75%      { transform: translate(30rpx, -20rpx) scale(1.02); }
}

@keyframes orbFloat2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%      { transform: translate(-50rpx, 40rpx) scale(1.08); }
  66%      { transform: translate(20rpx, -30rpx) scale(0.96); }
}

@keyframes orbFloat3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  30%      { transform: translate(60rpx, -30rpx) scale(1.04); }
  60%      { transform: translate(-40rpx, -50rpx) scale(0.97); }
}

@keyframes orbFloat4 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25%      { transform: translate(-30rpx, -40rpx) scale(1.1); }
  50%      { transform: translate(40rpx, 20rpx) scale(0.92); }
  75%      { transform: translate(-20rpx, 30rpx) scale(1.05); }
}

@keyframes orbFloat5 {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.25; }
  50%      { transform: translate(-30rpx, -40rpx) scale(1.12); opacity: 0.35; }
}

/* ============================================================
   2. 小鸡动画（等比缩小适配一屏）
   ============================================================ */
.character-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 12rpx;
  position: relative;
  z-index: 1;
}

.rooster-animation {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  animation: bounce 0.5s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8rpx); }
}

.rooster-body {
  position: relative;
  width: 100%;
  height: 100%;
}

.body {
  position: relative;
  width: 160rpx;
  height: 175rpx;
  margin: 0 auto;
}

.head {
  position: absolute;
  top: -8rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 72rpx;
  height: 72rpx;
  background: linear-gradient(135deg, #FF8C42 0%, #FFB347 100%);
  border-radius: 50%;
  z-index: 3;
}

.comb {
  position: absolute;
  top: -18rpx;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4rpx;
}

.comb-part {
  width: 16rpx;
  height: 24rpx;
  background-color: #FF6B35;
  border-radius: 50% 50% 40% 40%;
}

.comb-part:first-child { transform: rotate(-15deg); }
.comb-part:last-child { transform: rotate(15deg); }

.beak {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 12rpx;
  width: 30rpx;
  height: 18rpx;
  z-index: 4;
}

.beak-top {
  position: absolute;
  top: 0;
  left: 0;
  width: 30rpx;
  height: 12rpx;
  background: linear-gradient(135deg, #FFD93D 0%, #FFB347 100%);
  border-radius: 8rpx 8rpx 0 0;
}

.beak-bottom {
  position: absolute;
  bottom: 0;
  left: 4rpx;
  width: 22rpx;
  height: 8rpx;
  background: linear-gradient(135deg, #FFD93D 0%, #FFB347 100%);
  border-radius: 0 0 8rpx 8rpx;
}

.wattle {
  position: absolute;
  bottom: -8rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 16rpx;
  height: 16rpx;
  background-color: #FF6B35;
  border-radius: 50%;
}

.eyes {
  position: absolute;
  top: 26rpx;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 18rpx;
}

.eye {
  position: relative;
  width: 14rpx;
  height: 16rpx;
  background-color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.eyeball {
  width: 8rpx;
  height: 8rpx;
  background-color: #1a1a1a;
  border-radius: 50%;
}

.eye-shine {
  position: absolute;
  top: 2rpx;
  right: 2rpx;
  width: 3rpx;
  height: 3rpx;
  background-color: #ffffff;
  border-radius: 50%;
}

.blush {
  position: absolute;
  top: 44rpx;
  width: 14rpx;
  height: 10rpx;
  background-color: #FFB347;
  border-radius: 50%;
  opacity: 0.6;
}

.left-blush { left: 10rpx; }
.right-blush { right: 10rpx; }

.torso {
  position: absolute;
  top: 50rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 116rpx;
  height: 95rpx;
  background: linear-gradient(135deg, #FF8C42 0%, #FFD93D 100%);
  border-radius: 50% 50% 40% 40%;
  z-index: 2;
}

.belly {
  position: absolute;
  bottom: 12rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 80rpx;
  height: 44rpx;
  background: linear-gradient(135deg, #FFF3B0 0%, #FFE5D0 100%);
  border-radius: 50%;
}

.wings {
  position: absolute;
  top: 22rpx;
  left: 0;
  right: 0;
  width: 100%;
  height: 50rpx;
  pointer-events: none;
  z-index: 4;
}

.wing {
  position: absolute;
  width: 36rpx;
  height: 44rpx;
  background: linear-gradient(135deg, #FF8C42 0%, #FFB347 100%);
  border-radius: 40% 60% 50% 50%;
  transform-origin: top center;
}

.left-wing { left: -10rpx; transform: rotate(15deg); }
.right-wing { right: -10rpx; transform: rotate(-15deg); }

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
  width: 16rpx;
  height: 20rpx;
  background-color: #FF8C42;
  border-radius: 0 50% 50% 0;
}

.wing .feather:first-child { top: 8rpx; right: 4rpx; transform: rotate(10deg); }
.wing .feather:nth-child(2) { top: 18rpx; right: 0; transform: rotate(5deg); }
.wing .feather:nth-child(3) { top: 28rpx; right: 4rpx; transform: rotate(0deg); }

.tail {
  position: absolute;
  bottom: 14rpx;
  right: -14rpx;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4rpx;
  z-index: 1;
}

.tail.wagging { animation: wag 0.3s ease-in-out infinite alternate; }

@keyframes wag {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(15deg); }
}

.tail-feather {
  width: 32rpx;
  height: 9rpx;
  background: linear-gradient(135deg, #FFB347 0%, #FF8C42 100%);
  border-radius: 16rpx;
}

.tail-feather:nth-child(1) { width: 40rpx; transform: rotate(5deg); }
.tail-feather:nth-child(2) { width: 36rpx; transform: rotate(0deg); }
.tail-feather:nth-child(3) { width: 32rpx; transform: rotate(-5deg); }
.tail-feather:nth-child(4) { width: 28rpx; transform: rotate(-10deg); }

.legs {
  position: absolute;
  bottom: -10rpx;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 32rpx;
  z-index: 1;
}

.leg { position: relative; width: 26rpx; }

.left-leg.running { animation: runLeft 0.25s ease-in-out infinite alternate; }
.right-leg.running { animation: runRight 0.25s ease-in-out infinite alternate; }

@keyframes runLeft {
  0% { transform: translateY(0) rotate(0deg); }
  100% { transform: translateY(10rpx) rotate(-8deg); }
}

@keyframes runRight {
  0% { transform: translateY(0) rotate(0deg); }
  100% { transform: translateY(10rpx) rotate(8deg); }
}

.thigh {
  width: 22rpx;
  height: 22rpx;
  background: linear-gradient(135deg, #FF8C42 0%, #FFD93D 100%);
  border-radius: 50%;
}

.left-thigh { margin-left: 2rpx; }
.right-thigh { margin-right: 2rpx; }

.foot {
  position: absolute;
  bottom: -12rpx;
  display: flex;
  gap: 4rpx;
}

.left-foot { left: 0; }
.right-foot { right: 0; }

.toe {
  width: 9rpx;
  height: 14rpx;
  background: linear-gradient(135deg, #FFD93D 0%, #FFB347 100%);
  border-radius: 0 0 5rpx 5rpx;
}

.sweat {
  position: absolute;
  top: 8rpx;
  right: -8rpx;
  width: 44rpx;
  height: 44rpx;
  z-index: 5;
}

.sweat-drop {
  position: absolute;
  font-size: 16rpx;
  animation: fall 0.8s ease-in infinite;
}

.drop1 { top: 0; right: 0; animation-delay: 0s; }
.drop2 { top: 10rpx; right: 8rpx; animation-delay: 0.3s; font-size: 14rpx; }
.drop3 { top: 20rpx; right: 0; animation-delay: 0.6s; font-size: 12rpx; }

@keyframes fall {
  0% { opacity: 0; transform: translateY(-8rpx); }
  50% { opacity: 1; }
  100% { opacity: 0; transform: translateY(22rpx); }
}

.speed-lines {
  position: absolute;
  left: -28rpx;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  z-index: 5;
}

.speed-line {
  width: 28rpx;
  height: 3rpx;
  background-color: rgba(255, 255, 255, 0.6);
  border-radius: 2rpx;
  animation: speed 0.5s linear infinite;
}

.speed-line:nth-child(1) { animation-delay: 0s; }
.speed-line:nth-child(2) { width: 18rpx; animation-delay: 0.2s; }
.speed-line:nth-child(3) { width: 12rpx; animation-delay: 0.4s; }

@keyframes speed {
  0% { opacity: 0; transform: translateX(0); }
  50% { opacity: 1; }
  100% { opacity: 0; transform: translateX(-22rpx); }
}

/* ============================================================
   3. 鼓励语 & Logo
   ============================================================ */
.encourage-text {
  margin-top: 8rpx;
  text-align: center;
}

.encourage-msg {
  display: inline-block;
  font-size: 22rpx;
  color: #7A5C30;
  background-color: rgba(255, 255, 255, 0.45);
  border: 1rpx solid rgba(255, 255, 255, 0.5);
  padding: 8rpx 24rpx;
  border-radius: 32rpx;
  animation: fadeInOut 3s ease-in-out infinite;
}

@keyframes fadeInOut {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}

.logo-area {
  text-align: center;
  margin-bottom: 24rpx;
  position: relative;
  z-index: 1;
}

.app-name {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #5C3A10;
  margin-bottom: 6rpx;
  letter-spacing: 4rpx;
  text-shadow: 0 2rpx 8rpx rgba(255, 180, 60, 0.3);
}

.slogan {
  display: block;
  font-size: 24rpx;
  color: rgba(92, 58, 16, 0.6);
}

/* ============================================================
   4. 登录按钮区
   ============================================================ */
.login-area {
  width: 100%;
  margin-bottom: 20rpx;
  position: relative;
  z-index: 1;
}

.login-btn {
  width: 100%;
  height: 80rpx;
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
  border: none;
  transition: all 0.2s ease;
}

.login-btn:active {
  transform: scale(0.97);
  opacity: 0.9;
}

.login-btn::after { border: none; }

.account-btn {
  background: linear-gradient(135deg, #FF8C42 0%, #FFAB73 100%);
  color: #ffffff;
  box-shadow: 0 6rpx 20rpx rgba(255, 140, 66, 0.25);
}

.phone-btn {
  background-color: #ffffff;
  color: #5C4033;
  border: 1rpx solid rgba(180, 140, 100, 0.12);
  box-shadow: 0 2rpx 12rpx rgba(160, 120, 70, 0.06);
}

.btn-icon {
  font-size: 32rpx;
  margin-right: 12rpx;
}

.btn-text {
  font-size: 30rpx;
  font-weight: 500;
}

.agreement {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 12rpx;
}

.agreement-text {
  font-size: 22rpx;
  color: rgba(92, 58, 16, 0.45);
  margin-left: 10rpx;
}

/* ============================================================
   5. 其他登录方式
   ============================================================ */
.other-section {
  width: 100%;
  position: relative;
  z-index: 1;
  margin-bottom: 20rpx;
}

.other-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
}

.div-line {
  flex: 1;
  height: 1rpx;
  background: rgba(92, 58, 16, 0.1);
}

.div-text {
  font-size: 22rpx;
  color: rgba(92, 58, 16, 0.35);
  margin: 0 24rpx;
}

.wechat-circle {
  width: 76rpx;
  height: 76rpx;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 16rpx rgba(160, 120, 70, 0.08);
  transition: transform 0.2s;
}

.wechat-circle:active {
  transform: scale(0.93);
}

.wechat-icon {
  font-size: 32rpx;
  color: #07C160;
  font-weight: 700;
}

/* ============================================================
   6. 面板通用样式
   ============================================================ */
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

.panel-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40rpx;
  position: relative;
}

.panel-chicken {
  width: 100rpx;
  height: 90rpx;
  position: relative;
  margin-bottom: 16rpx;
}

.pc-body {
  width: 76rpx;
  height: 72rpx;
  background: linear-gradient(135deg, #FFD93D 0%, #FFB347 100%);
  border-radius: 50% 50% 45% 45%;
  position: absolute;
  top: 12rpx;
  left: 12rpx;
  animation: panelChickenBounce 2s ease-in-out infinite;
  box-shadow: 0 6rpx 18rpx rgba(255, 140, 66, 0.25);
}

@keyframes panelChickenBounce {
  0%, 100% { transform: translateY(0) rotate(-3deg); }
  50% { transform: translateY(-8rpx) rotate(3deg); }
}

.pc-body::before {
  content: '';
  position: absolute;
  top: -14rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 7rpx solid transparent;
  border-right: 7rpx solid transparent;
  border-bottom: 14rpx solid #FF6B35;
}

.pc-eye {
  position: absolute;
  width: 8rpx;
  height: 8rpx;
  background: #333;
  border-radius: 50%;
  top: 32rpx;
  z-index: 2;
  animation: chickenBlink 3s ease-in-out infinite;
}

.pc-eye.pce-left { left: 32rpx; }
.pc-eye.pce-right { right: 32rpx; }

@keyframes chickenBlink {
  0%, 42%, 46%, 100% { transform: scaleY(1); }
  44% { transform: scaleY(0.08); }
}

.pc-beak {
  position: absolute;
  bottom: 28rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8rpx solid transparent;
  border-right: 8rpx solid transparent;
  border-top: 12rpx solid #FF6B35;
  z-index: 2;
}

.pc-wing {
  position: absolute;
  width: 18rpx;
  height: 22rpx;
  background: #FFB347;
  border-radius: 50%;
  top: 36rpx;
  z-index: 1;
}

.pc-wing.pcw-left {
  left: 8rpx;
  transform: rotate(-25deg);
  animation: wingFlapLeft 1.5s ease-in-out infinite;
}

.pc-wing.pcw-right {
  right: 8rpx;
  transform: rotate(25deg);
  animation: wingFlapRight 1.5s ease-in-out infinite;
}

@keyframes wingFlapLeft {
  0%, 100% { transform: rotate(-25deg); }
  50% { transform: rotate(-40deg); }
}

@keyframes wingFlapRight {
  0%, 100% { transform: rotate(25deg); }
  50% { transform: rotate(40deg); }
}

.panel-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #5C4033;
  margin-bottom: 6rpx;
}

.panel-subtitle {
  font-size: 24rpx;
  color: #B8956A;
}

.panel-close {
  position: absolute;
  top: 0;
  right: 0;
  width: 52rpx;
  height: 52rpx;
  background: rgba(255, 140, 66, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-icon {
  font-size: 22rpx;
  color: #FF8C42;
  font-weight: bold;
}

.panel-body {
  margin-bottom: 32rpx;
}

.input-group {
  display: flex;
  align-items: center;
  background-color: #FFF8F0;
  border: 2rpx solid transparent;
  border-radius: 18rpx;
  padding: 20rpx 26rpx;
  margin-bottom: 20rpx;
  transition: all 0.3s ease;
}

.input-group.input-focus {
  background-color: #FFFFFF;
  border-color: #FF8C42;
  box-shadow: 0 4rpx 16rpx rgba(255, 140, 66, 0.12);
  transform: translateY(-2rpx);
}

.input-prefix {
  font-size: 28rpx;
  color: #FF8C42;
  font-weight: 600;
  margin-right: 16rpx;
}

.phone-input {
  flex: 1;
  font-size: 30rpx;
  color: #5C4033;
  height: 44rpx;
  line-height: 44rpx;
}

.code-input {
  flex: 1;
  font-size: 30rpx;
  color: #5C4033;
  height: 44rpx;
  line-height: 44rpx;
}

.input-placeholder {
  color: #C8B89A;
  font-size: 28rpx;
}

.input-clear {
  width: 40rpx;
  height: 40rpx;
  background: rgba(255, 140, 66, 0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 14rpx;
}

.clear-icon {
  font-size: 18rpx;
  color: #FF8C42;
}

.code-group {
  padding-right: 16rpx;
}

.code-btn {
  padding: 14rpx 20rpx;
  border-radius: 14rpx;
  background-color: #FFE5D0;
  margin-left: 14rpx;
  transition: all 0.3s ease;
}

.code-btn.code-ready {
  background: linear-gradient(135deg, #FF8C42 0%, #FFD93D 100%);
}

.code-btn.code-counting {
  background-color: #F0E8DC;
}

.code-btn-text {
  font-size: 22rpx;
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

.panel-tip {
  text-align: center;
  margin-top: 6rpx;
  animation: tipFadeIn 0.3s ease;
}

@keyframes tipFadeIn {
  from { opacity: 0; transform: translateY(-5rpx); }
  to { opacity: 1; transform: translateY(0); }
}

.tip-text {
  font-size: 22rpx;
  color: #FF8C42;
}

.panel-footer {
  padding: 0 10rpx;
}

.phone-login-btn {
  width: 100%;
  height: 88rpx;
  border-radius: 44rpx;
  background: linear-gradient(135deg, #FFE5D0 0%, #FFF3B0 100%);
  color: #C8B89A;
  font-size: 30rpx;
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

/* ============================================================
   7. 账号密码面板扩展样式
   ============================================================ */
.sub-tabs {
  display: flex;
  background: #FFF3E0;
  border-radius: 14rpx;
  padding: 4rpx;
  margin: 0 10rpx 24rpx;
}

.sub-tab {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  border-radius: 12rpx;
  font-size: 26rpx;
  color: #B8956A;
  transition: all 0.25s ease;
}

.sub-tab.active {
  background: #FFFFFF;
  color: #5C4033;
  font-weight: 600;
  box-shadow: 0 2rpx 10rpx rgba(160, 120, 70, 0.08);
}

.pwd-toggle {
  margin-left: 14rpx;
  padding: 4rpx 8rpx;
  flex-shrink: 0;
}

.pwd-toggle-text {
  font-size: 28rpx;
}

.username-status {
  width: 36rpx;
  height: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 12rpx;
  flex-shrink: 0;
}

.username-status.ok {
  background: rgba(76, 175, 80, 0.1);
  border-radius: 50%;
}

.username-status.no {
  background: rgba(244, 67, 54, 0.1);
  border-radius: 50%;
}

.status-icon {
  font-size: 20rpx;
  font-weight: bold;
}

.username-status.ok .status-icon { color: #4CAF50; }
.username-status.no .status-icon { color: #F44336; }

.status-spinner {
  width: 22rpx;
  height: 22rpx;
  border: 3rpx solid rgba(255, 140, 66, 0.2);
  border-top-color: #FF8C42;
  border-radius: 50%;
  animation: statusSpin 0.8s linear infinite;
}

@keyframes statusSpin {
  to { transform: rotate(360deg); }
}

.field-hint {
  margin: -12rpx 0 12rpx 8rpx;
}

.hint-red {
  font-size: 20rpx;
  color: #F44336;
}
</style>
