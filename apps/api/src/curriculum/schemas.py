from pydantic import BaseModel


class CountryOption(BaseModel):
    code: str
    name: str


class GradeOption(BaseModel):
    name: str
    sort_order: int
