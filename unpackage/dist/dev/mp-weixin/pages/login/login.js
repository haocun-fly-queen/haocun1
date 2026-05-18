"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const config = require("../../config.js");
const _sfc_main = {
  __name: "login",
  setup(__props) {
    const agreeChecked = common_vendor.ref(false);
    const isLoading = common_vendor.ref(false);
    const isRunning = common_vendor.ref(true);
    const encourageMsg = common_vendor.ref(" 叽叽叽！一起健康生活吧！🐥");
    const msgIndex = common_vendor.ref(0);
    const encourageMessages = [
      " 叽叽叽！今天也要好好吃饭哦！🐥",
      "🌽 三分练！七分吃！",
      " 健康饮食，快乐每一天！",
      "✨ 每天进步一点点！",
      " 向着健康目标前进！",
      " 你是最棒的！",
      " 加油！小鸡仔陪你一起自律！"
    ];
    let interval = null;
    const showPhonePanel = common_vendor.ref(false);
    const phoneNumber = common_vendor.ref("");
    const verifyCode = common_vendor.ref("");
    const phoneFocus = common_vendor.ref(false);
    const codeFocus = common_vendor.ref(false);
    const phoneValid = common_vendor.ref(false);
    const panelTip = common_vendor.ref("");
    const isCounting = common_vendor.ref(false);
    const countDown = common_vendor.ref(60);
    let codeTimer = null;
    const showAccountPanel = common_vendor.ref(false);
    const accountSubTab = common_vendor.ref("login");
    const accountTip = common_vendor.ref("");
    const loginUsername = common_vendor.ref("");
    const loginPassword = common_vendor.ref("");
    const luFocus = common_vendor.ref(false);
    const lpFocus = common_vendor.ref(false);
    const showLoginPwd = common_vendor.ref(false);
    const regUsername = common_vendor.ref("");
    const regPassword = common_vendor.ref("");
    const regConfirmPwd = common_vendor.ref("");
    const regPhone = common_vendor.ref("");
    const regCode = common_vendor.ref("");
    const ruFocus = common_vendor.ref(false);
    const rpFocus = common_vendor.ref(false);
    const rcpFocus = common_vendor.ref(false);
    const rphFocus = common_vendor.ref(false);
    const rcFocus = common_vendor.ref(false);
    const showRegPwd = common_vendor.ref(false);
    const showRegConfirmPwd = common_vendor.ref(false);
    const usernameStatus = common_vendor.ref(null);
    const regPhoneValid = common_vendor.ref(false);
    const regIsCounting = common_vendor.ref(false);
    const regCountdown = common_vendor.ref(60);
    let regCodeTimer = null;
    let checkUsernameTimer = null;
    const showEmailPanel = common_vendor.ref(false);
    const emailSubTab = common_vendor.ref("code");
    const emailTip = common_vendor.ref("");
    const emailAddr = common_vendor.ref("");
    const emailCode = common_vendor.ref("");
    const emFocus = common_vendor.ref(false);
    const emcFocus = common_vendor.ref(false);
    const emailValid = common_vendor.ref(false);
    const emailIsCounting = common_vendor.ref(false);
    const emailCountdown = common_vendor.ref(60);
    let emailCodeTimer = null;
    const emailPwdAddr = common_vendor.ref("");
    const emailPwd = common_vendor.ref("");
    const empFocus = common_vendor.ref(false);
    const emppFocus = common_vendor.ref(false);
    const showEmailPwd = common_vendor.ref(false);
    const regEmailAddr = common_vendor.ref("");
    const regEmailPwd = common_vendor.ref("");
    const regEmailCode = common_vendor.ref("");
    const emrFocus = common_vendor.ref(false);
    const emrpFocus = common_vendor.ref(false);
    const emrcFocus = common_vendor.ref(false);
    const showRegEmailPwd = common_vendor.ref(false);
    const regEmailValid = common_vendor.ref(false);
    const regEmailIsCounting = common_vendor.ref(false);
    const regEmailCountdown = common_vendor.ref(60);
    let regEmailCodeTimer = null;
    const canEmailRegister = common_vendor.computed(() => {
      return regEmailAddr.value.includes("@") && regEmailPwd.value.length >= 6 && regEmailCode.value.length >= 4;
    });
    const toggleAgree = () => {
      agreeChecked.value = !agreeChecked.value;
    };
    const checkNeedProfile = (user) => {
      const defaultNicknames = ["微信用户", "手机用户", "用户"];
      const isDefaultNickname = defaultNicknames.includes(user.nickname);
      const hasNoHealthData = !user.height || !user.currentWeight || user.height === 0 || user.currentWeight === 0;
      return isDefaultNickname || hasNoHealthData;
    };
    const navigateAfterLogin = (user) => {
      const needProfile = checkNeedProfile(user);
      if (needProfile) {
        common_vendor.index.reLaunch({ url: "/pages/profile/profile" });
      } else {
        common_vendor.index.reLaunch({ url: "/pages/home/home" });
      }
    };
    const clearLoginState = () => {
      common_vendor.index.removeStorageSync("token");
      common_vendor.index.removeStorageSync("userId");
      common_vendor.index.removeStorageSync("userInfo");
      common_vendor.index.removeStorageSync("userProfile");
      common_vendor.index.removeStorageSync("isLogin");
    };
    const saveLoginState = (user, defaultName) => {
      if (user.token)
        common_vendor.index.setStorageSync("token", user.token);
      let avatarUrl = user.avatarUrl || "/static/haocun.jpg";
      if (avatarUrl && avatarUrl.startsWith("http://")) {
        avatarUrl = avatarUrl.replace("http://", "https://");
      }
      common_vendor.index.setStorageSync("userId", user.id);
      common_vendor.index.setStorageSync("userInfo", {
        id: user.id,
        nickname: user.nickname || defaultName,
        avatar: avatarUrl,
        height: user.height,
        currentWeight: user.currentWeight
      });
      common_vendor.index.setStorageSync("isLogin", true);
    };
    const handleWechatLogin = () => {
      if (!agreeChecked.value) {
        common_vendor.index.showToast({ title: "请先同意用户协议", icon: "none" });
        return;
      }
      clearLoginState();
      isLoading.value = true;
      common_vendor.index.showLoading({ title: "登录中...", mask: true });
      common_vendor.index.login({
        provider: "weixin",
        success: (loginRes) => {
          const code = loginRes.code;
          silentLogin(code);
        },
        fail: (err) => {
          common_vendor.index.hideLoading();
          isLoading.value = false;
          common_vendor.index.__f__("error", "at pages/login/login.vue:791", "微信登录失败", err);
          if (err.errMsg && err.errMsg.includes("需要重新登录")) {
            common_vendor.index.showModal({
              title: "提示",
              content: "微信登录状态已过期，请重新授权",
              showCancel: false,
              success: () => {
                clearLoginState();
                common_vendor.index.reLaunch({ url: "/pages/login/login" });
              }
            });
          } else {
            common_vendor.index.showToast({ title: "微信登录失败，请重试", icon: "none" });
          }
        }
      });
    };
    const silentLogin = (code) => {
      common_vendor.index.showLoading({ title: "登录中...", mask: true });
      utils_request.request({
        url: config.API.USER_LOGIN_WECHAT,
        method: "POST",
        data: { code, silent: true }
      }).then((res) => {
        common_vendor.index.hideLoading();
        isLoading.value = false;
        if (res.code === 200) {
          saveLoginState(res.data, "微信用户");
          common_vendor.index.showToast({ title: "登录成功", icon: "success" });
          navigateAfterLogin(res.data);
        } else {
          common_vendor.index.showToast({ title: res.message || "登录失败", icon: "none" });
        }
      }).catch((err) => {
        common_vendor.index.hideLoading();
        isLoading.value = false;
        common_vendor.index.__f__("error", "at pages/login/login.vue:828", "静默登录失败", err);
        common_vendor.index.showToast({ title: "登录失败，请重试", icon: "none" });
      });
    };
    const handlePhoneLogin = () => {
      if (!agreeChecked.value) {
        common_vendor.index.showToast({ title: "请先同意用户协议", icon: "none" });
        return;
      }
      phoneNumber.value = "";
      verifyCode.value = "";
      phoneValid.value = false;
      panelTip.value = "";
      showPhonePanel.value = true;
    };
    const closePhonePanel = () => {
      showPhonePanel.value = false;
      phoneFocus.value = false;
      codeFocus.value = false;
    };
    const onPhoneInput = () => {
      phoneValid.value = /^1[3-9]\d{9}$/.test(phoneNumber.value);
      if (panelTip.value)
        panelTip.value = "";
    };
    const sendCode = () => {
      if (isCounting.value)
        return;
      if (!phoneValid.value) {
        panelTip.value = "请输入正确的11位手机号";
        return;
      }
      isCounting.value = true;
      countDown.value = 60;
      codeTimer = setInterval(() => {
        countDown.value--;
        if (countDown.value <= 0) {
          clearInterval(codeTimer);
          isCounting.value = false;
          countDown.value = 60;
        }
      }, 1e3);
      utils_request.request({
        url: config.API.USER_SEND_CODE,
        method: "POST",
        data: { phone: phoneNumber.value }
      }).then(() => {
        panelTip.value = "验证码已发送至 " + phoneNumber.value.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
      }).catch(() => {
        panelTip.value = "验证码发送失败，请稍后重试";
        clearInterval(codeTimer);
        isCounting.value = false;
        countDown.value = 60;
      });
    };
    const doPhoneLogin = () => {
      if (!phoneValid.value) {
        panelTip.value = "请输入正确的手机号";
        return;
      }
      if (verifyCode.value.length < 4) {
        panelTip.value = "请输入验证码";
        return;
      }
      isLoading.value = true;
      utils_request.request({
        url: config.API.USER_LOGIN_PHONE,
        method: "POST",
        data: { phone: phoneNumber.value, verifyCode: verifyCode.value }
      }).then((res) => {
        isLoading.value = false;
        if (res.code === 200) {
          saveLoginState(res.data, "手机用户");
          showPhonePanel.value = false;
          common_vendor.index.showToast({ title: "登录成功", icon: "success" });
          navigateAfterLogin(res.data);
        } else {
          panelTip.value = res.message || "登录失败，请重试";
        }
      }).catch(() => {
        isLoading.value = false;
        panelTip.value = "网络错误，请检查网络后重试";
      });
    };
    const handleAccountLogin = () => {
      if (!agreeChecked.value) {
        common_vendor.index.showToast({ title: "请先同意用户协议", icon: "none" });
        return;
      }
      loginUsername.value = "";
      loginPassword.value = "";
      showLoginPwd.value = false;
      accountSubTab.value = "login";
      accountTip.value = "";
      regUsername.value = "";
      regPassword.value = "";
      regConfirmPwd.value = "";
      regPhone.value = "";
      regCode.value = "";
      showRegPwd.value = false;
      showRegConfirmPwd.value = false;
      usernameStatus.value = null;
      regPhoneValid.value = false;
      if (regCodeTimer) {
        clearInterval(regCodeTimer);
        regCodeTimer = null;
      }
      regIsCounting.value = false;
      regCountdown.value = 60;
      showAccountPanel.value = true;
    };
    const closeAccountPanel = () => {
      showAccountPanel.value = false;
    };
    const switchSubTab = (tab) => {
      accountSubTab.value = tab;
      accountTip.value = "";
    };
    const doAccountLogin = () => {
      if (!loginUsername.value || !loginPassword.value)
        return;
      accountTip.value = "";
      isLoading.value = true;
      utils_request.request({
        url: config.API.USER_LOGIN_PASSWORD,
        method: "POST",
        data: { username: loginUsername.value, password: loginPassword.value }
      }).then((res) => {
        isLoading.value = false;
        if (res.code === 200) {
          saveLoginState(res.data, "用户");
          showAccountPanel.value = false;
          common_vendor.index.showToast({ title: "登录成功", icon: "success" });
          navigateAfterLogin(res.data);
        } else {
          accountTip.value = res.message || "登录失败，请检查账号密码";
        }
      }).catch(() => {
        isLoading.value = false;
        accountTip.value = "网络错误，请重试";
      });
    };
    const onRegUsernameInput = () => {
      if (checkUsernameTimer)
        clearTimeout(checkUsernameTimer);
      usernameStatus.value = null;
      if (!regUsername.value || regUsername.value.length < 3)
        return;
      usernameStatus.value = "checking";
      checkUsernameTimer = setTimeout(() => {
        utils_request.request({
          url: config.API.USER_CHECK_USERNAME,
          method: "GET",
          data: { username: regUsername.value }
        }).then((res) => {
          if (res.code === 200) {
            usernameStatus.value = res.data.available ? "available" : "taken";
          }
        }).catch(() => {
          usernameStatus.value = null;
        });
      }, 500);
    };
    const onRegPhoneInput = () => {
      regPhoneValid.value = /^1[3-9]\d{9}$/.test(regPhone.value);
    };
    const sendRegCode = () => {
      if (regIsCounting.value || !regPhoneValid.value)
        return;
      regIsCounting.value = true;
      regCountdown.value = 60;
      regCodeTimer = setInterval(() => {
        regCountdown.value--;
        if (regCountdown.value <= 0) {
          clearInterval(regCodeTimer);
          regIsCounting.value = false;
          regCountdown.value = 60;
        }
      }, 1e3);
      utils_request.request({
        url: config.API.USER_SEND_CODE,
        method: "POST",
        data: { phone: regPhone.value }
      }).then(() => {
        accountTip.value = "验证码已发送至 " + regPhone.value.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
      }).catch(() => {
        accountTip.value = "验证码发送失败，请稍后重试";
        clearInterval(regCodeTimer);
        regIsCounting.value = false;
        regCountdown.value = 60;
      });
    };
    const canRegister = common_vendor.computed(() => {
      return regUsername.value.length >= 3 && usernameStatus.value === "available" && regPassword.value.length >= 6 && regPassword.value === regConfirmPwd.value && regPhoneValid.value && regCode.value.length >= 4;
    });
    const doRegister = () => {
      if (!canRegister.value)
        return;
      accountTip.value = "";
      isLoading.value = true;
      utils_request.request({
        url: config.API.USER_REGISTER,
        method: "POST",
        data: {
          username: regUsername.value,
          password: regPassword.value,
          phone: regPhone.value,
          verifyCode: regCode.value
        }
      }).then((res) => {
        isLoading.value = false;
        if (res.code === 200) {
          common_vendor.index.showToast({ title: "注册成功", icon: "success" });
          loginUsername.value = regUsername.value;
          accountSubTab.value = "login";
          accountTip.value = "";
          regUsername.value = "";
          regPassword.value = "";
          regConfirmPwd.value = "";
          regPhone.value = "";
          regCode.value = "";
          usernameStatus.value = null;
          regPhoneValid.value = false;
          if (regCodeTimer) {
            clearInterval(regCodeTimer);
            regCodeTimer = null;
          }
          regIsCounting.value = false;
          regCountdown.value = 60;
        } else {
          accountTip.value = res.message || "注册失败";
        }
      }).catch(() => {
        isLoading.value = false;
        accountTip.value = "网络错误，请重试";
      });
    };
    common_vendor.onMounted(() => {
      interval = setInterval(() => {
        msgIndex.value = (msgIndex.value + 1) % encourageMessages.length;
        encourageMsg.value = encourageMessages[msgIndex.value];
      }, 3e3);
    });
    common_vendor.onUnmounted(() => {
      if (interval)
        clearInterval(interval);
      if (codeTimer)
        clearInterval(codeTimer);
      if (regCodeTimer)
        clearInterval(regCodeTimer);
      if (checkUsernameTimer)
        clearTimeout(checkUsernameTimer);
      if (emailCodeTimer)
        clearInterval(emailCodeTimer);
      if (regEmailCodeTimer)
        clearInterval(regEmailCodeTimer);
    });
    common_vendor.watch(showPhonePanel, (val) => {
      if (val) {
        setTimeout(() => {
          phoneFocus.value = true;
        }, 300);
      }
    });
    common_vendor.watch(showAccountPanel, (val) => {
      if (val) {
        setTimeout(() => {
          luFocus.value = true;
        }, 300);
      }
    });
    const handleEmailLogin = () => {
      if (!agreeChecked.value) {
        common_vendor.index.showToast({ title: "请先同意用户协议", icon: "none" });
        return;
      }
      emailAddr.value = "";
      emailCode.value = "";
      emailPwdAddr.value = "";
      emailPwd.value = "";
      regEmailAddr.value = "";
      regEmailPwd.value = "";
      regEmailCode.value = "";
      emailSubTab.value = "code";
      emailTip.value = "";
      showEmailPwd.value = false;
      showRegEmailPwd.value = false;
      emailValid.value = false;
      regEmailValid.value = false;
      emailIsCounting.value = false;
      regEmailIsCounting.value = false;
      showEmailPanel.value = true;
    };
    const closeEmailPanel = () => {
      showEmailPanel.value = false;
    };
    const sendEmailCode = () => {
      if (emailIsCounting.value)
        return;
      if (!emailAddr.value || !emailAddr.value.includes("@")) {
        emailTip.value = "请输入正确的邮箱";
        return;
      }
      emailValid.value = true;
      emailIsCounting.value = true;
      emailCountdown.value = 60;
      emailCodeTimer = setInterval(() => {
        emailCountdown.value--;
        if (emailCountdown.value <= 0) {
          clearInterval(emailCodeTimer);
          emailIsCounting.value = false;
          emailCountdown.value = 60;
        }
      }, 1e3);
      utils_request.request({
        url: config.API.USER_SEND_EMAIL_CODE,
        method: "POST",
        data: { email: emailAddr.value }
      }).then(() => {
        emailTip.value = "验证码已发送至 " + emailAddr.value;
      }).catch(() => {
        emailTip.value = "发送失败，请稍后重试";
        clearInterval(emailCodeTimer);
        emailIsCounting.value = false;
        emailCountdown.value = 60;
      });
    };
    const doEmailCodeLogin = () => {
      if (!emailValid.value || emailCode.value.length < 4)
        return;
      emailTip.value = "";
      isLoading.value = true;
      utils_request.request({
        url: config.API.USER_LOGIN_EMAIL,
        method: "POST",
        data: { email: emailAddr.value, verifyCode: emailCode.value }
      }).then((res) => {
        isLoading.value = false;
        if (res.code === 200) {
          saveLoginState(res.data, "邮箱用户");
          showEmailPanel.value = false;
          common_vendor.index.showToast({ title: "登录成功", icon: "success" });
          navigateAfterLogin(res.data);
        } else {
          emailTip.value = res.message || "登录失败";
        }
      }).catch(() => {
        isLoading.value = false;
        emailTip.value = "网络错误，请重试";
      });
    };
    const doEmailPwdLogin = () => {
      if (!emailPwdAddr.value || !emailPwd.value)
        return;
      emailTip.value = "";
      isLoading.value = true;
      utils_request.request({
        url: config.API.USER_LOGIN_EMAIL_PASSWORD,
        method: "POST",
        data: { email: emailPwdAddr.value, password: emailPwd.value }
      }).then((res) => {
        isLoading.value = false;
        if (res.code === 200) {
          saveLoginState(res.data, "用户");
          showEmailPanel.value = false;
          common_vendor.index.showToast({ title: "登录成功", icon: "success" });
          navigateAfterLogin(res.data);
        } else {
          emailTip.value = res.message || "登录失败";
        }
      }).catch(() => {
        isLoading.value = false;
        emailTip.value = "网络错误，请重试";
      });
    };
    const sendRegEmailCode = () => {
      if (regEmailIsCounting.value)
        return;
      if (!regEmailAddr.value || !regEmailAddr.value.includes("@")) {
        emailTip.value = "请输入正确的邮箱";
        return;
      }
      regEmailValid.value = true;
      regEmailIsCounting.value = true;
      regEmailCountdown.value = 60;
      regEmailCodeTimer = setInterval(() => {
        regEmailCountdown.value--;
        if (regEmailCountdown.value <= 0) {
          clearInterval(regEmailCodeTimer);
          regEmailIsCounting.value = false;
          regEmailCountdown.value = 60;
        }
      }, 1e3);
      utils_request.request({
        url: config.API.USER_SEND_EMAIL_CODE,
        method: "POST",
        data: { email: regEmailAddr.value }
      }).then(() => {
        emailTip.value = "验证码已发送至 " + regEmailAddr.value;
      }).catch(() => {
        emailTip.value = "发送失败，请稍后重试";
        clearInterval(regEmailCodeTimer);
        regEmailIsCounting.value = false;
        regEmailCountdown.value = 60;
      });
    };
    const doEmailRegister = () => {
      if (!canEmailRegister.value)
        return;
      emailTip.value = "";
      isLoading.value = true;
      utils_request.request({
        url: config.API.USER_REGISTER_EMAIL,
        method: "POST",
        data: {
          email: regEmailAddr.value,
          password: regEmailPwd.value,
          verifyCode: regEmailCode.value
        }
      }).then((res) => {
        isLoading.value = false;
        if (res.code === 200) {
          common_vendor.index.showToast({ title: "注册成功", icon: "success" });
          emailPwdAddr.value = regEmailAddr.value;
          emailSubTab.value = "password";
          emailTip.value = "";
        } else {
          emailTip.value = res.message || "注册失败";
        }
      }).catch(() => {
        isLoading.value = false;
        emailTip.value = "网络错误，请重试";
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: isRunning.value ? 1 : "",
        b: isRunning.value ? 1 : "",
        c: isRunning.value ? 1 : "",
        d: isRunning.value ? 1 : "",
        e: isRunning.value ? 1 : "",
        f: isRunning.value
      }, isRunning.value ? {} : {}, {
        g: isRunning.value
      }, isRunning.value ? {} : {}, {
        h: isRunning.value ? 1 : "",
        i: isRunning.value
      }, isRunning.value ? {
        j: common_vendor.t(encourageMsg.value)
      } : {}, {
        k: common_vendor.o(handleAccountLogin, "10"),
        l: isLoading.value,
        m: common_vendor.t(isLoading.value ? "登录中..." : "手机号登录"),
        n: common_vendor.o(handlePhoneLogin, "c2"),
        o: isLoading.value,
        p: agreeChecked.value,
        q: common_vendor.o(toggleAgree, "76"),
        r: common_vendor.o(handleWechatLogin, "79"),
        s: common_vendor.o(handleEmailLogin, "87"),
        t: showPhonePanel.value
      }, showPhonePanel.value ? common_vendor.e({
        v: common_vendor.o(closePhonePanel, "c1"),
        w: common_vendor.o(($event) => phoneFocus.value = true, "5f"),
        x: common_vendor.o(($event) => phoneFocus.value = false, "39"),
        y: common_vendor.o([($event) => phoneNumber.value = $event.detail.value, onPhoneInput], "68"),
        z: phoneNumber.value,
        A: phoneNumber.value
      }, phoneNumber.value ? {
        B: common_vendor.o(($event) => phoneNumber.value = "", "e0")
      } : {}, {
        C: phoneFocus.value ? 1 : "",
        D: common_vendor.o(($event) => codeFocus.value = true, "a9"),
        E: common_vendor.o(($event) => codeFocus.value = false, "18"),
        F: verifyCode.value,
        G: common_vendor.o(($event) => verifyCode.value = $event.detail.value, "70"),
        H: common_vendor.t(isCounting.value ? countDown.value + "s后重发" : "获取验证码"),
        I: isCounting.value ? 1 : "",
        J: phoneValid.value && !isCounting.value ? 1 : "",
        K: common_vendor.o(sendCode, "81"),
        L: codeFocus.value ? 1 : "",
        M: panelTip.value
      }, panelTip.value ? {
        N: common_vendor.t(panelTip.value)
      } : {}, {
        O: !isLoading.value
      }, !isLoading.value ? {} : {}, {
        P: phoneValid.value && verifyCode.value.length >= 4 ? 1 : "",
        Q: !phoneValid.value || verifyCode.value.length < 4 || isLoading.value,
        R: common_vendor.o(doPhoneLogin, "1f"),
        S: common_vendor.o(() => {
        }, "42"),
        T: common_vendor.o(closePhonePanel, "d6")
      }) : {}, {
        U: showAccountPanel.value
      }, showAccountPanel.value ? common_vendor.e({
        V: common_vendor.o(closeAccountPanel, "c8"),
        W: accountSubTab.value === "login" ? 1 : "",
        X: common_vendor.o(($event) => switchSubTab("login"), "65"),
        Y: accountSubTab.value === "register" ? 1 : "",
        Z: common_vendor.o(($event) => switchSubTab("register"), "1d"),
        aa: accountSubTab.value === "login"
      }, accountSubTab.value === "login" ? common_vendor.e({
        ab: common_vendor.o(($event) => luFocus.value = true, "71"),
        ac: common_vendor.o(($event) => luFocus.value = false, "bd"),
        ad: loginUsername.value,
        ae: common_vendor.o(($event) => loginUsername.value = $event.detail.value, "f3"),
        af: loginUsername.value
      }, loginUsername.value ? {
        ag: common_vendor.o(($event) => loginUsername.value = "", "ad")
      } : {}, {
        ah: luFocus.value ? 1 : "",
        ai: !showLoginPwd.value,
        aj: common_vendor.o(($event) => lpFocus.value = true, "48"),
        ak: common_vendor.o(($event) => lpFocus.value = false, "53"),
        al: loginPassword.value,
        am: common_vendor.o(($event) => loginPassword.value = $event.detail.value, "16"),
        an: common_vendor.t(showLoginPwd.value ? "🙈" : "👁"),
        ao: common_vendor.o(($event) => showLoginPwd.value = !showLoginPwd.value, "b5"),
        ap: lpFocus.value ? 1 : "",
        aq: accountTip.value
      }, accountTip.value ? {
        ar: common_vendor.t(accountTip.value)
      } : {}) : {}, {
        as: accountSubTab.value === "register"
      }, accountSubTab.value === "register" ? common_vendor.e({
        at: common_vendor.o(($event) => ruFocus.value = true, "16"),
        av: common_vendor.o(($event) => ruFocus.value = false, "91"),
        aw: common_vendor.o([($event) => regUsername.value = $event.detail.value, onRegUsernameInput], "d8"),
        ax: regUsername.value,
        ay: usernameStatus.value === "checking"
      }, usernameStatus.value === "checking" ? {} : usernameStatus.value === "available" ? {} : usernameStatus.value === "taken" ? {} : {}, {
        az: usernameStatus.value === "available",
        aA: usernameStatus.value === "taken",
        aB: ruFocus.value ? 1 : "",
        aC: usernameStatus.value === "taken"
      }, usernameStatus.value === "taken" ? {} : {}, {
        aD: !showRegPwd.value,
        aE: common_vendor.o(($event) => rpFocus.value = true, "b4"),
        aF: common_vendor.o(($event) => rpFocus.value = false, "e7"),
        aG: regPassword.value,
        aH: common_vendor.o(($event) => regPassword.value = $event.detail.value, "be"),
        aI: common_vendor.t(showRegPwd.value ? "🙈" : "👁"),
        aJ: common_vendor.o(($event) => showRegPwd.value = !showRegPwd.value, "40"),
        aK: rpFocus.value ? 1 : "",
        aL: !showRegConfirmPwd.value,
        aM: common_vendor.o(($event) => rcpFocus.value = true, "da"),
        aN: common_vendor.o(($event) => rcpFocus.value = false, "eb"),
        aO: regConfirmPwd.value,
        aP: common_vendor.o(($event) => regConfirmPwd.value = $event.detail.value, "3c"),
        aQ: common_vendor.t(showRegConfirmPwd.value ? "🙈" : "👁"),
        aR: common_vendor.o(($event) => showRegConfirmPwd.value = !showRegConfirmPwd.value, "d6"),
        aS: rcpFocus.value ? 1 : "",
        aT: regConfirmPwd.value && regPassword.value !== regConfirmPwd.value
      }, regConfirmPwd.value && regPassword.value !== regConfirmPwd.value ? {} : {}, {
        aU: common_vendor.o(($event) => rphFocus.value = true, "67"),
        aV: common_vendor.o(($event) => rphFocus.value = false, "d0"),
        aW: common_vendor.o([($event) => regPhone.value = $event.detail.value, onRegPhoneInput], "98"),
        aX: regPhone.value,
        aY: rphFocus.value ? 1 : "",
        aZ: common_vendor.o(($event) => rcFocus.value = true, "b7"),
        ba: common_vendor.o(($event) => rcFocus.value = false, "5f"),
        bb: regCode.value,
        bc: common_vendor.o(($event) => regCode.value = $event.detail.value, "85"),
        bd: common_vendor.t(regIsCounting.value ? regCountdown.value + "s后重发" : "获取验证码"),
        be: regIsCounting.value ? 1 : "",
        bf: regPhoneValid.value && !regIsCounting.value ? 1 : "",
        bg: common_vendor.o(sendRegCode, "40"),
        bh: rcFocus.value ? 1 : "",
        bi: accountTip.value
      }, accountTip.value ? {
        bj: common_vendor.t(accountTip.value)
      } : {}) : {}, {
        bk: accountSubTab.value === "login"
      }, accountSubTab.value === "login" ? common_vendor.e({
        bl: !isLoading.value
      }, !isLoading.value ? {} : {}, {
        bm: loginUsername.value && loginPassword.value ? 1 : "",
        bn: !loginUsername.value || !loginPassword.value || isLoading.value,
        bo: common_vendor.o(doAccountLogin, "72")
      }) : common_vendor.e({
        bp: !isLoading.value
      }, !isLoading.value ? {} : {}, {
        bq: canRegister.value ? 1 : "",
        br: !canRegister.value || isLoading.value,
        bs: common_vendor.o(doRegister, "85")
      }), {
        bt: common_vendor.o(() => {
        }, "e5"),
        bv: common_vendor.o(closeAccountPanel, "4a")
      }) : {}, {
        bw: showEmailPanel.value
      }, showEmailPanel.value ? common_vendor.e({
        bx: common_vendor.o(closeEmailPanel, "22"),
        by: emailSubTab.value === "code" ? 1 : "",
        bz: common_vendor.o(($event) => {
          emailSubTab.value = "code";
          emailTip.value = "";
        }, "3d"),
        bA: emailSubTab.value === "password" ? 1 : "",
        bB: common_vendor.o(($event) => {
          emailSubTab.value = "password";
          emailTip.value = "";
        }, "b6"),
        bC: emailSubTab.value === "register" ? 1 : "",
        bD: common_vendor.o(($event) => {
          emailSubTab.value = "register";
          emailTip.value = "";
        }, "ce"),
        bE: emailSubTab.value === "code"
      }, emailSubTab.value === "code" ? common_vendor.e({
        bF: common_vendor.o(($event) => emFocus.value = true, "7e"),
        bG: common_vendor.o(($event) => emFocus.value = false, "75"),
        bH: emailAddr.value,
        bI: common_vendor.o(($event) => emailAddr.value = $event.detail.value, "fe"),
        bJ: emailAddr.value
      }, emailAddr.value ? {
        bK: common_vendor.o(($event) => emailAddr.value = "", "66")
      } : {}, {
        bL: emFocus.value ? 1 : "",
        bM: common_vendor.o(($event) => emcFocus.value = true, "b6"),
        bN: common_vendor.o(($event) => emcFocus.value = false, "31"),
        bO: emailCode.value,
        bP: common_vendor.o(($event) => emailCode.value = $event.detail.value, "23"),
        bQ: common_vendor.t(emailIsCounting.value ? emailCountdown.value + "s后重发" : "获取验证码"),
        bR: emailIsCounting.value ? 1 : "",
        bS: emailValid.value && !emailIsCounting.value ? 1 : "",
        bT: common_vendor.o(sendEmailCode, "de"),
        bU: emcFocus.value ? 1 : "",
        bV: emailTip.value
      }, emailTip.value ? {
        bW: common_vendor.t(emailTip.value)
      } : {}) : {}, {
        bX: emailSubTab.value === "password"
      }, emailSubTab.value === "password" ? common_vendor.e({
        bY: common_vendor.o(($event) => empFocus.value = true, "76"),
        bZ: common_vendor.o(($event) => empFocus.value = false, "9d"),
        ca: emailPwdAddr.value,
        cb: common_vendor.o(($event) => emailPwdAddr.value = $event.detail.value, "38"),
        cc: emailPwdAddr.value
      }, emailPwdAddr.value ? {
        cd: common_vendor.o(($event) => emailPwdAddr.value = "", "51")
      } : {}, {
        ce: empFocus.value ? 1 : "",
        cf: !showEmailPwd.value,
        cg: common_vendor.o(($event) => emppFocus.value = true, "ef"),
        ch: common_vendor.o(($event) => emppFocus.value = false, "1d"),
        ci: emailPwd.value,
        cj: common_vendor.o(($event) => emailPwd.value = $event.detail.value, "3f"),
        ck: common_vendor.t(showEmailPwd.value ? "🙈" : "👁"),
        cl: common_vendor.o(($event) => showEmailPwd.value = !showEmailPwd.value, "3c"),
        cm: emppFocus.value ? 1 : "",
        cn: emailTip.value
      }, emailTip.value ? {
        co: common_vendor.t(emailTip.value)
      } : {}) : {}, {
        cp: emailSubTab.value === "register"
      }, emailSubTab.value === "register" ? common_vendor.e({
        cq: common_vendor.o(($event) => emrFocus.value = true, "6e"),
        cr: common_vendor.o(($event) => emrFocus.value = false, "7c"),
        cs: regEmailAddr.value,
        ct: common_vendor.o(($event) => regEmailAddr.value = $event.detail.value, "b2"),
        cv: regEmailAddr.value
      }, regEmailAddr.value ? {
        cw: common_vendor.o(($event) => regEmailAddr.value = "", "14")
      } : {}, {
        cx: emrFocus.value ? 1 : "",
        cy: !showRegEmailPwd.value,
        cz: common_vendor.o(($event) => emrpFocus.value = true, "72"),
        cA: common_vendor.o(($event) => emrpFocus.value = false, "ea"),
        cB: regEmailPwd.value,
        cC: common_vendor.o(($event) => regEmailPwd.value = $event.detail.value, "f4"),
        cD: common_vendor.t(showRegEmailPwd.value ? "🙈" : "👁"),
        cE: common_vendor.o(($event) => showRegEmailPwd.value = !showRegEmailPwd.value, "26"),
        cF: emrpFocus.value ? 1 : "",
        cG: common_vendor.o(($event) => emrcFocus.value = true, "f0"),
        cH: common_vendor.o(($event) => emrcFocus.value = false, "04"),
        cI: regEmailCode.value,
        cJ: common_vendor.o(($event) => regEmailCode.value = $event.detail.value, "2c"),
        cK: common_vendor.t(regEmailIsCounting.value ? regEmailCountdown.value + "s后重发" : "获取验证码"),
        cL: regEmailIsCounting.value ? 1 : "",
        cM: regEmailValid.value && !regEmailIsCounting.value ? 1 : "",
        cN: common_vendor.o(sendRegEmailCode, "a4"),
        cO: emrcFocus.value ? 1 : "",
        cP: emailTip.value
      }, emailTip.value ? {
        cQ: common_vendor.t(emailTip.value)
      } : {}) : {}, {
        cR: emailSubTab.value === "code"
      }, emailSubTab.value === "code" ? common_vendor.e({
        cS: !isLoading.value
      }, !isLoading.value ? {} : {}, {
        cT: emailValid.value && emailCode.value.length >= 4 ? 1 : "",
        cU: !emailValid.value || emailCode.value.length < 4 || isLoading.value,
        cV: common_vendor.o(doEmailCodeLogin, "cf")
      }) : {}, {
        cW: emailSubTab.value === "password"
      }, emailSubTab.value === "password" ? common_vendor.e({
        cX: !isLoading.value
      }, !isLoading.value ? {} : {}, {
        cY: emailPwdAddr.value && emailPwd.value ? 1 : "",
        cZ: !emailPwdAddr.value || !emailPwd.value || isLoading.value,
        da: common_vendor.o(doEmailPwdLogin, "81")
      }) : {}, {
        db: emailSubTab.value === "register"
      }, emailSubTab.value === "register" ? common_vendor.e({
        dc: !isLoading.value
      }, !isLoading.value ? {} : {}, {
        dd: canEmailRegister.value ? 1 : "",
        de: !canEmailRegister.value || isLoading.value,
        df: common_vendor.o(doEmailRegister, "c2")
      }) : {}, {
        dg: common_vendor.o(() => {
        }, "13"),
        dh: common_vendor.o(closeEmailPanel, "06")
      }) : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-e4e4508d"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/login/login.js.map
