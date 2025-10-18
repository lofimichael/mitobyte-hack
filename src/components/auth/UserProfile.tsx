import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/utils/trpc';
import { useQueryClient } from '@tanstack/react-query';

export const UserProfile: React.FC = () => {
  const auth = useAuth();
  const queryClient = useQueryClient();

  const { data: userData, isLoading: userLoading } = trpc.example.getUser.useQuery(undefined, {
    enabled: auth.isAuthenticated,
  });
  
  const updateProfileMutation = trpc.example.updateProfile.useMutation({
    onSuccess: () => {
      console.log('Profile updated successfully');
    },
  });

  if (!auth.isAuthenticated) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p>Please sign in to view your profile</p>
        </CardContent>
      </Card>
    );
  }

  if (auth.loading || userLoading) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm">
            <span className="font-medium">Email:</span> {auth.user?.email}
          </p>
          
          <p className="text-sm">
            <span className="font-medium">Name:</span> {auth.user?.name}
          </p>
          
          <p className="text-sm">
            <span className="font-medium">ID:</span> {auth.user?.id}
          </p>

          {userData && (
            <p className="text-sm text-muted-foreground">
              Data from protected tRPC procedure: {JSON.stringify(userData.user)}
            </p>
          )}
        </div>
        
        <div className="flex gap-2 mt-4">
          <Button
            onClick={() => {
              updateProfileMutation.mutate({ 
                name: `Updated ${new Date().toLocaleTimeString()}` 
              });
            }}
            disabled={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Profile Name'
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={async () => {
              // Clear all React Query cache completely to prevent stale data
              queryClient.clear();
              await auth.signOut();
            }}
          >
            Sign Out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};