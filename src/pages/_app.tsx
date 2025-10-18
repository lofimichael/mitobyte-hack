import "@/styles/globals.css";
import "@/lib/env"; // Validate env vars on startup
import type { AppProps } from "next/app";
import { trpc } from "@/utils/trpc";
import { Provider } from 'jotai';
import { AuthProvider } from '@/components/auth';
import { authStore } from '@/store/authStore';
import { Toaster } from '@/components/ui/sonner';

function App({ Component, pageProps }: AppProps) {
  return (
    <Provider store={authStore}>
      <AuthProvider>
        <Component {...pageProps} />
        <Toaster position="top-right" />
      </AuthProvider>
    </Provider>
  );
}

export default trpc.withTRPC(App);