from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from starlette.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware # Import CORSMiddleware


import crud, models, schemas, services
from database import SessionLocal, engine, get_db

# Create all database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NovelAI Creator API",
    description="API for generating and managing novel content.",
    version="0.1.0",
)

# Add CORS middleware
origins = [
    "http://localhost",
    "http://localhost:5173", # Frontend Vite dev server port
    # Add other origins where your frontend might be hosted, e.g., Electron's origin
    # For Electron, the origin might be 'file://' or a custom scheme if you set one up.
    # For development convenience, we'll allow all for now.
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#================================================================#
#                       AI Generation Endpoints                  #
#================================================================#

@app.post("/character/generate", 
          response_model=schemas.CharacterGenerateResponse,
          tags=["AI Generation"],
          summary="Generate a new character from a prompt")
async def generate_character(
    request: schemas.CharacterGenerateRequest,
):
    """
    Generates a detailed character profile based on a theme and a user prompt.

    This endpoint interfaces with an AI model to create a rich character description,
    which can then be saved and used in a story.
    """
    # In a real implementation, you would add error handling here
    # and potentially select the AI provider (Ollama vs API)
    return await services.generate_character_from_ai(request)

@app.post("/story/outline", 
          response_model=schemas.StoryOutlineResponse,
          tags=["AI Generation"],
          summary="Generate a story outline based on characters and theme")
async def generate_story_outline(
    request: schemas.StoryOutlineRequest,
):
    """
    Generates a story outline, including theme, core conflict, character relationships,
    world setting, and plot structure, based on provided characters, theme, and style.
    """
    return await services.generate_story_outline_from_ai(request)

@app.post("/story/chapters", 
          response_model=schemas.ChapterPlanResponse,
          tags=["AI Generation"],
          summary="Generate a chapter plan based on story outline and chapter count")
async def generate_chapter_plan(
    request: schemas.ChapterPlanRequest,
):
    """
    Generates a detailed chapter plan, including position, dramatic goal,
    inner conflict display, and summary for each chapter.
    """
    return await services.generate_chapter_plan_from_ai(request)

@app.post("/story/expand", 
          tags=["AI Generation"],
          summary="Expand a chapter summary into full text (Streaming)")
async def expand_story_stream(
    request: schemas.StoryExpandRequest,
):
    """
    Expands a chapter summary into a full-length chapter text using a streaming response.
    
    This endpoint provides a real-time stream of generated text.
    """
    return StreamingResponse(services.stream_expand_from_ai(request), media_type="text/event-stream")


#================================================================#
#                       Project & Data Endpoints                 #
#================================================================#

@app.post("/projects/", 
          response_model=schemas.Project, 
          tags=["Projects"],
          summary="Create a new project")
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    """
    Creates a new project to house characters, outlines, and chapters.
    """
    return crud.create_project(db=db, project=project)

@app.get("/projects/", 
         response_model=List[schemas.Project], 
         tags=["Projects"],
         summary="List all projects")
def read_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retrieves a list of all projects.
    """
    projects = crud.get_projects(db, skip=skip, limit=limit)
    return projects

@app.get("/projects/{project_id}", 
         response_model=schemas.Project, 
         tags=["Projects"],
         summary="Get a single project by ID")
def read_project(project_id: int, db: Session = Depends(get_db)):
    """
    Retrieves a single project and its associated data by its ID.
    """
    db_project = crud.get_project(db, project_id=project_id)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project

@app.post("/projects/{project_id}/characters/", 
          response_model=schemas.Character, 
          tags=["Characters"],
          summary="Save a character to a project")
def create_character_for_project(
    project_id: int, character_data: schemas.CharacterCreate, db: Session = Depends(get_db)
):
    """
    Saves a generated character's data to a specific project.
    The request body should contain the JSON data of the character.
    """
    # Verify project exists
    db_project = crud.get_project(db, project_id=project_id)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return crud.create_project_character(db=db, character=character_data, project_id=project_id)

@app.get("/projects/{project_id}/characters/", 
         response_model=List[schemas.Character], 
         tags=["Characters"],
         summary="List characters in a project")
def read_characters_for_project(
    project_id: int, db: Session = Depends(get_db)
):
    """
    Retrieves all characters associated with a specific project.
    """
    # Verify project exists
    db_project = crud.get_project(db, project_id=project_id)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
        
    return crud.get_characters_by_project(db=db, project_id=project_id)

@app.post("/projects/{project_id}/story_outline/", 
          response_model=schemas.StoryOutline, 
          tags=["Story Outlines"],
          summary="Save a story outline to a project")
def create_story_outline_for_project(
    project_id: int, outline_data: schemas.StoryOutlineCreate, db: Session = Depends(get_db)
):
    """
    Saves a generated story outline's data to a specific project.
    The request body should contain the JSON data of the story outline.
    """
    db_project = crud.get_project(db, project_id=project_id)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check if an outline already exists for this project
    existing_outline = crud.get_story_outline_by_project_id(db, project_id=project_id)
    if existing_outline:
        raise HTTPException(status_code=409, detail="Story outline already exists for this project. Use PUT to update.")

    return crud.create_project_story_outline(db=db, outline=outline_data, project_id=project_id)

@app.get("/projects/{project_id}/story_outline/", 
         response_model=schemas.StoryOutline, 
         tags=["Story Outlines"],
         summary="Get story outline for a project")
def read_story_outline_for_project(
    project_id: int, db: Session = Depends(get_db)
):
    """
    Retrieves the story outline associated with a specific project.
    """
    db_project = crud.get_project(db, project_id=project_id)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db_outline = crud.get_story_outline_by_project_id(db, project_id=project_id)
    if db_outline is None:
        raise HTTPException(status_code=404, detail="Story outline not found for this project")
        
    return db_outline

@app.post("/projects/{project_id}/chapters/", 
          response_model=schemas.Chapter, 
          tags=["Chapters"],
          summary="Save a chapter to a project")
def create_chapter_for_project(
    project_id: int, chapter_data: schemas.ChapterCreate, db: Session = Depends(get_db)
):
    """
    Saves a generated chapter's data (plan and content) to a specific project.
    """
    db_project = crud.get_project(db, project_id=project_id)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return crud.create_project_chapter(db=db, chapter=chapter_data, project_id=project_id)

@app.get("/projects/{project_id}/chapters/", 
         response_model=List[schemas.Chapter], 
         tags=["Chapters"],
         summary="List chapters in a project")
def read_chapters_for_project(
    project_id: int, db: Session = Depends(get_db)
):
    """
    Retrieves all chapters associated with a specific project.
    """
    db_project = crud.get_project(db, project_id=project_id)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
        
    return crud.get_chapters_by_project_id(db=db, project_id=project_id)

@app.put("/chapters/{chapter_id}", 
         response_model=schemas.Chapter, 
         tags=["Chapters"],
         summary="Update a chapter's content")
def update_chapter_content(
    chapter_id: int, chapter_update: schemas.ChapterContentUpdate, db: Session = Depends(get_db)
):
    """
    Updates the expanded text content of a specific chapter.
    """
    db_chapter = crud.get_chapter(db, chapter_id=chapter_id)
    if db_chapter is None:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    updated_chapter = crud.update_chapter_content(db=db, chapter_id=chapter_id, content=chapter_update.content)
    return updated_chapter

@app.get("/characters/", 
         response_model=List[schemas.Character], 
         tags=["Characters"],
         summary="List all characters")
def read_all_characters(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retrieves a list of all characters across all projects.
    """
    characters = crud.get_all_characters(db, skip=skip, limit=limit)
    return characters

# Placeholder for root path
@app.get("/")
def read_root():
    return {"message": "Welcome to the NovelAI Creator API"}
