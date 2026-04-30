import { API_BASE_URL } from '../config'

// 是否正在刷新token
let isRefreshing = false
// 等待队列
let failedQueue = []

// 处理等待队列
const processQueue = (error, token = null) => {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error)
    } else {
      promise.resolve(token)
    }
  })
  failedQueue = []
}

/**
 * 构建请求 URL（处理 GET 请求 query string）
 */
const buildRequestUrl = (url, method, data) => {
  let requestUrl = API_BASE_URL + url
  if (method === 'GET' && data && Object.keys(data).length > 0) {
    const queryParams = []
    for (const key in data) {
      if (data[key] !== null && data[key] !== undefined) {
        queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
      }
    }
    if (queryParams.length > 0) {
      const separator = requestUrl.includes('?') ? '&' : '?'
      requestUrl += separator + queryParams.join('&')
    }
  }
  return requestUrl
}

/**
 * 请求拦截器
 * 支持自动刷新token、统一错误处理
 */
const request = (options) => {
  return new Promise((resolve, reject) => {
    // 获取用户 token
    let token = uni.getStorageSync('token')
    let userId = uni.getStorageSync('userId')
    
    // 请求头配置
    const header = {
      'Content-Type': 'application/json',
      ...options.header
    }
    
    // 添加 token
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }
    
    // 添加用户ID（可选，用于后端日志）
    if (userId) {
      header['X-User-Id'] = userId
    }
    
    const method = options.method || 'GET'
    const requestUrl = buildRequestUrl(options.url, method, options.data)
    const requestData = method === 'GET' ? undefined : options.data
    
    // GET 请求不需要 Content-Type: application/json
    if (method === 'GET') {
      delete header['Content-Type']
    }
    
    uni.request({
      url: requestUrl,
      method: method,
      data: requestData,
      header: header,
      timeout: options.timeout || 30000, // 30秒超时
      success: (res) => {
        console.log(`【${options.method || 'GET'}】${options.url}`, res.data)
        
        // HTTP 状态码 401 - token 过期或无效
        if (res.statusCode === 401) {
          const originalRequest = options
          
          // 不在刷新token时再次刷新
          if (originalRequest.url === '/api/user/refresh-token') {
            // 刷新token失败，跳转登录
            uni.clearStorageSync()
            uni.navigateTo({ url: '/pages/login/login' })
            reject({ code: 401, message: '登录已过期，请重新登录' })
            return
          }
          
          // 如果正在刷新token，将请求加入队列
          if (isRefreshing) {
            failedQueue.push({ resolve, reject, options: originalRequest })
            return
          }
          
          isRefreshing = true
          
          // 尝试刷新token
          refreshToken().then(newToken => {
            // 更新请求头的token
            header['Authorization'] = `Bearer ${newToken}`
            
            // 重试原请求
            const retryMethod = originalRequest.method || 'GET'
            const retryUrl = buildRequestUrl(originalRequest.url, retryMethod, originalRequest.data)
            const retryData = retryMethod === 'GET' ? undefined : originalRequest.data
            
            uni.request({
              url: retryUrl,
              method: retryMethod,
              data: retryData,
              header: header,
              success: (retryRes) => {
                if (retryRes.data.code === 200) {
                  resolve(retryRes.data)
                } else {
                  reject(retryRes.data)
                }
              },
              fail: (err) => {
                reject(err)
              }
            })
            
            // 处理等待队列
            processQueue(null, newToken)
            isRefreshing = false
          }).catch(err => {
            // 刷新token失败，清除缓存并跳转登录
            uni.clearStorageSync()
            processQueue(err, null)
            isRefreshing = false
            uni.navigateTo({ url: '/pages/login/login' })
            reject({ code: 401, message: '登录已过期，请重新登录' })
          })
          return
        }
        
        // HTTP 状态码 200 - 正常响应
        if (res.statusCode === 200) {
          const data = res.data
          
          // 业务状态码 200 - 成功
          if (data.code === 200) {
            resolve(data)
          } 
          // 业务状态码 401 - token 过期（兜底处理）
          else if (data.code === 401) {
            uni.clearStorageSync()
            uni.navigateTo({ url: '/pages/login/login' })
            reject({ code: 401, message: data.message || '请重新登录' })
          }
          // 业务状态码 403 - 无权限
          else if (data.code === 403) {
            uni.showToast({
              title: data.message || '暂无权限',
              icon: 'none',
              duration: 2000
            })
            reject(data)
          }
          // 其他业务错误
          else {
            // 不显示部分错误（静默失败）
            const silentErrors = ['/api/diet/today', '/api/weight/stats']
            const isSilent = silentErrors.some(err => options.url.includes(err))
            
            if (!isSilent) {
              uni.showToast({
                title: data.message || '请求失败',
                icon: 'none',
                duration: 2000
              })
            }
            reject(data)
          }
        } 
        // HTTP 状态码 404 - 接口不存在
        else if (res.statusCode === 404) {
          console.error(`接口不存在: ${options.url}`)
          uni.showToast({
            title: '接口不存在',
            icon: 'none',
            duration: 2000
          })
          reject({ code: 404, message: '接口不存在' })
        }
        // HTTP 状态码 500 - 服务器错误
        else if (res.statusCode >= 500) {
          uni.showToast({
            title: '服务器错误，请稍后重试',
            icon: 'none',
            duration: 2000
          })
          reject({ code: res.statusCode, message: '服务器错误' })
        }
        // 其他 HTTP 错误
        else {
          uni.showToast({
            title: `网络错误 ${res.statusCode}`,
            icon: 'none',
            duration: 2000
          })
          reject({ code: res.statusCode, message: '网络错误' })
        }
      },
      fail: (err) => {
        console.error(`【${options.method || 'GET'}】${options.url} 请求失败`, err)
        
        // 网络连接失败
        if (err.errMsg && err.errMsg.includes('timeout')) {
          uni.showToast({
            title: '请求超时，请重试',
            icon: 'none',
            duration: 2000
          })
        } else if (err.errMsg && err.errMsg.includes('fail')) {
          uni.showToast({
            title: '网络连接失败',
            icon: 'none',
            duration: 2000
          })
        } else {
          uni.showToast({
            title: err.errMsg || '请求失败',
            icon: 'none',
            duration: 2000
          })
        }
        reject(err)
      }
    })
  })
}

/**
 * 刷新 token
 */
const refreshToken = () => {
  return new Promise((resolve, reject) => {
    const oldToken = uni.getStorageSync('token')
    const userId = uni.getStorageSync('userId')
    
    if (!oldToken || !userId) {
      reject(new Error('无有效token'))
      return
    }
    
    uni.request({
      url: API_BASE_URL + '/api/user/refresh-token',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${oldToken}`
      },
      data: {
        userId: userId
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          const newToken = res.data.data?.token
          if (newToken) {
            // 保存新token
            uni.setStorageSync('token', newToken)
            resolve(newToken)
          } else {
            reject(new Error('刷新token失败'))
          }
        } else {
          reject(new Error('刷新token失败'))
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

/**
 * 上传文件（特殊处理）
 */
export const uploadFile = (filePath, options = {}) => {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    
    uni.uploadFile({
      url: API_BASE_URL + (options.url || '/api/upload'),
      filePath: filePath,
      name: options.name || 'file',
      header: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        try {
          const data = JSON.parse(res.data)
          if (data.code === 200) {
            resolve(data)
          } else {
            reject(data)
          }
        } catch (e) {
          reject({ code: 500, message: '解析响应失败' })
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

/**
 * 清除登录状态
 */
export const clearLoginState = () => {
  uni.clearStorageSync()
  uni.navigateTo({ url: '/pages/login/login' })
}

export default request