import { useState } from 'react';
import { calculateVeset } from '../lib/api';
import { calculateAll, type VesetSighting, type VesetPrediction } from '../lib/vesetCalculator';

export default function VesetCalc() {
  const [sightings, setSightings] = useState<string[]>(['']);
  const [predictions, setPredictions] = useState<VesetPrediction[]>([]);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState('');

  const addSighting = () => setSightings(prev => [...prev, '']);
  const removeSighting = (idx: number) => {
    if (sightings.length <= 1) return;
    setSightings(prev => prev.filter((_, i) => i !== idx));
  };
  const updateSighting = (idx: number, val: string) => {
    setSightings(prev => prev.map((d, i) => i === idx ? val : d));
  };

  const handleCalculate = async () => {
    const validDates = sightings.filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d));
    if (validDates.length === 0) {
      setError('יש להזין לפחות תאריך ראייה אחד');
      return;
    }
    setError('');
    setCalculating(true);
    try {
      const data = await calculateVeset(validDates.map(d => ({ date: d })));
      setPredictions(data.predictions);
    } catch {
      // Fallback: client-side calculation
      const results = calculateAll(validDates.map(d => ({ date: d })));
      setPredictions(results);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-bold mb-4">חישוב ימי עונה</h2>

      <div className="space-y-3">
        {sightings.map((s, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              type="date"
              value={s}
              onChange={e => updateSighting(idx, e.target.value)}
              className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {sightings.length > 1 && (
              <button onClick={() => removeSighting(idx)} className="text-red-500 hover:text-red-700 text-sm px-2">
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-4">
        <button onClick={addSighting} className="text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded-md px-4 py-2 hover:bg-blue-50">
          + הוסף תאריך
        </button>
        <button
          onClick={handleCalculate}
          disabled={calculating}
          className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {calculating ? 'מחשב...' : 'חשב ימי עונה'}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

      {predictions.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="font-semibold text-gray-700">תוצאות:</h3>
          {predictions.map((p, idx) => (
            <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-800">
                  {p.type === 'monthly' ? '📅 עונת החודש' : p.type === 'medium' ? '📆 עונה בינונית' : '📊 עונת הפלגה'}
                </span>
                {p.cycleLength && (
                  <span className="text-xs text-gray-500">מחזור: {p.cycleLength} ימים</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-2">{p.description}</p>
              <div className="flex flex-wrap gap-2">
                {p.dates.map((d, di) => (
                  <span key={di} className="bg-white border border-gray-300 rounded-md px-3 py-1 text-sm">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
