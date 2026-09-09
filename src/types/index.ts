// src/types/index.ts

export interface Proveedor {
  id: string;
  nombre: string;
  telefono?: string;
  email?: string;
}

export interface Producto {
  id: string;
  codigo_interno: string;
  descripcion: string;
  costo: number;
  ganancia: number;
  precio_venta: number;
  proveedor_id: string;
  stock?: number;
}

export interface ItemCarrito extends Producto {
  cantidad: number;
}