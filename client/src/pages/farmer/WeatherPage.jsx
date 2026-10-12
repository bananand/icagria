// src/pages/farmer/WeatherPage.jsx
// Farmer Weather Forecast: coordinates/farmId query, city search, current conditions,
// 5-day forecast cards, agronomic tips, and mapped HTTP error status handling.

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import FarmSelect from '../../components/ui/FarmSelect';
import StatCard from '../../components/ui/StatCard';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import ErrorBlock from '../../components/ui/ErrorBlock';
import Spinner from '../../components/ui/Spinner';
import Card from '../../components/ui/Card';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/format';
import * as weatherApi from '../../api/weather';
import {
  CloudSun,
  Search,
  Wind,
  Droplets,
  Gauge,
  Thermometer,
  CloudRain,
  MapPin,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';

export default function WeatherPage() {
  const { farms, selectedFarmId } = useFarm();
  const { push } = useToast();

  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');

  // Search by city
  const [cityInput, setCityInput] = useState('');
  const [activeCityQuery, setActiveCityQuery] = useState('');

  const currentFarm = farms.find((f) => f._id === selectedFarmId);
  const hasCoordinates =
    currentFarm?.location?.lat != null && currentFarm?.location?.lng != null;

  const mapWeatherError = (err) => {
    const status = err?.response?.status;
    if (status === 503) {
      return 'Weather service is not configured on the server.';
    }
    if (status === 502) {
      return 'The weather provider rejected the request. The API key may not be active yet.';
    }
    if (status === 504) {
      return 'The weather service is not reachable. Try again later.';
    }
    if (status === 404) {
      return 'Location not found.';
    }
    return err?.response?.data?.message || 'Failed to fetch weather data.';
  };

  const loadWeather = useCallback(async () => {
    setWeatherError('');

    // If searching by city
    if (activeCityQuery.trim()) {
      setLoading(true);
      try {
        const data = await weatherApi.getWeather({ city: activeCityQuery.trim() });
        setWeatherData(data);
      } catch (err) {
        setWeatherError(mapWeatherError(err));
        setWeatherData(null);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Otherwise use selected farm coordinates
    if (!selectedFarmId) {
      setWeatherData(null);
      return;
    }

    if (!hasCoordinates) {
      setWeatherData(null);
      return;
    }

    setLoading(true);
    try {
      const data = await weatherApi.getWeather({ farmId: selectedFarmId });
      setWeatherData(data);
    } catch (err) {
      setWeatherError(mapWeatherError(err));
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  }, [activeCityQuery, selectedFarmId, hasCoordinates]);

  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  const handleCitySearch = (e) => {
    e.preventDefault();
    if (!cityInput.trim()) return;
    setActiveCityQuery(cityInput.trim());
  };

  const handleResetToFarm = () => {
    setCityInput('');
    setActiveCityQuery('');
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Forecast & Agronomy"
        title="Weather Forecast"
        description="Local meteorology, 5-day rain probabilities, and field planning advisories."
      />

      {/* Controls Bar: FarmSelect and City Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <label htmlFor="weather-farm-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Farm location:
          </label>
          <FarmSelect
            id="weather-farm-select"
            className="w-72"
            onChange={(id) => {
              setActiveCityQuery('');
              setCityInput('');
            }}
          />
        </div>

        {/* City Search Form */}
        <form onSubmit={handleCitySearch} className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" aria-hidden="true" />
            <input
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder="Or search by city name..."
              className="pl-9 pr-3 py-2 border border-gray-300 rounded text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-700 w-64"
            />
          </div>
          <Button variant="secondary" type="submit" size="md">
            Search
          </Button>
          {activeCityQuery && (
            <Button variant="text" size="sm" onClick={handleResetToFarm}>
              Use farm coordinates
            </Button>
          )}
        </form>
      </div>

      {/* Farm missing coordinates alert */}
      {!activeCityQuery && selectedFarmId && !hasCoordinates && (
        <div className="border border-amber-200 bg-amber-50/70 rounded p-4 mb-6 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-800 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Farm coordinates missing</p>
            <p className="text-xs text-amber-800 mt-0.5">
              "{currentFarm?.name}" does not have latitude and longitude recorded.{' '}
              <Link to="/app/farms" className="underline font-medium hover:text-green-900">
                Edit farm in Farms page to capture GPS coordinates →
              </Link>{' '}
              Alternatively, use the city search above.
            </p>
          </div>
        </div>
      )}

      {weatherError && (
        <div className="mb-6">
          <ErrorBlock error={weatherError} />
        </div>
      )}

      {loading ? (
        <div className="py-24 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : !weatherData ? (
        <div className="border border-gray-200 rounded bg-white">
          <EmptyState
            icon={<CloudSun size={40} className="text-gray-400" />}
            title="Weather unavailable"
            description={
              !selectedFarmId
                ? 'Select a farm to view local meteorological conditions.'
                : 'Enter a city name above or add latitude and longitude to your farm.'
            }
          />
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Current Conditions Block */}
          <section className="border border-gray-200 bg-white rounded p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
              <div>
                <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Current Observation</span>
                <h2 className="font-serif text-2xl font-semibold text-gray-900 flex items-center gap-2 mt-0.5">
                  <MapPin size={20} className="text-green-700" />
                  {weatherData.location?.name}
                  {weatherData.location?.country ? `, ${weatherData.location.country}` : ''}
                </h2>
              </div>
              <div className="text-xs text-gray-500 font-mono">
                {weatherData.location?.lat != null && weatherData.location?.lon != null && (
                  <span>
                    {Number(weatherData.location.lat).toFixed(4)}°, {Number(weatherData.location.lon).toFixed(4)}°
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
              {/* Primary Temp & Icon */}
              <div className="flex items-center gap-4">
                {weatherData.current?.iconUrl && (
                  <img
                    src={weatherData.current.iconUrl}
                    alt={weatherData.current.description || 'Weather condition'}
                    className="w-16 h-16 shrink-0 bg-green-50 rounded-full p-1"
                  />
                )}
                <div>
                  <span className="font-serif text-4xl font-bold text-green-900">
                    {weatherData.current?.temp != null ? `${Math.round(weatherData.current.temp)}°C` : '—'}
                  </span>
                  <p className="text-xs text-gray-500 capitalize mt-0.5">
                    {weatherData.current?.description || 'Current condition'}
                  </p>
                  {weatherData.current?.feelsLike != null && (
                    <p className="text-[11px] text-gray-400">
                      Feels like {Math.round(weatherData.current.feelsLike)}°C
                    </p>
                  )}
                </div>
              </div>

              {/* Stat 1: Humidity */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-100">
                <Droplets size={20} className="text-blue-700 shrink-0" />
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">Humidity</p>
                  <p className="font-semibold text-gray-900 text-sm">
                    {weatherData.current?.humidity != null ? `${weatherData.current.humidity}%` : '—'}
                  </p>
                </div>
              </div>

              {/* Stat 2: Wind Speed */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-100">
                <Wind size={20} className="text-green-800 shrink-0" />
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">Wind Speed</p>
                  <p className="font-semibold text-gray-900 text-sm">
                    {weatherData.current?.windSpeed != null ? `${weatherData.current.windSpeed} m/s` : '—'}
                  </p>
                </div>
              </div>

              {/* Stat 3: Pressure & Rain 1h */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-100">
                <Gauge size={20} className="text-gray-600 shrink-0" />
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">Barometric Pressure</p>
                  <p className="font-semibold text-gray-900 text-sm">
                    {weatherData.current?.pressure != null ? `${weatherData.current.pressure} hPa` : '—'}
                  </p>
                  {weatherData.current?.rain1h > 0 && (
                    <p className="text-[11px] text-blue-700 font-medium">
                      Rain last 1h: {weatherData.current.rain1h} mm
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 5-Day Forecast Cards */}
          <section>
            <div className="mb-4">
              <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Extended Outlook</p>
              <h3 className="font-serif text-2xl font-semibold text-gray-900 mt-0.5">5-Day Daily Forecast</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {weatherData.forecast?.map((day) => {
                const rainPct = Math.round((day.rainProbability || 0) * 100);
                return (
                  <article key={day.date} className="border border-gray-200 bg-white rounded p-4 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-900">
                        {formatDate(day.date)}
                      </p>
                      <div className="my-2 flex items-center justify-between">
                        {day.iconUrl && (
                          <img
                            src={day.iconUrl}
                            alt={day.description}
                            className="w-12 h-12"
                          />
                        )}
                        <div className="text-right">
                          <p className="font-serif font-bold text-lg text-green-900">
                            {day.tempMax}°
                          </p>
                          <p className="text-xs text-gray-400">
                            min {day.tempMin}°
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 capitalize leading-snug">
                        {day.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-blue-700">
                        <CloudRain size={14} />
                        <span>{rainPct}%</span>
                      </div>
                      <span className="text-gray-400 font-mono">
                        {day.rainMm > 0 ? `${day.rainMm} mm` : '0 mm'}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Agronomic Farming Tips */}
          {weatherData.tips && weatherData.tips.length > 0 && (
            <section className="border border-green-200 bg-green-50/60 rounded p-5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={18} className="text-green-800" />
                <h3 className="font-serif text-lg font-semibold text-green-900">
                  Field & Crop Advisories
                </h3>
              </div>
              <ul className="space-y-2">
                {weatherData.tips.map((tip, idx) => (
                  <li key={idx} className="text-sm text-green-950 flex items-start gap-2">
                    <span className="text-green-700 shrink-0 font-bold">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </AppShell>
  );
}
