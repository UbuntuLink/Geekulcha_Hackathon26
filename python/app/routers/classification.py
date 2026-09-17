from fastapi import APIRouter, HTTPException

from app.schemas.classification import ClassifyRequest, ClassifyResponse
from app.services.classification_service import classify_request

router = APIRouter(prefix="/classify", tags=["classification"])


@router.post("", response_model=ClassifyResponse)
def classify(request: ClassifyRequest) -> ClassifyResponse:
    try:
        result = classify_request(request.message)
        return ClassifyResponse(**result)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Classification failed: {exc}") from exc
