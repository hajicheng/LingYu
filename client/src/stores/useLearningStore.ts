import { create } from 'zustand'

interface LearningContent {
  id: string
  title: string
  content: string
  type: 'text' | 'audio' | 'video'
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface LearningStats {
  totalContent: number
  studiedToday: number
  streak: number
  totalStudyTime: number
}

interface LearningState {
  contents: LearningContent[]
  stats: LearningStats | null
  isLoading: boolean
  error: string | null
  
  // Actions
  setContents: (contents: LearningContent[]) => void
  addContent: (content: LearningContent) => void
  updateContent: (id: string, updates: Partial<LearningContent>) => void
  deleteContent: (id: string) => void
  setStats: (stats: LearningStats) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useLearningStore = create<LearningState>((set) => ({
  contents: [],
  stats: null,
  isLoading: false,
  error: null,
  
  setContents: (contents) => set({ contents }),
  
  addContent: (content) => 
    set((state) => ({ 
      contents: [content, ...state.contents] 
    })),
  
  updateContent: (id, updates) =>
    set((state) => ({
      contents: state.contents.map((content) =>
        content.id === id ? { ...content, ...updates } : content
      ),
    })),
  
  deleteContent: (id) =>
    set((state) => ({
      contents: state.contents.filter((content) => content.id !== id),
    })),
  
  setStats: (stats) => set({ stats }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}))
