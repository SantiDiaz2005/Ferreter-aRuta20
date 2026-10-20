// src/components/Carrito.tsx
import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { Proveedor, ItemCarrito, Producto } from '../types';

interface CarritoProps {
  proveedor: Proveedor;
  items: ItemCarrito[];
  onRemoverItem: (productoId: string) => void;
  onSumarItem: (producto: Producto) => void;
  onRestarItem: (productoId: string) => void;
  onVaciarCarrito: () => void;
  onActualizarObservacion: (productoId: string, observacion: string) => void;
}

export const Carrito = ({ proveedor, items, onRemoverItem, onSumarItem, onRestarItem, onVaciarCarrito, onActualizarObservacion }: CarritoProps) => {
  const total = items.reduce((sum, item) => sum + (item.costo * item.cantidad), 0);
  
  // Estados para manejar el input de observación
  const [editandoObsId, setEditandoObsId] = useState<string | null>(null);
  const [obsTemp, setObsTemp] = useState('');

  const copiarMensajeYAlertar = async (formato: 'PDF' | 'Excel') => {
    const mensaje = `Hola ${proveedor.nombre}, te envío adjunto en ${formato} el pedido de stock desde Ferretería Ruta 20. ¡Muchas gracias!`;
    try {
      await navigator.clipboard.writeText(mensaje);
      alert(`✅ ¡Listo!\n\n1. El ${formato} se descargó en tu compu.\n2. El texto del mensaje se copió automáticamente.\n\nAndá a la pestaña de WhatsApp que ya tenés abierta, buscá a ${proveedor.nombre}, tocá Ctrl+V (o Pegar) y adjuntá el archivo.`);
    } catch (err) {
      alert(`✅ ${formato} descargado.\n\nPor favor, escribile a ${proveedor.nombre} por el WhatsApp que tenés abierto y pasale el archivo.`);
    }
  };

  const generarPDF = async () => {
    if (!proveedor.telefono) {
      alert(`No hay un número de teléfono cargado para ${proveedor.nombre}`);
      return;
    }
    
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42); 
    doc.text('Ferretería Ruta 20', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(`Pedido a proveedor: ${proveedor.nombre}`, 14, 30);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-AR')}`, 14, 36);

    // Mapeamos los datos incluyendo la observación en el orden de la foto
    const datosTabla = items.map(item => [
      item.cantidad,
      item.observacion || '',
      item.codigo_proveedor || item.codigo_interno || '-',
      item.descripcion
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['Cant.', 'Observación', 'Código', 'Descripción']],
      body: datosTabla,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] }, 
    });

    const nombreArchivo = `Pedido_${proveedor.nombre.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
    doc.save(nombreArchivo);
    
    await copiarMensajeYAlertar('PDF');
  };

  const generarExcel = async () => {
    if (!proveedor.telefono) {
      alert(`No hay un número de teléfono cargado para ${proveedor.nombre}`);
      return;
    }

    // Armamos los datos JSON para Excel en el orden exacto de la sugerencia
    const datosExcel = items.map(item => ({
      "Cantidad": item.cantidad,
      "Observación": item.observacion || '',
      "Código": item.codigo_proveedor || item.codigo_interno || '-',
      "Descripción": item.descripcion
    }));

    const worksheet = XLSX.utils.json_to_sheet(datosExcel);
    
    // Ajustamos los anchos de las 4 columnas
    worksheet['!cols'] = [
      { wch: 10 }, // Columna A (Cantidad)
      { wch: 18 }, // Columna B (Observación)
      { wch: 15 }, // Columna C (Código)
      { wch: 50 }  // Columna D (Descripción)
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pedido");

    const nombreArchivo = `Pedido_${proveedor.nombre.replace(/\s+/g, '_')}_${new Date().getTime()}.xlsx`;
    XLSX.writeFile(workbook, nombreArchivo);

    await copiarMensajeYAlertar('Excel');
  };

  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-700 flex flex-col h-screen text-slate-200 shadow-2xl">
      
      {/* HEADER DEL CARRITO */}
      <div className="p-4 border-b border-slate-700 bg-slate-900 flex justify-between items-center">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
          Pedido a {proveedor.nombre}
        </h2>

        {items.length > 0 && (
          <button 
            onClick={onVaciarCarrito}
            className="text-slate-400 hover:text-red-400 transition-colors"
            title="Vaciar pedido completo"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        )}
      </div>

      {/* LISTA DE ITEMS */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-900">
        {items.length === 0 ? (
          <div className="text-center text-slate-400 mt-10 text-xs font-medium">
            El carrito está vacío.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="bg-slate-800 p-2.5 rounded-md border border-slate-600 relative shadow-sm">
              <button 
                onClick={() => onRemoverItem(item.id)}
                className="absolute top-1.5 right-1.5 text-slate-400 hover:text-red-400 w-5 h-5 flex items-center justify-center rounded transition-colors"
                title="Eliminar ítem"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
              
              <div className="pr-6 mb-2">
                <p className="text-xs font-bold text-white leading-tight truncate" title={item.descripcion}>
                  {item.descripcion}
                </p>

                {/* ZONA DE OBSERVACIONES (El lapicito) */}
                {editandoObsId === item.id ? (
                  <div className="mt-2 flex items-center gap-1.5">
                    <input
                      type="text"
                      value={obsTemp}
                      onChange={(e) => setObsTemp(e.target.value)}
                      placeholder="Ej: 16A, luz cálida..."
                      className="w-full bg-slate-950 border border-slate-600 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-blue-500"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onActualizarObservacion(item.id, obsTemp);
                          setEditandoObsId(null);
                        }
                      }}
                    />
                    <button 
                      onClick={() => {
                        onActualizarObservacion(item.id, obsTemp);
                        setEditandoObsId(null);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white p-1 rounded"
                      title="Guardar"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    </button>
                  </div>
                ) : (
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {item.observacion && (
                      <span className="text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded font-medium max-w-[150px] truncate" title={item.observacion}>
                        Obs: {item.observacion}
                      </span>
                    )}
                    <button 
                      onClick={() => {
                        setEditandoObsId(item.id);
                        setObsTemp(item.observacion || '');
                      }}
                      className="text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors text-[10px] font-bold"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                      {item.observacion ? 'Editar' : 'Añadir obs.'}
                    </button>
                  </div>
                )}
              </div>
              
              {/* CONTROLES DE CANTIDAD */}
              <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-700/50">
                <div className="flex items-center gap-1.5 bg-slate-900 rounded border border-slate-600 overflow-hidden">
                  <button 
                    onClick={() => onRestarItem(item.id)}
                    className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-sm font-bold"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold text-white w-4 text-center">
                    {item.cantidad}
                  </span>
                  <button 
                    onClick={() => onSumarItem(item as Producto)}
                    className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-sm font-bold"
                  >
                    +
                  </button>
                </div>
                <span className="text-emerald-400 font-bold text-xs">
                  ${(item.costo * item.cantidad).toFixed(2)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FOOTER */}
      <div className="p-4 border-t border-slate-700 bg-slate-900">
        <div className="flex justify-between items-end mb-3">
          <span className="text-xs font-bold text-slate-300">Total estim.:</span>
          <span className="text-lg font-bold text-white leading-none">${total.toFixed(2)}</span>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={generarPDF}
            disabled={items.length === 0}
            className={`flex-1 py-2 rounded-md font-bold text-xs flex flex-col items-center justify-center gap-1 transition-colors ${
              items.length > 0 
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-md' 
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            📄 Bajar PDF
          </button>
          
          <button 
            onClick={generarExcel}
            disabled={items.length === 0}
            className={`flex-1 py-2 rounded-md font-bold text-xs flex flex-col items-center justify-center gap-1 transition-colors ${
              items.length > 0 
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md' 
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            📊 Bajar Excel
          </button>
        </div>
      </div>
    </aside>
  );
};