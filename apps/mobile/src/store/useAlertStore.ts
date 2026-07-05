import { create } from 'zustand';

export interface AlertButton {
  text?: string;
  onPress?: (value?: string) => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertState {
  isOpen: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  options?: any;
}

interface AlertStore extends AlertState {
  showAlert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: any
  ) => void;
  hideAlert: () => void;
}

export const useAlertStore = create<AlertStore>((set) => ({
  isOpen: false,
  title: '',
  message: undefined,
  buttons: undefined,
  options: undefined,

  showAlert: (title, message, buttons, options) => {
    set({
      isOpen: true,
      title,
      message,
      buttons,
      options,
    });
  },

  hideAlert: () => {
    set({ isOpen: false });
    // setTimeout ile içeriği temizleyebiliriz (animasyon bittikten sonra)
    setTimeout(() => {
      set({
        title: '',
        message: undefined,
        buttons: undefined,
        options: undefined,
      });
    }, 300); // Animasyon süresi kadar bekle
  },
}));
