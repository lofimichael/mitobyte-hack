import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/layout';
import { trpc } from '@/utils/trpc';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  // Protected query - auto-redirects to / on UNAUTHORIZED
  const { data, isLoading } = trpc.example.getUser.useQuery();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Will auto-redirect via global error handler if unauthorized
  if (!data) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-lg text-muted-foreground mb-8 mt-8">
          Hello, {data.user.name || data.user.email}!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Name: {data.user.name || 'Not provided'}
              </p>
              <p className="text-sm text-muted-foreground">
                Email: {data.user.email}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Start</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This is your dashboard. Start building your application from here.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}