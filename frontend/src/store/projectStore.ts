import { create } from 'zustand';
import { Project, CharacterCreate, StoryOutlineCreate, Chapter, ChapterCreate } from '../types'; // Removed Character, StoryOutline
import { getProjects, createProject as apiCreateProject, getProject, saveCharacterToProject as apiSaveCharacterToProject, saveStoryOutlineToProject as apiSaveStoryOutlineToProject, saveChapterPlanToProject as apiSaveChapterPlanToProject, getCharactersForProject as apiGetCharactersForProject, getStoryOutlineForProject as apiGetStoryOutlineForProject, getChaptersForProject as apiGetChaptersForProject, updateChapterContent as apiUpdateChapterContent } from '../services/api'; // Added updateChapterContent

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchProjects: () => Promise<void>;
  selectProject: (projectId: number) => Promise<void>;
  createNewProject: (name: string, description?: string) => Promise<void>;
  saveCharacterToProject: (projectId: number, characterData: CharacterCreate) => Promise<void>;
  saveStoryOutlineToProject: (projectId: number, outlineData: StoryOutlineCreate) => Promise<void>;
  saveChapterPlanToProject: (projectId: number, chapterPlanData: ChapterCreate[]) => Promise<void>;
  saveExpandedChapterContent: (chapterId: number, content: string) => Promise<void>; // New action
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const fetchedProjects = await getProjects();
      set({ projects: fetchedProjects, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch projects.', loading: false });
      console.error('Error fetching projects:', error);
    }
  },

  selectProject: async (projectId: number) => {
    set({ loading: true, error: null });
    try {
      const project = await getProject(projectId); // Fetch basic project info
      
      // Fetch related data in parallel
      const [characters, storyOutline, chapters] = await Promise.all([
        apiGetCharactersForProject(projectId),
        apiGetStoryOutlineForProject(projectId).catch(err => {
          // Handle 404 for outline/chapters gracefully as they might not exist yet
          if (err instanceof Error && err.message.includes('404')) return null;
          throw err;
        }),
        apiGetChaptersForProject(projectId).catch(err => {
          if (err instanceof Error && err.message.includes('404')) return [];
          throw err;
        }),
      ]);

      const fullProject: Project = {
        ...project,
        characters: characters || [],
        story_outline: storyOutline,
        chapters: chapters || [],
      };

      set({ currentProject: fullProject, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : `Failed to load project ${projectId}.`, loading: false });
      console.error(`Error loading project ${projectId}:`, error);
    }
  },

  createNewProject: async (name: string, description?: string) => {
    set({ loading: true, error: null });
    try {
      const newProjectData = { name, description };
      const project = await apiCreateProject(newProjectData);
      set((state) => ({
        projects: [...state.projects, project],
        currentProject: project,
        loading: false,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create new project.', loading: false });
      console.error('Error creating new project:', error);
    }
  },

  saveCharacterToProject: async (projectId: number, characterData: CharacterCreate) => {
    set({ loading: true, error: null });
    try {
      const savedCharacter = await apiSaveCharacterToProject(projectId, characterData);
      set((state) => {
        if (state.currentProject && state.currentProject.id === projectId) {
          // Ensure characters array exists and update it
          const updatedCharacters = state.currentProject.characters ? [...state.currentProject.characters, savedCharacter] : [savedCharacter];
          return {
            currentProject: {
              ...state.currentProject,
              characters: updatedCharacters,
            },
            loading: false,
          };
        }
        return { loading: false }; // If no current project or projectId mismatch, just stop loading
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to save character.', loading: false });
      console.error('Error saving character:', error);
    }
  },

  saveStoryOutlineToProject: async (projectId: number, outlineData: StoryOutlineCreate) => {
    set({ loading: true, error: null });
    try {
      const savedOutline = await apiSaveStoryOutlineToProject(projectId, outlineData);
      set((state) => {
        if (state.currentProject && state.currentProject.id === projectId) {
          return {
            currentProject: {
              ...state.currentProject,
              story_outline: savedOutline, // Update story_outline
            },
            loading: false,
          };
        }
        return { loading: false }; // If no current project or projectId mismatch, just stop loading
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to save story outline.', loading: false });
      console.error('Error saving story outline:', error);
    }
  },

  saveChapterPlanToProject: async (projectId: number, chapterPlanData: ChapterCreate[]) => {
    set({ loading: true, error: null });
    try {
      const savedChapters: Chapter[] = [];
      for (const chapterCreate of chapterPlanData) {
        // Backend API expects a single ChapterCreate, so call for each
        const savedChapter = await apiSaveChapterPlanToProject(projectId, chapterCreate);
        savedChapters.push(savedChapter);
      }
      
      set((state) => {
        if (state.currentProject && state.currentProject.id === projectId) {
          // Replace all chapters in the current project (assuming a full plan overwrite)
          return {
            currentProject: {
              ...state.currentProject,
              chapters: savedChapters, 
            },
            loading: false,
          };
        }
        return { loading: false }; // If no current project or projectId mismatch, just stop loading
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to save chapter plan.', loading: false });
      console.error('Error saving chapter plan:', error);
    }
  },

  saveExpandedChapterContent: async (chapterId: number, content: string) => {
    set({ loading: true, error: null });
    try {
      const updatedChapter = await apiUpdateChapterContent(chapterId, content);
      set((state) => {
        if (state.currentProject && state.currentProject.chapters) {
          const updatedChapters = state.currentProject.chapters.map(chap => 
            chap.id === chapterId ? { ...chap, content: updatedChapter.content } : chap
          );
          return {
            currentProject: {
              ...state.currentProject,
              chapters: updatedChapters,
            },
            loading: false,
          };
        }
        return { loading: false };
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to save expanded chapter content.', loading: false });
      console.error('Error saving expanded chapter content:', error);
    }
  },
}));
