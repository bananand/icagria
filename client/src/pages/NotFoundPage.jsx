// src/pages/NotFoundPage.jsx
// 404 Not Found page.

import React from 'react';
import { Link } from 'react-router-dom';
import { MapPinOff } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center px-6 gap-4">
      <span className="text-gray-300"><MapPinOff size={48} aria-hidden="true" /></span>
      <p className="text-xs uppercase tracking-widest text-gray-500 font-medium">404</p>
      <h1 className="font-serif text-3xl font-semibold text-green-900">Page not found</h1>
      <p className="text-sm text-gray-600 max-w-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="mt-2 text-sm text-green-700 hover:text-green-900 hover:underline"
      >
        ← Back to home
      </Link>
    </div>
  );
}
