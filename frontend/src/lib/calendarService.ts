// lib/calendarService.ts — Hebcal client‑side fetcher
export interface HebcalItem {
  title: string;
  date: string;
  category: string;
  subcat?: string;
  hebrew?: string;
  memo?: string;
}

export interface HebcalMonth {
  title: string;
  location: {
    title: string;
    city: string;
    tzid: string;
    geonameid: number;
  };
  items: HebcalItem[];
}

export interface CalendarDay {
  hebrewDate: string;
  gregorianDate: string;
  isCurrentMonth: boolean;
  isHoliday?: boolean;
  holidays: string[];
  parsha?: string;
  candleLighting?: string;
  havdalah?: string;
}

export async function fetchHebcalMonth(
  year: number,
  month: number,
  geonameid = 281184 // Jerusalem default
): Promise<HebcalMonth | null> {
  const url = `https://www.hebcal.com/hebcal?v=1&cfg=json&year=${year}&month=${month}&geonameid=${geonameid}&maj=on&min=on&nx=on`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = await resp.json();
    return data;
  } catch {
    return null;
  }
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function buildCalendarDays(
  year: number,
  month: number,
  hebcalMonth: HebcalMonth | null
): CalendarDay[] {
  const daysCount = daysInMonth(year, month);
  const itemsByDate: Record<string, HebcalItem[]> = {};

  if (hebcalMonth && hebcalMonth.items) {
    hebcalMonth.items.forEach(item => {
      const date = item.date.slice(0, 10); // YYYY-MM-DD
      if (!itemsByDate[date]) itemsByDate[date] = [];
      itemsByDate[date].push(item);
    });
  }

  const days: CalendarDay[] = [];
  for (let d = 1; d <= daysCount; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const items = itemsByDate[dateStr] || [];
    const holidays = items
      .filter(item => item.category === 'holiday')
      .map(item => item.title);
    const parsha = items.find(item => item.category === 'parsha')?.title;
    const candle = items.find(item => item.category === 'candles')?.title;
    const havdalah = items.find(item => item.category === 'havdalah')?.title;

    days.push({
      hebrewDate: items.find(item => item.hebrew)?.hebrew || '',
      gregorianDate: dateStr,
      isCurrentMonth: true,
      isHoliday: holidays.length > 0,
      holidays,
      parsha,
      candleLighting: candle,
      havdalah,
    });
  }

  return days;
}
