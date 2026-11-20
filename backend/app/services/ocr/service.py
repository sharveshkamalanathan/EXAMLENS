from app.core.config import settings
from app.services.ocr.base import BaseOCRProvider, OCRResultData
from app.services.ocr.mock_provider import MockOCRProvider
from app.services.ocr.azure_provider import AzureDocumentIntelligenceProvider
from app.services.ocr.rapidocr_provider import RapidOCRProvider

def get_ocr_provider() -> BaseOCRProvider:
    provider_name = settings.OCR_PROVIDER.lower()
    
    # 1. Explicit Azure requested
    if provider_name == "azure":
        azure = AzureDocumentIntelligenceProvider()
        if azure.is_configured():
            return azure
        print("Warning: Azure OCR selected but credentials missing. Falling back to RapidOCR.")

    # 2. RapidOCR or Auto mode (preferred local real handwriting engine)
    if provider_name in ("auto", "rapidocr", "azure"):
        rapid = RapidOCRProvider()
        if rapid.is_configured():
            return rapid
        print("Warning: RapidOCR not configured or failed to load.")

    # 3. Azure fallback if auto
    if provider_name == "auto":
        azure = AzureDocumentIntelligenceProvider()
        if azure.is_configured():
            return azure

    # 4. Fallback to mock demo for testing environments
    return MockOCRProvider()

def process_page_ocr(image_path: str, page_number: int = 1) -> OCRResultData:
    provider = get_ocr_provider()
    return provider.extract_text(image_path, page_number)
