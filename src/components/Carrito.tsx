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
}

export const Carrito = ({ proveedor, items, onRemoverItem, onSumarItem, onRestarItem }: CarritoProps) => {
  const total = items.reduce((sum, item) => sum + (item.costo * item.cantidad), 0);

  const generarPDFyWhatsApp = () => {
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

    const datosTabla = items.map(item => [
      item.codigo_interno,
      item.descripcion,
      item.cantidad.toString(),
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

    const mensaje = `Hola ${proveedor.nombre}, te envío adjunto en PDF el pedido de stock desde Ferretería Ruta 20. ¡Muchas gracias!`;
    const url = `https://wa.me/${proveedor.telefono}?text=${encodeURIComponent(mensaje)}`;
    
    setTimeout(() => {
      window.open(url, '_blank');
    }, 500);
  };

  return (
    // Reduje el ancho del carrito de w-80 a w-72 para darle más espacio a la tabla
    <aside className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col h-screen text-slate-300 shadow-2xl">
      <div className="p-4 border-b border-slate-800 bg-slate-900/80">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          🛒 Pedido a {proveedor.nombre}
        </h2>
      </div>

      {/* Reduje el espacio entre items (space-y-2) y el padding interno (p-2) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.length === 0 ? (
          <div className="text-center text-slate-500 mt-10 text-xs">
            El carrito está vacío.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="bg-slate-800/50 p-2.5 rounded-md border border-slate-700/50 relative">
              <button 
                onClick={() => onRemoverItem(item.id)}
                className="absolute top-1.5 right-1.5 text-red-400 hover:text-red-300 text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded hover:bg-red-400/10 transition-colors"
                title="Eliminar"
              >
                ✕
              </button>
              
              <p className="text-xs font-medium text-slate-200 pr-5 leading-tight mb-2 truncate" title={item.descripcion}>
                {item.descripcion}
              </p>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5 bg-slate-900 rounded p-0.5 border border-slate-700">
                  <button 
                    onClick={() => onRestarItem(item.id)}
                    className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors text-xs"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold text-white w-4 text-center">
                    {item.cantidad}
                  </span>
                  <button 
                    onClick={() => onSumarItem(item as Producto)}
                    className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors text-xs"
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

      <div className="p-4 border-t border-slate-800 bg-slate-900/90">
        <div className="flex justify-between items-end mb-3">
          <span className="text-xs font-semibold text-slate-400">Total estim.:</span>
          <span className="text-lg font-bold text-white leading-none">${total.toFixed(2)}</span>
        </div>
        
        <button 
          onClick={generarPDFyWhatsApp}
          disabled={items.length === 0}
          className={`w-full py-2.5 rounded-md font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
            items.length > 0 
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/20' 
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <span>📄</span> PDF y Enviar
        </button>
      </div>
    </aside>
  );
};