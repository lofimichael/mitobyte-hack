import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  X, 
  Mail,
  Sparkles,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface MagicLinkModalProps {
  open: boolean;
  onClose: () => void;
  onBackToLogin?: () => void;
}

export const MagicLinkModal: React.FC<MagicLinkModalProps> = ({ 
  open, 
  onClose, 
  onBackToLogin 
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = () => {
    if (!email) {
      setError('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateEmail()) return;

    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: true, // Allow sign up through magic links
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      
      if (error) {
        setError(error.message);
        return;
      }
      
      setSuccess('Magic link sent! Please check your email.');
      setEmailSent(true);
      
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError(null);
    setSuccess(null);
    setEmailSent(false);
    setLoading(false);
    onClose();
  };

  const handleBackToLogin = () => {
    handleClose();
    onBackToLogin?.();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center relative">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
          
          <div className="flex flex-col items-center gap-2 mt-2">
            <div className="w-15 h-15 rounded-full bg-purple-600 flex items-center justify-center mb-2">
              <Sparkles className="text-white" size={30} />
            </div>
            
            <DialogTitle className="text-2xl font-bold">
              Magic Link
            </DialogTitle>
            
            <p className="text-sm text-muted-foreground text-center">
              {emailSent 
                ? 'Check your email for the magic link'
                : 'Sign in without a password - we\'ll send you a magic link'
              }
            </p>
          </div>
        </DialogHeader>

        {emailSent ? (
          <div className="text-center py-8 flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mb-4">
              <Mail className="text-white" size={40} />
            </div>
            
            <h3 className="text-xl font-bold">
              Check Your Email
            </h3>
            
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              We've sent a magic link to <strong>{email}</strong>. 
              Click the link in your email to sign in instantly - no password required!
            </p>
            
            <div className="flex gap-4 mt-4">
              <Button
                onClick={handleClose}
                size="lg"
                className="px-6"
              >
                Got it!
              </Button>
              
              <Button
                variant="outline"
                onClick={handleBackToLogin}
                size="lg"
                className="px-6"
              >
                Back to Login
              </Button>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <Alert className="mb-6" variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="mb-6">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="mt-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full mt-6 mb-6 h-12 text-lg font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    'Send Magic Link ✨'
                  )}
                </Button>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Prefer traditional login?{' '}
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="font-semibold text-primary hover:underline"
                  >
                    Sign in with password
                  </button>
                </p>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};