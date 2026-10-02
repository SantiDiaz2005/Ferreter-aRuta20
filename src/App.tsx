// src/App.tsx
import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TablaProductos } from './components/TablaProductos';
import { Carrito } from './components/Carrito';
import { ImportadorMaestro } from './components/ImportadorMaestro'; // <-- IMPORTAMOS EL NUEVO BOTÓN MAESTRO
import type { Proveedor, Producto, ItemCarrito } from './types';

function App() {
  const [proveedorActual, setProveedorActual] = useState<Proveedor | null>(null);
  
  // LA MAGIA 1: Al abrir la página, busca si quedaron pedidos guardados de antes en el disco del navegador
  const [carritos, setCarritos] = useState<Record<string, ItemCarrito[]>>(() => {
    const memoriaGuardada = localStorage.getItem('carritos_ruta20');
    if (memoriaGuardada) {
      try {
        return JSON.parse(memoriaGuardada);
      } catch (error) {
        console.error("Error leyendo la memoria", error);
        return {};
      }
    }
    return {};
  });

  // LA MAGIA 2: El vigilante. Cada vez que el changuito cambia, lo guarda instantáneamente
  useEffect(() => {
    localStorage.setItem('carritos_ruta20', JSON.stringify(carritos));
  }, [carritos]);

  // Función para agregar o sumar cantidad a un producto en el carrito actual
  const handleAgregarAlCarrito = (producto: Producto) => {
    if (!proveedorActual) return;
    
    setCarritos(prev => {
      const carritoDelProveedor = prev[proveedorActual.id] || [];
      const itemExistente = carritoDelProveedor.find(i => i.id === producto.id);
      
      let nuevoCarrito;
      if (itemExistente) {
        nuevoCarrito = carritoDelProveedor.map(i => 
          i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      } else {
        nuevoCarrito = [...carritoDelProveedor, { ...producto, cantidad: 1 }];
      }
      
      return { ...prev, [proveedorActual.id]: nuevoCarrito };
    });
  };

  // Función para sacar un producto del carrito
  const handleRemoverDelCarrito = (productoId: string) => {
    if (!proveedorActual) return;
    
    setCarritos(prev => {
      const carritoDelProveedor = prev[proveedorActual.id] || [];
      return {
        ...prev,
        [proveedorActual.id]: carritoDelProveedor.filter(i => i.id !== productoId)
      };
    });
  };

  // Función para restar cantidad a un producto desde el carrito
  const handleRestarDelCarrito = (productoId: string) => {
    if (!proveedorActual) return;
    
    setCarritos(prev => {
      const carritoDelProveedor = prev[proveedorActual.id] || [];
      const itemExistente = carritoDelProveedor.find(i => i.id === productoId);
      
      if (itemExistente && itemExistente.cantidad > 1) {
        // Si hay más de 1, le restamos 1
        const nuevoCarrito = carritoDelProveedor.map(i => 
          i.id === productoId ? { ...i, cantidad: i.cantidad - 1 } : i
        );
        return { ...prev, [proveedorActual.id]: nuevoCarrito };
      } else {
        // Si hay 1 solo y tocamos "-", lo eliminamos del carrito
        return {
          ...prev,
          [proveedorActual.id]: carritoDelProveedor.filter(i => i.id !== productoId)
        };
      }
    });
  };

  // Obtenemos los items del proveedor seleccionado actualmente (o vacío si no hay nada)
  const itemsCarritoActual = proveedorActual ? (carritos[proveedorActual.id] || []) : [];

  return (
    <div className="flex h-screen bg-slate-950 font-sans overflow-hidden">
      
      {/* Barra lateral izquierda */}
      <Sidebar
        proveedorSeleccionadoId={proveedorActual?.id}
        onSelectProveedor={setProveedorActual}
      />

      {/* Panel principal central */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950 relative">
        
        {/* Cabecera: Solo aparece cuando elegimos un proveedor */}
        {proveedorActual && (
          <header className="h-16 min-h-[4rem] border-b border-slate-800 px-8 flex items-center justify-between bg-slate-950">
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                {proveedorActual.nombre}
              </h2>
              <p className="text-xs text-slate-400">
                {`Tel: ${proveedorActual.telefono || 'Sin teléfono'} | Email: ${proveedorActual.email || 'Sin email'}`}
              </p>
            </div>
          </header>
        )}

        <section className="flex-1 p-8 overflow-y-auto w-full">
          {proveedorActual ? (
            <div className="w-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700 text-xl">
                  {/* Ícono de caja SVG (reemplaza al emoji) */}
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-200">Catálogo de {proveedorActual.nombre}</h3>
                  <p className="text-sm text-slate-400">Gestioná los precios y armá pedidos para WhatsApp.</p>
                </div>
              </div>
              
              <TablaProductos 
                proveedor={proveedorActual}
                onAgregarAlCarrito={handleAgregarAlCarrito}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto mt-[-5vh] animate-fade-in px-4">
              
              {/* Escudo Ruta 20 (Colores sólidos y bordes definidos) */}
              <div className="w-28 h-28 bg-gradient-to-br from-red-600 to-red-800 rounded-3xl flex items-center justify-center shadow-lg shadow-red-900 border border-red-500 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="text-center transform -rotate-3">
                  <span className="block text-white font-black text-2xl tracking-tighter leading-none">RUTA</span>
                  <span className="block text-white font-black text-5xl tracking-tighter leading-none mt-1">20</span>
                </div>
              </div>

              {/* Título de Bienvenida */}
              <h2 className="text-4xl font-black text-white mb-4 tracking-tight text-center">
                Ferretería <span className="text-red-500">Ruta 20</span>
              </h2>
              <p className="text-slate-400 text-center mb-12 text-base max-w-lg">
                Sistema centralizado de gestión B2B. Actualizá costos, ajustá márgenes de ganancia y automatizá tus pedidos por WhatsApp.
              </p>

              {/* Tarjetas de características (Sin transparencias y con SVGs) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center shadow-md hover:border-slate-700 transition-colors">
                  <svg className="w-8 h-8 text-blue-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                  </svg>
                  <h4 className="text-slate-200 font-bold text-sm mb-1 uppercase tracking-wider">Catálogos</h4>
                  <p className="text-slate-500 text-xs">Sincronización inteligente por Excel</p>
                </div>
                
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center shadow-md hover:border-slate-700 transition-colors">
                  <svg className="w-8 h-8 text-emerald-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <h4 className="text-slate-200 font-bold text-sm mb-1 uppercase tracking-wider">Márgenes</h4>
                  <p className="text-slate-500 text-xs">Ajuste de rentabilidad en tiempo real</p>
                </div>
                
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center shadow-md hover:border-slate-700 transition-colors">
                  <svg className="w-8 h-8 text-purple-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <h4 className="text-slate-200 font-bold text-sm mb-1 uppercase tracking-wider">Pedidos</h4>
                  <p className="text-slate-500 text-xs">Generación de PDF y envío automático</p>
                </div>
              </div>

              {/* Indicador de acción */}
              <div className="mt-12 flex items-center gap-3 text-slate-300 font-medium text-sm bg-slate-800 px-8 py-4 rounded-full border border-slate-700 shadow-sm">
                <svg className="w-5 h-5 text-blue-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Elegí un proveedor de la barra lateral para comenzar
              </div>

              {/* ACÁ ENTRA EL NUEVO IMPORTADOR MAESTRO */}
              <ImportadorMaestro />
              
            </div>
          )}
        </section>
      </main>

      {/* Panel lateral derecho (Carrito) */}
      {proveedorActual && (
        <Carrito 
          proveedor={proveedorActual} 
          items={itemsCarritoActual}
          onRemoverItem={handleRemoverDelCarrito}
          onSumarItem={handleAgregarAlCarrito}
          onRestarItem={handleRestarDelCarrito}
          // ACÁ SE CONECTA EL BOTÓN DEL TACHO DE BASURA
          onVaciarCarrito={() => setCarritos(prev => ({ ...prev, [proveedorActual.id]: [] }))} 
        />
      )}
    </div>
  );
}

export default App;