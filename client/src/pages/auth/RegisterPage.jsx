// src/pages/auth/RegisterPage.jsx
// Registration form: name, email, password, confirmPassword, role (Farmer/Buyer), optional phone.
// Client-side validations mirror backend: password >= 8 chars, passwords match.
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

const ROLE_OPTIONS = [
  {
    value: 'farmer',
    label: 'Farmer',
    description: 'Monitor soil pH, manage farms and crops, sell harvest on the marketplace.',
  },
  {
    value: 'buyer',
    label: 'Buyer',
    description: 'Browse harvest listings and contact farmers to purchase produce.',
  },
];

const INITIAL_FORM = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'farmer',
  phone: '',
};

export default function RegisterPage() {
  const { register, user } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  if (user) {
    navigate(roleHome(user.role), { replace: true });
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    setApiError('');
  };

  /** Client-side validation mirroring the backend rules */
  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Name is required.';
    if (!form.email.trim()) errors.email = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email address.';
    if (!form.password) errors.password = 'Password is required.';
    else if (form.password.length < 8) errors.password = 'Password must be at least 8 characters.';
    if (!form.confirmPassword) errors.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match.';
    if (!form.role) errors.role = 'Please select a role.';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    setApiError('');

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      confirmPassword: form.confirmPassword,
      role: form.role,
    };
    if (form.phone.trim()) payload.phone = form.phone.trim();

    try {
      const u = await register(payload);
      push({ message: `Welcome to icagria, ${u.name}!`, type: 'success' });
      navigate(roleHome(u.role), { replace: true });
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="bg-white border border-gray-200 rounded-md p-8 shadow-sm">
          {/* Header */}
          <div className="mb-6 text-center">
            <p className="font-serif text-3xl font-semibold text-green-900">icagria</p>
            <p className="text-sm text-gray-500 mt-1">Create your account</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {apiError && <ErrorBlock message={apiError} />}

            {/* Name */}
            <FormField label="Full name" htmlFor="name" required error={fieldErrors.name}>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your full name"
                error={!!fieldErrors.name}
                disabled={loading}
              />
            </FormField>

            {/* Email */}
            <FormField label="Email address" htmlFor="email" required error={fieldErrors.email}>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                error={!!fieldErrors.email}
                disabled={loading}
              />
            </FormField>

            {/* Password */}
            <FormField
              label="Password"
              htmlFor="password"
              required
              helperText="Minimum 8 characters."
              error={fieldErrors.password}
            >
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                placeholder="At least 8 characters"
                error={!!fieldErrors.password}
                disabled={loading}
              />
            </FormField>

            {/* Confirm password */}
            <FormField label="Confirm password" htmlFor="confirmPassword" required error={fieldErrors.confirmPassword}>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat your password"
                error={!!fieldErrors.confirmPassword}
                disabled={loading}
              />
            </FormField>

            {/* Role selector */}
            <fieldset>
              <legend className="text-sm font-medium text-gray-700 mb-2">
                I am a <span className="text-red-700" aria-hidden="true">*</span>
              </legend>
              <div className="grid grid-cols-2 gap-3">
                {ROLE_OPTIONS.map(({ value, label, description }) => (
                  <label
                    key={value}
                    className={[
                      'flex flex-col gap-1 border rounded-md p-3 cursor-pointer transition-colors',
                      form.role === value
                        ? 'border-green-700 bg-green-50'
                        : 'border-gray-200 hover:border-green-300',
                    ].join(' ')}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={value}
                      checked={form.role === value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="font-medium text-sm text-gray-900">{label}</span>
                    <span className="text-xs text-gray-500 leading-relaxed">{description}</span>
                  </label>
                ))}
              </div>
              {fieldErrors.role && (
                <p role="alert" className="text-xs text-red-700 mt-1">⚠ {fieldErrors.role}</p>
              )}
            </fieldset>

            {/* Phone (optional) */}
            <FormField
              label="Phone number"
              htmlFor="phone"
              helperText="Optional. Include country code, e.g. +62812345678."
              error={fieldErrors.phone}
            >
              <Input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="+62812345678"
                error={!!fieldErrors.phone}
                disabled={loading}
              />
            </FormField>

            <Button type="submit" variant="primary" size="lg" loading={loading} disabled={loading} className="w-full mt-2">
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-green-700 hover:text-green-900 hover:underline font-medium">
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
