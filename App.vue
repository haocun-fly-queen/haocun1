<script>
	export default {
		onLaunch: function() {
			
			// #ifdef H5
			// H5 环境下读取 URL 参数自动登录（用于 OpenClaw iframe 嵌入）
			try {
				const params = new URLSearchParams(window.location.search)
				const userId = params.get('userId')
				if (userId) {
					uni.setStorageSync('userId', userId)
					console.log('[OpenClaw] 自动登录 userId:', userId)
				}
			} catch (e) {
				console.error('读取 URL 参数失败', e)
			}
			// #endif
			
			// #ifdef MP-WEIXIN
			// 初始化微信云开发（用于头像云存储等功能）
			// 请替换为你的云开发环境 ID，在「微信开发者工具 → 云开发控制台」中查看
			if (wx.cloud) {
				wx.cloud.init({
					env: 'cloudbase-d0gaofkdc3e053fea',
					traceUser: true
				})
			} else {
				console.warn('当前基础库版本不支持云开发')
			}
			// #endif
		},
		onShow: function() {
		},
		onHide: function() {
		}
	}
</script>

<style>
	/* 引入橙黄小鸡主题 */
	@import url('/static/chicken-theme.css');

	/* 全局基础样式 */
	page {
		background-color: #FFF8F0;
		color: #5C4033;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
	}

	/* 全局滚动条美化 */
	::-webkit-scrollbar {
		width: 6rpx;
	}
	::-webkit-scrollbar-track {
		background: #FFF8F0;
	}
	::-webkit-scrollbar-thumb {
		background: #FFD93D;
		border-radius: 3rpx;
	}

	/* 按钮重置 */
	button::after {
		border: none;
	}

	/* 通用容器 */
	.container {
		min-height: 100vh;
		background-color: #FFF8F0;
		padding-bottom: 40rpx;
	}

	/* 通用卡片入场动画 */
	.card-animate {
		opacity: 0;
		animation: fadeInUp 0.5s ease forwards;
	}

	/* 依次延迟的卡片 */
	.card-animate-1 { animation-delay: 0.1s; }
	.card-animate-2 { animation-delay: 0.2s; }
	.card-animate-3 { animation-delay: 0.3s; }
	.card-animate-4 { animation-delay: 0.4s; }
	.card-animate-5 { animation-delay: 0.5s; }
	.card-animate-6 { animation-delay: 0.6s; }
</style>
