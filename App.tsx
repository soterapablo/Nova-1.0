
import React, { useState, useEffect } from 'react';
import { User } from './types';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Attendance } from './components/Attendance';
import { Requests } from './components/Requests';
import { Incidents } from './components/Incidents';
import { AdminPanel } from './components/AdminPanel';
import { Planner } from './components/Planner';
import { Loader2, Lock, AlertCircle } from 'lucide-react';

const SUPER_ADMIN_EMAIL = "soterapablo@gmail.com"; 
const SUPER_ADMIN_DNI = "26809562";

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [usersDb, setUsersDb] = useState<User[]>([]);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // 1. Cargar Base de Datos Real
    const storedDb = localStorage.getItem('users_db');
    let currentDb: User[] = storedDb ? JSON.parse(storedDb) : [];

    // 2. Asegurar existencia del Super Admin Real con las credenciales solicitadas
    const adminExists = currentDb.find(u => u.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase());
    if (!adminExists) {
        const superAdmin: User = {
            id: 'super-admin-master',
            name: 'Pablo Sotera',
            email: SUPER_ADMIN_EMAIL,
            dni: SUPER_ADMIN_DNI,
            password: SUPER_ADMIN_DNI, // Password inicial solicitado
            role: 'ADMIN',
            status: 'APPROVED',
            photoUrl: `https://ui-avatars.com/api/?name=Pablo+Sotera&background=4F46E5&color=fff`
        };
        currentDb.push(superAdmin);
        localStorage.setItem('users_db', JSON.stringify(currentDb));
    }
    setUsersDb(currentDb);

    // 3. Verificar Sesión Activa
    const savedSession = localStorage.getItem('user_session');
    const demoFlag = sessionStorage.getItem('is_demo_active');
    
    if (savedSession) {
        const parsedUser = JSON.parse(savedSession);
        if (demoFlag === 'true') {
            setUser(parsedUser);
            setIsDemoMode(true);
        } else {
            const freshUser = currentDb.find(u => u.id === parsedUser.id);
            if (freshUser) {
                setUser(freshUser);
            } else {
                localStorage.removeItem('user_session');
            }
        }
    }
    setIsLoading(false);
  }, []);

  const saveDb = (newDb: User[]) => {
      setUsersDb(newDb);
      localStorage.setItem('users_db', JSON.stringify(newDb));
  };

  const handleRegister = (newUser: User) => {
    // Registro Real
    const updatedDb = [...usersDb, newUser];
    saveDb(updatedDb);
    setUser(newUser);
    localStorage.setItem('user_session', JSON.stringify(newUser));
    sessionStorage.setItem('is_demo_active', 'false');
    setIsDemoMode(false);
  };

  const handleLogin = (foundUser: User, isDemo: boolean = false) => {
    setUser(foundUser);
    setIsDemoMode(isDemo);
    localStorage.setItem('user_session', JSON.stringify(foundUser));
    if (isDemo) {
        sessionStorage.setItem('is_demo_active', 'true');
    } else {
        sessionStorage.setItem('is_demo_active', 'false');
    }
  };

  const handleLogout = () => {
    if (isDemoMode) {
        // Limpieza de datos volátiles de la demo
        localStorage.removeItem('facility_requests');
        localStorage.removeItem('global_attendance_log');
        localStorage.removeItem('institutional_projects');
        sessionStorage.removeItem('is_demo_active');
    }
    setUser(null);
    setIsDemoMode(false);
    localStorage.removeItem('user_session');
    setCurrentView('dashboard');
  };

  const handleUpdatePassword = async (newPassword: string): Promise<boolean> => {
    if (!user || isDemoMode) return false;
    const updatedUser = { ...user, password: newPassword };
    const updatedDb = usersDb.map(u => u.id === user.id ? updatedUser : u);
    saveDb(updatedDb);
    setUser(updatedUser);
    localStorage.setItem('user_session', JSON.stringify(updatedUser));
    return true;
  };

  const handleUpdateUserStatus = (userId: string, status: 'APPROVED' | 'REJECTED') => {
      if (isDemoMode) return;
      const updatedDb = usersDb.map(u => u.id === userId ? { ...u, status } : u);
      saveDb(updatedDb);
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
            {currentView === 'dashboard' && <Dashboard user={user} onUpdatePassword={handleUpdatePassword} />}
            {currentView === 'attendance' && <Attendance userId={user.id} userDni={user.dni} userRole={user.role} />}
            {currentView === 'requests' && <Requests userId={user.id} />}
            {currentView === 'planner' && <Planner />}
            {currentView === 'incidents' && <Incidents userId={user.id} />}
            {currentView === 'admin' && (user.role === 'ADMIN' ? <AdminPanel users={usersDb} onUpdateStatus={handleUpdateUserStatus} /> : <Dashboard user={user} onUpdatePassword={handleUpdatePassword} />)}
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
