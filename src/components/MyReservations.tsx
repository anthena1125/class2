import React from 'react';
import { format, parseISO } from 'date-fns';
import { useStore } from '../store/useStore';
import { Calendar, Clock, CheckCircle, XCircle, Clock3, Trash2, Edit2 } from 'lucide-react';

export const MyReservations: React.FC = () => {
  const { user, myReservations, cancelReservation, setSelectedClassroom, setSelectedDate } = useStore();

  if (!user) {
    return (
      <div className="text-center text-gray-600 p-4">
        예약 내역을 보려면 로그인이 필요합니다
      </div>
    );
  }

  const handleCancelReservation = async (id: string) => {
    if (!confirm('예약을 취소하시겠습니까?')) {
      return;
    }

    try {
      await cancelReservation(id);
      alert('예약이 취소되었습니다.');
    } catch (error) {
      alert('예약 취소 중 오류가 발생했습니다.');
    }
  };

  const handleEditReservation = (reservation: any) => {
    setSelectedClassroom(reservation.classroom);
    setSelectedDate(new Date(reservation.start_time));
    // 예약 수정 페이지로 이동
    const scheduleElement = document.querySelector('.lg\\:col-span-2');
    if (scheduleElement) {
      scheduleElement.scrollIntoView({ behavior: 'smooth' });
      // Add a small delay to ensure the timetable is rendered
      setTimeout(() => {
        const weekSelector = document.querySelector('.ClassroomSchedule');
        if (weekSelector) {
          weekSelector.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <Calendar className="text-blue-600" />
        내 예약 내역
      </h2>

      {myReservations.length === 0 ? (
        <p className="text-center text-gray-600">예약 내역이 없습니다</p>
      ) : (
        <div className="space-y-4">
          {myReservations.map((reservation) => (
            <div
              key={reservation.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  {reservation.classroom?.building?.name} - {reservation.classroom?.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className={`
                    px-3 py-1 rounded-full text-sm
                    ${reservation.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                    ${reservation.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                    ${reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                  `}>
                    {reservation.status === 'approved' && <CheckCircle size={16} className="inline mr-1" />}
                    {reservation.status === 'rejected' && <XCircle size={16} className="inline mr-1" />}
                    {reservation.status === 'pending' && <Clock3 size={16} className="inline mr-1" />}
                    {reservation.status === 'approved' ? '승인됨' : 
                     reservation.status === 'rejected' ? '거절됨' : '대기중'}
                  </span>
                  <button
                    onClick={() => handleEditReservation(reservation)}
                    className="text-blue-600 hover:text-blue-800"
                    title="예약 수정"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button
                    onClick={() => handleCancelReservation(reservation.id)}
                    className="text-red-600 hover:text-red-800"
                    title="예약 취소"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
              <div className="mt-2 text-gray-600">
                <p className="flex items-center gap-2">
                  <Clock size={16} />
                  {format(parseISO(reservation.start_time), 'yyyy년 M월 d일 HH:mm')} - 
                  {format(parseISO(reservation.end_time), 'HH:mm')}
                </p>
                <p className="mt-1">{reservation.purpose}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};