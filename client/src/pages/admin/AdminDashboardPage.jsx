// src/pages/admin/AdminDashboardPage.jsx
// Admin Dashboard: platform stats summary, overview bar chart, and recent activity feeds.
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  MapPin,
  Sprout,
  Cpu,
  Activity,
  ShoppingBag,
  MessageSquare,
  Package,
  CalendarCheck,
  TrendingUp,
  ArrowRight,
  Clock,
  Tag,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import AppShell from '../../components/layout/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import ErrorBlock from '../../components/ui/ErrorBlock';
import { getAdminStats } from '../../api/admin';
import { formatDate, formatDateTime, formatCurrency } from '../../utils/format';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = async () => {
    setLoading(true);
    setError('');
    try {
      const stats = await getAdminStats();
      setData(stats);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to load platform statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const counts = data?.counts || {};
  const overview = data?.overview || [];
  const recentUsers = data?.recentUsers || [];
  const recentListings = data?.recentListings || [];
  const recentProducts = data?.recentProducts || [];

  return (
    <AppShell>
      <PageHeader
        eyebrow="System Administration"
        title="Admin Overview"
        description="Monitor system-wide platform statistics, registered accounts, marketplace listings, and resource orders."
      />

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Spinner size="lg" className="text-green-700" />
          <p className="mt-4 text-sm font-medium">Loading platform statistics...</p>
        </div>
      )}

      {error && !loading && (
        <div className="my-6">
          <ErrorBlock message={error} onRetry={loadStats} />
        </div>
      )}

      {!loading && !error && data && (
        <div className="space-y-10">
          {/* Section: Platform Statistics Metrics */}
          <section aria-labelledby="platform-metrics-heading">
            <h2 id="platform-metrics-heading" className="text-lg font-serif font-bold text-gray-900 mb-4">
              Platform Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Users StatCard */}
              <StatCard
                label="Registered Users"
                value={counts.users?.total ?? 0}
                icon={<Users size={18} />}
                sub={
                  counts.users
                    ? `${counts.users.farmer ?? 0} farmers · ${counts.users.buyer ?? 0} buyers · ${counts.users.admin ?? 0} admins`
                    : 'User breakdown'
                }
              />

              {/* Farms StatCard */}
              <StatCard
                label="Farms"
                value={counts.farms ?? 0}
                icon={<MapPin size={18} />}
                sub="Registered farming sites"
              />

              {/* Plantings StatCard */}
              <StatCard
                label="Plantings"
                value={counts.plantings ?? 0}
                icon={<Sprout size={18} />}
                sub="Active & recorded cycles"
              />

              {/* Hardware Sensors StatCard */}
              <StatCard
                label="Soil Sensors"
                value={counts.devices ?? 0}
                icon={<Cpu size={18} />}
                sub="Deployed telemetry devices"
              />

              {/* Telemetry Readings StatCard */}
              <StatCard
                label="pH Readings"
                value={counts.readings ?? 0}
                icon={<Activity size={18} />}
                sub="Logged soil pH measurements"
              />

              {/* Marketplace Listings StatCard */}
              <StatCard
                label="Marketplace Listings"
                value={counts.listings?.total ?? 0}
                icon={<ShoppingBag size={18} />}
                sub={
                  counts.listings
                    ? `${counts.listings.available ?? 0} available · ${counts.listings.reserved ?? 0} reserved · ${counts.listings.sold ?? 0} sold`
                    : 'Listing status breakdown'
                }
              />

              {/* Inquiries StatCard */}
              <StatCard
                label="Market Inquiries"
                value={counts.inquiries?.total ?? 0}
                icon={<MessageSquare size={18} />}
                sub={
                  counts.inquiries
                    ? `${counts.inquiries.pending ?? 0} pending · ${counts.inquiries.accepted ?? 0} accepted · ${counts.inquiries.rejected ?? 0} rejected`
                    : 'Inquiry statuses'
                }
              />

              {/* Products StatCard */}
              <StatCard
                label="Input Catalog Items"
                value={counts.products ?? 0}
                icon={<Package size={18} />}
                sub="Agricultural supplies in shop"
              />

              {/* Bookings StatCard */}
              <StatCard
                label="Orders & Bookings"
                value={counts.bookings?.total ?? 0}
                icon={<CalendarCheck size={18} />}
                sub={
                  counts.bookings
                    ? `${counts.bookings.pending ?? 0} pending · ${counts.bookings.confirmed ?? 0} confirmed · ${counts.bookings.delivered ?? 0} delivered`
                    : 'Order status breakdown'
                }
              />
            </div>
          </section>

          {/* Section: Overview Chart */}
          <section aria-labelledby="platform-chart-heading" className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 id="platform-chart-heading" className="text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-700" aria-hidden="true" />
                  Resource Volume Distribution
                </h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  Visual volume across key system entities and activity records.
                </p>
              </div>
            </div>

            {overview.length > 0 ? (
              <div>
                <div className="h-64 w-full" aria-hidden="true">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={overview} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" stroke="#4B5563" fontSize={12} tickLine={false} />
                      <YAxis stroke="#4B5563" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#E5E7EB',
                          borderRadius: '0.5rem',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                        formatter={(value) => [value, 'Total Records']}
                      />
                      <Bar dataKey="value" fill="#2D5A27" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Accessible alternative table for screen readers */}
                <div className="sr-only">
                  <table>
                    <caption>Platform resource summary totals</caption>
                    <thead>
                      <tr>
                        <th scope="col">Entity</th>
                        <th scope="col">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.map((item) => (
                        <tr key={item.name}>
                          <td>{item.name}</td>
                          <td>{item.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 py-8 text-center">No overview data points available.</p>
            )}
          </section>

          {/* Section: Three Recent Feeds */}
          <section aria-labelledby="recent-activity-heading" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <h2 id="recent-activity-heading" className="sr-only">
              Recent Activity Feeds
            </h2>

            {/* Recent Users */}
            <article className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-700" aria-hidden="true" />
                    <h3 className="font-serif font-bold text-gray-900 text-base">Recent Users</h3>
                  </div>
                  <Link
                    to="/admin/users"
                    className="text-xs font-semibold text-green-700 hover:text-green-800 flex items-center gap-1 group"
                  >
                    View all <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

                {recentUsers.length === 0 ? (
                  <p className="text-xs text-gray-500 py-4 text-center">No recent users found.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {recentUsers.slice(0, 5).map((u) => (
                      <li key={u._id} className="py-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                          <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1">
                          <StatusBadge status={u.role} />
                          <span className="text-[10px] text-gray-400">
                            {formatDate(u.createdAt)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>

            {/* Recent Listings */}
            <article className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-green-700" aria-hidden="true" />
                    <h3 className="font-serif font-bold text-gray-900 text-base">Recent Listings</h3>
                  </div>
                  <Link
                    to="/admin/listings"
                    className="text-xs font-semibold text-green-700 hover:text-green-800 flex items-center gap-1 group"
                  >
                    View all <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

                {recentListings.length === 0 ? (
                  <p className="text-xs text-gray-500 py-4 text-center">No recent listings found.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {recentListings.slice(0, 5).map((l) => (
                      <li key={l._id} className="py-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{l.cropName}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {l.quantity} {l.unit} · {formatCurrency(l.pricePerUnit)}/{l.unit}
                          </p>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1">
                          <StatusBadge status={l.status || 'available'} />
                          <span className="text-[10px] text-gray-400">
                            {formatDate(l.createdAt)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>

            {/* Recent Products */}
            <article className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-green-700" aria-hidden="true" />
                    <h3 className="font-serif font-bold text-gray-900 text-base">Recent Products</h3>
                  </div>
                  <Link
                    to="/admin/products"
                    className="text-xs font-semibold text-green-700 hover:text-green-800 flex items-center gap-1 group"
                  >
                    View all <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

                {recentProducts.length === 0 ? (
                  <p className="text-xs text-gray-500 py-4 text-center">No recent products found.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {recentProducts.slice(0, 5).map((p) => (
                      <li key={p._id} className="py-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {formatCurrency(p.price)} · Stock: {p.stock}
                          </p>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700 capitalize">
                            {p.category}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {formatDate(p.createdAt)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          </section>
        </div>
      )}
    </AppShell>
  );
}
