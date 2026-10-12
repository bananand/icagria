// src/pages/farmer/SoilPhPage.jsx
// Soil pH Hub for farmers: latest readings panel, multi-crop tolerance lines,
// Recharts line chart with suitable range band, summary stat cards, sensor register/key modal,
// demo simulation controls, and cascading delete confirmation.

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import FarmSelect from '../../components/ui/FarmSelect';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import ErrorBlock from '../../components/ui/ErrorBlock';
import Spinner from '../../components/ui/Spinner';
import PhLineChart from '../../components/charts/PhLineChart';
import { TableContainer, Th, Td } from '../../components/ui/Table';
import { useFarm } from '../../context/FarmContext';
import { useAlerts } from '../../context/AlertsContext';
import { useToast } from '../../context/ToastContext';
import { formatDateTime, formatDate } from '../../utils/format';
import { getErrorMessage } from '../../api/client';
import * as readingApi from '../../api/readings';
import * as deviceApi from '../../api/devices';
import {
  Activity,
  Plus,
  Play,
  RotateCw,
  Key,
  Pencil,
  Trash2,
  Copy,
  Check,
  Cpu,
  AlertTriangle,
  Info,
  Sprout,
} from 'lucide-react';

export default function SoilPhPage() {
  const { farms, selectedFarmId, setSelectedFarmId, loading: loadingFarms } = useFarm();
  const { refreshUnreadCount } = useAlerts();
  const { push } = useToast();

  const [days, setDays] = useState(30);

  // Core Data States
  const [latestData, setLatestData] = useState(null);
  const [readingsData, setReadingsData] = useState({ readings: [], count: 0, range: null });
  const [summaryData, setSummaryData] = useState(null);
  const [devices, setDevices] = useState([]);

  // Loading States
  const [loadingLatest, setLoadingLatest] = useState(false);
  const [loadingReadings, setLoadingReadings] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(false);

  // Simulation State
  const [simulating, setSimulating] = useState(false);
  const [latestCreatedAlert, setLatestCreatedAlert] = useState(null);

  // Device Modals
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [registerSource, setRegisterSource] = useState('simulated');
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState('');

  // Hardware One-Time Key Modal
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [revealedKey, setRevealedKey] = useState('');
  const [keyCopied, setKeyCopied] = useState(false);

  // Edit Device Modal
  const [editDeviceModalOpen, setEditDeviceModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [editDeviceName, setEditDeviceName] = useState('');
  const [editDeviceStatus, setEditDeviceStatus] = useState('active');
  const [savingDevice, setSavingDevice] = useState(false);
  const [editDeviceError, setEditDeviceError] = useState('');

  // Delete Device State
  const [deleteDeviceTarget, setDeleteDeviceTarget] = useState(null);
  const [deletingDevice, setDeletingDevice] = useState(false);

  // Selected farm object
  const currentFarm = farms.find((f) => f._id === selectedFarmId);

  // Active sensor determination
  const activeSensor = devices.find((d) => d.status === 'active');

  // Load All Farm-specific Data
  const loadSoilPhData = useCallback(async () => {
    if (!selectedFarmId) {
      setLatestData(null);
      setReadingsData({ readings: [], count: 0, range: null });
      setSummaryData(null);
      setDevices([]);
      return;
    }

    // 1. Fetch Latest
    setLoadingLatest(true);
    readingApi
      .getLatestReading({ farmId: selectedFarmId })
      .then(setLatestData)
      .catch(() => setLatestData(null))
      .finally(() => setLoadingLatest(false));

    // 2. Fetch Historical Readings
    setLoadingReadings(true);
    readingApi
      .getReadings({ farmId: selectedFarmId, days, limit: 1000 })
      .then((res) => {
        setReadingsData({
          readings: res.readings || [],
          count: res.count || 0,
          range: res.range || null,
        });
      })
      .catch(() => setReadingsData({ readings: [], count: 0, range: null }))
      .finally(() => setLoadingReadings(false));

    // 3. Fetch Summary
    setLoadingSummary(true);
    const tzOffsetMinutes = -new Date().getTimezoneOffset();
    readingApi
      .getReadingsSummary({ farmId: selectedFarmId, days, tzOffsetMinutes })
      .then(setSummaryData)
      .catch(() => setSummaryData(null))
      .finally(() => setLoadingSummary(false));

    // 4. Fetch Devices
    setLoadingDevices(true);
    deviceApi
      .getDevices({ farmId: selectedFarmId })
      .then((devs) => setDevices(Array.isArray(devs) ? devs : []))
      .catch(() => setDevices([]))
      .finally(() => setLoadingDevices(false));
  }, [selectedFarmId, days]);

  useEffect(() => {
    loadSoilPhData();
  }, [loadSoilPhData]);

  // ─────────────────────────────────────────────────────────────────────────────
  // SIMULATION HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────
  const handleSimulate = async (mode = 'auto') => {
    if (!activeSensor) {
      push({ message: 'No active sensor available on this farm.', type: 'error' });
      return;
    }
    if (!currentFarm?.mainCrop) {
      push({ message: 'Please configure a main crop on this farm before simulating.', type: 'error' });
      return;
    }

    setSimulating(true);
    setLatestCreatedAlert(null);
    try {
      const res = await readingApi.simulateReading({
        deviceId: activeSensor._id,
        mode,
      });

      push({
        message: `Simulated pH ${res.reading?.value} (${res.evaluation?.label || 'Recorded'})`,
        type: 'success',
      });

      if (res.alert) {
        setLatestCreatedAlert(res.alert);
        refreshUnreadCount();
      }

      await loadSoilPhData();
    } catch (err) {
      push({ message: getErrorMessage(err), type: 'error' });
    } finally {
      setSimulating(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // DEVICE HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────
  const openRegisterModal = () => {
    setRegisterName(`pH Sensor ${devices.length + 1}`);
    setRegisterSource('simulated');
    setRegisterError('');
    setRegisterModalOpen(true);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!registerName.trim()) {
      setRegisterError('Sensor name is required');
      return;
    }

    setRegistering(true);
    setRegisterError('');
    try {
      const res = await deviceApi.createDevice({
        farm: selectedFarmId,
        name: registerName.trim(),
        source: registerSource,
      });

      push({ message: `Sensor "${res.name}" registered.`, type: 'success' });
      setRegisterModalOpen(false);

      if (res.source === 'hardware' && res.apiKey) {
        setRevealedKey(res.apiKey);
        setKeyCopied(false);
        setKeyModalOpen(true);
      }

      await loadSoilPhData();
    } catch (err) {
      setRegisterError(getErrorMessage(err));
    } finally {
      setRegistering(false);
    }
  };

  const openEditDeviceModal = (device) => {
    setEditingDevice(device);
    setEditDeviceName(device.name || '');
    setEditDeviceStatus(device.status || 'active');
    setEditDeviceError('');
    setEditDeviceModalOpen(true);
  };

  const handleEditDeviceSubmit = async (e) => {
    e.preventDefault();
    if (!editDeviceName.trim()) {
      setEditDeviceError('Device name cannot be empty');
      return;
    }

    setSavingDevice(true);
    setEditDeviceError('');
    try {
      await deviceApi.updateDevice(editingDevice._id, {
        name: editDeviceName.trim(),
        status: editDeviceStatus,
      });

      push({ message: 'Sensor updated successfully.', type: 'success' });
      setEditDeviceModalOpen(false);
      await loadSoilPhData();
    } catch (err) {
      setEditDeviceError(getErrorMessage(err));
    } finally {
      setSavingDevice(false);
    }
  };

  const handleRegenerateKey = async (device) => {
    try {
      const res = await deviceApi.regenerateApiKey(device._id);
      setRevealedKey(res.apiKey);
      setKeyCopied(false);
      setKeyModalOpen(true);
      push({ message: 'New API key generated.', type: 'success' });
      await loadSoilPhData();
    } catch (err) {
      push({ message: getErrorMessage(err), type: 'error' });
    }
  };

  const handleDeleteDeviceConfirm = async () => {
    if (!deleteDeviceTarget) return;
    setDeletingDevice(true);
    try {
      await deviceApi.deleteDevice(deleteDeviceTarget._id);
      push({ message: `Sensor "${deleteDeviceTarget.name}" deleted.`, type: 'success' });
      setDeleteDeviceTarget(null);
      await loadSoilPhData();
    } catch (err) {
      push({ message: getErrorMessage(err), type: 'error' });
    } finally {
      setDeletingDevice(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setKeyCopied(true);
    push({ message: 'API key copied to clipboard.', type: 'info' });
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Soil Management"
        title="Soil pH Hub"
        description="Monitor acidity trends, check suitability against your crops, and test simulated or hardware sensors."
      />

      {/* Top Controls: FarmSelect & Range Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <label htmlFor="soil-ph-farm-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Selected farm:
          </label>
          <FarmSelect
            id="soil-ph-farm-select"
            className="w-72"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Interval:</span>
          <div className="inline-flex rounded border border-gray-200 bg-white p-0.5">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={[
                  'px-3 py-1 text-xs rounded transition-colors font-medium',
                  days === d
                    ? 'bg-green-900 text-white'
                    : 'text-gray-600 hover:text-green-900 hover:bg-green-50',
                ].join(' ')}
              >
                {d} days
              </button>
            ))}
          </div>
        </div>
      </div>

      {!selectedFarmId ? (
        <div className="border border-gray-200 rounded-md bg-white p-6">
          <EmptyState
            icon={<Activity size={40} className="text-gray-400" />}
            title="No farm selected"
            description="Please select or create a farm to view soil pH telemetry."
            actionLabel="Go to Farms"
            actionHref="/app/farms"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* ───────────────────────────────────────────────────────────── */}
          {/* LATEST READING PANEL & SIMULATION CONTROLS */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Latest Reading Card */}
            <div className="lg:col-span-2 border border-gray-200 bg-white rounded p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
                      Latest Reading Telemetry
                    </p>
                    <h2 className="font-serif text-2xl font-semibold text-gray-900 mt-1">
                      {latestData?.farmName || currentFarm?.name}
                    </h2>
                  </div>
                  {latestData?.evaluation && (
                    <StatusBadge status={latestData.evaluation.status} />
                  )}
                </div>

                {!currentFarm?.mainCrop ? (
                  <div className="border border-amber-200 bg-amber-50/70 rounded p-4 mb-4 flex items-start gap-3">
                    <AlertTriangle size={18} className="text-amber-800 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900">No main crop configured</p>
                      <p className="text-xs text-amber-800 mt-0.5">
                        This farm has no main crop assigned. Soil suitability thresholds cannot be calculated.{' '}
                        <Link to="/app/farms" className="underline font-medium hover:text-green-900">
                          Edit farm in Farms page →
                        </Link>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-600 mb-4">
                    <span>Main crop: </span>
                    <strong className="text-green-900">{latestData?.evaluation?.cropName || currentFarm.mainCrop?.name}</strong>
                    {latestData?.evaluation?.range && (
                      <span className="ml-2 font-mono text-gray-500">
                        (Suitable: {latestData.evaluation.range.min} – {latestData.evaluation.range.max})
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-baseline gap-4 my-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-gray-400 font-semibold uppercase">pH</span>
                    <span className="font-serif text-5xl font-bold text-green-900 tracking-tight">
                      {latestData?.reading?.value != null ? Number(latestData.reading.value).toFixed(2) : '—'}
                    </span>
                  </div>
                  {latestData?.reading?.recordedAt && (
                    <span className="text-xs text-gray-500">
                      Recorded {formatDateTime(latestData.reading.recordedAt)}
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-700 leading-relaxed mt-2">
                  {latestData?.evaluation?.message || 'Awaiting sensor readings.'}
                </p>

                {/* Additional Crop Statuses on farm plantings */}
                {latestData?.cropStatuses && latestData.cropStatuses.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">
                      Active Farm Plantings Compatibility
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {latestData.cropStatuses.map((cs) => (
                        <div
                          key={cs.cropName}
                          className="border border-gray-200 rounded px-3 py-1.5 bg-gray-50 flex items-center gap-2 text-xs"
                        >
                          <Sprout size={13} className="text-green-800" />
                          <span className="font-medium text-gray-800">{cs.cropName}</span>
                          <span className="text-gray-400">({cs.range.min}–{cs.range.max})</span>
                          <StatusBadge status={cs.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {latestCreatedAlert && (
                <div className="mt-4 border border-red-200 bg-red-50/80 rounded p-3 text-xs text-red-900 flex items-start gap-2">
                  <AlertTriangle size={15} className="text-red-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">New alert created: </span>
                    <span>{latestCreatedAlert.message}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Col: Simulation Controls Panel */}
            <div className="border border-gray-200 bg-white rounded p-6 flex flex-col justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-1">
                  Simulation & Ingestion
                </p>
                <h3 className="font-serif text-lg font-semibold text-gray-900 mb-2">
                  Sensor Controls
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  Test the soil pH state machine, threshold triggers, and real-time alerts without physical field equipment.
                </p>

                {/* Active sensor status */}
                <div className="p-3 bg-gray-50 rounded border border-gray-200 text-xs mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-500">Active Sensor:</span>
                    <span className="font-semibold text-gray-800">
                      {activeSensor ? activeSensor.name : 'None available'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Sensor Status:</span>
                    {activeSensor ? (
                      <StatusBadge status="active" />
                    ) : (
                      <span className="text-red-700 font-medium">Inactive / Missing</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    variant="primary"
                    onClick={() => handleSimulate('auto')}
                    loading={simulating}
                    disabled={simulating || !activeSensor || !currentFarm?.mainCrop}
                    className="w-full justify-center"
                  >
                    <Play size={14} className="mr-1.5" />
                    Simulate normal reading
                  </Button>

                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSimulate('low')}
                      loading={simulating}
                      disabled={simulating || !activeSensor || !currentFarm?.mainCrop}
                      className="text-xs border-amber-700 text-amber-900 hover:bg-amber-50"
                    >
                      Simulate low pH
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSimulate('high')}
                      loading={simulating}
                      disabled={simulating || !activeSensor || !currentFarm?.mainCrop}
                      className="text-xs border-blue-700 text-blue-900 hover:bg-blue-50"
                    >
                      Simulate high pH
                    </Button>
                  </div>
                </div>

                {(!activeSensor || !currentFarm?.mainCrop) && (
                  <p className="text-[11px] text-gray-400 mt-2 text-center">
                    {!currentFarm?.mainCrop
                      ? 'Requires a configured farm main crop'
                      : 'Requires at least one active sensor below'}
                  </p>
                )}
              </div>

              {/* Honest demo note */}
              <div className="mt-6 border-t border-gray-100 pt-3 text-[11px] text-gray-500 leading-normal flex items-start gap-1.5">
                <Info size={14} className="text-gray-400 shrink-0 mt-0.5" />
                <span>
                  Readings are simulated in this demo. A real Arduino or ESP sensor can post to the same endpoint.
                </span>
              </div>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* STATS SUMMARY ROW */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard
              label="Minimum pH"
              value={summaryData?.min != null ? Number(summaryData.min).toFixed(2) : '—'}
              sub={`${days}d window`}
            />
            <StatCard
              label="Maximum pH"
              value={summaryData?.max != null ? Number(summaryData.max).toFixed(2) : '—'}
              sub={`${days}d window`}
            />
            <StatCard
              label="Average pH"
              value={summaryData?.avg != null ? Number(summaryData.avg).toFixed(2) : '—'}
              sub="Arithmetic mean"
            />
            <StatCard
              label="Readings Count"
              value={summaryData?.count != null ? summaryData.count : 0}
              sub="Telemetry points"
            />
            <StatCard
              label="In-Range %"
              value={summaryData?.inRangePercent != null ? `${summaryData.inRangePercent}%` : '—'}
              sub="Crop suitability"
            />
            <StatCard
              label="Out-of-Range"
              value={summaryData?.outOfRangeCount != null ? summaryData.outOfRangeCount : 0}
              sub="Acidity / alkalinity"
            />
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* LINE CHART SECTION */}
          {/* ───────────────────────────────────────────────────────────── */}
          <section className="border border-gray-200 bg-white rounded p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Trend Analysis</p>
                <h3 className="font-serif text-xl font-semibold text-gray-900 mt-0.5">
                  Soil pH Over Time
                </h3>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-green-900 inline-block" />
                  <span>Suitable Reading</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border-2 border-green-900 bg-white rotate-45 inline-block" />
                  <span>Out-of-Range (Diamond)</span>
                </div>
                {readingsData.range && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-3 bg-green-100 border border-green-300 inline-block" />
                    <span>Suitable Range Band</span>
                  </div>
                )}
              </div>
            </div>

            {loadingReadings ? (
              <div className="py-24 flex justify-center">
                <Spinner size="lg" />
              </div>
            ) : (
              <PhLineChart
                readings={readingsData.readings}
                range={readingsData.range}
                height={340}
              />
            )}
          </section>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* SENSORS & DEVICES MANAGEMENT PANEL */}
          {/* ───────────────────────────────────────────────────────────── */}
          <section className="border border-gray-200 bg-white rounded p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Hardware & Simulation</p>
                <h3 className="font-serif text-xl font-semibold text-gray-900 mt-0.5">
                  Farm Sensors & Devices
                </h3>
              </div>
              <Button variant="primary" size="sm" onClick={openRegisterModal}>
                <Plus size={16} className="mr-1" /> Register sensor
              </Button>
            </div>

            {loadingDevices ? (
              <div className="py-12 flex justify-center">
                <Spinner size="md" />
              </div>
            ) : devices.length === 0 ? (
              <EmptyState
                icon={<Cpu size={40} className="text-gray-400" />}
                title="No sensors connected to this farm"
                description="Register a simulated sensor to begin testing or generate keys for real IoT soil probes."
                actionLabel="Register first sensor"
                onAction={openRegisterModal}
              />
            ) : (
              <TableContainer>
                <thead>
                  <tr>
                    <Th>Sensor Name</Th>
                    <Th>Source</Th>
                    <Th>Status</Th>
                    <Th>Last Seen</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((device) => (
                    <tr key={device._id} className="hover:bg-gray-50/50 transition-colors">
                      <Td className="font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <Cpu size={15} className="text-green-800" />
                          <span>{device.name}</span>
                        </div>
                      </Td>
                      <Td className="capitalize">
                        <span className="text-xs font-mono px-2 py-0.5 bg-gray-100 rounded text-gray-700">
                          {device.source}
                        </span>
                      </Td>
                      <Td>
                        <StatusBadge status={device.status} />
                      </Td>
                      <Td>{formatDateTime(device.lastSeenAt)}</Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          {device.source === 'hardware' && (
                            <button
                              onClick={() => handleRegenerateKey(device)}
                              className="p-1.5 text-gray-500 hover:text-green-900 focus-ring rounded"
                              title="Regenerate device API key"
                              aria-label={`Regenerate API key for ${device.name}`}
                            >
                              <Key size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => openEditDeviceModal(device)}
                            className="p-1.5 text-gray-500 hover:text-green-900 focus-ring rounded"
                            title="Edit sensor"
                            aria-label={`Edit ${device.name}`}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteDeviceTarget(device)}
                            className="p-1.5 text-gray-500 hover:text-red-700 focus-ring rounded"
                            title="Delete sensor"
                            aria-label={`Delete ${device.name}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </TableContainer>
            )}
          </section>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODALS */}
      {/* ───────────────────────────────────────────────────────────── */}

      {/* Register Sensor Modal */}
      <Modal
        open={registerModalOpen}
        onClose={() => !registering && setRegisterModalOpen(false)}
        title="Register new sensor"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
          <ErrorBlock error={registerError} />

          <FormField
            label="Sensor name"
            htmlFor="sensor-name"
            required
            helperText="Identifies this probe in your plot records"
          >
            <Input
              id="sensor-name"
              placeholder="e.g. Plot 1 West Probe"
              value={registerName}
              onChange={(e) => setRegisterName(e.target.value)}
              disabled={registering}
            />
          </FormField>

          <FormField
            label="Sensor source type"
            htmlFor="sensor-source"
            helperText="Simulated sensors post via web demo buttons; hardware sensors post via x-device-key HTTP header."
          >
            <Select
              id="sensor-source"
              value={registerSource}
              onChange={(e) => setRegisterSource(e.target.value)}
              disabled={registering}
            >
              <option value="simulated">Simulated (Standard Demo)</option>
              <option value="hardware">Hardware Sensor (Advanced IoT)</option>
            </Select>
          </FormField>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setRegisterModalOpen(false)}
              disabled={registering}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={registering}
              disabled={registering}
            >
              Register sensor
            </Button>
          </div>
        </form>
      </Modal>

      {/* Hardware Device API Key One-Time Modal */}
      <Modal
        open={keyModalOpen}
        onClose={() => setKeyModalOpen(false)}
        title="Device Authentication Key"
        maxWidth="max-w-md"
      >
        <div className="flex flex-col gap-4">
          <div className="border border-amber-200 bg-amber-50 rounded p-3 text-xs text-amber-900 leading-relaxed">
            <p className="font-semibold mb-1">Important: One-Time Key Display</p>
            Copy this key now. It will not be shown again.
          </div>

          <div className="flex items-center gap-2 p-3 bg-gray-100 rounded border border-gray-300 font-mono text-sm break-all">
            <span className="flex-1">{revealedKey}</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => copyToClipboard(revealedKey)}
              className="shrink-0"
            >
              {keyCopied ? <Check size={14} className="text-green-700" /> : <Copy size={14} />}
            </Button>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed">
            Configure your hardware firmware to send this token in the{' '}
            <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">x-device-key</code> header to{' '}
            <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">POST /api/readings</code>.
          </p>

          <div className="flex justify-end pt-2">
            <Button variant="primary" onClick={() => setKeyModalOpen(false)}>
              I have saved the key
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Sensor Modal */}
      <Modal
        open={editDeviceModalOpen}
        onClose={() => !savingDevice && setEditDeviceModalOpen(false)}
        title="Edit sensor"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleEditDeviceSubmit} className="flex flex-col gap-4">
          <ErrorBlock error={editDeviceError} />

          <FormField
            label="Sensor name"
            htmlFor="edit-sensor-name"
            required
          >
            <Input
              id="edit-sensor-name"
              value={editDeviceName}
              onChange={(e) => setEditDeviceName(e.target.value)}
              disabled={savingDevice}
            />
          </FormField>

          <FormField
            label="Status"
            htmlFor="edit-sensor-status"
          >
            <Select
              id="edit-sensor-status"
              value={editDeviceStatus}
              onChange={(e) => setEditDeviceStatus(e.target.value)}
              disabled={savingDevice}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </FormField>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setEditDeviceModalOpen(false)}
              disabled={savingDevice}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={savingDevice}
              disabled={savingDevice}
            >
              Save changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Device Confirm Dialog */}
      <ConfirmDialog
        open={!!deleteDeviceTarget}
        onClose={() => !deletingDevice && setDeleteDeviceTarget(null)}
        onConfirm={handleDeleteDeviceConfirm}
        title="Delete sensor?"
        message={`Are you sure you want to delete "${deleteDeviceTarget?.name}"? All historical readings logged by this sensor will also be deleted.`}
        confirmLabel="Delete sensor"
        confirmVariant="primary"
        loading={deletingDevice}
      />
    </AppShell>
  );
}
