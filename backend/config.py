from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # AI Provider Configuration
    AI_PROVIDER: str = "ollama"

    # Ollama Configuration
    OLLAMA_API_BASE_URL: str = "http://127.0.0.1:11434"
    OLLAMA_MODEL_NAME: str = "llama3"

    # OpenAI Configuration
    OPENAI_API_KEY: str = "your_openai_api_key_here"
    OPENAI_MODEL_NAME: str = "gpt-4-turbo"

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings()
