// ====================================================================
// API Request Schemas (from backend/schemas.py)
// ====================================================================

export interface CharacterGenerateRequest {
  theme: string;
  prompt_question: string;
  options?: Record<string, any>; // Optional dictionary
}

export interface StoryOutlineRequest {
  theme: string;
  style: string;
  characters: Array<Record<string, any>>; // Array of character data
}

export interface ChapterPlanRequest {
  outline: Record<string, any>; // StoryOutlineResponse structure
  chapter_count: number;
}

export interface StoryExpandRequest {
  chapter_summary: string;
  characters: Array<Record<string, any>>; // Array of character data
  style: string;
}

// ====================================================================
// API Response Schemas (from backend/schemas.py)
// ====================================================================

export interface CharacterGenerateResponse {
  name: string;
  age: number;
  personality: string;
  family_background: string;
  social_class: string;
  growth_experiences: string;
  education_and_culture: string;
  profession_and_skills: string;
  inner_conflict: string;
}

export interface StoryOutlineResponse {
  story_theme: string;
  core_conflict: string;
  character_relationships: string;
  world_setting: string;
  plot_structure: string[];
  abstract_outline: string;
}

export interface ChapterPlanResponse {
  chapters: Array<{
    index: number;
    position: string; // e.g., "铺垫/推进/冲突/转折/高潮/收束"
    dramatic_goal: string;
    inner_conflict_display: string;
    summary: string;
  }>;
}

export interface StoryExpandResponse {
  chapter_text: string;
}

// ====================================================================
// Database Schemas (CRUD) (from backend/schemas.py)
// These define the structure of data stored/retrieved from the DB
// ====================================================================

export interface CharacterBase {
  data: Record<string, any>; // The generated character data as JSON
}

export interface CharacterCreate extends CharacterBase {}

export interface Character extends CharacterBase {
  id: number;
  project_id: number;
}

export interface StoryOutlineBase {
  data: Record<string, any>; // The generated outline data as JSON
}

export interface StoryOutlineCreate extends StoryOutlineBase {}

export interface StoryOutline extends StoryOutlineBase {
  id: number;
  project_id: number;
}

export interface ChapterBase {
  plan_data: Record<string, any>; // The generated chapter plan data as JSON
  content?: string | null; // The expanded chapter text
  chapter_index: number;
}

export interface ChapterCreate extends ChapterBase {}

export interface Chapter extends ChapterBase {
  id: number;
  project_id: number;
  chapter_index: number; // Redundant but explicit
}

export interface ChapterContentUpdate {
  content: string;
}

export interface ProjectBase {
  name: string;
  description?: string | null;
}

export interface ProjectCreate extends ProjectBase {}

export interface Project extends ProjectBase {
  id: number;
  characters: Character[];
  story_outline?: StoryOutline | null; // Added
  chapters?: Chapter[]; // Added
}

// ====================================================================
// Unified Error Handling (from backend/schemas.py)
// ====================================================================

export interface ErrorDetail {
  code: string;
  message: string;
}

export interface ErrorResponse {
  detail: ErrorDetail;
}
