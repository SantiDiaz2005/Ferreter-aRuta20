// src/repositories/productoRepository.ts
import { supabase } from '../config/supabase';
import type { Producto } from '../types';

export const productoRepository = {
  // Ahora trae los productos en tandas hasta que no quede ninguno
  async obtenerProductosPorProveedor(proveedorId: string): Promise<Producto[]> {
    let todosLosProductos: Producto[] = [];
    let limite = 1000;
    let desde = 0;
    let hayMas = true;

    while (hayMas) {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('proveedor_id', proveedorId)
        .order('descripcion', { ascending: true })
        .range(desde, desde + limite - 1); // Le pedimos la tanda correspondiente

      if (error) throw new Error(error.message);
      
      if (data && data.length > 0) {
        todosLosProductos = [...todosLosProductos, ...data];
        desde += limite;
        
        // Si trajo menos de 1000, significa que ya llegamos al final de la lista
        if (data.length < limite) {
          hayMas = false; 
        }
      } else {
        hayMas = false;
      }
    }

    return todosLosProductos;
  },

  async reemplazarCatalogo(proveedorId: string, productosNuevos: any[]): Promise<void> {
    const { error: errorBorrar } = await supabase
      .from('productos')
      .delete()
      .eq('proveedor_id', proveedorId);
      
    if (errorBorrar) throw errorBorrar;

    const { error: errorInsertar } = await supabase
      .from('productos')
      .insert(productosNuevos);

    if (errorInsertar) throw errorInsertar;
  }
};