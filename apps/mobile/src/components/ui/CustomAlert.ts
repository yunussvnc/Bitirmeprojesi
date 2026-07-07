import { useAlertStore, AlertButton } from '@/src/store/useAlertStore';

export const CustomAlert = {
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: any
  ) => {
    // If no buttons are provided, default to a standard "OK" button
    const defaultButtons: AlertButton[] = [{ text: 'Tamam' }];
    useAlertStore.getState().showAlert(title, message, buttons || defaultButtons, options);
  },
};
