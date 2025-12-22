
import React, { useState, useEffect } from 'react';
import { User, AttendanceRecord, FacilityRequest, Project } from '../types';
import { 
  ShieldCheck, Check, X, UserCog, Mail, ClipboardList, Clock, Download, 
  FileText, Table, Telescope, Calendar, User as UserIcon, Rocket, 
  FileDown, Users, Sparkles, Briefcase, Search 
} from 'lucide-react';

interface AdminPanelProps {
  users: User[];
  onUpdateStatus: (userId: string, status: 'APPROVED' | 'REJECTED') => void;
}

type AdminTab = 'USERS' | 'LOGS' | 'REQUESTS' | 'PROJECTS';

export const AdminPanel: React.FC<AdminPanelProps> = ({ users, onUpdateStatus }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('USERS');
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>([]);
  const [facilityRequests, setFacilityRequests] = useState<FacilityRequest[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [printingProject, setPrintingProject] = useState<Project | null>(null);

  useEffect(() => {
    const savedLogs = localStorage.getItem('global_attendance_log');
    if (savedLogs) setAttendanceLogs(JSON.parse(savedLogs));
    
    const savedRequests = localStorage.getItem('facility_requests');
    if (savedRequests) setFacilityRequests(JSON.parse(savedRequests));

    const savedProjects = localStorage.getItem('institutional_projects');
    if (savedRequests) setProjects(JSON.parse(savedProjects)); // Note: Fix if projects saved elsewhere
    
    // Recovery check for projects specifically
    const savedInstitutionalProjects = localStorage.getItem('institutional_projects');
    if (savedInstitutionalProjects) setProjects(JSON.parse(savedInstitutionalProjects));
  }, []);

  const getUserName = (id: string) => users.find(u => u.id === id)?.name || "Desconocido";
  const getUserDni = (id: string) => users.find(u => u.id === id)?.dni || "---";

  const handleUpdateRequestStatus = (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    const updated = facilityRequests.map(r => r.id === requestId ? { ...r, status } : r);
    setFacilityRequests(updated);
    localStorage.setItem('facility_requests', JSON.stringify(updated));
  };

  const handlePrintProject = (project: Project) => {
    setPrintingProject(project);
    setTimeout(() => {
        window.print();
        setPrintingProject(null);
    }, 200);
  };

  const downloadGlobalExcel = () => {
    const headers = ["Nombre", "DNI", "Tipo", "Fecha", "Hora", "Lat", "Lng"];
    const csvContent = [
      headers.join(","),
      ...attendanceLogs.map(log => [
        getUserName(log.userId),
        getUserDni(log.userId),
        log.type === 'CHECK_IN' ? 'ENTRADA' : 'SALIDA',
        new Date(log.timestamp).toLocaleDateString('es-AR'),
        new Date(log.timestamp).toLocaleTimeString('es-AR'),
        log.location.lat,
        log.location.lng
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_global_asistencia.csv`);
    link.click();
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Template de Impresión de Proyecto (Oculto en UI) */}
      {printingProject && (
          <div className="hidden print:block fixed inset-0 bg-white text-black p-12 z-[9999] font-serif">
              <div className="border-b-4 border-black pb-4 mb-8 flex justify-between items-end">
                  <div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase italic">NOVA v1.0</h1>
                    <p className="text-sm font-bold uppercase tracking-widest text-slate-600">Documentación Técnica de Proyecto</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold">{new Date().toLocaleDateString('es-AR')}</p>
                    <p className="text-[10px] text-slate-500 uppercase">Ref ID: {printingProject.id.split('-')[0]}</p>
                  </div>
              </div>

              <div className="space-y-8">
                  <section>
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Título de la Investigación / Obra</h2>
                    <p className="text-3xl font-bold border-l-8 border-black pl-6 py-2">{printingProject.title}</p>
                  </section>

                  <div className="grid grid-cols-2 gap-12">
                      <section>
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Estado Actual</h2>
                        <div className="inline-block border-2 border-black px-4 py-1 font-bold uppercase text-sm">
                            {printingProject.status}
                        </div>
                      </section>
                      <section>
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Líder del Proyecto</h2>
                        <p className="font-bold text-lg">{getUserName(printingProject.creatorId)}</p>
                        <p className="text-xs font-mono text-slate-600">DNI: {getUserDni(printingProject.creatorId)}</p>
                      </section>
                  </div>

                  <section>
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Descripción del Proyecto</h2>
                    <p className="text-sm leading-relaxed text-justify bg-slate-50 p-6 rounded-lg italic">"{printingProject.description}"</p>
                  </section>

                  <section>
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Objetivos Científicos</h2>
                    <p className="text-sm leading-relaxed">{printingProject.objectives}</p>
                  </section>

                  {printingProject.aiEvaluation && (
                      <section className="bg-slate-100 border-2 border-slate-200 p-8 rounded-3xl">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white"><Sparkles size={16} /></div>
                            <h2 className="text-xs font-black uppercase tracking-[0.2em]">Evaluación de Factibilidad NOVA IA</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-8 mb-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase text-slate-500">Categoría</p>
                                <p className="font-bold">{printingProject.aiEvaluation.category}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase text-slate-500">Índice de Viabilidad</p>
                                <p className="font-bold">{printingProject.aiEvaluation.feasibilityScore}%</p>
                            </div>
                        </div>
                        <p className="text-xs font-bold border-t border-slate-300 pt-4">Sugerencia Estratégica:</p>
                        <p className="text-sm italic mt-1">"{printingProject.aiEvaluation.strategicSuggestion}"</p>
                      </section>
                  )}

                  <section className="mt-12 pt-12 border-t border-slate-200">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Equipo de Trabajo</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="border-b pb-1 text-xs"><strong>{getUserName(printingProject.creatorId)}</strong> (Líder)</div>
                        {printingProject.collaboratorIds.map(id => (
                            <div key={id} className="border-b pb-1 text-xs">{getUserName(id)} (Colaborador)</div>
                        ))}
                    </div>
                  </section>
              </div>

              <div className="absolute bottom-12 left-12 right-12 flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-400">
                  <span>Asociación Entrerriana de Astronomía</span>
                  <span>Observatorio Oro Verde — Documento de Uso Interno</span>
              </div>
          </div>
      )}

      {/* Header del Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 no-print">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-500/20 rounded-xl">
              <ShieldCheck className="text-indigo-400 w-8 h-8" />
          </div>
          <div>
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">Panel Admin</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Gestión de Activos Institucionales</p>
          </div>
        </div>

        <div className="flex bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
            <button onClick={() => setActiveTab('USERS')} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'USERS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-500 hover:text-slate-200'}`}>Miembros</button>
            <button onClick={() => setActiveTab('REQUESTS')} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'REQUESTS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-500 hover:text-slate-200'}`}>Solicitudes</button>
            <button onClick={() => setActiveTab('PROJECTS')} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'PROJECTS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-500 hover:text-slate-200'}`}>Proyectos</button>
            <button onClick={() => setActiveTab('LOGS')} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'LOGS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-500 hover:text-slate-200'}`}>Asistencia</button>
        </div>
      </div>

      {/* CONTENIDO DE PESTAÑAS */}
      <div className="no-print">
        {activeTab === 'USERS' && (
            <div className="space-y-6">
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
                    <h3 className="text-lg font-black text-white uppercase tracking-widest mb-8">Nuevos Registros Pendientes</h3>
                    <div className="space-y-4">
                        {users.filter(u => u.status === 'PENDING').length === 0 ? (
                            <div className="py-12 text-center text-slate-600 font-bold border-2 border-dashed border-slate-800 rounded-3xl uppercase tracking-widest text-[10px]">No hay registros en espera.</div>
                        ) : (
                            users.filter(u => u.status === 'PENDING').map(u => (
                                <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-slate-800/40 border border-slate-700 rounded-2xl gap-6 hover:border-indigo-500/30 transition-all">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-xl">
                                            {u.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-white font-black text-lg">{u.name}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{u.email} • DNI: {u.dni}</p>
                                            <span className="inline-block mt-2 px-3 py-1 rounded-lg bg-indigo-500/10 text-[8px] font-black text-indigo-400 uppercase tracking-widest border border-indigo-500/20">{u.role}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={() => onUpdateStatus(u.id, 'APPROVED')} className="flex-1 sm:flex-none px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2">
                                            <Check size={16} /> Aprobar
                                        </button>
                                        <button onClick={() => onUpdateStatus(u.id, 'REJECTED')} className="flex-1 sm:flex-none px-6 py-3 bg-slate-800 hover:bg-red-900/40 text-slate-500 hover:text-red-400 border border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                                            <X size={16} /> Rechazar
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'PROJECTS' && (
            <div className="space-y-6">
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-lg font-black text-white uppercase tracking-widest">Gestión de Proyectos NOVA</h3>
                      <div className="bg-slate-800 p-2 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">{projects.length} Registrados</div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                        {projects.length === 0 ? (
                            <div className="py-20 text-center text-slate-600 font-bold border-2 border-dashed border-slate-800 rounded-[2.5rem] uppercase tracking-widest text-[10px]">No hay proyectos en la base de datos.</div>
                        ) : (
                            projects.map(proj => (
                                <div key={proj.id} className="bg-slate-800/40 border border-slate-700 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-purple-500/30 transition-all">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/20"><Rocket size={24} /></div>
                                        <div>
                                            <h4 className="text-white font-black text-xl tracking-tight">{proj.title}</h4>
                                            <div className="flex items-center gap-4 mt-1">
                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                                    <UserIcon size={12} /> Líder: {getUserName(proj.creatorId)}
                                                </span>
                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                                    <Users size={12} /> {proj.collaboratorIds.length + 1} Equipo
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <button 
                                          onClick={() => handlePrintProject(proj)}
                                          className="flex-1 md:flex-none px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3"
                                        >
                                          <FileDown size={18} /> Documentar PDF
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'REQUESTS' && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-black text-white uppercase tracking-widest">Solicitudes para realizar actividades</h3>
                    <span className="px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                        {facilityRequests.filter(r => r.status === 'PENDING').length} Por revisar
                    </span>
                </div>
                
                <div className="space-y-4">
                    {facilityRequests.length === 0 ? (
                        <div className="py-20 text-center text-slate-600 font-bold border-2 border-dashed border-slate-800 rounded-[2.5rem] uppercase tracking-widest text-[10px]">Sin solicitudes pendientes.</div>
                    ) : (
                        facilityRequests.map(req => (
                            <div key={req.id} className={`p-6 rounded-3xl border transition-all ${
                                req.status === 'PENDING' ? 'bg-indigo-500/5 border-indigo-500/30' : 
                                req.status === 'APPROVED' ? 'bg-slate-800/40 border-slate-700' : 
                                'bg-slate-900 border-slate-800 opacity-50'
                            }`}>
                                <div className="flex flex-col lg:flex-row justify-between gap-6">
                                    <div className="space-y-4 flex-1">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700 shadow-inner">
                                                <Telescope size={22} className="text-indigo-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-white font-black text-lg tracking-tight uppercase italic">{req.facility}</h4>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                        <UserIcon size={12} /> {getUserName(req.userId)}
                                                    </span>
                                                    <span className="text-[9px] text-slate-600 font-black">DNI: {getUserDni(req.userId)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-3">
                                            <div className="bg-slate-900/50 border border-slate-700 px-4 py-2 rounded-xl flex items-center gap-2">
                                                <Calendar size={14} className="text-slate-500" />
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{req.date}</span>
                                            </div>
                                            <div className="bg-slate-900/50 border border-slate-700 px-4 py-2 rounded-xl flex items-center gap-2">
                                                <Clock size={14} className="text-slate-500" />
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{req.timeStart} ({req.durationHours}h)</span>
                                            </div>
                                            <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${
                                                req.status === 'PENDING' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' :
                                                req.status === 'APPROVED' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                                                'bg-red-500/10 border-red-500/30 text-red-400'
                                            }`}>
                                                <span className="text-[10px] font-black uppercase tracking-widest">
                                                    {req.status === 'PENDING' ? 'Pendiente' : req.status === 'APPROVED' ? 'Aprobada' : 'Rechazada'}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-400 leading-relaxed italic border-l-2 border-slate-700 pl-4 py-1">"{req.purpose}"</p>
                                    </div>

                                    {req.status === 'PENDING' && (
                                        <div className="flex lg:flex-col gap-3 justify-center">
                                            <button 
                                                onClick={() => handleUpdateRequestStatus(req.id, 'APPROVED')}
                                                className="flex-1 lg:w-36 px-4 py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl shadow-green-900/20"
                                            >
                                                <Check size={18} /> Aprobar
                                            </button>
                                            <button 
                                                onClick={() => handleUpdateRequestStatus(req.id, 'REJECTED')}
                                                className="flex-1 lg:w-36 px-4 py-4 bg-slate-800 hover:bg-red-900/40 text-slate-500 hover:text-red-400 border border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                            >
                                                <X size={18} /> Rechazar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}

        {activeTab === 'LOGS' && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3">
                        <ClipboardList className="text-indigo-400" size={24} />
                        Historial de Asistencia
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={downloadGlobalExcel} title="Exportar CSV" className="p-3 bg-slate-800 hover:bg-slate-700 text-green-400 border border-slate-700 rounded-xl transition-all">
                            <Table size={20} />
                        </button>
                        <button onClick={() => window.print()} title="Imprimir Listado" className="p-3 bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 rounded-xl transition-all">
                            <FileText size={20} />
                        </button>
                    </div>
                </div>
                
                <div className="overflow-x-auto -mx-8 px-8">
                    <table className="w-full text-left">
                        <thead className="bg-slate-800/80 text-slate-400 uppercase text-[9px] font-black tracking-[0.2em]">
                            <tr>
                                <th className="px-6 py-4 rounded-tl-2xl">Miembro</th>
                                <th className="px-6 py-4">Evento</th>
                                <th className="px-6 py-4">Cronología</th>
                                <th className="px-6 py-4 rounded-tr-2xl">Status GPS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {attendanceLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center text-slate-600 font-bold uppercase tracking-widest text-[10px]">No hay marcas registradas.</td>
                                </tr>
                            ) : (
                                attendanceLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-indigo-500/5 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-black text-indigo-400 border border-slate-700">{getUserName(log.userId).charAt(0)}</div>
                                                <div className="flex flex-col">
                                                    <span className="text-white font-black text-sm tracking-tight">{getUserName(log.userId)}</span>
                                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">DNI: {getUserDni(log.userId)}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`text-[9px] font-black px-3 py-1 rounded-lg border uppercase tracking-widest ${log.type === 'CHECK_IN' ? 'text-green-400 border-green-500/20 bg-green-500/5' : 'text-orange-400 border-orange-500/20 bg-orange-500/5'}`}>
                                                {log.type === 'CHECK_IN' ? 'Entrada' : 'Salida'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-slate-300 font-bold">{new Date(log.timestamp).toLocaleDateString('es-AR')}</span>
                                                <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString('es-AR')} hs</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
                                              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Validado</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
