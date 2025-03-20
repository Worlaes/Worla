class AreaOCR {
    constructor() {
        this.worker = null; // Tesseract.js 的工作线程实例
        this.isSelecting = false; // 是否处于选择区域模式
        this.startX = 0; // 选择区域的起始X坐标
        this.startY = 0; // 选择区域的起始Y坐标
        this.endX = 0; // 选择区域的结束X坐标
        this.endY = 0; // 选择区域的结束Y坐标
        this.startSelectionHandler = null; // 鼠标按下事件处理函数
        this.endSelectionHandler = null; // 鼠标松开事件处理函数
        this.updateSelectionHandler = null; // 鼠标移动事件处理函数
        this.selectedCanvas = null; // 存储用户选择的区域截图（canvas元素）
        this.initUI(); // 初始化用户界面
    }

    // 初始化用户界面，加载外部脚本并设置HTML和CSS
    initUI() {
        // 加载 Tesseract.js 脚本，用于OCR识别
        const tesseractScript = document.createElement('script');
        tesseractScript.src = 'https://unpkg.com/tesseract.js@v3.0.3/dist/tesseract.min.js';
        document.head.appendChild(tesseractScript);

        // 加载 html2canvas 脚本，用于截取页面内容
        const html2canvasScript = document.createElement('script');
        html2canvasScript.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js';
        document.head.appendChild(html2canvasScript);

        // 定义CSS样式，控制页面元素的外观
        const style = document.createElement('style');
        style.textContent = `
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; } /* 页面基础样式 */
            #selection-box { position: fixed; border: 2px dashed #ff4757; background: rgba(255,71,87,0.1); pointer-events: none; display: none; } /* 选择框样式 */
            #status { position: fixed; top: 10px; left: 10px; background: rgba(0,0,0,0.7); color: white; padding: 5px 10px; border-radius: 3px; display: none; z-index: 1001; } /* 状态提示样式 */
            #toggle-button { position: fixed; bottom: 10px; left: 10px; padding: 8px 15px; background: #ff4757; color: white; border: none; border-radius: 5px; cursor: pointer; z-index: 1000; } /* 切换按钮样式 */
            #result-window { display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 500px; max-height: 80vh; background: white; border: 1px solid #ddd; padding: 15px; box-shadow: 0 0 10px rgba(0,0,0,0.3); z-index: 1000; overflow-y: auto; } /* 结果窗口样式 */
            #result-window button { position: absolute; top: 5px; right: 5px; padding: 5px 10px; background: #ff4757; color: white; border: none; cursor: pointer; } /* 结果窗口关闭按钮样式 */
            #adjust-window { display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 500px; background: white; border: 1px solid #ddd; padding: 15px; box-shadow: 0 0 10px rgba(0,0,0,0.3); z-index: 1000; } /* 调整窗口样式 */
            #adjust-window button { padding: 5px 10px; background: #ff4757; color: white; border: none; cursor: pointer; } /* 调整窗口按钮样式 */
            .controls { display: flex; flex-direction: column; gap: 10px; margin-top: 10px; } /* 调整控件容器样式 */
            .param-item { display: flex; align-items: center; gap: 5px; } /* 参数项样式 */
            #adjust-preview { max-width: 100%; margin: 10px 0; } /* 调整预览图片样式 */
            #result-content pre { white-space: pre-wrap; } /* 结果内容预格式化文本样式 */
        `;
        document.head.appendChild(style);

        // 设置页面HTML结构
        document.body.innerHTML = `
            <div id="status">准备就绪</div> <!-- 状态提示 -->
            <div id="selection-box"></div> <!-- 选择区域框 -->
            <button id="toggle-button">开启识别模式</button> <!-- 切换识别模式的按钮 -->
            <div id="result-window">
                <button>关闭</button> <!-- 关闭结果窗口按钮 -->
                <div id="result-content"></div> <!-- 识别结果显示区域 -->
            </div>
            <div id="adjust-window">
                <h3>调整图像</h3> <!-- 调整窗口标题 -->
                <img id="adjust-preview" alt="调整预览"> <!-- 调整预览图片 -->
                <div class="controls">
                    <div class="param-item">
                        <label>灰度阈值:</label> <!-- 灰度阈值调节 -->
                        <input type="range" id="threshold" min="0" max="255" value="150">
                        <span id="threshold-value">150</span>
                    </div>
                    <div class="param-item">
                        <label>锐化强度:</label> <!-- 锐化强度调节 -->
                        <input type="range" id="sharpen" min="0" max="5" value="1" step="0.1">
                        <span id="sharpen-value">1</span>
                    </div>
                </div>
                <button id="confirm-adjust">确认识别</button> <!-- 确认调整并识别 -->
                <button id="cancel-adjust" style="margin-left: 10px;">取消</button> <!-- 取消调整 -->
            </div>
            <img src="images/test1.jpg"> <!-- 测试图片1 -->
            <img src="images/test2.jpg"> <!-- 测试图片2 -->
        `;

        // 为界面元素绑定事件监听器
        document.getElementById('toggle-button').addEventListener('click', () => this.toggleSelectionMode()); // 点击按钮切换选择模式
        document.addEventListener('keydown', (e) => { // 监听键盘事件
            if (e.key.toLowerCase() === 'z' && !e.ctrlKey && !e.metaKey) { // 按Z键切换模式
                e.preventDefault();
                this.toggleSelectionMode();
            }
        });
        document.querySelector('#result-window button').addEventListener('click', () => this.closeResult()); // 关闭结果窗口
        document.getElementById('confirm-adjust').addEventListener('click', () => this.confirmAdjust()); // 确认调整并识别
        document.getElementById('cancel-adjust').addEventListener('click', () => this.cancelAdjust()); // 取消调整
        document.getElementById('threshold').addEventListener('input', (e) => { // 灰度阈值变化时更新预览
            document.getElementById('threshold-value').textContent = e.target.value;
            this.updateAdjustPreview();
        });
        document.getElementById('sharpen').addEventListener('input', (e) => { // 锐化强度变化时更新预览
            document.getElementById('sharpen-value').textContent = e.target.value;
            this.updateAdjustPreview();
        });

        this.showStatus('按 Z 或点击按钮开始选区'); // 初始化状态提示
    }

    // 获取当前页面的滚动偏移量
    getScrollOffset() {
        return { x: window.scrollX || window.pageXOffset, y: window.scrollY || window.pageYOffset };
    }

    // 显示状态提示，2秒后自动隐藏
    showStatus(text) {
        const status = document.getElementById('status');
        status.style.display = 'block';
        status.textContent = text;
        setTimeout(() => status.style.display = 'none', 2000);
    }

    // 切换选择区域模式
    toggleSelectionMode() {
        if (!this.isSelecting) { // 如果当前未处于选择模式
            this.isSelecting = true;
            document.getElementById('toggle-button').textContent = '关闭识别模式'; // 更新按钮文本
            this.showStatus('选取模式开启：请拖动鼠标选择区域');
            document.body.style.userSelect = 'none'; // 禁用文本选择
            document.body.style.pointerEvents = 'none'; // 禁用页面交互
            document.getElementById('selection-box').style.pointerEvents = 'none'; // 选择框不响应事件
            document.addEventListener('mousedown', this.startSelectionHandler = (e) => this.startSelection(e)); // 开始选择
            document.addEventListener('mouseup', this.endSelectionHandler = () => this.endSelection()); // 结束选择
        } else { // 如果当前处于选择模式
            this.isSelecting = false;
            document.getElementById('toggle-button').textContent = '开启识别模式'; // 恢复按钮文本
            document.body.style.userSelect = ''; // 恢复文本选择
            document.body.style.pointerEvents = ''; // 恢复页面交互
            document.getElementById('selection-box').style.display = 'none'; // 隐藏选择框
            document.removeEventListener('mousedown', this.startSelectionHandler); // 移除事件监听器
            document.removeEventListener('mouseup', this.endSelectionHandler);
            this.showAdjustWindow(); // 显示图像调整窗口
        }
    }

    // 开始选择区域，记录起始坐标并显示选择框
    startSelection(e) {
        const offset = this.getScrollOffset();
        this.startX = e.clientX + offset.x; // 计算相对于文档的起始X坐标
        this.startY = e.clientY + offset.y; // 计算相对于文档的起始Y坐标
        const box = document.getElementById('selection-box');
        box.style.display = 'block'; // 显示选择框
        box.style.left = e.clientX + 'px'; // 设置初始位置
        box.style.top = e.clientY + 'px';
        document.addEventListener('mousemove', this.updateSelectionHandler = (e) => this.updateSelectionBox(e)); // 更新选择框大小
    }

    // 更新选择框的大小和位置
    updateSelectionBox(e) {
        const offset = this.getScrollOffset();
        this.endX = e.clientX + offset.x; // 计算结束X坐标
        this.endY = e.clientY + offset.y; // 计算结束Y坐标
        const box = document.getElementById('selection-box');
        box.style.width = Math.abs(this.endX - this.startX) + 'px'; // 设置宽度
        box.style.height = Math.abs(this.endY - this.startY) + 'px'; // 设置高度
        box.style.left = Math.min(this.startX - offset.x, e.clientX) + 'px'; // 设置左边界
        box.style.top = Math.min(this.startY - offset.y, e.clientY) + 'px'; // 设置上边界
    }

    // 结束选择区域，移除移动事件监听器
    endSelection() {
        document.removeEventListener('mousemove', this.updateSelectionHandler);
        document.removeEventListener('mousedown', this.startSelectionHandler);
        document.removeEventListener('mouseup', this.endSelectionHandler);
        this.showStatus('按 Z 或点击按钮结束选区并调整');
    }

    // 显示图像调整窗口，并生成选择区域的截图
    async showAdjustWindow() {
        const offset = this.getScrollOffset();
        const rect = {
            x: Math.min(this.startX, this.endX), // 选择区域的左上角X坐标
            y: Math.min(this.startY, this.endY), // 选择区域的左上角Y坐标
            width: Math.abs(this.endX - this.startX), // 选择区域宽度
            height: Math.abs(this.endY - this.startY) // 选择区域高度
        };
        // 使用 html2canvas 截取选择区域
        this.selectedCanvas = await html2canvas(document.body, {
            logging: false,
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            useCORS: true, // 允许跨域资源
            allowTaint: true, // 允许非清洁内容
            scrollX: 0,
            scrollY: 0
        });

        document.getElementById('adjust-preview').src = this.selectedCanvas.toDataURL(); // 设置预览图片
        document.getElementById('adjust-window').style.display = 'block'; // 显示调整窗口
        this.updateAdjustPreview(); // 更新调整预览
    }

    // 更新调整窗口中的图像预览，应用灰度和锐化效果
    async updateAdjustPreview() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = this.selectedCanvas.width;
        canvas.height = this.selectedCanvas.height;
        ctx.drawImage(this.selectedCanvas, 0, 0); // 绘制原始截图
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let data = imageData.data;

        // 应用灰度阈值处理
        const threshold = parseInt(document.getElementById('threshold').value);
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3; // 计算像素平均值
            const value = avg > threshold ? 255 : 0; // 二值化处理
            data[i] = data[i + 1] = data[i + 2] = value; // 设置RGB值
        }

        // 应用锐化处理
        const sharpen = parseFloat(document.getElementById('sharpen').value);
        if (sharpen > 0) {
            const kernel = [0, -1, 0, -1, 5 + sharpen, -1, 0, -1, 0]; // 锐化卷积核
            imageData = this.convolute(imageData, kernel); // 应用卷积
        }

        ctx.putImageData(imageData, 0, 0); // 更新canvas内容
        document.getElementById('adjust-preview').src = canvas.toDataURL(); // 更新预览图片
    }

    // 对图像应用卷积操作（用于锐化）
    convolute(imageData, kernel) {
        const side = Math.round(Math.sqrt(kernel.length)); // 卷积核边长
        const halfSide = Math.floor(side / 2); // 卷积核一半宽度
        const src = imageData.data; // 原始图像数据
        const sw = imageData.width; // 图像宽度
        const sh = imageData.height; // 图像高度
        const output = new ImageData(sw, sh); // 输出图像数据
        const dst = output.data;

        // 遍历每个像素，应用卷积
        for (let y = 0; y < sh; y++) {
            for (let x = 0; x < sw; x++) {
                const dstOff = (y * sw + x) * 4; // 当前像素偏移量
                let r = 0, g = 0, b = 0; // RGB累加值
                for (let cy = 0; cy < side; cy++) {
                    for (let cx = 0; cx < side; cx++) {
                        const scy = y + cy - halfSide; // 源像素Y坐标
                        const scx = x + cx - halfSide; // 源像素X坐标
                        if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) { // 确保在图像范围内
                            const srcOff = (scy * sw + scx) * 4; // 源像素偏移量
                            const wt = kernel[cy * side + cx]; // 卷积核权重
                            r += src[srcOff] * wt; // 累加红色通道
                            g += src[srcOff + 1] * wt; // 累加绿色通道
                            b += src[srcOff + 2] * wt; // 累加蓝色通道
                        }
                    }
                }
                dst[dstOff] = this.clamp(r); // 设置输出红色通道
                dst[dstOff + 1] = this.clamp(g); // 设置输出绿色通道
                dst[dstOff + 2] = this.clamp(b); // 设置输出蓝色通道
                dst[dstOff + 3] = 255; // 设置透明度
            }
        }
        return output;
    }

    // 将值限制在0-255范围内
    clamp(value) {
        return Math.max(0, Math.min(255, value));
    }

    // 确认调整并开始OCR识别
    async confirmAdjust() {
        document.getElementById('adjust-window').style.display = 'none'; // 隐藏调整窗口
        this.showStatus('识别中...');
        await this.recognizeAreaWithAdjustments(); // 执行识别
    }

    // 取消调整并关闭调整窗口
    async cancelAdjust() {
        document.getElementById('adjust-window').style.display = 'none';
        this.showStatus('已取消调整');
    }

    // 对调整后的图像进行OCR识别
    async recognizeAreaWithAdjustments() {
        this.worker = Tesseract.createWorker(); // 创建Tesseract工作线程
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = this.selectedCanvas.width;
            canvas.height = this.selectedCanvas.height;
            ctx.drawImage(this.selectedCanvas, 0, 0); // 绘制原始截图
            let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            let data = imageData.data;

            // 应用灰度阈值处理
            const threshold = parseInt(document.getElementById('threshold').value);
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                const value = avg > threshold ? 255 : 0;
                data[i] = data[i + 1] = data[i + 2] = value;
            }

            // 应用锐化处理
            const sharpen = parseFloat(document.getElementById('sharpen').value);
            if (sharpen > 0) {
                const kernel = [0, -1, 0, -1, 5 + sharpen, -1, 0, -1, 0];
                imageData = this.convolute(imageData, kernel);
            }

            ctx.putImageData(imageData, 0, 0); // 更新canvas内容

            // 初始化Tesseract并设置参数
            await this.worker.load();
            await this.worker.loadLanguage('eng+chi_sim'); // 加载英文和简体中文语言包
            await this.worker.initialize('eng+chi_sim'); // 初始化语言
            await this.worker.setParameters({
                tessedit_pageseg_mode: '6', // 页面分割模式
                preserve_interword_spaces: '1', // 保留单词间空格
                user_defined_dpi: '300' // 设置DPI
            });
            const { data: { text } } = await this.worker.recognize(canvas); // 执行OCR识别

            // 显示识别结果和处理后的图像
            document.getElementById('result-content').innerHTML = `
                <h3>识别结果：</h3><pre>${text}</pre>
                <h3>识别区域（处理后）：</h3><img src="${canvas.toDataURL()}" style="max-width: 400px; border: 1px solid #ddd;">
            `;
            document.getElementById('result-window').style.display = 'block';
        } catch (error) {
            console.error('识别失败:', error);
            this.showStatus('识别失败，请重试');
        } finally {
            await this.worker.terminate(); // 终止工作线程
            this.showStatus('识别完成');
        }
    }

    // 关闭结果窗口并清理状态
    closeResult() {
        document.getElementById('result-window').style.display = 'none';
        document.getElementById('result-content').innerHTML = ''; // 清空结果内容
        if (this.isSelecting) { // 如果仍处于选择模式，退出
            this.isSelecting = false;
            document.getElementById('toggle-button').textContent = '开启识别模式';
            document.body.style.userSelect = '';
            document.body.style.pointerEvents = '';
            document.getElementById('selection-box').style.display = 'none';
            document.removeEventListener('mousedown', this.startSelectionHandler);
            document.removeEventListener('mouseup', this.endSelectionHandler);
            document.removeEventListener('mousemove', this.updateSelectionHandler);
            this.showStatus('已退出识别模式');
        }
    }
}

// 页面加载完成后初始化AreaOCR实例
document.addEventListener('DOMContentLoaded', () => new AreaOCR());