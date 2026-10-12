// src/pages/farmer/PestTipsPage.jsx
// Farmer Pest & Disease Tips:
// FarmSelect, prominent API disclaimer banner, per-growing crop sections with common pests and preventive tips.
// Empty state when the farm has no growing plantings.

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import FarmSelect from '../../components/ui/FarmSelect';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import ErrorBlock from '../../components/ui/ErrorBlock';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../api/client';
import * as pestTipsApi from '../../api/pestTips';
import {
  ShieldAlert,
  Bug,
  Sprout,
  AlertCircle,
  Info,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export default function PestTipsPage() {
  const { farms, selectedFarmId } = useFarm();
  const { push } = useToast();

  const [cropTips, setCropTips] = useState([]);
  const [disclaimer, setDisclaimer] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const currentFarm = farms.find((f) => f._id === selectedFarmId);

  const loadPestTips = useCallback(async () => {
    if (!selectedFarmId) {
      setCropTips([]);
      setDisclaimer('');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await pestTipsApi.getPestTips({ farmId: selectedFarmId });
      setDisclaimer(res.disclaimer || 'General guidance only. Confirm with a local agricultural extension officer.');
      setCropTips(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
      setCropTips([]);
    } finally {
      setLoading(false);
    }
  }, [selectedFarmId]);

  useEffect(() => {
    loadPestTips();
  }, [loadPestTips]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Crop Protection & Health"
        title="Pest & Disease Advisory"
        description="Preventive measures, biological controls, and cultural management tailored to the crops currently growing on your farm."
      />

      {/* Farm Selector */}
      <div className="flex items-center gap-3 mb-6">
        <label htmlFor="pest-tips-farm-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
          Farm plot:
        </label>
        <FarmSelect
          id="pest-tips-farm-select"
          className="w-72"
        />
      </div>

      {/* Prominent API Disclaimer Banner */}
      {disclaimer && (
        <div className="border border-green-200 bg-green-50/80 rounded p-4 mb-8 flex items-start gap-3 shadow-2xs">
          <Info size={18} className="text-green-800 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-sm text-green-950 leading-relaxed">
            <span className="font-semibold text-green-900 mr-1">Agronomic Notice:</span>
            {disclaimer}
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6">
          <ErrorBlock error={errorMsg} />
        </div>
      )}

      {!selectedFarmId ? (
        <div className="border border-gray-200 rounded bg-white">
          <EmptyState
            icon={<ShieldAlert size={40} className="text-gray-400" />}
            title="No farm selected"
            description="Select a farm above to view tailored pest management recommendations."
          />
        </div>
      ) : loading ? (
        <div className="py-24 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : cropTips.length === 0 ? (
        <div className="border border-gray-200 rounded bg-white p-6">
          <EmptyState
            icon={<Sprout size={40} className="text-gray-400" />}
            title="No active plantings on this farm"
            description={`"${currentFarm?.name || 'Selected farm'}" currently has no growing crops registered. Pest tips are dynamically tailored to the varieties you cultivate.`}
            actionLabel="Add planting in Crops page"
            actionHref="/app/crops"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {cropTips.map((cropItem) => (
            <section
              key={cropItem.cropName}
              className="border border-gray-200 rounded bg-white p-6 shadow-2xs"
            >
              {/* Crop Section Header */}
              <div className="pb-4 mb-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
                    Crop
                  </span>
                  <h2 className="font-serif text-2xl font-semibold text-green-900 flex items-center gap-2 mt-0.5">
                    <Sprout size={20} className="text-green-800" />
                    {cropItem.cropName}
                  </h2>
                </div>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded">
                  {cropItem.pests.length} {cropItem.pests.length === 1 ? 'pest profile' : 'pest profiles'}
                </span>
              </div>

              {/* Pests List */}
              {cropItem.pests.length === 0 ? (
                <p className="text-xs text-gray-500 italic">
                  No major pests documented for this crop in the current catalog.
                </p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {cropItem.pests.map((pest) => (
                    <article
                      key={pest.name}
                      className="border border-gray-200 rounded p-5 bg-gray-50/50 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Bug size={17} className="text-amber-800 shrink-0" />
                          <h3 className="font-serif text-lg font-semibold text-gray-900">
                            {pest.name}
                          </h3>
                        </div>

                        <ul className="space-y-2 mt-3">
                          {pest.tips.map((tip, idx) => (
                            <li key={idx} className="text-xs text-gray-700 flex items-start gap-2 leading-relaxed">
                              <CheckCircle2 size={13} className="text-green-700 shrink-0 mt-0.5" />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-200/60 text-[11px] text-gray-400">
                        Preventive & cultural control guidelines
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </AppShell>
  );
}
