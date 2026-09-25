from fastapi import APIRouter, HTTPException

from app.core.llm_client import LlmUnavailable
from app.schemas.pricing import PriceRequest, PriceResponse
from app.services.pricing_service import estimate_price

router = APIRouter(prefix="/price", tags=["pricing"])


@router.post("", response_model=PriceResponse)
def price(request: PriceRequest) -> PriceResponse:
    try:
        result = estimate_price(request.category, request.message)
        return PriceResponse(**result)
    except LlmUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Pricing failed: {exc}") from exc
