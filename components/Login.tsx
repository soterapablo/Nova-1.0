
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { ArrowRight, ShieldAlert, LogIn, UserPlus, Eye, EyeOff, Lock, Sparkles, ShieldCheck, User as UserIcon, AlertCircle, Mail } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User, isDemo?: boolean) => void;
  usersDb: User[];
  onRegister: (newUser: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, usersDb, onRegister }) => {
  const [step, setStep] = useState<'INIT' | 'GOOGLE_EMAIL' | 'PASSWORD' | 'REGISTER'>('INIT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [dni, setDni] = useState('');
  const [role, setRole] = useState<UserRole>('STAFF');
  const [error, setError] = useState('');
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  const handleStartLogin = () => {
    setStep('GOOGLE_EMAIL');
    setError('');
  };

  const handleGmailLogin = () => {
    // Simulación de Google Auth
    const mockGmail = "usuario.nuevo@gmail.com";
    setEmail(mockGmail);
    const existingUser = usersDb.find(u => u.email.toLowerCase() === mockGmail.toLowerCase());
    
    if (existingUser) {
        if (existingUser.status === 'REJECTED') {
            setError("Acceso denegado.");
            return;
        }
        onLogin(existingUser, false);
    } else {
        // Si no existe, forzamos registro para pedir DNI
        setStep('REGISTER');
    }
  };

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

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const existingUser = usersDb.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
        if (existingUser.status === 'REJECTED') {
            setError("Acceso denegado.");
            return;
        }
        setPendingUser(existingUser);
        setStep('PASSWORD');
        setError('');
    } else {
        setStep('REGISTER');
        setError('');
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser) return;
    const validPassword = pendingUser.password || pendingUser.dni;
    if (password === validPassword) {
        onLogin(pendingUser, false);
    } else {
        setError("Contraseña incorrecta.");
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dni.trim()) { setError("El DNI es obligatorio."); return; }
    
    const newUser: User = {
        id: crypto.randomUUID(),
        name: email.split('@')[0].toUpperCase(),
        email: email,
        dni: dni,
        password: dni, // Password inicial es el DNI
        role: role,
        status: 'PENDING',
        photoUrl: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=4F46E5&color=fff`
    };
    onRegister(newUser);
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
                    <button onClick={handleStartLogin} className="w-full group bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 px-6 rounded-2xl flex items-center justify-between transition-all transform active:scale-95 shadow-xl shadow-indigo-900/40">
                        <div className="flex items-center gap-3">
                            <LogIn size={20} />
                            <span className="text-sm uppercase tracking-widest">Acceso con Email</span>
                        </div>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button onClick={handleGmailLogin} className="w-full bg-white hover:bg-slate-100 text-slate-900 font-black py-5 px-6 rounded-2xl flex items-center justify-between transition-all transform active:scale-95 border border-slate-200">
                        <div className="flex items-center gap-3">
                            <Mail size={20} className="text-red-500" />
                            <span className="text-sm uppercase tracking-widest">Continuar con Gmail</span>
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
                    <p className="text-[9px] text-slate-600 text-center font-medium italic mt-4">* El modo demo elimina toda la actividad al cerrar la sesión.</p>
                </div>
            </div>
        )}

        {step === 'GOOGLE_EMAIL' && (
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl p-10 text-slate-900">
                <div className="text-center mb-10">
                    <h2 className="text-2xl font-black tracking-tighter">Acceso Directo</h2>
                    <p className="text-xs text-slate-500 mt-1">Ingresa tu correo para validar tu perfil</p>
                </div>
                <form onSubmit={handleEmailSubmit} className="space-y-6">
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 focus:ring-2 focus:ring-indigo-500 outline-none font-bold" placeholder="ej: pablo@gmail.com" autoFocus />
                    {error && <p className="text-red-600 text-[10px] font-black uppercase flex items-center gap-2 font-bold"><ShieldAlert size={14} /> {error}</p>}
                    <div className="flex justify-between items-center">
                        <button type="button" onClick={() => setStep('INIT')} className="text-slate-400 font-black text-[10px] uppercase">Cancelar</button>
                        <button type="submit" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black text-xs uppercase shadow-lg shadow-indigo-200">Siguiente</button>
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
                    <div className="flex justify-between items-center">
                        <button type="button" onClick={() => setStep('GOOGLE_EMAIL')} className="text-slate-400 font-black text-[10px] uppercase">Atrás</button>
                        <button type="submit" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black text-xs uppercase shadow-lg">Entrar</button>
                    </div>
                </form>
            </div>
        )}

        {step === 'REGISTER' && (
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-[3rem] p-10 text-white shadow-2xl">
                <div className="mb-8">
                    <h2 className="text-3xl font-black tracking-tighter italic">Completar Perfil</h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Usuario: {email}</p>
                </div>
                <form onSubmit={handleRegisterSubmit} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">DNI Requerido (Sin puntos)</label>
                        <input type="text" value={dni} onChange={(e) => setDni(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej: 26809562" autoFocus />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Rol Institucional</label>
                        <div className="grid grid-cols-1 gap-2">
                            {(['RESEARCHER', 'STAFF'] as const).map((r) => (
                                <button key={r} type="button" onClick={() => setRole(r)} className={`text-xs py-4 px-4 rounded-xl border font-black uppercase tracking-widest transition-all ${role === r ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-900/40' : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}>
                                    {r === 'RESEARCHER' ? 'Astrónomo / Investigador' : 'Personal / Técnico'}
                                </button>
                            ))}
                        </div>
                    </div>
                    {error && <p className="text-red-400 text-[10px] font-black uppercase flex items-center gap-2"><ShieldAlert size={14} /> {error}</p>}
                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setStep('INIT')} className="flex-1 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors">Atrás</button>
                        <button type="submit" className="flex-1 bg-indigo-600 py-4 rounded-xl font-black text-xs uppercase shadow-xl hover:bg-indigo-500 transition-all">Solicitar Alta</button>
                    </div>
                </form>
            </div>
        )}
    </div>
  );
};
