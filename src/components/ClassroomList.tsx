import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Clock, Users, Calendar, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export const ClassroomList: React.FC = () => {
  const { user, classrooms, selectedBuilding, selectedDate, setSelectedClassroom } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

  if (!selectedBuilding) {
    return (
      <div className="text-center text-gray-600 p-4">
        건물을 선택해주세요
      </div>
    );
  }

  const filteredClassrooms = classrooms.filter(classroom => 
    classroom.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="mb-4 space-y-4">
        <div className="flex items-center gap-2 text-gray-700">
          <Calendar size={20} />
          <span>{format(selectedDate, 'yyyy년 M월 d일', { locale: ko })} 사용 가능한 강의실</span>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="강의실 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-10 border rounded-md"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        </div>
      </div>

      {filteredClassrooms.length === 0 ? (
        <div className="text-center text-gray-600 p-4">
          {searchTerm ? '검색 결과가 없습니다' : '선택한 건물에 사용 가능한 강의실이 없습니다'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClassrooms.map((classroom) => (
            <div
              key={classroom.id}
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-semibold text-gray-800">
                {classroom.name}
              </h3>
              <div className="mt-2 text-gray-600">
                <p className="flex items-center gap-2">
                  <Users size={18} />
                  수용 인원: {classroom.capacity}명
                </p>
                <p className="flex items-center gap-2 mt-1">
                  <Clock size={18} />
                  {classroom.floor}층
                </p>
              </div>
              {user ? (
                <button 
                  onClick={() => setSelectedClassroom(classroom)}
                  className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  강의실 예약
                </button>
              ) : (
                <p className="mt-4 text-center text-sm text-gray-600">
                  예약하려면 로그인이 필요합니다
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}