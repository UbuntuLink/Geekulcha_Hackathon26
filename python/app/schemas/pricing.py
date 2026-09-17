from typing import Optional
from pydantic import BaseModel


class PriceRequest(BaseModel):
    category: str
    message: str


class PriceResponse(BaseModel):
    category: str
    estimated_min_zar: Optional[float] = None
    estimated_max_zar: Optional[float] = None
    based_on: str
    reasoning: str
    price_time: Optional[str] = None
