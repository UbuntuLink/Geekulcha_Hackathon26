from typing import List, Optional
from pydantic import BaseModel


class ClassifyRequest(BaseModel):
    message: str
    # The live service catalog, sent by the frontend so the model answers in the same words the
    # database uses. Without it the model falls back to the default list in the prompt file,
    # which drifts from the catalog the moment a service is renamed or added.
    categories: Optional[List[str]] = None


class ClassifyResponse(BaseModel):
    category: str
    confidence: str = "medium"
    reasoning: str = ""
    clarifying_question: Optional[str] = None
    advice: Optional[str] = None
    urgency: str = "medium"
    # "cheapest" | "best_rated" | "soonest" | "none" — how the customer asked for results to be
    # ranked. Optional so an older model response, or a cached prompt, still validates.
    sort_preference: Optional[str] = None
    job_description: str = ""
