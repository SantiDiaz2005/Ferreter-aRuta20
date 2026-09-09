// src/repositories/proveedorRepository.ts
import { supabase } from '../config/supabase';
import type { Proveedor } from '../types';

export const proveedorRepository = {
  async obtenerProveedores(): Promise<Proveedor[]> {
    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error al traer proveedores:', error.message);
      throw new Error(error.message);
    }

    return data || [];
  }
};