import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Calendar, Plus, Trash2 } from 'lucide-react';

export const AdminClassSchedule: React.FC = () => {
const { user, selectedClassroom, regularClasses, addRegularClass, deleteRegularClass } = useStore();
const [formData, setFormData] = useState({
name: '',
day_of_week: '1',
start_time: '09:00',
end_time: '10:30',
});

const isAdmin = user?.email.endsWith('@admin.com');

if (!isAdmin) {
return (
<div className="text-center text-gray-600 p-4">
관리자 권한이 필요합니다
</div>
);
}

if (!selectedClassroom) {
return (
<div className="text-center text-gray-600 p-4">
강의실을 선택해주세요
</div>
);
}

const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault();
await addRegularClass({
...formData,
classroom_id: selectedClassroom.id,
day_of_week: parseInt(formData.day_of_week),
});
setFormData({ ...formData, name: '' });
};

return (
<div className="bg-white rounded-lg shadow-md p-6">
<h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
<Calendar className="text-blue-600" />
정규 수업 관리
</h2>


  <form onSubmit={handleSubmit} className="space-y-4 mb-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          수업명
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full p-2 border rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          요일
        </label>
        <select
          value={formData.day_of_week}
          onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
          className="w-full p-2 border rounded-md"
        >
          <option value="1">월요일</option>
          <option value="2">화요일</option>
          <option value="3">수요일</option>
          <option value="4">목요일</option>
          <option value="5">금요일</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          시작 시간
        </label>
        <input
          type="time"
          value={formData.start_time}
          onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
          className="w-full p-2 border rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          종료 시간
        </label>
        <input
          type="time"
          value={formData.end_time}
          onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
          className="w-full p-2 border rounded-md"
          required
        />
      </div>
    </div>
    <button
      type="submit"
      className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
    >
      <Plus size={20} />
      수업 추가
    </button>
  </form>

  <div className="space-y-3">
    {regularClasses.map((classItem) => (
      <div
        key={classItem.id}
        className="flex items-center justify-between p-3 border rounded-lg"
      >
        <div>
          <h3 className="font-medium">{classItem.name}</h3>
          <p className="text-sm text-gray-600">
            {['일', '월', '화', '수', '목', '금', '토'][classItem.day_of_week]}{' '}
            {classItem.start_time.substring(0, 5)} - {classItem.end_time.substring(0, 5)}
          </p>
        </div>
        <button
          onClick={() => deleteRegularClass(classItem.id)}
          className="text-red-600 hover:text-red-800"
        >
          <Trash2 size={20} />
        </button>
      </div>
    ))}
  </div>
</div>
);
};