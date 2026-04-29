import { useState } from 'react';
import { addEvent, type AppEvent } from '../lib/api';

interface AddEventModalProps {
  show: boolean;
  onClose: () => void;
  onEventAdded: (event: AppEvent) => void;
}

const EVENT_TYPES = [
  { value: 'period', label: '👩🏻 מחזור' },
  { value: 'spot', label: '🔴 כתם' },
  { value: 'birth', label: '👶 לידה' },
];

export default function AddEventModal({ show, onClose, onEventAdded }: AddEventModalProps) {
  const [type, setType] = useState('period');
  const [gregorianDate, setGregorianDate] = useState('');
  const [hebrewDate, setHebrewDate] = useState('');
  const [dayOrNight, setDayOrNight] = useState('day');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!show) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!gregorianDate) {
      setError('יש להזין תאריך');
      return;
    }

    setLoading(true);
    try {
      const result = await addEvent({
        type,
        gregorianDate,
        hebrewDate: hebrewDate || undefined,
        dayOrNight,
        notes: notes || undefined,
      });
      onEventAdded(result.event);
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'שגיאה בהוספת האירוע');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setType('period');
    setGregorianDate('');
    setHebrewDate('');
    setDayOrNight('day');
    setNotes('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">הוספת אירוע</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">סוג אירוע</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {EVENT_TYPES.map(et => (
                <option key={et.value} value={et.value}>{et.label}</option>
              ))}
            </select>
          </div>

          {/* Gregorian Date */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">תאריך לועזי</label>
            <input
              type="date"
              value={gregorianDate}
              onChange={e => setGregorianDate(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Hebrew Date */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">תאריך עברי (אופציונלי)</label>
            <input
              type="text"
              value={hebrewDate}
              onChange={e => setHebrewDate(e.target.value)}
              placeholder="למשל: כ״ח אייר תשפ״ו"
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Day/Night */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">שעה</label>
            <select
              value={dayOrNight}
              onChange={e => setDayOrNight(e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="day">☀️ יום</option>
              <option value="night">🌙 לילה</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">הערות</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'מוסיף...' : 'הוסף אירוע'}
          </button>
        </form>
      </div>
    </div>
  );
}
