import React, { useState, useEffect } from 'react';
import { User, FacilityRequest } from '../types';
import { supabase } from '../services/supabaseClient';
import { 
  CalendarDays, Telescope, UserPlus, FileDown, Search, Loader2
} from 'lucide-react';

interface AgendaProps {
  user: User;
}

type AgendaTab = 'MY_ACT' | 'EXPLORE_ACT';

const mapRequest = (r: any): FacilityRequest => ({
  id: r.id,
  userId: r.user_id,
  attendeeIds: r.attendee_ids || [],
  facility: r.facility,
  date: r.date,
  timeStart: r.time_start,
  durationHours: r.duration_hours,
  purpose: r.purpose,
  status: r.status
});

export const Agenda: React.FC<AgendaProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<AgendaTab>('MY_ACT');
  const [allRequests, setAllRequests] = useState<FacilityRequest[]>([]);
  const [usersDb, setUsersDb] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [printingEvent, setPrintingEvent] = useState<FacilityRequest | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: reqData } = await supabase
        .from('facility_requests')
        .select('*')
        .order('date', { ascending: true });
      if (reqData) setAllRequests(reqData.map(mapRequest));

      const { data: usersData } = await supabase.from('profiles').select('*');
      if (usersData) {
        setUsersDb(usersData.map((d: any) => ({
          id: d.id, email: d.email, name: d.name, dni: d.dni,
          role: d.role, status: d.status, photoUrl: d.photo_url
        })));
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleJoinEvent = async (requestId: string) => {
    setJoiningId(requestId);
    const req = allRequests.find(r => r.id === requestId);
    if (!req) return;
    const attendees = req.attendeeIds || [];
    if (attendees.includes(user.id)) return;

    const newAttendees = [...attendees, user.id];
    const { error } = await supabase
      .from('facility_requests')
      .update({ attendee_ids: newAttendees })
      .eq('id', requestId);

    if (!error) {
      setAllRequests(allRequests.map(r =>
        r.id === requestId ? { ...r, attendeeIds: newAttendees } : r
      ));
    }
    setJoiningId(null);
  };

  const handlePrintReport = (req: FacilityRequest) => {
    setPrintingEvent(req);
    setTimeout(() => { window.print(); setPrintingEvent(null); }, 100);
  };

  const today = new Date().toISOString().split('T')[0];
  const myEvents = allRequests.filter(r => (r.userId === user.id || (r.attendeeIds && r.attendeeIds.includes(user.id))) && r.status === 'APPROVED' && r.date >= today);
  const exploreEvents = allRequests.filter(r => r.userId !== user.id && (!r.attendeeIds || !r.attendeeIds.includes(user.id)) && r.status === 'APPROVED' && r.date >= today);

  const getAttendeeNames = (req: FacilityRequest) => {
    const creator = usersDb.find(u => u.id === req.userId);
    const others = (req.attendeeIds || []).map(id => usersDb.find(u => u.id === id));
    return [creator, ...others].filter(Boolean) as User[];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Print Template (Hidden) */}
      {printingEvent && (
          <div className="hidden print:block fixed inset-0 bg-white text-black p-10 z-[9999]">
              <h1 className="text-3xl font-black uppercase border-b-4 border-black pb-4 mb-8 tracking-tighter">NOVA v1.0 — REPORTE</h1>
              <div className="space-y-6 text-black">
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

      <header className="mb-2">
        <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-2">
          <CalendarDays className="text-green-400" size={24} />
          Agenda Institucional
        </h2>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">
          Actividades y Agenda de socios • AEA Oro Verde
        </p>
      </header>

      {/* Tabs */}
      <div className="flex bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700 w-fit no-print">
        <button
          onClick={() => setActiveTab('MY_ACT')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'MY_ACT'
              ? 'bg-green-600 text-white shadow-lg shadow-green-900/40'
              : 'text-slate-500 hover:text-slate-200'
          }`}
        >
          Mi Agenda ({myEvents.length})
        </button>
        <button
          onClick={() => setActiveTab('EXPLORE_ACT')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'EXPLORE_ACT'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
              : 'text-slate-500 hover:text-slate-200'
          }`}
        >
          Explorar ({exploreEvents.length})
        </button>
      </div>

      <div className="no-print">
        {activeTab === 'MY_ACT' && (
          <div className="space-y-4">
            {myEvents.length === 0 ? (
              <div className="py-24 text-center border-2 border-dashed border-slate-800 rounded-[2.5rem] text-slate-600 font-bold uppercase tracking-widest text-xs">
                Tu agenda está vacía para los próximos días.
              </div>
            ) : (
              myEvents.map(req => (
                <div key={req.id} className="bg-slate-900/60 border border-slate-800 p-6 rounded-[2.5rem] flex items-center justify-between group hover:border-green-500/30 transition-all shadow-xl">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-all">
                      <Telescope size={28} />
                    </div>
                    <div>
                      <h4 className="text-white font-black text-lg">{req.facility}</h4>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{req.date} • {req.timeStart} hs</p>
                    </div>
                  </div>
                  <button onClick={() => handlePrintReport(req)} className="p-4 bg-slate-800 hover:bg-green-600 text-slate-400 hover:text-white rounded-2xl transition-all shadow-inner">
                    <FileDown size={22} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'EXPLORE_ACT' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {exploreEvents.length === 0 ? (
              <div className="col-span-2 py-24 text-center border-2 border-dashed border-slate-800 rounded-[2.5rem] text-slate-600 font-bold uppercase tracking-widest text-xs">
                No hay otras actividades públicas programadas.
              </div>
            ) : (
              exploreEvents.map(req => (
                <div key={req.id} className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] flex flex-col justify-between group hover:border-indigo-500/40 transition-all shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5"><Search size={80} /></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-white font-black text-xl leading-tight group-hover:text-indigo-300 transition-colors">{req.facility}</h4>
                      <span className="text-[8px] font-black bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-md border border-indigo-500/20 uppercase">Abierto</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">{req.date} • {req.timeStart} hs</p>
                    <p className="text-xs text-slate-400 leading-relaxed italic mb-8">"{req.purpose}"</p>
                  </div>
                  <button 
                    onClick={() => handleJoinEvent(req.id)} 
                    disabled={joiningId === req.id}
                    className={`w-full py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 relative z-10 ${
                      joiningId === req.id ? 'bg-slate-800 text-slate-500' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {joiningId === req.id ? <Loader2 size={16} className="animate-spin" /> : <><UserPlus size={14} /> Sumarme ahora</>}
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
