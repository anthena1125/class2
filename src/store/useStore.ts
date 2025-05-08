import { create } from 'zustand';
import { Classroom, Reservation, Building, User, RegularClass } from '../types';
import { supabase } from '../lib/supabase';

interface Store {
  user: User | null;
  buildings: Building[];
  selectedBuilding: Building | null;
  classrooms: Classroom[];
  selectedClassroom: Classroom | null;
  reservations: Reservation[];
  regularClasses: RegularClass[];
  myReservations: Reservation[];
  selectedDate: Date;
  selectedStartTime: string | null;
  selectedEndTime: string | null;
  setUser: (user: User | null) => void;
  setBuildings: (buildings: Building[]) => void;
  setSelectedBuilding: (building: Building | null) => void;
  setClassrooms: (classrooms: Classroom[]) => void;
  setSelectedClassroom: (classroom: Classroom | null) => void;
  setReservations: (reservations: Reservation[]) => void;
  setSelectedDate: (date: Date) => void;
  setReservationTimes: (startTime: string | null, endTime: string | null) => void;
  clearReservationTimes: () => void;
  fetchBuildings: () => Promise<void>;
  fetchClassrooms: (buildingId: string) => Promise<void>;
  fetchAvailableTimeSlots: (classroomId: string, date: Date) => Promise<Reservation[]>;
  fetchRegularClasses: (classroomId: string) => Promise<void>;
  fetchMyReservations: () => Promise<void>;
  createReservation: (reservationData: Omit<Reservation, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateReservation: (id: string, reservationData: omit<Reservation, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  cancelReservation: (id: string) => Promise<void>;
  addRegularClass: (classData: Omit<RegularClass, 'id'>) => Promise<void>;
  deleteRegularClass: (id: string) => Promise<void>;
  editingReservation: Reservation | null;
  setEditingReservation: (reservation: Reservation | null) => void;
}

export const useStore = create<Store>((set, get) => ({
  user: null,
  buildings: [],
  selectedBuilding: null,
  classrooms: [],
  selectedClassroom: null,
  reservations: [],
  regularClasses: [],
  myReservations: [],
  selectedDate: new Date(),
  selectedStartTime: null,
  selectedEndTime: null,
  editingReservation: null,
  setEditingReservation: (reservation) => set({ editingReservation: reservation }),
  
  setUser: (user) => {
    set({ user });
    if (user) {
      get().fetchMyReservations();
    }
  },
  
  setBuildings: (buildings) => set({ buildings }),
  
  setSelectedBuilding: async (building) => {
    set({ selectedBuilding: building, selectedClassroom: null });
    if (building) {
      await get().fetchClassrooms(building.id);
    }
  },
  
  setClassrooms: (classrooms) => set({ classrooms }),
  
  setSelectedClassroom: async (classroom) => {
    set({ selectedClassroom: classroom });
    if (classroom) {
      await get().fetchRegularClasses(classroom.id);
      await get().fetchAvailableTimeSlots(classroom.id, get().selectedDate);
    }
  },
  
  setReservations: (reservations) => set({ reservations }),
  
  setSelectedDate: async (date) => {
    set({ selectedDate: date });
    const { selectedClassroom } = get();
    if (selectedClassroom) {
      await get().fetchAvailableTimeSlots(selectedClassroom.id, date);
    }
  },

  setReservationTimes: (startTime, endTime) => {
    console.log(`useStore setReservationTimes - Start: ${startTime}, End: ${endTime}`);
    set({ selectedStartTime: startTime, selectedEndTime: endTime });
  },

  clearReservationTimes: () => set({ 
    selectedStartTime: null, 
    selectedEndTime: null 
  }),

  fetchBuildings: async () => {
    const { data: buildings, error } = await supabase
      .from('buildings')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('건물 정보 조회 중 오류 발생:', error);
      return;
    }
    
    set({ buildings });
  },

  fetchClassrooms: async (buildingId: string) => {
    const { data: classrooms, error } = await supabase
      .from('classrooms')
      .select('*')
      .eq('building_id', buildingId)
      .order('name');
    
    if (error) {
      console.error('강의실 정보 조회 중 오류 발생:', error);
      return;
    }
    
    set({ classrooms });
  },

  fetchAvailableTimeSlots: async (classroomId: string, date: Date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: reservations, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('classroom_id', classroomId)
      .gte('start_time', startOfDay.toISOString())
      .lte('end_time', endOfDay.toISOString())
      .order('start_time');

    if (error) {
      console.error('예약 정보 조회 중 오류 발생:', error);
      return [];
    }

    set({ reservations: reservations || [] });
    return reservations || [];
  },

  fetchRegularClasses: async (classroomId: string) => {
    const { data: regularClasses, error } = await supabase
      .from('regular_classes')
      .select('*')
      .eq('classroom_id', classroomId)
      .order('day_of_week, start_time');

    if (error) {
      console.error('정규 수업 정보 조회 중 오류 발생:', error);
      return;
    }

    set({ regularClasses: regularClasses || [] });
  },

  fetchMyReservations: async () => {
    const { user } = get();
    if (!user) return;

    const { data: reservations, error } = await supabase
      .from('reservations')
      .select(`
        *,
        classroom:classrooms(
          *,
          building:buildings(*)
        )
      `)
      .eq('user_id', user.id)
      .order('start_time', { ascending: false });

    if (error) {
      console.error('내 예약 정보 조회 중 오류 발생:', error);
      return;
    }

    set({ myReservations: reservations || [] });
  },

  createReservation: async (reservationData) => {
    const { user, selectedClassroom } = get();
    if (!user) {
      throw new Error('예약하려면 로그인이 필요합니다.');
    }

    if (!selectedClassroom) {
      throw new Error('강의실을 선택해주세요.');
    }

    const minAttendees = Math.ceil(selectedClassroom.capacity / 3);
    const attendees = parseInt(reservationData.purpose.split('참석인원:')[1]?.trim() || '0');
    if (attendees < minAttendees) {
      throw new Error(`최소 ${minAttendees}명 이상의 참석자가 필요합니다.`);
    }

    const startTime = new Date(reservationData.start_time);
    const endTime = new Date(reservationData.end_time);
    const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    
    if (hours > 2) {
      throw new Error('예약 시간은 2시간을 초과할 수 없습니다.');
    }

    const { error } = await supabase
      .from('reservations')
      .insert([{
        ...reservationData,
        user_id: user.id,
      }]);

    if (error) {
      throw new Error('예약 생성 중 오류가 발생했습니다.');
    }

    const date = new Date(reservationData.start_time);
    await get().fetchAvailableTimeSlots(reservationData.classroom_id, date);
    await get().fetchMyReservations();
  },

  updateReservation: async (id: string, reservationData) => {
    const { selectedClassroom } = get();
    if (!selectedClassroom) {
      throw new Error('강의실을 선택해주세요.');
    }

    const minAttendees = Math.ceil(selectedClassroom.capacity / 3);
    const attendees = parseInt(reservationData.purpose.split('참석인원:')[1]?.trim() || '0');
    if (attendees < minAttendees) {
      throw new Error(`최소 ${minAttendees}명 이상의 참석자가 필요합니다.`);
    }

    const startTime = new Date(reservationData.start_time);
    const endTime = new Date(reservationData.end_time);
    const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    
    if (hours > 2) {
      throw new Error('예약 시간은 2시간을 초과할 수 없습니다.');
    }

    const { error } = await supabase
      .from('reservations')
      .update(reservationData)
      .eq('id', id);

    if (error) {
      throw new Error('예약 수정 중 오류가 발생했습니다.');
    }

    const date = new Date(reservationData.start_time);
    await get().fetchAvailableTimeSlots(reservationData.classroom_id, date);
    await get().fetchMyReservations();
  },

  cancelReservation: async (id: string) => {
    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error('예약 취소 중 오류가 발생했습니다.');
    }

    const { myReservations } = get();
    set({ 
      myReservations: myReservations.filter(res => res.id !== id) 
    });

    const { selectedClassroom, selectedDate } = get();
    if (selectedClassroom) {
      await get().fetchAvailableTimeSlots(selectedClassroom.id, selectedDate);
    }
  },

  addRegularClass: async (classData) => {
    const { error } = await supabase
      .from('regular_classes')
      .insert([classData]);

    if (error) {
      throw new Error('정규 수업 추가 중 오류가 발생했습니다.');
    }

    await get().fetchRegularClasses(classData.classroom_id);
  },

  deleteRegularClass: async (id: string) => {
    const { selectedClassroom } = get();
    if (!selectedClassroom) return;

    const { error } = await supabase
      .from('regular_classes')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error('정규 수업 삭제 중 오류가 발생했습니다.');
    }

    await get().fetchRegularClasses(selectedClassroom.id);
  },
}));