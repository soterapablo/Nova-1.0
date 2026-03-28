import React, { useState, useEffect } from 'react';
import { IncidentReport } from '../types';
import { analyzeIncident } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';
import { AlertTriangle, Send, Sparkles, Activity } from 'lucide-react';

export const Incidents: React.FC<{ userId: string }> = ({ userId }) => {
  const [description, setDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [reports, setReports] = useState<IncidentReport[]>([]);

  useEffect(() => {
    const fetchReports = async () => {
      const { data, error } = await supabase
        .from('incident_reports')
        .select('*')
        .order('timestamp', { ascending: false });

      if (data && !error) {
        setReports(data.map((r: any) => ({
          id: r.id,
          userId: r.user_id,
          description: r.description,
          timestamp: r.timestamp,
          aiAnalysis: r.ai_severity ? {
            severity: r.ai_severity,
            summary: r.ai_summary,
            category: r.ai_category
          } : undefined
        })));
      }
    };
    fetchReports();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setAnalyzing(true);
    
    try {
        const analysis = await analyzeIncident(description);
        const now = Date.now();

        const { data: inserted, error } = await supabase
          .from('incident_reports')
          .insert([{
            user_id: userId,
            description,
            title: description.substring(0, 40) + '...',
            status: 'OPEN',
            timestamp: now,
            ai_severity: analysis?.severity || null,
            ai_summary: analysis?.summary || null,
            ai_category: analysis?.category || null
          }])
          .select()
          .single();

        if (error) {
          console.error("Error saving incident:", error);
          return;
        }
        
        const newReport: IncidentReport = {
            id: inserted.id,
            userId,
            description,
            timestamp: now,
            aiAnalysis: analysis
        };

        setReports([newReport, ...reports]);
        setDescription('');
    } catch (error) {
        console.error("Failed to analyze", error);
        const now = Date.now();

        const { data: inserted } = await supabase
          .from('incident_reports')
          .insert([{
            user_id: userId,
            description,
            timestamp: now
          }])
          .select()
          .single();

        const newReport: IncidentReport = {
            id: inserted?.id || crypto.randomUUID(),
            userId,
            description,
            timestamp: now
        };
        setReports([newReport, ...reports]);
        setDescription('');
    } finally {
        setAnalyzing(false);
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch(severity) {
        case 'CRITICAL': return 'bg-red-500 text-white border-red-400';
        case 'HIGH': return 'bg-orange-500 text-white border-orange-400';
        case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
        case 'LOW': return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
        default: return 'bg-slate-700 text-slate-300';
    }
  };

  return (
    <div className="space-y-8">
        <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-md">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
                <AlertTriangle className="mr-2 text-orange-400" />
                Reporte de Novedades
            </h2>
            <p className="text-slate-400 mb-6 text-sm">
                Reporta fallas técnicas, observaciones climáticas inusuales o incidentes de seguridad. 
                Nuestra IA analizará la prioridad automáticamente.
            </p>

            <form onSubmit={handleSubmit} className="relative">
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe lo sucedido con detalle..."
                    rows={4}
                    className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none pr-12"
                ></textarea>
                
                <div className="flex justify-end mt-2">
                    <button
                        type="submit"
                        disabled={analyzing || !description.trim()}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {analyzing ? (
                            <>
                                <Sparkles size={18} className="animate-spin" />
                                <span>Analizando...</span>
                            </>
                        ) : (
                            <>
                                <Send size={18} />
                                <span>Reportar</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>

        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white px-2">Novedades Recientes</h3>
            {reports.map((report) => (
                <div key={report.id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 hover:bg-slate-800/60 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-2">
                            <span className={`text-xs font-bold px-2 py-1 rounded border ${getSeverityColor(report.aiAnalysis?.severity)}`}>
                                {report.aiAnalysis?.severity || 'PENDIENTE'}
                            </span>
                            <span className="text-slate-500 text-xs">
                                {new Date(report.timestamp).toLocaleString('es-AR')}
                            </span>
                        </div>
                        {report.aiAnalysis && (
                            <span className="text-xs text-indigo-300 bg-indigo-900/30 px-2 py-0.5 rounded border border-indigo-500/20">
                                {report.aiAnalysis.category}
                            </span>
                        )}
                    </div>
                    
                    <p className="text-white text-sm mb-3">{report.description}</p>
                    
                    {report.aiAnalysis && (
                        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
                            <div className="flex items-start space-x-2">
                                <Activity size={16} className="text-indigo-400 mt-0.5" />
                                <div>
                                    <p className="text-xs font-semibold text-indigo-300 mb-1">Análisis IA</p>
                                    <p className="text-xs text-slate-400">{report.aiAnalysis.summary}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}
            
            {reports.length === 0 && (
                <div className="text-center py-10 text-slate-600 border border-dashed border-slate-800 rounded-xl">
                    <p>No hay novedades registradas.</p>
                </div>
            )}
        </div>
    </div>
  );
};
