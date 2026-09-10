// src/services/productoService.ts
import { supabase } from '../config/supabase';
import type { Producto } from '../types';

export const productoService = {
  
  // 1. LEER EN TANDAS (Para superar el límite de 1000 al mostrar en pantalla)
  async listarPorProveedor(proveedorId: string): Promise<Producto[]> {
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
        .range(desde, desde + limite - 1);

      if (error) throw error;
      
      if (data && data.length > 0) {
        todosLosProductos = [...todosLosProductos, ...data];
        desde += limite;
        if (data.length < limite) {
          hayMas = false; 
        }
      } else {
        hayMas = false;
      }
    }
    return todosLosProductos;
  },

  async actualizarMultiplicador(productoId: string, nuevoCosto: number, nuevoMultiplicador: number): Promise<void> {
    const precioVenta = nuevoCosto * nuevoMultiplicador;
    const { error } = await supabase
      .from('productos')
      .update({ ganancia: nuevoMultiplicador, precio_venta: precioVenta })
      .eq('id', productoId);

    if (error) throw error;
  },

  // 2. GUARDAR EN TANDAS (Para que el Excel no colapse al subir)
  async sincronizarCatalogo(proveedorId: string, productosExcel: any[]): Promise<void> {
    const existentes = await this.listarPorProveedor(proveedorId);
    const mapaExistentes = new Map(existentes.map(p => [p.codigo_interno, p]));

    const paraInsertar: any[] = [];
    const paraActualizar: any[] = [];

    for (const prod of productosExcel) {
      const existe = mapaExistentes.get(prod.codigo_interno);
      
      if (existe) {
        // JUGADA MAESTRA: Actualizamos si cambió el costo, ¡O si le faltaba el código de proveedor!
        if (existe.costo !== prod.costo || existe.codigo_proveedor !== prod.codigo_proveedor) {
           paraActualizar.push({
             ...existe, // <-- ¡ESTA ES LA MAGIA! Copia todo lo que ya tenía para que Supabase no tire error
             costo: prod.costo,
             precio_venta: prod.costo * (existe.ganancia || 1.5),
             codigo_proveedor: prod.codigo_proveedor
           });
        }
      } else {
        // Si es un producto nuevo, lo inserta con su código de proveedor
        paraInsertar.push({
          codigo_interno: prod.codigo_interno,
          codigo_proveedor: prod.codigo_proveedor, // <-- Agregado para inserciones nuevas
          descripcion: prod.descripcion,
          costo: prod.costo,
          ganancia: 1.5, 
          precio_venta: prod.costo * 1.5,
          proveedor_id: proveedorId
        });
      }
    }

    // Dividimos en grupos de 1000 para insertar
    const TAMANO_TANDA = 1000;
    
    for (let i = 0; i < paraInsertar.length; i += TAMANO_TANDA) {
      const tanda = paraInsertar.slice(i, i + TAMANO_TANDA);
      const { error } = await supabase.from('productos').insert(tanda);
      if (error) throw error;
    }

    // Dividimos en grupos de 1000 para actualizar
    for (let i = 0; i < paraActualizar.length; i += TAMANO_TANDA) {
      const tanda = paraActualizar.slice(i, i + TAMANO_TANDA);
      const { error } = await supabase.from('productos').upsert(tanda);
      if (error) throw error;
    }
  }
};