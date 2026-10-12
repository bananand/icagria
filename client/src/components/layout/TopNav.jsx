// src/components/layout/TopNav.jsx
// Sticky top bar: serif wordmark, role-aware nav links, user name, logout button.
// Bell slot reserved for farmer alerts (wired in a later prompt).

import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAlerts } from '../../context/AlertsContext';
import { Bell, LogOut } from 'lucide-react';

/* Role → nav links map */
const NAV_LINKS = {
  farmer: [
    { to: '/app/dashboard', label: 'Dashboard' },
    { to: '/app/farms', label: 'Farms' },
    { to: '/app/crops', label: 'Crops' },
    { to: '/app/soil-ph', label: 'Soil pH' },
    { to: '/app/weather', label: 'Weather' },
    { to: '/app/marketplace', label: 'Marketplace' },
    { to: '/app/shop', label: 'Shop' },
    { to: '/app/reports', label: 'Reports' },
  ],
  buyer: [
    { to: '/app/marketplace', label: 'Marketplace' },
    { to: '/app/inquiries', label: 'My Inquiries' },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/products', label: 'Products' },
    { to: '/admin/listings', label: 'Listings' },
    { to: '/admin/bookings', label: 'Bookings' },
  ],
};

export default function TopNav() {
  const { user, logout } = useAuth();
  const { push } = useToast();
  const { unreadCount } = useAlerts();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const links = user ? (NAV_LINKS[user.role] || []) : [];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-6">
        {/* Wordmark */}
        <Link
          to={user ? (user.role === 'admin' ? '/admin' : user.role === 'buyer' ? '/app/marketplace' : '/app/dashboard') : '/'}
          className="font-serif text-xl font-semibold text-green-900 shrink-0 hover:text-green-700 transition-colors"
        >
          icagria
        </Link>

        {/* Separator */}
        <div className="h-5 w-px bg-gray-200 shrink-0" />

        {/* Role-aware nav links */}
        <nav aria-label="Main navigation" className="flex items-center gap-1 overflow-x-auto">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
              className={({ isActive }) =>
                [
                  'px-3 py-1.5 text-sm rounded whitespace-nowrap transition-colors focus-ring',
                  isActive
                    ? 'bg-green-50 text-green-900 font-medium'
                    : 'text-gray-600 hover:text-green-900 hover:bg-green-50',
                ].join(' ')
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Bell slot — farmer only */}
          {user?.role === 'farmer' && (
            <Link
              to="/app/alerts"
              className="relative p-1.5 text-gray-500 hover:text-green-900 transition-colors focus-ring rounded"
              aria-label={unreadCount > 0 ? `Alerts (${unreadCount} unread)` : 'Alerts'}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-700 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          )}

          {/* User name */}
          {user && (
            <Link
              to={user.role === 'admin' ? '/admin/profile' : '/app/profile'}
              className="text-sm text-gray-700 hover:text-green-900 transition-colors focus-ring rounded px-1"
            >
              {user.name}
            </Link>
          )}

          {/* Logout */}
          {user && (
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-700 transition-colors focus-ring rounded px-2 py-1"
            >
              <LogOut size={14} aria-hidden="true" />
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
