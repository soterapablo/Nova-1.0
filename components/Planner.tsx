
import React, { useState } from 'react';
import { suggestObservationPlan } from '../services/geminiService';
import { Sparkles, Moon, Star, MapPin, Camera, Loader2, Info } from 'lucide-react';

export const Planner: React.FC = () => {
  const [conditions, setConditions] = useState('Cielo despejado, sin mucha contaminación lumínica');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        const result = await suggestObservationPlan(conditions);
        setPlan(result);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="space-y-6 fade-in">
        <div className="bg-slate-900/50 border border-slate-700 rounded-[2.5rem] p-8 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                    <Star size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">Astro-Planner IA</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Sugerencias dinámicas para Oro Verde</p>
                </div>
            </div>

            <form onSubmit={handleGeneratePlan} className="mt-8 space-y-4">
                <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Estado del cielo / Equipo disponible</label>
                    <textarea 
                        value={conditions}
                        onChange={(e) => setConditions(e.target.value)}
                        placeholder="Ej: Tengo un refractor de 80mm, cielo algo brumoso..."
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                        rows={2}
                    />
                </div>
                <button 
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3"
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <><Sparkles size={16} /> Consultar Cielo de Hoy</>}
                </button>
            </form>
        </div>

        {plan && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                {plan.suggestions.map((item: any, idx: number) => (
                    <div key={idx} className="bg-slate-900 border border-indigo-500/20 p-6 rounded-[2rem] flex flex-col justify-between hover:border-indigo-500/50 transition-all group">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-[8px] font-black bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded border border-indigo-500/20 uppercase">{item.type}</span>
                                <Info size={14} className="text-slate-600 group-hover:text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-black text-white mb-2">{item.name}</h3>
                            <p className="text-xs text-slate-400 italic leading-relaxed mb-6">"{item.reason}"</p>
                        </div>
                        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700">
                            <div className="flex items-center gap-2 mb-1">
                                <Camera size={12} className="text-indigo-400" />
                                <span className="text-[9px] font-black text-white uppercase tracking-widest">Tip de Foto</span>
                            </div>
                            <p className="text-[10px] text-slate-400">{item.photoTip}</p>
                        </div>
                    </div>
                ))}
            </div>
        )}

        <div className="bg-indigo-900/10 border border-indigo-500/10 p-6 rounded-[2rem] flex items-center gap-4">
            <div className="text-indigo-400"><MapPin size={24} /></div>
            <p className="text-xs text-slate-500 font-medium">Calculado para coordenadas: <span className="text-indigo-300 font-bold">31.8291° S, 60.5244° W</span> (Oro Verde)</p>
        </div>
    </div>
  );
};
