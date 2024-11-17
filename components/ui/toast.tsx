import { toast as sonnerToast, Toaster as SonnerToaster } from 'sonner';

export const toast = {
  success: (message: string) => {
    sonnerToast.success(message);
  },
  error: (message: string) => {
    sonnerToast.error(message);
  }
};

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      toastOptions={{
        style: {
          background: 'rgb(31 41 55)',
          color: 'rgb(229 231 235)',
          border: '1px solid rgb(75 85 99)',
        },
      }}
    />
  );
} 