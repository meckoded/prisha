import { useState } from 'react';
import { deleteEvent, type AppEvent } from '../lib/api';

interface EventDetailModalProps {
  event: AppEvent | null;
  show: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

const TYPE_BADGE: Record<string, { icon: string; label: string; color: string }> = {
  period: { icon: '👩🏻', label: 'מחזור', color: 'bg-red-100 text-red-800 border-red-200' },
  spot: { icon: '🔴', label: 'כתם', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  birth: { icon: '👶', label: 'לידה', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  prediction: { icon: '🔮', label: 'תחזית', color: 'bg-blue-100 text-blue-800 border-blue-200' },
};

export default function EventDetailModal({ event, show, onClose, onDeleted }: EventDetailModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  if (!show || !event) return null;

  const badge = TYPE_BADGE[event.type] || { icon: '📅', label: event.type, color: 'bg-gray-100 text-gray-800 border-gray-200' };
  const isSystemEvent = event.created_by_system === 1;

  const handleDelete = async () => {
    if (!confirm('האם למחוק אירוע זה?')) return;
    setDeleting(true);
    setError('');
    try {
      await deleteEvent(event.id);
      onDeleted();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'שגיאה במחיקת האירוע');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${badge.color}`}>
              {badge.icon} {badge.label}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">תאריך לועזי:</span>
            <span className="font-semibold text-gray-800">{event.gregorian_date}</span>
          </div>

          {event.hebrew_date && (
            <div className="flex justify-between">
              <span className="text-gray-500">תאריך עברי:</span>
              <span className="font-semibold text-gray-800">{event.hebrew_date}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-gray-500">שעה:</span>
            <span className="font-semibold text-gray-800">
              {event.day_or_night === 'day' ? '☀️ יום' : '🌙 לילה'}
            </span>
          </div>

          {event.prediction_type && (
            <div className="flex justify-between">
              <span className="text-gray-500">סוג תחזית:</span>
              <span className="font-semibold text-gray-800">
                {event.prediction_type === 'monthly' ? '📅 חודש' :
                 event.prediction_type === 'medium' ? '📆 בינונית' :
                 event.prediction_type === 'haflaga' ? '📊 הפלגה' :
                 event.prediction_type}
              </span>
            </div>
          )}

          {event.notes && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-gray-500 mb-1">הערות:</p>
              <p className="text-gray-800">{event.notes}</p>
            </div>
          )}

          {isSystemEvent && (
            <p className="text-xs text-blue-600 bg-blue-50 rounded-md p-2">
              🔮 תחזית אוטומטית — נוצרה ע״י המערכת
            </p>
          )}
        </div>

        {!isSystemEvent && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full text-sm text-red-600 hover:text-red-800 border border-red-200 rounded-md px-3 py-2 hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? 'מוחק...' : '🗑️ מחק אירוע'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
