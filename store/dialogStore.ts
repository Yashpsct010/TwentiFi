import { create } from 'zustand';

export interface DialogButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface DialogState {
  isVisible: boolean;
  title: string;
  message: string;
  buttons: DialogButton[];
  showDialog: (title: string, message: string, buttons?: DialogButton[]) => void;
  hideDialog: () => void;
}

export const useDialogStore = create<DialogState>((set) => ({
  isVisible: false,
  title: '',
  message: '',
  buttons: [],
  showDialog: (title, message, buttons = [{ text: 'OK' }]) => 
    set({ isVisible: true, title, message, buttons }),
  hideDialog: () => set({ isVisible: false }),
}));
