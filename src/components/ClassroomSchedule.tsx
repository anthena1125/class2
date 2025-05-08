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
    selectedDate,
    selectedStartTime,
    selectedEndTime,
  } = useStore();

  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [weekReservations, setWeekReservations] = useState<Record<string, any[]>>({});
  const [localSelectedDate, setLocalSelectedDate] = useState<Date | null>(null);
  const [localStartTime, setLocalStartTime] = useState<string | null>(null);
  const [localEndTime, setLocalEndTime] = useState<string | null>(null);

  // 전역 상태와 로컬 상태 동기화 (편집 모드 지원)
  useEffect(() => {
    if (selectedDate && selectedStartTime && selectedEndTime) {
      setLocalSelectedDate(selectedDate);
      setLocalStartTime(selectedStartTime);
      setLocalEndTime(selectedEndTime);
      setCurrentWeek(startOfWeek(selectedDate, { weekStartsOn: 1 })); // 선택된 날짜의 주로 이동
    }
  }, [selectedDate, selectedStartTime, selectedEndTime]);

  // 주간 예약 정보 가져오기
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
        console.log('Week reservations updated:', Object.keys(newWeekReservations));
      };
      fetchWeekReservations();
    }
  }, [currentWeek, selectedClassroom]);

  // 상태 업데이트 로그
  useEffect(() => {
    console.log(`State updated - Local Start: ${localStartTime}, End: ${localEndTime}`);
  }, [localStartTime, localEndTime]);

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
    const isSameDate = localSelectedDate && format(localSelectedDate, 'yyyy-MM-dd') === dateStr;

    console.log(`Clicked: ${timeStr} on ${dateStr}`);

    if (!localStartTime) {
      // 첫 클릭: 1시간 단위 설정
      if (!isTimeSlotAvailable(date, hour)) {
        alert('선택할 수 없는 시간입니다.');
        return;
      }
      const endTimeStr = `${(hour + 1).toString().padStart(2, '0')}:00`;
      setLocalSelectedDate(date);
      setLocalStartTime(timeStr);
      setLocalEndTime(endTimeStr);
      setSelectedDate(date);
      setReservationTimes(timeStr, endTimeStr);
      console.log(`1-hour selected: ${timeStr} - ${endTimeStr}`);
    } else if (isSameDate) {
      const startHour = parseInt(localStartTime.split(':')[0]);
      const currentEndHour = parseInt(localEndTime.split(':')[0]);
      const duration = currentEndHour - startHour;
      const isWithinSelection = hour >= startHour && hour < currentEndHour;

      console.log(`Current selection: ${localStartTime} - ${localEndTime}, Duration: ${duration}`);

      if (isWithinSelection) {
        // 선택된 시간대 클릭: 취소
        setLocalStartTime(null);
        setLocalEndTime(null);
        setLocalSelectedDate(null);
        clearReservationTimes();
        console.log('Selection cleared');
        return;
      }

      if (hour === currentEndHour && duration < 2) {
        // 다음 시간대 클릭: 2시간으로 확장
        if (!isTimeSlotAvailable(date, hour)) {
          alert('선택할 수 없는 시간입니다.');
          return;
        }
        const newEndTimeStr = `${(hour + 1).toString().padStart(2, '0')}:00`;
        setLocalEndTime(newEndTimeStr);
        setReservationTimes(localStartTime, newEndTimeStr);
        console.log(`Extended to 2-hour: ${localStartTime} - ${newEndTimeStr}`);
      } else if (hour !== startHour) {
        // 다른 시간대 클릭: 새 1시간 설정
        if (!isTimeSlotAvailable(date, hour)) {
          alert('선택할 수 없는 시간입니다.');
          return;
        }
        const newEndTimeStr = `${(hour + 1).toString().padStart(2, '0')}:00`;
        setLocalStartTime(timeStr);
        setLocalEndTime(newEndTimeStr);
        setReservationTimes(timeStr, newEndTimeStr);
        console.log(`Reset to new 1-hour: ${timeStr} - ${newEndTimeStr}`);
      }
    } else {
      // 다른 날짜 클릭: 새 1시간 설정
      if (!isTimeSlotAvailable(date, hour)) {
        alert('선택할 수 없는 시간입니다.');
        return;
      }
      const endTimeStr = `${(hour + 1).toString().padStart(2, '0')}:00`;
      setLocalSelectedDate(date);
      setLocalStartTime(timeStr);
      setLocalEndTime(endTimeStr);
      setSelectedDate(date);
      setReservationTimes(timeStr, endTimeStr);
      console.log(`New 1-hour selected: ${timeStr} - ${endTimeStr}`);
    }
  };

  const isTimeSlotSelected = (date: Date, hour: number) => {
    if (!localStartTime || !localSelectedDate) return false;

    const dateStr = format(date, 'yyyy-MM-dd');
    const selectedDateStr = format(localSelectedDate, 'yyyy-MM-dd');
    if (dateStr !== selectedDateStr) return false;

    const startHour = parseInt(localStartTime.split(':')[0]);
    const endHour = localEndTime ? parseInt(localEndTime.split(':')[0]) : startHour + 1;

    const isSelected = hour >= startHour && hour < endHour;
    console.log(`Checking ${dateStr} ${hour}:00 - Start: ${startHour}, End: ${endHour}, Selected: ${isSelected}`);
    return isSelected;
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
                          ${isSelected ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
                          ${isAvailable && !regularClass && !reservation && !isSelected ? 'bg-green-100 hover:bg-green-200' : ''}
                          ${!isAvailable && !regularClass && !reservation && !isSelected ? 'bg-gray-100 cursor-not-allowed' : ''}
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
        <p>• 첫 번째 클릭: 1시간 단위 선택 (예: 12:00 → 12:00-13:00)</p>
        <p>• 두 번째 클릭: 다음 시간대로 확장 (최대 2시간, 예: 13:00 → 12:00-14:00)</p>
        <p>• 선택된 시간대를 클릭하면 취소됩니다.</p>
      </div>
    </div>
  );
};