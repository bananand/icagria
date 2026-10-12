// src/pages/farmer/AlertsPage.jsx
// Farmer Alerts management: list newest first, filter All/Unread, mark one read,
// mark all read, delete, and "Scan last 7 days" button.

import React, { useEffect, useState, useCallback } from 'react';
import AppShell from '../../components/layout/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import FarmSelect from '../../components/ui/FarmSelect';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import StatusBadge from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useFarm } from '../../context/FarmContext';
import { useAlerts } from '../../context/AlertsContext';
import { useToast } from '../../context/ToastContext';
import { formatDateTime } from '../../utils/format';
import { getErrorMessage } from '../../api/client';
import * as alertApi from '../../api/alerts';
import {
  Bell,
  CheckCircle,
  Trash2,
  Radar,
  AlertTriangle,
  Info,
  CheckCheck,
} from 'lucide-react';

export default function AlertsPage() {
  const { farms, selectedFarmId } = useFarm();
  const { refreshUnreadCount } = useAlerts();
  const { push } = useToast();

  const [alerts, setAlerts] = useState([]);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  // Delete Alert state
  const [deleteAlertTarget, setDeleteAlertTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (filterUnreadOnly) {
        params.unread = 'true';
      }
      if (selectedFarmId) {
        params.farmId = selectedFarmId;
      }
      const data = await alertApi.getAlerts(params);
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      push({ message: getErrorMessage(err), type: 'error' });
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [filterUnreadOnly, selectedFarmId]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const handleMarkOneRead = async (alertId) => {
    try {
      await alertApi.markAlertRead(alertId);
      setAlerts((prev) =>
        prev.map((a) => (a._id === alertId ? { ...a, isRead: true } : a))
      );
      refreshUnreadCount();
      push({ message: 'Alert marked as read.', type: 'success' });
    } catch (err) {
      push({ message: getErrorMessage(err), type: 'error' });
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await alertApi.markAllAlertsRead();
      setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
      refreshUnreadCount();
      push({ message: 'All alerts marked as read.', type: 'success' });
    } catch (err) {
      push({ message: getErrorMessage(err), type: 'error' });
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteAlertTarget) return;
    setDeleting(true);
    try {
      await alertApi.deleteAlert(deleteAlertTarget._id);
      setAlerts((prev) => prev.filter((a) => a._id !== deleteAlertTarget._id));
      refreshUnreadCount();
      push({ message: 'Alert deleted.', type: 'success' });
      setDeleteAlertTarget(null);
    } catch (err) {
      push({ message: getErrorMessage(err), type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const handleScanAlerts = async () => {
    if (!selectedFarmId) {
      push({ message: 'Please select a farm to scan for alerts.', type: 'info' });
      return;
    }

    setScanning(true);
    try {
      const res = await alertApi.scanAlerts({ farmId: selectedFarmId, days: 7 });
      const createdCount = res.created || 0;
      push({
        message:
          createdCount > 0
            ? `Scan complete: ${createdCount} new ${createdCount === 1 ? 'alert' : 'alerts'} created.`
            : 'Scan complete: No new out-of-range readings found.',
        type: createdCount > 0 ? 'warning' : 'info',
      });
      await loadAlerts();
      refreshUnreadCount();
    } catch (err) {
      push({ message: getErrorMessage(err), type: 'error' });
    } finally {
      setScanning(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Notifications"
        title="Farm Alerts"
        description="Threshold warnings for soil acidity, sensor irregularities, and weather updates."
      />

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <label htmlFor="alerts-farm-filter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Filter by farm:
          </label>
          <FarmSelect
            id="alerts-farm-filter"
            allowAll
            className="w-64"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Unread / All filter */}
          <div className="inline-flex rounded border border-gray-200 bg-white p-0.5 mr-2">
            <button
              type="button"
              onClick={() => setFilterUnreadOnly(false)}
              className={[
                'px-3 py-1 text-xs rounded transition-colors font-medium',
                !filterUnreadOnly ? 'bg-green-900 text-white' : 'text-gray-600 hover:text-green-900',
              ].join(' ')}
            >
              All alerts
            </button>
            <button
              type="button"
              onClick={() => setFilterUnreadOnly(true)}
              className={[
                'px-3 py-1 text-xs rounded transition-colors font-medium',
                filterUnreadOnly ? 'bg-green-900 text-white' : 'text-gray-600 hover:text-green-900',
              ].join(' ')}
            >
              Unread only
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleScanAlerts}
            loading={scanning}
            disabled={scanning || !selectedFarmId}
            title={!selectedFarmId ? 'Select a farm first' : 'Scan last 7 days for out-of-range readings'}
          >
            <Radar size={14} className="mr-1" />
            Scan last 7 days
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleMarkAllRead}
            loading={markingAll}
            disabled={markingAll || alerts.length === 0}
          >
            <CheckCheck size={14} className="mr-1" />
            Mark all read
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="border border-gray-200 rounded bg-white">
          <EmptyState
            icon={<Bell size={40} className="text-gray-400" />}
            title="No alerts found"
            description={
              filterUnreadOnly
                ? 'You have caught up with all notifications. Switch to "All alerts" to see history.'
                : 'No alerts registered for this farm. Use "Scan last 7 days" to check historical readings.'
            }
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {alerts.map((alert) => {
            const isWarning = alert.level === 'warning';
            return (
              <article
                key={alert._id}
                className={[
                  'border rounded p-4 flex items-start justify-between gap-4 transition-colors',
                  alert.isRead ? 'bg-white border-gray-200' : 'bg-green-50/40 border-green-200 shadow-2xs',
                ].join(' ')}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0">
                    {isWarning ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <AlertTriangle size={13} aria-hidden="true" />
                        Warning
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        <Info size={13} aria-hidden="true" />
                        Notice
                      </span>
                    )}
                  </span>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 text-sm">
                        {alert.farm?.name || 'Farm Alert'}
                      </span>
                      {!alert.isRead && (
                        <span className="w-2 h-2 rounded-full bg-green-700" title="Unread" />
                      )}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{alert.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDateTime(alert.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!alert.isRead && (
                    <button
                      onClick={() => handleMarkOneRead(alert._id)}
                      className="p-1.5 text-gray-500 hover:text-green-900 focus-ring rounded"
                      title="Mark as read"
                      aria-label="Mark alert as read"
                    >
                      <CheckCircle size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteAlertTarget(alert)}
                    className="p-1.5 text-gray-400 hover:text-red-700 focus-ring rounded"
                    title="Delete alert"
                    aria-label="Delete alert"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteAlertTarget}
        onClose={() => !deleting && setDeleteAlertTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete alert?"
        message="Are you sure you want to dismiss and delete this notification?"
        confirmLabel="Delete alert"
        confirmVariant="primary"
        loading={deleting}
      />
    </AppShell>
  );
}
