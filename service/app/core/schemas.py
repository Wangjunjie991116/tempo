from typing import Any, Optional

from pydantic import BaseModel


class ApiEnvelope(BaseModel):
    code: int
    msg: str
    data: Optional[Any] = None
    traceId: str
