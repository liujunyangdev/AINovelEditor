import {
  ProjectCreate,
  Project,
  CharacterGenerateRequest,
  CharacterGenerateResponse,
  StoryOutlineRequest,
  StoryOutlineResponse,
  ChapterPlanRequest,
  ChapterPlanResponse,
  StoryExpandRequest,
  CharacterCreate,
  Character,
  StoryOutline,
  StoryOutlineCreate,
  Chapter,
  ChapterCreate,
  // Removed ChapterContentUpdate // This is the change
  // Assuming streaming response will be handled
} from '../types';

const API_BASE_URL = 'http://127.0.0.1:8000'; // Or whatever the backend FastAPI URL is

// ====================================================================
// Utility for non-streaming JSON API calls
// ====================================================================
async function fetchJsonApi<T>(
  endpoint: string,
  method: string,
  data?: any,
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const options: RequestInit = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail?.message || `HTTP error! status: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

// ====================================================================
// Utility for streaming text API calls (Server-Sent Events)
// ====================================================================
async function streamTextApi(
  endpoint: string,
  method: string,
  data?: any,
): Promise<AsyncGenerator<string, void, unknown>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const options: RequestInit = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  if (!response.body) {
    throw new Error('ReadableStream not supported');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  async function* streamDecoder() {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      for (const line of chunk.split('\n')) {
        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.substring(6);
            const parsed = JSON.parse(jsonStr);
            if (parsed.chunk) {
              yield parsed.chunk;
            } else if (parsed.status === 'done' || parsed.error) {
              reader.releaseLock();
              return;
            }
          } catch (e) {
            console.error('Failed to parse stream chunk:', e, line);
          }
        }
      }
    }
  }
  return streamDecoder();
}


// ====================================================================
// Project Endpoints
// ====================================================================

export const createProject = (projectData: ProjectCreate) => 
  fetchJsonApi<Project>('/projects/', 'POST', projectData);

export const getProjects = () => 
  fetchJsonApi<Project[]>('/projects/', 'GET');

export const getProject = (projectId: number) => 
  fetchJsonApi<Project>(`/projects/${projectId}`, 'GET');

// ====================================================================
// AI Generation Endpoints
// ====================================================================

export const generateCharacter = (request: CharacterGenerateRequest) =>
  fetchJsonApi<CharacterGenerateResponse>('/character/generate', 'POST', request);

export const generateStoryOutline = (request: StoryOutlineRequest) =>
  fetchJsonApi<StoryOutlineResponse>('/story/outline', 'POST', request);

export const generateChapterPlan = (request: ChapterPlanRequest) =>
  fetchJsonApi<ChapterPlanResponse>('/story/chapters', 'POST', request);

export const streamExpandStory = (request: StoryExpandRequest) =>
  streamTextApi('/story/expand', 'POST', request);

// ====================================================================
// Data Endpoints (Characters, Outlines, Chapters within a Project)
// Not fully implemented yet, but placeholders for later
// ====================================================================

// ====================================================================
// Data Endpoints (Characters, Outlines, Chapters within a Project)
// ====================================================================

export const saveCharacterToProject = (projectId: number, characterData: CharacterCreate) =>
  fetchJsonApi<Character>(`/projects/${projectId}/characters/`, 'POST', characterData);

export const getCharactersForProject = (projectId: number) =>
  fetchJsonApi<Character[]>(`/projects/${projectId}/characters/`, 'GET');

export const saveStoryOutlineToProject = (projectId: number, outlineData: StoryOutlineCreate) =>
  fetchJsonApi<StoryOutline>(`/projects/${projectId}/story_outline/`, 'POST', outlineData);

export const saveChapterPlanToProject = (projectId: number, chapterData: ChapterCreate) =>
  fetchJsonApi<Chapter>(`/projects/${projectId}/chapters/`, 'POST', chapterData);

export const getStoryOutlineForProject = (projectId: number) =>
  fetchJsonApi<StoryOutline>(`/projects/${projectId}/story_outline/`, 'GET');

export const getChaptersForProject = (projectId: number) =>
  fetchJsonApi<Chapter[]>(`/projects/${projectId}/chapters/`, 'GET');

export const updateChapterContent = (chapterId: number, content: string) =>
  fetchJsonApi<Chapter>(`/chapters/${chapterId}`, 'PUT', { content });