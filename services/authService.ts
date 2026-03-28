import { supabase } from './supabaseClient';
import { User, UserRole } from '../types';

export const authService = {
  async register(data: Partial<User>): Promise<{ user: User | null, error: string | null }> {
    try {
      if (!data.email || !data.dni) return { user: null, error: 'Email y DNI son requeridos' };
      
      // 1. Register in Supabase Auth (password is DNI initially)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.dni,
      });

      if (authError) return { user: null, error: authError.message };
      if (!authData.user) return { user: null, error: 'Registration failed' };

      // 2. Insert into public.profiles
      const name = data.name || data.email.split('@')[0].toUpperCase();
      const photoUrl = `https://ui-avatars.com/api/?name=${name}&background=4F46E5&color=fff`;
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: authData.user.id,
          email: data.email,
          name,
          dni: data.dni,
          role: 'SOCIO',
          status: 'PENDING',
          photo_url: photoUrl,
          phone: data.phone,
          emergency_phone: data.emergencyPhone,
          birth_date: data.birthDate,
          medical_notes: data.medicalNotes
        }])
        .select()
        .single();
        
      if (profileError) return { user: null, error: profileError.message };

      const user: User = {
        id: profileData.id,
        email: profileData.email,
        name: profileData.name,
        dni: profileData.dni,
        role: profileData.role as UserRole,
        status: profileData.status,
        photoUrl: profileData.photo_url,
        phone: profileData.phone,
        emergencyPhone: profileData.emergency_phone,
        birthDate: profileData.birth_date,
        medicalNotes: profileData.medical_notes
      };

      return { user, error: null };
    } catch (e: any) {
      return { user: null, error: e.message };
    }
  },

  async login(email: string, password: string): Promise<{ user: User | null, error: string | null }> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
         if (authError.message === 'Invalid login credentials') return { user: null, error: 'Credenciales inválidas o usuario incorrecto.' };
         return { user: null, error: authError.message };
      }
      if (!authData.user) return { user: null, error: 'Login failed' };

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
        
      if (profileError) return { user: null, error: profileError.message };

      const user: User = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        dni: profile.dni,
        role: profile.role as UserRole,
        status: profile.status,
        photoUrl: profile.photo_url,
        phone: profile.phone,
        emergencyPhone: profile.emergency_phone,
        birthDate: profile.birth_date,
        medicalNotes: profile.medical_notes,
        mustChangePassword: profile.must_change_password
      };
      return { user, error: null };
    } catch (e: any) {
      return { user: null, error: e.message };
    }
  },

  async logout() {
    await supabase.auth.signOut();
  },

  async checkSession(): Promise<{ user: User | null }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { user: null };

      // Fetch profile
      const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

      if (!profile) return { user: null };
      
      return {
        user: {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          dni: profile.dni,
          role: profile.role as UserRole,
          status: profile.status,
          photoUrl: profile.photo_url,
          phone: profile.phone,
          emergencyPhone: profile.emergency_phone,
          birthDate: profile.birth_date,
          medicalNotes: profile.medical_notes,
          mustChangePassword: profile.must_change_password
        }
      };
    } catch (e) {
      return { user: null };
    }
  }
};
