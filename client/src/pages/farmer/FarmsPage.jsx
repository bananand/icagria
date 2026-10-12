// src/pages/farmer/FarmsPage.jsx
// Farmer farm management: table list, create/edit modal with geolocation, delete confirmation.

import React, { useEffect, useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import ErrorBlock from '../../components/ui/ErrorBlock';
import Spinner from '../../components/ui/Spinner';
import { TableContainer, Th, Td } from '../../components/ui/Table';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/format';
import { getErrorMessage } from '../../api/client';
import * as farmApi from '../../api/farms';
import * as cropApi from '../../api/crops';
import { MapPin, Plus, Pencil, Trash2, Sprout } from 'lucide-react';

const INITIAL_FORM = {
  name: '',
  locationText: '',
  lat: '',
  lng: '',
  areaSize: '',
  mainCrop: '',
  establishedDate: '',
};

export default function FarmsPage() {
  const { farms, reloadFarms, loading: loadingFarms } = useFarm();
  const { push } = useToast();

  const [crops, setCrops] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [geoLocating, setGeoLocating] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Load available crops for main crop selector
  useEffect(() => {
    cropApi.getCrops().then(setCrops).catch(() => setCrops([]));
  }, []);

  const openAddModal = () => {
    setEditingFarm(null);
    setFormData(INITIAL_FORM);
    setFormErrors({});
    setApiError('');
    setModalOpen(true);
  };

  const openEditModal = (farm) => {
    setEditingFarm(farm);
    setFormData({
      name: farm.name || '',
      locationText: farm.location?.text || '',
      lat: farm.location?.lat != null ? String(farm.location.lat) : '',
      lng: farm.location?.lng != null ? String(farm.location.lng) : '',
      areaSize: farm.areaSize != null ? String(farm.areaSize) : '',
      mainCrop: farm.mainCrop?._id || (typeof farm.mainCrop === 'string' ? farm.mainCrop : ''),
      establishedDate: farm.establishedDate ? farm.establishedDate.slice(0, 10) : '',
    });
    setFormErrors({});
    setApiError('');
    setModalOpen(true);
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      push({ message: 'Geolocation is not supported by your browser.', type: 'info' });
      return;
    }

    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoLocating(false);
        setFormData((prev) => ({
          ...prev,
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6),
        }));
        push({ message: 'Coordinates captured successfully.', type: 'success' });
      },
      (err) => {
        setGeoLocating(false);
        let msg = 'Unable to access your location.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission was denied. You may enter coordinates manually.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Location information is currently unavailable.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'The request to get your location timed out.';
        }
        push({ message: msg, type: 'info' });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Farm name is required';
    }
    if (!formData.locationText.trim()) {
      errors.locationText = 'Location text is required';
    }
    const area = Number(formData.areaSize);
    if (!formData.areaSize || isNaN(area) || area <= 0) {
      errors.areaSize = 'Area size must be greater than 0';
    }

    if (formData.lat !== '') {
      const latNum = Number(formData.lat);
      if (isNaN(latNum) || latNum < -90 || latNum > 90) {
        errors.lat = 'Latitude must be between -90 and 90';
      }
    }

    if (formData.lng !== '') {
      const lngNum = Number(formData.lng);
      if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
        errors.lng = 'Longitude must be between -180 and 180';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        location: {
          text: formData.locationText.trim(),
          lat: formData.lat !== '' ? Number(formData.lat) : undefined,
          lng: formData.lng !== '' ? Number(formData.lng) : undefined,
        },
        areaSize: Number(formData.areaSize),
        mainCrop: formData.mainCrop || undefined,
        establishedDate: formData.establishedDate || undefined,
      };

      if (editingFarm) {
        await farmApi.updateFarm(editingFarm._id, payload);
        push({ message: 'Farm updated successfully.', type: 'success' });
      } else {
        await farmApi.createFarm(payload);
        push({ message: 'Farm added successfully.', type: 'success' });
      }

      await reloadFarms();
      setModalOpen(false);
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await farmApi.deleteFarm(deleteTarget._id);
      push({ message: `Farm "${deleteTarget.name}" deleted.`, type: 'success' });
      await reloadFarms();
      setDeleteTarget(null);
    } catch (err) {
      push({ message: getErrorMessage(err), type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Farm Management"
        title="My Farms"
        description="Register and manage your farm plots, geographic coordinates, and primary crops."
      />

      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-sm text-gray-500">
            {farms.length} {farms.length === 1 ? 'farm' : 'farms'} registered
          </p>
        </div>
        <Button variant="primary" onClick={openAddModal}>
          <Plus size={16} className="mr-1" aria-hidden="true" /> Add farm
        </Button>
      </div>

      {loadingFarms ? (
        <div className="py-20 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : farms.length === 0 ? (
        <div className="border border-gray-200 rounded-md bg-white">
          <EmptyState
            icon={<MapPin size={40} className="text-gray-400" />}
            title="No farms registered yet"
            description="Add your first farm plot to begin tracking soil pH, recording plantings, and getting localized weather."
            actionLabel="Add your first farm"
            onAction={openAddModal}
          />
        </div>
      ) : (
        <TableContainer>
          <thead>
            <tr>
              <Th>Farm Name</Th>
              <Th>Location</Th>
              <Th>Area (Acres)</Th>
              <Th>Main Crop</Th>
              <Th>Established Date</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {farms.map((farm) => {
              const mainCropName = farm.mainCrop?.name || 'Not set';
              return (
                <tr key={farm._id} className="hover:bg-gray-50/50 transition-colors">
                  <Td className="font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <MapPin size={15} className="text-green-700 shrink-0" aria-hidden="true" />
                      <span>{farm.name}</span>
                    </div>
                  </Td>
                  <Td>
                    <div>
                      <span>{farm.location?.text || '—'}</span>
                      {farm.location?.lat != null && farm.location?.lng != null && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {farm.location.lat.toFixed(4)}, {farm.location.lng.toFixed(4)}
                        </p>
                      )}
                    </div>
                  </Td>
                  <Td>{farm.areaSize != null ? `${farm.areaSize} acres` : '—'}</Td>
                  <Td>
                    <span className="inline-flex items-center gap-1">
                      <Sprout size={13} className="text-green-800" aria-hidden="true" />
                      {mainCropName}
                    </span>
                  </Td>
                  <Td>{formatDate(farm.establishedDate)}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(farm)}
                        className="p-1.5 text-gray-500 hover:text-green-800 focus-ring rounded"
                        title="Edit farm"
                        aria-label={`Edit ${farm.name}`}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(farm)}
                        className="p-1.5 text-gray-500 hover:text-red-700 focus-ring rounded"
                        title="Delete farm"
                        aria-label={`Delete ${farm.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </TableContainer>
      )}

      {/* Add / Edit Farm Modal */}
      <Modal
        open={modalOpen}
        onClose={() => !submitting && setModalOpen(false)}
        title={editingFarm ? 'Edit farm' : 'Add new farm'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <ErrorBlock error={apiError} />

          <FormField
            label="Farm name"
            htmlFor="farm-name"
            required
            error={formErrors.name}
          >
            <Input
              id="farm-name"
              placeholder="e.g. North Ridge Plot"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={!!formErrors.name}
              disabled={submitting}
            />
          </FormField>

          <FormField
            label="Location text"
            htmlFor="farm-location"
            required
            helperText="e.g. Village, District, or Region name"
            error={formErrors.locationText}
          >
            <Input
              id="farm-location"
              placeholder="e.g. Bogor, West Java"
              value={formData.locationText}
              onChange={(e) => setFormData({ ...formData, locationText: e.target.value })}
              error={!!formErrors.locationText}
              disabled={submitting}
            />
          </FormField>

          <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-semibold text-gray-500">
                Coordinates (Optional)
              </span>
              <button
                type="button"
                onClick={handleUseLocation}
                disabled={submitting || geoLocating}
                className="text-xs font-medium text-green-700 hover:text-green-900 inline-flex items-center gap-1 disabled:opacity-50"
              >
                {geoLocating ? <Spinner size="sm" /> : <MapPin size={12} />}
                Use my current location
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Used to fetch weather for this farm
            </p>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Latitude"
                htmlFor="farm-lat"
                helperText="-90 to 90"
                error={formErrors.lat}
              >
                <Input
                  id="farm-lat"
                  type="number"
                  step="any"
                  placeholder="-6.5950"
                  value={formData.lat}
                  onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                  error={!!formErrors.lat}
                  disabled={submitting}
                />
              </FormField>

              <FormField
                label="Longitude"
                htmlFor="farm-lng"
                helperText="-180 to 180"
                error={formErrors.lng}
              >
                <Input
                  id="farm-lng"
                  type="number"
                  step="any"
                  placeholder="106.8170"
                  value={formData.lng}
                  onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                  error={!!formErrors.lng}
                  disabled={submitting}
                />
              </FormField>
            </div>
          </div>

          <FormField
            label="Area size in acres"
            htmlFor="farm-area"
            required
            helperText="Greater than 0"
            error={formErrors.areaSize}
          >
            <Input
              id="farm-area"
              type="number"
              step="any"
              placeholder="e.g. 2.5"
              value={formData.areaSize}
              onChange={(e) => setFormData({ ...formData, areaSize: e.target.value })}
              error={!!formErrors.areaSize}
              disabled={submitting}
            />
          </FormField>

          <FormField
            label="Main crop"
            htmlFor="farm-crop"
            helperText="Select the principal crop cultivated on this farm"
          >
            <Select
              id="farm-crop"
              value={formData.mainCrop}
              onChange={(e) => setFormData({ ...formData, mainCrop: e.target.value })}
              disabled={submitting}
            >
              <option value="">Not set</option>
              {crops.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Established date"
            htmlFor="farm-established"
          >
            <Input
              id="farm-established"
              type="date"
              value={formData.establishedDate}
              onChange={(e) => setFormData({ ...formData, establishedDate: e.target.value })}
              disabled={submitting}
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={submitting}
              disabled={submitting}
            >
              {editingFarm ? 'Save changes' : 'Create farm'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete farm?"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? The farm's plantings, sensors, pH readings, and alerts will also be deleted.`}
        confirmLabel="Delete farm"
        confirmVariant="primary"
        loading={deleting}
      />
    </AppShell>
  );
}
