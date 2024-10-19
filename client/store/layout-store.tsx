import { create } from 'zustand';

interface InterfaceStore {
  showLeftSidebar: boolean;
  showSettingsOverlay: boolean;
  showTaskOverlay: boolean;
  toggleSettingsOverlay: () => void;
  toggleLeftSidebar: () => void;
  toggleTaskOverlay: () => void;
  closeTaskOverlay: () => void;
  setTaskOverlay: (open: boolean) => void;
  setSettingsOverlay: (open: boolean) => void;
}

export const useLayoutStore = create<InterfaceStore>((set) => ({
  showLeftSidebar: true,
  showSettingsOverlay: false,
  showTaskOverlay: false,
  toggleLeftSidebar: (): void =>
    set((state) => ({ showLeftSidebar: !state.showLeftSidebar })),
  toggleSettingsOverlay: (): void =>
    set((state) => ({ showSettingsOverlay: !state.showSettingsOverlay })),
  toggleTaskOverlay: (): void =>
    set((state) => ({ showTaskOverlay: !state.showTaskOverlay })),
  closeTaskOverlay: (): void => set(() => ({ showTaskOverlay: false })),
  setTaskOverlay: (open: boolean): void => set(() => ({ showTaskOverlay: open })),
  setSettingsOverlay: (open: boolean): void =>
    set(() => ({ showSettingsOverlay: open })),
}));
