// src/pages/auth/LoginPage.jsx
// Login form: email, password, API error, link to register.
// Logged-in users are redirected to their role home.

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../api/client';
import { roleHome } from '../../router/RoleRoute';
import FormField from '../../components/ui/FormField';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ErrorBlock from '../../components/ui/ErrorBlock';

export default function LoginPage() {
  const { login, user } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  if (user) {
    navigate(roleHome(user.role), { replace: true });
    return null;
  }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const u = await login(form);
      push({ message: `Welcome back, ${u.name}!`, type: 'success' });
      navigate(roleHome(u.role), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-md p-8 shadow-sm">
          {/* Header */}
          <div className="mb-6 text-center">
            <p className="font-serif text-3xl font-semibold text-green-900">icagria</p>
            <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {error && <ErrorBlock message={error} />}

            <FormField label="Email address" htmlFor="email" required>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                error={!!error}
                disabled={loading}
              />
            </FormField>

            <FormField label="Password" htmlFor="password" required>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                error={!!error}
                disabled={loading}
              />
            </FormField>

            <Button type="submit" variant="primary" size="lg" loading={loading} disabled={loading} className="w-full mt-2">
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-green-700 hover:text-green-900 hover:underline font-medium">
              Create one →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
