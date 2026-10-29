// src/components/Sidebar.tsx
import { useEffect, useState } from 'react';
import { proveedorService } from '../services/proveedorService';
import type { Proveedor } from '../types';

interface SidebarProps {
  proveedorSeleccionadoId?: string;
  onSelectProveedor: (proveedor: Proveedor) => void;
}

export const Sidebar = ({ proveedorSeleccionadoId, onSelectProveedor }: SidebarProps) => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  useEffect(() => {
    async function cargar() {
      try {
        const datos = await proveedorService.obtenerTodos();
        setProveedores(datos);
      } catch (error) {
        console.error('Error al cargar proveedores:', error);
      }
    }
    cargar();
  }, []);

  return (
    <aside className="w-52 bg-slate-950 border-r border-slate-900 flex flex-col h-screen overflow-y-auto">
      <div className="p-5 border-b border-slate-900">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center shadow-sm border border-red-500/50 flex-shrink-0">
            <span className="text-white font-black text-[10px]">R20</span>
          </div>
          <h1 className="text-base font-black text-white tracking-tight truncate">
            Ruta <span className="text-red-500">20</span>
          </h1>
        </div>
      </div>

      <nav className="flex-1 py-4">
        <div className="px-4 mb-2">
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
            Proveedores ({proveedores.length})
          </h2>
        </div>
        <ul className="space-y-0.5">
          {proveedores.map((prov) => (
            <li key={prov.id}>
              <button
                onClick={() => onSelectProveedor(prov)}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-all flex items-center justify-between ${
                  proveedorSeleccionadoId === prov.id
                    ? 'bg-blue-600/10 text-blue-400 border-r-2 border-blue-500' 
                    : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
                }`}
              >
                <span className="truncate pr-2">{prov.nombre}</span>
                {proveedorSeleccionadoId === prov.id && (
                  <span className="text-blue-500 flex-shrink-0">›</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-900">
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse flex-shrink-0"></div>
          <span className="truncate">Sistema Activo 🚀</span>
        </div>
      </div>
    </aside>
  );
};