import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getFarmForUser } from '../utils/farmAccess.js';

// In-memory weather cache (10 minutes TTL)
const weatherCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

// @desc    Get current weather and 5-day forecast
// @route   GET /api/weather
// @access  Protected
export const getWeather = asyncHandler(async (req, res, next) => {
  const { lat, lon, city, farmId } = req.query;

  // Determine location sources
  const hasCoords = lat !== undefined && lon !== undefined;
  const hasCity = Boolean(city && city.trim());
  const hasFarm = Boolean(farmId);

  const sourcesCount = (hasCoords ? 1 : 0) + (hasCity ? 1 : 0) + (hasFarm ? 1 : 0);

  if (sourcesCount !== 1) {
    return next(
      new ApiError(400, 'Please provide exactly one location source: (lat and lon), city, or farmId')
    );
  }

  let targetLat;
  let targetLon;
  let targetCity;
  let cacheKey;

  if (hasCoords) {
    const numLat = Number(lat);
    const numLon = Number(lon);

    if (isNaN(numLat) || numLat < -90 || numLat > 90) {
      return next(new ApiError(400, 'Latitude must be between -90 and 90'));
    }
    if (isNaN(numLon) || numLon < -180 || numLon > 180) {
      return next(new ApiError(400, 'Longitude must be between -180 and 180'));
    }

    targetLat = numLat;
    targetLon = numLon;
    cacheKey = `coord:${Math.round(targetLat * 100) / 100},${Math.round(targetLon * 100) / 100}`;
  } else if (hasCity) {
    targetCity = city.trim();
    cacheKey = `city:${targetCity.toLowerCase()}`;
  } else if (hasFarm) {
    const farm = await getFarmForUser(req.user, farmId, { write: false });

    if (!farm.location || farm.location.lat == null || farm.location.lng == null) {
      return next(new ApiError(400, 'Farm does not have valid coordinates configured'));
    }

    targetLat = farm.location.lat;
    targetLon = farm.location.lng;
    cacheKey = `coord:${Math.round(targetLat * 100) / 100},${Math.round(targetLon * 100) / 100}`;
  }

  // Check cache
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return res.status(200).json({
      success: true,
      data: cached.data,
    });
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return next(new ApiError(503, 'Weather service is not configured'));
  }

  // Build query params
  const params = new URLSearchParams({
    units: 'metric',
    appid: apiKey.trim(),
  });

  if (targetCity) {
    params.set('q', targetCity);
  } else {
    params.set('lat', String(targetLat));
    params.set('lon', String(targetLon));
  }

  const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?${params.toString()}`;
  const forecastWeatherUrl = `https://api.openweathermap.org/data/2.5/forecast?${params.toString()}`;

  let currentRes;
  let forecastRes;

  try {
    [currentRes, forecastRes] = await Promise.all([
      fetch(currentWeatherUrl, { signal: AbortSignal.timeout(8000) }),
      fetch(forecastWeatherUrl, { signal: AbortSignal.timeout(8000) }),
    ]);
  } catch (err) {
    // Never echo URL in error to protect secret API key
    return next(new ApiError(504, 'Weather service is not reachable'));
  }

  if (currentRes.status === 401 || forecastRes.status === 401) {
    return next(
      new ApiError(502, 'Weather provider rejected the request (the API key may not be active yet)')
    );
  }

  if (currentRes.status === 404 || forecastRes.status === 404) {
    return next(new ApiError(404, 'Location not found'));
  }

  if (!currentRes.ok || !forecastRes.ok) {
    return next(new ApiError(504, 'Weather service is not reachable'));
  }

  const currentData = await currentRes.json();
  const forecastData = await forecastRes.json();

  const tzOffsetSeconds = forecastData.city?.timezone || 0;

  // Group forecast 3-hour blocks by local date
  const dailyMap = new Map();
  for (const item of forecastData.list || []) {
    const localDate = new Date((item.dt + tzOffsetSeconds) * 1000).toISOString().split('T')[0];
    if (!dailyMap.has(localDate)) {
      dailyMap.set(localDate, []);
    }
    dailyMap.get(localDate).push(item);
  }

  const forecast = Array.from(dailyMap.entries())
    .slice(0, 5)
    .map(([date, items]) => {
      const tempMin = Math.round(Math.min(...items.map((i) => i.main.temp_min)) * 10) / 10;
      const tempMax = Math.round(Math.max(...items.map((i) => i.main.temp_max)) * 10) / 10;
      const rainProbability = Math.round(Math.max(...items.map((i) => i.pop || 0)) * 100) / 100;
      const rainMm = Math.round(items.reduce((sum, i) => sum + (i.rain?.['3h'] || 0), 0) * 10) / 10;

      const representative = items[Math.floor(items.length / 2)] || items[0];
      const icon = representative.weather?.[0]?.icon || '01d';
      const description = representative.weather?.[0]?.description || '';

      return {
        date,
        tempMin,
        tempMax,
        rainProbability,
        rainMm,
        description,
        icon,
        iconUrl: `https://openweathermap.org/img/wn/${icon}@2x.png`,
      };
    });

  // Generate agronomic weather tips
  const tips = [];
  let allDry = forecast.length > 0;

  for (const day of forecast) {
    if (day.rainProbability >= 0.7) {
      tips.push(
        `High chance of rain on ${day.date}: consider delaying planting or harvest and check field drainage`
      );
    }
    if (day.rainMm >= 20) {
      tips.push(`Heavy rain possible on ${day.date}`);
    }
    if (day.tempMax >= 35) {
      tips.push(`Very hot on ${day.date}: crops may need extra water`);
    }
    if (day.rainProbability >= 0.2) {
      allDry = false;
    }
  }

  if (allDry && forecast.length > 0) {
    tips.push('Dry period ahead: plan irrigation');
  }

  const weatherData = {
    location: {
      name: currentData.name || forecastData.city?.name || 'Unknown',
      country: currentData.sys?.country || forecastData.city?.country || '',
      lat: currentData.coord?.lat ?? targetLat,
      lon: currentData.coord?.lon ?? targetLon,
    },
    current: {
      temp: currentData.main?.temp,
      feelsLike: currentData.main?.feels_like,
      humidity: currentData.main?.humidity,
      windSpeed: currentData.wind?.speed,
      pressure: currentData.main?.pressure,
      description: currentData.weather?.[0]?.description,
      icon: currentData.weather?.[0]?.icon,
      iconUrl: `https://openweathermap.org/img/wn/${currentData.weather?.[0]?.icon}@2x.png`,
      rain1h: currentData.rain?.['1h'] || 0,
    },
    forecast,
    tips,
  };

  // Cache response for 10 minutes
  weatherCache.set(cacheKey, {
    data: weatherData,
    timestamp: Date.now(),
  });

  res.status(200).json({
    success: true,
    data: weatherData,
  });
});
