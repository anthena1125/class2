export interface Classroom {
  id: string;
  name: string;
  capacity: number;
  building_id: string;
  floor: number;
  building?: Building;
}

export interface Reservation {
  id: string;
  classroom_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  classroom?: Classroom;
}

export interface RegularClass {
  id: string;
  classroom_id: string;
  name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface TimeSlot {
  start: string;
  end: string;
  isAvailable: boolean;
  regularClass?: RegularClass;
}

export interface Building {
  id: string;
  name: string;
  floors: number;
}

export interface User {
  id: string;
  email: string;
}