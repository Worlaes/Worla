class ImageOCR {
    constructor() {
        this.isToolsActive = false; // 是否显示工具面板
        this.originalImage = null; // 存储用户上传的原始图片，以便实时处理
        this.initUI(); // 初始化用户界面
    }

    // 初始化用户界面，加载Tesseract.js并设置HTML和CSS
    initUI() {
        // 加载 Tesseract.js 脚本，用于OCR文字识别
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/tesseract.js@v3.0.3/dist/tesseract.min.js';
        document.head.appendChild(script);

        // 定义CSS样式，控制页面元素的外观
        const style = document.createElement('style');
        style.textContent = `
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; } /* 页面基础样式 */
            .container { max-width: 800px; margin: 0 auto; } /* 主容器样式 */
            #preview { max-width: 100%; margin: 20px 0; display: none; } /* 原始图片预览样式 */
            #processed-preview { max-width: 100%; margin: 10px 0; display: none; } /* 处理后图片预览样式 */
            .tools-btn { position: fixed; bottom: 20px; left: 20px; background-color: #2196F3; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; z-index: 500; } /* 工具按钮样式 */
            .tools-btn:hover { background-color: #1976D2; } /* 工具按钮悬停效果 */
            .tools-panel { position: fixed; bottom: 70px; left: 20px; display: none; flex-direction: column; gap: 10px; z-index: 500; background: #fff; padding: 10px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); } /* 工具面板样式 */
            .tool-btn { background-color: #ff9800; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; } /* 工具面板按钮样式 */
            .tool-btn:hover { background-color: #f57c00; } /* 工具按钮悬停效果 */
            .file-input { display: none; } /* 隐藏文件输入框 */
            .controls { display: flex; gap: 10px; align-items: center; } /* 参数控件容器样式 */
            .param-item { display: flex; align-items: center; gap: 5px; } /* 参数项样式 */
            .loader { display: none; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 20px auto; } /* 加载动画样式 */
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } /* 旋转动画定义 */
            #result-window { display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 600px; max-height: 80vh; background: white; border: 1px solid #ddd; padding: 15px; box-shadow: 0 0 10px rgba(0,0,0,0.3); z-index: 1000; overflow-y: auto; } /* 结果窗口样式 */
            #result-window button { position: absolute; top: 5px; right: 5px; padding: 5px 10px; background: #ff4757; color: white; border: none; cursor: pointer; } /* 结果窗口关闭按钮样式 */
            #result-content { white-space: pre-wrap; padding: 10px; } /* 结果内容样式 */
        `;
        document.head.appendChild(style);

        // 设置页面HTML结构
        document.body.innerHTML = `
            <div class="container">
                <h2>文字识别</h2> <!-- 页面标题 -->
                <img id="preview" alt="原始图片预览"> <!-- 原始图片预览 -->
            </div>
            <button class="tools-btn">识别工具</button> <!-- 切换工具面板按钮 -->
            <div class="tools-panel" id="toolsPanel">
                <img id="processed-preview" alt="处理后图片预览"> <!-- 处理后图片预览 -->
                <input type="file" id="upload" accept="image/*" class="file-input"> <!-- 文件上传输入框 -->
                <label for="upload" class="tool-btn">选择图片</label> <!-- 文件选择按钮 -->
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
                <button class="tool-btn" id="recognize-btn" disabled>识别文字</button> <!-- 识别按钮，初始禁用 -->
            </div>
            <div class="loader" id="loader"></div> <!-- 加载动画 -->
            <div id="result-window">
                <button>关闭</button> <!-- 关闭结果窗口按钮 -->
                <div id="result-content"></div> <!-- 识别结果显示区域 -->
            </div>
        `;

        // 为界面元素绑定事件监听器
        document.querySelector('.tools-btn').addEventListener('click', () => this.toggleTools()); // 点击切换工具面板
        document.getElementById('upload').addEventListener('change', (e) => this.previewImage(e)); // 上传图片时预览
        document.getElementById('recognize-btn').addEventListener('click', () => this.recognizeText()); // 点击识别文字
        document.querySelector('#result-window button').addEventListener('click', () => this.closeResult()); // 关闭结果窗口
        document.getElementById('threshold').addEventListener('input', (e) => { // 灰度阈值变化时更新预览
            document.getElementById('threshold-value').textContent = e.target.value;
            this.updateProcessedPreview();
        });
        document.getElementById('sharpen').addEventListener('input', (e) => { // 锐化强度变化时更新预览
            document.getElementById('sharpen-value').textContent = e.target.value;
            this.updateProcessedPreview();
        });
    }

    // 切换工具面板的显示状态
    toggleTools() {
        const panel = document.getElementById('toolsPanel');
        panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex'; // 切换显示状态
        this.isToolsActive = panel.style.display === 'flex'; // 更新工具面板状态
    }

    // 预览用户上传的图片
    previewImage(event) {
        const file = event.target.files[0];
        if (file) {
            const img = new Image();
            img.onload = () => {
                this.originalImage = img; // 存储原始图片对象
                document.getElementById('preview').src = URL.createObjectURL(file); // 显示原始图片
                document.getElementById('preview').style.display = 'block';
                document.getElementById('recognize-btn').disabled = false; // 启用识别按钮
                this.updateProcessedPreview(); // 初次显示处理后的预览
            };
            img.src = URL.createObjectURL(file); // 设置图片源
        }
    }

    // 预处理图片，应用灰度和锐化效果
    async preprocessImage(image) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = image.naturalWidth; // 设置canvas宽度为图片原始宽度
        canvas.height = image.naturalHeight; // 设置canvas高度为图片原始高度
        ctx.drawImage(image, 0, 0); // 绘制原始图片到canvas
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height); // 获取图像数据
        let data = imageData.data;

        // 应用灰度阈值处理
        const threshold = parseInt(document.getElementById('threshold').value);
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3; // 计算RGB平均值
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
        return canvas.toDataURL(); // 返回处理后的图片URL
    }

    // 更新处理后的图片预览
    async updateProcessedPreview() {
        if (!this.originalImage) return; // 如果没有原始图片，不执行
        const processedImg = await this.preprocessImage(this.originalImage); // 处理图片
        const processedPreview = document.getElementById('processed-preview');
        processedPreview.src = processedImg; // 设置处理后图片源
        processedPreview.style.display = 'block'; // 显示处理后预览
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

    // 执行OCR文字识别
    async recognizeText() {
        const loader = document.getElementById('loader');
        const resultWindow = document.getElementById('result-window');
        const resultContent = document.getElementById('result-content');
        try {
            loader.style.display = 'block'; // 显示加载动画
            resultContent.textContent = ''; // 清空结果内容
            const processedImg = await this.preprocessImage(this.originalImage); // 预处理图片
            const worker = Tesseract.createWorker({ logger: m => console.log(m) }); // 创建Tesseract工作线程
            await worker.load(); // 加载Tesseract核心
            await worker.loadLanguage('chi_sim+eng+jpn'); // 加载中文、英文和日文语言包
            await worker.initialize('chi_sim+eng+jpn'); // 初始化语言
            await worker.setParameters({
                tessedit_pageseg_mode: '3', // 页面分割模式（自动）
                preserve_interword_spaces: '1', // 保留单词间空格
                tessedit_ocr_engine_mode: '1', // OCR引擎模式（LSTM）
                user_defined_dpi: '300', // 设置DPI
                tessedit_char_blacklist: '~`!@#$%^&*()_+-={}[]|\\:;"\'<>,.?/' // 黑名单字符
            });
            const { data: { text } } = await worker.recognize(processedImg); // 执行OCR识别
            resultContent.textContent = text; // 显示识别结果
            resultWindow.style.display = 'block'; // 显示结果窗口
            await worker.terminate(); // 终止工作线程
        } catch (err) {
            resultContent.textContent = '识别出错: ' + err.message; // 显示错误信息
            resultWindow.style.display = 'block';
        } finally {
            loader.style.display = 'none'; // 隐藏加载动画
        }
    }

    // 关闭结果窗口并清理内容
    closeResult() {
        document.getElementById('result-window').style.display = 'none';
        document.getElementById('result-content').textContent = ''; // 清空结果内容
    }
}

// 页面加载完成后初始化ImageOCR实例
document.addEventListener('DOMContentLoaded', () => new ImageOCR());