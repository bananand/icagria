// src/pages/LandingPage.jsx
// Public landing page placeholder.

import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Simple header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-serif text-xl font-semibold text-green-900">icagria</span>
          <nav className="flex items-center gap-4">
            <Link to="/login" className="text-sm text-gray-600 hover:text-green-900 transition-colors">Sign in</Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-green-900 text-white text-sm font-medium hover:bg-green-800 transition-colors"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 gap-6">
        <span className="text-green-700">
          <Leaf size={48} aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-3">Smallholder agriculture, simplified</p>
          <h1 className="font-serif text-5xl font-semibold text-green-900 leading-tight max-w-xl mx-auto">
            Monitor, grow, and sell with icagria
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-lg mx-auto leading-relaxed">
            Soil pH monitoring, weather insights, farm management, and a direct marketplace for tuber and legume farmers.
          </p>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <Link
            to="/register"
            className="inline-flex items-center gap-1.5 px-6 py-3 rounded bg-green-900 text-white font-medium hover:bg-green-800 transition-colors"
          >
            Create free account →
          </Link>
          <Link to="/login" className="text-sm text-green-700 hover:underline">
            Already a member? Sign in
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 px-6 py-4">
        <p className="text-xs text-gray-400 text-center">© {new Date().getFullYear()} icagria</p>
      </footer>
    </div>
  );
}
