// src/pages/admin/AdminUsersPage.jsx
// Admin Users Management: search & role filter, table, view details with counts, edit role/details, delete with cascade confirmation.
import React, { useEffect, useState, useId } from 'react';
import {
  Users,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  AlertTriangle,
  MapPin,
  ShoppingBag,
  CalendarCheck,
  Phone,
  Mail,
  Shield,
} from 'lucide-react';

import AppShell from '../../components/layout/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import FormField from '../../components/ui/FormField';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import ErrorBlock from '../../components/ui/ErrorBlock';
import { TableContainer, Th, Td } from '../../components/ui/Table';

import { getUsers } from '../../api/users';
import { getAdminUserById, updateAdminUser, deleteAdminUser } from '../../api/admin';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/format';

export default function AdminUsersPage() {
  const { user: currentAdmin } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [roleFilter, setRoleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Detail Modal State
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Edit Modal State
  const [editUser, setEditUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    address: '',
    role: 'farmer',
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete Dialog State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmEmailInput, setConfirmEmailInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const searchInputId = useId();
  const roleSelectId = useId();

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (roleFilter) params.role = roleFilter;
      const data = await getUsers(params);
      setUsers(data || []);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  // Client-side search by name or email
  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesName = (u.name || '').toLowerCase().includes(q);
    const matchesEmail = (u.email || '').toLowerCase().includes(q);
    return matchesName || matchesEmail;
  });

  // Open Detail
  const handleOpenDetail = async (userId) => {
    setDetailModalOpen(true);
    setLoadingDetail(true);
    try {
      const data = await getAdminUserById(userId);
      setSelectedUserDetail(data);
    } catch (err) {
      showToast(err?.response?.data?.error || 'Failed to load user details', 'error');
      setDetailModalOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Open Edit
  const handleOpenEdit = (user) => {
    setEditUser(user);
    setEditFormData({
      name: user.name || '',
      phone: user.phone || '',
      address: user.address || '',
      role: user.role || 'farmer',
    });
    setEditError('');
  };

  // Submit Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    setSavingEdit(true);
    setEditError('');
    try {
      const updated = await updateAdminUser(editUser._id, editFormData);
      showToast('User profile updated successfully', 'success');
      setUsers((prev) => prev.map((u) => (u._id === updated._id ? { ...u, ...updated } : u)));
      setEditUser(null);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Failed to update user';
      setEditError(msg);
      showToast(msg, 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // Open Delete
  const handleOpenDelete = (user) => {
    setDeleteTarget(user);
    setConfirmEmailInput('');
    setDeleteError('');
  };

  // Confirm Delete
  const handleConfirmDelete = async (e) => {
    e.preventDefault();
    if (!deleteTarget) return;
    if (confirmEmailInput.trim().toLowerCase() !== deleteTarget.email.toLowerCase()) {
      setDeleteError('Entered email does not match');
      return;
    }

    setDeleting(true);
    setDeleteError('');
    try {
      await deleteAdminUser(deleteTarget._id);
      showToast(`User ${deleteTarget.name} and all data deleted successfully`, 'success');
      setUsers((prev) => prev.filter((u) => u._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Failed to delete user';
      setDeleteError(msg);
      showToast(msg, 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="System Administration"
        title="User Management"
        description="View all registered platform accounts, audit activity footprints, update role assignments, or remove accounts."
      />

      {/* Filter and Search Bar */}
      <section aria-label="User search and filters" className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-80 relative">
            <label htmlFor={searchInputId} className="sr-only">Search users by name or email</label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              <input
                id={searchInputId}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700 bg-white"
              />
            </div>
          </div>

          <div className="w-full md:w-auto flex items-center gap-3">
            <label htmlFor={roleSelectId} className="text-sm font-medium text-gray-700 whitespace-nowrap flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-gray-400" aria-hidden="true" />
              Role:
            </label>
            <select
              id={roleSelectId}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700 bg-white"
            >
              <option value="">All Roles</option>
              <option value="farmer">Farmer</option>
              <option value="buyer">Buyer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Spinner size="lg" className="text-green-700" />
          <p className="mt-4 text-sm font-medium">Loading user records...</p>
        </div>
      ) : error ? (
        <ErrorBlock message={error} onRetry={loadUsers} />
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon={<Users size={40} />}
          title="No users found"
          description={
            searchQuery || roleFilter
              ? 'No registered users match your search or role filter.'
              : 'There are currently no registered users on the platform.'
          }
        />
      ) : (
        <TableContainer>
          <thead className="bg-gray-50">
            <tr>
              <Th>User</Th>
              <Th>Role</Th>
              <Th>Phone</Th>
              <Th>Registered</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((u) => {
                const isSelf = currentAdmin?._id === u._id;
                const isOtherAdmin = u.role === 'admin' && !isSelf;

                return (
                  <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                    <Td>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 flex items-center gap-1.5">
                          {u.name}
                          {isSelf && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-green-800 bg-green-100 px-1.5 py-0.5 rounded">
                              You
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-gray-500">{u.email}</span>
                      </div>
                    </Td>
                    <Td>
                      <StatusBadge status={u.role} />
                    </Td>
                    <Td className="text-sm text-gray-600">
                      {u.phone || <span className="text-gray-400 italic">None</span>}
                    </Td>
                    <Td className="text-xs text-gray-500">
                      {formatDate(u.createdAt)}
                    </Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetail(u._id)}
                          aria-label={`View details for ${u.name}`}
                          className="text-gray-600 hover:text-green-700 p-1.5"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(u)}
                          aria-label={`Edit ${u.name}`}
                          className="text-gray-600 hover:text-blue-700 p-1.5"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isSelf || isOtherAdmin}
                          title={
                            isSelf
                              ? 'You cannot delete your own account'
                              : isOtherAdmin
                              ? 'Admin accounts cannot be deleted by other admins'
                              : `Delete ${u.name}`
                          }
                          onClick={() => handleOpenDelete(u)}
                          aria-label={`Delete ${u.name}`}
                          className="text-gray-600 hover:text-red-700 p-1.5 disabled:opacity-30 disabled:hover:text-gray-600 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
        </TableContainer>
      )}

      {/* User Details Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="User Account Details"
        size="md"
      >
        {loadingDetail ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Spinner size="md" className="text-green-700" />
            <p className="mt-2 text-xs">Loading activity counts...</p>
          </div>
        ) : selectedUserDetail ? (
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-serif font-bold text-gray-900">{selectedUserDetail.user.name}</h3>
                  <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    {selectedUserDetail.user.email}
                  </p>
                </div>
                <StatusBadge status={selectedUserDetail.user.role} />
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-500 block">Phone:</span>
                  <span className="font-medium text-gray-900">{selectedUserDetail.user.phone || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Address:</span>
                  <span className="font-medium text-gray-900">{selectedUserDetail.user.address || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Registered:</span>
                  <span className="font-medium text-gray-900">{formatDate(selectedUserDetail.user.createdAt)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">User ID:</span>
                  <span className="font-mono text-gray-600 truncate block">{selectedUserDetail.user._id}</span>
                </div>
              </div>
            </div>

            {/* Activity Counts Section */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">
                Associated Activity & Footprint
              </h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex justify-center mb-1 text-green-700">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span className="text-lg font-bold text-gray-900 block">{selectedUserDetail.counts?.farms ?? 0}</span>
                  <span className="text-[11px] text-gray-500">Farms</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex justify-center mb-1 text-green-700">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <span className="text-lg font-bold text-gray-900 block">{selectedUserDetail.counts?.listings ?? 0}</span>
                  <span className="text-[11px] text-gray-500">Listings</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex justify-center mb-1 text-green-700">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <span className="text-lg font-bold text-gray-900 block">{selectedUserDetail.counts?.bookings ?? 0}</span>
                  <span className="text-[11px] text-gray-500">Bookings</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={Boolean(editUser)}
        onClose={() => setEditUser(null)}
        title={`Edit User: ${editUser?.name}`}
        size="md"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          {editError && (
            <div role="alert" className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{editError}</span>
            </div>
          )}

          <FormField label="Full Name" required>
            <Input
              type="text"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              required
            />
          </FormField>

          <FormField label="Role Assignment" required help="Changing roles affects user permissions and feature access.">
            <Select
              value={editFormData.role}
              onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
            >
              <option value="farmer">Farmer</option>
              <option value="buyer">Buyer</option>
              <option value="admin">Admin</option>
            </Select>
          </FormField>

          <FormField label="Phone Number">
            <Input
              type="tel"
              value={editFormData.phone}
              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              placeholder="+6281234567890"
            />
          </FormField>

          <FormField label="Address">
            <Input
              type="text"
              value={editFormData.address}
              onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
              placeholder="e.g. Bogor, West Java"
            />
          </FormField>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditUser(null)}
              disabled={savingEdit}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={savingEdit}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete User Confirmation Dialog */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete User Account"
        size="md"
      >
        {deleteTarget && (
          <form onSubmit={handleConfirmDelete} className="space-y-4">
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" aria-hidden="true" />
              <div className="space-y-1">
                <p className="font-semibold">Irreversible Cascade Deletion</p>
                <p className="text-xs text-red-700 leading-relaxed">
                  Deleting this user will permanently remove all associated farms, plantings, devices, readings, alerts,
                  marketplace listings, and inquiries. Any pending product bookings will have stock restored to inventory.
                </p>
              </div>
            </div>

            {deleteError && (
              <div role="alert" className="p-3 bg-red-100 border border-red-300 text-red-800 text-xs rounded-lg">
                {deleteError}
              </div>
            )}

            <div>
              <p className="text-sm text-gray-700 mb-2">
                To confirm permanent deletion, please enter the user's email address:{' '}
                <strong className="font-mono text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                  {deleteTarget.email}
                </strong>
              </p>
              <Input
                type="email"
                placeholder="Type email to confirm"
                value={confirmEmailInput}
                onChange={(e) => {
                  setConfirmEmailInput(e.target.value);
                  if (deleteError) setDeleteError('');
                }}
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                loading={deleting}
                disabled={confirmEmailInput.trim().toLowerCase() !== deleteTarget.email.toLowerCase()}
              >
                Permanently Delete
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </AppShell>
  );
}
