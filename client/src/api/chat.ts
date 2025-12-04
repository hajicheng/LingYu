import { apiClient } from './client'

export interface ChatResponse {
  message: string
  sessionId?: string
}

export const chatApi = {
  sendMessage: async (userId: string, message: string): Promise<ChatResponse> => {
    const response = await apiClient.post('/chat/message', {
      userId,
      message,
    })
    return response.data
  },

  getChatHistory: async (userId: string, sessionId?: string) => {
    const response = await apiClient.get('/chat/history', {
      params: { userId, sessionId },
    })
    return response.data
  },

  createSession: async (userId: string, title?: string) => {
    const response = await apiClient.post('/chat/session', {
      userId,
      title,
    })
    return response.data
  },
}
