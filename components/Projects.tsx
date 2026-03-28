import React, { useState, useEffect } from 'react';
import { User, Project } from '../types';
import { analyzeProject } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';
import {
  Rocket, Plus, Loader2, Sparkles, Users, ArrowLeft, UserPlus, Check,
  Target, FileText, Calendar
} from 'lucide-react';

interface ProjectsProps {
  user: User;
}

const mapProject = (p: any): Project => ({
  id: p.id,
  creatorId: p.creator_id,
  collaboratorIds: p.collaborator_ids || [],
  title: p.title,
  description: p.description,
  objectives: p.objectives,
  status: p.status,
  timestamp: p.timestamp,
  aiEvaluation: p.ai_feasibility_score != null ? {
    feasibilityScore: p.ai_feasibility_score,
    category: p.ai_category || '',
    strategicSuggestion: p.ai_strategic_suggestion || ''
  } : undefined
});

export const Projects: React.FC<ProjectsProps> = ({ user }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [usersDb, setUsersDb] = useState<User[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '', objectives: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: projData } = await supabase
        .from('projects')
        .select('*')
        .order('timestamp', { ascending: false });
      if (projData) setProjects(projData.map(mapProject));

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

  const getUserName = (id: string) => usersDb.find(u => u.id === id)?.name || 'Desconocido';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const evaluation = await analyzeProject(newProject.title, newProject.description, newProject.objectives);
      const now = Date.now();
      const { data: inserted, error } = await supabase
        .from('projects')
        .insert([{
          creator_id: user.id,
          collaborator_ids: [],
          title: newProject.title,
          description: newProject.description,
          objectives: newProject.objectives,
          status: 'IDEA',
          timestamp: now,
          ai_feasibility_score: evaluation?.feasibilityScore || null,
          ai_category: evaluation?.category || null,
          ai_strategic_suggestion: evaluation?.strategicSuggestion || null
        }])
        .select()
        .single();

      if (!error && inserted) {
        const created = mapProject(inserted);
        setProjects([created, ...projects]);
        setSelectedProject(created);
      }
      setNewProject({ title: '', description: '', objectives: '' });
      setShowModal(false);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async (projectId: string) => {
    setJoiningId(projectId);
    const project = projects.find(p => p.id === projectId);
    if (!project || project.collaboratorIds.includes(user.id) || project.creatorId === user.id) {
      setJoiningId(null);
      return;
    }
    const newCollaborators = [...project.collaboratorIds, user.id];
    const { error } = await supabase
      .from('projects')
      .update({ collaborator_ids: newCollaborators })
      .eq('id', projectId);

    if (!error) {
      const updated = projects.map(p =>
        p.id === projectId ? { ...p, collaboratorIds: newCollaborators } : p
      );
      setProjects(updated);
      setSelectedProject(updated.find(p => p.id === projectId) || null);
    }
    setJoiningId(null);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'COMPLETED': return 'bg-green-500/15 text-green-400 border-green-500/30';
      default: return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return 'En Progreso';
      case 'COMPLETED': return 'Completado';
      default: return 'Idea';
    }
  };

  const isMyProject = (p: Project) => p.creatorId === user.id || p.collaboratorIds.includes(user.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="animate-spin text-purple-500" size={32} />
      </div>
    );
  }

  // ============ DETAIL VIEW ============
  if (selectedProject) {
    const p = selectedProject;
    const isMember = isMyProject(p);
    const isLeader = p.creatorId === user.id;

    return (
      <div className="space-y-6 fade-in">
        {/* Back button */}
        <button
          onClick={() => setSelectedProject(null)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Volver a Proyectos
        </button>

        {/* Project Header */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className={`text-[9px] font-black px-3 py-1.5 rounded-xl uppercase border tracking-widest ${getStatusStyle(p.status)}`}>
                {getStatusLabel(p.status)}
              </span>
              {p.aiEvaluation && (
                <span className="text-[9px] font-black px-3 py-1.5 rounded-xl uppercase border tracking-widest bg-purple-500/10 text-purple-400 border-purple-500/20">
                  {p.aiEvaluation.category}
                </span>
              )}
              {isLeader && (
                <span className="text-[9px] font-black px-3 py-1.5 rounded-xl uppercase border tracking-widest bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                  Sos el Líder
                </span>
              )}
              {isMember && !isLeader && (
                <span className="text-[9px] font-black px-3 py-1.5 rounded-xl uppercase border tracking-widest bg-green-500/10 text-green-400 border-green-500/20">
                  Sos Socio
                </span>
              )}
            </div>

            <h2 className="text-3xl font-black text-white tracking-tight mb-2">{p.title}</h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2">
              <Calendar size={12} />
              Creado el {new Date(p.timestamp).toLocaleDateString('es-AR')}
            </p>
          </div>
        </div>

        {/* Description & Objectives */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-8">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={16} className="text-slate-400" />
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">Descripción</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{p.description}</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-8">
            <div className="flex items-center gap-2 mb-4">
              <Target size={16} className="text-slate-400" />
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">Objetivos</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{p.objectives}</p>
          </div>
        </div>

        {/* AI Evaluation */}
        {p.aiEvaluation && (
          <div className="bg-purple-900/10 border border-purple-500/20 rounded-[2rem] p-8 relative overflow-hidden">
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles size={16} className="text-purple-400" />
                <h3 className="text-xs font-black text-purple-300 uppercase tracking-widest">Evaluación de Factibilidad NOVA IA</h3>
              </div>
              <div className="flex items-center gap-6 mb-6">
                <div className="text-center">
                  <div className="text-4xl font-black text-white">{p.aiEvaluation.feasibilityScore}%</div>
                  <p className="text-[9px] text-purple-300 font-black uppercase tracking-widest mt-1">Viabilidad</p>
                </div>
                <div className="flex-1">
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-1000"
                      style={{ width: `${p.aiEvaluation.feasibilityScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-900/50 rounded-2xl p-5 border border-purple-500/10">
                <p className="text-[10px] font-black text-purple-300 uppercase tracking-widest mb-2">Sugerencia Estratégica</p>
                <p className="text-sm text-slate-300 leading-relaxed italic">"{p.aiEvaluation.strategicSuggestion}"</p>
              </div>
            </div>
          </div>
        )}

        {/* Team */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-slate-400" />
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">Equipo ({p.collaboratorIds.length + 1})</h3>
            </div>
          </div>
          <div className="space-y-3">
            {/* Leader */}
            <div className="flex items-center gap-4 p-4 bg-slate-800/40 rounded-2xl border border-slate-700/30">
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white font-black text-sm shadow-lg">
                {getUserName(p.creatorId).charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">{getUserName(p.creatorId)}</p>
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Líder del Proyecto</p>
              </div>
              <span className="text-[8px] font-black text-purple-400 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20 uppercase">Líder</span>
            </div>
            {/* Collaborators */}
            {p.collaboratorIds.map(id => (
              <div key={id} className="flex items-center gap-4 p-4 bg-slate-800/40 rounded-2xl border border-slate-700/30">
                <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-slate-300 font-black text-sm shadow-lg">
                  {getUserName(id).charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-sm">{getUserName(id)}</p>
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Colaborador</p>
                </div>
              </div>
            ))}
          </div>

          {/* Join Button */}
          {!isMember && (
            <button
              onClick={() => handleJoin(p.id)}
              disabled={joiningId === p.id}
              className="w-full mt-6 py-5 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-3"
            >
              {joiningId === p.id ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <><UserPlus size={16} /> Sumarme a este Proyecto</>
              )}
            </button>
          )}

          {isMember && (
            <div className="mt-6 py-4 text-center text-[10px] font-black text-green-400 uppercase tracking-widest flex items-center justify-center gap-2 bg-green-500/5 rounded-2xl border border-green-500/20">
              <Check size={14} /> Ya sos parte de este equipo
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============ LIST VIEW (Cards) ============
  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-2">
            <Rocket className="text-purple-400" size={24} />
            Proyectos NOVA
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">
            {projects.length} proyectos institucionales
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all flex items-center gap-2"
        >
          <Plus size={14} /> Nueva Propuesta
        </button>
      </div>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.length === 0 ? (
          <div className="col-span-3 py-24 text-center border-2 border-dashed border-slate-800 rounded-[2.5rem] text-slate-600 font-bold uppercase tracking-widest text-xs">
            No hay proyectos todavía. ¡Sé el primero en proponer una idea!
          </div>
        ) : (
          projects.map(project => (
            <div
              key={project.id}
              onClick={() => setSelectedProject(project)}
              className="cursor-pointer bg-slate-900/60 border border-slate-800 rounded-[2rem] p-6 hover:border-purple-500/40 hover:bg-slate-900/80 transition-all group relative overflow-hidden"
            >
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-purple-600/5 rounded-full blur-2xl group-hover:bg-purple-600/15 transition-all"></div>

              <div className="relative z-10">
                {/* Status + My badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[8px] font-black px-2 py-1 rounded-lg uppercase border tracking-tighter ${getStatusStyle(project.status)}`}>
                    {getStatusLabel(project.status)}
                  </span>
                  {isMyProject(project) && (
                    <span className="text-[8px] font-black px-2 py-1 rounded-lg uppercase border tracking-tighter bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                      {project.creatorId === user.id ? 'Líder' : 'Socio'}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-lg font-black text-white leading-tight mb-2 group-hover:text-purple-300 transition-colors line-clamp-2">
                  {project.title}
                </h3>

                {/* Short description */}
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-4">
                  {project.description}
                </p>

                {/* Footer: creator + members + AI score */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-purple-600/30 flex items-center justify-center text-[9px] text-purple-300 font-black">
                      {getUserName(project.creatorId).charAt(0)}
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold truncate max-w-[80px]">{getUserName(project.creatorId)}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-600 font-bold flex items-center gap-1">
                      <Users size={11} /> {project.collaboratorIds.length + 1}
                    </span>
                    {project.aiEvaluation && (
                      <span className="text-[10px] font-black text-purple-400 flex items-center gap-1">
                        <Sparkles size={10} /> {project.aiEvaluation.feasibilityScore}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Nuevo Proyecto */}
      {showModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl"></div>
            <h4 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase italic">Lanzar Idea</h4>
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-10">Nuestra IA procesará la viabilidad científica.</p>
            <form onSubmit={handleCreate} className="space-y-6 relative z-10">
              <input required value={newProject.title} onChange={e => setNewProject({ ...newProject, title: e.target.value })} placeholder="Título del Proyecto" className="w-full bg-slate-800 border border-slate-700 p-5 rounded-2xl text-white outline-none focus:ring-2 focus:ring-purple-500 font-bold placeholder-slate-600" />
              <textarea required value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} placeholder="Describe el alcance y los recursos..." rows={3} className="w-full bg-slate-800 border border-slate-700 p-5 rounded-2xl text-white outline-none focus:ring-2 focus:ring-purple-500 resize-none font-medium placeholder-slate-600" />
              <textarea required value={newProject.objectives} onChange={e => setNewProject({ ...newProject, objectives: e.target.value })} placeholder="Objetivos científicos clave..." rows={2} className="w-full bg-slate-800 border border-slate-700 p-5 rounded-2xl text-white outline-none focus:ring-2 focus:ring-purple-500 resize-none font-medium placeholder-slate-600" />
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-5 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:text-white transition-all">Cancelar</button>
                <button type="submit" disabled={isCreating} className="flex-1 py-5 bg-purple-600 hover:bg-purple-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-2xl transition-all flex items-center justify-center gap-3">
                  {isCreating ? <Loader2 size={18} className="animate-spin" /> : <><Sparkles size={16} /> Lanzar Propuesta</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
