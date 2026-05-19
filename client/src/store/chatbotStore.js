import { create } from 'zustand';

const useChatbotStore = create((set) => ({
  messages: null, // Start with null to detect first initialization
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...(state.messages || []), message] })),
}));

export default useChatbotStore;
