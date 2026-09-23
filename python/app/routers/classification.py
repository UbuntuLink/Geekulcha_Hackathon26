from fastapi import APIRouter, HTTPException

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
        result = classify_request(request.message, request.photo_data_url)
        return ClassifyResponse(**result)

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

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Description refinement failed: {exc}"
        ) from exc