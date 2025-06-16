# AI语音助手

基于Web的智能语音对话系统，支持语音识别、AI对话和语音合成的完整工作流。

## 核心功能

- 🎤 **语音交互** - 支持语音输入和输出
- 🧠 **AI对话** - 集成DeepSeek、Kimi等大语言模型
- 💬 **会话管理** - 多轮对话与历史记录
- ⚙️ **参数调节** - 可调整语速、音量、温度等

## 快速开始

### 安装运行

```bash
# 克隆项目
git clone <repository-url>
cd ai_virtual_mate_web

# 安装依赖
pip install -r requirements.txt

# 启动服务
python app.py

# 访问应用
# 浏览器打开 http://127.0.0.1:5000
```

### 配置设置

1. **API配置** - 在右侧设置面板配置API Key
2. **DeepSeek** - 使用华为云MaaS API Key
3. **Kimi** - 使用月之暗面API Key

## 项目结构

```
├── app.py              # Flask主应用
├── templates/          # 前端模板
├── static/             # 静态资源 (CSS/JS)
├── services/           # 核心服务模块
│   ├── llm_service.py  # AI模型服务
│   ├── tts_service.py  # 语音合成
│   └── asr_service.py  # 语音识别
└── requirements.txt    # 依赖包
```

## API接口

### 聊天API
```http
POST /api/chat
{
    "provider": "deepseek",
    "api_key": "your-api-key",
    "model": "DeepSeek-V3",
    "messages": [...],
    "temperature": 0.6
}
```

### 语音合成API
```http
POST /api/tts
{
    "text": "要合成的文本",
    "engine": "edge",
    "voice": "zh-CN-XiaoxiaoNeural"
}
```

## 支持的服务

| 类型 | 服务商 | 模型/引擎 |
|------|--------|-----------|
| LLM | DeepSeek (华为云MaaS) | DeepSeek-V3 |
|     | Kimi (月之暗面) | moonshot-v1-8k/32k/128k |
| TTS | Microsoft Edge TTS | 20+种中文声音 |
| ASR | Web Speech API | 浏览器内置 |
|     | OpenAI Whisper | 多语言支持 |

## 常见问题

**Q: API调用失败？**
- 检查API Key是否正确
- 确认账户余额充足
- 验证网络连接

**Q: 语音功能不工作？**
- 允许浏览器麦克风权限
- 检查系统音量设置
- 推荐使用Chrome浏览器

**Q: 模块导入错误？**
- 确保services目录有__init__.py文件
- 检查Python环境和依赖

## 获取API Key

### DeepSeek (华为云MaaS)
1. 访问 [华为云MaaS控制台](https://console.huaweicloud.com/modelarts/)
2. 注册并登录华为云账号
3. 创建API Key
4. API地址：`https://api.modelarts-maas.com/v1/chat/completions`

### Kimi (月之暗面)
1. 访问 [月之暗面开放平台](https://platform.moonshot.cn/)
2. 注册并登录账号
3. 在控制台创建API Key

## 许可证

GPL-3.0 开源许可证

## 联系方式

- Email: swordswind@qq.com
- GitHub: [swordswind](https://github.com/swordswind)