import { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon, Plus, Settings, X } from 'lucide-react';
import {
  getCalendar, getLocations, getMe, getEvents, getAdminSettings, type Location, type User,
} from './lib/api';
import type { AppEvent } from './lib/api';
import { fetchHebcalMonth, buildCalendarDays, type CalendarDay as HebcalDay } from './lib/calendarService';
import AuthModal from './components/AuthModal';
import VesetCalc from './components/VesetCalc';
import AddEventModal from './components/AddEventModal';
import EventDetailModal from './components/EventDetailModal';
import AdminDashboard from './components/AdminDashboard';
import './index.css';

// ==================== Helpers ====================

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

function getEventTypeLabel(type: string): string {
  switch (type) {
    case 'period': return '👩🏻 מחזור';
    case 'spot': return '🔴 כתם';
    case 'birth': return '👶 לידה';
    case 'prediction': return '🔮 תחזית';
    default: return '📅';
  }
}

function getEventTypeStyle(type: string): string {
  switch (type) {
    case 'period': return 'bg-red-100 text-red-800 border-red-200';
    case 'spot': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'birth': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'prediction': return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

// ==================== App ====================

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [showVeset, setShowVeset] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [eventsByDate, setEventsByDate] = useState<Record<string, AppEvent[]>>({});

  const todayDate = getTodayDateStr();

  // Restore auth on mount
  useEffect(() => {
    const token = localStorage.getItem('prisha_token');
    if (token) {
      getMe()
        .then(data => {
          setUser(data.user);
          checkAdmin();
        })
        .catch(() => localStorage.removeItem('prisha_token'));
    }
  }, []);

  const checkAdmin = async () => {
    try {
      await getAdminSettings();
      setIsAdmin(true);
    } catch {
      setIsAdmin(false);
    }
  };

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
        const firstItem = hebcalData.items?.find((item: any) => item.hebrew);
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

  const loadEvents = useCallback(async () => {
    if (!user || !backendOnline) return;
    try {
      const data = await getEvents(year, month, true);
      setEvents(data.events);
      // Index by date
      const byDate: Record<string, AppEvent[]> = {};
      for (const ev of data.events) {
        if (!byDate[ev.gregorian_date]) byDate[ev.gregorian_date] = [];
        byDate[ev.gregorian_date].push(ev);
      }
      setEventsByDate(byDate);
    } catch {
      // Silent — events are non-critical
    }
  }, [user, backendOnline, year, month]);

  useEffect(() => { loadCalendar(); }, [loadCalendar]);
  useEffect(() => { loadEvents(); }, [loadEvents]);

  useEffect(() => {
    if (monthData) {
      const todayDay = monthData.days.find(d => d.gregorian === todayDate);
      setTodayZmanim(todayDay?.zmanim || null);
    }
  }, [monthData, todayDate]);

  const nextMonth = () => { if (month === 12) { setYear(y => y + 1); setMonth(1); } else { setMonth(m => m + 1); } };
  const prevMonth = () => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else { setMonth(m => m - 1); } };
  const goToToday = () => { const n = new Date(); setYear(n.getFullYear()); setMonth(n.getMonth() + 1); };

  const handleEventAdded = (event: AppEvent) => {
    setEvents(prev => [...prev, event]);
    loadEvents(); // Refresh to get new predictions
  };

  const handleEventClick = (dayEvents: AppEvent[]) => {
    if (dayEvents.length > 0) {
      setSelectedEvent(dayEvents[dayEvents.length - 1]); // Show latest event
      setShowEventDetail(true);
    }
  };

  const currentMonth = monthData?.hebrewMonth || '';
  const currentYear = monthData?.hebrewYear || '';
  const days = monthData?.days || [];

  const firstDayOfWeek = days.length > 0 ? new Date(days[0].gregorian).getDay() : 0;
  const gridDays: (DayData | null)[] = Array.from({ length: firstDayOfWeek }, () => null);
  for (const day of days) gridDays.push(day);
  while (gridDays.length < 35) gridDays.push(null);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* ========== HEADER ========== */}
      <Header
        user={user}
        isAdmin={isAdmin}
        showVeset={showVeset}
        onToggleVeset={() => setShowVeset(!showVeset)}
        onOpenAdmin={() => setShowAdmin(true)}
        onAuthChange={(u) => { setUser(u); if (u) checkAdmin(); else setIsAdmin(false); }}
      />

      <div className="max-w-7xl mx-auto p-4">
        {/* ========== CALENDAR CONTROLS ========== */}
        <CalendarControls
          month={month}
          year={year}
          currentMonth={currentMonth}
          currentYear={currentYear}
          locations={locations}
          selectedLocation={selectedLocation}
          onPrev={prevMonth}
          onNext={nextMonth}
          onToday={goToToday}
          onLocationChange={setSelectedLocation}
        />

        {/* ========== ZMANIM BAR ========== */}
        {todayZmanim && backendOnline && (
          <ZmanimBar zmanim={todayZmanim} />
        )}

        {/* ========== VESET CALC ========== */}
        {showVeset && (
          <div className="mb-4">
            <VesetCalc />
          </div>
        )}

        {/* ========== CALENDAR GRID ========== */}
        <CalendarGrid
          loading={loading}
          gridDays={gridDays}
          todayDate={todayDate}
          eventsByDate={eventsByDate}
          onDayClick={(day) => {
            if (day) handleEventClick(eventsByDate[day.gregorian] || []);
          }}
        />
      </div>

      {/* ========== FAB - Add Event ========== */}
      {user && (
        <button
          onClick={() => setShowAddEvent(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center z-40 transition-transform hover:scale-110"
          title="הוסף אירוע"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* ========== MODALS ========== */}
      <AddEventModal
        show={showAddEvent}
        onClose={() => setShowAddEvent(false)}
        onEventAdded={handleEventAdded}
      />
      <EventDetailModal
        event={selectedEvent}
        show={showEventDetail}
        onClose={() => setShowEventDetail(false)}
        onDeleted={loadEvents}
      />
      <AdminDashboard
        show={showAdmin}
        onClose={() => setShowAdmin(false)}
      />
    </div>
  );
}

// ==================== Sub-Components ====================

function Header({ user, isAdmin, showVeset, onToggleVeset, onOpenAdmin, onAuthChange }: {
  user: User | null;
  isAdmin: boolean;
  showVeset: boolean;
  onToggleVeset: () => void;
  onOpenAdmin: () => void;
  onAuthChange: (u: User | null) => void;
}) {
  return (
    <header className="border-b bg-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-gray-800">פרישה</span>
          {isAdmin && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">👑 admin</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleVeset}
            className={`text-sm border rounded-md px-3 py-1.5 transition-colors ${
              showVeset ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            ימי עונה
          </button>
          {isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="text-sm border rounded-md px-3 py-1.5 text-gray-600 border-gray-200 hover:bg-gray-50 flex items-center gap-1"
            >
              <Settings className="w-4 h-4" />
              ניהול
            </button>
          )}
          <AuthModal user={user} onAuthChange={onAuthChange} />
        </div>
      </div>
    </header>
  );
}

function CalendarControls({ month, year, currentMonth, currentYear, locations, selectedLocation, onPrev, onNext, onToday, onLocationChange }: {
  month: number;
  year: number;
  currentMonth: string;
  currentYear: string;
  locations: Location[];
  selectedLocation: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onLocationChange: (id: string) => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-md p-1">
        <button onClick={onPrev} className="h-7 w-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600" aria-label="חודש קודם">
          <ChevronRight className="w-4 h-4" />
        </button>
        <button onClick={onToday} className="h-7 px-3 text-sm font-semibold text-gray-700 rounded hover:bg-gray-100">היום</button>
        <button onClick={onNext} className="h-7 w-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600" aria-label="חודש הבא">
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
        onChange={e => onLocationChange(e.target.value)}
        className="text-sm border border-gray-200 rounded-md px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {locations.map(loc => (
          <option key={loc.id} value={loc.id}>{loc.name}</option>
        ))}
      </select>
    </div>
  );
}

function ZmanimBar({ zmanim }: { zmanim: Record<string, string | null> }) {
  const items = [
    { key: 'alot', label: 'עלות' },
    { key: 'sunrise', label: 'הנץ' },
    { key: 'sofZman', label: 'סוף ק״ש' },
    { key: 'mincha', label: 'מנחה גדולה' },
    { key: 'sunset', label: 'שקיעה' },
    { key: 'tzeit', label: 'צא״כ' },
  ];

  return (
    <div className="mb-4 bg-white border border-gray-200 rounded-lg p-3">
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-700">
        {items.map(item => (
          <span key={item.key}>
            <strong>{item.label}:</strong> {zmanim[item.key] || '—'}
          </span>
        ))}
      </div>
    </div>
  );
}

function CalendarGrid({ loading, gridDays, todayDate, eventsByDate, onDayClick }: {
  loading: boolean;
  gridDays: (DayData | null)[];
  todayDate: string;
  eventsByDate: Record<string, AppEvent[]>;
  onDayClick: (day: DayData | null) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {Array.from({ length: 7 * 5 }).map((_, i) => (
            <div key={i} className="bg-white min-h-[100px] animate-pulse">
              <div className="p-2">
                <div className="w-5 h-5 bg-gray-200 rounded-full mb-2" />
                <div className="w-12 h-2 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-7 bg-white border border-gray-200 rounded-t-lg overflow-hidden">
        {weekDaysFull.map(day => (
          <div key={day} className="py-3 text-center text-sm font-semibold text-gray-500 border-l last:border-l-0">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 bg-gray-200 gap-px border border-gray-200 border-t-0 rounded-b-lg overflow-hidden">
        {gridDays.map((day, idx) => {
          if (!day) return <div key={idx} className="bg-white min-h-[100px]" />;
          const isToday = day.gregorian === todayDate;
          const dayNum = parseInt(day.gregorian.split('-')[2], 10);
          const dayEvents = eventsByDate[day.gregorian] || [];

          // Build display events
          const holEvents = day.holidays.map(h => ({ type: 'holiday', title: h }));
          if (day.parsha) holEvents.push({ type: 'parsha', title: day.parsha });
          if (day.candleLighting) holEvents.push({ type: 'candles', title: day.candleLighting });
          if (day.havdalah) holEvents.push({ type: 'havdalah', title: day.havdalah });

          return (
            <div
              key={idx}
              className={`bg-white flex flex-col overflow-hidden hover:bg-gray-50 min-h-[100px] cursor-pointer transition-colors ${
                isToday ? 'ring-2 ring-blue-400 ring-inset' : ''
              }`}
              onClick={() => onDayClick(day)}
            >
              <div className="flex justify-between items-start p-2">
                <span className={`text-sm font-semibold flex items-center justify-center w-7 h-7 rounded-full ${
                  isToday ? 'bg-blue-600 text-white' : 'text-gray-800'
                }`}>
                  {day.hebrew ? day.hebrew.split(' ')[0] : dayNum}
                </span>
                <span className="text-xs text-gray-400 pt-1 pr-1">{dayNum}</span>
              </div>
              {/* User events dots */}
              {dayEvents.length > 0 && (
                <div className="flex flex-wrap gap-1 px-1.5 mb-1">
                  {dayEvents.slice(0, 3).map(ev => (
                    <div
                      key={ev.id}
                      className={`text-[10px] px-1.5 py-0.5 rounded-md border leading-tight ${getEventTypeStyle(ev.type)}`}
                      title={getEventTypeLabel(ev.type)}
                    >
                      {getEventTypeLabel(ev.type)}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[10px] text-gray-500">+{dayEvents.length - 3}</span>
                  )}
                </div>
              )}
              {/* Holiday events */}
              <div className="flex-1 px-1.5 pb-1.5 space-y-0.5 overflow-hidden">
                {holEvents.slice(0, 3).map((event, i) => (
                  <div key={i} className={`px-1 py-0.5 text-[11px] leading-tight rounded truncate border ${
                    event.type === 'holiday' ? 'bg-yellow-50 text-yellow-800 border-yellow-100' :
                    event.type === 'parsha' ? 'bg-blue-50 text-blue-800 border-blue-100' :
                    event.type === 'candles' ? 'bg-orange-50 text-orange-800 border-orange-100' :
                    'bg-emerald-50 text-emerald-800 border-emerald-100'
                  }`} title={event.title}>{event.title}</div>
                ))}
                {holEvents.length > 3 && <div className="text-[11px] text-gray-500 px-1">+{holEvents.length - 3} נוספים</div>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
