import {
  BarChart3,
  Bell,
  BellRing,
  House,
  MessageCircle,
  Settings2,
  Star,
  TrendingUp,
  UsersRound,
} from "lucide-react";

export const primaryGuideSections = [
  {
    slug: "inicio",
    title: "Inicio",
    icon: House,
    summary: "Tu punto de partida para saber qué ocurre en el negocio sin revisar cada sección por separado.",
    panelHref: "/dashboard",
    location: "Panel > Inicio",
    reading: [
      { title: "Opiniones y satisfacción", body: "La cantidad de opiniones te dice cuántas respuestas estás viendo. La satisfacción resume sus puntuaciones; acompáñala siempre con la cantidad de respuestas para saber cuánto respaldo tiene." },
      { title: "Pendientes de atención", body: "Es el punto de partida para revisar asuntos abiertos. Entra a Alertas para conocer el motivo, el estado y el seguimiento de cada caso." },
      { title: "Periodo y sucursal", body: "Las cifras corresponden a los filtros elegidos. Para comparar dos vistas, usa el mismo periodo y comprueba si estás viendo una sucursal o todo el negocio." },
    ],
    purpose: "Entra aquí al comenzar el día o la semana para decidir qué revisar primero.",
    find: "Opiniones recibidas, satisfacción (CSAT), pendientes de atención, últimas opiniones y un resumen por sucursal. El filtro cambia la vista, no los datos guardados.",
    steps: [
      { title: "Ajusta la vista", body: "En Filtros, elige un periodo y, si corresponde, una sucursal. Deja la vista global para ver el negocio completo." },
      { title: "Lee las cifras", body: "Opiniones recibidas cuenta respuestas; CSAT resume la satisfacción; Pendientes de atención señala asuntos para revisar. Abre Alertas para conocer cada caso." },
      { title: "Pasa al detalle", body: "Para entender una cifra, entra a Valoraciones y lee las opiniones del mismo periodo y sucursal. El resumen no cuenta toda la historia." },
      { title: "Consigue primeras opiniones", body: "Si aún no tienes sucursal, créala en Gestión. Después usa Compartir QR para que los clientes opinen desde su teléfono." },
    ],
  },
  {
    slug: "valoraciones",
    title: "Valoraciones",
    icon: Star,
    summary: "Reúne lo que cuentan los clientes después de visitar una sucursal.",
    panelHref: "/dashboard#comentarios",
    location: "Panel > Valoraciones",
    reading: [
      { title: "Listado y Gráficos", body: "Listado te permite leer cada experiencia. Gráficos agrupa las respuestas para observar patrones. La captura muestra Gráficos; cambia a Listado para comprender los comentarios detrás de las cifras." },
      { title: "Puntuación, tipo y sentimiento", body: "Son formas distintas de organizar una opinión. La puntuación es la valoración recibida; el tipo y el sentimiento ayudan a clasificarla. Lee el texto antes de decidir cómo atenderla." },
      { title: "Estado de seguimiento", body: "Indica en qué punto está la atención de la opinión. Una nota útil explica qué ocurrió, qué se hizo y qué falta, para que otra persona pueda continuar." },
    ],
    purpose: "Úsala para entender una experiencia concreta o comprobar qué hay detrás de un cambio en Inicio.",
    find: "Listado muestra opiniones individuales; Gráficos muestra el conjunto. Puedes filtrar por fecha, sucursal, tipo y sentimiento.",
    steps: [
      { title: "Acota las opiniones", body: "Elige fecha, sucursal, tipo de comentario o sentimiento. Esta vista no tiene buscador de texto; usa los filtros para reducir la lista." },
      { title: "Cambia de vista", body: "En Listado abre una opinión y lee exactamente qué dijo el cliente. En Gráficos observa el conjunto; vuelve al listado antes de sacar conclusiones." },
      { title: "Da seguimiento", body: "Si tienes permiso, cambia el estado y guarda una nota que explique qué se hizo o cuál es el siguiente paso." },
    ],
  },
  {
    slug: "alertas",
    title: "Alertas",
    icon: Bell,
    summary: "Concentra los asuntos que podrían necesitar atención o seguimiento.",
    panelHref: "/dashboard#alertas",
    location: "Panel > Alertas",
    reading: [
      { title: "Cada tarjeta es un caso", body: "Revisa su sucursal, el asunto y la persona asignada. Sin asignar significa que todavía debes acordar quién se hará cargo; no significa que el caso esté resuelto." },
      { title: "Estado y plazo", body: "El estado describe el avance de la atención. SLA es el plazo previsto para atenderla; vencido indica que ese plazo ya pasó. Es distinto de la prioridad o gravedad del asunto." },
      { title: "Filtros de la lista", body: "La captura muestra casos nuevos. Si buscas uno que ya estaba en seguimiento, cambia el estado seleccionado antes de concluir que desapareció." },
    ],
    purpose: "Revísala cuando Inicio marque pendientes o recibas un aviso para no perder casos importantes entre todas las opiniones.",
    find: "Casos por estado y sucursal, con un filtro para mostrar los que tienen el plazo de atención (SLA) vencido.",
    steps: [
      { title: "Ordena los casos", body: "Filtra por estado o sucursal. Activa SLA vencido si quieres empezar por los casos cuyo plazo esperado ya pasó." },
      { title: "Abre y atiende", body: "Lee la opinión y el historial antes de actuar. Si tienes permiso, asigna una persona, actualiza el estado y anota el siguiente paso." },
      { title: "Configura los avisos", body: "En Contacto de aviso se configura el correo o teléfono para escalamientos, si tu organización usa esa opción." },
    ],
  },
  {
    slug: "informes",
    title: "Informes",
    icon: BarChart3,
    summary: "Ayudan a pasar de comentarios aislados a una lectura del periodo por sucursal.",
    panelHref: "/dashboard#informes",
    location: "Panel > Informes",
    reading: [
      { title: "Preparación del informe", body: "El porcentaje de preparación indica cuánto contexto tiene el informe para elaborarse. No es la satisfacción del cliente ni una calificación del negocio." },
      { title: "Borrador o listo para compartir", body: "Un borrador puede servir para explorar, pero necesita más contexto. Cuando está listo, abre la vista previa, revisa el periodo y lee sus conclusiones antes de enviarlo." },
      { title: "Lectura con IA", body: "Es una interpretación de las opiniones disponibles. Puede omitir matices o equivocarse; confirma los patrones importantes leyendo las experiencias originales." },
    ],
    purpose: "Úsalos antes de una reunión o una decisión para observar un periodo completo, no una sola opinión.",
    find: "Preparación del informe, calidad del contexto y vista previa. Puede aparecer como borrador si faltan datos; la lectura con IA es una ayuda aparte.",
    steps: [
      { title: "Comprueba el contexto", body: "Elige el periodo y la sucursal. Mira cuántas respuestas tienen contexto útil y si el informe está listo o todavía es un borrador." },
      { title: "Lee el informe", body: "Pulsa Ver informe para abrir la vista previa. Desde allí puedes imprimir o guardar un PDF. Si es borrador, acláralo al compartirlo." },
      { title: "Comprueba los patrones", body: "Si usas Generar lectura con IA, confirma sus afirmaciones en las opiniones originales antes de tomar decisiones." },
    ],
  },
  {
    slug: "mejoras",
    title: "Mejoras",
    icon: TrendingUp,
    summary: "Propone por dónde empezar a mejorar a partir de las opiniones disponibles.",
    panelHref: "/dashboard#mejoras",
    location: "Panel > Informes > Mejoras",
    reading: [
      { title: "Selección de sucursal", body: "Cada pestaña reúne las propuestas de esa sucursal. Comprueba el nombre antes de llevar una recomendación a tu equipo." },
      { title: "Propuesta de mejora", body: "El título resume el asunto y el texto explica una posible acción. Trátala como una idea para revisar: todavía debes confirmar la situación y decidir qué conviene hacer." },
      { title: "Regenerar mejoras", body: "Solicita una nueva síntesis de los comentarios disponibles. No marca casos como resueltos ni asigna personas. La pantalla conserva una foto del periodo, no un seguimiento automático de tareas." },
    ],
    purpose: "Úsala cuando ya hay comentarios para discutir posibles cambios con tu equipo. No ejecuta acciones por sí sola.",
    find: "La pestaña Mejoras está dentro de Informes. Una persona autorizada pide una síntesis con IA y después puede revisar propuestas por sucursal.",
    steps: [
      { title: "Abre Informes > Mejoras", body: "Si es la primera vez, verás Generar mejoras con IA antes de que aparezca la selección de sucursales." },
      { title: "Solicita la síntesis", body: "Si tienes permiso y hay comentarios, pulsa Generar mejoras con IA. Esto no modifica las opiniones ni crea tareas automáticamente." },
      { title: "Revisa cada sucursal", body: "Después de generar, cambia entre sucursales y compara la propuesta con las opiniones originales." },
      { title: "Decide con tu equipo", body: "Elijan una acción concreta, una persona responsable y un momento para comprobar si funcionó." },
    ],
  },
  {
    slug: "escucha",
    title: "Escucha",
    icon: MessageCircle,
    summary: "Muestra cómo el equipo registra su práctica de escucha y ayuda a acompañar a cada colaborador. Es distinta de las opiniones de clientes.",
    panelHref: "/dashboard/escucha",
    location: "Panel > Escucha",
    reading: [
      { title: "Evaluaciones y escucha alta", body: "Evaluaciones cuenta registros, no personas: una persona puede registrar varias. Escucha alta reúne los niveles de escucha empática y diálogo generativo." },
      { title: "Media y moda", body: "Media es el promedio numérico de los niveles registrados. Moda es el nivel que más se repite. Pueden ser distintos; ninguno resume por sí solo la experiencia de todo el equipo." },
      { title: "Evolución y registros", body: "Más abajo encontrarás la distribución, los cambios diarios y las notas recientes. Úsalos para entender la cifra del encabezado antes de pasar a una conversación de Coaching." },
    ],
    purpose: "Sirve para acompañar la práctica de escucha del equipo, sin mezclarla con las opiniones de clientes.",
    find: "Evaluaciones, nivel promedio, nivel más frecuente, evolución diaria, distribución de niveles y registros recientes, con filtros de fecha y sucursal.",
    steps: [
      { title: "Activa la participación", body: "Una persona autorizada activa Participa en Escucha para cada integrante en Gestión > Equipo. Se configura por persona, no por rol." },
      { title: "Registra evaluaciones", body: "Quien participa abre su evaluación de escucha desde su acceso. Desde la analítica también hay un enlace para abrirla, según la cuenta." },
      { title: "Lee la evolución", body: "Filtra por fecha y sucursal; revisa varias evaluaciones antes de interpretar un nivel aislado." },
      { title: "Pasa a Coaching", body: "Si aparece una señal que requiere apoyo, usa Coaching para preparar una conversación con esa persona." },
    ],
  },
] as const;

export const additionalGuideSections = [
  {
    slug: "gestion",
    title: "Gestión",
    icon: Settings2,
    summary: "Organiza las sucursales, las personas y los accesos del negocio desde el menú de tu cuenta.",
    panelHref: "/dashboard#sucursales",
    location: "Menú de cuenta > Gestión",
    reading: [
      { title: "Sucursales y Equipo", body: "Sucursales organiza los puntos de atención y sus códigos QR. Equipo reúne las personas, sus roles y la sucursal a la que pertenecen." },
      { title: "Permisos", body: "Los roles operativos determinan qué secciones puede usar una persona. Participa en Escucha se activa por separado en su ficha de Equipo." },
      { title: "Configuración de informes", body: "La captura muestra las opciones Semanal, Mensual y Ambas. Seleccionar una opción prepara el cambio; Guardar cadencia lo confirma. Más abajo están las reglas de operación y los avisos del dispositivo." },
    ],
    purpose: "Esta es la configuración del negocio. Si estás empezando, crea o revisa una sucursal antes de pedir opiniones con su QR.",
    find: "Cuatro pestañas: Sucursales, Equipo, Permisos y Configuración. Las opciones de edición cambian según tu rol.",
    steps: [
      { title: "Sucursales", body: "Crea o edita un punto de atención y comprueba sus datos. Cada sucursal tiene un QR y enlace propios para recibir opiniones; puedes compartirlos o preparar material para imprimir." },
      { title: "Equipo", body: "Revisa integrantes, rol, sucursal y estado de acceso. Una persona autorizada puede añadir integrantes y activar Participa en Escucha de forma individual." },
      { title: "Permisos", body: "Consulta qué secciones puede usar cada rol operativo. Si alguien no ve una función, revisa primero su rol y estos permisos." },
      { title: "Configuración", body: "Ajusta la frecuencia de informes y las reglas de seguimiento. Antes de cambiar una regla, acuerda quién atenderá los avisos resultantes." },
    ],
  },
  {
    slug: "notificaciones",
    title: "Notificaciones",
    icon: BellRing,
    summary: "La campana del panel reúne avisos recientes y accesos a los asuntos relacionados.",
    panelHref: "/dashboard",
    location: "Panel > Campana de notificaciones",
    reading: [
      { title: "Avisos nuevos", body: "El indicador junto a la campana señala avisos sin leer. El título y la descripción explican qué ocurrió y a qué parte del panel puedes ir." },
      { title: "Abrir y ver todas", body: "Pulsa el aviso para ir al asunto relacionado. Ver todas abre el listado de notificaciones; no cambia el estado de una alerta ni resuelve una opinión." },
      { title: "Eliminar un aviso", body: "Quitar una notificación limpia el listado de avisos. El seguimiento del asunto se realiza en su sección, por ejemplo Alertas o Valoraciones." },
    ],
    purpose: "Consúltala para enterarte de novedades sin recorrer todas las secciones y abrir después el asunto correspondiente.",
    find: "La campana está en la navegación del panel. Al abrirla aparecen avisos recientes y la opción Ver todas para revisar más.",
    steps: [
      { title: "Abre la campana", body: "Entra al panel y pulsa el icono de campana en la navegación para leer los avisos recientes." },
      { title: "Mira todos los avisos", body: "Usa Ver todas para revisar el listado disponible para tu cuenta. Pulsa un aviso para abrir el asunto relacionado." },
      { title: "Continúa el seguimiento", body: "Si trata de un caso, revisa Alertas; si trata de una opinión, abre Valoraciones. Deja el seguimiento en esa sección, no en la campana." },
    ],
  },
] as const;

export const coachingGuide = {
  slug: "coaching",
  title: "Coaching",
  icon: UsersRound,
  summary: "Convierte las evaluaciones de escucha en conversaciones de acompañamiento con cada colaborador.",
  panelHref: "/dashboard/escucha/coaching",
  location: "Panel > Escucha > Coaching",
  reading: [
    { title: "Prioridad esta semana", body: "Perks selecciona personas cuyas evaluaciones muestran señales para revisar. Debajo del nombre explica el motivo, como un cambio de nivel o tiempo sin registros. La etiqueta Alta señala prioridad de revisión, no una calificación de la persona." },
    { title: "Evaluación individual", body: "Más abajo está la lista completa del periodo, con registros, promedio, nivel frecuente y última nota. Pulsa una persona para abrir su perfil y preparar la conversación." },
    { title: "Preparación y acuerdos", body: "Las preguntas de preparación son privadas para quien acompaña y no se envían automáticamente al colaborador. Después de conversar, registra una acción acordada si tu cuenta tiene permiso." },
  ],
  purpose: "Úsala después de revisar Escucha, cuando necesites entender una señal y conversar con una persona sobre cómo seguir practicando.",
  find: "Prioridades de la semana y personas del periodo. Cada perfil muestra registros, evolución y sugerencias privadas para preparar la conversación.",
  steps: [
    { title: "Revisa las prioridades", body: "Una prioridad puede deberse a un nivel bajo, una caída respecto a registros anteriores o falta de evaluaciones. Abre el perfil antes de concluir algo." },
    { title: "Prepara la conversación", body: "Mira la evolución y los registros. Las preguntas sugeridas son un punto de partida, no un diagnóstico ni un guion obligatorio." },
    { title: "Acuerda una acción", body: "Escucha el contexto del colaborador. Si tienes permiso, deja por escrito una acción concreta acordada para darle continuidad." },
    { title: "Vuelve a revisar", body: "Compara las siguientes evaluaciones. Sin registros nuevos, no interpretes el silencio como mejora o retroceso." },
  ],
} as const;

export const allGuideSections = [...primaryGuideSections, coachingGuide, ...additionalGuideSections] as const;

export function getGuideSection(slug: string) {
  return allGuideSections.find((section) => section.slug === slug);
}
