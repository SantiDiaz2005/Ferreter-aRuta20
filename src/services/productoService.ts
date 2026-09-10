// src/services/productoService.ts
import { supabase } from '../config/supabase';
import type { Producto } from '../types';

export const productoService = {
  
  // 1. LEER EN TANDAS
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

  // 2. GUARDAR EN TANDAS (Con filtro anti-duplicados del Excel)
  async sincronizarCatalogo(proveedorId: string, productosExcel: any[]): Promise<void> {
    const existentes = await this.listarPorProveedor(proveedorId);
    const mapaExistentes = new Map(existentes.map(p => [p.codigo_interno, p]));

    // Usamos 'Map' en lugar de 'Array' para que, si un producto viene repetido en el Excel, 
    // se pise a sí mismo y solo lo mandemos UNA vez a la base de datos.
    const paraInsertarMap = new Map();
    const paraActualizarMap = new Map();

    for (const prod of productosExcel) {
      const existe = mapaExistentes.get(prod.codigo_interno);
      
      if (existe) {
        if (existe.costo !== prod.costo || existe.codigo_proveedor !== prod.codigo_proveedor) {
           paraActualizarMap.set(existe.id, {
             ...existe, 
             costo: prod.costo,
             precio_venta: prod.costo * (existe.ganancia || 1.5),
             codigo_proveedor: prod.codigo_proveedor
           });
        }
      } else {
        paraInsertarMap.set(prod.codigo_interno, {
          codigo_interno: prod.codigo_interno,
          codigo_proveedor: prod.codigo_proveedor,
          descripcion: prod.descripcion,
          costo: prod.costo,
          ganancia: 1.5, 
          precio_venta: prod.costo * 1.5,
          proveedor_id: proveedorId
        });
      }
    }

    // Convertimos los Mapas limpios y sin repetidos devuelta a listas normales
    const paraInsertar = Array.from(paraInsertarMap.values());
    const paraActualizar = Array.from(paraActualizarMap.values());

    // Insertamos
    const TAMANO_TANDA = 1000;
    for (let i = 0; i < paraInsertar.length; i += TAMANO_TANDA) {
      const tanda = paraInsertar.slice(i, i + TAMANO_TANDA);
      const { error } = await supabase.from('productos').insert(tanda);
      if (error) throw error;
    }

    // Actualizamos
    for (let i = 0; i < paraActualizar.length; i += TAMANO_TANDA) {
      const tanda = paraActualizar.slice(i, i + TAMANO_TANDA);
      const { error } = await supabase.from('productos').upsert(tanda);
      if (error) throw error;
    }
  }
};