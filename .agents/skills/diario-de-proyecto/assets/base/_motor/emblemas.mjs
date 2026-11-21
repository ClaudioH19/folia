// Emblemas de línea (viewBox 0 0 64 64). Sirven para la portada, el lomo en la estantería, el encabezado y el favicon.
// Reglas: solo trazos (sin relleno), grosor lo pone el CSS; nada de logos ni marcas reales (no inventar activos de marca).
export const EMBLEMAS = {
  microscopio: `<rect x="26" y="5" width="10" height="25" rx="2.5" transform="rotate(-16 31 17)"/><path d="M33 31l1.6 5.4" /><rect x="31" y="35" width="6" height="7" rx="1.2" transform="rotate(-16 34 38)"/>
<path d="M39 13c11 3 16 15 11 26-2.6 5-7 8.6-14 9.6"/><path d="M19 47h22M23 43h13"/><path d="M12 57h40M30 47v10"/>`,
  sitio: `<rect x="5" y="9" width="54" height="42" rx="4.5"/><path d="M5 20h54"/><path d="M11 14.5h.01M17 14.5h.01M23 14.5h.01"/><path d="M12 29h22M12 36h15M12 43h19"/><path d="M41 47c0-9 4.5-14.5 13-15.5 0 9-4.5 14.5-13 15.5z"/><path d="M41 47c2-5 5.5-8.5 10-10.5"/><path d="M20 57h24"/>`,
  engranaje: `<circle cx="32" cy="32" r="9"/><path d="M32 6v8M32 50v8M6 32h8M50 32h8M13.6 13.6l5.7 5.7M44.7 44.7l5.7 5.7M13.6 50.4l5.7-5.7M44.7 19.3l5.7-5.7"/><circle cx="32" cy="32" r="19"/>`,
  escudo: `<path d="M32 5 10 13v16c0 14 9 25 22 30 13-5 22-16 22-30V13z"/><path d="M22 31l8 8 13-15"/>`,
  servidor: `<rect x="8" y="9" width="48" height="16" rx="3"/><rect x="8" y="30" width="48" height="16" rx="3"/><path d="M15 17h.01M15 38h.01M24 17h22M24 38h22"/><path d="M32 46v7M20 57h24"/>`,
  nube: `<path d="M46 47a11 11 0 0 0-3-21.5A15 15 0 0 0 14 31a8.5 8.5 0 0 0 1.5 16z"/><path d="M32 55V37M26 43l6-6 6 6"/>`,
  matraz: `<path d="M25 6h14M27 6v18L11 51a4.5 4.5 0 0 0 4 7h34a4.5 4.5 0 0 0 4-7L37 24V6"/><path d="M19 42h26"/><path d="M30 49h.01M37 47h.01"/>`,
  libro: `<path d="M10 9a4 4 0 0 1 4-4h38v44H14a4 4 0 0 0-4 4z"/><path d="M10 53a4 4 0 0 0 4 4h38"/><path d="M20 17h22M20 25h16"/>`,
  llave: `<circle cx="20" cy="40" r="11"/><path d="M28 32 54 6M44 16l7 7M38 22l6 6"/>`,
  base: `<ellipse cx="32" cy="14" rx="20" ry="8"/><path d="M12 14v34c0 4.4 9 8 20 8s20-3.6 20-8V14M12 31c0 4.4 9 8 20 8s20-3.6 20-8"/>`,
};

export const emblemaSvg = (nombre, clase = 'emb', raw) => {
  const inner = raw || EMBLEMAS[nombre];
  if (!inner) throw new Error(`Emblema desconocido: «${nombre}». Opciones: ${Object.keys(EMBLEMAS).join(', ')}`);
  return `<svg class="${clase}" viewBox="0 0 64 64" aria-hidden="true" focusable="false">${inner}</svg>`;
};

// favicon (trazo oscuro sobre cuero): se incrusta como data URI
export const faviconDe = (nombre, raw) => {
  const inner = raw || EMBLEMAS[nombre];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='-6 -6 76 76'><rect x='-6' y='-6' width='76' height='76' rx='14' fill='#4a2b16'/><g fill='none' stroke='#ecdcae' stroke-width='3.2' stroke-linecap='round' stroke-linejoin='round'>${inner.replace(/"/g, "'")}</g></svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
};
