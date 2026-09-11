// src/components/TablaProductos.tsx
import { useEffect, useState } from 'react';
import { productoService } from '../services/productoService';
import { ImportadorExcel } from './ImportadorExcel';
import type { Producto, Proveedor } from '../types';

interface TablaProductosProps {
  proveedor: Proveedor;
  onAgregarAlCarrito: (producto: Producto) => void;
}

const ITEMS_POR_PAGINA = 100;

export const TablaProductos = ({ proveedor, onAgregarAlCarrito }: TablaProductosProps) => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
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
    setPaginaActual(1);
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

  const handleBusqueda = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusqueda(e.target.value);
    setPaginaActual(1);
  };

  const productosFiltrados = productos.filter((prod) =>
    prod.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
    prod.codigo_interno.toLowerCase().includes(busqueda.toLowerCase()) ||
    (prod.codigo_proveedor && prod.codigo_proveedor.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const totalPaginas = Math.ceil(productosFiltrados.length / ITEMS_POR_PAGINA);
  const indiceUltimoItem = paginaActual * ITEMS_POR_PAGINA;
  const indicePrimerItem = indiceUltimoItem - ITEMS_POR_PAGINA;
  const productosPaginados = productosFiltrados.slice(indicePrimerItem, indiceUltimoItem);

  if (cargando) return <div className="text-slate-300 mt-8 text-center font-bold text-sm">Cargando catálogo...</div>;

  return (
    <div className="mt-2 w-full max-w-6xl mx-auto">
      <ImportadorExcel proveedor={proveedor} onImportacionExitosa={cargar} />

      <div className="flex gap-3 mb-3">
        <div className="flex-1 flex items-center bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 shadow-sm">
          {/* Reemplazamos el emoji de la lupa por un ícono SVG */}
          <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <input
            type="text"
            placeholder="Buscar por código o descripción..."
            value={busqueda}
            onChange={handleBusqueda}
            className="bg-transparent border-none text-slate-100 w-full focus:outline-none text-xs placeholder-slate-500"
          />
        </div>
        <button 
          onClick={() => setCreandoManual(!creandoManual)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg font-bold shadow-md transition-colors text-xs whitespace-nowrap"
        >
          {creandoManual ? 'Cancelar' : '+ Artículo Manual'}
        </button>
      </div>

      {creandoManual && (
        <div className="bg-slate-800 p-3 rounded-lg mb-4 border border-slate-600 flex gap-3 items-end shadow-md">
          <div className="flex-1">
            <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-300 mb-1">Código</label>
            <input type="text" value={formManual.codigo} onChange={e => setFormManual({...formManual, codigo: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none" />
          </div>
          <div className="flex-[2]">
            <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-300 mb-1">Descripción</label>
            <input type="text" value={formManual.descripcion} onChange={e => setFormManual({...formManual, descripcion: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none" />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-300 mb-1">Costo ($)</label>
            <input type="number" value={formManual.costo} onChange={e => setFormManual({...formManual, costo: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none" />
          </div>
          <button onClick={handleGuardarManual} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-md font-bold shadow-md text-xs h-[30px]">
            Guardar
          </button>
        </div>
      )}

      {productosFiltrados.length > 0 ? (
        <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-slate-800 uppercase text-slate-300 border-b border-slate-700 text-[10px]">
              <tr>
                <th className="px-4 py-3 font-bold">Código</th>
                <th className="px-4 py-3 font-bold">Descripción</th>
                <th className="px-4 py-3 font-bold">Costo</th>
                <th className="px-4 py-3 font-bold">Mult.</th>
                <th className="px-4 py-3 font-bold">Precio Final</th>
                <th className="px-4 py-3 font-bold text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {productosPaginados.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-800 transition-colors">
                  <td className="px-4 py-2 font-mono text-slate-300">{prod.codigo_proveedor || prod.codigo_interno}</td>
                  <td className="px-4 py-2 font-medium text-white truncate max-w-[250px]" title={prod.descripcion}>{prod.descripcion}</td>
                  <td className="px-4 py-2 text-slate-300">${prod.costo.toFixed(2)}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 font-bold">x</span>
                      <input
                        type="number"
                        step="0.1"
                        defaultValue={prod.ganancia || 1.5}
                        onBlur={(e) => handleCambiarMultiplicador(prod.id, prod.costo, parseFloat(e.target.value))}
                        className="w-12 bg-slate-900 text-emerald-400 font-bold border border-slate-600 rounded px-1 py-1 text-center focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-2 text-emerald-400 font-bold text-sm">${prod.precio_venta.toFixed(2)}</td>
                  <td className="px-4 py-2 text-center">
                    <button 
                      onClick={() => onAgregarAlCarrito(prod)}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-[10px] font-bold shadow-md w-full"
                    >
                      + Añadir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* NUEVA PAGINACIÓN CON NÚMEROS Y COLORES SÓLIDOS */}
          {totalPaginas > 1 && (
            <div className="bg-slate-800 border-t border-slate-700 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-300 font-medium">
                Mostrando {indicePrimerItem + 1} a {Math.min(indiceUltimoItem, productosFiltrados.length)} de {productosFiltrados.length}
              </span>
              
              <div className="flex gap-1 overflow-x-auto max-w-full">
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
                  <button
                    key={num}
                    onClick={() => setPaginaActual(num)}
                    className={`px-3 py-1 rounded text-xs font-bold border shadow-sm transition-colors ${
                      paginaActual === num
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-900 text-slate-300 border-slate-600 hover:bg-slate-700'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="text-center bg-slate-900 p-6 rounded-lg border border-slate-700 mt-3 shadow-md">
          <p className="text-slate-300 text-sm font-medium">No se encontraron productos.</p>
        </div>
      )}
    </div>
  );
};