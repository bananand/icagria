// src/pages/farmer/CropsPage.jsx
// Farmer crops page: "My plantings" tab and "Crop guide" catalog tab with details.

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import FarmSelect from '../../components/ui/FarmSelect';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import ErrorBlock from '../../components/ui/ErrorBlock';
import Spinner from '../../components/ui/Spinner';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import { TableContainer, Th, Td } from '../../components/ui/Table';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/format';
import { getErrorMessage } from '../../api/client';
import * as plantingApi from '../../api/plantings';
import * as cropApi from '../../api/crops';
import {
  Sprout,
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  Search,
  BookOpen,
  Info,
  Calendar,
  Layers,
  ThermometerSun,
  ShieldAlert,
} from 'lucide-react';

const INITIAL_PLANTING_FORM = {
  farm: '',
  crop: '',
  variety: '',
  quantity: '',
  plantedDate: new Date().toISOString().slice(0, 10),
  expectedHarvestDate: '',
  status: 'growing',
};

export default function CropsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') === 'guide' ? 'guide' : 'plantings';

  const { farms, selectedFarmId, reloadFarms } = useFarm();
  const { push } = useToast();

  // Tab switching
  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB 1: MY PLANTINGS STATE
  // ─────────────────────────────────────────────────────────────────────────────
  const [plantingsFilterFarm, setPlantingsFilterFarm] = useState(selectedFarmId || '');
  const [plantings, setPlantings] = useState([]);
  const [loadingPlantings, setLoadingPlantings] = useState(false);

  // Sync with global farm context if not explicitly filtering
  useEffect(() => {
    if (selectedFarmId && plantingsFilterFarm === '') {
      setPlantingsFilterFarm(selectedFarmId);
    }
  }, [selectedFarmId]);

  const loadPlantings = async () => {
    setLoadingPlantings(true);
    try {
      const params = {};
      if (plantingsFilterFarm) {
        params.farmId = plantingsFilterFarm;
      }
      const data = await plantingApi.getPlantings(params);
      setPlantings(Array.isArray(data) ? data : []);
    } catch (err) {
      push({ message: getErrorMessage(err), type: 'error' });
      setPlantings([]);
    } finally {
      setLoadingPlantings(false);
    }
  };

  useEffect(() => {
    if (currentTab === 'plantings') {
      loadPlantings();
    }
  }, [plantingsFilterFarm, currentTab]);

  // Planting modal state (Add / Edit)
  const [plantingModalOpen, setPlantingModalOpen] = useState(false);
  const [editingPlanting, setEditingPlanting] = useState(null);
  const [plantingForm, setPlantingForm] = useState(INITIAL_PLANTING_FORM);
  const [plantingErrors, setPlantingErrors] = useState({});
  const [submittingPlanting, setSubmittingPlanting] = useState(false);
  const [plantingApiError, setPlantingApiError] = useState('');

  // Delete planting state
  const [deletePlantingTarget, setDeletePlantingTarget] = useState(null);
  const [deletingPlanting, setDeletingPlanting] = useState(false);

  // Mark harvested state
  const [harvestTarget, setHarvestTarget] = useState(null);
  const [markingHarvest, setMarkingHarvest] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB 2: CROP GUIDE STATE
  // ─────────────────────────────────────────────────────────────────────────────
  const [guideCrops, setGuideCrops] = useState([]);
  const [loadingGuide, setLoadingGuide] = useState(false);
  const [guideType, setGuideType] = useState('all');
  const [guideSearch, setGuideSearch] = useState('');
  const [selectedCropDetail, setSelectedCropDetail] = useState(null);

  const loadGuideCrops = async () => {
    setLoadingGuide(true);
    try {
      const params = {};
      if (guideType && guideType !== 'all') {
        params.type = guideType;
      }
      if (guideSearch.trim()) {
        params.search = guideSearch.trim();
      }
      const data = await cropApi.getCrops(params);
      setGuideCrops(Array.isArray(data) ? data : []);
    } catch (err) {
      push({ message: getErrorMessage(err), type: 'error' });
      setGuideCrops([]);
    } finally {
      setLoadingGuide(false);
    }
  };

  useEffect(() => {
    loadGuideCrops();
  }, [guideType, guideSearch]);

  // ─────────────────────────────────────────────────────────────────────────────
  // COMPUTED DAYS TO HARVEST
  // ─────────────────────────────────────────────────────────────────────────────
  const computeDaysToHarvest = (p) => {
    if (p.status === 'harvested') {
      return { label: 'Harvested', isOverdue: false, isHarvested: true };
    }
    if (!p.expectedHarvestDate) {
      return { label: '—', isOverdue: false, isHarvested: false };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(p.expectedHarvestDate);
    exp.setHours(0, 0, 0, 0);

    const diffMs = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: 'Overdue', isOverdue: true, isHarvested: false, days: diffDays };
    }
    if (diffDays === 0) {
      return { label: 'Today', isOverdue: false, isHarvested: false, days: 0 };
    }
    return {
      label: `${diffDays} days`,
      isOverdue: false,
      isHarvested: false,
      days: diffDays,
    };
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // HANDLERS FOR PLANTINGS
  // ─────────────────────────────────────────────────────────────────────────────
  const openAddPlantingModal = () => {
    setEditingPlanting(null);
    setPlantingForm({
      ...INITIAL_PLANTING_FORM,
      farm: plantingsFilterFarm || (farms.length > 0 ? farms[0]._id : ''),
      plantedDate: new Date().toISOString().slice(0, 10),
    });
    setPlantingErrors({});
    setPlantingApiError('');
    setPlantingModalOpen(true);
  };

  const openEditPlantingModal = (p) => {
    setEditingPlanting(p);
    setPlantingForm({
      farm: p.farm?._id || (typeof p.farm === 'string' ? p.farm : ''),
      crop: p.crop?._id || (typeof p.crop === 'string' ? p.crop : ''),
      variety: p.variety || '',
      quantity: p.quantity != null ? String(p.quantity) : '',
      plantedDate: p.plantedDate ? p.plantedDate.slice(0, 10) : '',
      expectedHarvestDate: p.expectedHarvestDate ? p.expectedHarvestDate.slice(0, 10) : '',
      status: p.status || 'growing',
    });
    setPlantingErrors({});
    setPlantingApiError('');
    setPlantingModalOpen(true);
  };

  const validatePlantingForm = () => {
    const errors = {};
    if (!editingPlanting && !plantingForm.farm) {
      errors.farm = 'Please select a farm';
    }
    if (!editingPlanting && !plantingForm.crop) {
      errors.crop = 'Please select a crop';
    }
    if (plantingForm.quantity !== '') {
      const q = Number(plantingForm.quantity);
      if (isNaN(q) || q < 0) {
        errors.quantity = 'Quantity must be a non-negative number';
      }
    }
    if (plantingForm.plantedDate && plantingForm.expectedHarvestDate) {
      if (new Date(plantingForm.expectedHarvestDate) < new Date(plantingForm.plantedDate)) {
        errors.expectedHarvestDate = 'Expected harvest date cannot be before planted date';
      }
    }
    setPlantingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlantingSubmit = async (e) => {
    e.preventDefault();
    setPlantingApiError('');
    if (!validatePlantingForm()) return;

    setSubmittingPlanting(true);
    try {
      if (editingPlanting) {
        const payload = {
          variety: plantingForm.variety ? plantingForm.variety.trim() : undefined,
          quantity: plantingForm.quantity !== '' ? Number(plantingForm.quantity) : undefined,
          plantedDate: plantingForm.plantedDate || undefined,
          expectedHarvestDate: plantingForm.expectedHarvestDate || undefined,
          status: plantingForm.status,
        };
        await plantingApi.updatePlanting(editingPlanting._id, payload);
        push({ message: 'Planting updated successfully.', type: 'success' });
      } else {
        const payload = {
          farm: plantingForm.farm,
          crop: plantingForm.crop,
          variety: plantingForm.variety ? plantingForm.variety.trim() : undefined,
          quantity: plantingForm.quantity !== '' ? Number(plantingForm.quantity) : undefined,
          plantedDate: plantingForm.plantedDate || undefined,
          expectedHarvestDate: plantingForm.expectedHarvestDate || undefined,
        };
        await plantingApi.createPlanting(payload);
        push({ message: 'Planting record created.', type: 'success' });
      }

      await loadPlantings();
      setPlantingModalOpen(false);
    } catch (err) {
      setPlantingApiError(getErrorMessage(err));
    } finally {
      setSubmittingPlanting(false);
    }
  };

  const handleDeletePlantingConfirm = async () => {
    if (!deletePlantingTarget) return;
    setDeletingPlanting(true);
    try {
      await plantingApi.deletePlanting(deletePlantingTarget._id);
      push({ message: 'Planting record deleted.', type: 'success' });
      await loadPlantings();
      setDeletePlantingTarget(null);
    } catch (err) {
      push({ message: getErrorMessage(err), type: 'error' });
    } finally {
      setDeletingPlanting(false);
    }
  };

  const handleMarkHarvestedConfirm = async () => {
    if (!harvestTarget) return;
    setMarkingHarvest(true);
    try {
      await plantingApi.updatePlanting(harvestTarget._id, { status: 'harvested' });
      push({ message: 'Planting marked as harvested.', type: 'success' });
      await loadPlantings();
      setHarvestTarget(null);
    } catch (err) {
      push({ message: getErrorMessage(err), type: 'error' });
    } finally {
      setMarkingHarvest(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Crops & Plantings"
        title="Crops"
        description="Track active plantings across your plots or consult the botanical crop reference guide."
      />

      {/* Tabs navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => handleTabChange('plantings')}
          className={[
            'px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 focus-ring',
            currentTab === 'plantings'
              ? 'border-green-900 text-green-900 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300',
          ].join(' ')}
        >
          <Sprout size={16} aria-hidden="true" />
          My plantings
        </button>
        <button
          onClick={() => handleTabChange('guide')}
          className={[
            'px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 focus-ring',
            currentTab === 'guide'
              ? 'border-green-900 text-green-900 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300',
          ].join(' ')}
        >
          <BookOpen size={16} aria-hidden="true" />
          Crop guide
        </button>
        <div className="flex-1" />
        <Link
          to="/app/pest-tips"
          className="px-3 py-2 text-xs font-medium text-green-700 hover:text-green-900 flex items-center gap-1.5 transition-colors self-center"
        >
          <ShieldAlert size={14} />
          Pest & disease tips →
        </Link>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: MY PLANTINGS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {currentTab === 'plantings' && (
        <section aria-label="My plantings">
          {farms.length === 0 ? (
            <div className="border border-gray-200 rounded-md bg-white p-6">
              <EmptyState
                icon={<Sprout size={40} className="text-gray-400" />}
                title="You don't have any farms yet"
                description="To start tracking plantings and expected harvests, register your first farm plot."
                actionLabel="Go to Farms page"
                actionHref="/app/farms"
              />
            </div>
          ) : (
            <>
              {/* Controls bar: FarmSelect filter + Add planting button */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <label htmlFor="planting-filter-farm" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Filter by farm:
                  </label>
                  <FarmSelect
                    id="planting-filter-farm"
                    allowAll
                    value={plantingsFilterFarm}
                    onChange={(id) => setPlantingsFilterFarm(id)}
                    className="w-64"
                  />
                </div>

                <Button variant="primary" onClick={openAddPlantingModal}>
                  <Plus size={16} className="mr-1" aria-hidden="true" />
                  Add planting
                </Button>
              </div>

              {loadingPlantings ? (
                <div className="py-20 flex justify-center">
                  <Spinner size="lg" />
                </div>
              ) : plantings.length === 0 ? (
                <div className="border border-gray-200 rounded bg-white">
                  <EmptyState
                    icon={<Sprout size={40} className="text-gray-400" />}
                    title="No plantings recorded"
                    description={
                      plantingsFilterFarm
                        ? 'No active plantings for the selected farm. Add your first planting record above.'
                        : 'No plantings found. Click "Add planting" to record a new crop batch.'
                    }
                    actionLabel="Add planting"
                    onAction={openAddPlantingModal}
                  />
                </div>
              ) : (
                <TableContainer>
                  <thead>
                    <tr>
                      <Th>Crop</Th>
                      <Th>Farm</Th>
                      <Th>Variety</Th>
                      <Th>Quantity</Th>
                      <Th>Planted Date</Th>
                      <Th>Expected Harvest</Th>
                      <Th>Days to Harvest</Th>
                      <Th>Status</Th>
                      <Th>Actions</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {plantings.map((p) => {
                      const harvestInfo = computeDaysToHarvest(p);
                      return (
                        <tr key={p._id} className="hover:bg-gray-50/50 transition-colors">
                          <Td className="font-medium text-gray-900">
                            <div>
                              <span>{p.crop?.name || 'Unknown Crop'}</span>
                              {p.crop?.type && (
                                <span className="ml-1.5 text-[11px] uppercase tracking-wider text-gray-400">
                                  ({p.crop.type})
                                </span>
                              )}
                            </div>
                          </Td>
                          <Td className="text-gray-600">{p.farm?.name || '—'}</Td>
                          <Td>{p.variety || '—'}</Td>
                          <Td>{p.quantity != null ? p.quantity : '—'}</Td>
                          <Td>{formatDate(p.plantedDate)}</Td>
                          <Td>{formatDate(p.expectedHarvestDate)}</Td>
                          <Td>
                            {harvestInfo.isHarvested ? (
                              <span className="text-xs text-gray-500 font-medium">Harvested</span>
                            ) : harvestInfo.isOverdue ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded">
                                <span aria-hidden="true">⚠</span> Overdue ({Math.abs(harvestInfo.days)}d)
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-gray-700">{harvestInfo.label}</span>
                            )}
                          </Td>
                          <Td>
                            <StatusBadge status={p.status || 'growing'} />
                          </Td>
                          <Td>
                            <div className="flex items-center gap-2">
                              {p.status !== 'harvested' && (
                                <button
                                  onClick={() => setHarvestTarget(p)}
                                  className="p-1 text-gray-500 hover:text-green-800 focus-ring rounded"
                                  title="Mark harvested"
                                  aria-label={`Mark ${p.crop?.name} as harvested`}
                                >
                                  <CheckCircle size={15} />
                                </button>
                              )}
                              <button
                                onClick={() => openEditPlantingModal(p)}
                                className="p-1 text-gray-500 hover:text-green-800 focus-ring rounded"
                                title="Edit planting"
                                aria-label={`Edit ${p.crop?.name}`}
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                onClick={() => setDeletePlantingTarget(p)}
                                className="p-1 text-gray-500 hover:text-red-700 focus-ring rounded"
                                title="Delete planting"
                                aria-label={`Delete ${p.crop?.name}`}
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
            </>
          )}

          {/* Add / Edit Planting Modal */}
          <Modal
            open={plantingModalOpen}
            onClose={() => !submittingPlanting && setPlantingModalOpen(false)}
            title={editingPlanting ? 'Edit planting' : 'Add new planting'}
            maxWidth="max-w-md"
          >
            <form onSubmit={handlePlantingSubmit} className="flex flex-col gap-4">
              <ErrorBlock error={plantingApiError} />

              {!editingPlanting ? (
                <>
                  <FormField
                    label="Farm"
                    htmlFor="planting-farm"
                    required
                    error={plantingErrors.farm}
                  >
                    <Select
                      id="planting-farm"
                      value={plantingForm.farm}
                      onChange={(e) => setPlantingForm({ ...plantingForm, farm: e.target.value })}
                      error={!!plantingErrors.farm}
                      disabled={submittingPlanting}
                    >
                      <option value="">Select a farm</option>
                      {farms.map((f) => (
                        <option key={f._id} value={f._id}>
                          {f.name}
                        </option>
                      ))}
                    </Select>
                  </FormField>

                  <FormField
                    label="Crop"
                    htmlFor="planting-crop"
                    required
                    error={plantingErrors.crop}
                  >
                    <Select
                      id="planting-crop"
                      value={plantingForm.crop}
                      onChange={(e) => setPlantingForm({ ...plantingForm, crop: e.target.value })}
                      error={!!plantingErrors.crop}
                      disabled={submittingPlanting}
                    >
                      <option value="">Select a crop</option>
                      {guideCrops.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} ({c.type}) {c.growthDays ? `— ~${c.growthDays} days` : ''}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                </>
              ) : (
                <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm">
                  <p className="font-semibold text-gray-900">
                    {editingPlanting.crop?.name} <span className="font-normal text-gray-500">at {editingPlanting.farm?.name}</span>
                  </p>
                </div>
              )}

              <FormField
                label="Variety"
                htmlFor="planting-variety"
                helperText="e.g. Local White, Beauregard, Anjasmoro"
              >
                <Input
                  id="planting-variety"
                  placeholder="Local variety"
                  value={plantingForm.variety}
                  onChange={(e) => setPlantingForm({ ...plantingForm, variety: e.target.value })}
                  disabled={submittingPlanting}
                />
              </FormField>

              <FormField
                label="Quantity"
                htmlFor="planting-quantity"
                helperText="Number of seedlings, mounds, or plants"
                error={plantingErrors.quantity}
              >
                <Input
                  id="planting-quantity"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 150"
                  value={plantingForm.quantity}
                  onChange={(e) => setPlantingForm({ ...plantingForm, quantity: e.target.value })}
                  error={!!plantingErrors.quantity}
                  disabled={submittingPlanting}
                />
              </FormField>

              <FormField
                label="Planted date"
                htmlFor="planting-planted-date"
                required
              >
                <Input
                  id="planting-planted-date"
                  type="date"
                  value={plantingForm.plantedDate}
                  onChange={(e) => setPlantingForm({ ...plantingForm, plantedDate: e.target.value })}
                  disabled={submittingPlanting}
                />
              </FormField>

              <FormField
                label="Expected harvest date"
                htmlFor="planting-harvest-date"
                helperText="Leave empty to calculate it from the crop's growth period"
                error={plantingErrors.expectedHarvestDate}
              >
                <Input
                  id="planting-harvest-date"
                  type="date"
                  value={plantingForm.expectedHarvestDate}
                  onChange={(e) => setPlantingForm({ ...plantingForm, expectedHarvestDate: e.target.value })}
                  error={!!plantingErrors.expectedHarvestDate}
                  disabled={submittingPlanting}
                />
              </FormField>

              {editingPlanting && (
                <FormField
                  label="Status"
                  htmlFor="planting-status"
                >
                  <Select
                    id="planting-status"
                    value={plantingForm.status}
                    onChange={(e) => setPlantingForm({ ...plantingForm, status: e.target.value })}
                    disabled={submittingPlanting}
                  >
                    <option value="growing">Growing</option>
                    <option value="harvested">Harvested</option>
                  </Select>
                </FormField>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setPlantingModalOpen(false)}
                  disabled={submittingPlanting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  loading={submittingPlanting}
                  disabled={submittingPlanting}
                >
                  {editingPlanting ? 'Save changes' : 'Record planting'}
                </Button>
              </div>
            </form>
          </Modal>

          {/* Delete Planting Confirm Dialog */}
          <ConfirmDialog
            open={!!deletePlantingTarget}
            onClose={() => !deletingPlanting && setDeletePlantingTarget(null)}
            onConfirm={handleDeletePlantingConfirm}
            title="Delete planting record?"
            message={`Are you sure you want to delete this planting of ${deletePlantingTarget?.crop?.name}?`}
            confirmLabel="Delete planting"
            confirmVariant="primary"
            loading={deletingPlanting}
          />

          {/* Mark Harvested Confirm Dialog */}
          <ConfirmDialog
            open={!!harvestTarget}
            onClose={() => !markingHarvest && setHarvestTarget(null)}
            onConfirm={handleMarkHarvestedConfirm}
            title="Mark as harvested?"
            message={`Mark the planting of ${harvestTarget?.crop?.name} (${harvestTarget?.farm?.name}) as harvested?`}
            confirmLabel="Mark harvested"
            confirmVariant="primary"
            loading={markingHarvest}
          />
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: CROP GUIDE */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {currentTab === 'guide' && (
        <section aria-label="Crop guide catalog">
          {/* Search box and type filter */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" aria-hidden="true" />
              <input
                type="text"
                value={guideSearch}
                onChange={(e) => setGuideSearch(e.target.value)}
                placeholder="Search crops by name..."
                aria-label="Search crops"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-700"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Filter:</span>
              <div className="inline-flex rounded border border-gray-200 bg-white p-0.5">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'tuber', label: 'Tuber' },
                  { value: 'legume', label: 'Legume' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setGuideType(value)}
                    className={[
                      'px-3 py-1 text-xs rounded transition-colors',
                      guideType === value
                        ? 'bg-green-900 text-white font-medium'
                        : 'text-gray-600 hover:text-green-900',
                    ].join(' ')}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loadingGuide ? (
            <div className="py-20 flex justify-center">
              <Spinner size="lg" />
            </div>
          ) : guideCrops.length === 0 ? (
            <div className="border border-gray-200 rounded bg-white">
              <EmptyState
                icon={<BookOpen size={40} className="text-gray-400" />}
                title="No crops found"
                description="Try clearing your search query or switching crop type filter."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {guideCrops.map((crop) => (
                <Card
                  key={crop._id}
                  eyebrow={crop.type}
                  headline={crop.name}
                  initial={crop.name[0]}
                  onClick={() => setSelectedCropDetail(crop)}
                  className="hover:shadow-xs transition-shadow"
                >
                  <p className="text-xs italic text-gray-500 truncate mb-2">
                    {crop.scientificName || '—'}
                  </p>
                  <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">indicative range</p>
                      <p className="text-xs font-semibold text-green-900">
                        pH {crop.phMin} – {crop.phMax}
                      </p>
                    </div>
                    {crop.growthDays && (
                      <span className="text-[11px] text-gray-500">~{crop.growthDays}d</span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Crop Detail Modal */}
          <Modal
            open={!!selectedCropDetail}
            onClose={() => setSelectedCropDetail(null)}
            title={selectedCropDetail?.name}
            maxWidth="max-w-2xl"
          >
            {selectedCropDetail && (
              <div className="flex flex-col gap-5 text-sm text-gray-700">
                {/* Header subtitle */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
                  <div>
                    <p className="text-base font-serif italic text-gray-600">
                      {selectedCropDetail.scientificName || 'Botanical classification'}
                    </p>
                  </div>
                  <Badge variant={selectedCropDetail.type === 'tuber' ? 'default' : 'outline'} className="capitalize">
                    {selectedCropDetail.type}
                  </Badge>
                </div>

                {/* Key indicators grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded border border-gray-200">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Indicative pH Range</p>
                    <p className="font-serif font-bold text-green-900 text-lg">
                      {selectedCropDetail.phMin} – {selectedCropDetail.phMax}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Growth Period</p>
                    <p className="font-semibold text-gray-900">
                      {selectedCropDetail.growthPeriod || (selectedCropDetail.growthDays ? `${selectedCropDetail.growthDays} days` : '—')}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Season</p>
                    <p className="font-semibold text-gray-900">{selectedCropDetail.season || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Sowing Time</p>
                    <p className="text-gray-900">{selectedCropDetail.sowingTime || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Harvest Time</p>
                    <p className="text-gray-900">{selectedCropDetail.harvestTime || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Climate</p>
                    <p className="text-gray-900">{selectedCropDetail.climate || '—'}</p>
                  </div>
                </div>

                {/* Soil & agronomy details */}
                <div className="flex flex-col gap-3">
                  <div>
                    <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-1">Soil Type</h4>
                    <p className="text-gray-800">{selectedCropDetail.soilType || 'Not specified'}</p>
                  </div>

                  {selectedCropDetail.pests && selectedCropDetail.pests.length > 0 && (
                    <div>
                      <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-1">Common Pests</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCropDetail.pests.map((pest, i) => (
                          <span key={i} className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 text-xs px-2.5 py-0.5 rounded border border-amber-200">
                            <ShieldAlert size={11} aria-hidden="true" />
                            {pest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedCropDetail.fertilizers && selectedCropDetail.fertilizers.length > 0 && (
                    <div>
                      <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-1">Recommended Fertilizers</h4>
                      <p className="text-gray-800">{selectedCropDetail.fertilizers.join(', ')}</p>
                    </div>
                  )}

                  {selectedCropDetail.pesticides && selectedCropDetail.pesticides.length > 0 && (
                    <div>
                      <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-1">Pesticides / Treatments</h4>
                      <p className="text-gray-800">{selectedCropDetail.pesticides.join(', ')}</p>
                    </div>
                  )}
                </div>

                {/* Mandatory agricultural extension disclaimer note */}
                <div className="border border-green-200 bg-green-50/70 rounded p-3 flex items-start gap-2.5 text-xs text-green-900">
                  <Info size={16} className="text-green-800 shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="leading-relaxed">
                    Reference values are indicative. Confirm with a local agricultural extension officer.
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <Button variant="secondary" onClick={() => setSelectedCropDetail(null)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </Modal>
        </section>
      )}
    </AppShell>
  );
}
