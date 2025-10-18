import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/layout';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check for error query parameter
    if (router.query.error === 'invalid-reset-link') {
      setErrorMessage('Invalid or expired password reset link. Please request a new one.');
      // Clean up the URL
      router.replace('/', undefined, { shallow: true });
    }
  }, [router]);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4">
        {errorMessage && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded">
            {errorMessage}
            <button
              onClick={() => setErrorMessage(null)}
              className="ml-4 text-destructive hover:text-destructive/80"
            >
              ×
            </button>
          </div>
        )}

        <div className="text-center py-20">
          <h1 className="text-4xl font-bold mb-4">Welcome to Kaiba</h1>
          <p className="text-lg text-muted-foreground">
            A very based template for building good SaaS
          </p>
        </div>
      </div>
    </Layout>
  );
}