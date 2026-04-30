import { useState } from 'react';
import { X, Calendar as CalendarIcon } from 'lucide-react';
import { getHebcalMonth } from '../lib/calendarService';

interface AddEventModalProps {
  onClose: () => void;
  onAdd: (data: { type: string; gregorianDate: string; hebrewDate: string; dayOrNight: string }) => void;
}

// Hebrew month names
const hebrewMonths = [
  'ניסן', 'אייר', 'סיוון', 'תמוז', 'אב', 'אלול',
  'תשרי', 'חשוון', 'כסלו', 'טבת', 'שבט', 'אדר',
];

// Days in Hebrew
const hebrewDayNames = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י',
  'יא', 'יב', 'יג', 'יד', 'טו', 'טז', 'יז', 'יח', 'יט', 'כ',
  'כא', 'כב', 'כג', 'כד', 'כה', 'כו', 'כז', 'כח', 'כט', 'ל'];

function gregorianToHebrewSimple(gy: number, gm: number, gd: number): string {
  // Approximate Hebrew date — for the calendar picker display
  // Uses @hebcal/core logic: Hebrew date mapping
  const y = gy - 3760;
  const m = gm + 6; // Approximate offset
  return `${gd} ${hebrewMonths[(m % 12) || 0]} ${y}`;
}

export default function AddEventModal({ onClose, onAdd }: AddEventModalProps) {
  const [eventType, setEventType] = useState('period');
  const [showHebcalPicker, setShowHebcalPicker] = useState(false);
  const [hebrewMonth, setHebrewMonth] = useState('');
  const [hebrewDay, setHebrewDay] = useState('');
  const [hebrewYear, setHebrewYear] = useState('');
  const [dayOrNight, setDayOrNight] = useState<'day' | 'night'>('day');
  const [gregorianDate, setGregorianDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  // Hebrew calendar picker state
  const [hcYear, setHcYear] = useState(5786);
  const [hcMonth, setHcMonth] = useState(8); // Iyyar
  const [hcDays, setHcDays] = useState<{ day: number; hebrew: string; gregorian: string }[]>([]);

  // Build Hebrew calendar days when month changes
  const loadHebcalMonth = (hy: number, hm: number) => {
    setLoading(true);
    // Approximate gregorian month for this hebrew month
    const gregYear = hy + 3760;
    const gregMonth = ((hm - 6 + 12) % 12) + 1;

    fetch(`https://www.hebcal.com/hebcal?v=1&cfg=json&year=${gregYear}&month=${gregMonth}&geonameid=281184&maj=on&min=on&nx=on`)
      .then(r => r.json())
      .then(data => {
        // Map hebcal items to days
        const daysMap = new Map();
        for (const item of data.items || []) {
          const date = item.date.slice(0, 10);
          if (item.hdate) {
            const parts = item.hdate.split(' ');
            const dayHeb = parts[0];
            if (!daysMap.has(date) && dayHeb) {
              daysMap.set(date, { day: parseInt(date.split('-')[2]), hebrew: dayHeb, gregorian: date });
            }
          }
        }
        setHcDays([...daysMap.values()].sort((a, b) => a.gregorian.localeCompare(b.gregorian)));
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  const openHebcalPicker = () => {
    setShowHebcalPicker(true);
    loadHebcalMonth(hcYear, hcMonth);
  };

  const selectHebrewDate = (gregDate: string) => {
    setGregorianDate(gregDate);
    // Parse hebrew from the selected day
    const day = hcDays.find(d => d.gregorian === gregDate);
    if (day) {
      setHebrewDay(day.hebrew);
      setHebrewMonth(hebrewMonths[hcMonth - 1] || '');
      setHebrewYear(String(hcYear));
    }
    setShowHebcalPicker(false);
  };

  const handleSubmit = () => {
    onAdd({
      type: eventType,
      gregorianDate,
      hebrewDate: `${hebrewDay} ${hebrewMonth} ${hebrewYear}`.trim(),
      dayOrNight,
    });
  };

  // Navigation for Hebrew calendar
  const hcPrevMonth = () => {
    if (hcMonth === 1) { setHcYear(y => y - 1); setHcMonth(12); }
    else { setHcMonth(m => m - 1); }
    setTimeout(() => loadHebcalMonth(hcMonth === 1 ? hcYear - 1 : hcYear, hcMonth === 1 ? 12 : hcMonth - 1), 0);
  };
  const hcNextMonth = () => {
    if (hcMonth === 12) { setHcYear(y => y + 1); setHcMonth(1); }
    else { setHcMonth(m => m + 1); }
    setTimeout(() => loadHebcalMonth(hcMonth === 12 ? hcYear + 1 : hcYear, hcMonth === 12 ? 1 : hcMonth + 1), 0);
  };

  const eventTypes = [
    { value: 'period', label: '🩸 הגעת מחזור' },
    { value: 'spot', label: '🔴 כתם' },
    { value: 'birth', label: '👶 לידה' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">הוספת ארוע</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Event Type Dropdown */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">סוג ארוע</label>
          <select
            value={eventType}
            onChange={e => setEventType(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {eventTypes.map(et => (
              <option key={et.value} value={et.value}>{et.label}</option>
            ))}
          </select>
        </div>

        {/* Hebrew Date Input */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">תאריך עברי</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={`${hebrewDay} ${hebrewMonth} ${hebrewYear}`.trim()}
              readOnly
              placeholder="בחר תאריך מלוח השנה"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-700"
            />
            <button
              onClick={openHebcalPicker}
              className="px-3 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
              title="פתח לוח שנה עברי"
            >
              <CalendarIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Hebrew Calendar Picker Popup */}
        {showHebcalPicker && (
          <div className="mb-4 border border-gray-200 rounded-lg p-3 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <button onClick={hcPrevMonth} className="text-sm px-2 py-1 hover:bg-gray-200 rounded">◀</button>
              <span className="text-sm font-bold">{hebrewMonths[hcMonth - 1]} {hcYear}</span>
              <button onClick={hcNextMonth} className="text-sm px-2 py-1 hover:bg-gray-200 rounded">▶</button>
            </div>
            {loading ? (
              <div className="text-center py-4 text-sm text-gray-500">טוען...</div>
            ) : (
              <div className="grid grid-cols-7 gap-0.5 text-center">
                {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map(d => (
                  <div key={d} className="text-xs text-gray-500 py-1">{d}</div>
                ))}
                {hcDays.map((d, i) => {
                  const dayOfWeek = new Date(d.gregorian).getDay();
                  const offset = i === 0 ? dayOfWeek : 0;
                  const emptyCells = i === 0 ? Array.from({ length: offset }, (_, j) => <div key={`e${j}`} />) : [];
                  return (
                    <>
                      {emptyCells}
                      <button
                        key={d.gregorian}
                        onClick={() => selectHebrewDate(d.gregorian)}
                        className={`text-xs py-1.5 rounded hover:bg-blue-100 ${
                          d.gregorian === gregorianDate ? 'bg-blue-600 text-white hover:bg-blue-700' : ''
                        }`}
                      >
                        {d.hebrew}
                      </button>
                    </>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Day/Night Selector */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">זמן הארוע</label>
          <div className="flex gap-2">
            <button
              onClick={() => setDayOrNight('day')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border ${
                dayOrNight === 'day'
                  ? 'bg-yellow-50 text-yellow-800 border-yellow-300'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              ☀️ יום
            </button>
            <button
              onClick={() => setDayOrNight('night')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border ${
                dayOrNight === 'night'
                  ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              🌙 לילה
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!gregorianDate}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          הוספה
        </button>
      </div>
    </div>
  );
}
