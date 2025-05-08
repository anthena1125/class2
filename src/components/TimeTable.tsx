import React from 'react';
import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import { Calendar } from 'lucide-react';

export const TimeTable: React.FC = () => {
  const { selectedDate, reservations } = useStore();
  
  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 9; // 9AM to 8PM
    return `${hour}:00`;
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="text-blue-600" />
        <h2 className="text-xl font-semibold">
          Schedule for {format(selectedDate, 'MMMM d, yyyy')}
        </h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2 bg-gray-50">Time</th>
              {Array.from({ length: 7 }, (_, i) => (
                <th key={i} className="border p-2 bg-gray-50">
                  Room {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((time) => (
              <tr key={time}>
                <td className="border p-2 font-medium">{time}</td>
                {Array.from({ length: 7 }, (_, i) => (
                  <td
                    key={i}
                    className="border p-2 hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    {/* Status indicator */}
                    <div className="h-full w-full flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-green-400"></div>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};