from typing import Optional
from pydantic import BaseModel, Field


class ClassifyRequest(BaseModel):
    message: str
    photo_data_url: Optional[str] = Field(default=None, alias="photoDataUrl")

    model_config = {"populate_by_name": True}


class ClassifyResponse(BaseModel):
    category: str
    confidence: str
    reasoning: str
    clarifying_question: Optional[str] = None
    advice: Optional[str] = None
    urgency: str
    job_description: str

class RefineDescriptionRequest(BaseModel):
    job_description: str
    additional_details: str

class RefineDescriptionResponse(BaseModel):
    job_description: str
    is_relevant: bool