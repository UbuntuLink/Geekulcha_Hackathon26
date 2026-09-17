from typing import Optional
from pydantic import BaseModel


class ClassifyRequest(BaseModel):
    message: str


class ClassifyResponse(BaseModel):
    category: str
    confidence: str
    reasoning: str
    clarifying_question: Optional[str] = None
    advice: Optional[str] = None
    urgency: str
    job_description: str
