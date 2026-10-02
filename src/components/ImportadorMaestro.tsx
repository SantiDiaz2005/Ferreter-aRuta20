// src/components/ImportadorMaestro.tsx
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { proveedorService } from '../services/proveedorService';
import { productoService } from '../services/productoService';

export const ImportadorMaestro = () => {
  const [cargando, setCargando] = useState(false);
  const [progreso, setProgreso] = useState('');

  const manejarArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCargando(true);
    setProgreso('Analizando archivo Excel...');
    const reader = new FileReader();

    reader.onload = async (evento) => {
      try {
        const arrayBuffer = evento.target?.result;
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const hoja = workbook.Sheets['PRODUCTOS'];
        
        if (!hoja) {
          alert('❌ No se encontró la pestaña "PRODUCTOS" en este Excel.');
          setCargando(false); 
          return;
        }

        const filas = XLSX.utils.sheet_to_json<any[]>(hoja, { header: 1 });
        
        setProgreso('Obteniendo proveedores de la base de datos...');
        // Traemos todos los proveedores (Carrara, DelPino, Fadepa, etc.)
        const proveedoresDB = await proveedorService.obtenerTodos();
        
        // Preparamos un diccionario para clasificar los productos por proveedor
        const productosClasificados: Record<string, any[]> = {};
        proveedoresDB.forEach(p => { productosClasificados[p.id] = []; });

        setProgreso('Clasificando productos...');
        for (let i = 1; i < filas.length; i++) {
          const fila = filas[i];
          const codigoInterno = fila[0];   
          const codigoProveedor = fila[1]; 
          const descripcion = fila[2];     
          const costo = fila[8];           
          const proveedorExcel = fila[11]; 

          const nombreProvExcel = String(proveedorExcel || '').toUpperCase().trim();
          const costoNumerico = Number(costo);

          if ((codigoInterno || codigoProveedor) && descripcion && !isNaN(costoNumerico)) {
            // Buscamos si el nombre en el Excel coincide con alguno de nuestra BD
            const provMatch = proveedoresDB.find(p => 
              nombreProvExcel.includes(p.nombre.toUpperCase().trim())
            );
            
            if (provMatch) {
              productosClasificados[provMatch.id].push({
                codigo_interno: codigoInterno ? String(codigoInterno).trim() : String(codigoProveedor).trim(),
                codigo_proveedor: codigoProveedor ? String(codigoProveedor).trim() : null,
                descripcion: String(descripcion).trim(),
                costo: costoNumerico
              });
            }
          }
        }

        // Subimos los catálogos a Supabase, proveedor por proveedor
        let proveedoresActualizados = 0;
        let totalProductos = 0;

        for (const prov of proveedoresDB) {
          const productos = productosClasificados[prov.id];
          if (productos && productos.length > 0) {
            setProgreso(`Actualizando ${prov.nombre}...`);
            await productoService.sincronizarCatalogo(prov.id, productos);
            proveedoresActualizados++;
            totalProductos += productos.length;
          }
        }

        alert(`✅ ¡Actualización Global Exitosa!\n\nSe actualizaron catálogos para ${proveedoresActualizados} proveedores.\nTotal de artículos procesados: ${totalProductos}.`);
        
      } catch (error) {
        console.error(error);
        alert('❌ Hubo un error al procesar la actualización global.');
      } finally {
        setCargando(false);
        setProgreso('');
        e.target.value = ''; // Resetea el input
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="mt-8 p-6 bg-slate-800/50 border border-slate-700 rounded-2xl flex flex-col items-center text-center max-w-xl mx-auto shadow-lg">
      <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">Actualización Global de Precios</h3>
      <p className="text-sm text-slate-400 mb-6">
        Subí el archivo Excel maestro. El sistema leerá la lista completa y actualizará automáticamente los catálogos de todos los proveedores en simultáneo.
      </p>
      
      <div className="relative">
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={manejarArchivo}
          disabled={cargando}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <button 
          disabled={cargando}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${
            cargando 
              ? 'bg-slate-700 text-slate-400' 
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(5,150,105,0.4)] hover:shadow-[0_0_25px_rgba(5,150,105,0.6)]'
          }`}
        >
          {cargando ? progreso : 'Cargar Archivo Excel General'}
        </button>
      </div>
    </div>
  );
};