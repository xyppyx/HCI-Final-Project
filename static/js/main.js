class VoiceAssistant {
    constructor() {
        this.isRecording = false;
        this.recognition = null;
        this.conversationHistory = [];
        this.conversationSessions = [];
        this.currentSession = null;
        this.settings = this.loadSettings();
        this.currentTab = 'history';
        
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initialize();
            });
        } else {
            this.initialize();
        }
    }

    initialize() {
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeSpeechRecognition();
        this.updateSettingsUI();
        this.initializePanels();
        this.loadConversationSessions();
    }

    // 初始化DOM元素
    initializeElements() {
        this.elements = {
            // 主要界面元素
            textInput: document.getElementById('textInput'),
            sendBtn: document.getElementById('sendBtn'),
            recordBtn: document.getElementById('recordBtn'),
            chatContainer: document.getElementById('chatContainer'),
            recordingIndicator: document.getElementById('recordingIndicator'),
            loadingIndicator: document.getElementById('loadingIndicator'),
            
            // 面板控制
            leftPanel: document.querySelector('.left-panel'),
            rightPanel: document.querySelector('.right-panel'),
            toggleLeftPanel: document.getElementById('toggleLeftPanel'),
            toggleRightPanel: document.getElementById('toggleRightPanel'),
            
            // 历史记录
            historyList: document.getElementById('historyList'),
            clearHistoryBtn: document.getElementById('clearHistoryBtn'),
            exportHistoryBtn: document.getElementById('exportHistoryBtn'),
            
            // 标签页
            tabBtns: document.querySelectorAll('.tab-btn'),
            tabContents: document.querySelectorAll('.tab-content'),
            
            // 状态指示器
            asrStatus: document.getElementById('asrStatus'),
            llmStatus: document.getElementById('llmStatus'),
            ttsStatus: document.getElementById('ttsStatus')
        };

        // 检查必要元素是否存在
        const requiredElements = ['textInput', 'sendBtn', 'recordBtn', 'chatContainer'];
        requiredElements.forEach(elementName => {
            if (!this.elements[elementName]) {
                console.error(`Required element not found: ${elementName}`);
            }
        });
    }

    // 初始化事件监听器
    initializeEventListeners() {
        try {
            // 发送消息事件
            if (this.elements.sendBtn) {
                this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
            }

            // 输入框回车事件和自动调整高度
            if (this.elements.textInput) {
                // 回车发送消息（Shift+Enter换行）
                this.elements.textInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        this.sendMessage();
                    }
                });

                // 自动调整textarea高度
                this.elements.textInput.addEventListener('input', () => {
                    this.autoResizeTextarea(this.elements.textInput);
                });

                // 初始化时调整一次高度
                this.autoResizeTextarea(this.elements.textInput);
            }

            // 录音事件
            if (this.elements.recordBtn) {
                this.elements.recordBtn.addEventListener('click', () => this.toggleRecording());
            }

            // 面板折叠事件
            if (this.elements.toggleLeftPanel) {
                this.elements.toggleLeftPanel.addEventListener('click', () => this.toggleLeftPanel());
            }
            if (this.elements.toggleRightPanel) {
                this.elements.toggleRightPanel.addEventListener('click', () => this.toggleRightPanel());
            }

            // 清空历史事件
            if (this.elements.clearHistoryBtn) {
                this.elements.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
            }

            // 导出历史事件
            if (this.elements.exportHistoryBtn) {
                this.elements.exportHistoryBtn.addEventListener('click', () => this.exportHistory());
            }

            // 新对话按钮
            const newConversationBtn = document.getElementById('newConversationBtn');
            if (newConversationBtn) {
                newConversationBtn.addEventListener('click', () => this.startNewConversation());
            }

            // 标签页切换事件
            this.elements.tabBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const tabName = btn.dataset.tab;
                    this.switchTab(tabName);
                });
            });

            // 设置相关事件
            this.initializeSettingsEvents();

            console.log('所有事件监听器已初始化');

        } catch (error) {
            console.error('初始化事件监听器时出错:', error);
        }
    }

    // 自动调整textarea高度
    autoResizeTextarea(textarea) {
        if (!textarea) return;
        
        // 重置高度以获得正确的scrollHeight
        textarea.style.height = 'auto';
        
        // 计算新高度
        const minHeight = 24;
        const maxHeight = 120;
        const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
        
        // 设置新高度
        textarea.style.height = newHeight + 'px';
        
        // 如果内容超过最大高度，显示滚动条
        if (textarea.scrollHeight > maxHeight) {
            textarea.style.overflowY = 'auto';
        } else {
            textarea.style.overflowY = 'hidden';
        }
    }

    // 初始化设置相关事件
    initializeSettingsEvents() {
        // 保存设置按钮
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        }

        // 重置设置按钮
        const resetSettingsBtn = document.getElementById('resetSettingsBtn');
        if (resetSettingsBtn) {
            resetSettingsBtn.addEventListener('click', () => this.resetSettings());
        }

        // LLM Provider变化时更新模型选择
        const llmProviderSelect = document.getElementById('llmProvider');
        if (llmProviderSelect) {
            llmProviderSelect.addEventListener('change', () => this.updateModelOptions());
        }

        // 滑块值显示更新
        const rangeInputs = ['temperature', 'speechRate', 'speechVolume', 'asrSensitivity'];
        rangeInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            const valueDisplay = document.getElementById(inputId + 'Value');
            if (input && valueDisplay) {
                input.addEventListener('input', () => {
                    valueDisplay.textContent = input.value;
                });
            }
        });

        // 设置组折叠/展开
        const groupHeaders = document.querySelectorAll('.group-header');
        groupHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const groupId = header.getAttribute('onclick')?.match(/toggleGroup\('(.+)'\)/)?.[1];
                if (groupId) {
                    this.toggleGroup(groupId);
                }
            });
        });
    }

    // 切换标签页
    switchTab(tabName) {
        // 更新标签按钮状态
        this.elements.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // 更新内容显示
        this.elements.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === tabName + 'Tab');
        });

        this.currentTab = tabName;
    }

    // 切换设置组
    toggleGroup(groupId) {
        const groupContent = document.getElementById(groupId);
        const groupHeader = document.querySelector(`[onclick*="${groupId}"]`);
        
        if (groupContent && groupHeader) {
            const isCollapsed = groupContent.classList.toggle('collapsed');
            const toggleIcon = groupHeader.querySelector('.toggle-icon');
            
            if (toggleIcon) {
                toggleIcon.textContent = isCollapsed ? '▶' : '▼';
            }
            
            groupHeader.classList.toggle('collapsed', isCollapsed);
        }
    }

    // 切换左侧面板
    toggleLeftPanel() {
        const isCollapsed = this.elements.leftPanel.classList.toggle('collapsed');
        this.elements.toggleLeftPanel.textContent = isCollapsed ? '▶' : '◀';
        
        const appContainer = document.querySelector('.app-container');
        if (appContainer) {
            appContainer.classList.toggle('left-collapsed', isCollapsed);
        }
        
        // 保存状态
        const panelStates = JSON.parse(localStorage.getItem('panelStates') || '{}');
        panelStates.leftCollapsed = isCollapsed;
        localStorage.setItem('panelStates', JSON.stringify(panelStates));
    }

    // 切换右侧面板
    toggleRightPanel() {
        const isCollapsed = this.elements.rightPanel.classList.toggle('collapsed');
        this.elements.toggleRightPanel.textContent = isCollapsed ? '◀' : '▶';
        
        const appContainer = document.querySelector('.app-container');
        if (appContainer) {
            appContainer.classList.toggle('right-collapsed', isCollapsed);
        }
        
        // 保存状态
        const panelStates = JSON.parse(localStorage.getItem('panelStates') || '{}');
        panelStates.rightCollapsed = isCollapsed;
        localStorage.setItem('panelStates', JSON.stringify(panelStates));
    }

    // 初始化面板状态
    initializePanels() {
        const panelStates = JSON.parse(localStorage.getItem('panelStates') || '{}');
        const appContainer = document.querySelector('.app-container');
        
        if (panelStates.leftCollapsed && this.elements.leftPanel) {
            this.elements.leftPanel.classList.add('collapsed');
            if (this.elements.toggleLeftPanel) {
                this.elements.toggleLeftPanel.textContent = '▶';
            }
            if (appContainer) {
                appContainer.classList.add('left-collapsed');
            }
        }
        
        if (panelStates.rightCollapsed && this.elements.rightPanel) {
            this.elements.rightPanel.classList.add('collapsed');
            if (this.elements.toggleRightPanel) {
                this.elements.toggleRightPanel.textContent = '◀';
            }
            if (appContainer) {
                appContainer.classList.add('right-collapsed');
            }
        }
    }

    // 更新状态指示器
    updateStatus(service, status) {
        const statusElement = this.elements[service + 'Status'];
        if (!statusElement) return;

        statusElement.className = 'status-dot';
        if (status) {
            statusElement.classList.add(status);
        }
    }

    // 显示加载指示器
    showLoading() {
        if (this.elements.loadingIndicator) {
            this.elements.loadingIndicator.classList.add('active');
        }
    }

    // 隐藏加载指示器
    hideLoading() {
        if (this.elements.loadingIndicator) {
            this.elements.loadingIndicator.classList.remove('active');
        }
    }

    // 显示通知
    showNotification(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // 简单的通知实现
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
            background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
        `;
        
        document.body.appendChild(notification);
        
        // 显示通知
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 100);
        
        // 3秒后移除通知
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // 发送消息
    async sendMessage() {
        const message = this.elements.textInput.value.trim();
        if (!message) return;

        console.log('发送消息:', message);

        this.addMessage(message, 'user');
        this.elements.textInput.value = '';
        
        // 重置textarea高度
        this.autoResizeTextarea(this.elements.textInput);

        this.showLoading();
        this.updateStatus('llm', 'processing');

        try {
            const response = await this.callLLM(message);
            console.log('LLM响应:', response.substring(0, 100));
            
            this.addMessage(response, 'assistant');
            
            this.updateStatus('llm', 'active');
            setTimeout(() => this.updateStatus('llm', ''), 1000);
            
            if (this.settings.enableTTS !== false) {
                console.log('开始TTS处理...');
                await this.speakText(response);
            }

            this.updateHistoryDisplay();

        } catch (error) {
            console.error('消息处理错误:', error);
            this.addMessage('抱歉，处理您的请求时出现了错误。', 'assistant');
            this.updateStatus('llm', 'error');
            this.showNotification('处理请求失败，请检查设置', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // 调用LLM API
    async callLLM(message) {
        const messages = [...this.conversationHistory, { role: 'user', content: message }];
        
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                provider: this.settings.llmProvider,
                api_key: this.settings.apiKey,
                model: this.settings.modelName,
                messages: messages,
                temperature: this.settings.temperature
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '请求失败');
        }

        const data = await response.json();
        return data.response;
    }

    // 语音合成
    async speakText(text) {
        try {
            console.log('TTS开始处理:', text.substring(0, 100));
            
            if (!text || text.trim().length < 2) {
                console.warn('TTS: 文本过短，跳过');
                return;
            }
            
            this.updateStatus('tts', 'processing');
            
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text.trim(),
                    voice: this.settings.voiceSelect,
                    rate: this.settings.speechRate,
                    volume: this.settings.speechVolume,
                    engine: this.settings.ttsEngine
                })
            });

            console.log('TTS响应状态:', response.status);

            if (response.ok) {
                const audioBlob = await response.blob();
                console.log('TTS音频大小:', audioBlob.size, 'bytes');
                
                if (audioBlob.size === 0) {
                    console.error('TTS: 接收到空的音频文件');
                    this.updateStatus('tts', 'error');
                    return;
                }
                
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);
                
                return new Promise((resolve) => {
                    audio.onended = () => {
                        URL.revokeObjectURL(audioUrl);
                        this.updateStatus('tts', 'active');
                        setTimeout(() => this.updateStatus('tts', ''), 1000);
                        resolve();
                    };
                    
                    audio.onerror = (e) => {
                        console.error('TTS: 音频播放失败', e);
                        URL.revokeObjectURL(audioUrl);
                        this.updateStatus('tts', 'error');
                        resolve();
                    };
                    
                    audio.play().then(() => {
                        console.log('TTS: 音频播放成功启动');
                    }).catch(err => {
                        console.error('TTS: 音频播放启动失败:', err);
                        URL.revokeObjectURL(audioUrl);
                        this.updateStatus('tts', 'error');
                        resolve();
                    });
                });
            } else {
                const errorText = await response.text();
                console.error('TTS API错误:', response.status, errorText);
                this.updateStatus('tts', 'error');
                this.showNotification(`语音合成失败: ${response.status}`, 'error');
            }
        } catch (error) {
            console.error('TTS处理错误:', error);
            this.updateStatus('tts', 'error');
            this.showNotification('语音合成出错', 'error');
        }
    }

    // 创建新会话
    createNewSession() {
        const sessionId = Date.now().toString();
        const session = {
            id: sessionId,
            title: '新对话',
            timestamp: new Date().toISOString(),
            messages: [],
            isActive: true
        };
        
        this.conversationSessions.forEach(s => s.isActive = false);
        this.conversationSessions.unshift(session);
        this.currentSession = session;
        this.conversationHistory = [];
        
        this.updateHistoryDisplay();
        this.saveConversationSessions();
        
        console.log('创建新会话:', sessionId);
    }

    // 更新历史记录显示
    updateHistoryDisplay() {
        if (!this.elements.historyList) return;
        
        if (this.conversationSessions.length === 0) {
            this.elements.historyList.innerHTML = `
                <div class="history-item">
                    <div class="history-preview">暂无对话记录</div>
                </div>
            `;
            return;
        }
        
        const historyItems = this.conversationSessions.map(session => {
            const isActive = session.isActive ? ' active' : '';
            const time = new Date(session.timestamp).toLocaleString('zh-CN', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const messageCount = session.messages.length;
            const preview = session.title;
            
            return `
                <div class="history-item${isActive}" data-session-id="${session.id}">
                    <div class="history-header">
                        <div class="history-time">${time}</div>
                        <button class="delete-session-btn" data-session-id="${session.id}" title="删除对话">🗑️</button>
                    </div>
                    <div class="history-preview">${preview}</div>
                    <div class="history-meta">${messageCount} 条消息</div>
                </div>
            `;
        }).join('');
        
        this.elements.historyList.innerHTML = historyItems;
        
        // 重新绑定事件
        this.bindHistoryEvents();
    }

    // 绑定历史记录事件
    bindHistoryEvents() {
        if (!this.elements.historyList) return;

        this.elements.historyList.querySelectorAll('.history-item').forEach(item => {
            if (!item.classList.contains('active')) {
                item.addEventListener('click', (e) => {
                    if (e.target.classList.contains('delete-session-btn')) return;
                    const sessionId = item.dataset.sessionId;
                    this.switchToSession(sessionId);
                });
            }
        });
        
        this.elements.historyList.querySelectorAll('.delete-session-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const sessionId = btn.dataset.sessionId;
                if (confirm('确定要删除这个对话吗？')) {
                    this.deleteSession(sessionId);
                }
            });
        });
    }

    // 添加消息
    addMessage(content, role) {
        this.addMessageToUI(content, role, true);
    }

    // 添加消息到UI
    addMessageToUI(content, role, saveToHistory = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const now = new Date();
        const timeStr = now.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        messageDiv.innerHTML = `
            <div class="message-avatar">
                ${role === 'user' ? '👤' : '🤖'}
            </div>
            <div>
                <div class="message-content">${content}</div>
                <div class="message-time">${timeStr}</div>
            </div>
        `;

        const welcomeMessage = this.elements.chatContainer.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }

        this.elements.chatContainer.appendChild(messageDiv);
        this.elements.chatContainer.scrollTop = this.elements.chatContainer.scrollHeight;
        
        if (saveToHistory) {
            this.conversationHistory.push({ role, content });
            this.saveMessageToSession(role, content);
        }
    }

    // 保存消息到会话
    saveMessageToSession(role, content) {
        if (!this.currentSession) {
            this.createNewSession();
        }
        
        const message = {
            role: role,
            content: content,
            timestamp: new Date().toISOString()
        };
        
        this.currentSession.messages.push(message);
        
        if (role === 'user' && this.currentSession.messages.filter(m => m.role === 'user').length === 1) {
            this.currentSession.title = this.generateSessionTitle(this.currentSession.messages);
        }
        
        this.currentSession.timestamp = new Date().toISOString();
        
        this.saveConversationSessions();
        this.updateHistoryDisplay();
    }

    // 生成会话标题
    generateSessionTitle(messages) {
        if (messages.length === 0) return '新对话';
        
        const firstUserMessage = messages.find(msg => msg.role === 'user');
        if (firstUserMessage) {
            let title = firstUserMessage.content.substring(0, 20);
            if (firstUserMessage.content.length > 20) {
                title += '...';
            }
            return title;
        }
        
        return '新对话';
    }

    // 加载会话历史
    loadConversationSessions() {
        const saved = localStorage.getItem('conversationSessions');
        if (saved) {
            this.conversationSessions = JSON.parse(saved);
            
            const activeSession = this.conversationSessions.find(s => s.isActive);
            if (activeSession) {
                this.currentSession = activeSession;
                this.conversationHistory = activeSession.messages || [];
            }
        }
        
        if (this.conversationSessions.length === 0) {
            this.createNewSession();
        }
    }

    // 保存会话历史
    saveConversationSessions() {
        if (this.conversationSessions.length > 20) {
            this.conversationSessions = this.conversationSessions.slice(0, 20);
        }
        
        localStorage.setItem('conversationSessions', JSON.stringify(this.conversationSessions));
    }

    // 切换到指定会话
    switchToSession(sessionId) {
        const session = this.conversationSessions.find(s => s.id === sessionId);
        if (!session) return;
        
        if (this.currentSession) {
            this.currentSession.isActive = false;
        }
        
        session.isActive = true;
        this.currentSession = session;
        this.conversationHistory = session.messages || [];
        
        this.renderChatFromHistory();
        this.updateHistoryDisplay();
        this.saveConversationSessions();
        
        console.log('切换到会话:', sessionId, session.title);
    }

    // 从历史记录重新渲染聊天界面
    renderChatFromHistory() {
        this.elements.chatContainer.innerHTML = '';
        
        if (this.conversationHistory.length === 0) {
            this.elements.chatContainer.innerHTML = `
                <div class="welcome-message">
                    <p>👋 你好！我是您的AI语音助手，有什么可以帮助您的吗？</p>
                </div>
            `;
            return;
        }
        
        this.conversationHistory.forEach(message => {
            this.addMessageToUI(message.content, message.role, false);
        });
    }

    // 删除会话
    deleteSession(sessionId) {
        const sessionIndex = this.conversationSessions.findIndex(s => s.id === sessionId);
        if (sessionIndex === -1) return;
        
        const wasActive = this.conversationSessions[sessionIndex].isActive;
        this.conversationSessions.splice(sessionIndex, 1);
        
        if (wasActive) {
            if (this.conversationSessions.length > 0) {
                this.switchToSession(this.conversationSessions[0].id);
            } else {
                this.createNewSession();
            }
        }
        
        this.updateHistoryDisplay();
        this.saveConversationSessions();
    }

    // 开始新对话
    startNewConversation() {
        this.createNewSession();
        this.elements.chatContainer.innerHTML = `
            <div class="welcome-message">
                <p>👋 你好！我是您的AI语音助手，有什么可以帮助您的吗？</p>
            </div>
        `;
        this.showNotification('已开始新对话', 'success');
    }

    // 清空历史
    clearHistory() {
        if (confirm('确定要清空当前对话吗？')) {
            if (this.currentSession) {
                this.currentSession.messages = [];
                this.currentSession.title = '新对话';
            }
            this.conversationHistory = [];
            this.elements.chatContainer.innerHTML = `
                <div class="welcome-message">
                    <p>👋 你好！我是您的AI语音助手，有什么可以帮助您的吗？</p>
                </div>
            `;
            this.updateHistoryDisplay();
            this.saveConversationSessions();
            this.showNotification('当前对话已清空', 'success');
        }
    }

    // 导出历史
    exportHistory() {
        const exportData = {
            timestamp: new Date().toISOString(),
            totalSessions: this.conversationSessions.length,
            sessions: this.conversationSessions,
            settings: this.settings
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `chat_sessions_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showNotification('对话历史已导出', 'success');
    }

    // 加载设置
    loadSettings() {
        const defaultSettings = {
            llmProvider: 'deepseek',
            apiKey: '',
            modelName: 'DeepSeek-V3',
            temperature: 0.6,
            ttsEngine: 'edge',
            voiceSelect: 'zh-CN-XiaoxiaoNeural',
            speechRate: 1.0,
            speechVolume: 1.0,
            asrEngine: 'browser',
            asrLanguage: 'zh-CN',
            asrSensitivity: 5,
            enableTTS: true
        };

        const saved = localStorage.getItem('voiceAssistantSettings');
        return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    }

    // 保存设置
    saveSettings() {
        const settingElements = [
            'llmProvider', 'apiKey', 'modelName', 'temperature',
            'ttsEngine', 'voiceSelect', 'speechRate', 'speechVolume',
            'asrEngine', 'asrLanguage', 'asrSensitivity', 'enableTTS'
        ];

        settingElements.forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    this.settings[key] = element.checked;
                } else {
                    let value = element.value;
                    if (['temperature', 'speechRate', 'speechVolume', 'asrSensitivity'].includes(key)) {
                        value = parseFloat(value);
                        if (key === 'speechVolume') {
                            value = Math.max(0.5, Math.min(1.5, value));
                        }
                    }
                    this.settings[key] = value;
                }
            }
        });

        localStorage.setItem('voiceAssistantSettings', JSON.stringify(this.settings));
        
        if (this.recognition) {
            this.recognition.lang = this.settings.asrLanguage;
        }

        this.showNotification('设置已保存', 'success');
        console.log('保存的设置:', this.settings);
    }

    // 重置设置
    resetSettings() {
        if (confirm('确定要重置所有设置吗？')) {
            localStorage.removeItem('voiceAssistantSettings');
            this.settings = this.loadSettings();
            this.updateSettingsUI();
            this.showNotification('设置已重置', 'success');
        }
    }

    // 更新设置UI
    updateSettingsUI() {
        Object.keys(this.settings).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = this.settings[key];
                } else {
                    element.value = this.settings[key];
                }
                
                const valueDisplays = {
                    temperature: 'temperatureValue',
                    speechRate: 'rateValue',
                    speechVolume: 'volumeValue',
                    asrSensitivity: 'sensitivityValue'
                };
                
                const displayEl = document.getElementById(valueDisplays[key]);
                if (displayEl) {
                    displayEl.textContent = this.settings[key];
                }
            }
        });
        
        this.updateModelOptions();
    }

    // 更新模型选择选项
    updateModelOptions() {
        const providerSelect = document.getElementById('llmProvider');
        const modelSelect = document.getElementById('modelName');
        
        if (!providerSelect || !modelSelect) return;
        
        const provider = providerSelect.value;
        
        modelSelect.innerHTML = '';
        
        let modelOptions = [];
        
        if (provider === 'deepseek') {
            modelOptions = [
                { value: 'DeepSeek-V3', text: 'DeepSeek-V3' }
            ];
        } else if (provider === 'kimi') {
            modelOptions = [
                { value: 'moonshot-v1-8k', text: 'Moonshot v1 8K' },
                { value: 'moonshot-v1-32k', text: 'Moonshot v1 32K' },
                { value: 'moonshot-v1-128k', text: 'Moonshot v1 128K' }
            ];
        }
        
        modelOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.text;
            modelSelect.appendChild(optionElement);
        });
        
        if (this.settings.modelName) {
            const savedModel = Array.from(modelSelect.options).find(
                option => option.value === this.settings.modelName
            );
            if (savedModel) {
                modelSelect.value = this.settings.modelName;
            }
        }
    }

    // 初始化语音识别
    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = this.settings.asrLanguage;
            
            this.recognition.onstart = () => {
                console.log('语音识别开始');
                this.updateStatus('asr', 'processing');
            };
            
            this.recognition.onresult = (event) => {
                const result = event.results[0][0].transcript;
                console.log('语音识别结果:', result);
                this.elements.textInput.value = result;
                this.updateStatus('asr', 'active');
                setTimeout(() => this.updateStatus('asr', ''), 1000);
            };
            
            this.recognition.onerror = (event) => {
                console.error('语音识别错误:', event.error);
                this.updateStatus('asr', 'error');
                this.showNotification('语音识别失败', 'error');
            };
            
            this.recognition.onend = () => {
                console.log('语音识别结束');
                this.isRecording = false;
                this.elements.recordBtn.classList.remove('recording');
                this.elements.recordingIndicator.classList.remove('active');
            };
        } else {
            console.warn('浏览器不支持语音识别');
        }
    }

    // 切换录音状态
    toggleRecording() {
        if (!this.recognition) {
            this.showNotification('浏览器不支持语音识别', 'error');
            return;
        }

        if (this.isRecording) {
            this.recognition.stop();
        } else {
            this.recognition.start();
            this.isRecording = true;
            this.elements.recordBtn.classList.add('recording');
            this.elements.recordingIndicator.classList.add('active');
        }
    }
}

// 全局函数 - 保持向后兼容
function toggleGroup(groupId) {
    if (window.voiceAssistant) {
        window.voiceAssistant.toggleGroup(groupId);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM加载完成，初始化语音助手...');
    window.voiceAssistant = new VoiceAssistant();
});

// 如果DOM已经加载完成
if (document.readyState !== 'loading') {
    console.log('DOM已加载，直接初始化语音助手...');
    window.voiceAssistant = new VoiceAssistant();
}
