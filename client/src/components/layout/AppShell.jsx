// src/components/layout/AppShell.jsx
// Main layout: sticky TopNav + <main> content area + Footer.
// Wraps all protected pages.

import React from 'react';
import TopNav from './TopNav';
import Footer from './Footer';

/**
 * @param {{ children: React.ReactNode }} props
 */
export default function AppShell({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
