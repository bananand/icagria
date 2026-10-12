// src/pages/admin/AdminProductsPage.jsx
// Admin Products Management: inventory table with low-stock indicator (<= 5), add/edit modal, delete confirmation.
import React, { useEffect, useState, useId } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  Tag,
  DollarSign,
  Layers,
} from 'lucide-react';

import AppShell from '../../components/layout/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import FormField from '../../components/ui/FormField';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import ErrorBlock from '../../components/ui/ErrorBlock';
import { TableContainer, Th, Td } from '../../components/ui/Table';

import { getProducts, createProduct, updateProduct, deleteProduct } from '../../api/products';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/format';

const CATEGORIES = [
  { value: 'seeds', label: 'Seeds' },
  { value: 'fertilizer', label: 'Fertilizer' },
  { value: 'pesticide', label: 'Pesticide' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'other', label: 'Other' },
];

export default function AdminProductsPage() {
  const { showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'seeds',
    price: '',
    stock: '',
    description: '',
    imageUrl: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const searchInputId = useId();
  const categorySelectId = useId();

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const data = await getProducts(params);
      setProducts(data || []);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to load catalog products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadProducts();
  };

  // Open Create
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: 'seeds',
      price: '',
      stock: '',
      description: '',
      imageUrl: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit
  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name || '',
      category: prod.category || 'seeds',
      price: prod.price !== undefined ? String(prod.price) : '',
      stock: prod.stock !== undefined ? String(prod.stock) : '',
      description: prod.description || '',
      imageUrl: prod.imageUrl || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Product name is required';
    if (!formData.category) errors.category = 'Category is required';

    const numPrice = Number(formData.price);
    if (formData.price === '' || isNaN(numPrice) || numPrice < 0) {
      errors.price = 'Price must be a valid number >= 0';
    }

    const numStock = Number(formData.stock);
    if (formData.stock === '' || isNaN(numStock) || numStock < 0 || !Number.isInteger(numStock)) {
      errors.stock = 'Stock must be an integer >= 0';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save Product (Create or Update)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const payload = {
      name: formData.name.trim(),
      category: formData.category,
      price: Number(formData.price),
      stock: Number(formData.stock),
      description: formData.description.trim(),
      imageUrl: formData.imageUrl.trim(),
    };

    try {
      if (editingProduct) {
        const updated = await updateProduct(editingProduct._id, payload);
        showToast('Product updated successfully', 'success');
        setProducts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      } else {
        const created = await createProduct(payload);
        showToast('New product added to catalog', 'success');
        setProducts((prev) => [created, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Failed to save product';
      setFormErrors((prev) => ({ ...prev, api: msg }));
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget._id);
      showToast('Product deleted successfully', 'success');
      setProducts((prev) => prev.filter((p) => p._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Failed to delete product';
      showToast(msg, 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Catalog & Supplies"
        title="Input Products Management"
        description="Manage agricultural inputs and equipment available to farmers in the supply shop."
        actions={
          <Button variant="primary" onClick={handleOpenCreate} className="flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            Add New Product
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <section aria-label="Product search and filters" className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-80 relative flex gap-2">
            <div className="relative flex-1">
              <label htmlFor={searchInputId} className="sr-only">Search products</label>
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              <input
                id={searchInputId}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search catalog items..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700 bg-white"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm">Search</Button>
          </div>

          <div className="w-full md:w-auto flex items-center gap-3">
            <label htmlFor={categorySelectId} className="text-sm font-medium text-gray-700 whitespace-nowrap flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-gray-400" aria-hidden="true" />
              Category:
            </label>
            <select
              id={categorySelectId}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700 bg-white"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </form>
      </section>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Spinner size="lg" className="text-green-700" />
          <p className="mt-4 text-sm font-medium">Loading catalog inventory...</p>
        </div>
      ) : error ? (
        <ErrorBlock message={error} onRetry={loadProducts} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Package size={40} />}
          title="No products found"
          description={
            categoryFilter || searchQuery
              ? 'No catalog items match your search filters.'
              : 'The product catalog is currently empty. Add your first input product.'
          }
          action={
            <Button variant="primary" onClick={handleOpenCreate}>
              Add Product
            </Button>
          }
        />
      ) : (
        <TableContainer>
          <thead className="bg-gray-50">
            <tr>
              <Th>Product</Th>
              <Th>Category</Th>
              <Th>Price</Th>
              <Th>Stock Status</Th>
              <Th>Created</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
              {products.map((p) => {
                const isLowStock = p.stock <= 5;
                const isOutOfStock = p.stock === 0;

                return (
                  <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 shrink-0 overflow-hidden">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-gray-400" aria-hidden="true" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-500 line-clamp-1 max-w-xs">{p.description || 'No description'}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                        {p.category}
                      </span>
                    </Td>
                    <Td className="font-medium text-gray-900">
                      {formatCurrency(p.price)}
                    </Td>
                    <Td>
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold text-red-800 bg-red-100">
                          <AlertTriangle className="w-3 h-3 text-red-600" aria-hidden="true" />
                          Out of stock (0)
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold text-amber-800 bg-amber-100">
                          <AlertTriangle className="w-3 h-3 text-amber-600" aria-hidden="true" />
                          Low stock ({p.stock})
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-gray-700">
                          In stock ({p.stock})
                        </span>
                      )}
                    </Td>
                    <Td className="text-xs text-gray-500">
                      {formatDate(p.createdAt)}
                    </Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(p)}
                          aria-label={`Edit ${p.name}`}
                          className="text-gray-600 hover:text-blue-700 p-1.5"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(p)}
                          aria-label={`Delete ${p.name}`}
                          className="text-gray-600 hover:text-red-700 p-1.5"
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

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add New Supply Product'}
        size="md"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          {formErrors.api && (
            <div role="alert" className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formErrors.api}</span>
            </div>
          )}

          <FormField label="Product Name" required error={formErrors.name}>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
              }}
              placeholder="e.g. NPK Fertilizer (5 kg)"
              required
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Category" required error={formErrors.category}>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="Price (IDR)" required error={formErrors.price}>
              <Input
                type="number"
                min="0"
                step="1"
                value={formData.price}
                onChange={(e) => {
                  setFormData({ ...formData, price: e.target.value });
                  if (formErrors.price) setFormErrors({ ...formErrors, price: '' });
                }}
                placeholder="85000"
                required
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Stock Quantity" required error={formErrors.stock} help="Items with <= 5 units show low stock warning">
              <Input
                type="number"
                min="0"
                step="1"
                value={formData.stock}
                onChange={(e) => {
                  setFormData({ ...formData, stock: e.target.value });
                  if (formErrors.stock) setFormErrors({ ...formErrors, stock: '' });
                }}
                placeholder="30"
                required
              />
            </FormField>

            <FormField label="Image URL (optional)">
              <Input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </FormField>
          </div>

          <FormField label="Description (optional)">
            <Textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed specifications, usage instructions, or packaging notes..."
            />
          </FormField>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {editingProduct ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        message={`Are you sure you want to permanently remove "${deleteTarget?.name}" from the shop catalog? Existing completed bookings will preserve historical record snapshots.`}
        confirmText="Delete Product"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />
    </AppShell>
  );
}
