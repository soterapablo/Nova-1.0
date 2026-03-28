
import React, { useState } from 'react';
import { FacilityType, FacilityRequest } from '../types';
import { supabase } from '../services/supabaseClient';
import { Calendar, Clock, Check, Star, CheckSquare, Square, Loader2 } from 'lucide-react';

export const Requests: React.FC<{ userId: string }> = ({ userId }) => {
  const [selectedFacilities, setSelectedFacilities] = useState<FacilityType[]>([]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(1);
  const [purpose, setPurpose] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const allFacilities = Object.values(FacilityType);

  const toggleFacility = (f: FacilityType) => {
    setSelectedFacilities(prev => 
      prev.includes(f) 
        ? prev.filter(item => item !== f) 
        : [...prev, f]
    );
  };

  const toggleAll = () => {
    if (selectedFacilities.length === allFacilities.length) {
      setSelectedFacilities([]);
    } else {
      setSelectedFacilities([...allFacilities]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFacilities.length === 0) {
        alert("Por favor, selecciona al menos una instalación o actividad.");
        return;
    }

    setSubmitted(true);
    
    try {
      const newRequests = selectedFacilities.map(f => ({
          user_id: userId,
          facility: f as string,
          date,
          time_start: time,
          duration_hours: duration,
          purpose,
          status: 'PENDING'
      }));

      const { error } = await supabase
        .from('facility_requests')
        .insert(newRequests);

      if (error) {
        console.error('Error saving requests:', error);
        alert('Error al guardar la solicitud: ' + error.message);
      } else {
        alert(`¡Solicitud enviada! Un administrador deberá aprobarla antes de que aparezca confirmada en tu panel.`);
      }

      setSubmitted(false);
      setPurpose('');
      setDate('');
      setTime('');
      setSelectedFacilities([]);
    } catch (err) {
      console.error(err);
      setSubmitted(false);
    }
  };

  return (
    <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-md fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
            <Star className="mr-2 text-yellow-400" />
            Programar actividades
        </h2>
        <button 
            type="button"
            onClick={toggleAll}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20"
        >
            {selectedFacilities.length === allFacilities.length ? <CheckSquare size={14} /> : <Square size={14} />}
            {selectedFacilities.length === allFacilities.length ? 'Desmarcar Todo' : 'Seleccionar Todo'}
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4 md:col-span-2">
            <label className="block text-sm font-medium text-slate-300">Instalaciones / instrumental requerido <span className="text-indigo-400 text-xs">({selectedFacilities.length} seleccionadas)</span></label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allFacilities.map((f) => (
                    <div 
                        key={f}
                        onClick={() => toggleFacility(f)}
                        className={`cursor-pointer border rounded-xl p-4 transition-all flex items-center justify-between group ${
                            selectedFacilities.includes(f) 
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                            : 'bg-slate-800/30 border-slate-700 text-slate-400 hover:border-slate-500 hover:bg-slate-800/50'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                selectedFacilities.includes(f) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600 group-hover:border-slate-400'
                            }`}>
                                {selectedFacilities.includes(f) && <Check size={14} className="text-white" />}
                            </div>
                            <span className="font-medium text-sm">{f}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Fecha</label>
            <div className="relative">
                <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-3 pl-10 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    style={{ colorScheme: 'dark' }}
                />
                <Calendar size={18} className="absolute left-3 top-3.5 text-indigo-400" />
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Hora de Inicio</label>
            <div className="relative">
                <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-3 pl-10 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    style={{ colorScheme: 'dark' }}
                />
                <Clock size={18} className="absolute left-3 top-3.5 text-indigo-400" />
            </div>
        </div>

        <div className="md:col-span-2">
             <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-300">Duración Estimada</label>
                <span className="text-indigo-400 font-bold text-sm">{duration} horas</span>
             </div>
             <input 
                type="range" 
                min="0.5" 
                max="12" 
                step="0.5" 
                value={duration} 
                onChange={(e) => setDuration(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
             />
             <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono">
                 <span>30 min</span>
                 <span>6h</span>
                 <span>12h</span>
             </div>
        </div>

        <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">Plan de Trabajo / Motivo</label>
            <textarea
                required
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={3}
                placeholder="Especifique los objetivos de la observación o mantenimiento..."
                className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            ></textarea>
        </div>

        <div className="md:col-span-2 pt-4">
            <button
                type="submit"
                disabled={submitted || selectedFacilities.length === 0}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed group"
            >
                {submitted ? (
                    <>
                        <Loader2 size={20} className="animate-spin mr-2" />
                        <span>Enviando solicitud...</span>
                    </>
                ) : (
                    <div className="flex items-center">
                        <span>Enviar Solicitud para Revisión</span>
                        <Check className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                    </div>
                )}
            </button>
            <p className="text-center text-[10px] text-slate-500 mt-4 italic">
                * Su solicitud será revisada por la administración.
            </p>
        </div>
      </form>
    </div>
  );
};
