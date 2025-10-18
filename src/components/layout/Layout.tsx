import React from 'react';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
  background?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children, background }) => {
  return (
    <div className="min-h-screen bg-background relative">
      {background}
      <Header />
      <main className="p-6 w-full relative z-10 pt-20">
        {children}
      </main>
    </div>
  );
};