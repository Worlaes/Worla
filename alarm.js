class AlarmClock {
    constructor() {
        this.alarms = []; // 存储所有闹钟的数组
        this.selectedAudio = null; // 用户选择的自定义铃声URL
        this.currentAudio = null; // 当前正在播放的铃声对象
        this.initUI(); // 初始化用户界面，包括样式和HTML结构
    }

    // 初始化用户界面，设置样式和HTML结构
    initUI() {
        const style = document.createElement('style');
        // 定义完整的CSS样式，用于控制界面外观和动画效果
        style.textContent = `
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; } /* 设置页面基础样式 */
            .settings-btn { position: fixed; bottom: 20px; left: 20px; background-color: #2196F3; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; z-index: 500; } /* 设置按钮样式 */
            .settings-btn:hover { background-color: #1976D2; } /* 设置按钮悬停效果 */
            .alarm-modal, .settings-modal, .alarm-list-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: none; justify-content: center; align-items: center; z-index: 1000; } /* 模态框样式 */
            .modal-content { background: white; padding: 2rem; border-radius: 8px; text-align: center; width: 400px; max-height: 80vh; overflow-y: auto; } /* 模态框内容样式 */
            .alarm-list-content { background: white; padding: 2rem; border-radius: 8px; width: 500px; max-height: 80vh; overflow-y: auto; } /* 闹钟列表模态框内容样式 */
            .time-input { width: 100%; padding: 12px; border: 2px solid #4CAF50; border-radius: 8px; font-size: 16px; margin: 10px 0; } /* 时间输入框样式 */
            .file-input { display: none; } /* 隐藏文件输入框 */
            .file-label { background-color: #2196F3; color: white; padding: 12px 24px; border-radius: 8px; cursor: pointer; transition: background-color 0.3s; display: inline-block; margin: 10px 0; } /* 文件选择标签样式 */
            .file-label:hover { background-color: #1976D2; } /* 文件选择标签悬停效果 */
            .add-btn { background-color: #4CAF50; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; transition: background-color 0.3s; margin-top: 10px; } /* 添加按钮样式 */
            .add-btn:hover { background-color: #45a049; } /* 添加按钮悬停效果 */
            .stop-btn, .close-btn { background-color: #ff4444; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; margin-top: 15px; } /* 停止和关闭按钮样式 */
            .alarm-list { list-style: none; padding: 0; margin: 0; } /* 闹钟列表样式 */
            .alarm-item { display: flex; justify-content: space-between; align-items: center; padding: 15px; margin: 10px 0; background-color: #f5f5f5; border-radius: 8px; animation: slideIn 0.3s ease-out; } /* 闹钟项样式 */
            .countdown { color: #ff5722; font-weight: bold; margin-left: 15px; } /* 倒计时文本样式 */
            .delete-btn { background-color: #ff4444; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; } /* 删除按钮样式 */
            .quick-btn { background-color: #ff9800; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; margin: 5px; } /* 快速设置按钮样式 */
            .quick-btn:hover { background-color: #f57c00; } /* 快速设置按钮悬停效果 */
            .note-input { width: 100%; padding: 10px; margin: 10px 0; border: 2px solid #ddd; border-radius: 5px; } /* 备注输入框样式 */
            @keyframes slideIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } } /* 闹钟项进入动画 */
            .active-alarm { background-color: #fff3e0; animation: pulse 1s infinite; } /* 激活状态闹钟样式 */
            @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.02); } 100% { transform: scale(1); } } /* 脉动动画 */
        `;
        document.head.appendChild(style);

        // 设置页面的HTML结构
        document.body.innerHTML = `
            <button class="settings-btn">设置闹钟</button>
            <div class="settings-modal" id="settingsModal">
                <div class="modal-content">
                    <h3>设置新闹钟</h3>
                    <input type="datetime-local" class="time-input" id="alarmTime">
                    <input type="text" class="note-input" id="alarmNote" placeholder="输入闹钟备注">
                    <input type="file" id="audioFile" accept="audio/*" class="file-input">
                    <label for="audioFile" class="file-label">选择自定义铃声</label>
                    <div>
                        <button class="quick-btn" data-minutes="15">15分钟</button>
                        <button class="quick-btn" data-minutes="30">30分钟</button>
                        <button class="quick-btn" data-minutes="60">1小时</button>
                    </div>
                    <button class="add-btn">添加闹钟</button>
                    <button class="close-btn">关闭</button>
                </div>
            </div>
            <div class="alarm-list-modal" id="alarmListModal">
                <div class="alarm-list-content">
                    <h3>闹钟列表</h3>
                    <ul class="alarm-list" id="alarmList"></ul>
                    <button class="close-btn">关闭</button>
                </div>
            </div>
        `;

        this.initTime(); // 初始化时间输入框为当前时间
        // 为按钮和输入框绑定事件监听器
        document.querySelector('.settings-btn').addEventListener('click', () => {
            this.showSettings(); // 点击设置按钮显示设置模态框
            if (this.alarms.length > 0) this.showAlarmList(); // 如果有闹钟，显示列表
        });
        document.querySelector('.add-btn').addEventListener('click', () => this.addAlarm()); // 点击添加按钮添加闹钟
        document.querySelector('#settingsModal .close-btn').addEventListener('click', () => this.hideSettings()); // 关闭设置模态框
        document.querySelector('#alarmListModal .close-btn').addEventListener('click', () => this.hideAlarmList()); // 关闭闹钟列表
        document.querySelectorAll('.quick-btn').forEach(btn => btn.addEventListener('click', () => this.quickSet(parseInt(btn.dataset.minutes)))); // 快速设置时间
        document.getElementById('audioFile').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.selectedAudio = URL.createObjectURL(file); // 用户选择音频文件后保存URL
        });
    }

    // 初始化时间输入框，设置为当前时间
    initTime() {
        const now = new Date();
        const pad = n => n.toString().padStart(2, '0'); // 补零函数
        const localTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
        document.getElementById('alarmTime').value = localTime;
    }

    // 显示设置闹钟的模态框
    showSettings() { 
        this.initTime(); // 每次打开时更新为当前时间
        document.getElementById('settingsModal').style.display = 'flex'; 
    }

    // 隐藏设置闹钟的模态框
    hideSettings() { 
        document.getElementById('settingsModal').style.display = 'none'; 
    }

    // 显示闹钟列表模态框
    showAlarmList() { 
        this.renderAlarms(); // 渲染当前闹钟列表
        document.getElementById('alarmListModal').style.display = 'flex'; 
    }

    // 隐藏闹钟列表模态框
    hideAlarmList() { 
        document.getElementById('alarmListModal').style.display = 'none'; 
    }

    // 快速设置闹钟时间（15分钟、30分钟或1小时后）
    quickSet(minutes) {
        const now = new Date();
        now.setMinutes(now.getMinutes() + minutes); // 当前时间加上指定分钟数
        const pad = n => n.toString().padStart(2, '0');
        document.getElementById('alarmTime').value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    }

    // 添加新闹钟到列表
    addAlarm() {
        const timeInput = document.getElementById('alarmTime');
        const noteInput = document.getElementById('alarmNote');
        const selectedTime = new Date(timeInput.value);
        if (!timeInput.value) return alert('请选择有效时间'); // 检查是否选择了时间
        if (selectedTime < new Date()) return alert('不能设置过去的时间'); // 防止设置过去的时间
        if (this.alarms.some(alarm => alarm.time.getTime() === selectedTime.getTime())) return alert('该时间已有闹钟设置'); // 防止重复设置

        // 创建新闹钟对象
        const newAlarm = { 
            time: selectedTime, 
            id: Date.now(), // 使用时间戳作为唯一ID
            note: noteInput.value || '', // 备注可选
            active: true, // 是否激活
            interval: null, // 倒计时定时器
            audio: null, // 铃声对象
            modal: null // 闹钟触发时的模态框
        };
        this.alarms.push(newAlarm); // 添加到闹钟数组
        this.startCountdown(newAlarm); // 开始倒计时
        this.hideSettings(); // 关闭设置窗口
        noteInput.value = ''; // 清空备注输入框
        this.showAlarmList(); // 显示更新后的闹钟列表
    }

    // 渲染闹钟列表到页面
    renderAlarms() {
        document.getElementById('alarmList').innerHTML = this.alarms.map(alarm => `
            <li class="alarm-item ${alarm.active ? 'active-alarm' : ''}" data-id="${alarm.id}">
                <div>
                    <span>${this.formatTime(alarm.time)}</span> <!-- 显示闹钟时间 -->
                    ${alarm.note ? `<span style="color: #666; margin-left: 10px;">(${alarm.note})</span>` : ''} <!-- 显示备注 -->
                    ${alarm.active ? `<span class="countdown"></span>` : ''} <!-- 显示倒计时 -->
                </div>
                <button class="delete-btn" onclick="document.alarmClock.deleteAlarm(${alarm.id})">删除</button> <!-- 删除按钮 -->
            </li>
        `).join('');
    }

    // 格式化时间为中文显示格式
    formatTime(date) {
        return date.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    // 删除指定ID的闹钟
    deleteAlarm(id) {
        const alarm = this.alarms.find(a => a.id === id);
        if (alarm) {
            clearInterval(alarm.interval); // 清除倒计时定时器
            if (alarm.audio) { alarm.audio.pause(); alarm.audio = null; } // 停止并清除铃声
            if (alarm.modal) alarm.modal.remove(); // 移除触发时的模态框
            this.alarms = this.alarms.filter(a => a.id !== id); // 从数组中移除该闹钟
            this.renderAlarms(); // 重新渲染列表
            if (this.alarms.length === 0) this.hideAlarmList(); // 如果没有闹钟，隐藏列表
        }
    }

    // 启动指定闹钟的倒计时
    startCountdown(alarm) {
        alarm.interval = setInterval(() => {
            const now = new Date();
            if (alarm.time <= now) { // 如果到达设定时间
                clearInterval(alarm.interval); // 停止倒计时
                this.triggerAlarm(alarm); // 触发闹钟
            }
            this.updateCountdown(alarm); // 更新倒计时显示
        }, 1000); // 每秒更新一次
    }

    // 更新指定闹钟的倒计时显示
    updateCountdown(alarm) {
        const elem = document.querySelector(`[data-id="${alarm.id}"] .countdown`);
        if (elem) {
            const diff = alarm.time - new Date(); // 计算剩余时间
            if (diff <= 0) return elem.textContent = '时间到！'; // 如果时间到，显示提示
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            elem.textContent = `${days}天 ${hours}时 ${minutes}分 ${seconds}秒`; // 显示剩余时间
        }
    }

    // 触发闹钟，播放铃声并显示提示模态框
    triggerAlarm(alarm) {
        if (this.currentAudio) { this.currentAudio.pause(); this.currentAudio.currentTime = 0; this.currentAudio = null; } // 停止当前播放的铃声
        const audio = new Audio(this.selectedAudio || 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg'); // 使用自定义铃声或默认铃声
        audio.loop = true; // 循环播放
        audio.play().catch(err => console.error('音频播放失败:', err)); // 播放音频，捕获错误
        alarm.audio = audio; // 保存音频对象
        this.currentAudio = audio; // 更新当前播放的音频

        // 创建闹钟触发时的模态框
        const modal = document.createElement('div');
        modal.className = 'alarm-modal';
        modal.innerHTML = `<div class="modal-content"><h3>⏰ 时间到！${alarm.note ? '<br>' + alarm.note : ''}</h3><button class="stop-btn" onclick="document.alarmClock.stopAlarm(${alarm.id})">停止闹钟</button></div>`;
        document.body.appendChild(modal);
        alarm.modal = modal; // 保存模态框引用
    }

    // 停止指定ID的闹钟
    stopAlarm(id) {
        const alarm = this.alarms.find(a => a.id === id);
        if (alarm) {
            alarm.active = false; // 标记为非激活状态
            if (alarm.audio) { alarm.audio.pause(); alarm.audio.currentTime = 0; alarm.audio = null; } // 停止铃声
            if (this.currentAudio && this.currentAudio === alarm.audio) this.currentAudio = null; // 清除当前音频引用
            if (alarm.modal) { alarm.modal.remove(); alarm.modal = null; } // 移除模态框
            clearInterval(alarm.interval); // 清除倒计时
            this.renderAlarms(); // 重新渲染列表
        }
    }
}

// 页面加载完成后，创建并初始化AlarmClock实例
document.addEventListener('DOMContentLoaded', () => {
    document.alarmClock = new AlarmClock(); // 将实例挂载到全局对象上，以便在HTML中调用方法
});