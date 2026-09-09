// src/components/TablaProductos.tsx
import { useEffect, useState } from 'react';
import { productoService } from '../services/productoService';
import { ImportadorExcel } from './ImportadorExcel';
import type { Producto, Proveedor } from '../types';

interface TablaProductosProps {
  proveedor: Proveedor;
  onAgregarAlCarrito: (producto: Producto) => void;
}

export const TablaProductos = ({ proveedor, onAgregarAlCarrito }: TablaProductosProps) => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  
  const [creandoManual, setCreandoManual] = useState(false);
  const [formManual, setFormManual] = useState({ codigo: '', descripcion: '', costo: '' });

  const cargar = async () => {
    setCargando(true);
    try {
      const datos = await productoService.listarPorProveedor(proveedor.id);
      setProductos(datos);
    } catch (error) {
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    setBusqueda('');
    setCreandoManual(false);
    cargar();
  }, [proveedor.id]);

  const handleCambiarMultiplicador = async (productoId: string, costo: number, nuevoMultiplicador: number) => {
    if (isNaN(nuevoMultiplicador) || nuevoMultiplicador <= 0) return;
    setProductos(prev => prev.map(p => 
      p.id === productoId 
        ? { ...p, ganancia: nuevoMultiplicador, precio_venta: costo * nuevoMultiplicador } 
        : p
    ));
    try {
      await productoService.actualizarMultiplicador(productoId, costo, nuevoMultiplicador);
    } catch (error) {
      console.error(error); cargar();
    }
  };

  const handleGuardarManual = async () => {
    if (!formManual.codigo || !formManual.descripcion || !formManual.costo) return alert('⚠️ Completá todos los campos.');
    try {
      await productoService.sincronizarCatalogo(proveedor.id, [{
        codigo_interno: formManual.codigo,
        descripcion: formManual.descripcion,
        costo: parseFloat(formManual.costo)
      }]);
      setFormManual({ codigo: '', descripcion: '', costo: '' });
      setCreandoManual(false);
      cargar();
    } catch (error) {
      alert('❌ Error al guardar el artículo manual.');
    }
  };

  const productosFiltrados = productos.filter((prod) =>
    prod.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
    prod.codigo_interno.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (cargando) return <div className="text-slate-400 mt-8 text-center animate-pulse text-sm">Cargando catálogo...</div>;

  return (
    <div className="mt-2 w-full max-w-6xl mx-auto">
      <ImportadorExcel proveedor={proveedor} onImportacionExitosa={cargar} />

      <div className="flex gap-3 mb-3">
        <div className="flex-1 flex items-center bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 shadow-sm">
          <span className="text-slate-500 mr-2 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Buscar por código o descripción..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="bg-transparent border-none text-slate-200 w-full focus:outline-none text-xs"
          />
        </div>
        <button 
          onClick={() => setCreandoManual(!creandoManual)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg font-bold shadow-sm transition-colors text-xs whitespace-nowrap"
        >
          {creandoManual ? 'Cancelar' : '+ Artículo Manual'}
        </button>
      </div>

      {creandoManual && (
        <div className="bg-slate-800/80 p-3 rounded-lg mb-4 border border-slate-700 flex gap-3 items-end shadow-lg animate-fade-in">
          <div className="flex-1">
            <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Código</label>
            <input type="text" value={formManual.codigo} onChange={e => setFormManual({...formManual, codigo: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none" />
          </div>
          <div className="flex-[2]">
            <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Descripción</label>
            <input type="text" value={formManual.descripcion} onChange={e => setFormManual({...formManual, descripcion: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none" />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Costo ($)</label>
            <input type="number" value={formManual.costo} onChange={e => setFormManual({...formManual, costo: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none" />
          </div>
          <button onClick={handleGuardarManual} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-md font-bold shadow-sm transition-colors text-xs h-[30px]">
            Guardar
          </button>
        </div>
      )}

      {productos.length > 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-lg">
          {/* ACHICAMOS LA TABLA: text-xs y paddings reducidos */}
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 uppercase text-slate-400 border-b border-slate-800 text-[10px]">
              <tr>
                <th className="px-4 py-2">Código</th>
                <th className="px-4 py-2">Descripción</th>
                <th className="px-4 py-2">Costo</th>
                <th className="px-4 py-2">Mult.</th>
                <th className="px-4 py-2">Precio Final</th>
                <th className="px-4 py-2 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {productosFiltrados.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-800/40">
                  <td className="px-4 py-1.5 font-mono text-slate-400">{prod.codigo_interno}</td>
                  <td className="px-4 py-1.5 font-medium text-slate-200 truncate max-w-[250px]" title={prod.descripcion}>{prod.descripcion}</td>
                  <td className="px-4 py-1.5 text-slate-400">${prod.costo.toFixed(2)}</td>
                  <td className="px-4 py-1.5">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500 font-bold">x</span>
                      <input
                        type="number"
                        step="0.1"
                        defaultValue={prod.ganancia || 1.5}
                        onBlur={(e) => handleCambiarMultiplicador(prod.id, prod.costo, parseFloat(e.target.value))}
                        className="w-12 bg-slate-800 text-emerald-400 font-bold border border-slate-700 rounded px-1 py-0.5 text-center focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-1.5 text-emerald-400 font-bold">${prod.precio_venta.toFixed(2)}</td>
                  <td className="px-4 py-1.5 text-center">
                    <button 
                      onClick={() => onAgregarAlCarrito(prod)}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-[10px] font-bold shadow-sm"
                    >
                      + Agregar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center bg-slate-900/50 p-6 rounded-lg border border-slate-800 mt-3">
          <p className="text-slate-400 text-sm">El catálogo está vacío.</p>
        </div>
      )}
    </div>
  );
};