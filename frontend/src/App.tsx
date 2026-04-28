import React, { useState } from 'react';
import { 
 ChevronRight, 
 ChevronLeft, 
 Calendar as CalendarIcon, 
 Settings, 
 Plus,
 LayoutDashboard,
 Users,
 MessageSquare,
 Search
} from 'lucide-react';

// --- Utility for Tailwind Classes ---
const cn = (...classes) => classes.filter(Boolean).join(' ');

// --- Mock Data (Nissan 5786 / March-April 2026) ---
// הוספנו אירועים לחלק מהימים כדי להדגים את תצוגת התגיות
const mockDays = [
 // חודש קודם (אדר)
 { h: 'כו', g: 15, current: false }, { h: 'כז', g: 16, current: false }, { h: 'כח', g: 17, current: false }, { h: 'כט', g: 18, current: false },
 // חודש נוכחי (ניסן)
 { h: 'א', g: 19, current: true, events: [{ id: 1, title: 'ראש חודש ניסן', type: 'holiday' }, { id: 2, title: 'פגישת הנהלה', type: 'work' }] }, 
 { h: 'ב', g: 20, current: true }, 
 { h: 'ג', g: 21, current: true }, 
 { h: 'ד', g: 22, current: true, events: [{ id: 3, title: 'תור לרופא', type: 'personal' }] }, 
 { h: 'ה', g: 23, current: true }, 
 { h: 'ו', g: 24, current: true }, 
 { h: 'ז', g: 25, current: true },
 { h: 'ח', g: 26, current: true }, 
 { h: 'ט', g: 27, current: true, events: [{ id: 4, title: 'סגירת יעדים', type: 'work' }, { id: 5, title: 'ארוחת צהריים עסקית', type: 'work' }] }, 
 { h: 'י', g: 28, current: true }, 
 { h: 'יא', g: 29, current: true }, 
 { h: 'יב', g: 30, current: true }, 
 { h: 'יג', g: 31, current: true }, 
 { h: 'יד', g: 1, current: true, events: [
 { id: 6, title: 'תענית בכורות', type: 'holiday' }, 
 { id: 7, title: 'סוף זמן אכילת חמץ', type: 'holiday' }, 
 { id: 8, title: 'יציאה לחופשה', type: 'personal' },
 { id: 9, title: 'הכנות אחרונות', type: 'personal' } // אירוע רביעי כדי להדגים הסתרה
 ]},
 { h: 'טו', g: 2, current: true, isHoliday: true, events: [{ id: 10, title: 'פסח - חג ראשון', type: 'primary' }] }, 
 { h: 'טז', g: 3, current: true, isHoliday: true, events: [{ id: 11, title: "א' חול המועד", type: 'holiday' }] }, 
 { h: 'יז', g: 4, current: true }, 
 { h: 'יח', g: 5, current: true, events: [{ id: 12, title: 'טיול משפחתי', type: 'personal' }] }, 
 { h: 'יט', g: 6, current: true }, 
 { h: 'כ', g: 7, current: true }, 
 { h: 'כא', g: 8, current: true, isHoliday: true, events: [{ id: 13, title: 'שביעי של פסח', type: 'primary' }] },
 { h: 'כב', g: 9, current: true }, 
 { h: 'כג', g: 10, current: true }, 
 { h: 'כד', g: 11, current: true, events: [{ id: 14, title: 'חזרה לשגרה', type: 'work' }] }, 
 { h: 'כה', g: 12, current: true }, 
 { h: 'כו', g: 13, current: true }, 
 { h: 'כז', g: 14, current: true }, 
 { h: 'כח', g: 15, current: true },
 { h: 'כט', g: 16, current: true }, 
 { h: 'ל', g: 17, current: true },
 // חודש הבא (אייר)
 { h: 'א', g: 18, current: false }
];

const weekDaysFull = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

// --- UI Components ---
const Button = ({ variant = 'default', size = 'default', className, children, ...props }) => {
 const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50";
 const variants = {
 default: "bg-slate-900 text-slate-50 shadow hover:bg-slate-900/90",
 primary: "bg-blue-600 text-white shadow hover:bg-blue-700",
 outline: "border border-slate-200 bg-transparent hover:bg-slate-50 hover:text-slate-900",
 ghost: "hover:bg-slate-100 hover:text-slate-900 text-slate-600",
 secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200/80"
 };
 const sizes = {
 default: "h-9 px-4 py-2",
 sm: "h-8 rounded-md px-3 text-xs",
 lg: "h-10 rounded-md px-8",
 icon: "h-9 w-9"
 };
 
 return (
 <button className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
 {children}
 </button>
 );
};

export default function App() {
 const [todayIndex] = useState(4); // כביכול היום הוא א' בניסן

 // עוזר לעיצוב סוגי אירועים
 const getEventStyle = (type) => {
 switch (type) {
 case 'primary': return 'bg-blue-600 text-white border-blue-700';
 case 'work': return 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100/80';
 case 'holiday': return 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80';
 case 'personal': return 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100/80';
 default: return 'bg-slate-50 text-slate-700 border-slate-200';
 }
 };

 return (
 <div dir="rtl" className="h-screen w-full bg-[#f8fafc] flex font-sans text-slate-950 overflow-hidden selection:bg-blue-100 selection:text-blue-900">
 
 {/* Sidebar - Navigation & Mini Widget */}
 <aside className="w-64 bg-white border-l border-slate-200 flex flex-col hidden md:flex shrink-0 z-10">
 <div className="p-6">
 <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
 <CalendarIcon className="w-6 h-6 text-blue-600" />
 פרישה
 </h2>
 </div>

 <div className="px-4 pb-6">
 <Button variant="primary" className="w-full justify-start gap-2 shadow-sm text-sm h-11 rounded-lg">
 <Plus className="w-4 h-4" />
 צור אירוע חדש
 </Button>
 </div>

 <nav className="flex-1 px-3 space-y-1">
 <a href="#" className="flex items-center gap-3 px-3 py-2 text-slate-600 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors text-sm font-medium">
 <LayoutDashboard className="w-4 h-4" /> סקירה כללית
 </a>
 <a href="#" className="flex items-center gap-3 px-3 py-2 bg-blue-50 text-blue-700 rounded-md transition-colors text-sm font-medium">
 <CalendarIcon className="w-4 h-4" /> לוח שנה
 </a>
 <a href="#" className="flex items-center gap-3 px-3 py-2 text-slate-600 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors text-sm font-medium">
 <Users className="w-4 h-4" /> אנשי קשר
 </a>
 <a href="#" className="flex items-center gap-3 px-3 py-2 text-slate-600 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors text-sm font-medium">
 <MessageSquare className="w-4 h-4" /> הודעות
 </a>
 </nav>

 <div className="p-4 border-t border-slate-100">
 <a href="#" className="flex items-center gap-3 px-3 py-2 text-slate-600 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors text-sm font-medium">
 <Settings className="w-4 h-4" /> הגדרות
 </a>
 </div>
 </aside>

 {/* Main Content Area */}
 <main className="flex-1 flex flex-col h-full overflow-hidden">
 
 {/* Top Header */}
 <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
 <div className="flex items-center gap-4">
 <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md p-1">
 <Button variant="ghost" size="icon" className="h-7 w-7"><ChevronRight className="w-4 h-4" /></Button>
 <Button variant="ghost" size="sm" className="h-7 font-semibold text-slate-700">היום</Button>
 <Button variant="ghost" size="icon" className="h-7 w-7"><ChevronLeft className="w-4 h-4" /></Button>
 </div>
 <h1 className="text-xl font-semibold text-slate-900 ml-2">
 ניסן תשפ״ו <span className="text-sm font-normal text-slate-500 mr-2">מרץ - אפריל 2026</span>
 </h1>
 </div>

 <div className="flex items-center gap-3">
 <div className="relative">
 <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input 
 type="text" 
 placeholder="חיפוש אירוע..." 
 className="h-9 w-48 pl-3 pr-9 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-shadow bg-slate-50"
 />
 </div>
 <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
 <button className="px-3 py-1.5 text-xs font-medium rounded-md text-slate-600 hover:text-slate-900 transition-colors">יום</button>
 <button className="px-3 py-1.5 text-xs font-medium rounded-md text-slate-600 hover:text-slate-900 transition-colors">שבוע</button>
 <button className="px-3 py-1.5 text-xs font-medium rounded-md bg-white text-slate-900 shadow-sm transition-colors">חודש</button>
 </div>
 </div>
 </header>

 {/* Calendar Grid Container */}
 <div className="flex-1 p-6 overflow-hidden flex flex-col">
 <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
 
 {/* Days Header Row */}
 <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50 shrink-0">
 {weekDaysFull.map((day) => (
 <div key={day} className="py-3 text-center text-xs font-semibold text-slate-500 border-l last:border-l-0 border-slate-200">
 {day}
 </div>
 ))}
 </div>

 {/* Main Grid (1px internal borders via gap and background) */}
 <div className="flex-1 grid grid-cols-7 grid-rows-5 bg-slate-200 gap-[1px]">
 {mockDays.map((day, index) => {
 const isToday = todayIndex === index;
 const events = day.events || [];
 const visibleEvents = events.slice(0, 3);
 const hiddenEventsCount = events.length - 3;

 return (
 <div
 key={index}
 className={cn(
 "bg-white relative flex flex-col group cursor-pointer transition-colors overflow-hidden hover:bg-slate-50/80",
 !day.current && "bg-slate-50/40"
 )}
 >
 {/* Cell Header: Dates */}
 <div className="flex justify-between items-start p-2">
 <span className={cn(
 "text-sm font-semibold flex items-center justify-center w-7 h-7 rounded-full transition-colors", 
 isToday ? "bg-blue-600 text-white shadow-sm" : !day.current ? "text-slate-400" : "text-slate-800"
 )}>
 {day.h}
 </span>
 <span className={cn(
 "text-[11px] font-medium pt-1 pr-1", 
 !day.current ? "text-slate-300" : "text-slate-400"
 )}>
 {day.g}
 </span>
 </div>

 {/* Cell Body: Events Container */}
 <div className="flex-1 flex flex-col gap-[3px] px-1.5 pb-1.5 overflow-hidden">
 {visibleEvents.map((evt) => (
 <div 
 key={evt.id} 
 className={cn(
 "px-1.5 py-1 text-[11px] font-medium rounded-[4px] truncate border",
 getEventStyle(evt.type)
 )}
 title={evt.title}
 >
 {evt.title}
 </div>
 ))}
 
 {/* "+X נוספים" indicator */}
 {hiddenEventsCount > 0 && (
 <div className="text-[10px] font-medium text-slate-500 px-1 mt-0.5 hover:text-slate-800 transition-colors">
 + {hiddenEventsCount} נוספים
 </div>
 )}
 </div>

 </div>
 );
 })}
 </div>

 </div>
 </div>
 </main>

 </div>
 );
}