from pydantic import BaseModel
from typing import List, Optional, Any, Dict

#================================================================#
#                       API Request Schemas                      #
#================================================================#

class CharacterGenerateRequest(BaseModel):
    theme: str
    prompt_question: str
    options: Optional[dict] = None

class StoryOutlineRequest(BaseModel):
    theme: str
    style: str
    characters: List[Dict[str, Any]]

class ChapterPlanRequest(BaseModel):
    outline: Dict[str, Any]
    chapter_count: int

class StoryExpandRequest(BaseModel):
    chapter_summary: str
    characters: List[Dict[str, Any]]
    style: str

#================================================================#
#                       Database Schemas (CRUD)                  #
#================================================================#

class CharacterBase(BaseModel):
    data: Dict[str, Any]

class CharacterCreate(CharacterBase):
    pass

class Character(CharacterBase):
    id: int
    project_id: int

    class Config:
        orm_mode = True

class StoryOutlineBase(BaseModel):
    data: Dict[str, Any]

class StoryOutlineCreate(StoryOutlineBase):
    pass

class StoryOutline(StoryOutlineBase):
    id: int
    project_id: int

    class Config:
        orm_mode = True

class ChapterBase(BaseModel):
    plan_data: Dict[str, Any]
    content: Optional[str] = None
    chapter_index: int # chapter_index should be in base as it's always present

class ChapterCreate(ChapterBase):
    pass # No extra fields needed for creation if base has all

class Chapter(ChapterBase):
    id: int
    project_id: int
    chapter_index: int

    class Config:
        orm_mode = True

class ChapterContentUpdate(BaseModel):
    content: str


class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: int
    characters: List[Character] = []
    # Add other relationships later if needed

    class Config:
        orm_mode = True

#================================================================#
#                       API Response Schemas                     #
#================================================================#

class CharacterGenerateResponse(BaseModel):
    name: str
    age: int
    personality: str
    family_background: str
    social_class: str
    growth_experiences: str
    education_and_culture: str
    profession_and_skills: str
    inner_conflict: str

class StoryOutlineResponse(BaseModel):
    story_theme: str
    core_conflict: str
    character_relationships: str
    world_setting: str
    plot_structure: List[str]
    abstract_outline: str

class ChapterPlanResponse(BaseModel):
    chapters: List[Dict[str, Any]]

class StoryExpandResponse(BaseModel):
    chapter_text: str

# Unified Error Schema from the docs
class ErrorDetail(BaseModel):
    code: str
    message: str

class ErrorResponse(BaseModel):
    detail: ErrorDetail
