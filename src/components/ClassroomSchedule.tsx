import React, { useState, useEffect } from 'react';
import { format, addWeeks, subWeeks, startOfWeek, addDays } from 'date-fns';
import { useStore } from '../store/useStore';
import { Calendar, Clock, X, ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS = ['월', '화', '수', '목', '금'];
const TIME_SLOTS = Array.from({ length: 12 }, (_, i) => i + 9);

export const ClassroomSchedule: React.FC = () => {
  const { 
    selectedClassroom, 
    regularClasses, 
    fetchAvailableTimeSlots,
    setSelectedDate,
    setReservationTimes,
    clearReservationTimes,
    selectedStartTime,
    selectedEndTime,
    selectedDate
  } = useStore();

  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [weekReservations, setWeekReservations] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (selectedDate) {
      setCurrentWeek(startOfWeek(selectedDate, { weekStartsOn: 1 }));
    }
  }, [selectedDate]);

  useEffect(() => {
    if (selectedClassroom) {
      const fetchWeekReservations = async () => {
        const newWeekReservations: Record<string, any[]> = {};
        for (let i = 0; i < 5; i++) {
          const date = addDays(currentWeek, i);
          const reservations = await fetchAvailableTimeSlots(selectedClassroom.id, date);
          const dateStr = format(date, 'yyyy-MM-dd');
          newWeekReservations[dateStr] = reservations;
        }
        setWeekReservations(newWeekReservations);
      };
      fetchWeekReservations();
    }
  }, [currentWeek, selectedClassroom]);

  useEffect(() => {
    clearReservationTimes();
  }, [currentWeek]);

  if (!selectedClassroom) return null;

  const handlePreviousWeek = () => {
    setCurrentWeek(prevWeek => subWeeks(prevWeek, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(prevWeek => addWeeks(prevWeek, 1));
  };

  const isTimeSlotAvailable = (date: Date, hour: number) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfWeek = date.getDay();

    const timeSlotDate = new Date(date);
    timeSlotDate.setHours(hour, 0, 0, 0);
    if (timeSlotDate < new Date()) return false;

    const hasRegularClass = regularClasses.some(
      c => c.day_of_week === dayOfWeek &&
      parseInt(c.start_time.split(':')[0]) <= hour &&
      parseInt(c.end_time.split(':')[0]) > hour
    );
    if (hasRegularClass) return false;

    const dayReservations = weekReservations[dateStr] || [];
    const hasReservation = dayReservations.some(r => {
      const reservationDate = new Date(r.start_time);
      return (
        format(reservationDate, 'yyyy-MM-dd') === dateStr &&
        reservationDate.getHours() <= hour &&
        new Date(r.end_time).getHours() > hour
      );
    });
    if (hasReservation) return false;

    return true;
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    const dateStr = format(date, 'yyyy-MM-dd');

    const startHour = selectedStartTime ? parseInt(selectedStartTime.split(':')[0]) : null;
    const isSameDate = selectedDate && format(selectedDate, 'yyyy-MM-dd') === dateStr;
    const isAlreadySelected = isSameDate && startHour === hour;

    if (isAlreadySelected) {
      clearReservationTimes();
      console.log('Selection cleared');
      return;
    }

    if (!isTimeSlotAvailable(date, hour)) {
      alert('선택할 수 없는 시간입니다.');
      return;
    }
    if (!isTimeSlotAvailable(date, hour + 1)) {
      alert('2시간 연속 예약이 불가능합니다.');
      return;
    }

    setSelectedDate(date);
    const endTimeStr = `${(hour + 2).toString().padStart(2, '0')}:00`;
    setReservationTimes(timeStr, endTimeStr);
    console.log(`Selected: ${timeStr} - ${endTimeStr}`);
  };

  const isTimeSlotSelected = (date: Date, hour: number) => {
    if (!selectedStartTime || !selectedDate) return false;

    const dateStr = format(date, 'yyyy-MM-dd');
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    if (dateStr !== selectedDateStr) return false;

    const startHour = parseInt(selectedStartTime.split(':')[0]);
    const endHour = selectedEndTime ? parseInt(selectedEndTime.split(':')[0]) : startHour + 2;

    return hour >= startHour && hour < endHour;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 ClassroomSchedule">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="text-blue-600" />
          <h2 className="text-lg sm:text-xl font-semibold">
            {selectedClassroom.name}
          </h2>
        </div>
        <div className="flex items-center gap-2 justify-between sm:justify-start">
          <button onClick={handlePreviousWeek} className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="이전 주">
            <ChevronLeft size={20} />
          </button>
          <span className="font-medium text-sm sm:text-base">
            {format(currentWeek, 'M.d')} ~ {format(addDays(currentWeek, 4), 'M.d')}
          </span>
          <button onClick={handleNextWeek} className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="다음 주">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="min-w-[600px] px-4 sm:px-0">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2 bg-gray-50 text-sm w-20">시간</th>
                {DAYS.map((day, index) => (
                  <th key={day} className="border p-2 bg-gray-50 w-1/5">
                    <div className="text-sm font-medium">{day}</div>
                    <div className="text-xs text-gray-500">
                      {format(addDays(currentWeek, index), 'M/d')}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map(hour => (
                <tr key={hour}>
                  <td className="border p-2 font-medium text-sm text-center">
                    {hour}:00
                  </td>
                  {DAYS.map((_, dayIndex) => {
                    const currentDate = addDays(currentWeek, dayIndex);
                    const dateStr = format(currentDate, 'yyyy-MM-dd');
                    
                    const regularClass = regularClasses.find(
                      c => c.day_of_week === dayIndex + 1 &&
                      parseInt(c.start_time.split(':')[0]) <= hour &&
                      parseInt(c.end_time.split(':')[0]) > hour
                    );

                    const dayReservations = weekReservations[dateStr] || [];
                    const reservation = dayReservations.find(r => {
                      const reservationDate = new Date(r.start_time);
                      return (
                        format(reservationDate, 'yyyy-MM-dd') === dateStr &&
                        reservationDate.getHours() <= hour &&
                        new Date(r.end_time).getHours() > hour
                      );
                    });

                    const isAvailable = isTimeSlotAvailable(currentDate, hour);
                    const isSelected = isTimeSlotSelected(currentDate, hour);

                    return (
                      <td
                        key={dayIndex}
                        onClick={() => isAvailable && handleTimeSlotClick(currentDate, hour)}
                        className={`
                          border p-1 sm:p-2 relative h-16 cursor-pointer
                          transition-all duration-200 ease-in-out
                          ${regularClass ? 'bg-gray-200 cursor-not-allowed' : ''}
                          ${reservation ? 'bg-red-100 cursor-not-allowed' : ''}
                          ${isSelected ? 'bg-blue-500 text-white hover:bg-blue-600' : ''} // 강한 색상으로 테스트
                          ${!isAvailable && !regularClass && !reservation && !isSelected ? 'bg-gray-100 cursor-not-allowed' : ''}
                          ${isAvailable && !regularClass && !reservation && !isSelected ? 'bg-green-100 hover:bg-green-200' : ''}
                        `}
                      >
                        {regularClass && (
                          <>
                            <div className="text-xs sm:text-sm">
                              <div className="font-medium truncate">{regularClass.name}</div>
                              <div className="text-gray-600">
                                {regularClass.start_time.substring(0, 5)} - 
                                {regularClass.end_time.substring(0, 5)}
                              </div>
                            </div>
                            <X 
                              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-red-500 opacity-50"
                              size={24}
                            />
                          </>
                        )}
                        {reservation && !regularClass && (
                          <div className="text-xs sm:text-sm">
                            <div className="font-medium">예약됨</div>
                            <div className="text-gray-600">
                              {format(new Date(reservation.start_time), 'HH:mm')} - 
                              {format(new Date(reservation.end_time), 'HH:mm')}
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-4 space-y-2 text-sm text-gray-600">
        <p>시간표를 클릭하여 예약 시간을 선택할 수 있습니다.</p>
        <p>• 첫 번째 클릭: 시작 시간 선택 (자동 2시간 블록)</p>
        <p>• 같은 시간대를 다시 클릭하면 선택이 취소됩니다.</p>
      </div>
    </div>
  );
};