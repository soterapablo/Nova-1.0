import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { ArrowRight, ShieldAlert, LogIn, UserPlus, Eye, EyeOff, Lock, Sparkles, ShieldCheck, User as UserIcon, AlertCircle, Mail, Loader2 } from 'lucide-react';
import { authService } from '../services/authService';

interface LoginProps {
  onLogin: (user: User, isDemo?: boolean) => void;
  usersDb: User[];
  onRegister: (newUser: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, usersDb, onRegister }) => {
  const [step, setStep] = useState<'INIT' | 'EMAIL' | 'PASSWORD' | 'REGISTER'>('INIT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [dni, setDni] = useState('');
  const [role, setRole] = useState<UserRole>('STAFF');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDemoLogin = (type: 'ADMIN' | 'STAFF') => {
    const demoUser: User = {
        id: `demo-${type.toLowerCase()}-${Date.now()}`,
        name: type === 'ADMIN' ? 'Administrador de Pruebas' : 'Personal de Pruebas',
        email: `demo-${type.toLowerCase()}@test.com`,
        dni: '00000000',
        role: type,
        status: 'APPROVED',
        photoUrl: `https://ui-avatars.com/api/?name=Demo+${type}&background=F59E0B&color=fff`
    };
    onLogin(demoUser, true);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const { user, error: loginError } = await authService.login(email, password);
    setIsLoading(false);

    if (loginError) {
        setError(loginError);
    } else if (user) {
        if (user.status === 'REJECTED') {
            setError("Tu perfil ha sido rechazado o bloqueado.");
            return;
        }
        onLogin(user, false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dni.trim()) { setError("El DNI es obligatorio."); return; }
    
    setIsLoading(true);
    setError('');
    const { user, error: registerError } = await authService.register(email, dni, role);
    setIsLoading(false);

    if (registerError) {
        if (registerError.includes("already registered")) {
            setError("Este correo ya está registrado.");
        } else {
            setError(registerError);
        }
    } else if (user) {
        onRegister(user);
    }
  };

  return (
    <div className="w-full flex justify-center items-center py-10 px-4">
        {step === 'INIT' && (
            <div className="w-full max-w-md bg-slate-900/60 border border-slate-700/50 backdrop-blur-2xl rounded-[3rem] shadow-2xl p-10 relative overflow-hidden">
                <div className="text-center mb-10">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <Sparkles className="text-indigo-400" size={32} />
                        <h2 className="text-5xl font-black text-white tracking-tighter">NOVA</h2>
                    </div>
                    <p className="text-slate-500 font-bold tracking-widest text-[10px] uppercase">Observatorio Oro Verde • AEA</p>
                </div>

                <div className="space-y-3">
                    <button onClick={() => { setStep('EMAIL'); setError(''); setEmail(''); }} className="w-full group bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 px-6 rounded-2xl flex items-center justify-between transition-all transform active:scale-95 shadow-xl shadow-indigo-900/40">
                        <div className="flex items-center gap-3">
                            <LogIn size={20} />
                            <span className="text-sm uppercase tracking-widest">Iniciar Sesión</span>
                        </div>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button onClick={() => { setStep('REGISTER'); setError(''); setEmail(''); }} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-5 px-6 rounded-2xl flex items-center justify-between transition-all transform active:scale-95 border border-slate-700">
                        <div className="flex items-center gap-3">
                            <UserPlus size={20} className="text-indigo-400" />
                            <span className="text-sm uppercase tracking-widest">Crear Cuenta</span>
                        </div>
                    </button>

                    <div className="relative flex items-center py-6">
                        <div className="flex-grow border-t border-slate-800"></div>
                        <span className="flex-shrink mx-4 text-slate-700 text-[10px] font-black uppercase tracking-widest">Sandbox de Pruebas</span>
                        <div className="flex-grow border-t border-slate-800"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => handleDemoLogin('ADMIN')} className="bg-amber-600/10 hover:bg-amber-600/20 border border-amber-500/20 p-4 rounded-2xl text-amber-500 transition-all flex flex-col items-center gap-1 group">
                            <ShieldCheck size={20} />
                            <span className="text-[10px] font-black uppercase">Demo Admin</span>
                        </button>
                        <button onClick={() => handleDemoLogin('STAFF')} className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700 p-4 rounded-2xl text-slate-400 transition-all flex flex-col items-center gap-1">
                            <UserIcon size={20} />
                            <span className="text-[10px] font-black uppercase">Demo Staff</span>
                        </button>
                    </div>
                </div>
            </div>
        )}

        {step === 'EMAIL' && (
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl p-10 text-slate-900">
                <div className="text-center mb-10">
                    <h2 className="text-2xl font-black tracking-tighter uppercase">Identifícate</h2>
                    <p className="text-xs text-slate-500 mt-1">Ingresa tu correo asociado</p>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); setStep('PASSWORD'); }} className="space-y-6">
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 focus:ring-2 focus:ring-indigo-500 outline-none font-bold" placeholder="ej: astrónomo@oro-verde.com" autoFocus />
                    <div className="flex justify-between items-center pt-2">
                        <button type="button" onClick={() => setStep('INIT')} className="text-slate-400 font-black text-[10px] uppercase hover:text-slate-600 transition-colors">Atrás</button>
                        <button type="submit" disabled={!email} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black text-xs uppercase shadow-lg shadow-indigo-200 disabled:opacity-50 transition-all">Siguiente</button>
                    </div>
                </form>
            </div>
        )}

        {step === 'PASSWORD' && (
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl p-10 text-slate-900">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100">
                        <Lock className="text-indigo-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-black tracking-tighter uppercase">Contraseña</h2>
                    <p className="text-xs text-slate-500">Si no la cambiaste, es tu DNI</p>
                </div>
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    <div className="relative">
                        <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500" placeholder="••••••••" autoFocus />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-slate-400">
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    {error && <p className="text-red-600 text-[10px] font-black uppercase flex items-center gap-2 font-bold"><ShieldAlert size={14} /> {error}</p>}
                    <div className="flex justify-between items-center pt-2">
                        <button type="button" onClick={() => setStep('EMAIL')} className="text-slate-400 font-black text-[10px] uppercase hover:text-slate-600 transition-colors">Atrás</button>
                        <button type="submit" disabled={isLoading} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black text-xs uppercase shadow-lg disabled:opacity-50 flex items-center gap-2 transition-all">
                            {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Entrar'}
                        </button>
                    </div>
                </form>
            </div>
        )}

        {step === 'REGISTER' && (
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-[3rem] p-10 text-white shadow-2xl">
                <div className="mb-8">
                    <h2 className="text-3xl font-black tracking-tighter italic">Solicitud Alta</h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Completa tus datos reales</p>
                </div>
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Correo de Contacto</label>
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej: pablo@aea.org" autoFocus />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">DNI Requerido (Sin puntos)</label>
                        <input type="text" required value={dni} onChange={(e) => setDni(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej: 26809562" />
                    </div>
                    <div className="pt-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Rol Institucional</label>
                        <div className="grid grid-cols-1 gap-2">
                            {(['RESEARCHER', 'STAFF'] as const).map((r) => (
                                <button key={r} type="button" onClick={() => setRole(r)} className={`text-xs py-4 px-4 rounded-xl border font-black uppercase tracking-widest transition-all ${role === r ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-900/40' : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}>
                                    {r === 'RESEARCHER' ? 'Astrónomo / Investigador' : 'Personal / Técnico'}
                                </button>
                            ))}
                        </div>
                    </div>
                    {error && <p className="text-red-400 text-[10px] font-black uppercase flex items-center gap-2 pt-2"><ShieldAlert size={14} /> {error}</p>}
                    <div className="flex gap-4 pt-6">
                        <button type="button" onClick={() => setStep('INIT')} className="flex-1 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors">Atrás</button>
                        <button type="submit" disabled={isLoading} className="flex-[2] bg-indigo-600 py-4 rounded-xl font-black text-xs uppercase shadow-xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                            {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Solicitar Alta'}
                        </button>
                    </div>
                </form>
            </div>
        )}
    </div>
  );
};
