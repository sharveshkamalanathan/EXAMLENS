from abc import ABC, abstractmethod
from typing import Dict, Any, List
from app.schemas.evaluation import AIEvaluationOutput
from app.models.question import Question

class BaseAIEvaluator(ABC):
    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @abstractmethod
    def evaluate_answer(
        self,
        question: Question,
        student_answer: str,
        student_roll_no: str = ""
    ) -> AIEvaluationOutput:
        """Evaluates student answer against question, reference answer, and rubric criteria."""
        pass
