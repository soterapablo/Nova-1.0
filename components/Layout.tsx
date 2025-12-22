
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { LogOut, Telescope, AlertTriangle, ClipboardCheck, LayoutDashboard, ShieldCheck, Sparkles, Moon, Star } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  currentView: string;
  setCurrentView: (view: string) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, currentView, setCurrentView, onLogout }) => {
  const [redMode, setRedMode] = useState(false);

  useEffect(() => {
    if (redMode) {
        document.body.classList.add('red-mode');
    } else {
        document.body.classList.remove('red-mode');
    }
  }, [redMode]);

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center p-4">{children}</div>;
  }

  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'attendance', label: 'Asistencia', icon: ClipboardCheck },
    { id: 'requests', label: 'Actividades', icon: Telescope },
    { id: 'planner', label: 'Planner', icon: Star },
    { id: 'incidents', label: 'Novedades', icon: AlertTriangle },
  ];

  if (user.role === 'ADMIN') {
      navItems.push({ id: 'admin', label: 'Admin', icon: ShieldCheck });
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900/90 border-b border-slate-700 p-4 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md">
        <h1 className="text-xl font-black text-white tracking-tighter flex items-center gap-2">
          <Sparkles className="text-indigo-400" size={18} />
          NOVA
        </h1>
        <div className="flex gap-4">
            <button onClick={() => setRedMode(!redMode)} className={`${redMode ? 'text-red-500' : 'text-slate-400'}`}>
                <Moon size={20} />
            </button>
            <button onClick={onLogout} className="text-slate-400 hover:text-white">
                <LogOut size={20} />
            </button>
        </div>
      </div>

      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900/50 border-r border-slate-800 backdrop-blur-sm fixed h-full no-print">
        <div className="p-6 border-b border-slate-800 relative">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="text-indigo-400 animate-pulse" size={20} />
            <h1 className="text-3xl font-black text-white tracking-tighter">NOVA</h1>
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Observatorio Oro Verde</p>
          <span className="absolute top-4 right-4 text-[8px] font-bold text-indigo-500/50">v1.0</span>
        </div>
        
        <div className="p-4 flex items-center space-x-3 border-b border-slate-800 bg-slate-800/20">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold overflow-hidden shadow-lg shadow-indigo-900/20">
            {user.photoUrl ? (
                <img src={user.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
                user.name.charAt(0)
            )}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white truncate">{user.name}</p>
            <p className="text-[10px] text-slate-400 font-mono">DNI: {user.dni}</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm ${
                currentView === item.id
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/40 border border-indigo-400/30'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <item.icon size={18} strokeWidth={currentView === item.id ? 2.5 : 2} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            onClick={() => setRedMode(!redMode)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-sm font-bold ${
                redMode ? 'bg-red-600 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Moon size={18} />
            <span>{redMode ? 'Modo Normal' : 'Modo Nocturno'}</span>
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-900/20 hover:text-red-400 transition-colors text-sm font-bold"
          >
            <LogOut size={18} />
            <span>Salir</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
            {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 border-t border-slate-800 p-2 flex justify-around z-50 backdrop-blur-lg no-print">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl w-16 transition-colors ${
              currentView === item.id
                ? 'text-indigo-400 bg-indigo-500/5'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <item.icon size={22} strokeWidth={currentView === item.id ? 2.5 : 2} />
            <span className="text-[9px] mt-1 font-black uppercase">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};
