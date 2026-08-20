from pydantic import BaseModel


class DemoDataStatus(BaseModel):
    installed: bool
    counts: dict[str, int] = {}
