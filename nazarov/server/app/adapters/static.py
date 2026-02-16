import numpy as np

from app.core.functions import rastrigin, rosenbrok, stepint
from app.core.models import Function
from app.core.server import FunctionRepository


class StaticFunctionRepository(FunctionRepository):
    _functions = [
        Function(id="1", name="rastrigin", f=rastrigin),
        Function(id="2", name="rosenbrok", f=rosenbrok(np.float64(1), np.float64(1))),
        Function(id="3", name="stepint", f=stepint),
    ]

    async def all(self) -> list[Function]:
        return self._functions

    async def get(self, id: str) -> Function | None:
        for f in self._functions:
            if f.id == id:
                return f
        return None
