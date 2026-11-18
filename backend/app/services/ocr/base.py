from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class OCRWord(BaseModel):
    text: str
    confidence: float = 0.95
    bounding_box: Optional[List[float]] = None  # [x, y, w, h] normalized or pixel

class OCRLine(BaseModel):
    text: str
    confidence: float = 0.95
    bounding_box: Optional[List[float]] = None
    words: List[OCRWord] = []

class OCRResultData(BaseModel):
    provider: str
    extracted_text: str
    confidence: float = 0.95
    processing_time_ms: int = 150
    lines: List[OCRLine] = []
    structured_output: Dict[str, Any] = {}
    is_demo: bool = False
    warning: Optional[str] = None

class BaseOCRProvider(ABC):
    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @abstractmethod
    def extract_text(self, image_path: str, page_number: int = 1) -> OCRResultData:
        """Extract handwritten text, bounding boxes, and confidence scores from document image."""
        pass

    @abstractmethod
    def is_configured(self) -> bool:
        """Check if provider credentials/endpoints are configured."""
        pass
