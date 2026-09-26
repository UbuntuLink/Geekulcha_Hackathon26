from fastapi import APIRouter, HTTPException

from app.schemas.quantum import QuantumOptimisationRequest
from app.services.quantum import optimise_quantum


router = APIRouter(
    prefix="/quantum",
    tags=["Quantum"]
)


@router.post("/optimise")
def optimise(request: QuantumOptimisationRequest):

    try:
        return optimise_quantum(request)

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )