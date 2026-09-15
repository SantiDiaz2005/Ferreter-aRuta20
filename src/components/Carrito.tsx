// src/components/Carrito.tsx
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Proveedor, ItemCarrito, Producto } from '../types';

interface CarritoProps {
  proveedor: Proveedor;
  items: ItemCarrito[];
  onRemoverItem: (productoId: string) => void;
  onSumarItem: (producto: Producto) => void;
  onRestarItem: (productoId: string) => void;
  onVaciarCarrito: () => void;
}

export const Carrito = ({ proveedor, items, onRemoverItem, onSumarItem, onRestarItem, onVaciarCarrito }: CarritoProps) => {
  const total = items.reduce((sum, item) => sum + (item.costo * item.cantidad), 0);

  const generarPDFyWhatsApp = async () => {
    if (!proveedor.telefono) {
      alert(`No hay un número de teléfono cargado para ${proveedor.nombre}`);
      return;
    }
    
    // 1. Generamos el PDF
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42); 
    doc.text('Ferretería Ruta 20', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(`Pedido a proveedor: ${proveedor.nombre}`, 14, 30);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-AR')}`, 14, 36);

    const datosTabla = items.map(item => [
      item.codigo_proveedor || item.codigo_interno,
      item.descripcion,
      item.cantidad,
      `$${item.costo.toFixed(2)}`,
      `$${(item.costo * item.cantidad).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['Código', 'Descripción', 'Cant.', 'Costo Unit.', 'Subtotal']],
      body: datosTabla,
      foot: [['', '', '', 'TOTAL:', `$${total.toFixed(2)}`]],
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] }, 
      footStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
    });

    const nombreArchivo = `Pedido_${proveedor.nombre.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
    doc.save(nombreArchivo);

    // 2. Preparamos el mensaje
    const mensaje = `Hola ${proveedor.nombre}, te envío adjunto en PDF el pedido de stock desde Ferretería Ruta 20. ¡Muchas gracias!`;
    
    // 3. LA NUEVA MAGIA: Copiamos al portapapeles en vez de abrir pestañas nuevas
    try {
      await navigator.clipboard.writeText(mensaje);
      alert(`✅ ¡Listo!\n\n1. El PDF se descargó en tu compu.\n2. El texto del mensaje se copió automáticamente.\n\nAndá a la pestaña de WhatsApp que ya tenés abierta, buscá a ${proveedor.nombre}, tocá Ctrl+V (o Pegar) y adjuntá el PDF.`);
    } catch (err) {
      alert(`✅ PDF descargado.\n\nPor favor, escribile a ${proveedor.nombre} por el WhatsApp que tenés abierto y pasale el archivo.`);
    }
  };

  return (
    <aside className="w-72 bg-slate-900 border-l border-slate-700 flex flex-col h-screen text-slate-200 shadow-2xl">
      
      {/* HEADER DEL CARRITO */}
      <div className="p-4 border-b border-slate-700 bg-slate-900 flex justify-between items-center">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
          Pedido a {proveedor.nombre}
        </h2>

        {/* BOTÓN VACIAR CARRITO */}
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
              
              <p className="text-xs font-bold text-white pr-5 leading-tight mb-2 truncate" title={item.descripcion}>
                {item.descripcion}
              </p>
              
              <div className="flex justify-between items-center">
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

      {/* FOOTER Y BOTÓN ENVIAR */}
      <div className="p-4 border-t border-slate-700 bg-slate-900">
        <div className="flex justify-between items-end mb-3">
          <span className="text-xs font-bold text-slate-300">Total estim.:</span>
          <span className="text-lg font-bold text-white leading-none">${total.toFixed(2)}</span>
        </div>
        
        <button 
          onClick={generarPDFyWhatsApp}
          disabled={items.length === 0}
          className={`w-full py-2.5 rounded-md font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
            items.length > 0 
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md' 
              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          Descargar PDF y Copiar Mensaje
        </button>
      </div>
    </aside>
  );
};