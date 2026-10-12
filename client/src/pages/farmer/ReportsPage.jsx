// src/pages/farmer/ReportsPage.jsx
// Farmer Agronomic and Commercial Reports:
// Tab 1: Farm Report (FarmSelect, 7/30/90 days, plantings table, pH StatCards + visual chart, alerts counts, bookings total spent, "Print this report" button)
// Tab 2: Sales Report (grouped by status, total quantity kg, estimated value of sold listings, note about estimates, Recharts bar chart with accessible table alternative)

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import AppShell from '../../components/layout/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import FarmSelect from '../../components/ui/FarmSelect';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import ErrorBlock from '../../components/ui/ErrorBlock';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { TableContainer, Th, Td } from '../../components/ui/Table';
import { formatCurrency, formatDate } from '../../utils/format';
import { getErrorMessage } from '../../api/client';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';
import * as reportApi from '../../api/reports';
import {
  BarChart3,
  Printer,
  FileText,
  Activity,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Layers,
  Sprout,
  CheckCircle,
  Clock,
  Package,
} from 'lucide-react';

export default function ReportsPage() {
  const { farms, selectedFarmId } = useFarm();
  const { push } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = searchParams.get('tab') || 'farm';
  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB 1: FARM SUMMARY REPORT
  // ─────────────────────────────────────────────────────────────────────────────
  const [farmDays, setFarmDays] = useState(30);
  const [farmSummary, setFarmSummary] = useState(null);
  const [loadingFarmSummary, setLoadingFarmSummary] = useState(false);
  const [farmSummaryError, setFarmSummaryError] = useState('');

  const currentFarm = farms.find((f) => f._id === selectedFarmId);

  const loadFarmSummary = useCallback(async () => {
    if (!selectedFarmId) {
      setFarmSummary(null);
      return;
    }

    setLoadingFarmSummary(true);
    setFarmSummaryError('');
    try {
      const data = await reportApi.getFarmSummary({
        farmId: selectedFarmId,
        days: farmDays,
      });
      setFarmSummary(data);
    } catch (err) {
      setFarmSummaryError(getErrorMessage(err));
      setFarmSummary(null);
    } finally {
      setLoadingFarmSummary(false);
    }
  }, [selectedFarmId, farmDays]);

  useEffect(() => {
    if (currentTab === 'farm') {
      loadFarmSummary();
    }
  }, [currentTab, loadFarmSummary]);

  const handlePrint = () => {
    window.print();
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB 2: SALES REPORT
  // ─────────────────────────────────────────────────────────────────────────────
  const [salesReport, setSalesReport] = useState(null);
  const [loadingSales, setLoadingSales] = useState(false);
  const [salesError, setSalesError] = useState('');

  const loadSalesReport = useCallback(async () => {
    setLoadingSales(true);
    setSalesError('');
    try {
      const data = await reportApi.getSalesReport();
      setSalesReport(data);
    } catch (err) {
      setSalesError(getErrorMessage(err));
      setSalesReport(null);
    } finally {
      setLoadingSales(false);
    }
  }, []);

  useEffect(() => {
    if (currentTab === 'sales') {
      loadSalesReport();
    }
  }, [currentTab, loadSalesReport]);

  // Format bar chart data for sales
  const salesChartData = [
    {
      status: 'Available',
      count: salesReport?.byStatus?.available?.count || 0,
      quantityKg: salesReport?.byStatus?.available?.totalQuantityKg || 0,
      color: '#16a34a',
    },
    {
      status: 'Reserved',
      count: salesReport?.byStatus?.reserved?.count || 0,
      quantityKg: salesReport?.byStatus?.reserved?.totalQuantityKg || 0,
      color: '#d97706',
    },
    {
      status: 'Sold',
      count: salesReport?.byStatus?.sold?.count || 0,
      quantityKg: salesReport?.byStatus?.sold?.totalQuantityKg || 0,
      color: '#14532d',
    },
  ];

  return (
    <AppShell>
      {/* Header and Print action (hidden in print media) */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <PageHeader
          eyebrow="Agronomic Analytics"
          title="Performance Reports"
          description="Detailed telemetry summaries, crop production schedules, and harvest commercial revenue."
          className="mb-0 flex-1"
        />

        {currentTab === 'farm' && farmSummary && (
          <Button
            variant="secondary"
            onClick={handlePrint}
            className="no-print mt-4 shrink-0"
          >
            <Printer size={16} className="mr-1.5" />
            Print this report
          </Button>
        )}
      </div>

      {/* Tabs (hidden in print) */}
      <div className="flex border-b border-gray-200 mb-6 no-print">
        <button
          onClick={() => handleTabChange('farm')}
          className={[
            'px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 focus-ring',
            currentTab === 'farm'
              ? 'border-green-900 text-green-900 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300',
          ].join(' ')}
        >
          <FileText size={16} aria-hidden="true" />
          Farm report
        </button>
        <button
          onClick={() => handleTabChange('sales')}
          className={[
            'px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 focus-ring',
            currentTab === 'sales'
              ? 'border-green-900 text-green-900 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300',
          ].join(' ')}
        >
          <BarChart3 size={16} aria-hidden="true" />
          Sales report
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: FARM REPORT */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {currentTab === 'farm' && (
        <section aria-label="Farm telemetry and operational summary">
          {/* Controls Bar (FarmSelect & Days window, hidden in print) */}
          <div className="bg-white border border-gray-200 rounded p-4 mb-6 flex flex-wrap items-center justify-between gap-4 no-print">
            <div className="flex items-center gap-3">
              <label htmlFor="report-farm-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Select farm:
              </label>
              <FarmSelect
                id="report-farm-select"
                className="w-72"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Window:</span>
              <div className="inline-flex rounded border border-gray-200 bg-white p-0.5">
                {[7, 30, 90].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setFarmDays(d)}
                    className={[
                      'px-3 py-1 text-xs rounded transition-colors font-medium',
                      farmDays === d
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

          {/* Printable Header Banner (Only visible on print) */}
          <div className="hidden print-only mb-6 border-b border-gray-300 pb-4">
            <h1 className="text-2xl font-serif font-bold text-gray-900">
              icagria Farm Operational Summary Report
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Farm: <strong>{farmSummary?.farm?.name || currentFarm?.name}</strong> • Reporting Interval: Last {farmDays} Days • Date: {new Date().toLocaleDateString('en-GB')}
            </p>
          </div>

          {farmSummaryError && (
            <div className="mb-6 no-print">
              <ErrorBlock error={farmSummaryError} />
            </div>
          )}

          {!selectedFarmId ? (
            <div className="border border-gray-200 rounded bg-white">
              <EmptyState
                icon={<FileText size={40} className="text-gray-400" />}
                title="No farm selected"
                description="Choose a farm from the dropdown to generate an operational report."
              />
            </div>
          ) : loadingFarmSummary ? (
            <div className="py-24 flex justify-center">
              <Spinner size="lg" />
            </div>
          ) : !farmSummary ? (
            <div className="border border-gray-200 rounded bg-white">
              <EmptyState
                icon={<FileText size={40} className="text-gray-400" />}
                title="Summary unavailable"
                description="Could not generate a summary report for the selected farm."
              />
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {/* StatCards Row: pH & Operational Metrics */}
              <div>
                <h3 className="font-serif text-lg font-semibold text-gray-900 mb-3">
                  Soil pH Telemetry ({farmDays}d Window)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <StatCard
                    label="Min pH"
                    value={farmSummary.ph?.min != null ? Number(farmSummary.ph.min).toFixed(2) : '—'}
                  />
                  <StatCard
                    label="Max pH"
                    value={farmSummary.ph?.max != null ? Number(farmSummary.ph.max).toFixed(2) : '—'}
                  />
                  <StatCard
                    label="Average pH"
                    value={farmSummary.ph?.avg != null ? Number(farmSummary.ph.avg).toFixed(2) : '—'}
                  />
                  <StatCard
                    label="Total Readings"
                    value={farmSummary.ph?.count || 0}
                  />
                  <StatCard
                    label="In-Range %"
                    value={farmSummary.ph?.inRangePercent != null ? `${farmSummary.ph.inRangePercent}%` : '—'}
                  />
                  <StatCard
                    label="Out of Range"
                    value={farmSummary.ph?.outOfRangeCount || 0}
                  />
                </div>
              </div>

              {/* Operational Activity Summary Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="border border-gray-200 bg-white rounded p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">Total Alerts</p>
                    <p className="font-serif font-bold text-2xl text-gray-900 mt-0.5">
                      {farmSummary.alertsCount || 0}
                    </p>
                  </div>
                  <AlertTriangle size={24} className="text-amber-800" />
                </div>

                <div className="border border-gray-200 bg-white rounded p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">Unread Alerts</p>
                    <p className="font-serif font-bold text-2xl text-red-700 mt-0.5">
                      {farmSummary.unreadAlerts || 0}
                    </p>
                  </div>
                  <Clock size={24} className="text-red-700" />
                </div>

                <div className="border border-gray-200 bg-white rounded p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">Total Input Orders Spent</p>
                    <p className="font-serif font-bold text-2xl text-green-900 mt-0.5">
                      {formatCurrency(farmSummary.bookingsTotalSpent || 0)}
                    </p>
                  </div>
                  <DollarSign size={24} className="text-green-800" />
                </div>
              </div>

              {/* Plantings Table */}
              <section className="border border-gray-200 bg-white rounded p-6">
                <div className="pb-4 mb-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Active Schedules</p>
                    <h3 className="font-serif text-xl font-semibold text-gray-900 mt-0.5">
                      Active Growing Plantings
                    </h3>
                  </div>
                  <span className="text-xs text-gray-500">
                    {farmSummary.plantings?.length || 0} batches recorded
                  </span>
                </div>

                {!farmSummary.plantings || farmSummary.plantings.length === 0 ? (
                  <p className="text-xs text-gray-400 py-6 text-center">
                    No active plantings recorded for this farm.
                  </p>
                ) : (
                  <TableContainer>
                    <thead>
                      <tr>
                        <Th>Crop</Th>
                        <Th>Variety</Th>
                        <Th>Planted Date</Th>
                        <Th>Expected Harvest</Th>
                        <Th>Days to Harvest</Th>
                        <Th>Status</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {farmSummary.plantings.map((p) => {
                        const days = p.daysToHarvest;
                        const isOverdue = days != null && days < 0;

                        return (
                          <tr key={p._id}>
                            <Td className="font-medium text-gray-900">{p.cropName || '—'}</Td>
                            <Td>{p.variety || '—'}</Td>
                            <Td>{formatDate(p.plantedDate)}</Td>
                            <Td>{formatDate(p.expectedHarvestDate)}</Td>
                            <Td>
                              {days != null ? (
                                <span className={isOverdue ? 'text-red-700 font-semibold' : ''}>
                                  {isOverdue ? `Overdue (${Math.abs(days)}d)` : `${days} days`}
                                </span>
                              ) : (
                                '—'
                              )}
                            </Td>
                            <Td>
                              <StatusBadge status={p.status || 'growing'} />
                            </Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </TableContainer>
                )}
              </section>
            </div>
          )}
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: SALES REPORT */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {currentTab === 'sales' && (
        <section aria-label="Commercial sales and listings performance">
          {salesError && (
            <div className="mb-6">
              <ErrorBlock error={salesError} />
            </div>
          )}

          {loadingSales ? (
            <div className="py-24 flex justify-center">
              <Spinner size="lg" />
            </div>
          ) : !salesReport ? (
            <div className="border border-gray-200 rounded bg-white">
              <EmptyState
                icon={<BarChart3 size={40} className="text-gray-400" />}
                title="Sales report unavailable"
                description="Unable to compile harvest sales data at this moment."
              />
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {/* Sales Key Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="border border-gray-200 bg-white rounded p-5 flex flex-col justify-between">
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                    Total Listed Volume
                  </p>
                  <p className="font-serif font-bold text-3xl text-gray-900 my-2">
                    {salesReport.totalQuantityKg?.toLocaleString('en-ID')} kg
                  </p>
                  <p className="text-xs text-gray-400">
                    Across {salesReport.totalListings} total marketplace listings
                  </p>
                </div>

                <div className="border border-gray-200 bg-white rounded p-5 flex flex-col justify-between">
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                    Sold Batches Quantity
                  </p>
                  <p className="font-serif font-bold text-3xl text-green-900 my-2">
                    {salesReport.byStatus?.sold?.totalQuantityKg?.toLocaleString('en-ID') || 0} kg
                  </p>
                  <p className="text-xs text-gray-400">
                    {salesReport.byStatus?.sold?.count || 0} completed orders
                  </p>
                </div>

                <div className="border border-gray-200 bg-white rounded p-5 flex flex-col justify-between">
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                    Estimated Sold Harvest Revenue
                  </p>
                  <p className="font-serif font-bold text-3xl text-green-900 my-2">
                    {formatCurrency(salesReport.estimatedValue || 0)}
                  </p>
                  <p className="text-xs text-gray-400 leading-normal">
                    Values are estimates based on listed prices.
                  </p>
                </div>
              </div>

              {/* Status Breakdown Table */}
              <section className="border border-gray-200 bg-white rounded p-6">
                <div className="pb-4 mb-4 border-b border-gray-100">
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Inventory Breakdown</p>
                  <h3 className="font-serif text-xl font-semibold text-gray-900 mt-0.5">
                    Listing Status Summary
                  </h3>
                </div>

                <TableContainer>
                  <thead>
                    <tr>
                      <Th>Status</Th>
                      <Th>Listings Count</Th>
                      <Th>Total Quantity (kg)</Th>
                      <Th>Estimated Revenue (IDR)</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {['available', 'reserved', 'sold'].map((st) => {
                      const data = salesReport.byStatus?.[st] || { count: 0, totalQuantityKg: 0, estimatedValue: 0 };
                      return (
                        <tr key={st} className="hover:bg-gray-50/50 transition-colors">
                          <Td>
                            <StatusBadge status={st} />
                          </Td>
                          <Td className="font-semibold text-gray-900">{data.count}</Td>
                          <Td>{data.totalQuantityKg?.toLocaleString('en-ID')} kg</Td>
                          <Td className="font-semibold text-green-900">
                            {st === 'sold' ? formatCurrency(data.estimatedValue) : '—'}
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </TableContainer>

                <p className="text-xs text-gray-400 italic mt-3">
                  Note: Revenue values are estimates based on listed unit prices. icagria does not process monetary transactions directly.
                </p>
              </section>

              {/* Recharts Bar Chart of Counts by Status */}
              <section className="border border-gray-200 bg-white rounded p-6">
                <div className="pb-4 mb-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Volume Distribution</p>
                    <h3 className="font-serif text-xl font-semibold text-gray-900 mt-0.5">
                      Listings Count by Status
                    </h3>
                  </div>
                </div>

                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesChartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />
                      <XAxis
                        dataKey="status"
                        tick={{ fontSize: 12, fill: '#374151' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <Tooltip
                        formatter={(val, name) => [val, 'Listings Count']}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '4px',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {salesChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Visually hidden accessible data table alternative for screen readers */}
                <div className="sr-only">
                  <table>
                    <caption>Listing count by status table alternative</caption>
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Count</th>
                        <th>Total Quantity (kg)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesChartData.map((row) => (
                        <tr key={row.status}>
                          <td>{row.status}</td>
                          <td>{row.count}</td>
                          <td>{row.quantityKg} kg</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}
        </section>
      )}
    </AppShell>
  );
}
