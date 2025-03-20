class DrawingTool {
    constructor() {
        this.drawing = false; // 是否正在绘制
        this.mode = 'none'; // 当前工具模式（none, blur, draw, canvas, erase）
        this.lastX = 0; // 上一次鼠标X坐标
        this.lastY = 0; // 上一次鼠标Y坐标
        this.isToolsActive = false; // 工具面板是否激活
        this.drawColor = '#000000'; // 绘画颜色，默认黑色
        this.drawSize = 2; // 绘画线条大小，默认2px
        this.eraseSize = 10; // 擦除工具大小，默认10px
        this.canvas = null; // 画板canvas元素
        this.ctx = null; // 画板canvas的2D上下文
        this.eraseRange = 10; // 擦除范围大小，默认10px
        this.initUI(); // 初始化用户界面
    }

    // 初始化用户界面，设置CSS样式和HTML结构
    initUI() {
        // 定义CSS样式，控制页面和工具的外观
        const style = document.createElement('style');
        style.textContent = `
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f0f0f0; overflow: auto; min-height: 100vh; user-select: none; } /* 页面基础样式 */
            .content { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); position: relative; z-index: 1; } /* 内容区域样式 */
            .tools-btn { position: fixed; bottom: 20px; left: 20px; background-color: #2196F3; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; z-index: 500; } /* 工具栏按钮样式 */
            .tools-btn:hover { background-color: #1976D2; } /* 工具栏按钮悬停效果 */
            .tools-panel { position: fixed; bottom: 70px; left: 20px; display: none; flex-direction: column; gap: 10px; z-index: 500; background: #fff; padding: 10px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); } /* 工具面板样式 */
            .tool-btn { background-color: #ff9800; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; } /* 工具按钮样式 */
            .tool-btn:hover { background-color: #f57c00; } /* 工具按钮悬停效果 */
            .tool-btn.active { background-color: #4CAF50; } /* 激活状态的工具按钮样式 */
            .sticker { position: absolute; cursor: move; z-index: 1000; border: 1px solid #ddd; user-select: none; pointer-events: auto; } /* 贴纸样式 */
            .sticker:hover::after { content: '单击旋转 / 滚轮缩放'; position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%); background: #000; color: #fff; padding: 2px 5px; border-radius: 3px; font-size: 12px; } /* 贴纸悬停提示 */
            .file-input { display: none; } /* 隐藏文件输入框 */
            .blur-effect { position: absolute; background: rgba(0,0,0,0.5); filter: blur(10px); pointer-events: none; z-index: 1500; } /* 模糊效果样式 */
            .draw-line { position: absolute; pointer-events: none; z-index: 1500; } /* 绘制线条样式 */
            .erase-line { position: absolute; pointer-events: none; z-index: 1500; background: white; } /* 擦除线条样式 */
            .tool-options { display: flex; gap: 5px; align-items: center; } /* 工具选项容器样式 */
            img:not(.sticker) { -webkit-user-drag: none; user-drag: none; pointer-events: none; } /* 非贴纸图片不可拖动 */
            #canvas-panel { display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 600px; height: 400px; background: white; border: 1px solid #ddd; box-shadow: 0 0 10px rgba(0,0,0,0.3); z-index: 2000; } /* 画板面板样式 */
            #canvas-panel button { position: absolute; top: 5px; right: 5px; padding: 5px 10px; background: #ff4757; color: white; border: none; cursor: pointer; } /* 画板关闭按钮样式 */
            #drawing-canvas { width: 100%; height: 100%; } /* 画板canvas样式 */
        `;
        document.head.appendChild(style);

        // 设置页面HTML结构
        document.body.innerHTML = `
            <div class="content">
                <h1>欢迎体验网页绘画工具</h1> <!-- 页面标题 -->
                <p>这是一个简单的网页，包含一些示例文字内容。你可以通过左下角的按钮打开工具栏，尝试以下功能：</p>
                <ul>
                    <li><strong>无</strong>：禁用绘画功能。</li>
                    <li><strong>打码模糊化</strong>：在网页上绘制模糊区域。</li>
                    <li><strong>绘画</strong>：直接在网页上绘制线条，可选颜色和大小。</li>
                    <li><strong>画板</strong>：打开一个独立的弹出式画板。</li>
                    <li><strong>导入图片</strong>：上传图片作为贴纸，可拖动、旋转和缩放。</li>
                    <li><strong>清空</strong>：清除所有绘画痕迹和贴纸。</li>
                </ul>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p> <!-- 示例文本 -->
            </div>
            <button class="tools-btn">工具栏</button> <!-- 工具栏切换按钮 -->
            <div class="tools-panel" id="toolsPanel">
                <button class="tool-btn" id="noneBtn">无</button> <!-- 无模式按钮 -->
                <button class="tool-btn" id="blurBtn">打码模糊化</button> <!-- 模糊模式按钮 -->
                <div class="tool-options">
                    <button class="tool-btn" id="drawBtn">绘画</button> <!-- 绘画模式按钮 -->
                    <input type="color" id="drawColor" value="#000000"> <!-- 颜色选择器 -->
                    <select id="drawSize"> <!-- 线条大小选择器 -->
                        <option value="2" selected>细 (2px)</option>
                        <option value="5">中 (5px)</option>
                        <option value="10">粗 (10px)</option>
                    </select>
                </div>
                <button class="tool-btn" id="canvasBtn">画板</button> <!-- 画板模式按钮 -->
                <input type="file" id="imageInput" accept="image/*" class="file-input"> <!-- 文件上传输入框 -->
                <label for="imageInput" class="tool-btn">导入图片</label> <!-- 导入图片按钮 -->
                <button class="tool-btn" id="clearBtn">清空</button> <!-- 清空按钮 -->
                <div class="tool-options">
                    <button class="tool-btn" id="eraseBtn">擦除</button>
                    <select id="eraseRange">
                        <option value="10">小范围 (10px)</option>
                        <option value="20">中范围 (20px)</option>
                        <option value="30">大范围 (30px)</option>
                    </select>
                </div>
            </div>
            <div id="canvas-panel">
                <button>关闭</button> <!-- 画板关闭按钮 -->
                <canvas id="drawing-canvas"></canvas> <!-- 画板canvas -->
            </div>
        `;

        // 为界面元素绑定事件监听器
        document.querySelector('.tools-btn').addEventListener('click', () => this.toggleTools()); // 切换工具栏
        document.getElementById('noneBtn').addEventListener('click', () => this.setMode('none')); // 设置无模式
        document.getElementById('blurBtn').addEventListener('click', () => this.setMode('blur')); // 设置模糊模式
        document.getElementById('drawBtn').addEventListener('click', () => this.setMode('draw')); // 设置绘画模式
        document.getElementById('canvasBtn').addEventListener('click', () => this.setMode('canvas')); // 设置画板模式
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll()); // 清空所有绘制内容
        document.getElementById('imageInput').addEventListener('change', (e) => this.addSticker(e)); // 导入图片
        document.getElementById('drawColor').addEventListener('change', () => this.updateDrawColor()); // 更新绘画颜色
        document.getElementById('drawSize').addEventListener('change', () => this.updateDrawSize()); // 更新绘画大小
        document.getElementById('eraseBtn').addEventListener('click', () => this.setMode('erase')); // 设置擦除模式
        document.querySelector('#canvas-panel button').addEventListener('click', () => this.closeCanvas()); // 关闭画板
        document.getElementById('eraseRange').addEventListener('change', () => this.updateEraseRange()); // 更新擦除范围

        // 为页面绑定鼠标事件
        document.body.addEventListener('mousedown', (e) => this.handleMouseDown(e)); // 鼠标按下
        document.body.addEventListener('mousemove', (e) => this.handleMouseMove(e)); // 鼠标移动
        document.body.addEventListener('mouseup', () => this.drawing = false); // 鼠标松开
        document.body.addEventListener('mouseout', () => this.drawing = false); // 鼠标离开页面

        this.setMode('none'); // 默认设置为无模式
    }

    // 切换工具面板的显示状态
    toggleTools() {
        const panel = document.getElementById('toolsPanel');
        panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex'; // 切换显示状态
        this.isToolsActive = panel.style.display === 'flex'; // 更新工具面板状态
        if (!this.isToolsActive) this.mode = 'none'; // 关闭工具面板时禁用模式
    }

    // 设置当前工具模式
    setMode(newMode) {
        this.mode = newMode;
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active')); // 移除所有按钮的激活状态
        document.getElementById(`${newMode}Btn`).classList.add('active'); // 为当前模式按钮添加激活状态
        if (newMode === 'canvas') this.openCanvas(); // 如果是画板模式，打开画板
        if (newMode === 'erase') this.updateEraseSize(); // 如果是擦除模式，更新擦除大小
    }

    // 更新绘画颜色
    updateDrawColor() {
        this.drawColor = document.getElementById('drawColor').value; // 获取颜色选择器的值
        if (this.ctx) this.ctx.strokeStyle = this.drawColor; // 更新画板上下文的描边颜色
    }

    // 更新绘画线条大小
    updateDrawSize() {
        this.drawSize = parseInt(document.getElementById('drawSize').value); // 获取选择器的大小值
        if (this.ctx) this.ctx.lineWidth = this.drawSize; // 更新画板上下文的线条宽度
    }

    // 更新擦除工具大小
    updateEraseSize() {
        this.eraseSize = parseInt(document.getElementById('drawSize').value); // 使用绘画大小作为擦除大小
    }

    // 更新擦除范围
    updateEraseRange() {
        this.eraseRange = parseInt(document.getElementById('eraseRange').value);
    }

    // 获取当前页面的滚动偏移量
    getScrollOffset() {
        return { x: window.scrollX || window.pageXOffset, y: window.scrollY || window.pageYOffset };
    }

    // 清空所有绘制内容（线条、模糊区域和贴纸）
    clearAll() {
        document.querySelectorAll('.draw-line, .blur-effect, .sticker').forEach(el => el.remove());
    }

    // 处理鼠标按下事件，开始绘制
    handleMouseDown(e) {
        if (!this.isToolsActive || e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return; // 工具未激活或点击控件时忽略
        if (this.mode === 'none' || this.mode === 'canvas') return; // 无模式或画板模式时忽略
        this.drawing = true; // 标记为正在绘制
        const offset = this.getScrollOffset();
        [this.lastX, this.lastY] = [e.clientX + offset.x, e.clientY + offset.y]; // 记录起始坐标
    }

    // 处理鼠标移动事件，根据模式绘制内容
    handleMouseMove(e) {
        if (!this.drawing || !this.isToolsActive || this.mode === 'none' || this.mode === 'canvas') return; // 未绘制、工具未激活或特定模式时忽略
        const offset = this.getScrollOffset();
        const currentX = e.clientX + offset.x; // 当前X坐标
        const currentY = e.clientY + offset.y; // 当前Y坐标

        if (this.mode === 'draw') { // 绘画模式
            const line = document.createElement('div');
            line.className = 'draw-line';
            const dx = currentX - this.lastX; // X方向距离
            const dy = currentY - this.lastY; // Y方向距离
            const length = Math.sqrt(dx * dx + dy * dy); // 线条长度
            const angle = Math.atan2(dy, dx) * 180 / Math.PI; // 线条角度
            line.style.width = `${length}px`; // 设置线条宽度
            line.style.height = `${this.drawSize}px`; // 设置线条高度（粗细）
            line.style.background = this.drawColor; // 设置线条颜色
            line.style.left = `${this.lastX}px`; // 设置起始X位置
            line.style.top = `${this.lastY}px`; // 设置起始Y位置
            line.style.transform = `rotate(${angle}deg)`; // 设置旋转角度
            line.style.transformOrigin = '0 0'; // 旋转原点
            document.body.appendChild(line); // 添加到页面
        } else if (this.mode === 'blur') { // 模糊模式
            const blur = document.createElement('div');
            blur.className = 'blur-effect';
            blur.style.left = `${currentX - 10}px`; // 设置模糊区域中心X位置
            blur.style.top = `${currentY - 10}px`; // 设置模糊区域中心Y位置
            blur.style.width = '20px'; // 设置模糊区域宽度
            blur.style.height = '20px'; // 设置模糊区域高度
            blur.style.borderRadius = '50%'; // 设置为圆形
            document.body.appendChild(blur); // 添加到页面
        } else if (this.mode === 'erase') { // 擦除模式
            // 移除擦除区域内的绘画和模糊元素
            document.querySelectorAll('.draw-line, .blur-effect').forEach(el => {
                const rect = el.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2; // 元素中心X坐标
                const centerY = rect.top + rect.height / 2; // 元素中心Y坐标
                const distance = Math.sqrt(Math.pow(centerX - currentX, 2) + Math.pow(centerY - currentY, 2)); // 计算元素中心与鼠标位置的距离
                if (distance < this.eraseRange) { // 如果距离小于擦除半径，则移除该元素
                    el.remove();
                }
            });
        }

        [this.lastX, this.lastY] = [currentX, currentY]; // 更新上一次坐标
    }

    // 添加图片贴纸
    addSticker(event) {
        const file = event.target.files[0];
        if (!file) return; // 如果没有选择文件，退出
        const img = new Image();
        img.src = URL.createObjectURL(file); // 创建图片URL
        img.onload = () => {
            const sticker = document.createElement('img');
            sticker.src = img.src;
            sticker.className = 'sticker';
            sticker.style.width = '200px'; // 默认宽度
            sticker.style.left = '100px'; // 默认X位置
            sticker.style.top = '100px'; // 默认Y位置
            sticker.dataset.rotation = '0'; // 初始旋转角度
            sticker.dataset.scale = '1'; // 初始缩放比例
            document.body.appendChild(sticker); // 添加到页面
            this.makeDraggable(sticker); // 使贴纸可拖动
            this.makeRotatable(sticker); // 使贴纸可旋转
            this.makeScalable(sticker); // 使贴纸可缩放
        };
    }

    // 使元素可拖动
    makeDraggable(element) {
        let posX = 0, posY = 0, mouseX = 0, mouseY = 0;
        element.addEventListener('mousedown', (e) => {
            if (e.button !== 0 || this.mode === 'draw') return; // 非左键或绘画模式时忽略
            e.preventDefault();
            const offset = this.getScrollOffset();
            mouseX = e.clientX + offset.x; // 记录鼠标初始X坐标
            mouseY = e.clientY + offset.y; // 记录鼠标初始Y坐标
            document.onmousemove = (e) => {
                e.preventDefault();
                const offset = this.getScrollOffset();
                posX = mouseX - (e.clientX + offset.x); // 计算X方向移动距离
                posY = mouseY - (e.clientY + offset.y); // 计算Y方向移动距离
                mouseX = e.clientX + offset.x; // 更新鼠标X坐标
                mouseY = e.clientY + offset.y; // 更新鼠标Y坐标
                element.style.top = (element.offsetTop - posY) + 'px'; // 更新元素Y位置
                element.style.left = (element.offsetLeft - posX) + 'px'; // 更新元素X位置
            };
            document.onmouseup = () => { document.onmousemove = null; document.onmouseup = null; }; // 鼠标松开时清除事件
        });
    }

    // 使元素可旋转
    makeRotatable(element) {
        element.addEventListener('click', (e) => {
            e.preventDefault();
            let rotation = parseInt(element.dataset.rotation || 0) + 90; // 每次旋转90度
            if (rotation >= 360) rotation = 0; // 超过360度归零
            element.style.transform = `rotate(${rotation}deg) scale(${element.dataset.scale})`; // 设置旋转和缩放
            element.dataset.rotation = rotation; // 更新旋转数据
        });
    }

    // 使元素可缩放（通过滚轮）
    makeScalable(element) {
        element.addEventListener('wheel', (e) => {
            e.preventDefault();
            let scale = parseFloat(element.dataset.scale || 1); // 获取当前缩放比例
            scale += e.deltaY < 0 ? 0.1 : -0.1; // 滚轮向上放大，向下缩小
            scale = Math.max(0.2, Math.min(2, scale)); // 限制缩放范围（0.2到2）
            element.dataset.scale = scale; // 更新缩放数据
            element.style.transform = `rotate(${element.dataset.rotation}deg) scale(${scale})`; // 设置旋转和缩放
            element.style.width = `${200 * scale}px`; // 更新宽度
        });
    }

    // 打开画板并初始化canvas
    openCanvas() {
        const panel = document.getElementById('canvas-panel');
        this.canvas = document.getElementById('drawing-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 600; // 设置canvas宽度
        this.canvas.height = 400; // 设置canvas高度
        this.ctx.strokeStyle = this.drawColor; // 设置描边颜色
        this.ctx.lineWidth = this.drawSize; // 设置线条宽度
        this.ctx.lineCap = 'round'; // 设置线条端点为圆形
        panel.style.display = 'block'; // 显示画板面板

        let isDrawing = false; // 是否在画板上绘制
        let lastX = 0, lastY = 0; // 画板上上一次坐标
        this.canvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            [lastX, lastY] = [e.offsetX, e.offsetY]; // 记录起始坐标
        });
        this.canvas.addEventListener('mousemove', (e) => {
            if (!isDrawing) return;
            this.ctx.beginPath(); // 开始新路径
            this.ctx.moveTo(lastX, lastY); // 移动到上一次位置
            this.ctx.lineTo(e.offsetX, e.offsetY); // 绘制到当前位置
            this.ctx.stroke(); // 描边
            [lastX, lastY] = [e.offsetX, e.offsetY]; // 更新上一次坐标
        });
        this.canvas.addEventListener('mouseup', () => isDrawing = false); // 鼠标松开停止绘制
        this.canvas.addEventListener('mouseout', () => isDrawing = false); // 鼠标离开停止绘制
    }

    // 关闭画板并重置模式
    closeCanvas() {
        document.getElementById('canvas-panel').style.display = 'none'; // 隐藏画板面板
        this.mode = 'none'; // 重置模式
        this.setMode('none'); // 更新UI
    }
}

// 页面加载完成后初始化DrawingTool实例
document.addEventListener('DOMContentLoaded', () => new DrawingTool());