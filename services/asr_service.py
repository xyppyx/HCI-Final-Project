import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class ASRService:
    """语音识别服务"""
    
    def __init__(self):
        self.supported_engines = {
            'browser': self._browser_asr,
            'whisper': self._whisper_asr
        }
        
        self.supported_languages = {
            'zh-CN': '中文',
            'en-US': '英语',
            'ja-JP': '日语',
            'ko-KR': '韩语'
        }
    
    def get_supported_engines(self) -> List[str]:
        """获取支持的ASR引擎列表"""
        return list(self.supported_engines.keys())
    
    def get_supported_languages(self) -> Dict[str, str]:
        """获取支持的语言列表"""
        return self.supported_languages
    
    async def recognize_speech(self, audio_data: bytes, engine: str = 'browser',
                             language: str = 'zh-CN', api_key: str = '',
                             **kwargs) -> str:
        """
        识别语音
        
        Args:
            audio_data: 音频数据
            engine: 识别引擎
            language: 语言代码
            api_key: API密钥（Whisper需要）
            
        Returns:
            识别结果文本
        """
        if engine not in self.supported_engines:
            raise ValueError(f"不支持的ASR引擎: {engine}")
        
        try:
            return await self.supported_engines[engine](
                audio_data, language, api_key, **kwargs
            )
        except Exception as e:
            logger.error(f"ASR识别失败 [{engine}]: {str(e)}")
            raise
    
    async def _browser_asr(self, audio_data: bytes, language: str, 
                          api_key: str, **kwargs) -> str:
        """浏览器内置ASR (实际在前端处理)"""
        # 浏览器ASR在前端处理，这里只是占位
        return "浏览器ASR在前端处理"
    
    async def _whisper_asr(self, audio_data: bytes, language: str,
                          api_key: str, **kwargs) -> str:
        """Whisper ASR"""
        # 实现Whisper API调用
        import requests
        import tempfile
        import os
        
        # 保存音频到临时文件
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            temp_file.write(audio_data)
            temp_path = temp_file.name
        
        try:
            headers = {'Authorization': f'Bearer {api_key}'}
            files = {'file': open(temp_path, 'rb')}
            data = {
                'model': 'whisper-1',
                'language': language.split('-')[0]  # 转换为ISO语言代码
            }
            
            response = requests.post(
                'https://api.openai.com/v1/audio/transcriptions',
                headers=headers,
                files=files,
                data=data,
                timeout=30
            )
            
            response.raise_for_status()
            result = response.json()
            return result.get('text', '')
            
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    def validate_config(self, engine: str, language: str, 
                       api_key: str) -> Dict[str, Any]:
        """验证ASR配置"""
        validation_result = {
            'valid': True,
            'errors': [],
            'warnings': []
        }
        
        if engine not in self.supported_engines:
            validation_result['valid'] = False
            validation_result['errors'].append(f"不支持的ASR引擎: {engine}")
        
        if language not in self.supported_languages:
            validation_result['warnings'].append(f"语言 {language} 可能不被支持")
        
        if engine == 'whisper' and not api_key:
            validation_result['valid'] = False
            validation_result['errors'].append("Whisper引擎需要API Key")
        
        return validation_result
