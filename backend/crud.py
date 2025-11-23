from sqlalchemy.orm import Session
import models, schemas

#================================================================#
#                       Project CRUD                             #
#================================================================#

def get_project(db: Session, project_id: int):
    return db.query(models.Project).filter(models.Project.id == project_id).first()

def get_projects(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Project).offset(skip).limit(limit).all()

def create_project(db: Session, project: schemas.ProjectCreate):
    db_project = models.Project(name=project.name, description=project.description)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

#================================================================#
#                       Character CRUD                           #
#================================================================#

def create_project_character(db: Session, character: schemas.CharacterCreate, project_id: int):
    db_character = models.Character(**character.dict(), project_id=project_id)
    db.add(db_character)
    db.commit()
    db.refresh(db_character)
    return db_character

def get_characters_by_project(db: Session, project_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Character).filter(models.Character.project_id == project_id).offset(skip).limit(limit).all()

def get_all_characters(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Character).offset(skip).limit(limit).all()

#================================================================#
#                       StoryOutline CRUD                        #
#================================================================#

def create_project_story_outline(db: Session, outline: schemas.StoryOutlineCreate, project_id: int):
    db_outline = models.StoryOutline(**outline.dict(), project_id=project_id)
    db.add(db_outline)
    db.commit()
    db.refresh(db_outline)
    return db_outline

def get_story_outline_by_project_id(db: Session, project_id: int):
    return db.query(models.StoryOutline).filter(models.StoryOutline.project_id == project_id).first()

#================================================================#
#                       Chapter CRUD                             #
#================================================================#

def create_project_chapter(db: Session, chapter: schemas.ChapterCreate, project_id: int):
    db_chapter = models.Chapter(**chapter.dict(), project_id=project_id)
    db.add(db_chapter)
    db.commit()
    db.refresh(db_chapter)
    return db_chapter

def get_chapters_by_project_id(db: Session, project_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Chapter).filter(models.Chapter.project_id == project_id).offset(skip).limit(limit).all()

def get_chapter(db: Session, chapter_id: int):
    return db.query(models.Chapter).filter(models.Chapter.id == chapter_id).first()

def update_chapter_content(db: Session, chapter_id: int, content: str):
    db_chapter = get_chapter(db, chapter_id=chapter_id)
    if db_chapter:
        db_chapter.content = content
        db.commit()
        db.refresh(db_chapter)
    return db_chapter

