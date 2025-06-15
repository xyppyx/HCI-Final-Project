# AI语音助手 - 完整版

基于Web的智能语音交互系统，集成Live2D虚拟角色、多模态AI对话、语音识别与合成的完整解决方案。

## 核心功能

- 🎤 **智能语音交互** - 支持实时语音识别和高质量语音合成
- 🧠 **多模型AI对话** - 集成DeepSeek、Kimi等主流大语言模型
- 🎨 **Live2D虚拟角色** - 沉浸式3D虚拟助手交互体验
- 💬 **智能会话管理** - 多轮对话记忆、会话历史自动保存
- 📚 **对话历史系统** - 按会话组织、支持编辑标题和导出
- ⚙️ **丰富参数控制** - 语速、音量、温度、声音等全方位自定义
- 🎯 **响应式界面** - 现代化三栏布局，支持面板折叠

## 技术特色

- **纯Web实现** - 无需安装客户端，浏览器即可使用
- **模块化架构** - 服务解耦，易于扩展和维护
- **实时交互** - 流畅的语音识别和Live2D动画响应
- **会话智能** - 自动生成对话标题，支持会话切换
- **多引擎支持** - 支持多种TTS和ASR引擎切换

## 快速开始

### 环境要求

- Python 3.7+
- 现代浏览器 (Chrome/Firefox/Edge)
- 网络连接 (API调用)

### 安装运行

```bash
# 克隆项目
git clone https://github.com/xyppyx/HCI-Final-Project.git
cd HCI-Final-Project

# 安装依赖
pip install -r requirements.txt

# 启动服务
python app.py

# 访问应用
# 浏览器打开 http://127.0.0.1:5000
```

### 配置设置

1. **API配置** - 右侧控制面板 → 设置 → 大语言模型设置
2. **DeepSeek** - 华为云MaaS API Key + DeepSeek-V3模型
3. **Kimi** - 月之暗面API Key + moonshot系列模型
4. **Live2D** - 自动加载，支持表情和动作交互
5. **语音设置** - 可选择20+种中文声音，调节语速音量

## 完整项目结构

```
ai_virtual_mate_web/
├── app.py                      # Flask主应用
├── requirements.txt            # 完整依赖列表
├── README.md                  # 项目文档
├── templates/
│   └── index.html            # 主界面模板
├── static/
│   ├── css/
│   │   └── style.css         # 响应式样式系统
│   ├── js/
│   │   ├── main.js           # 核心交互逻辑
│   │   └── live2d-manager.js # Live2D管理器
│   └── live2d/               # Live2D资源
│       ├── lib/              # Live2D核心库
│       ├── models/           # 3D模型文件
│       └── assets/           # 贴图和动画
├── services/                  # 核心服务模块
│   ├── __init__.py           # 包初始化
│   ├── llm_service.py        # AI模型服务
│   ├── tts_service.py        # 语音合成服务
│   └── asr_service.py        # 语音识别服务
└── data/                     # 数据存储
    ├── sessions/             # 会话历史
    └── logs/                 # 系统日志
```

## 完整API文档

### 聊天对话API

```http
POST /api/chat
{
    "provider": "deepseek|kimi",
    "api_key": "your-api-key",
    "model": "DeepSeek-V3|moonshot-v1-8k",
    "messages": [{"role": "user", "content": "..."}],
    "temperature": 0.6
}
```

### 语音合成API

```http
POST /api/tts
{
    "text": "要合成的文本",
    "engine": "edge",
    "voice": "zh-CN-XiaoxiaoNeural",
    "rate": 1.0,
    "volume": 1.0
}
```

### 语音识别API

```http
POST /api/asr
Content-Type: multipart/form-data
{
    "audio": (音频文件),
    "engine": "browser|whisper",
    "language": "zh-CN"
}
```

### 系统状态API

```http
GET /api/status
GET /api/services/info
```

## 支持的服务矩阵

| 功能模块           | 服务提供商               | 支持的模型/引擎         | 状态        |
| ------------------ | ------------------------ | ----------------------- | ----------- |
| **LLM对话**  | DeepSeek (华为云MaaS)    | DeepSeek-V3             | ✅ 已集成   |
|                    | Kimi (月之暗面)          | moonshot-v1-8k/32k/128k | ✅ 已集成   |
| **语音合成** | Microsoft Edge TTS       | 20+种中文声音           | ✅ 已集成   |
|                    | Azure Cognitive Services | 企业级TTS               | 🔄 预留接口 |
| **语音识别** | Web Speech API           | 浏览器内置              | ✅ 已集成   |
|                    | OpenAI Whisper           | 多语言支持              | ✅ 已集成   |
| **3D渲染**   | Live2D Cubism SDK        | 虚拟角色交互            | ✅ 已集成   |

## 主要功能模块

### 🎨 Live2D虚拟角色

- **3D模型渲染** - 支持.moc3格式模型
- **表情动画** - 根据对话内容自动切换表情
- **交互响应** - 点击互动、说话动画同步
- **自定义模型** - 支持导入自定义Live2D模型

### 💬 智能会话系统

- **多轮对话** - 保持上下文记忆的连续对话
- **会话管理** - 自动创建、切换、删除会话
- **智能标题** - 根据首条消息自动生成会话标题
- **历史导出** - 支持JSON格式导出对话历史

### 🎤 语音交互系统

- **实时识别** - 浏览器原生语音识别
- **高质量合成** - Edge TTS多音色支持
- **参数调节** - 语速、音量、音调精细控制
- **多语言支持** - 中英文语音识别

### ⚙️ 系统设置中心

- **API管理** - 多提供商API Key配置
- **模型选择** - 支持不同AI模型切换
- **语音设置** - 声音、语速、音量调节
- **界面控制** - 面板折叠、主题切换

## 使用指南

### 1. 首次配置

1. 启动应用后访问 http://127.0.0.1:5000
2. 右侧控制面板 → 设置标签页
3. 配置LLM API Key (DeepSeek或Kimi)
4. 选择偏好的语音引擎和声音
5. 保存设置

### 2. 开始对话

- **文本输入** - 在底部输入框输入消息
- **语音输入** - 点击麦克风按钮进行语音输入
- **Live2D交互** - 点击左侧虚拟角色进行互动

### 3. 会话管理

- **新建会话** - 点击历史记录区域的"+"按钮
- **切换会话** - 点击历史记录中的任意会话
- **编辑标题** - 双击会话标题进行编辑
- **导出历史** - 使用导出按钮保存对话记录

## 常见问题与解决方案

**Q: Live2D模型不显示？**

- 检查static/live2d/目录下是否有模型文件
- 确认浏览器支持WebGL
- 查看浏览器控制台是否有加载错误

**Q: API调用失败？**

- 验证API Key格式和有效性
- 检查网络连接和防火墙设置
- 确认账户余额充足

**Q: 语音功能异常？**

- 允许浏览器麦克风和音频权限
- 检查系统音量和麦克风设置
- 推荐使用Chrome浏览器获得最佳体验

**Q: 会话历史丢失？**

- 检查浏览器localStorage是否被清除
- 定期导出重要对话记录
- 确保浏览器允许本地存储

## API Key获取指南

### DeepSeek (华为云MaaS)

1. 访问 [华为云MaaS控制台](https://console.huaweicloud.com/modelarts/)
2. 注册华为云账号并完成实名认证
3. 进入ModelArts → API管理 → 创建API Key
4. 复制API Key到应用设置中
5. API端点：`https://api.modelarts-maas.com/v1/chat/completions`

### Kimi (月之暗面)

1. 访问 [月之暗面开放平台](https://platform.moonshot.cn/)
2. 注册账号并登录控制台
3. 创建应用并获取API Key
4. 配置到应用设置中使用

## 开发扩展

### 添加新的LLM提供商

```python
# 在 services/llm_service.py 中添加
def _call_new_provider(self, messages, model, temperature, api_key, **kwargs):
    # 实现新的API调用逻辑
    pass
```

### 自定义Live2D模型

1. 将.moc3模型文件放入 `static/live2d/models/`
2. 更新模型配置文件
3. 修改 `live2d-manager.js` 中的加载路径

### 添加新的TTS引擎

```python
# 在 services/tts_service.py 中扩展
async def _generate_new_tts(self, text, voice, rate, volume, **kwargs):
    # 实现新的TTS生成逻辑
    pass
```

## 技术栈

- **后端框架**: Flask + Python 3.7+
- **前端技术**: HTML5 + CSS3 + ES6+ JavaScript
- **3D渲染**: Live2D Cubism SDK + WebGL
- **语音处理**: Edge TTS + Web Speech API
- **AI集成**: DeepSeek API + Kimi API
- **数据存储**: Browser LocalStorage + JSON
- **架构模式**: 模块化服务 + REST API

## 许可证与版权

本项目采用 GPL-3.0 开源许可证

⚠️ **重要提醒**:

- Live2D模型请确保具有合法使用授权
- API服务使用请遵守相应平台的服务条款
- 商业使用前请确认所有第三方资源的许可证

## 贡献与支持

欢迎提交Issue和Pull Request来改进项目！

### 贡献指南

1. Fork本项目
2. 创建特性分支
3. 提交更改
4. 发起Pull Request

🎉 **项目状态**: 功能完整，持续优化中
📅 **最后更新**: 2025年6月
⭐ **如果这个项目对您有帮助，请给个Star支持一下！**
