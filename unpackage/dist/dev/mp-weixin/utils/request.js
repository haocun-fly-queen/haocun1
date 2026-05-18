"use strict";
const common_vendor = require("../common/vendor.js");
const config = require("../config.js");
let isRefreshing = false;
let failedQueue = [];
const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};
const buildRequestUrl = (url, method, data) => {
  let requestUrl = config.API_BASE_URL + url;
  if (method === "GET" && data && Object.keys(data).length > 0) {
    const queryParams = [];
    for (const key in data) {
      if (data[key] !== null && data[key] !== void 0) {
        queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`);
      }
    }
    if (queryParams.length > 0) {
      const separator = requestUrl.includes("?") ? "&" : "?";
      requestUrl += separator + queryParams.join("&");
    }
  }
  return requestUrl;
};
const request = (options) => {
  return new Promise((resolve, reject) => {
    let token = common_vendor.index.getStorageSync("token");
    let userId = common_vendor.index.getStorageSync("userId");
    const header = {
      "Content-Type": "application/json",
      ...options.header
    };
    if (token) {
      header["Authorization"] = `Bearer ${token}`;
    }
    if (userId) {
      header["X-User-Id"] = userId;
    }
    const method = options.method || "GET";
    const requestUrl = buildRequestUrl(options.url, method, options.data);
    const requestData = method === "GET" ? void 0 : options.data;
    if (method === "GET") {
      delete header["Content-Type"];
    }
    common_vendor.index.request({
      url: requestUrl,
      method,
      data: requestData,
      header,
      timeout: options.timeout || 3e4,
      // 30秒超时
      success: (res) => {
        if (res.statusCode === 401) {
          const originalRequest = options;
          if (originalRequest.url === "/api/user/refresh-token") {
            common_vendor.index.clearStorageSync();
            common_vendor.index.navigateTo({ url: "/pages/login/login" });
            reject({ code: 401, message: "登录已过期，请重新登录" });
            return;
          }
          if (isRefreshing) {
            failedQueue.push({ resolve, reject, options: originalRequest });
            return;
          }
          isRefreshing = true;
          refreshToken().then((newToken) => {
            header["Authorization"] = `Bearer ${newToken}`;
            const retryMethod = originalRequest.method || "GET";
            const retryUrl = buildRequestUrl(originalRequest.url, retryMethod, originalRequest.data);
            const retryData = retryMethod === "GET" ? void 0 : originalRequest.data;
            common_vendor.index.request({
              url: retryUrl,
              method: retryMethod,
              data: retryData,
              header,
              success: (retryRes) => {
                if (retryRes.data.code === 200) {
                  resolve(retryRes.data);
                } else {
                  reject(retryRes.data);
                }
              },
              fail: (err) => {
                reject(err);
              }
            });
            processQueue(null, newToken);
            isRefreshing = false;
          }).catch((err) => {
            common_vendor.index.clearStorageSync();
            processQueue(err, null);
            isRefreshing = false;
            common_vendor.index.navigateTo({ url: "/pages/login/login" });
            reject({ code: 401, message: "登录已过期，请重新登录" });
          });
          return;
        }
        if (res.statusCode === 200) {
          const data = res.data;
          if (data.code === 200) {
            resolve(data);
          } else if (data.code === 401) {
            common_vendor.index.clearStorageSync();
            common_vendor.index.navigateTo({ url: "/pages/login/login" });
            reject({ code: 401, message: data.message || "请重新登录" });
          } else if (data.code === 403) {
            common_vendor.index.showToast({
              title: data.message || "暂无权限",
              icon: "none",
              duration: 2e3
            });
            reject(data);
          } else {
            const silentErrors = ["/api/diet/today", "/api/weight/stats"];
            const isSilent = silentErrors.some((err) => options.url.includes(err));
            if (!isSilent) {
              common_vendor.index.showToast({
                title: data.message || "请求失败",
                icon: "none",
                duration: 2e3
              });
            }
            reject(data);
          }
        } else if (res.statusCode === 404) {
          common_vendor.index.__f__("error", "at utils/request.js:186", `接口不存在: ${options.url}`);
          common_vendor.index.showToast({
            title: "接口不存在",
            icon: "none",
            duration: 2e3
          });
          reject({ code: 404, message: "接口不存在" });
        } else if (res.statusCode >= 500) {
          common_vendor.index.showToast({
            title: "服务器错误，请稍后重试",
            icon: "none",
            duration: 2e3
          });
          reject({ code: res.statusCode, message: "服务器错误" });
        } else {
          common_vendor.index.showToast({
            title: `网络错误 ${res.statusCode}`,
            icon: "none",
            duration: 2e3
          });
          reject({ code: res.statusCode, message: "网络错误" });
        }
      },
      fail: (err) => {
        common_vendor.index.__f__("error", "at utils/request.js:214", `【${options.method || "GET"}】${options.url} 请求失败`, err);
        if (err.errMsg && err.errMsg.includes("timeout")) {
          common_vendor.index.showToast({
            title: "请求超时，请重试",
            icon: "none",
            duration: 2e3
          });
        } else if (err.errMsg && err.errMsg.includes("fail")) {
          common_vendor.index.showToast({
            title: "网络连接失败",
            icon: "none",
            duration: 2e3
          });
        } else {
          common_vendor.index.showToast({
            title: err.errMsg || "请求失败",
            icon: "none",
            duration: 2e3
          });
        }
        reject(err);
      }
    });
  });
};
const refreshToken = () => {
  return new Promise((resolve, reject) => {
    const oldToken = common_vendor.index.getStorageSync("token");
    const userId = common_vendor.index.getStorageSync("userId");
    if (!oldToken || !userId) {
      reject(new Error("无有效token"));
      return;
    }
    common_vendor.index.request({
      url: config.API_BASE_URL + "/api/user/refresh-token",
      method: "POST",
      header: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${oldToken}`
      },
      data: {
        userId
      },
      success: (res) => {
        var _a;
        if (res.statusCode === 200 && res.data.code === 200) {
          const newToken = (_a = res.data.data) == null ? void 0 : _a.token;
          if (newToken) {
            common_vendor.index.setStorageSync("token", newToken);
            resolve(newToken);
          } else {
            reject(new Error("刷新token失败"));
          }
        } else {
          reject(new Error("刷新token失败"));
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
};
exports.request = request;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/request.js.map
