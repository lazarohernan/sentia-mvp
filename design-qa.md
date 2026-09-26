# Landing Design QA

- Source visual truth: `public/images/landing-page-concept-v1.png`
- Hero comparison: `tmp/landing-audit/qa-hero-comparison.png`
- Implementation contact sheet: `tmp/landing-audit/qa-final-sections-contact-sheet.png`
- Desktop viewport: 1440 x 900
- Mobile viewport: 390 x 844
- State: public landing, guided example on default and cleaning cases, mobile menu open, FAQ open

## Full-view comparison evidence

The hero comparison places the approved landing concept and the rendered implementation side by side. The implementation keeps the warm service-business photography, editorial headline, green/cream palette, restrained card radius, comment-to-action story, and two primary entry points. Social proof, score claims, and extra dashboard widgets were intentionally removed based on later user direction. The primary action is named "Probar experiencia" because it opens the existing feedback demo rather than a sales form.

## Focused region comparison evidence

The contact sheet includes the final hero, workflow photo, guided example, plan options, FAQ, CTA, and footer at the same desktop viewport. Separate mobile captures verify the hero, menu, guided example, plans, FAQ, and CTA. No focused crop beyond these section views was needed because text, controls, imagery, and spacing are legible at the captured scale.

## Findings

- No remaining P0, P1, or P2 findings.
- Typography now uses the configured Iowan/Palatino serif stack for display headings and the Avenir/Helvetica sans stack for operational copy.
- Section rhythm, 8px radii, green/cream tokens, image treatment, and restrained shadows remain consistent with the selected concept.
- The supporting photograph is sharp, correctly cropped on desktop and mobile, and contains no baked-in UI or text.
- Product copy distinguishes available QR capture, triage, alerts, reports, and multi-sucursal management from unavailable WhatsApp/SMS automation and automatic compensation.

## Interaction and accessibility checks

- Guided example switches between Espera, Atención, and Limpieza and updates the operational result.
- FAQ disclosure opens and exposes its answer.
- Mobile navigation opens, closes, and exposes all landing anchors.
- Desktop and mobile widths have no horizontal document overflow.
- Focus-visible styling and reduced-motion handling are present.
- Browser console reported no errors during the checked flows.

## Comparison history

1. P2: Anchor offsets exposed content from the previous section on mobile. Removed unnecessary scroll margins and re-captured plans and FAQ.
2. P2: Display headings inherited the sans stack despite the visual source using serif. Applied the display font explicitly and re-captured desktop/mobile states.
3. P2: Hero copy implied a WhatsApp capture channel not supported by the current system. Replaced it with the implemented QR origin and added explicit FAQ limits.

## Residual P3 polish

- Final commercial prices and a real sales-contact destination remain intentionally unpublished.
- Plan limits are working proposals and should be updated after pilot usage data is available.

final result: passed

---

# Guía de Perks: revisión visual

- Fuente aprobada: `/Users/lazarohernan/.codex/generated_images/01a0a74a-0599-7231-bf97-d77b2b848c02/exec-456442f0-371b-4d50-8ce6-9b1178c8769f.png`
- Implementación: `http://127.0.0.1:3000/guia`
- Captura de la primera versión de escritorio: `/private/tmp/perks-guide-qa-desktop-final.png`
- Captura de la primera versión móvil: `/private/tmp/perks-guide-qa-mobile.png`
- Estado comparado: parte superior de la guía, sin sesión requerida ni menús abiertos.
- Fuente e implementación: 1536 × 1024 píxeles, densidad 1:1. El navegador se ajustó a 1551 × 1034 para compensar 15 px de barra lateral y 10 px de borde; la captura resultante mide 1536 × 1024.

## Comparación

Se abrieron juntas la referencia y la primera captura. Coinciden la estructura de cabecera salvia, el título y las tarjetas destacadas. La revisión posterior cambió el índice: ahora hay cinco accesos para la experiencia de clientes y un bloque separado para Escucha y Coaching. Se revisaron en el navegador la cabecera, las tarjetas, las ilustraciones y la versión móvil.

- Tipografía: se mantiene la fuente existente de Perks. El título y las tarjetas tienen una jerarquía cercana a la referencia.
- Espaciado: la cabecera y los bloques principales ocupan proporciones comparables; las tarjetas destacadas quedan visibles en el primer pantallazo de escritorio.
- Color: verde salvia y verde oscuro coherentes con la referencia y con la aplicación. El fondo de la aplicación es ligeramente más cálido.
- Imágenes: la pareja de la cabecera se ajustó a los personajes monocromos de la referencia, sin fondo visible ni halo. Se conserva el personaje distinto de Valoraciones y el logo real de Perks. La trama de puntos se dibuja con CSS detrás de ambas ilustraciones.
- Texto: se adaptó la frase de cabecera al propósito real de Perks. La explicación completa de cada sección vive ahora en su propia página.
- Interacción: las tarjetas abren `/guia/[sección]`; el recorrido de cuatro pasos cambia su explicación al pulsar cada opción. Se comprobó la navegación a Inicio, Valoraciones y a la página propia de Coaching. La guía también se revisó en móvil.

## Historial de ajustes

1. Primer contraste: el contenido era más estrecho que la referencia y la fila destacada quedaba demasiado abajo. Se amplió el ancho y se movieron los enlaces secundarios después de las tarjetas. Captura inicial: `/private/tmp/perks-guide-qa-desktop.png`.
2. Segundo contraste: iconos y títulos de acceso se veían pequeños. Se aumentó su tamaño y se recapturó la página. Evidencia final: `/private/tmp/perks-guide-qa-desktop-final.png`.

## Ajuste de ilustraciones

Tras la revisión del usuario se reemplazó la pareja anterior, demasiado colorida, por una versión de trazo verde oscuro basada en los personajes de la cabecera aprobada. Los puntos halftone ahora se generan en CSS para mantenerlos limpios y discretos, también detrás del personaje de Valoraciones.

## Actualización: páginas por sección

Las páginas individuales muestran un resumen, acciones numeradas, una advertencia contextual y accesos al panel y a las demás guías. Gestión, Notificaciones y Coaching tienen página propia. En el índice, el recorrido interactivo está antes de las secciones; Gestión y Notificaciones están justo después del índice, Términos comparte fila con Informes y Escucha/Coaching están agrupados como entrenamiento del equipo. No se muestran espacios vacíos para videos: se podrán añadir después sin cambiar los enlaces actuales.

final result: passed
