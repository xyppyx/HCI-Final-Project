import edge_tts
import asyncio
import tempfile
import os
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class TTSService:
    """语音合成服务"""
    
    def __init__(self):
        self.supported_engines = {
            'edge': self._generate_edge_tts,
            'azure': self._generate_azure_tts
        }
        
        # Edge TTS支持的声音列表
        self.edge_voices = {
            'zh-CN-XiaoxiaoNeural': '晓晓 (女声)',
            'zh-CN-YunxiNeural': '云希 (男声)',
            'zh-CN-YunyangNeural': '云扬 (男声)',
            'zh-CN-XiaoyiNeural': '晓伊 (女声)',
            'zh-CN-YunjianNeural': '云健 (男声)',
            'zh-CN-XiaochenNeural': '晓辰 (女声)',
            'zh-CN-XiaohanNeural': '晓涵 (女声)',
            'zh-CN-XiaomengNeural': '晓梦 (女声)',
            'zh-CN-XiaomoNeural': '晓墨 (女声)',
            'zh-CN-XiaoqiuNeural': '晓秋 (女声)',
            'zh-CN-XiaoruiNeural': '晓睿 (女声)',
            'zh-CN-XiaoshuangNeural': '晓双 (女声)',
            'zh-CN-XiaoxuanNeural': '晓萱 (女声)',
            'zh-CN-XiaoyanNeural': '晓颜 (女声)',
            'zh-CN-XiaoyouNeural': '晓悠 (女声)',
            'zh-CN-XiaozhenNeural': '晓甄 (女声)',
            'zh-CN-YunfengNeural': '云枫 (男声)',
            'zh-CN-YunhaoNeural': '云皓 (男声)',
            'zh-CN-YunjieNeural': '云杰 (男声)',
            'zh-CN-YunxiaNeural': '云夏 (男声)',
            'zh-CN-YunyeNeural': '云野 (男声)',
            'zh-CN-YunzeNeural': '云泽 (男声)'
        }
    
    def get_supported_engines(self) -> Dict[str, str]:
        """获取支持的TTS引擎列表"""
        return {
            'edge': 'Microsoft Edge TTS',
            'azure': 'Azure Cognitive Services'
        }
    
    def get_voices(self, engine: str = 'edge') -> Dict[str, str]:
        """获取指定引擎支持的声音列表"""
        if engine == 'edge':
            return self.edge_voices
        elif engine == 'azure':
            # Azure TTS声音列表
            return self.edge_voices  # 暂时使用相同列表
        else:
            return {}
    
    async def generate_speech(self, text: str, engine: str = 'edge', 
                            voice: str = 'zh-CN-XiaoxiaoNeural', 
                            rate: float = 1.0, volume: float = 1.0,
                            **kwargs) -> str:
        """
        生成语音文件
        
        Args:
            text: 要合成的文本
            engine: TTS引擎
            voice: 声音名称
            rate: 语速 (0.5-2.0)
            volume: 音量 (0.0-1.0)
            
        Returns:
            生成的音频文件路径
        """
        if engine not in self.supported_engines:
            raise ValueError(f"不支持的TTS引擎: {engine}")
        
        if not text.strip():
            raise ValueError("文本不能为空")
        
        try:
            return await self.supported_engines[engine](
                text, voice, rate, volume, **kwargs
            )
        except Exception as e:
            logger.error(f"TTS生成失败 [{engine}]: {str(e)}")
            raise
    
    async def _generate_edge_tts(self, text: str, voice: str, rate: float, 
                               volume: float, **kwargs) -> str:
        """使用Edge TTS生成语音"""
        max_retries = 2
        last_exception = None

        for attempt in range(max_retries):
            temp_path = None
            try:
                # 清理文本，移除可能的冗余信息
                cleaned_text = self._clean_text_for_tts(text)
                if not cleaned_text:
                    logger.warning("清理后的TTS文本为空，跳过语音合成。")
                    return "" # 返回空字符串，表示没有生成音频，但不算作错误

                # 处理语速和音量参数
                rate_percent = int((rate - 1) * 100)
                rate_str = f"{rate_percent:+d}%"
                volume_percent = int((volume - 1) * 100)
                volume_str = f"{volume_percent:+d}%"

                logger.debug(f"Edge TTS尝试 {attempt + 1}/{max_retries}: voice={voice}, rate={rate_str}, volume={volume_str}")
                
                communicate = edge_tts.Communicate(cleaned_text, voice, rate=rate_str, volume=volume_str)
                
                # 创建临时文件
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
                temp_path = temp_file.name
                temp_file.close()
                
                # 保存音频
                await communicate.save(temp_path)
                
                # 检查文件大小
                file_size = os.path.getsize(temp_path)
                if file_size == 0:
                    raise ValueError("生成的TTS文件大小为0，可能合成失败。")
                
                logger.info(f"Edge TTS生成成功: {len(cleaned_text)} 字符, 文件大小: {file_size} bytes")
                return temp_path
                
            except Exception as e:
                last_exception = e
                logger.error(f"Edge TTS生成尝试 {attempt + 1}/{max_retries} 失败: {str(e)}")
                # 清理失败时可能创建的临时文件
                if temp_path and os.path.exists(temp_path):
                    os.unlink(temp_path)
                # 如果不是最后一次尝试，则稍作等待
                if attempt < max_retries - 1:
                    await asyncio.sleep(1)
        
        # 所有重试都失败后，记录并重新抛出最后的异常
        logger.critical(f"Edge TTS 语音合成最终失败，请检查网络连接和依赖项。")
        raise last_exception
    
    async def _generate_azure_tts(self, text: str, voice: str, rate: float, 
                                volume: float, **kwargs) -> str:
        """使用Azure TTS生成语音 (预留接口)"""
        # 实现Azure TTS调用逻辑
        raise NotImplementedError("Azure TTS暂未实现")
    
    def _clean_text_for_tts(self, text: str) -> str:
        """清理文本，移除TTS不需要的内容"""
        import re
        
        if not text:
            return ""
        
        original_text = text
        text = re.sub(r'https?://[^\s]+', '', text)
        text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '', text)
        text = re.sub(r'[A-Za-z]:\$^\s]*', '', text)
        text = re.sub(r'\b[A-Za-z0-9]{30,}\b', '', text)
        text = re.sub(r'\b\w+=[^\s]+', '', text)
        text = re.sub(r'<[^>]+>', '', text)
        text = re.sub(r'```[\w]*\n?', '', text)
        text = re.sub(r'`([^`]*)`', r'\1', text)
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()
        
        if len(text) < 5:
            fallback_text = re.sub(r'[`<>{}[$]+', '', original_text)
            fallback_text = re.sub(r'\s+', ' ', fallback_text).strip()
            text = fallback_text[:100] if len(fallback_text) > 0 else "处理完成"
        
        if len(text) > 200:
            text = text[:200] + "..."
        
        logger.debug(f"TTS文本清理: 原长度={len(original_text)}, 清理后长度={len(text)}")
        return text
    
    def validate_config(self, engine: str, voice: str, rate: float, 
                       volume: float) -> Dict[str, Any]:
        """验证TTS配置参数"""
        validation_result = {
            'valid': True,
            'errors': [],
            'warnings': []
        }
        
        if engine not in self.supported_engines:
            validation_result['valid'] = False
            validation_result['errors'].append(f"不支持的TTS引擎: {engine}")
        
        if voice not in self.get_voices(engine):
            validation_result['warnings'].append(f"声音 {voice} 可能不被支持")
        
        if not (0.5 <= rate <= 2.0):
            validation_result['valid'] = False
            validation_result['errors'].append("语速必须在0.5-2.0之间")
        
        if not (0.5 <= volume <= 1.5):
            validation_result['valid'] = False
            validation_result['errors'].append("音量必须在0.5-1.5之间")
        
        return validation_result
    
    def preview_tts_text(self, text: str) -> str:
        """预览将要合成的文本（已清理）"""
        return self._clean_text_for_tts(text)

