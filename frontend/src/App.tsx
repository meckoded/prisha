import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon } from 'lucide-react';
import { fetchHebcalMonth, buildCalendarDays, type CalendarDay } from './lib/calendarService';
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

function getDayNumber(dateStr: string): number {
  return parseInt(dateStr.split('-')[2], 10);
}

export default function App() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(4);
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [hebrewMonth, setHebrewMonth] = useState('ניסן');
  const [hebrewYear, setHebrewYear] = useState('תשפ״ו');
  const [loading, setLoading] = useState(true);

  const todayDate = getTodayDateStr();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const hebcal = await fetchHebcalMonth(year, month, 281184);
        if (hebcal) {
          const firstItem = hebcal.items?.find(item => item.hebrew);
          if (firstItem?.hebrew) {
            const parts = firstItem.hebrew.split(' ');
            if (parts.length >= 3) {
              setHebrewMonth(parts[1]);
              setHebrewYear(parts[2]);
            }
          }
          const calendarDays = buildCalendarDays(year, month, hebcal);
          setDays(calendarDays);
        }
      } catch (err) {
        console.error('Failed to load calendar:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [year, month]);

  const nextMonth = () => {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  };

  const prevMonth = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  };

  // Fill 7x5 grid
  const gridDays: (CalendarDay | null)[] = [];
  for (let i = 0; i < 35; i++) {
    gridDays[i] = i < days.length ? days[i] : null;
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 font-sans text-gray-900 p-4">
      <header className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-md p-1">
              <button
                onClick={prevMonth}
                className="h-7 w-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button className="h-7 px-3 text-sm font-semibold text-gray-700 rounded hover:bg-gray-100">
                היום
              </button>
              <button
                onClick={nextMonth}
                className="h-7 w-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-blue-600" />
              {hebrewMonth} {hebrewYear}
              <span className="text-base font-normal text-gray-500">
                {getMonthName(month)} {year}
              </span>
            </h1>
          </div>
          <div className="text-sm text-gray-600">לוח שנה עברי עם אירועים</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center py-16 text-gray-500">טוען לוח שנה...</div>
        ) : (
          <>
            {/* Days of week header */}
            <div className="grid grid-cols-7 bg-white border border-gray-200 rounded-t-lg">
              {weekDaysFull.map((day) => (
                <div key={day} className="py-3 text-center text-sm font-semibold text-gray-500 border-l last:border-l-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 grid-rows-5 bg-gray-200 gap-px border border-gray-200 rounded-b-lg overflow-hidden">
              {gridDays.map((day, idx) => {
                if (!day) return <div key={idx} className="bg-white" />;

                const isToday = day.gregorianDate === todayDate;
                const dayNum = getDayNumber(day.gregorianDate);
                const events = [
                  ...day.holidays.map(h => ({ type: 'holiday', title: h })),
                  ...(day.parsha ? [{ type: 'parsha', title: day.parsha }] : []),
                  ...(day.candleLighting ? [{ type: 'candles', title: day.candleLighting }] : []),
                  ...(day.havdalah ? [{ type: 'havdalah', title: day.havdalah }] : []),
                ];

                return (
                  <div
                    key={idx}
                    className="bg-white flex flex-col overflow-hidden hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start p-2">
                      <span className={`text-sm font-semibold flex items-center justify-center w-7 h-7 rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-800'}`}>
                        {day.hebrewDate || dayNum}
                      </span>
                      <span className="text-xs text-gray-400 pt-1 pr-1">{dayNum}</span>
                    </div>
                    <div className="flex-1 px-1.5 pb-1.5 space-y-1">
                      {events.slice(0, 3).map((event, i) => (
                        <div
                          key={i}
                          className={`px-1.5 py-1 text-xs rounded truncate border ${
                            event.type === 'holiday' ? 'bg-yellow-50 text-yellow-800 border-yellow-100' :
                            event.type === 'parsha' ? 'bg-blue-50 text-blue-800 border-blue-100' :
                            event.type === 'candles' ? 'bg-orange-50 text-orange-800 border-orange-100' :
                            'bg-emerald-50 text-emerald-800 border-emerald-100'
                          }`}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                      {events.length > 3 && (
                        <div className="text-xs text-gray-500 px-1">
                          +{events.length - 3} נוספים
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      <footer className="max-w-7xl mx-auto mt-8 py-4 text-center text-gray-500 text-sm">
        לוח שנה עברי ומעקב וסת — https://prisha-app.netlify.app
      </footer>
    </div>
  );
}
