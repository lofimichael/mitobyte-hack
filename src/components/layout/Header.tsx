import React, { useState } from 'react';
import { UserCircle, LogOut, UserPlus } from 'lucide-react';
import { useAtom } from 'jotai';
import { authStateAtom, signOutAtom } from '@/store/authStore';
import { useRouter } from 'next/router';
import { LoginForm, ForgotPasswordModal, MagicLinkModal } from '@/components/auth';
import { SignUpModal } from '@/components/auth/SignUpModal';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import { useQueryClient } from '@tanstack/react-query';

export const Header: React.FC = () => {
  const [authState] = useAtom(authStateAtom);
  const [, signOut] = useAtom(signOutAtom);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showMagicLinkModal, setShowMagicLinkModal] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      // Clear all React Query cache completely to prevent stale data
      queryClient.clear();

      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleLoginSuccess = () => {
    setShowLoginDialog(false);
    router.push('/dashboard');
  };

  const handleSignUpSuccess = () => {
    setShowSignUpModal(false);
    router.push('/dashboard');
  };

  const handleSwitchToSignUp = () => {
    setShowLoginDialog(false);
    setShowSignUpModal(true);
  };

  const handleSwitchToLogin = () => {
    setShowSignUpModal(false);
    setShowForgotPasswordModal(false);
    setShowMagicLinkModal(false);
    setShowLoginDialog(true);
  };

  const handleSwitchToForgotPassword = () => {
    setShowLoginDialog(false);
    setShowForgotPasswordModal(true);
  };

  const handleSwitchToMagicLink = () => {
    setShowLoginDialog(false);
    setShowMagicLinkModal(true);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-xl font-semibold">
            Kaiba
          </h1>

          <div className="flex items-center gap-2">
            {authState.isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground mr-2">
                  {authState.user?.name || authState.user?.email}
                </span>
                <Button variant="ghost" size="icon">
                  <UserCircle className="h-5 w-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleLogout} 
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={() => setShowSignUpModal(true)}
                  variant="outline"
                  className="gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Sign Up
                </Button>
                <Button 
                  onClick={() => setShowLoginDialog(true)}
                >
                  Login
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-md p-0">
          <DialogTitle className="sr-only">Login</DialogTitle>
          <DialogDescription className="sr-only">Sign in to your account to continue</DialogDescription>
          <LoginForm 
            onSuccess={handleLoginSuccess} 
            onSwitchToSignUp={handleSwitchToSignUp}
            onForgotPassword={handleSwitchToForgotPassword}
            onMagicLink={handleSwitchToMagicLink}
          />
        </DialogContent>
      </Dialog>

      <SignUpModal
        open={showSignUpModal}
        onClose={() => setShowSignUpModal(false)}
        onSuccess={handleSignUpSuccess}
        onSwitchToLogin={handleSwitchToLogin}
        onMagicLink={handleSwitchToMagicLink}
      />

      <ForgotPasswordModal
        open={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        onBackToLogin={handleSwitchToLogin}
      />

      <MagicLinkModal
        open={showMagicLinkModal}
        onClose={() => setShowMagicLinkModal(false)}
        onBackToLogin={handleSwitchToLogin}
      />
    </header>
  );
};