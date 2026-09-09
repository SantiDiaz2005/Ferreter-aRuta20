// src/components/ImportadorExcel.tsx
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { productoService } from '../services/productoService';
import type { Proveedor } from '../types';

interface ImportadorProps {
  proveedor: Proveedor;
  onImportacionExitosa: () => void;
}

export const ImportadorExcel = ({ proveedor, onImportacionExitosa }: ImportadorProps) => {
  const [cargando, setCargando] = useState(false);

  const manejarArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCargando(true);
    const reader = new FileReader();
    
    reader.onload = async (evento) => {
      try {
        const arrayBuffer = evento.target?.result;
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        // Ahora vamos directo a la hoja maestra "PRODUCTOS"
        const hoja = workbook.Sheets['PRODUCTOS'];
        if (!hoja) {
          alert('❌ No se encontró la pestaña maestra llamada "PRODUCTOS" en este Excel.');
          setCargando(false); return;
        }

        const filas = XLSX.utils.sheet_to_json<any[]>(hoja, { header: 1 });
        const productosDelExcel = [];

        // Ignoramos la fila 0 (los títulos) y empezamos a leer
        for (let i = 1; i < filas.length; i++) {
          const fila = filas[i];
          
          // Mapeo exacto de las columnas de tu Excel
          const codigo = fila[0] || fila[1]; // A o B (Código Interno o Código Prov)
          const descripcion = fila[2];       // C (Descripción)
          const costo = fila[8];             // I (Costo Final Neto)
          const proveedorExcel = fila[11];   // L (Nombre del Proveedor)

          // Filtramos: Si la columna L tiene el nombre de nuestro proveedor actual, lo guardamos
          if (proveedorExcel && String(proveedorExcel).toUpperCase().includes(proveedor.nombre.toUpperCase())) {
            if (codigo && descripcion && typeof costo === 'number') {
              productosDelExcel.push({
                codigo_interno: String(codigo).trim(),
                descripcion: String(descripcion).trim(),
                costo: costo
              });
            }
          }
        }

        if (productosDelExcel.length === 0) {
          alert(`⚠️ No encontré productos para ${proveedor.nombre} en la pestaña PRODUCTOS.`);
          setCargando(false); return;
        }

        await productoService.sincronizarCatalogo(proveedor.id, productosDelExcel);
        alert(`✅ ¡Éxito! Se actualizaron ${productosDelExcel.length} productos de ${proveedor.nombre} usando la Columna I.`);
        onImportacionExitosa(); 
        
      } catch (error) {
        console.error(error);
        alert('❌ Hubo un error al procesar el Excel.');
      } finally {
        setCargando(false);
        e.target.value = ''; 
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="bg-slate-800/80 p-5 rounded-xl flex items-center justify-between mb-6 border border-slate-700 shadow-md">
      <div>
        <h4 className="text-base font-bold text-white flex items-center gap-2">
          {cargando ? '⏳ Leyendo Columna I...' : '📄 Actualizar Lista (Excel)'}
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          Subí el Excel completo. El sistema filtrará a {proveedor.nombre} automáticamente.
        </p>
      </div>
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={manejarArchivo}
        disabled={cargando}
        className="text-sm text-slate-300 file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer shadow-sm"
      />
    </div>
  );
};