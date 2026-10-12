// src/pages/shared/ProfilePage.jsx
// View and edit profile: name, phone, address (editable).
// Email and role are shown read-only.

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../api/client';
import AppShell from '../../components/layout/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import FormField from '../../components/ui/FormField';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ErrorBlock from '../../components/ui/ErrorBlock';
import StatusBadge from '../../components/ui/StatusBadge';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { push } = useToast();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    setApiError('');
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Name is required.';
    return errors;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setLoading(true);
    setApiError('');
    try {
      await updateProfile({ name: form.name.trim(), phone: form.phone.trim() || undefined, address: form.address.trim() || undefined });
      push({ message: 'Profile updated successfully.', type: 'success' });
      setEditing(false);
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '' });
    setFieldErrors({});
    setApiError('');
    setEditing(false);
  };

  return (
    <AppShell>
      <PageHeader eyebrow="Account" title="My Profile" description="View and manage your account details." />

      <div className="max-w-lg">
        {/* Read-only fields */}
        <section className="border border-gray-200 rounded-md p-6 mb-6 flex flex-col gap-4">
          <h2 className="font-serif font-semibold text-green-900 text-lg">Account info</h2>

          <div className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-widest text-gray-500 font-medium">Email</p>
            <p className="text-sm text-gray-900">{user?.email}</p>
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-widest text-gray-500 font-medium">Role</p>
            <div><StatusBadge status={user?.role} /></div>
          </div>
        </section>

        {/* Editable fields */}
        <section className="border border-gray-200 rounded-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif font-semibold text-green-900 text-lg">Personal details</h2>
            {!editing && (
              <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                Edit
              </Button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSave} noValidate className="flex flex-col gap-4">
              {apiError && <ErrorBlock message={apiError} />}

              <FormField label="Full name" htmlFor="name" required error={fieldErrors.name}>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  error={!!fieldErrors.name}
                  disabled={loading}
                />
              </FormField>

              <FormField label="Phone number" htmlFor="phone" helperText="Include country code, e.g. +62812345678.">
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+62812345678"
                  disabled={loading}
                />
              </FormField>

              <FormField label="Address" htmlFor="address">
                <Input
                  id="address"
                  name="address"
                  type="text"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="City, Province"
                  disabled={loading}
                />
              </FormField>

              <div className="flex gap-3 pt-2">
                <Button type="submit" variant="primary" loading={loading} disabled={loading}>
                  Save changes
                </Button>
                <Button type="button" variant="secondary" onClick={handleCancel} disabled={loading}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <dl className="flex flex-col gap-4">
              <div>
                <dt className="text-xs uppercase tracking-widest text-gray-500 font-medium">Name</dt>
                <dd className="text-sm text-gray-900 mt-0.5">{user?.name || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-gray-500 font-medium">Phone</dt>
                <dd className="text-sm text-gray-900 mt-0.5">{user?.phone || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-gray-500 font-medium">Address</dt>
                <dd className="text-sm text-gray-900 mt-0.5">{user?.address || '—'}</dd>
              </div>
            </dl>
          )}
        </section>
      </div>
    </AppShell>
  );
}
