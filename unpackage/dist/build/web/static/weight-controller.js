class WeightController {
    constructor() {
        this.debug = true;
    }

    log(...args) {
        if (this.debug) console.log('[WeightController]', ...args);
    }

    /**
     * 记录体重
     * @param {number} weight - 体重值
     */
    async recordWeight(weight) {
        this.log('开始记录体重:', weight);
        
        try {
            // 1. 点击"记录体重"按钮
            const recordBtn = this.findElementByText('记录体重');
            if (!recordBtn) throw new Error('找不到记录体重按钮');
            
            this.triggerClick(recordBtn);
            await this.wait(500);
            
            // 2. 输入体重
            const weightInput = document.querySelector('input[type="number"], input[placeholder*="体重"]');
            if (!weightInput) throw new Error('找不到体重输入框');
            
            this.setValue(weightInput, weight);
            await this.wait(300);
            
            // 3. 点击保存
            const saveBtn = this.findElementByText('保存');
            if (!saveBtn) throw new Error('找不到保存按钮');
            
            this.triggerClick(saveBtn);
            await this.wait(1000);
            
            this.log('体重记录成功:', weight);
            return { success: true, weight };
            
        } catch (error) {
            this.log('记录失败:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * 修改体重记录
     * @param {number} index - 记录索引（0开始）
     * @param {number} newWeight - 新体重值
     */
    async editWeight(index, newWeight) {
        this.log('开始修改第', index + 1, '条记录为:', newWeight);
        
        try {
            // 1. 找到所有编辑按钮
            const editBtns = document.querySelectorAll('.edit-btn, [class*="edit"]');
            if (index >= editBtns.length) {
                throw new Error('记录索引超出范围');
            }
            
            // 2. 点击编辑
            this.triggerClick(editBtns[index]);
            await this.wait(500);
            
            // 3. 清空并输入新体重
            const weightInput = document.querySelector('.uni-popup input, .popup input, input[type="number"]');
            if (!weightInput) throw new Error('找不到体重输入框');
            
            this.setValue(weightInput, newWeight);
            await this.wait(300);
            
            // 4. 点击保存
            const saveBtn = this.findElementByText('保存');
            if (!saveBtn) throw new Error('找不到保存按钮');
            
            this.triggerClick(saveBtn);
            await this.wait(1000);
            
            this.log('体重修改成功:', newWeight);
            return { success: true, index, weight: newWeight };
            
        } catch (error) {
            this.log('修改失败:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * 获取当前体重数据
     */
    getWeightData() {
        const data = {
            current: null,
            target: null,
            records: []
        };
        
        // 获取当前体重
        const currentEl = document.querySelector('.current-weight, [class*="current"]');
        if (currentEl) {
            data.current = this.extractNumber(currentEl.textContent);
        }
        
        // 获取目标体重
        const targetEl = document.querySelector('.target-weight, [class*="target"]');
        if (targetEl) {
            data.target = this.extractNumber(targetEl.textContent);
        }
        
        // 获取历史记录
        const recordEls = document.querySelectorAll('.weight-record, [class*="record-item"]');
        recordEls.forEach(el => {
            const text = el.textContent;
            const match = text.match(/(\d{2}-\d{2}).*?(\d+(?:\.\d+)?)\s*kg/);
            if (match) {
                data.records.push({
                    date: match[1],
                    weight: parseFloat(match[2])
                });
            }
        });
        
        return data;
    }

    // ========== 工具方法 ==========

    /**
     * 通过文本查找元素
     */
    findElementByText(text) {
        const allElements = document.querySelectorAll('*');
        for (let el of allElements) {
            if (el.textContent && el.textContent.trim() === text) {
                return el;
            }
        }
        return null;
    }

    /**
     * 触发点击（兼容 uni-app）
     */
    triggerClick(element) {
        // 触发 click 事件
        element.click();
        
        // 触发 tap 事件（uni-app 常用）
        const tapEvent = new Event('tap', { bubbles: true });
        element.dispatchEvent(tapEvent);
    }

    /**
     * 设置输入框值
     */
    setValue(input, value) {
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    /**
     * 等待
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 提取数字
     */
    extractNumber(text) {
        const match = text.match(/(\d+(?:\.\d+)?)/);
        return match ? parseFloat(match[1]) : null;
    }
}

// 导出
window.WeightController = WeightController;
