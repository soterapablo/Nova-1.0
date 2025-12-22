
import React, { useState, useEffect } from 'react';
import { User, FacilityRequest, Project } from '../types';
import { analyzeProject } from '../services/geminiService';
import { 
  Info, ExternalLink, CalendarDays, CloudSun, QrCode, ShieldCheck, Lock, Save, 
  AlertCircle, CheckCircle, Telescope, Hourglass, UserPlus, FileDown, Users, 
  Calendar, Clock as ClockIcon, Rocket, Lightbulb, Plus, Loader2, Sparkles, TrendingUp,
  LayoutGrid, BookOpen, Briefcase, ChevronRight, Search, Check
} from 'lucide-react';

interface DashboardProps {
  user: User;
  onUpdatePassword: (newPassword: string) => Promise<boolean>;
}

type DashboardTab = 'EXPLORE_ACT' | 'MY_ACT' | 'EXPLORE_PROJ' | 'MY_PROJ';

export const Dashboard: React.FC<DashboardProps> = ({ user, onUpdatePassword }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('MY_ACT');
  const [showSecurity, setShowSecurity] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [allRequests, setAllRequests] = useState<FacilityRequest[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [usersDb, setUsersDb] = useState<User[]>([]);
  const [printingEvent, setPrintingEvent] = useState<FacilityRequest | null>(null);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '', objectives: '' });
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    const storedReqs = localStorage.getItem('facility_requests');
    const storedProjects = localStorage.getItem('institutional_projects');
    const storedUsers = localStorage.getItem('users_db');
    
    if (storedReqs) setAllRequests(JSON.parse(storedReqs));
    if (storedUsers) setUsersDb(JSON.parse(storedUsers));

    if (storedProjects) {
      setProjects(JSON.parse(storedProjects));
    } else {
      // Proyectos iniciales de ejemplo para NOVA v1.0
      const initialProjects: Project[] = [
        {
          id: 'proj-1',
          creatorId: 'super-admin-master',
          collaboratorIds: [],
          title: 'Mapeo de Nebulosas Australes',
          description: 'Estudio fotométrico de nebulosas de emisión visibles desde el hemisferio sur utilizando el telescopio principal.',
          objectives: 'Catalogar variaciones de brillo en H-Alpha.',
          status: 'IN_PROGRESS',
          timestamp: Date.now(),
          aiEvaluation: { feasibilityScore: 85, category: 'Investigación', strategicSuggestion: 'Priorizar noches de luna nueva.' }
        },
        {
          id: 'proj-2',
          creatorId: 'demo-staff-id',
          collaboratorIds: [],
          title: 'Modernización del Domo Geodésico',
          description: 'Propuesta para la automatización de la apertura del domo y sincronización con el software Stellarium.',
          objectives: 'Reducir tiempos de preparación en un 50%.',
          status: 'IDEA',
          timestamp: Date.now(),
          aiEvaluation: { feasibilityScore: 92, category: 'Infraestructura', strategicSuggestion: 'Utilizar controladores Arduino/Raspberry.' }
        }
      ];
      setProjects(initialProjects);
      localStorage.setItem('institutional_projects', JSON.stringify(initialProjects));
    }
  }, []);

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

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingProject(true);
    try {
      const evaluation = await analyzeProject(newProject.title, newProject.description, newProject.objectives);
      const project: Project = {
        id: crypto.randomUUID(),
        creatorId: user.id,
        collaboratorIds: [],
        title: newProject.title,
        description: newProject.description,
        objectives: newProject.objectives,
        status: 'IDEA',
        timestamp: Date.now(),
        aiEvaluation: evaluation || undefined
      };
      const updatedProjects = [project, ...projects];
      setProjects(updatedProjects);
      localStorage.setItem('institutional_projects', JSON.stringify(updatedProjects));
      setNewProject({ title: '', description: '', objectives: '' });
      setShowProjectModal(false);
      setActiveTab('MY_PROJ');
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleJoinProject = (projectId: string) => {
    setJoiningId(projectId);
    setTimeout(() => {
      const updated = projects.map(p => {
        if (p.id === projectId && !p.collaboratorIds.includes(user.id) && p.creatorId !== user.id) {
          return { ...p, collaboratorIds: [...p.collaboratorIds, user.id] };
        }
        return p;
      });
      setProjects(updated);
      localStorage.setItem('institutional_projects', JSON.stringify(updated));
      setJoiningId(null);
      setActiveTab('MY_PROJ');
    }, 800);
  };

  const handleJoinEvent = (requestId: string) => {
    const updated = allRequests.map(req => {
      if (req.id === requestId) {
        const attendees = req.attendeeIds || [];
        if (!attendees.includes(user.id)) {
          return { ...req, attendeeIds: [...attendees, user.id] };
        }
      }
      return req;
    });
    setAllRequests(updated);
    localStorage.setItem('facility_requests', JSON.stringify(updated));
  };

  const handlePrintReport = (req: FacilityRequest) => {
    setPrintingEvent(req);
    setTimeout(() => { window.print(); setPrintingEvent(null); }, 100);
  };

  const today = new Date().toISOString().split('T')[0];
  const myEvents = allRequests.filter(r => (r.userId === user.id || (r.attendeeIds && r.attendeeIds.includes(user.id))) && r.status === 'APPROVED' && r.date >= today);
  const exploreEvents = allRequests.filter(r => r.userId !== user.id && (!r.attendeeIds || !r.attendeeIds.includes(user.id)) && r.status === 'APPROVED' && r.date >= today);
  
  const myProjects = projects.filter(p => p.creatorId === user.id || p.collaboratorIds.includes(user.id));
  const exploreProjects = projects.filter(p => 
    p.creatorId !== user.id && 
    !p.collaboratorIds.includes(user.id) &&
    (p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getAttendeeNames = (req: FacilityRequest) => {
    const creator = usersDb.find(u => u.id === req.userId);
    const others = (req.attendeeIds || []).map(id => usersDb.find(u => u.id === id));
    return [creator, ...others].filter(Boolean) as User[];
  };

  const NavButton = ({ tab, label, icon: Icon }: { tab: DashboardTab, label: string, icon: any }) => (
    <button 
        onClick={() => setActiveTab(tab)}
        className={`flex-1 flex flex-col items-center gap-1.5 py-3.5 rounded-2xl transition-all border ${activeTab === tab ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl shadow-indigo-900/40' : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
    >
        <Icon size={18} strokeWidth={activeTab === tab ? 2.5 : 2} />
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );

  return (
    <div className="space-y-6">
        {/* Print Template (Hidden) */}
        {printingEvent && (
            <div className="hidden print:block fixed inset-0 bg-white text-black p-10 z-[9999]">
                <h1 className="text-3xl font-black uppercase border-b-4 border-black pb-4 mb-8 tracking-tighter">NOVA v1.0 — REPORTE</h1>
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <p className="text-[10px] font-bold uppercase text-slate-500">Instalación</p>
                            <p className="text-xl font-bold">{printingEvent.facility}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold uppercase text-slate-500">Fecha y Hora</p>
                            <p className="text-xl font-bold">{printingEvent.date} — {printingEvent.timeStart} hs</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase text-slate-500">Propósito declarado</p>
                        <p className="text-sm border-l-2 border-slate-300 pl-4 py-2 italic">"{printingEvent.purpose}"</p>
                    </div>
                    <div className="mt-12">
                        <h2 className="font-black text-xs uppercase tracking-widest border-b-2 mb-4 pb-1">Asistentes registrados</h2>
                        <div className="space-y-2">
                            {getAttendeeNames(printingEvent).map(att => (
                                <div key={att.id} className="flex justify-between py-2 border-b border-slate-100 text-sm">
                                    <span className="font-bold">{att.name}</span>
                                    <span className="font-mono">DNI: {att.dni}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-20 border-t pt-4 text-center">
                        <p className="text-[9px] uppercase font-bold text-slate-400">Generado automáticamente por NOVA - Sistema de Gestión AEA</p>
                    </div>
                </div>
            </div>
        )}

        <header className="mb-2 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print relative">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Sparkles className="text-indigo-400" size={18} />
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">NOVA Control</h2>
              </div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Observatorio Oro Verde • v1.0</p>
            </div>
            <button 
              onClick={() => setShowSecurity(!showSecurity)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showSecurity ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              <Lock size={12} /> Seguridad
            </button>
        </header>

        {/* 4-Tab Navigation */}
        <nav className="grid grid-cols-2 md:grid-cols-4 gap-2.5 no-print">
            <NavButton tab="EXPLORE_ACT" label="Explorar" icon={Search} />
            <NavButton tab="MY_ACT" label="Agenda" icon={CalendarDays} />
            <NavButton tab="EXPLORE_PROJ" label="Proyectos" icon={Rocket} />
            <NavButton tab="MY_PROJ" label="Mis Ideas" icon={Briefcase} />
        </nav>

        <div className="fade-in no-print">
            {showSecurity && (
                <div className="bg-slate-900 border border-indigo-500/30 p-8 rounded-[2rem] mb-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><Lock size={80} /></div>
                    <h3 className="text-white text-lg font-black uppercase tracking-widest mb-6">Actualizar Credenciales</h3>
                    <form onSubmit={handlePasswordChange} className="flex flex-col md:flex-row gap-4 relative z-10">
                        <input type="password" value={currentPasswordInput} onChange={(e) => setCurrentPasswordInput(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white text-xs flex-1 font-bold" placeholder="Contraseña actual" />
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white text-xs flex-1 font-bold" placeholder="Nueva contraseña" />
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white py-4 px-8 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/30">Confirmar</button>
                    </form>
                    {passwordStatus === 'SUCCESS' && <p className="text-green-400 text-[10px] font-black uppercase mt-3 tracking-widest">¡Sistema actualizado correctamente!</p>}
                </div>
            )}

            <div className="min-h-[400px]">
                {/* EXPLORAR ACTIVIDADES */}
                {activeTab === 'EXPLORE_ACT' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                              <LayoutGrid className="text-indigo-400" size={24} />
                              Actividades Públicas
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {exploreEvents.length === 0 ? (
                                <div className="col-span-2 py-24 text-center border-2 border-dashed border-slate-800 rounded-[2.5rem] text-slate-600 font-bold uppercase tracking-widest text-xs">No hay eventos detectados.</div>
                            ) : (
                                exploreEvents.map(req => (
                                    <div key={req.id} className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] flex flex-col justify-between group hover:border-indigo-500/40 transition-all shadow-xl">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                              <h4 className="text-white font-black text-xl leading-tight group-hover:text-indigo-300 transition-colors">{req.facility}</h4>
                                              <span className="text-[8px] font-black bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-md border border-indigo-500/20 uppercase">Abierto</span>
                                            </div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">{req.date} • {req.timeStart} hs</p>
                                            <p className="text-xs text-slate-400 leading-relaxed italic mb-8">"{req.purpose}"</p>
                                        </div>
                                        <button onClick={() => handleJoinEvent(req.id)} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2">
                                          <UserPlus size={14} /> Sumarme ahora
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* MIS ACTIVIDADES */}
                {activeTab === 'MY_ACT' && (
                    <div className="space-y-6">
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                            <CalendarDays className="text-green-400" size={24} />
                            Mi Agenda Nova
                        </h3>
                        <div className="space-y-4">
                            {myEvents.length === 0 ? (
                                <div className="py-24 text-center border-2 border-dashed border-slate-800 rounded-[2.5rem] text-slate-600 font-bold uppercase tracking-widest text-xs">Tu agenda está vacía.</div>
                            ) : (
                                myEvents.map(req => (
                                    <div key={req.id} className="bg-slate-900/60 border border-slate-800 p-6 rounded-[2rem] flex items-center justify-between group hover:border-green-500/30 transition-all">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-all"><Telescope size={28} /></div>
                                            <div>
                                                <h4 className="text-white font-black text-lg">{req.facility}</h4>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{req.date} • {req.timeStart} hs</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handlePrintReport(req)} className="p-5 bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-2xl transition-all shadow-inner">
                                          <FileDown size={22} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* EXPLORAR PROYECTOS - SELECCIÓN ACTIVA */}
                {activeTab === 'EXPLORE_PROJ' && (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                                <Rocket className="text-purple-400" size={24} />
                                Banco de Proyectos
                            </h3>
                            <div className="flex w-full md:w-auto gap-2">
                              <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-3 text-slate-500" size={14} />
                                <input 
                                  value={searchQuery}
                                  onChange={e => setSearchQuery(e.target.value)}
                                  placeholder="Buscar proyectos..." 
                                  className="w-full bg-slate-900 border border-slate-700 pl-9 pr-4 py-2.5 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500 outline-none" 
                                />
                              </div>
                              <button onClick={() => setShowProjectModal(true)} className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all flex items-center gap-2">
                                  <Plus size={14} /> Proponer
                              </button>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {exploreProjects.length === 0 ? (
                                <div className="col-span-2 py-24 text-center border-2 border-dashed border-slate-800 rounded-[2.5rem] text-slate-600 font-bold uppercase tracking-widest text-xs">No hay nuevos proyectos para explorar.</div>
                            ) : (
                                exploreProjects.map(project => (
                                    <div key={project.id} className="bg-slate-900/80 border border-slate-800 p-8 rounded-[2.5rem] hover:border-purple-500/40 transition-all flex flex-col justify-between relative overflow-hidden group shadow-2xl">
                                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-600/5 rounded-full blur-3xl group-hover:bg-purple-600/15 transition-all"></div>
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-4">
                                                <h4 className="text-xl font-black text-white leading-tight group-hover:text-purple-300 transition-colors">{project.title}</h4>
                                                <span className="text-[8px] font-black bg-slate-800 text-slate-400 px-2 py-1 rounded-lg uppercase border border-slate-700 tracking-tighter">{project.status}</span>
                                            </div>
                                            <p className="text-xs text-slate-400 line-clamp-3 mb-8 font-medium leading-relaxed italic opacity-80">"{project.description}"</p>
                                            
                                            {project.aiEvaluation && (
                                                <div className="bg-purple-900/10 border border-purple-500/20 p-5 rounded-2xl mb-8 backdrop-blur-md">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <span className="text-[9px] font-black text-purple-300 uppercase tracking-widest flex items-center gap-2">
                                                          <Sparkles size={10} /> Factibilidad NOVA
                                                        </span>
                                                        <span className="text-xs font-black text-purple-400">{project.aiEvaluation.feasibilityScore}%</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-slate-800 rounded-full mb-4 overflow-hidden">
                                                        <div className="h-full bg-purple-500 transition-all duration-1000" style={{ width: `${project.aiEvaluation.feasibilityScore}%` }}></div>
                                                    </div>
                                                    <p className="text-[10px] text-slate-300 font-medium leading-tight">"{project.aiEvaluation.strategicSuggestion}"</p>
                                                </div>
                                            )}
                                        </div>
                                        <button 
                                            onClick={() => handleJoinProject(project.id)}
                                            disabled={joiningId === project.id}
                                            className={`w-full py-5 text-[10px] font-black uppercase tracking-widest rounded-3xl shadow-2xl transition-all flex items-center justify-center gap-3 relative z-10 ${
                                              joiningId === project.id 
                                              ? 'bg-slate-800 text-slate-500' 
                                              : 'bg-purple-600 hover:bg-purple-500 text-white'
                                            }`}
                                        >
                                            {joiningId === project.id ? (
                                              <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                              <><Users size={16} /> Sumarme al Equipo</>
                                            )}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* MIS PROYECTOS */}
                {activeTab === 'MY_PROJ' && (
                    <div className="space-y-6">
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                            <Briefcase className="text-blue-400" size={24} />
                            Mis Iniciativas
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {myProjects.length === 0 ? (
                                <div className="col-span-2 py-24 text-center border-2 border-dashed border-slate-800 rounded-[2.5rem] text-slate-600 font-bold uppercase tracking-widest text-xs">
                                  No tienes proyectos activos. 
                                  <button onClick={() => setActiveTab('EXPLORE_PROJ')} className="text-indigo-400 block mt-4 underline font-black">¡Explora ideas de otros!</button>
                                </div>
                            ) : (
                                myProjects.map(project => (
                                    <div key={project.id} className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
                                        <div className="flex justify-between items-start mb-5">
                                            <h4 className="text-xl font-black text-white tracking-tight">{project.title}</h4>
                                            {project.creatorId === user.id ? (
                                              <span className="text-[8px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20 uppercase tracking-widest">Líder</span>
                                            ) : (
                                              <span className="text-[8px] font-black text-slate-500 bg-slate-700/30 px-2 py-1 rounded border border-slate-700 uppercase tracking-widest">Socio</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-400 mb-8 italic opacity-70 leading-relaxed line-clamp-2">"{project.description}"</p>
                                        <div className="flex items-center gap-3 pt-6 border-t border-slate-700/40">
                                            <div className="flex -space-x-2.5">
                                                <div className="w-8 h-8 rounded-full bg-indigo-600 border-2 border-slate-900 flex items-center justify-center text-[10px] text-white font-black shadow-lg" title="Líder">
                                                    {usersDb.find(u => u.id === project.creatorId)?.name.charAt(0)}
                                                </div>
                                                {project.collaboratorIds.map(id => (
                                                    <div key={id} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-[10px] text-slate-300 font-black shadow-lg">
                                                        {usersDb.find(u => u.id === id)?.name.charAt(0)}
                                                    </div>
                                                ))}
                                            </div>
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{project.collaboratorIds.length + 1} Colaboradores</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Modal Nuevo Proyecto */}
        {showProjectModal && (
            <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-in fade-in zoom-in duration-300 relative overflow-hidden">
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl"></div>
                    <h4 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase italic">Lanzar Idea</h4>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-10">Nuestra IA procesará la viabilidad científica.</p>
                    <form onSubmit={handleCreateProject} className="space-y-6 relative z-10">
                        <input required value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})} placeholder="Título del Proyecto" className="w-full bg-slate-800 border border-slate-700 p-5 rounded-2xl text-white outline-none focus:ring-2 focus:ring-purple-500 font-bold placeholder-slate-600" />
                        <textarea required value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} placeholder="Describe el alcance y los recursos..." rows={3} className="w-full bg-slate-800 border border-slate-700 p-5 rounded-2xl text-white outline-none focus:ring-2 focus:ring-purple-500 resize-none font-medium placeholder-slate-600" />
                        <textarea required value={newProject.objectives} onChange={e => setNewProject({...newProject, objectives: e.target.value})} placeholder="Objetivos científicos clave..." rows={2} className="w-full bg-slate-800 border border-slate-700 p-5 rounded-2xl text-white outline-none focus:ring-2 focus:ring-purple-500 resize-none font-medium placeholder-slate-600" />
                        <div className="flex gap-4 pt-6">
                            <button type="button" onClick={() => setShowProjectModal(false)} className="flex-1 py-5 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:text-white transition-all">Cancelar</button>
                            <button type="submit" disabled={isCreatingProject} className="flex-1 py-5 bg-purple-600 hover:bg-purple-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-2xl transition-all flex items-center justify-center gap-3">
                                {isCreatingProject ? <Loader2 size={18} className="animate-spin" /> : <><Sparkles size={16} /> Lanzar Propuesta</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Status Widgets NOVA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print mt-12">
            <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] flex items-center gap-6 group hover:border-green-500/30 transition-all">
                <div className="w-16 h-16 bg-green-500/10 rounded-3xl flex items-center justify-center flex-shrink-0 border border-green-500/20 group-hover:scale-110 transition-transform">
                    <div className="w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
                </div>
                <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest mb-1">Status Operativo</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Predio Seguro • Equipos OK</p>
                </div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] flex items-center gap-6 group hover:border-indigo-500/30 transition-all">
                <div className="w-16 h-16 bg-indigo-500/10 rounded-3xl flex items-center justify-center flex-shrink-0 border border-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform">
                    <CloudSun size={28} />
                </div>
                <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest mb-1">Cielo Oro Verde</h3>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-black text-white">18°C</span>
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Despejado</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
