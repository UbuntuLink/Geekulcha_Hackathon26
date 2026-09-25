from fastapi import APIRouter, HTTPException

from app.core.llm_client import LlmUnavailable
from app.schemas.classification import (
    ClassifyRequest,
    ClassifyResponse,
    RefineDescriptionRequest,
    RefineDescriptionResponse,
)

from app.services.classification_service import (
    classify_request,
    refine_description,
)


router = APIRouter(
    prefix="/classify",
    tags=["classification"]
)


@router.post("", response_model=ClassifyResponse)
def classify(request: ClassifyRequest) -> ClassifyResponse:
    try:
        result = classify_request(
            request.message,
            request.categories,
            request.photo_data_url,
        )

        return ClassifyResponse(**result)

    # 503 rather than 502: the model is unavailable or unpaid, which is a temporary state of this
    # service, not a bad reply from upstream.
    except LlmUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Classification failed: {exc}"
        ) from exc


@router.post(
    "/refine-description",
    response_model=RefineDescriptionResponse
)
def refine(
    request: RefineDescriptionRequest
) -> RefineDescriptionResponse:

    try:
        result = refine_description(
            request.job_description,
            request.additional_details,
        )

        return RefineDescriptionResponse(**result)

    except LlmUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Description refinement failed: {exc}"
        ) from exc