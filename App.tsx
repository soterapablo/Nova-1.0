import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Attendance } from './components/Attendance';
import { Requests } from './components/Requests';
import { Incidents } from './components/Incidents';
import { AdminPanel } from './components/AdminPanel';
import { Planner } from './components/Planner';
import { Projects } from './components/Projects';
import { Agenda } from './components/Agenda';
import { Loader2, Lock, AlertCircle } from 'lucide-react';
import { authService } from './services/authService';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [usersDb, setUsersDb] = useState<User[]>([]);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const fetchUsersDb = async () => {
      const { data } = await supabase.from('profiles').select('*');
      if (data) {
          const formatted = data.map((d: any) => ({
              id: d.id,
              email: d.email,
              name: d.name,
              dni: d.dni,
               role: d.role,
               status: d.status,
               photoUrl: d.photo_url,
               phone: d.phone,
               emergencyPhone: d.emergency_phone,
               birthDate: d.birth_date,
               medicalNotes: d.medical_notes,
               mustChangePassword: d.must_change_password
           }));
          setUsersDb(formatted);
      }
  };

  useEffect(() => {
    const initAuth = async () => {
      const demoFlag = sessionStorage.getItem('is_demo_active');
      if (demoFlag === 'true') {
          const savedSession = localStorage.getItem('user_session');
          if (savedSession) {
              setUser(JSON.parse(savedSession));
              setIsDemoMode(true);
          }
          setIsLoading(false);
          return;
      }
      
      const { user } = await authService.checkSession();
      if (user) {
          setUser(user);
          if (user.role === 'ADMIN') {
              await fetchUsersDb();
          }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const handleRegister = async (newUser: User) => {
    setUser(newUser);
    setIsDemoMode(false);
  };

  const handleLogin = async (foundUser: User, isDemo: boolean = false) => {
    setUser(foundUser);
    setIsDemoMode(isDemo);
    if (isDemo) {
        sessionStorage.setItem('is_demo_active', 'true');
        localStorage.setItem('user_session', JSON.stringify(foundUser));
    } else {
        sessionStorage.removeItem('is_demo_active');
        if (foundUser.role === 'ADMIN') {
            await fetchUsersDb();
        }
    }
  };

  const handleLogout = async () => {
    if (isDemoMode) {
        sessionStorage.removeItem('is_demo_active');
    } else {
        await authService.logout();
    }
    setUser(null);
    setIsDemoMode(false);
    localStorage.removeItem('user_session');
    setCurrentView('dashboard');
  };

  const handleUpdatePassword = async (newPassword: string): Promise<boolean> => {
    if (!user || isDemoMode) return false;
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
        console.error(error);
        return false;
    }
    
    // Reset the nudge flag in the profile
    await supabase.from('profiles').update({ must_change_password: false }).eq('id', user.id);
    
    const updatedUser: User = { ...user, password: newPassword, mustChangePassword: false };
    setUser(updatedUser);
    return true;
  };

  const handleUpdateUserStatus = async (userId: string, status: 'APPROVED' | 'REJECTED', role: UserRole = 'SOCIO') => {
      if (isDemoMode) {
          alert("Modo Demo: Los cambios no se guardan en la base de datos.");
          return;
      }
      
      const updatePayload: any = { status };
      if (status === 'APPROVED') {
          updatePayload.role = role;
      }
      
      const { error } = await supabase.from('profiles').update(updatePayload).eq('id', userId);
      if (error) {
          console.error("Error al actualizar estado:", error);
          alert("Error al actualizar el socio: " + error.message);
          return;
      }
      
      setUsersDb(prev => prev.map(u => u.id === userId ? { ...u, status, role: status === 'APPROVED' ? role : u.role } : u));
      if (user && user.id === userId) setUser({ ...user, status, role: status === 'APPROVED' ? role : user.role });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0E17]">
        <Loader2 className="animate-spin h-12 w-12 text-indigo-500" />
      </div>
    );
  }

  if (user && user.status === 'PENDING') {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0E17] text-white p-6 text-center">
              <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mb-6">
                  <Lock size={40} className="text-yellow-500" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Perfil en Revisión</h1>
              <p className="text-slate-400 max-w-md mb-8">Tu cuenta ha sido creada. Un administrador debe aprobar tu acceso para que puedas comenzar a marcar asistencia y solicitar instrumental.</p>
              <button onClick={handleLogout} className="px-8 py-4 bg-slate-800 rounded-2xl hover:bg-slate-700 transition-all text-xs font-black uppercase tracking-widest">Cerrar Sesión</button>
          </div>
      );
  }

  const renderContent = () => {
    if (!user) return <Login onLogin={handleLogin} usersDb={usersDb} onRegister={handleRegister} />;
    
    return (
        <>
            {isDemoMode && (
                <div className="bg-amber-600 text-white text-[10px] font-black uppercase py-2 px-4 flex items-center justify-center gap-2 sticky top-0 z-[60] shadow-xl no-print">
                    <AlertCircle size={14} /> Entorno de Pruebas Volátil - Los datos se borrarán al salir
                </div>
            )}
            {currentView === 'dashboard' && <Dashboard user={user} onUpdatePassword={handleUpdatePassword} setView={setCurrentView} />}
            {currentView === 'agenda' && <Agenda user={user} />}
            {currentView === 'attendance' && <Attendance userId={user.id} userDni={user.dni} userRole={user.role} />}
            {currentView === 'requests' && <Requests userId={user.id} />}
            {currentView === 'planner' && <Planner />}
            {currentView === 'projects' && <Projects user={user} />}
            {currentView === 'incidents' && <Incidents userId={user.id} />}
            {currentView === 'admin' && (user.role === 'ADMIN' ? <AdminPanel users={usersDb} onUpdateStatus={handleUpdateUserStatus} refreshUsers={fetchUsersDb} /> : <Dashboard user={user} onUpdatePassword={handleUpdatePassword} setView={setCurrentView} />)}
        </>
    );
  };

  return (
    <Layout user={user} currentView={currentView} setCurrentView={setCurrentView} onLogout={handleLogout}>
      {renderContent()}
    </Layout>
  );
};

export default App;
