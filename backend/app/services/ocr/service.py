from app.core.config import settings
from app.services.ocr.base import BaseOCRProvider, OCRResultData
from app.services.ocr.mock_provider import MockOCRProvider
from app.services.ocr.azure_provider import AzureDocumentIntelligenceProvider

def get_ocr_provider() -> BaseOCRProvider:
    provider_name = settings.OCR_PROVIDER.lower()
    
    if provider_name == "azure":
        azure = AzureDocumentIntelligenceProvider()
        if azure.is_configured():
            return azure
        print("Warning: Azure OCR selected but credentials missing. Falling back to MockOCRProvider.")
        return MockOCRProvider()
    
    return MockOCRProvider()

def process_page_ocr(image_path: str, page_number: int = 1) -> OCRResultData:
    provider = get_ocr_provider()
    return provider.extract_text(image_path, page_number)
