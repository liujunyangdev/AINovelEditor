import json
import asyncio
import httpx
from typing import Dict, Any, List, AsyncGenerator

import schemas
from config import settings

# --------------------------------------------------------------------------
# 1. PROMPT TEMPLATES
# --------------------------------------------------------------------------

# A more robust prompt to force JSON output
CHARACTER_GEN_PROMPT = """
You are an API that returns JSON. Do not output any text other than a single, valid JSON object.
Your task is to generate a character profile based on the user's request.

**User Request:**
- Theme: {theme}
- Description: {prompt_question}

**Instructions:**
1. Generate a character profile based on the user request.
2. The output MUST be a single, valid JSON object.
3. Do not include any markdown, comments, or other text before or after the JSON.
4. All personality traits must be justified by the character's experiences.

**JSON Output Format:**
{{
  "name": "string",
  "age": 0,
  "personality": "string",
  "family_background": "string",
  "social_class": "string",
  "growth_experiences": "string",
  "education_and_culture": "string",
  "profession_and_skills": "string",
  "inner_conflict": "string"
}}

Begin output now.
"""

STORY_OUTLINE_PROMPT = """
你是一名故事结构工程师。请根据人物设定，从人物性格与关系的冲突中自然推导故事，而非凭空编造。

要求：
1. 情节必须由人物性格驱动。
2. 主题、矛盾、关系、剧情必须彼此呼应。
3. 整体逻辑必须连贯且具有“必然性”。
4. 输出必须是严格的 JSON 格式，不包含任何 markdown 标记 (如 ```json)，以便程序直接解析。

输入人物：
{characters_json}

故事主题或世界观：
{theme}

表达风格：
{style}

输出格式（严格保持 JSON 结构）：
{{
  "story_theme": "string",
  "core_conflict": "string",
  "character_relationships": "string",
  "world_setting": "string",
  "plot_structure": ["string", "string", "..."],
  "abstract_outline": "string"
}}

Begin output now.
"""

CHAPTER_PLAN_PROMPT = """
你将故事梗概拆分为章节结构。每章必须完成“角色变化 + 情节推进”二者之一或两者。

要求：
1. 输出必须是严格的 JSON 格式，不包含任何 markdown 标记 (如 ```json)，以便程序直接解析。

输入故事梗概：
{outline_json}

章节数量：{chapter_count}

输出格式（严格保持 JSON 结构）：
{{
  "chapters": [
    {{
      "index": 1,
      "position": "铺垫/推进/冲突/转折/高潮/收束",
      "dramatic_goal": "本章戏剧目标",
      "inner_conflict_display": "人物内在冲突表现方式",
      "summary": "简要概述（100~300 字）"
    }},
    ...
  ]
}}

Begin output now.
"""

PLOT_EXPANSION_PROMPT = """
你现在是一名小说作者。根据章节概述生成完整正文。

要求：
1. 风格统一，人物行为符合动机，情感真实细腻，不要流水账。
2. 直接开始输出正文，不要包含任何标题、章节号或多余的解释。

输入：
章节概述：
{chapter_summary}

小说风格要求：
{style}

人物设定参考：
{characters_json}

输出：
（直接开始输出章节正文）
"""

# (Other prompts will be added here later)

# --------------------------------------------------------------------------
# 2. AI CLIENT ABSTRACTION
# --------------------------------------------------------------------------

class OllamaClient:
    """Client for interacting with the Ollama API."""
    def __init__(self, base_url: str, model: str):
        self.base_url = base_url
        self.model = model
        self.api_url = f"{self.base_url}/api/generate"

    async def generate_json(self, prompt: str) -> Dict[str, Any]:
        """
        Generate a JSON response from Ollama.
        Includes retry logic and response cleaning.
        """
        max_retries = 3
        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    response = await client.post(
                        self.api_url,
                        json={
                            "model": self.model,
                            "prompt": prompt,
                            "format": "json",
                            "stream": False,
                        },
                    )
                    response.raise_for_status()
                    
                    response_data = response.json()
                    print(f"DEBUG: Full response from Ollama: {response_data}")

                    json_string = response_data.get("response", "").strip()
                    
                    if '{' in json_string and '}' in json_string:
                        start_index = json_string.find('{')
                        end_index = json_string.rfind('}')
                        if start_index < end_index:
                            json_string = json_string[start_index:end_index+1]

                    if not json_string:
                        raise json.JSONDecodeError("Received empty or invalid response from Ollama", "", 0)

                    return json.loads(json_string)

            except (httpx.HTTPStatusError, httpx.RequestError) as e:
                print(f"Error calling Ollama API: {e}")
                if attempt == max_retries - 1:
                    raise Exception(f"Ollama API request failed after {max_retries} attempts.")
            except json.JSONDecodeError as e:
                print(f"Error decoding JSON from Ollama on attempt {attempt + 1}: {e}")
                if attempt == max_retries - 1:
                    raise Exception(f"Failed to decode JSON from Ollama after {max_retries} attempts.")
            
            await asyncio.sleep(1)
        
        raise Exception("Ollama client failed to get a valid JSON response.")

    async def stream_generate(self, prompt: str) -> AsyncGenerator[str, None]:
        """
        Generate a stream of text from Ollama.
        """
        try:
            async with httpx.AsyncClient(timeout=300.0) as client:
                async with client.stream(
                    "POST",
                    self.api_url,
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": True,
                    },
                ) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line:
                            try:
                                chunk = json.loads(line)
                                if "response" in chunk:
                                    yield chunk["response"]
                                if chunk.get("done"):
                                    break
                            except json.JSONDecodeError:
                                print(f"Warning: Could not decode stream line from Ollama: {line}")
        except (httpx.HTTPStatusError, httpx.RequestError) as e:
            print(f"Error calling Ollama streaming API: {e}")
            yield f"Error: Could not connect to Ollama. Details: {e}"


# TODO: Implement OpenAIClient and a factory to switch between them based on config
if settings.AI_PROVIDER == 'ollama':
    ai_client = OllamaClient(base_url=settings.OLLAMA_API_BASE_URL, model=settings.OLLAMA_MODEL_NAME)
else:
    ai_client = None
    print(f"AI_PROVIDER '{settings.AI_PROVIDER}' is not yet supported. Using mock data.")


# --------------------------------------------------------------------------
# 3. SERVICE FUNCTIONS
# --------------------------------------------------------------------------

async def generate_character_from_ai(request: schemas.CharacterGenerateRequest) -> schemas.CharacterGenerateResponse:
    """Generates a character by calling the configured AI model."""
    if not ai_client:
        print("Warning: AI client not supported. Falling back to mock data.")
        # ... (mock data logic remains)
    prompt = CHARACTER_GEN_PROMPT.format(prompt_question=request.prompt_question, theme=request.theme)
    try:
        response_json = await ai_client.generate_json(prompt)
        return schemas.CharacterGenerateResponse(**response_json)
    except Exception as e:
        print(f"An exception occurred in generate_character_from_ai: {e}")
        raise

async def generate_story_outline_from_ai(request: schemas.StoryOutlineRequest) -> schemas.StoryOutlineResponse:
    """Generates a story outline by calling the configured AI model."""
    if not ai_client:
        print("Warning: AI client not supported. Falling back to mock data.")
        # ... (mock data logic remains)
    characters_json_str = json.dumps(request.characters, ensure_ascii=False, indent=2)
    prompt = STORY_OUTLINE_PROMPT.format(characters_json=characters_json_str, theme=request.theme, style=request.style)
    try:
        response_json = await ai_client.generate_json(prompt)
        return schemas.StoryOutlineResponse(**response_json)
    except Exception as e:
        print(f"An exception occurred in generate_story_outline_from_ai: {e}")
        raise

async def generate_chapter_plan_from_ai(request: schemas.ChapterPlanRequest) -> schemas.ChapterPlanResponse:
    """Generates a chapter plan by calling the configured AI model."""
    if not ai_client:
        print("Warning: AI client not supported. Falling back to mock data.")
        # ... (mock data logic remains)
    outline_json_str = json.dumps(request.outline, ensure_ascii=False, indent=2)
    prompt = CHAPTER_PLAN_PROMPT.format(outline_json=outline_json_str, chapter_count=request.chapter_count)
    try:
        response_json = await ai_client.generate_json(prompt)
        return schemas.ChapterPlanResponse(**response_json)
    except Exception as e:
        print(f"An exception occurred in generate_chapter_plan_from_ai: {e}")
        raise

async def stream_expand_from_ai(request: schemas.StoryExpandRequest) -> AsyncGenerator[str, None]:
    """
    Expands a chapter summary into full text using a streaming call to the AI model.
    """
    if not ai_client:
        print("Warning: AI client not supported. Using mock stream.")
        mock_text = "（模拟流式输出）夜色深沉。宫墙高耸，烛光如溺星沉落。"
        for word in mock_text.split("。"):
            if not word: continue
            chunk_data = {"chunk": word + "。"}
            yield f"data: {json.dumps(chunk_data, ensure_ascii=False)}\n\n"
            await asyncio.sleep(0.5)
        yield f"data: {json.dumps({'status': 'done'})}\n\n"
        return

    characters_json_str = json.dumps(request.characters, ensure_ascii=False, indent=2)
    prompt = PLOT_EXPANSION_PROMPT.format(
        chapter_summary=request.chapter_summary,
        style=request.style,
        characters_json=characters_json_str
    )

    try:
        async for text_chunk in ai_client.stream_generate(prompt):
            chunk_data = {"chunk": text_chunk}
            yield f"data: {json.dumps(chunk_data, ensure_ascii=False)}\n\n"
    except Exception as e:
        print(f"An exception occurred in stream_expand_from_ai: {e}")
        error_chunk = {"error": str(e)}
        yield f"data: {json.dumps(error_chunk, ensure_ascii=False)}\n\n"
    finally:
        yield f"data: {json.dumps({'status': 'done'})}\n\n"
