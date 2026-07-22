# Dashboard range calendar — design

## Goal

Reemplazar `input type="date"` nativo por un calendario visual de rango con look Perks (emerald / cream).

## Layout (popover)

1. Presets: Hoy | 7 días | 30 días (igual que hoy)
2. Calendario mensual único (móvil) / ancho cómodo en desktop
3. Selección: clic 1 = Desde, clic 2 = Hasta; rango sombreado en emerald
4. Resumen: “12 jul – 22 jul”
5. CTA: Aplicar filtro (deshabilitado hasta tener rango completo)

## Visual

- Fondo popover blanco, área calendario `#f7f8f4`
- Día seleccionado / extremos: `emerald-800`
- Rango intermedio: `emerald-100`
- Hoy: ring sutil, no pasteles ni purple

## Tech

- `react-day-picker` (range) + locale `es`
- Mantener navegación suave (`router.push`) y query `period=custom&start&end`
