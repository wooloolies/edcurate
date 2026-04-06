from fastapi import APIRouter

from src.curriculum import schemas, service
from src.lib.dependencies import DBSession

router = APIRouter()


@router.get("/countries", response_model=list[schemas.CountryOption])
async def get_countries(db: DBSession):
    return await service.list_countries(db)


@router.get("/subjects", response_model=list[str])
async def get_subjects(db: DBSession, country: str):
    return await service.list_subjects(db, country.upper())


@router.get("/frameworks", response_model=list[str])
async def get_frameworks(db: DBSession, country: str, subject: str):
    return await service.list_frameworks(db, country.upper(), subject)


@router.get("/grades", response_model=list[schemas.GradeOption])
async def get_grades(db: DBSession, country: str, subject: str, framework: str):
    return await service.list_grades(db, country.upper(), subject, framework)
