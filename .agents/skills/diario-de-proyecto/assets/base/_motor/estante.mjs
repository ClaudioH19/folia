import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const niveles = 3;
export const porNivel = 6;
export const capacidad = niveles * porNivel;

export function proyectosEn(carpeta) {
  if (!existsSync(carpeta)) return [];
  return readdirSync(carpeta).filter(slug => existsSync(join(carpeta, slug, 'diario.mjs')));
}

export function comprobarCupo(total) {
  if (total > capacidad) {
    throw new Error(`La estantería admite ${capacidad} proyectos (${niveles} niveles de ${porNivel}). Para incorporar más, usa otra colección.`);
  }
}
