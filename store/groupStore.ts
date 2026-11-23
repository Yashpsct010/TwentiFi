import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface GroupState {
  groups: string[];
  addGroup: (groupName: string) => void;
  removeGroup: (groupName: string) => void;
  renameGroup: (oldName: string, newName: string) => void;
  clearGroups: () => void;
}

export const useGroupStore = create<GroupState>()(
  persist(
    (set) => ({
      groups: ["Uncategorized", "Deep Work", "Side Project", "Life Admin", "Learning"],
      addGroup: (groupName: string) => set((state) => {
        const trimmed = groupName.trim();
        if (!trimmed || state.groups.includes(trimmed)) return state;
        return { groups: [...state.groups, trimmed] };
      }),
      removeGroup: (groupName: string) => set((state) => ({
        groups: state.groups.filter((g) => g !== groupName)
      })),
      renameGroup: (oldName: string, newName: string) => set((state) => {
        const trimmed = newName.trim();
        if (!trimmed || state.groups.includes(trimmed)) return state;
        return {
          groups: state.groups.map((g) => (g === oldName ? trimmed : g)),
        };
      }),
      clearGroups: () => set({ groups: ["Uncategorized"] }),
    }),
    {
      name: 'group-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
