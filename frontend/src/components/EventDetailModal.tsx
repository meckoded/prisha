import { X } from 'lucide-react';

interface EventDetailProps {
  event: {
    id: number;
    type: string;
    gregorianDate: string;
    hebrewDate: string;
    dayOrNight: string;
    createdBySystem: boolean;
    predictionType?: string;
    notes?: string;
  };
  onClose: () => void;
}

function getEventLabel(type: string): string {
  switch (type) {
    case 'period': return '🩸 מחזור';
    case 'spot': return '🔴 כתם';
    case 'birth': return '👶 לידה';
    case 'prediction': return '📊 תחזית עונה';
    default: return type;
  }
}

function getPredictionLabel(predictionType: string): string {
  switch (predictionType) {
    case 'monthly': return 'עונת החודש';
    case 'medium': return 'עונה בינונית';
    case 'haflaga': return 'עונת הפלגה';
    default: return predictionType;
  }
}

export default function EventDetailModal({ event, onClose }: EventDetailProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{getEventLabel(event.type)}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Type badge */}
          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
              event.createdBySystem
                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {event.createdBySystem ? 'תחזית מערכת' : 'ארוע משתמש'}
            </span>
          </div>

          {/* Prediction Type (if applicable) */}
          {event.createdBySystem && event.predictionType && (
            <div>
              <span className="text-xs text-gray-500 block mb-0.5">סוג תחזית</span>
              <span className="text-sm font-semibold text-gray-800">
                {getPredictionLabel(event.predictionType)}
              </span>
            </div>
          )}

          {/* Gregorian Date */}
          <div>
            <span className="text-xs text-gray-500 block mb-0.5">תאריך לועזי</span>
            <span className="text-sm font-semibold text-gray-800" dir="ltr">{event.gregorianDate}</span>
          </div>

          {/* Hebrew Date */}
          {event.hebrewDate && (
            <div>
              <span className="text-xs text-gray-500 block mb-0.5">תאריך עברי</span>
              <span className="text-sm font-semibold text-gray-800">{event.hebrewDate}</span>
            </div>
          )}

          {/* Day/Night */}
          <div>
            <span className="text-xs text-gray-500 block mb-0.5">זמן הארוע</span>
            <span className="text-sm font-semibold">
              {event.dayOrNight === 'day' ? '☀️ יום' : '🌙 לילה'}
            </span>
          </div>

          {/* Notes */}
          {event.notes && (
            <div>
              <span className="text-xs text-gray-500 block mb-0.5">הערות</span>
              <span className="text-sm text-gray-700">{event.notes}</span>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200"
        >
          סגור
        </button>
      </div>
    </div>
  );
}
