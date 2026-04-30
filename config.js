const env = {
    dev: {
        baseUrl: 'http://120.26.65.37:9050'
    },
    prod: {
        baseUrl: 'http://120.26.65.37:9050'
    }
}

const currentEnv = 'prod'

export const API_BASE_URL = env[currentEnv].baseUrl

export const API = {
    USER_LOGIN_WECHAT: '/api/user/login/wechat',
    USER_LOGIN_PHONE: '/api/user/login/phone',
    USER_SEND_CODE: '/api/user/send-code',
    USER_INFO: '/api/user',
    USER_PROFILE: '/api/user/{userId}/profile',
    USER_CALORIE_GOAL: '/api/user/{userId}/calorie-goal',
    
    FOOD_LIST: '/api/food/list',
    FOOD_SEARCH: '/api/food/search',
    FOOD_CATEGORY: '/api/food/category',
    FOOD_CATEGORIES: '/api/food/categories',
    FOOD_DETAIL: '/api/food',
    
    // 自定义食物
    FOOD_CUSTOM_LIST: '/api/food/custom/list',
    FOOD_CUSTOM_ADD: '/api/food/custom',
    FOOD_CUSTOM_DELETE: '/api/food/custom',
    
    DIET_RECORD: '/api/diet/record',
    DIET_RECORDS: '/api/diet/records',
    DIET_TODAY: '/api/diet/today',
    DIET_WEEKLY: '/api/diet/weekly',
    DIET_RECORD_DETAIL: '/api/diet/record',
    
    AI_RECOGNIZE: '/api/ai/recognize',
    AI_UPLOAD: '/api/upload',
	

	    AI_DIET_PLAN: '/api/ai/diet-plan',  // 新增：AI饮食规划
}

export const DEFAULT_AVATAR = '/static/default-avatar.png'
