import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
}

const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'dark' as ThemeMode,
      
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