from pydantic import BaseModel, Field


class TranscribeRequest(BaseModel):
    # The recording as base64 WAV, without a "data:" prefix. The browser encodes to WAV because
    # the OpenAI-compatible audio input only accepts wav or mp3, and browsers record neither.
    audio_base64: str = Field(alias="audioBase64", min_length=1)
    audio_format: str = Field(default="wav", alias="audioFormat", pattern="^(wav|mp3)$")

    model_config = {"populate_by_name": True}


class TranscribeResponse(BaseModel):
    text: str
