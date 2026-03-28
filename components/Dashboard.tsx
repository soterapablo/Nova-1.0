
import React, { useState, useEffect } from 'react';
import { User, FacilityRequest, Project, IncidentReport } from '../types';
import { supabase } from '../services/supabaseClient';
import { 
  CalendarDays, CloudSun, Lock, 
  Telescope, AlertTriangle, 
  Loader2, Sparkles,
  Rocket, ChevronRight, CheckCircle, Info
} from 'lucide-react';

interface DashboardProps {
  user: User;
  onUpdatePassword: (newPassword: string) => Promise<boolean>;
  setView: (view: string) => void;
}

const mapRequest = (r: any): FacilityRequest => ({
  id: r.id, userId: r.user_id, attendeeIds: r.attendee_ids || [],
  facility: r.facility, date: r.date, timeStart: r.time_start,
  durationHours: r.duration_hours, purpose: r.purpose, status: r.status
});

const mapProject = (p: any): Project => ({
  id: p.id, creatorId: p.creator_id, collaboratorIds: p.collaborator_ids || [],
  title: p.title, description: p.description, objectives: p.objectives,
  status: p.status, timestamp: p.timestamp
});

const mapIncident = (i: any): IncidentReport => ({
  id: i.id, userId: i.user_id, 
  title: i.title || (i.description ? i.description.substring(0, 40) + '...' : 'Sin título'),
  description: i.description,
  severity: i.severity || i.ai_severity, 
  status: i.status || 'OPEN', 
  timestamp: i.timestamp
});

export const Dashboard: React.FC<DashboardProps> = ({ user, onUpdatePassword, setView }) => {
  const [showSecurity, setShowSecurity] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [nextActivity, setNextActivity] = useState<FacilityRequest | null>(null);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [openIncidents, setOpenIncidents] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // 1. Next Activity
      const { data: reqData } = await supabase
        .from('facility_requests')
        .select('*')
        .eq('status', 'APPROVED')
        .gte('date', today)
        .order('date', { ascending: true })
        .order('time_start', { ascending: true });
      
      if (reqData) {
        const mapped = reqData.map(mapRequest);
        const next = mapped.find(r => r.userId === user.id || (r.attendeeIds && r.attendeeIds.includes(user.id)));
        setNextActivity(next || null);
      }

      // 2. Active Projects (Global)
      const { data: projData } = await supabase
        .from('projects')
        .select('*')
        .neq('status', 'COMPLETED')
        .order('timestamp', { ascending: false })
        .limit(3);
      if (projData) setActiveProjects(projData.map(mapProject));

      // 3. Open Incidents (Global)
      const { data: incData } = await supabase
        .from('incident_reports')
        .select('*')
        .or('status.eq.OPEN,status.is.null')
        .order('timestamp', { ascending: false })
        .limit(5);
      if (incData) setOpenIncidents(incData.map(mapIncident));

      setLoading(false);
    };
    fetchSummary();
  }, [user.id]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setPasswordStatus('LOADING');
    const actualPassword = user.password || user.dni;
    if (currentPasswordInput !== actualPassword) {
      setErrorMsg('Contraseña actual incorrecta.');
      setPasswordStatus('ERROR');
      return;
    }
    if (newPassword.length < 4) {
      setErrorMsg('Debe ser más larga.');
      setPasswordStatus('ERROR');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('No coinciden.');
      setPasswordStatus('ERROR');
      return;
    }
    const success = await onUpdatePassword(newPassword);
    if (success) {
      setPasswordStatus('SUCCESS');
      setCurrentPasswordInput('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => { setPasswordStatus('IDLE'); setShowSecurity(false); }, 3000);
    } else {
      setErrorMsg('Error al actualizar.');
      setPasswordStatus('ERROR');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Sparkles className="text-indigo-400" size={18} />
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">Panel de Control NOVA</h2>
              </div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Resumen General • Observatorio Oro Verde</p>
            </div>
            <button 
              onClick={() => setShowSecurity(!showSecurity)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showSecurity ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              <Lock size={12} /> Seguridad
            </button>
        </header>

        {/* SEGURIDAD: NUDGE DE PASSWORD */}
        {user.mustChangePassword && !showSecurity && (
            <div className="animate-pulse bg-indigo-600 border border-indigo-400 p-6 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-indigo-900/40 group">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center text-white backdrop-blur-xl border border-white/20 group-hover:rotate-12 transition-transform">
                        <Lock size={32} />
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-white tracking-tight uppercase italic">Seguridad de la Cuenta</h4>
                        <p className="text-sm text-indigo-100 font-medium">Detectamos que aún usas tu contraseña provisional (**DNI**). Te recomendamos cambiarla por seguridad.</p>
                    </div>
                </div>
                <button 
                  onClick={() => setShowSecurity(true)}
                  className="w-full md:w-auto px-8 py-4 bg-white text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xl active:scale-95"
                >
                    Cambiar Contraseña Ahora
                </button>
            </div>
        )}

        {showSecurity && (
            <div className="bg-slate-900 border border-indigo-500/30 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5"><Lock size={80} /></div>
                <h3 className="text-white text-lg font-black uppercase tracking-widest mb-6">Actualizar Credenciales</h3>
                <form onSubmit={handlePasswordChange} className="flex flex-col md:flex-row gap-4 relative z-10">
                    <input type="password" value={currentPasswordInput} onChange={(e) => setCurrentPasswordInput(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white text-xs flex-1 font-bold" placeholder="Contraseña actual" />
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white text-xs flex-1 font-bold" placeholder="Nueva contraseña" />
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white py-4 px-8 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/30">Confirmar</button>
                </form>
                {passwordStatus === 'SUCCESS' && <p className="text-green-400 text-[10px] font-black uppercase mt-3 tracking-widest">¡Sistema actualizado correctamente!</p>}
                {errorMsg && <p className="text-red-400 text-[10px] font-black uppercase mt-3 tracking-widest">{errorMsg}</p>}
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PRÓXIMA ACTIVIDAD */}
            <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] flex flex-col justify-between group hover:border-green-500/30 transition-all shadow-xl">
                <div>
                  <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <CalendarDays className="text-green-400" size={16} />
                        Tu Próxima Actividad
                      </h3>
                      <button onClick={() => setView('agenda')} className="text-indigo-400 hover:text-white transition-colors"><ChevronRight size={18} /></button>
                  </div>
                  {nextActivity ? (
                    <div>
                      <h4 className="text-xl font-black text-white italic uppercase tracking-tight mb-2">{nextActivity.facility}</h4>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{nextActivity.date} • {nextActivity.timeStart} hs</p>
                      <p className="text-sm text-slate-500 italic mt-4 line-clamp-2">"{nextActivity.purpose}"</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 font-bold uppercase tracking-widest py-4">No hay actividades próximas en tu agenda.</p>
                  )}
                </div>
                {nextActivity && (
                  <button onClick={() => setView('agenda')} className="mt-8 text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">Ver todos los detalles <ChevronRight size={12} /></button>
                )}
            </div>

            {/* STATUS & CLIMA */}
            <div className="grid grid-cols-1 gap-6">
              {/* STATUS DINÁMICO */}
              {(() => {
                const hasCritical = openIncidents.some(inc => inc.severity === 'CRITICAL');
                const hasHigh = openIncidents.some(inc => inc.severity === 'HIGH');
                
                if (hasCritical) {
                    return (
                        <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-[2rem] flex items-center gap-4 group hover:bg-red-500/20 transition-all">
                            <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 border border-red-500/40 group-hover:scale-105 transition-transform">
                                <AlertTriangle className="text-red-500 animate-pulse" size={24} />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-0.5">Status Crítico</h3>
                                <p className="text-[9px] text-white font-black uppercase tracking-widest">Fallas Graves Detectadas</p>
                            </div>
                        </div>
                    );
                }
                
                if (hasHigh) {
                    return (
                        <div className="bg-amber-500/10 border border-amber-500/30 p-6 rounded-[2rem] flex items-center gap-4 group hover:bg-amber-500/20 transition-all">
                            <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 border border-amber-500/40 group-hover:scale-105 transition-transform">
                                <Info className="text-amber-500" size={24} />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-0.5">Status Afectado</h3>
                                <p className="text-[9px] text-amber-200/50 font-bold uppercase tracking-widest">Fallas Leves / Mantenimiento</p>
                            </div>
                        </div>
                    );
                }

                return (
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2rem] flex items-center gap-4 group hover:border-green-500/30 transition-all">
                        <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-green-500/20 group-hover:scale-105 transition-transform">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-ping shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                        </div>
                        <div>
                            <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-0.5">Status Operativo</h3>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Equipos OK</p>
                        </div>
                    </div>
                );
              })()}

              <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2rem] flex items-center gap-4 group hover:border-indigo-500/30 transition-all">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-indigo-500/20 text-indigo-400 group-hover:scale-105 transition-transform">
                      <CloudSun size={24} />
                  </div>
                  <div>
                      <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-0.5">Cielo Oro Verde</h3>
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">18°C • Despejado</p>
                  </div>
              </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
            {/* PROYECTOS ACTIVOS */}
            <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] shadow-xl hover:border-purple-500/20 transition-all">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Rocket className="text-purple-400" size={16} />
                        Proyectos Activos
                    </h3>
                    <button onClick={() => setView('projects')} className="text-purple-400 hover:text-white transition-colors"><ChevronRight size={18} /></button>
                </div>
                <div className="space-y-4">
                    {activeProjects.length === 0 ? (
                      <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">No hay proyectos activos.</p>
                    ) : (
                      activeProjects.map(p => (
                        <div key={p.id} onClick={() => setView('projects')} className="flex items-center justify-between p-4 bg-slate-800/40 rounded-2xl border border-slate-700/30 cursor-pointer group hover:bg-slate-800 transition-all">
                           <div className="flex items-center gap-3 overflow-hidden">
                              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 text-[10px] font-black"><Info size={14} /></div>
                              <span className="text-white font-bold text-sm truncate">{p.title}</span>
                           </div>
                           <ChevronRight size={14} className="text-slate-600 group-hover:text-purple-400 transition-colors" />
                        </div>
                      ))
                    )}
                </div>
            </div>

            {/* NOVEDADES ABIERTAS */}
            <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] shadow-xl hover:border-red-500/20 transition-all">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <AlertTriangle className="text-red-400" size={16} />
                        Novedades Abiertas
                    </h3>
                    <button onClick={() => setView('incidents')} className="text-red-400 hover:text-white transition-colors"><ChevronRight size={18} /></button>
                </div>
                <div className="space-y-3">
                   {openIncidents.length === 0 ? (
                      <div className="py-6 flex flex-col items-center gap-2 border-2 border-dashed border-slate-800 rounded-2xl">
                        <CheckCircle className="text-green-500/30" size={24} />
                        <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Cero problemas reportados</p>
                      </div>
                   ) : (
                      openIncidents.map(inc => (
                        <div key={inc.id} onClick={() => setView('incidents')} className="group flex items-center gap-3 p-3.5 bg-red-500/5 rounded-2xl border border-red-500/10 cursor-pointer hover:bg-red-500/10 transition-all">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                            <span className="text-sm text-slate-300 font-medium truncate flex-1 group-hover:text-white transition-colors">{inc.title}</span>
                            <ChevronRight size={14} className="text-slate-700 group-hover:text-red-400" />
                        </div>
                      ))
                   )}
                </div>
            </div>
        </div>
    </div>
  );
};
