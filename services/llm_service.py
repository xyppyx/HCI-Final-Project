import requests
import json
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class LLMService:
    """大语言模型服务"""
    
    def __init__(self):
        self.supported_providers = {
            'deepseek': self._call_deepseek,
            'kimi': self._call_kimi
        }
    
    def get_supported_providers(self) -> List[str]:
        """获取支持的LLM提供商列表"""
        return list(self.supported_providers.keys())
    
    def call_llm(self, provider: str, messages: List[Dict], model: str, 
                 temperature: float, api_key: str, **kwargs) -> str:
        """
        调用指定的LLM服务
        """
        if provider not in self.supported_providers:
            raise ValueError(f"不支持的提供商: {provider}")
        
        if not api_key:
            raise ValueError(f"API Key不能为空: {provider}")
        
        # 记录API调用信息（不记录完整API Key）
        masked_key = f"{api_key[:8]}...{api_key[-4:]}" if len(api_key) > 12 else "***"
        logger.info(f"调用LLM: provider={provider}, model={model}, api_key={masked_key}")
        
        try:
            return self.supported_providers[provider](
                messages, model, temperature, api_key, **kwargs
            )
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 401:
                raise ValueError(f"API Key无效或已过期 [{provider}]: 请检查API Key是否正确")
            elif e.response.status_code == 403:
                raise ValueError(f"访问被拒绝 [{provider}]: 请检查API Key权限或账户状态")
            elif e.response.status_code == 429:
                raise ValueError(f"请求频率过高 [{provider}]: 请稍后重试")
            elif e.response.status_code == 500:
                raise ValueError(f"服务器内部错误 [{provider}]: 请稍后重试")
            else:
                logger.error(f"LLM调用HTTP错误 [{provider}]: {e}")
                raise ValueError(f"API调用失败 [{provider}]: {e}")
        except requests.exceptions.RequestException as e:
            logger.error(f"LLM调用网络错误 [{provider}]: {str(e)}")
            raise ValueError(f"网络连接失败 [{provider}]: 请检查网络连接")
        except Exception as e:
            logger.error(f"LLM调用失败 [{provider}]: {str(e)}")
            raise

    def _call_deepseek(self, messages: List[Dict], model: str, temperature: float, 
                       api_key: str, **kwargs) -> str:
        """调用DeepSeek API (华为云MaaS)"""
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}'
        }
        
        data = {
            'model': 'DeepSeek-V3',  # 固定使用DeepSeek-V3模型
            'messages': messages,
            'temperature': temperature,
            'stream': False,  # 关闭流式输出以简化处理
            'max_tokens': kwargs.get('max_tokens', 1000)
        }
        
        logger.debug(f"DeepSeek MaaS API请求: model={data['model']}, messages_count={len(messages)}")
        
        response = requests.post(
            'https://api.modelarts-maas.com/v1/chat/completions',
            headers=headers,
            data=json.dumps(data),
            verify=False,  # 按照示例代码设置
            timeout=30
        )
        
        # 详细的错误信息
        if not response.ok:
            try:
                error_detail = response.json()
                logger.error(f"DeepSeek MaaS API错误详情: {error_detail}")
            except:
                logger.error(f"DeepSeek MaaS API错误: status={response.status_code}, text={response.text}")
        
        response.raise_for_status()
        result = response.json()
        return result['choices'][0]['message']['content']
    
    def _call_kimi(self, messages: List[Dict], model: str, temperature: float, 
                   api_key: str, **kwargs) -> str:
        """调用Kimi (月之暗面) API"""
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        data = {
            'model': model or 'moonshot-v1-8k',
            'messages': messages,
            'temperature': temperature,
            'max_tokens': kwargs.get('max_tokens', 1000)
        }
        
        logger.debug(f"Kimi API请求: model={data['model']}, messages_count={len(messages)}")
        
        response = requests.post(
            'https://api.moonshot.cn/v1/chat/completions',
            headers=headers,
            json=data,
            timeout=30
        )
        
        # 详细的错误信息
        if not response.ok:
            try:
                error_detail = response.json()
                logger.error(f"Kimi API错误详情: {error_detail}")
            except:
                logger.error(f"Kimi API错误: status={response.status_code}, text={response.text}")
        
        response.raise_for_status()
        result = response.json()
        return result['choices'][0]['message']['content']

    def validate_config(self, provider: str, api_key: str, model: str) -> Dict[str, Any]:
        """验证配置参数"""
        validation_result = {
            'valid': True,
            'errors': [],
            'warnings': []
        }
        
        if provider not in self.supported_providers:
            validation_result['valid'] = False
            validation_result['errors'].append(f"不支持的提供商: {provider}")
        
        if not api_key:
            validation_result['valid'] = False
            validation_result['errors'].append("API Key不能为空")
        elif len(api_key.strip()) < 10:
            validation_result['warnings'].append("API Key长度可能不正确")
        
        # 验证模型名称是否匹配提供商
        valid_models = {
            'deepseek': ['DeepSeek-V3'],  # 更新为华为云MaaS支持的模型
            'kimi': ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k']
        }
        
        if provider in valid_models and model not in valid_models[provider]:
            validation_result['errors'].append(f"模型 '{model}' 不适用于提供商 '{provider}'")
            validation_result['valid'] = False
        
        return validation_result

    def test_api_connection(self, provider: str, api_key: str, model: str) -> Dict[str, Any]:
        """测试API连接"""
        test_result = {
            'success': False,
            'message': '',
            'error_code': None
        }
        
        try:
            # 发送简单的测试消息
            test_messages = [{'role': 'user', 'content': 'Hello'}]
            response = self.call_llm(provider, test_messages, model, 0.1, api_key)
            
            test_result['success'] = True
            test_result['message'] = 'API连接测试成功'
            
        except ValueError as e:
            test_result['message'] = str(e)
            if '401' in str(e) or 'API Key无效' in str(e):
                test_result['error_code'] = 'invalid_api_key'
            elif '403' in str(e):
                test_result['error_code'] = 'permission_denied'
            elif '429' in str(e):
                test_result['error_code'] = 'rate_limit'
            else:
                test_result['error_code'] = 'unknown'
        except Exception as e:
            test_result['message'] = f'连接测试失败: {str(e)}'
            test_result['error_code'] = 'connection_error'
        
        return test_result
