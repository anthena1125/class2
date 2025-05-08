import React, { useEffect, useState } from 'react';
import { ClassroomList } from './components/ClassroomList';
import { TimeTable } from './components/TimeTable';
import { ReservationForm } from './components/ReservationForm';
import { BuildingSelector } from './components/BuildingSelector';
import { ClassroomSchedule } from './components/ClassroomSchedule';
import { MyReservations } from './components/MyReservations';
import { AdminClassSchedule } from './components/AdminClassSchedule';
import { Auth } from './components/Auth';
import { School, LogOut, User as UserIcon, Menu, X } from 'lucide-react';
import { useStore } from './store/useStore';
import { supabase } from './lib/supabase';

function App() {
  const { user, setUser } = useStore();
  const [loading, setLoading] = useState(true);
  const [showMyReservations, setShowMyReservations] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // 커스텀 이벤트 리스너 추가
    const handleToggleMyReservations = (event: CustomEvent) => {
      setShowMyReservations(event.detail);
    };
    window.addEventListener('toggleMyReservations', handleToggleMyReservations as EventListener);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('toggleMyReservations', handleToggleMyReservations as EventListener);
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <School className="text-blue-600 hidden sm:block" size={32} />
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight">
                원광대학교<br className="sm:hidden" /> 강의실 예약
              </h1>
            </div>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="sm:hidden p-2 rounded-md text-gray-600 hover:text-gray-900"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Desktop navigation */}
            <div className="hidden sm:flex items-center gap-4">
              {user ? (
                <>
                  <button
                    onClick={() => setShowMyReservations(!showMyReservations)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    <UserIcon size={20} />
                    {showMyReservations ? '시간표 보기' : '내 예약'}
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    <LogOut size={20} />
                    로그아웃
                  </button>
                </>
              ) : (
                <Auth />
              )}
            </div>
          </div>

          {/* Mobile navigation */}
          {isMenuOpen && (
            <div className="sm:hidden mt-4 border-t pt-4">
              {user ? (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setShowMyReservations(!showMyReservations);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md"
                  >
                    <UserIcon size={20} />
                    {showMyReservations ? '시간표 보기' : '내 예약'}
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md"
                  >
                    <LogOut size={20} />
                    로그아웃
                  </button>
                </div>
              ) : (
                <div className="px-4">
                  <Auth />
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {showMyReservations ? (
          <MyReservations />
        ) : (
          <>
            <BuildingSelector />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <ClassroomSchedule />
                {/* Show ReservationForm between schedule and classroom list on mobile */}
                <div className="lg:hidden">
                  <ReservationForm />
                  {user?.email.endsWith('@admin.com') && <AdminClassSchedule />}
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-4">가능한 강의실</h2>
                  <ClassroomList />
                </div>
              </div>
              {/* Hide ReservationForm on mobile, show only on desktop */}
              <div className="hidden lg:block space-y-8">
                <ReservationForm />
                {user?.email.endsWith('@admin.com') && <AdminClassSchedule />}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;