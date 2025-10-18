import "@/styles/globals.css";
import "@/lib/env"; // Validate env vars on startup
import type { AppProps } from "next/app";
import { trpc } from "@/utils/trpc";
import { Provider } from 'jotai';
import { AuthProvider } from '@/components/auth';
import { authStore } from '@/store/authStore';

function App({ Component, pageProps }: AppProps) {
  return (
    <Provider store={authStore}>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </Provider>
  );
}

export default trpc.withTRPC(App);