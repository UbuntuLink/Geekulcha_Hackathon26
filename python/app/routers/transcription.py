from fastapi import APIRouter, HTTPException

from app.core.llm_client import LlmUnavailable
from app.schemas.transcription import TranscribeRequest, TranscribeResponse
from app.services.transcription_service import transcribe_audio


router = APIRouter(
    prefix="/transcribe",
    tags=["transcription"]
)


@router.post("", response_model=TranscribeResponse)
def transcribe(request: TranscribeRequest) -> TranscribeResponse:
    try:
        return TranscribeResponse(
            text=transcribe_audio(request.audio_base64, request.audio_format)
        )

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    # 503 for the same reason as classification: the model being unreachable is a temporary
    # state of this service.
    except LlmUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Transcription failed: {exc}"
        ) from exc
