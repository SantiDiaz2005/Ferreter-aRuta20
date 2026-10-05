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

  // ESTADOS PARA EDICIÓN EN LÍNEA
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formEdicion, setFormEdicion] = useState({ codigo: '', descripcion: '', costo: '' });

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
    setEditandoId(null);
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

  // --- FUNCIONES DE EDICIÓN Y BORRADO ---
  const handleIniciarEdicion = (prod: Producto) => {
    setEditandoId(prod.id);
    setFormEdicion({
      codigo: prod.codigo_interno || prod.codigo_proveedor || '',
      descripcion: prod.descripcion,
      costo: prod.costo.toString()
    });
  };

  const handleGuardarEdicion = async (prod: Producto) => {
    if (!formEdicion.codigo || !formEdicion.descripcion || !formEdicion.costo) return alert('⚠️ Completá todos los campos.');
    try {
      const nuevoCosto = parseFloat(formEdicion.costo);
      const nuevoPrecioVenta = nuevoCosto * (prod.ganancia || 1.5);

      await productoService.actualizarProducto(prod.id, {
        codigo_interno: formEdicion.codigo,
        descripcion: formEdicion.descripcion,
        costo: nuevoCosto,
        precio_venta: nuevoPrecioVenta
      });
      setEditandoId(null);
      cargar();
    } catch (error) {
      alert('❌ Error al actualizar el artículo.');
    }
  };

  const handleEliminar = async (productoId: string, descripcion: string) => {
    if (window.confirm(`¿Estás seguro de que querés borrar permanentemente:\n"${descripcion}"?\n\nEsta acción no se puede deshacer.`)) {
      try {
        await productoService.eliminarProducto(productoId);
        cargar();
      } catch (error) {
        alert('❌ Error al eliminar el artículo.');
      }
    }
  };
  // ----------------------------------------

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
                <th className="px-4 py-3 font-bold w-[15%]">Código</th>
                <th className="px-4 py-3 font-bold w-[40%]">Descripción</th>
                <th className="px-4 py-3 font-bold w-[12%]">Costo</th>
                <th className="px-4 py-3 font-bold w-[10%]">Mult.</th>
                <th className="px-4 py-3 font-bold w-[10%]">Precio</th>
                <th className="px-4 py-3 font-bold text-center w-[13%]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {productosPaginados.map((prod) => (
                editandoId === prod.id ? (
                  /* FILA EN MODO EDICIÓN */
                  <tr key={prod.id} className="bg-slate-800 border-l-2 border-amber-500">
                    <td className="px-2 py-2">
                      <input type="text" value={formEdicion.codigo} onChange={e => setFormEdicion({...formEdicion, codigo: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:border-amber-500" />
                    </td>
                    <td className="px-2 py-2">
                      <input type="text" value={formEdicion.descripcion} onChange={e => setFormEdicion({...formEdicion, descripcion: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:border-amber-500" />
                    </td>
                    <td className="px-2 py-2">
                      <input type="number" step="0.01" value={formEdicion.costo} onChange={e => setFormEdicion({...formEdicion, costo: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:border-amber-500" />
                    </td>
                    <td className="px-4 py-2" colSpan={2}>
                      <span className="text-[10px] text-amber-400 font-bold block mt-1">Editando...</span>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => handleGuardarEdicion(prod)} className="bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 rounded" title="Guardar">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        </button>
                        <button onClick={() => setEditandoId(null)} className="bg-slate-600 hover:bg-slate-500 text-white p-1.5 rounded" title="Cancelar">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  /* FILA NORMAL */
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
                    <td className="px-4 py-2">
                      <div className="flex gap-1 justify-center">
                        {/* Botón Carrito */}
                        <button onClick={() => onAgregarAlCarrito(prod)} className="bg-blue-600 hover:bg-blue-500 text-white p-1.5 rounded shadow-sm" title="Añadir al pedido">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        </button>
                        {/* Botón Editar */}
                        <button onClick={() => handleIniciarEdicion(prod)} className="bg-amber-600 hover:bg-amber-500 text-white p-1.5 rounded shadow-sm" title="Editar producto">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                        {/* Botón Borrar */}
                        <button onClick={() => handleEliminar(prod.id, prod.descripcion)} className="bg-red-600 hover:bg-red-500 text-white p-1.5 rounded shadow-sm" title="Eliminar producto">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>

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