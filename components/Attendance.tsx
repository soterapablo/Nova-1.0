
import React, { useState, useEffect } from 'react';
import { getCurrentPosition, checkIsOnSite } from '../services/geoService';
import { AttendanceRecord, UserRole } from '../types';
import { MapPin, CheckCircle2, XCircle, RefreshCw, Loader2, Clock, ArrowRightLeft, Download, FileText, Table, Smartphone } from 'lucide-react';

export const Attendance: React.FC<{ userId: string; userDni: string; userRole: UserRole }> = ({ userId, userDni, userRole }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [message, setMessage] = useState('');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('global_attendance_log');
    if (saved) {
      const allRecords: AttendanceRecord[] = JSON.parse(saved);
      setRecords(allRecords.filter(r => r.userId === userId));
    }
  }, [userId]);

  const downloadExcel = () => {
    const headers = ["Tipo", "Fecha", "Hora", "Latitud", "Longitud"];
    const csvContent = [
      headers.join(","),
      ...records.map(r => [
        r.type === 'CHECK_IN' ? 'ENTRADA' : 'SALIDA',
        new Date(r.timestamp).toLocaleDateString('es-AR'),
        new Date(r.timestamp).toLocaleTimeString('es-AR'),
        r.location.lat,
        r.location.lng
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `asistencia_${userDni}.csv`);
    link.click();
  };

  const downloadPDF = () => {
    window.print();
  };

  const handleAttendance = async (type: 'CHECK_IN' | 'CHECK_OUT') => {
    setLoading(true);
    setStatus('IDLE');
    setMessage(`Activando GPS para validación puntual...`);

    try {
      // getCurrentPosition es una solicitud única, no continua.
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;

      const isOnSite = checkIsOnSite(latitude, longitude);
      
      if (isOnSite) {
        const newRecord: AttendanceRecord = {
          id: crypto.randomUUID(),
          userId,
          timestamp: Date.now(),
          type: type,
          location: { lat: latitude, lng: longitude }
        };

        const saved = localStorage.getItem('global_attendance_log');
        const allRecords = saved ? JSON.parse(saved) : [];
        const updatedGlobal = [newRecord, ...allRecords];
        localStorage.setItem('global_attendance_log', JSON.stringify(updatedGlobal));
        
        setRecords([newRecord, ...records]);
        setStatus('SUCCESS');
        setMessage(`${type === 'CHECK_IN' ? 'Entrada' : 'Salida'} registrada correctamente.`);
      } else {
        setStatus('ERROR');
        setMessage('Fuera de rango: Debes estar en el predio del Observatorio.');
      }
    } catch (error: any) {
      setStatus('ERROR');
      setMessage('Error de GPS: Asegúrate de tener la ubicación activada en tu dispositivo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Botones de acción rápida - SOLO VISIBLES PARA ADMIN */}
      {userRole === 'ADMIN' && (
        <div className="flex justify-end gap-2 no-print">
          <button onClick={downloadExcel} className="flex items-center gap-2 px-3 py-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded-lg text-xs font-bold hover:bg-green-600/30">
            <Table size={14} /> Excel
          </button>
          <button onClick={downloadPDF} className="flex items-center gap-2 px-3 py-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-bold hover:bg-indigo-600/30">
            <FileText size={14} /> PDF
          </button>
        </div>
      )}

      <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-md no-print">
        <div className="flex justify-between items-start mb-6">
            <div>
                <h2 className="text-2xl font-bold text-white flex items-center">
                    <MapPin className="mr-2 text-indigo-400" />
                    Marcado de Asistencia
                </h2>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Smartphone size={12} /> El GPS se activará solo durante la validación.
                </p>
            </div>
        </div>
        
        <div className="flex flex-col items-center justify-center py-10 bg-slate-800/20 rounded-2xl border border-dashed border-slate-700/50 relative overflow-hidden">
          {loading ? (
            <div className="text-center animate-pulse">
              <Loader2 size={48} className="animate-spin text-indigo-500 mx-auto mb-4" />
              <p className="text-indigo-300 text-sm font-medium">{message}</p>
            </div>
          ) : status === 'SUCCESS' ? (
            <div className="text-center fade-in">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                <CheckCircle2 size={32} className="text-green-500" />
              </div>
              <p className="text-green-400 text-sm font-bold">{message}</p>
              <button 
                onClick={() => setStatus('IDLE')} 
                className="mt-6 px-8 py-2 bg-slate-700 hover:bg-slate-600 transition-colors rounded-xl text-xs font-bold text-white shadow-lg"
              >
                Entendido
              </button>
            </div>
          ) : status === 'ERROR' ? (
            <div className="text-center fade-in px-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                <XCircle size={32} className="text-red-500" />
              </div>
              <p className="text-red-400 text-sm font-bold">{message}</p>
              <button 
                onClick={() => setStatus('IDLE')} 
                className="mt-6 px-8 py-2 bg-slate-700 hover:bg-slate-600 transition-colors rounded-xl text-xs font-bold text-white"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm px-6">
              <button 
                onClick={() => handleAttendance('CHECK_IN')} 
                className="flex-1 group relative py-6 bg-gradient-to-b from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 rounded-2xl font-black text-white shadow-xl shadow-indigo-900/20 transition-all active:scale-95"
              >
                <div className="flex flex-col items-center">
                    <Clock size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                    <span>ENTRADA</span>
                </div>
              </button>
              <button 
                onClick={() => handleAttendance('CHECK_OUT')} 
                className="flex-1 group py-6 bg-slate-800 hover:bg-slate-700 rounded-2xl font-black text-white border border-slate-700 transition-all active:scale-95"
              >
                <div className="flex flex-col items-center">
                    <ArrowRightLeft size={24} className="mb-2 group-hover:rotate-180 transition-transform duration-500" />
                    <span>SALIDA</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-md print-container">
        <h3 className="text-lg font-semibold text-white mb-4 print-only">Reporte de Asistencia - DNI: {userDni}</h3>
        <div className="flex items-center justify-between mb-4 no-print">
            <h3 className="text-lg font-semibold text-white">Tu Historial de Hoy</h3>
            <span className="text-[10px] text-slate-500 font-medium italic">Solo marcas validadas por GPS</span>
        </div>
        
        <div className="space-y-3">
          {records.length === 0 ? (
            <div className="text-center py-10 bg-slate-800/10 rounded-xl border border-dashed border-slate-800">
                <p className="text-slate-600 text-sm">No has registrado actividad todavía.</p>
            </div>
          ) : (
            records.map((record) => (
              <div key={record.id} className="flex justify-between items-center p-4 bg-slate-800/40 rounded-xl border border-slate-700/30 print-row hover:border-slate-600 transition-colors">
                <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${record.type === 'CHECK_IN' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                        {record.type === 'CHECK_IN' ? <Clock size={20} /> : <ArrowRightLeft size={20} />}
                    </div>
                    <div>
                        <p className="text-sm text-white font-bold">{record.type === 'CHECK_IN' ? 'Entrada Registrada' : 'Salida Registrada'}</p>
                        <p className="text-[10px] text-slate-400 font-medium">
                            {new Date(record.timestamp).toLocaleDateString('es-AR')} a las {new Date(record.timestamp).toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'})} hs
                        </p>
                    </div>
                </div>
                <div className="text-right hidden sm:block">
                    <div className="flex items-center justify-end text-[10px] text-indigo-400 font-mono gap-1">
                        <MapPin size={10} /> Ubicación validada
                    </div>
                    <div className="text-[8px] text-slate-600 font-mono">
                        {record.location.lat.toFixed(6)}, {record.location.lng.toFixed(6)}
                    </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
