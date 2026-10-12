// src/components/layout/Footer.jsx
// Multi-column footer with wordmark and link columns.

import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-gray-200 bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-4 gap-8">
        {/* Wordmark column */}
        <div className="col-span-1">
          <p className="font-serif text-lg font-semibold text-green-900 mb-2">icagria</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            Supporting smallholder tuber and legume farmers with technology.
          </p>
        </div>

        {/* Farmers */}
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-3">Farmers</p>
          <ul className="flex flex-col gap-2">
            {[
              { to: '/app/dashboard', label: 'Dashboard' },
              { to: '/app/farms', label: 'Farms' },
              { to: '/app/soil-ph', label: 'Soil pH' },
              { to: '/app/weather', label: 'Weather' },
            ].map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className="text-sm text-gray-600 hover:text-green-700 transition-colors">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Marketplace */}
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-3">Marketplace</p>
          <ul className="flex flex-col gap-2">
            {[
              { to: '/app/marketplace', label: 'Browse listings' },
              { to: '/app/shop', label: 'Farm supplies' },
              { to: '/app/inquiries', label: 'My inquiries' },
            ].map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className="text-sm text-gray-600 hover:text-green-700 transition-colors">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Account */}
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-3">Account</p>
          <ul className="flex flex-col gap-2">
            {[
              { to: '/app/profile', label: 'Profile' },
              { to: '/login', label: 'Log in' },
              { to: '/register', label: 'Register' },
            ].map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className="text-sm text-gray-600 hover:text-green-700 transition-colors">{label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <p className="text-xs text-gray-400">© {year} icagria. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
