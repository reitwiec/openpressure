import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

function HistoryGraph({ userId, bodyPartId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState('stress'); // 'stress' | 'grams'

  useEffect(() => {
    loadData();
  }, [userId, bodyPartId]);

  const loadData = async () => {
    if (!window.electronAPI || !userId || !bodyPartId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const sessions = await window.electronAPI.session.getAllForGraph({ userId, bodyPartId });
    
    // Format data for the chart
    const chartData = sessions.map((s, index) => ({
      name: new Date(s.created).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      fullDate: new Date(s.created).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      avgGrams: s.avgGrams,
      avgStress: s.avgStress,
      notes: s.notes,
      sessionNum: index + 1,
    }));
    
    setData(chartData);
    setLoading(false);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-slate-300 text-sm font-medium mb-1">{d.fullDate}</p>
          <p className="text-white font-bold mono-nums">
            {metric === 'stress' 
              ? `${d.avgStress.toFixed(3)} g/mm²`
              : `${d.avgGrams.toFixed(2)} g`
            }
          </p>
          {d.notes && (
            <p className="text-slate-400 text-xs mt-1 max-w-[200px] truncate">{d.notes}</p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-slate-400">Loading history...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
            <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-300 mb-2">No History Yet</h3>
          <p className="text-slate-500 max-w-md">
            Complete sessions with all 5 readings to see your pressure trends over time.
          </p>
        </div>
      </div>
    );
  }

  const minValue = Math.min(...data.map(d => metric === 'stress' ? d.avgStress : d.avgGrams));
  const maxValue = Math.max(...data.map(d => metric === 'stress' ? d.avgStress : d.avgGrams));
  const padding = (maxValue - minValue) * 0.1 || 1;

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Pressure History</h2>
          <p className="text-slate-400 text-sm">
            Average readings across {data.length} completed session{data.length > 1 ? 's' : ''}
          </p>
        </div>
        
        {/* Metric toggle */}
        <div className="flex bg-slate-800/50 rounded-lg p-1">
          <button
            onClick={() => setMetric('stress')}
            className={`px-4 py-1.5 text-sm rounded-md transition-all ${
              metric === 'stress'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Stress (g/mm²)
          </button>
          <button
            onClick={() => setMetric('grams')}
            className={`px-4 py-1.5 text-sm rounded-md transition-all ${
              metric === 'grams'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Weight (g)
          </button>
        </div>
      </div>

      {/* Main chart */}
      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/30 mb-6">
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="name" 
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis 
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={{ stroke: '#334155' }}
              domain={[minValue - padding, maxValue + padding]}
              tickFormatter={(val) => metric === 'stress' ? val.toFixed(2) : val.toFixed(1)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey={metric === 'stress' ? 'avgStress' : 'avgGrams'}
              stroke="#22c55e"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorValue)"
              dot={{ fill: '#22c55e', strokeWidth: 0, r: 4 }}
              activeDot={{ fill: '#4ade80', strokeWidth: 0, r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Latest</div>
          <div className="text-2xl font-bold text-white mono-nums">
            {metric === 'stress' 
              ? data[data.length - 1].avgStress.toFixed(3)
              : data[data.length - 1].avgGrams.toFixed(2)
            }
          </div>
          <div className="text-slate-500 text-sm">{metric === 'stress' ? 'g/mm²' : 'g'}</div>
        </div>
        
        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Average</div>
          <div className="text-2xl font-bold text-white mono-nums">
            {metric === 'stress'
              ? (data.reduce((s, d) => s + d.avgStress, 0) / data.length).toFixed(3)
              : (data.reduce((s, d) => s + d.avgGrams, 0) / data.length).toFixed(2)
            }
          </div>
          <div className="text-slate-500 text-sm">{metric === 'stress' ? 'g/mm²' : 'g'}</div>
        </div>
        
        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Min</div>
          <div className="text-2xl font-bold text-white mono-nums">
            {metric === 'stress'
              ? Math.min(...data.map(d => d.avgStress)).toFixed(3)
              : Math.min(...data.map(d => d.avgGrams)).toFixed(2)
            }
          </div>
          <div className="text-slate-500 text-sm">{metric === 'stress' ? 'g/mm²' : 'g'}</div>
        </div>
        
        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Max</div>
          <div className="text-2xl font-bold text-white mono-nums">
            {metric === 'stress'
              ? Math.max(...data.map(d => d.avgStress)).toFixed(3)
              : Math.max(...data.map(d => d.avgGrams)).toFixed(2)
            }
          </div>
          <div className="text-slate-500 text-sm">{metric === 'stress' ? 'g/mm²' : 'g'}</div>
        </div>
      </div>

      {/* Session list */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
          All Sessions
        </h3>
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/30">
                <th className="text-left text-xs text-slate-400 font-medium uppercase tracking-wider px-4 py-3">#</th>
                <th className="text-left text-xs text-slate-400 font-medium uppercase tracking-wider px-4 py-3">Date</th>
                <th className="text-right text-xs text-slate-400 font-medium uppercase tracking-wider px-4 py-3">Avg Weight</th>
                <th className="text-right text-xs text-slate-400 font-medium uppercase tracking-wider px-4 py-3">Avg Stress</th>
                <th className="text-left text-xs text-slate-400 font-medium uppercase tracking-wider px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {data.slice().reverse().map((row, i) => (
                <tr key={i} className="border-b border-slate-700/20 last:border-0 hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-slate-500 text-sm">{data.length - i}</td>
                  <td className="px-4 py-3 text-slate-200 text-sm">{row.fullDate}</td>
                  <td className="px-4 py-3 text-right text-white mono-nums">{row.avgGrams.toFixed(2)} g</td>
                  <td className="px-4 py-3 text-right text-white mono-nums">{row.avgStress.toFixed(3)} g/mm²</td>
                  <td className="px-4 py-3 text-slate-400 text-sm truncate max-w-[200px]">{row.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default HistoryGraph;
