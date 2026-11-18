from app.core.config import settings
from app.services.ai.base import BaseAIEvaluator
from app.services.ai.mock_evaluator import MockAIEvaluator
from app.services.ai.evaluator import RealAIEvaluator

def get_ai_evaluator() -> BaseAIEvaluator:
    provider_type = settings.AI_PROVIDER.lower()
    
    if provider_type in ["openai", "gemini", "ollama", "azure_openai"]:
        evaluator = RealAIEvaluator()
        if evaluator.is_configured():
            return evaluator
        print(f"Warning: Real AI ({provider_type}) requested but AI_API_KEY is not set. Using MockAIEvaluator.")
        return MockAIEvaluator()
    
    return MockAIEvaluator()
