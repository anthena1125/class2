import React, { useState, useEffect } from 'react';
import { Clock, CalendarDays, Users, FileText, Edit2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { format, addDays, startOfWeek, addMonths, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Reservation } from '../types';

export const ReservationForm: React.FC = () => {
  const { 
    user, 
    selectedClassroom, 
    createReservation, 
    regularClasses,
    updateReservation,
    myReservations,
    setSelectedDate,
    selectedDate,
    selectedStartTime,
    selectedEndTime,
    clearReservationTimes,
    setSelectedClassroom
  } = useStore();

  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '',
    endTime: '',
    purpose: '',
    attendees: '',
  });

  useEffect(() => {
    if (editingReservation) {
      const startDate = new Date(editingReservation.start_time);
      const endDate = new Date(editingReservation.end_time);
      
      setFormData({
        date: format(startDate, 'yyyy-MM-dd'),
        startTime: format(startDate, 'HH:mm'),
        endTime: format(endDate, 'HH:mm'),
        purpose: editingReservation.purpose,
        attendees: editingReservation.purpose.split('참석인원:')[1]?.trim() || '',
      });

      setSelectedDate(startDate);
      clearReservationTimes();
    }
  }, [editingReservation]);

  // Update form when selectedDate or selectedTimes change
  useEffect(() => {
    if (selectedDate && selectedStartTime) {
      setFormData(prev => ({
        ...prev,
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime: selectedStartTime,
        endTime: selectedEndTime || '',
      }));
    }
  }, [selectedDate, selectedStartTime, selectedEndTime]);

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">강의실 예약</h2>
        <p className="text-center text-gray-600">
          강의실을 예약하려면 로그인이 필요합니다
        </p>
      </div>
    );
  }

  if (!selectedClassroom) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">강의실 예약</h2>
        <p className="text-center text-gray-600">
          예약할 강의실을 선택해주세요
        </p>
      </div>
    );
  }

  const today = new Date();
  const monday = startOfWeek(today, { weekStartsOn: 1 });
  const oneMonthLater = addMonths(today, 1);
  
  const availableDates = [];
  let currentDate = monday;
  
  while (currentDate <= oneMonthLater) {
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      availableDates.push({
        date: currentDate,
        label: format(currentDate, 'M월 d일 (eee)', { locale: ko }),
        value: format(currentDate, 'yyyy-MM-dd'),
      });
    }
    currentDate = addDays(currentDate, 1);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.date}T${formData.endTime}`);
    
    try {
      const dayOfWeek = startDateTime.getDay();
      
      const hasConflictingClass = regularClasses.some(regClass => {
        if (regClass.day_of_week !== dayOfWeek) return false;
        
        const classStart = new Date(`${formData.date}T${regClass.start_time}`);
        const classEnd = new Date(`${formData.date}T${regClass.end_time}`);
        
        return (
          (startDateTime >= classStart && startDateTime < classEnd) ||
          (endDateTime > classStart && endDateTime <= classEnd) ||
          (startDateTime <= classStart && endDateTime >= classEnd)
        );
      });

      if (hasConflictingClass) {
        alert('선택하신 시간에 정규 수업이 있어 예약이 불가능합니다.');
        return;
      }

      if (startDateTime >= endDateTime) {
        alert('종료 시간은 시작 시간보다 늦어야 합니다.');
        return;
      }

      const currentDate = new Date();
      if (startDateTime < currentDate) {
        alert('과거 시간은 예약할 수 없습니다.');
        return;
      }

      const reservationData = {
        classroom_id: selectedClassroom.id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        purpose: `${formData.purpose}\n참석인원: ${formData.attendees}`,
        status: 'approved' as const,
      };

      if (editingReservation) {
        await updateReservation(editingReservation.id, reservationData);
        alert('예약이 수정되었습니다.');
      } else {
        await createReservation(reservationData);
        alert('예약이 완료되었습니다.');
      }

      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '',
        endTime: '',
        purpose: '',
        attendees: '',
      });
      setEditingReservation(null);
      clearReservationTimes();
    } catch (error: any) {
      alert(error.message || '예약 처리 중 오류가 발생했습니다.');
    }
  };

  const handleEditReservation = (reservation: Reservation) => {
    // First set the classroom to trigger the schedule loading
    setSelectedClassroom(reservation.classroom);
    
    // Then set the editing state and date
    setEditingReservation(reservation);
    setSelectedDate(new Date(reservation.start_time));
    
    // Scroll to the timetable after a short delay to ensure it's rendered
    setTimeout(() => {
      const scheduleElement = document.querySelector('.ClassroomSchedule');
      if (scheduleElement) {
        scheduleElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const minAttendees = Math.ceil(selectedClassroom.capacity / 3);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6">
        {editingReservation ? '예약 수정하기' : '강의실 예약하기'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="flex items-center gap-2 text-gray-700 mb-2">
            <CalendarDays size={18} />
            예약 날짜
          </label>
          <select
            value={formData.date}
            onChange={(e) => {
              setFormData({ ...formData, date: e.target.value });
              setSelectedDate(new Date(e.target.value));
              clearReservationTimes();
            }}
            className="w-full p-2 border rounded-md"
            required
          >
            <option value="">날짜 선택</option>
            {availableDates.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-gray-700 mb-2">
              <Clock size={18} />
              시작 시간
            </label>
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-gray-700 mb-2">
              <Clock size={18} />
              종료 시간
            </label>
            <input
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-gray-700 mb-2">
            <Users size={18} />
            참석 인원 (최소 {minAttendees}명)
          </label>
          <input
            type="number"
            value={formData.attendees}
            onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
            className="w-full p-2 border rounded-md"
            min={minAttendees}
            max={selectedClassroom.capacity}
            required
          />
          <p className="mt-1 text-sm text-gray-600">
            수용 인원: {selectedClassroom.capacity}명
          </p>
        </div>

        <div>
          <label className="flex items-center gap-2 text-gray-700 mb-2">
            <FileText size={18} />
            예약 목적
          </label>
          <textarea
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            className="w-full p-2 border rounded-md"
            rows={3}
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          {editingReservation ? '예약 수정' : '예약 신청'}
        </button>

        {editingReservation && (
          <button
            type="button"
            onClick={() => {
              setEditingReservation(null);
              clearReservationTimes();
            }}
            className="w-full mt-2 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300 transition-colors"
          >
            새 예약으로 돌아가기
          </button>
        )}
      </form>

      {!editingReservation && myReservations.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">최근 예약 내역</h3>
          <div className="space-y-3">
            {myReservations.slice(0, 3).map((reservation) => (
              <div key={reservation.id} className="border rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{reservation.classroom?.name}</p>
                    <p className="text-sm text-gray-600">
                      {format(parseISO(reservation.start_time), 'M월 d일 HH:mm')} - 
                      {format(parseISO(reservation.end_time), 'HH:mm')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleEditReservation(reservation)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};