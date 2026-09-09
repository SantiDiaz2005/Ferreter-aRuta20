// src/services/proveedorService.ts
import { supabase } from '../config/supabase';
import type { Proveedor } from '../types';

export const proveedorService = {
  async obtenerTodos(): Promise<Proveedor[]> {
    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) throw error;
    return data || [];
  }
};