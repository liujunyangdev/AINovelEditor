
from fastapi import FastAPI
from pydantic import BaseModel
from rag_service import rag_service
from fastapi.middleware.cors import CORSMiddleware # Import CORSMiddleware

app = FastAPI()

# Add CORS middleware
origins = [
    "http://localhost:5173",  # Allow requests from your frontend development server
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Config(BaseModel):
    knowledge_base_path: str

class IndexRequest(BaseModel):
    path: str

class GenerateRequest(BaseModel):
    query: str

@app.get("/health")
def read_root():
    return {"status": "ok"}

@app.post("/config")
def update_config(config: Config):
    print(f"Knowledge base path set to: {config.knowledge_base_path}")
    result = rag_service.index_directory(config.knowledge_base_path)
    return result # Return the result directly

@app.post("/index")
def index_files(request: IndexRequest):
    result = rag_service.index_directory(request.path)
    return result # Return the result directly

@app.post("/rag_generate")
def generate(request: GenerateRequest):
    response = rag_service.generate(request.query)
    return {"response": response}
