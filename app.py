from flask import Flask, request, jsonify, render_template, send_file
import asyncio
import logging
from datetime import datetime
import os
import tempfile

# 导入服务模块
from services import LLMService, TTSService, ASRService

app = Flask(__name__)

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 初始化服务
llm_service = LLMService()
tts_service = TTSService()
asr_service = ASRService()

@app.route('/')
def index():
    """主页"""
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    """聊天API"""
    try:
        data = request.json
        provider = data.get('provider', 'openai')
        api_key = data.get('api_key', '')
        model = data.get('model', 'gpt-3.5-turbo')
        messages = data.get('messages', [])
        temperature = float(data.get('temperature', 0.7))
        
        # 验证配置
        validation = llm_service.validate_config(provider, api_key, model)
        if not validation['valid']:
            return jsonify({'error': f"配置错误: {', '.join(validation['errors'])}"}), 400
        
        # 调用LLM服务
        response = llm_service.call_llm(
            provider=provider,
            messages=messages,
            model=model,
            temperature=temperature,
            api_key=api_key
        )
        
        logger.info(f"Chat request processed: {provider}, model: {model}")
        
        return jsonify({
            'response': response,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        return jsonify({'error': f'处理请求时出错: {str(e)}'}), 500

@app.route('/api/tts', methods=['POST'])
def text_to_speech():
    """语音合成API"""
    try:
        data = request.json
        text = data.get('text', '').strip()
        engine = data.get('engine', 'edge')
        voice = data.get('voice', 'zh-CN-XiaoxiaoNeural')
        rate = float(data.get('rate', 1.0))
        volume = float(data.get('volume', 1.0))
        
        logger.info(f"TTS请求收到: text='{text[:50]}...', length={len(text)}")
        
        if not text:
            return jsonify({'error': '文本不能为空'}), 400
        
        # 简化文本清理 - 只移除明显的技术内容
        cleaned_text = text
        
        # 移除明显的URL和邮箱
        import re
        cleaned_text = re.sub(r'https?://[^\s]+', '', cleaned_text)
        cleaned_text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '', cleaned_text)
        
        # 移除极长的字符串（可能是API Key）
        cleaned_text = re.sub(r'\b[A-Za-z0-9]{25,}\b', '', cleaned_text)
        
        # 清理空白
        cleaned_text = re.sub(r'\s+', ' ', cleaned_text).strip()
        
        # 如果清理后文本太短，使用原文本
        if len(cleaned_text) < 5:
            cleaned_text = text[:100]  # 截取前100个字符
        
        logger.info(f"TTS清理后文本: '{cleaned_text[:50]}...', length={len(cleaned_text)}")
        
        # 验证配置
        validation = tts_service.validate_config(engine, voice, rate, volume)
        if not validation['valid']:
            return jsonify({'error': f"配置错误: {', '.join(validation['errors'])}"}), 400
        
        # 运行异步TTS生成
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            audio_path = loop.run_until_complete(
                tts_service.generate_speech(
                    text=cleaned_text,
                    engine=engine,
                    voice=voice,
                    rate=rate,
                    volume=volume
                )
            )
            
            logger.info(f"TTS生成成功: audio_path={audio_path}")
            
            # 检查文件是否存在且有内容
            if not os.path.exists(audio_path):
                logger.error(f"TTS音频文件不存在: {audio_path}")
                return jsonify({'error': '音频文件生成失败'}), 500
            
            file_size = os.path.getsize(audio_path)
            if file_size == 0:
                logger.error(f"TTS音频文件为空: {audio_path}")
                return jsonify({'error': '音频文件为空'}), 500
                
            logger.info(f"TTS音频文件大小: {file_size} bytes")
            
            # 返回音频文件
            response = send_file(
                audio_path,
                mimetype='audio/mpeg',
                as_attachment=False
            )
            
            # 设置清理函数
            @response.call_on_close
            def cleanup():
                try:
                    if os.path.exists(audio_path):
                        os.unlink(audio_path)
                        logger.debug(f"清理临时文件: {audio_path}")
                except Exception as e:
                    logger.warning(f"清理文件失败: {e}")
            
            return response
            
        finally:
            loop.close()
            
    except Exception as e:
        logger.error(f"TTS处理错误: {str(e)}", exc_info=True)
        return jsonify({'error': f'语音合成失败: {str(e)}'}), 500

# 新增API：预览TTS文本
@app.route('/api/tts/preview', methods=['POST'])
def preview_tts_text():
    """预览TTS文本处理结果"""
    try:
        data = request.json
        text = data.get('text', '')
        
        cleaned_text = tts_service.preview_tts_text(text)
        
        return jsonify({
            'original_text': text,
            'cleaned_text': cleaned_text,
            'original_length': len(text),
            'cleaned_length': len(cleaned_text),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"TTS preview error: {str(e)}")
        return jsonify({'error': f'文本预览失败: {str(e)}'}), 500

@app.route('/api/asr', methods=['POST'])
def speech_to_text():
    """语音识别API"""
    try:
        # 获取参数
        engine = request.form.get('engine', 'browser')
        language = request.form.get('language', 'zh-CN')
        api_key = request.form.get('api_key', '')
        
        # 验证配置
        validation = asr_service.validate_config(
            engine=engine,
            language=language,
            api_key=api_key
        )
        if not validation['valid']:
            return jsonify({'error': f"配置错误: {', '.join(validation['errors'])}"}), 400
        
        # 获取音频数据
        if 'audio' not in request.files:
            return jsonify({'error': '未找到音频文件'}), 400
        
        audio_file = request.files['audio']
        audio_data = audio_file.read()
        
        # 运行异步ASR识别
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            result = loop.run_until_complete(
                asr_service.recognize_speech(
                    audio_data=audio_data,
                    engine=engine,
                    language=language,
                    api_key=api_key
                )
            )
            
            logger.info(f"ASR processed: engine: {engine}, language: {language}")
            
            return jsonify({
                'text': result,
                'engine': engine,
                'language': language,
                'timestamp': datetime.now().isoformat()
            })
            
        finally:
            loop.close()
            
    except Exception as e:
        logger.error(f"ASR error: {str(e)}")
        return jsonify({'error': f'语音识别失败: {str(e)}'}), 500

@app.route('/api/services/info')
def services_info():
    """获取服务信息"""
    return jsonify({
        'llm': {
            'providers': llm_service.get_supported_providers()
        },
        'tts': {
            'engines': tts_service.get_supported_engines(),
            'voices': tts_service.get_voices('edge')
        },
        'asr': {
            'engines': asr_service.get_supported_engines(),
            'languages': asr_service.get_supported_languages()
        }
    })

@app.route('/api/status')
def status():
    """系统状态API"""
    return jsonify({
        'status': 'running',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0',
        'services': {
            'llm': 'ready',
            'tts': 'ready',
            'asr': 'ready'
        }
    })

@app.route('/api/history', methods=['GET'])
def get_history():
    """获取聊天历史"""
    try:
        # 这里可以从数据库或文件中读取历史记录
        # 目前返回空列表，实际历史记录在前端管理
        return jsonify({
            'history': [],
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Get history error: {str(e)}")
        return jsonify({'error': f'获取历史记录失败: {str(e)}'}), 500

@app.route('/api/history', methods=['POST'])
def save_history():
    """保存聊天历史"""
    try:
        data = request.json
        history = data.get('history', [])
        
        # 这里可以将历史记录保存到数据库或文件
        # 目前只返回成功状态
        
        logger.info(f"History saved: {len(history)} messages")
        
        return jsonify({
            'success': True,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Save history error: {str(e)}")
        return jsonify({'error': f'保存历史记录失败: {str(e)}'}), 500

@app.route('/api/history', methods=['DELETE'])
def clear_history():
    """清空聊天历史"""
    try:
        # 这里可以清空数据库或文件中的历史记录
        
        logger.info("History cleared")
        
        return jsonify({
            'success': True,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Clear history error: {str(e)}")
        return jsonify({'error': f'清空历史记录失败: {str(e)}'}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': '接口不存在'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': '服务器内部错误'}), 500

if __name__ == '__main__':
    print("🚀 AI语音助手启动中...")
    print("📝 访问地址: http://127.0.0.1:5000")
    print("⚙️  请在设置中配置API Key")
    
    app.run(host='127.0.0.1', port=5000, debug=True)
