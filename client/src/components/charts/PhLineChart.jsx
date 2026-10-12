// src/components/charts/PhLineChart.jsx
// LineChart displaying soil pH readings over time with suitable range ReferenceArea,
// custom diamond markers for out-of-range points, green-only palette, and accessible table toggle.

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
  CartesianGrid,
} from 'recharts';
import { formatDateTime } from '../../utils/format';
import { TableContainer, Th, Td } from '../ui/Table';
import Button from '../ui/Button';
import { Table, LineChart as ChartIcon } from 'lucide-react';

/**
 * Custom Dot for LineChart:
 * Normal points use standard green dots; out-of-range points use hollow diamond.
 */
function CustomPhDot(props) {
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;

  const isOutOfRange = payload.status === 'too_acidic' || payload.status === 'too_alkaline';

  if (isOutOfRange) {
    // Hollow diamond marker
    const size = 6;
    return (
      <polygon
        points={`${cx},${cy - size} ${cx + size},${cy} ${cx},${cy + size} ${cx - size},${cy}`}
        fill="#ffffff"
        stroke="#14532d"
        strokeWidth={2}
      />
    );
  }

  // Suitable / standard point: solid green dot
  return (
    <circle
      cx={cx}
      cy={cy}
      r={3.5}
      fill="#14532d"
      stroke="#ffffff"
      strokeWidth={1.5}
    />
  );
}

/**
 * Custom Tooltip with value, time, source, and evaluated status.
 */
function CustomPhTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const statusLabel =
    data.status === 'suitable'
      ? 'Suitable'
      : data.status === 'too_acidic'
      ? 'Too acidic'
      : data.status === 'too_alkaline'
      ? 'Too alkaline'
      : 'Unrated';

  return (
    <div className="bg-white border border-gray-200 shadow-md rounded p-3 text-xs flex flex-col gap-1 z-50">
      <p className="font-semibold text-green-900 font-serif text-sm">
        pH {Number(data.value).toFixed(2)}
      </p>
      <p className="text-gray-600">
        <span className="font-medium text-gray-700">Status:</span> {statusLabel}
      </p>
      <p className="text-gray-500">
        <span className="font-medium text-gray-700">Time:</span> {formatDateTime(data.recordedAt)}
      </p>
      <p className="text-gray-400 capitalize">
        <span className="font-medium text-gray-700">Source:</span> {data.source || 'sensor'}
      </p>
    </div>
  );
}

export default function PhLineChart({
  readings = [],
  range = null, // { min, max, cropName }
  height = 320,
  compact = false,
}) {
  const [showTable, setShowTable] = useState(false);

  // Format data points for recharts
  const chartData = readings.map((r) => ({
    ...r,
    formattedDate: new Date(r.recordedAt).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    }),
  }));

  const hasRange = range && typeof range.min === 'number' && typeof range.max === 'number';

  return (
    <div className="flex flex-col gap-3">
      {/* Table / Chart Toggle */}
      {!compact && readings.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowTable(!showTable)}
            className="text-xs"
          >
            {showTable ? (
              <>
                <ChartIcon size={14} className="mr-1" /> View as chart
              </>
            ) : (
              <>
                <Table size={14} className="mr-1" /> View as data table
              </>
            )}
          </Button>
        </div>
      )}

      {showTable ? (
        <TableContainer className="max-h-80 overflow-y-auto">
          <thead>
            <tr>
              <Th>Date & Time</Th>
              <Th>pH Value</Th>
              <Th>Status</Th>
              <Th>Device / Source</Th>
            </tr>
          </thead>
          <tbody>
            {readings.map((r) => (
              <tr key={r._id}>
                <Td>{formatDateTime(r.recordedAt)}</Td>
                <Td className="font-semibold text-green-900">{Number(r.value).toFixed(2)}</Td>
                <Td className="capitalize">{r.status?.replace('_', ' ') || '—'}</Td>
                <Td className="text-gray-500 capitalize">{r.device?.name || r.source || 'sensor'}</Td>
              </tr>
            ))}
          </tbody>
        </TableContainer>
      ) : (
        <div style={{ width: '100%', height }}>
          {readings.length === 0 ? (
            <div className="h-full flex items-center justify-center border border-dashed border-gray-200 rounded text-sm text-gray-400">
              No pH readings recorded for this interval.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />
                <XAxis
                  dataKey="formattedDate"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  domain={[3, 10]}
                  ticks={[3, 4, 5, 6, 7, 8, 9, 10]}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip content={<CustomPhTooltip />} />

                {/* Shaded suitable range */}
                {hasRange && (
                  <ReferenceArea
                    y1={range.min}
                    y2={range.max}
                    fill="#dcfce7"
                    fillOpacity={0.65}
                    label={{
                      value: `Suitable range (${range.min} - ${range.max})`,
                      position: 'insideTopRight',
                      fill: '#15803d',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  />
                )}

                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#166534"
                  strokeWidth={2}
                  dot={<CustomPhDot />}
                  activeDot={{ r: 6, fill: '#14532d', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Visually hidden accessible data table for screen readers when chart is active */}
      {!showTable && readings.length > 0 && (
        <div className="sr-only">
          <table>
            <caption>Soil pH readings history table</caption>
            <thead>
              <tr>
                <th>Date</th>
                <th>pH Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {readings.map((r) => (
                <tr key={r._id}>
                  <td>{formatDateTime(r.recordedAt)}</td>
                  <td>{r.value}</td>
                  <td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
