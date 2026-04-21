import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useThemeStore = create(
  persist(
    (set) => ({
      mode: 'dark',
      
      toggleMode: () => set((state) => ({ 
        mode: state.mode === 'dark' ? 'light' : 'dark' 
      })),
      
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'axpesa-theme',
    }
  )
);

export default useThemeStore;