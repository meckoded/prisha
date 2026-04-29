import { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon } from 'lucide-react';
import { getCalendar, getLocations, getMe, type Location, type User } from './lib/api';
import { fetchHebcalMonth, buildCalendarDays, type CalendarDay as HebcalDay } from './lib/calendarService';
import AuthModal from './components/AuthModal';
import VesetCalc from './components/VesetCalc';
import './index.css';

const weekDaysFull = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

function getMonthName(month: number): string {
  const names = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  return names[month - 1] || '';
}

function getTodayDateStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface DayData {
  gregorian: string;
  hebrew: string;
  parsha: string | null;
  zmanim: { alot: string | null; sunrise: string | null; sofZman: string | null; mincha: string | null; sunset: string | null; tzeit: string | null } | null;
  holidays: string[];
  candleLighting: string | null;
  havdalah: string | null;
}

interface MonthData {
  year: number;
  month: number;
  hebrewMonth: string;
  hebrewYear: string;
  days: DayData[];
  location: { id: string; name: string };
}

function hebcalDayToDayData(d: HebcalDay): DayData {
  return {
    gregorian: d.gregorianDate,
    hebrew: d.hebrewDate,
    parsha: d.parsha || null,
    zmanim: null,
    holidays: d.holidays || [],
    candleLighting: d.candleLighting || null,
    havdalah: d.havdalah || null,
  };
}

export default function App() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [monthData, setMonthData] = useState<MonthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('281184');
  const [todayZmanim, setTodayZmanim] = useState<Record<string, string | null> | null>(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showVeset, setShowVeset] = useState(false);

  const todayDate = getTodayDateStr();

  // Restore auth on mount
  useEffect(() => {
    const token = localStorage.getItem('prisha_token');
    if (token) {
      getMe()
        .then(data => setUser(data.user))
        .catch(() => localStorage.removeItem('prisha_token'));
    }
  }, []);

  useEffect(() => {
    getLocations()
      .then(locs => { setLocations(locs); setBackendOnline(true); })
      .catch(() => {
        setLocations([
          { id: '281184', name: 'ירושלים' } as Location,
          { id: '293397', name: 'תל אביב' } as Location,
        ]);
      });
  }, []);

  const loadCalendar = useCallback(async () => {
    setLoading(true);
    try {
      if (backendOnline) {
        const data = await getCalendar(year, month, selectedLocation);
        setMonthData(data as unknown as MonthData);
      } else {
        throw new Error('Backend offline');
      }
    } catch {
      const hebcalData = await fetchHebcalMonth(year, month, parseInt(selectedLocation));
      if (hebcalData) {
        const firstItem = hebcalData.items?.find(item => item.hebrew);
        const parts = firstItem?.hebrew?.split(' ') || [];
        const calendarDays = buildCalendarDays(year, month, hebcalData);
        setMonthData({
          year, month,
          hebrewMonth: parts[1] || '',
          hebrewYear: parts[2] || '',
          days: calendarDays.map(hebcalDayToDayData),
          location: { id: selectedLocation, name: locations.find(l => l.id === selectedLocation)?.name || '' },
        });
      } else {
        setMonthData(null);
      }
    } finally {
      setLoading(false);
    }
  }, [year, month, selectedLocation, backendOnline, locations]);

  useEffect(() => { loadCalendar(); }, [loadCalendar]);

  useEffect(() => {
    if (monthData) {
      const todayDay = monthData.days.find(d => d.gregorian === todayDate);
      setTodayZmanim(todayDay?.zmanim || null);
    }
  }, [monthData, todayDate]);

  const nextMonth = () => { if (month === 12) { setYear(y => y + 1); setMonth(1); } else { setMonth(m => m + 1); } };
  const prevMonth = () => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else { setMonth(m => m - 1); } };
  const goToToday = () => { const n = new Date(); setYear(n.getFullYear()); setMonth(n.getMonth() + 1); };

  const currentMonth = monthData?.hebrewMonth || '';
  const currentYear = monthData?.hebrewYear || '';
  const days = monthData?.days || [];

  const firstDayOfWeek = days.length > 0 ? new Date(days[0].gregorian).getDay() : 0;
  const gridDays: (DayData | null)[] = Array.from({ length: firstDayOfWeek }, () => null);
  for (const day of days) gridDays.push(day);
  while (gridDays.length < 35) gridDays.push(null);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-gray-800">פרישה</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowVeset(!showVeset)}
              className={`text-sm border rounded-md px-3 py-1.5 ${showVeset ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              ימי עונה
            </button>
            <AuthModal user={user} onAuthChange={setUser} />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        {/* Calendar Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-md p-1">
            <button onClick={prevMonth} className="h-7 w-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600" aria-label="חודש קודם">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={goToToday} className="h-7 px-3 text-sm font-semibold text-gray-700 rounded hover:bg-gray-100">היום</button>
            <button onClick={nextMonth} className="h-7 w-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600" aria-label="חודש הבא">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {currentMonth} {currentYear}
            <span className="text-base font-normal text-gray-500">
              {getMonthName(month)} {year}
            </span>
          </h1>
          <select
            value={selectedLocation}
            onChange={e => setSelectedLocation(e.target.value)}
            className="text-sm border border-gray-200 rounded-md px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>

        {/* Today's Zmanim Bar */}
        {todayZmanim && backendOnline && (
          <div className="mb-4 bg-white border border-gray-200 rounded-lg p-3 flex flex-wrap gap-4 text-sm text-gray-700">
            <span><strong>עלות:</strong> {todayZmanim.alot}</span>
            <span><strong>הנץ:</strong> {todayZmanim.sunrise}</span>
            <span><strong>סוף ק"ש:</strong> {todayZmanim.sofZman}</span>
            <span><strong>מנחה גדולה:</strong> {todayZmanim.mincha}</span>
            <span><strong>שקיעה:</strong> {todayZmanim.sunset}</span>
            <span><strong>צא"כ:</strong> {todayZmanim.tzeit}</span>
          </div>
        )}

        {/* Veset Calculator */}
        {showVeset && (
          <div className="mb-4">
            <VesetCalc />
          </div>
        )}

        {/* Calendar */}
        {loading ? (
          <div className="text-center py-16 text-gray-500">טוען לוח שנה...</div>
        ) : (
          <>
            <div className="grid grid-cols-7 bg-white border border-gray-200 rounded-t-lg">
              {weekDaysFull.map(day => (
                <div key={day} className="py-3 text-center text-sm font-semibold text-gray-500 border-l last:border-l-0">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 bg-gray-200 gap-px border border-gray-200 rounded-b-lg overflow-hidden">
              {gridDays.map((day, idx) => {
                if (!day) return <div key={idx} className="bg-white min-h-[100px]" />;
                const isToday = day.gregorian === todayDate;
                const dayNum = parseInt(day.gregorian.split('-')[2], 10);
                const events: { type: string; title: string }[] = [];
                day.holidays.forEach(h => events.push({ type: 'holiday', title: h }));
                if (day.parsha) events.push({ type: 'parsha', title: day.parsha });
                if (day.candleLighting) events.push({ type: 'candles', title: day.candleLighting });
                if (day.havdalah) events.push({ type: 'havdalah', title: day.havdalah });

                return (
                  <div key={idx} className={`bg-white flex flex-col overflow-hidden hover:bg-gray-50 min-h-[100px] ${isToday ? 'ring-2 ring-blue-400 ring-inset' : ''}`}>
                    <div className="flex justify-between items-start p-2">
                      <span className={`text-sm font-semibold flex items-center justify-center w-7 h-7 rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-800'}`}>
                        {day.hebrew ? day.hebrew.split(' ')[0] : dayNum}
                      </span>
                      <span className="text-xs text-gray-400 pt-1 pr-1">{dayNum}</span>
                    </div>
                    <div className="flex-1 px-1.5 pb-1.5 space-y-0.5 overflow-hidden">
                      {events.slice(0, 3).map((event, i) => (
                        <div key={i} className={`px-1 py-0.5 text-[11px] leading-tight rounded truncate border ${
                          event.type === 'holiday' ? 'bg-yellow-50 text-yellow-800 border-yellow-100' :
                          event.type === 'parsha' ? 'bg-blue-50 text-blue-800 border-blue-100' :
                          event.type === 'candles' ? 'bg-orange-50 text-orange-800 border-orange-100' :
                          'bg-emerald-50 text-emerald-800 border-emerald-100'
                        }`} title={event.title}>{event.title}</div>
                      ))}
                      {events.length > 3 && <div className="text-[11px] text-gray-500 px-1">+{events.length - 3} נוספים</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
