from pydantic import BaseModel
from typing import List


class QuantumProvider(BaseModel):
    providerId: int
    rating: float
    distanceKm: float
    estimatedPrice: float
    available: bool


class QuantumJob(BaseModel):
    jobId: int
    category: str
    urgency: float


class QuantumOptimisationRequest(BaseModel):
    jobs: List[QuantumJob]
    providers: List[QuantumProvider]