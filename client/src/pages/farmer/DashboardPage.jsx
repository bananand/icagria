// src/pages/farmer/DashboardPage.jsx
// Farmer Dashboard: greetings, FarmSelect, StatCards row, compact pH chart, compact weather block with tips,
// upcoming harvests table, and recent alerts list. Independent loading/error states per block.

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import FarmSelect from '../../components/ui/FarmSelect';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import PhLineChart from '../../components/charts/PhLineChart';
import { TableContainer, Th, Td } from '../../components/ui/Table';
import { useAuth } from '../../context/AuthContext';
import { useFarm } from '../../context/FarmContext';
import { useAlerts } from '../../context/AlertsContext';
import { formatDate, formatDateTime } from '../../utils/format';
import * as readingApi from '../../api/readings';
import * as weatherApi from '../../api/weather';
import * as plantingApi from '../../api/plantings';
import * as alertApi from '../../api/alerts';
import {
  Activity,
  CloudSun,
  Sprout,
  Bell,
  ArrowRight,
  Lightbulb,
  Clock,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { farms, selectedFarmId, loading: loadingFarms } = useFarm();
  const { unreadCount } = useAlerts();

  // Block 1: Latest pH
  const [latestPh, setLatestPh] = useState(null);
  const [loadingLatestPh, setLoadingLatestPh] = useState(false);
  const [phError, setPhError] = useState(false);

  // Block 2: 7-day readings for compact chart
  const [readings7d, setReadings7d] = useState({ readings: [], range: null });
  const [loadingChart, setLoadingChart] = useState(false);

  // Block 3: Weather Now & Tips
  const [weatherNow, setWeatherNow] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState('');

  // Block 4: Plantings & Harvests
  const [growingPlantings, setGrowingPlantings] = useState([]);
  const [loadingPlantings, setLoadingPlantings] = useState(false);

  // Block 5: Recent Alerts
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  const currentFarm = farms.find((f) => f._id === selectedFarmId);

  // Load Latest pH & Chart
  useEffect(() => {
    if (!selectedFarmId) {
      setLatestPh(null);
      setReadings7d({ readings: [], range: null });
      return;
    }

    setLoadingLatestPh(true);
    setPhError(false);
    readingApi
      .getLatestReading({ farmId: selectedFarmId })
      .then(setLatestPh)
      .catch(() => setPhError(true))
      .finally(() => setLoadingLatestPh(false));

    setLoadingChart(true);
    readingApi
      .getReadings({ farmId: selectedFarmId, days: 7, limit: 100 })
      .then((res) => {
        setReadings7d({
          readings: res.readings || [],
          range: res.range || null,
        });
      })
      .catch(() => setReadings7d({ readings: [], range: null }))
      .finally(() => setLoadingChart(false));
  }, [selectedFarmId]);

  // Load Weather
  useEffect(() => {
    if (!selectedFarmId) {
      setWeatherNow(null);
      return;
    }

    const hasCoords =
      currentFarm?.location?.lat != null && currentFarm?.location?.lng != null;

    if (!hasCoords) {
      setWeatherNow(null);
      setWeatherError('Farm coordinates not set');
      return;
    }

    setLoadingWeather(true);
    setWeatherError('');
    weatherApi
      .getWeather({ farmId: selectedFarmId })
      .then(setWeatherNow)
      .catch((err) => {
        setWeatherError(err?.response?.data?.message || 'Weather unavailable');
        setWeatherNow(null);
      })
      .finally(() => setLoadingWeather(false));
  }, [selectedFarmId, currentFarm]);

  // Load Growing Plantings (Nearest Harvests)
  useEffect(() => {
    if (!selectedFarmId) {
      setGrowingPlantings([]);
      return;
    }

    setLoadingPlantings(true);
    plantingApi
      .getPlantings({ farmId: selectedFarmId })
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        const growing = list.filter((p) => p.status === 'growing');
        // Sort by expectedHarvestDate ascending
        growing.sort((a, b) => {
          if (!a.expectedHarvestDate) return 1;
          if (!b.expectedHarvestDate) return -1;
          return new Date(a.expectedHarvestDate) - new Date(b.expectedHarvestDate);
        });
        setGrowingPlantings(growing);
      })
      .catch(() => setGrowingPlantings([]))
      .finally(() => setLoadingPlantings(false));
  }, [selectedFarmId]);

  // Load Recent Alerts
  useEffect(() => {
    if (!selectedFarmId) {
      setRecentAlerts([]);
      return;
    }

    setLoadingAlerts(true);
    alertApi
      .getAlerts({ farmId: selectedFarmId, limit: 5 })
      .then((data) => setRecentAlerts(Array.isArray(data) ? data : []))
      .catch(() => setRecentAlerts([]))
      .finally(() => setLoadingAlerts(false));
  }, [selectedFarmId]);

  // Compute Next Expected Harvest
  const nextHarvest = growingPlantings.find((p) => p.expectedHarvestDate);
  let nextHarvestSub = 'No upcoming dates';
  if (nextHarvest) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(nextHarvest.expectedHarvestDate);
    exp.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      nextHarvestSub = `Overdue (${Math.abs(diffDays)}d ago)`;
    } else if (diffDays === 0) {
      nextHarvestSub = 'Due today';
    } else {
      nextHarvestSub = `in ${diffDays} days (${formatDate(nextHarvest.expectedHarvestDate)})`;
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Farmer Portal"
        title={`Welcome back, ${user?.name || 'Farmer'}`}
        description="Daily operational overview for your soil health, microclimate forecasts, and crop schedules."
      />

      {/* Top Selector */}
      <div className="flex items-center gap-3 mb-8">
        <label htmlFor="dashboard-farm-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
          Active farm:
        </label>
        <FarmSelect id="dashboard-farm-select" className="w-72" />
      </div>

      {loadingFarms ? (
        <div className="py-24 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : farms.length === 0 ? (
        <div className="border border-gray-200 rounded-md bg-white p-6">
          <EmptyState
            icon={<Sprout size={40} className="text-gray-400" />}
            title="Welcome to icagria"
            description="Get started by registering your first farm plot to begin monitoring soil pH and local weather."
            actionLabel="Add your first farm"
            actionHref="/app/farms"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Row of StatCards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat 1: Latest pH */}
            <StatCard
              label="Latest Soil pH"
              value={
                loadingLatestPh
                  ? '…'
                  : latestPh?.reading?.value != null
                  ? `pH ${Number(latestPh.reading.value).toFixed(2)}`
                  : '—'
              }
              sub={
                latestPh?.evaluation?.status ? (
                  <span className="capitalize">{latestPh.evaluation.label || latestPh.evaluation.status}</span>
                ) : (
                  'No reading recorded'
                )
              }
              icon={<Activity size={18} className="text-green-800" />}
            />

            {/* Stat 2: Unread Alerts */}
            <StatCard
              label="Unread Alerts"
              value={unreadCount}
              sub={unreadCount > 0 ? 'Requires attention' : 'All clear'}
              icon={<Bell size={18} className="text-amber-800" />}
            />

            {/* Stat 3: Growing Plantings */}
            <StatCard
              label="Active Plantings"
              value={loadingPlantings ? '…' : growingPlantings.length}
              sub="Currently growing"
              icon={<Sprout size={18} className="text-green-800" />}
            />

            {/* Stat 4: Next Expected Harvest */}
            <StatCard
              label="Next Harvest"
              value={nextHarvest?.crop?.name || '—'}
              sub={nextHarvestSub}
              icon={<Calendar size={18} className="text-blue-800" />}
            />
          </div>

          {/* Two Columns: Left compact pH chart, Right Weather now */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Soil pH, last 7 days */}
            <section className="border border-gray-200 bg-white rounded p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Telemetry</p>
                    <h3 className="font-serif text-lg font-semibold text-gray-900">
                      Soil pH, last 7 days
                    </h3>
                  </div>
                  <Link
                    to="/app/soil-ph"
                    className="text-xs font-medium text-green-700 hover:text-green-900 inline-flex items-center gap-1"
                  >
                    Open Soil pH <ArrowRight size={14} />
                  </Link>
                </div>

                {loadingChart ? (
                  <div className="py-20 flex justify-center">
                    <Spinner size="md" />
                  </div>
                ) : (
                  <PhLineChart
                    readings={readings7d.readings}
                    range={readings7d.range}
                    height={220}
                    compact
                  />
                )}
              </div>
            </section>

            {/* Right: Weather Now */}
            <section className="border border-gray-200 bg-white rounded p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Microclimate</p>
                    <h3 className="font-serif text-lg font-semibold text-gray-900">
                      Weather now
                    </h3>
                  </div>
                  <Link
                    to="/app/weather"
                    className="text-xs font-medium text-green-700 hover:text-green-900 inline-flex items-center gap-1"
                  >
                    Open Weather <ArrowRight size={14} />
                  </Link>
                </div>

                {loadingWeather ? (
                  <div className="py-20 flex justify-center">
                    <Spinner size="md" />
                  </div>
                ) : weatherError ? (
                  <div className="py-10 text-center text-xs text-gray-500">
                    <CloudSun size={32} className="mx-auto text-gray-300 mb-2" />
                    <p>{weatherError}</p>
                    <Link to="/app/farms" className="text-green-700 underline mt-1 inline-block">
                      Configure coordinates in Farms
                    </Link>
                  </div>
                ) : weatherNow?.current ? (
                  <div>
                    <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded border border-gray-100 mb-4">
                      <div className="flex items-center gap-3">
                        {weatherNow.current.iconUrl && (
                          <img
                            src={weatherNow.current.iconUrl}
                            alt={weatherNow.current.description}
                            className="w-12 h-12"
                          />
                        )}
                        <div>
                          <p className="font-serif text-3xl font-bold text-green-900">
                            {Math.round(weatherNow.current.temp)}°C
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {weatherNow.current.description}
                          </p>
                        </div>
                      </div>

                      <div className="text-right text-xs text-gray-600 space-y-0.5">
                        <p>Humidity: {weatherNow.current.humidity}%</p>
                        <p>Wind: {weatherNow.current.windSpeed} m/s</p>
                        {weatherNow.current.rain1h > 0 && (
                          <p className="text-blue-700 font-medium">Rain: {weatherNow.current.rain1h} mm</p>
                        )}
                      </div>
                    </div>

                    {/* First 2 agricultural tips */}
                    {weatherNow.tips && weatherNow.tips.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                          Field Advisories
                        </p>
                        {weatherNow.tips.slice(0, 2).map((tip, idx) => (
                          <div key={idx} className="text-xs text-green-900 bg-green-50 p-2 rounded flex items-start gap-1.5">
                            <Lightbulb size={13} className="text-green-700 shrink-0 mt-0.5" />
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 py-10 text-center">No weather data found.</p>
                )}
              </div>
            </section>
          </div>

          {/* Two Columns: Upcoming Harvests & Recent Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Harvests */}
            <section className="border border-gray-200 bg-white rounded p-6">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Planning</p>
                  <h3 className="font-serif text-lg font-semibold text-gray-900">
                    Upcoming harvests
                  </h3>
                </div>
                <Link
                  to="/app/crops"
                  className="text-xs font-medium text-green-700 hover:text-green-900 inline-flex items-center gap-1"
                >
                  View all <ArrowRight size={14} />
                </Link>
              </div>

              {loadingPlantings ? (
                <div className="py-12 flex justify-center">
                  <Spinner size="md" />
                </div>
              ) : growingPlantings.length === 0 ? (
                <p className="text-xs text-gray-400 py-8 text-center">
                  No growing plantings scheduled. Record plantings in Crops page.
                </p>
              ) : (
                <TableContainer>
                  <thead>
                    <tr>
                      <Th>Crop</Th>
                      <Th>Variety</Th>
                      <Th>Expected Harvest</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {growingPlantings.slice(0, 5).map((p) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const exp = p.expectedHarvestDate ? new Date(p.expectedHarvestDate) : null;
                      if (exp) exp.setHours(0, 0, 0, 0);
                      const isOverdue = exp && exp < today;

                      return (
                        <tr key={p._id}>
                          <Td className="font-medium text-gray-900">{p.crop?.name || 'Crop'}</Td>
                          <Td>{p.variety || '—'}</Td>
                          <Td>
                            {p.expectedHarvestDate ? (
                              <span className={isOverdue ? 'text-red-700 font-medium' : ''}>
                                {formatDate(p.expectedHarvestDate)} {isOverdue ? '(Overdue)' : ''}
                              </span>
                            ) : (
                              '—'
                            )}
                          </Td>
                          <Td>
                            <StatusBadge status={p.status} />
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </TableContainer>
              )}
            </section>

            {/* Recent Alerts */}
            <section className="border border-gray-200 bg-white rounded p-6">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Notifications</p>
                  <h3 className="font-serif text-lg font-semibold text-gray-900">
                    Recent alerts
                  </h3>
                </div>
                <Link
                  to="/app/alerts"
                  className="text-xs font-medium text-green-700 hover:text-green-900 inline-flex items-center gap-1"
                >
                  View all <ArrowRight size={14} />
                </Link>
              </div>

              {loadingAlerts ? (
                <div className="py-12 flex justify-center">
                  <Spinner size="md" />
                </div>
              ) : recentAlerts.length === 0 ? (
                <p className="text-xs text-gray-400 py-8 text-center">
                  No alerts recorded for this farm.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentAlerts.slice(0, 5).map((a) => (
                    <div
                      key={a._id}
                      className="p-3 rounded border border-gray-100 bg-gray-50 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-2">
                        {a.level === 'warning' ? (
                          <AlertTriangle size={14} className="text-amber-800 shrink-0 mt-0.5" />
                        ) : (
                          <Activity size={14} className="text-blue-700 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="font-semibold text-gray-800">{a.message}</p>
                          <p className="text-[11px] text-gray-400 mt-1">
                            {formatDateTime(a.createdAt)}
                          </p>
                        </div>
                      </div>
                      {!a.isRead && (
                        <span className="w-2 h-2 rounded-full bg-green-700 shrink-0" title="Unread" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </AppShell>
  );
}
