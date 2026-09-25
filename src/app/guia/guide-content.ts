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
    steps: [
      { title: "Ajusta la vista", body: "Elige un periodo y, si corresponde, una sucursal. Las cifras y listas se ajustan a esa selección." },
      { title: "Lee el panorama", body: "Consulta opiniones recibidas, satisfacción, casos pendientes, últimas valoraciones y el estado de tus sucursales." },
      { title: "Consigue primeras opiniones", body: "Si aún no hay datos, usa Compartir QR para abrir el código de la sucursal e invitar a tus clientes a opinar." },
    ],
    note: "Empieza aquí cada vez que quieras decidir qué revisar primero.",
  },
  {
    slug: "valoraciones",
    title: "Valoraciones",
    icon: Star,
    summary: "Reúne lo que cuentan los clientes después de visitar una sucursal.",
    panelHref: "/dashboard#comentarios",
    steps: [
      { title: "Encuentra una opinión", body: "Busca una opinión o filtra por fecha, sucursal, tipo de comentario y sentimiento." },
      { title: "Cambia de vista", body: "Alterna entre Listado y Gráficos para leer casos concretos o ver el conjunto de calificaciones." },
      { title: "Da seguimiento", body: "Abre una valoración para ver el detalle. Si tienes permiso, puedes cambiar su estado y guardar notas de seguimiento." },
    ],
    note: "Una valoración es una señal para entender la experiencia, no una conclusión por sí sola.",
  },
  {
    slug: "alertas",
    title: "Alertas",
    icon: Bell,
    summary: "Concentra los asuntos que podrían necesitar atención o seguimiento.",
    panelHref: "/dashboard#alertas",
    steps: [
      { title: "Ordena los casos", body: "Revisa los casos por estado, sucursal o plazo de atención vencido." },
      { title: "Abre y atiende", body: "Abre el caso para entender su origen. Según tus permisos, asigna a una persona, actualiza el estado o añade una nota." },
      { title: "Configura los avisos", body: "En Contacto de aviso se configura el correo o teléfono para escalamientos, si tu organización usa esa opción." },
    ],
    note: "Si no aparecen alertas, puede ser que aún no haya opiniones o que el filtro elegido no tenga casos.",
  },
  {
    slug: "informes",
    title: "Informes",
    icon: BarChart3,
    summary: "Ayudan a pasar de comentarios aislados a una lectura del periodo por sucursal.",
    panelHref: "/dashboard#informes",
    steps: [
      { title: "Comprueba el contexto", body: "Mira cuántas respuestas tienen contexto suficiente y qué falta para preparar un informe más claro." },
      { title: "Detecta patrones", body: "Revisa patrones, posibles cambios bruscos y casos de riesgo sin depender solo del promedio general." },
      { title: "Abre el informe", body: "Abre la vista previa del informe para leerlo, imprimirlo o guardarlo como PDF. Puede mostrarse como borrador si faltan datos." },
    ],
    note: "La frecuencia semanal o mensual depende de la configuración de tu organización.",
  },
  {
    slug: "mejoras",
    title: "Mejoras",
    icon: TrendingUp,
    summary: "Propone por dónde empezar a mejorar a partir de las opiniones disponibles.",
    panelHref: "/dashboard#mejoras",
    steps: [
      { title: "Selecciona una sucursal", body: "Dentro de Informes, cambia a la pestaña Mejoras y selecciona una sucursal." },
      { title: "Solicita la síntesis", body: "Cuando haya comentarios, puedes solicitar una síntesis con IA que ordena los temas y su urgencia." },
      { title: "Decide con tu equipo", body: "Lee la propuesta junto con los casos originales y decide con tu equipo qué acción tiene sentido aplicar." },
    ],
    note: "La generación se solicita manualmente; la propuesta no cambia casos ni ejecuta acciones por ti.",
  },
  {
    slug: "escucha",
    title: "Escucha",
    icon: MessageCircle,
    summary: "Muestra cómo el equipo registra su práctica de escucha y ayuda a acompañar a cada colaborador. Es distinta de las opiniones de clientes.",
    panelHref: "/dashboard/escucha",
    steps: [
      { title: "Lee la analítica", body: "Consulta evaluaciones, nivel promedio, nivel más frecuente y evolución diaria." },
      { title: "Compara periodos", body: "Filtra por fechas y sucursal para comparar periodos sin mezclar equipos diferentes." },
      { title: "Explora los registros", body: "Revisa la distribución de niveles y los registros recientes. Desde aquí puedes abrir la evaluación de escucha." },
    ],
    note: "Los gráficos empiezan a cobrar sentido cuando el equipo registra evaluaciones.",
  },
] as const;

export const additionalGuideSections = [
  {
    slug: "gestion",
    title: "Gestión",
    icon: Settings2,
    summary: "Organiza las sucursales, las personas y los accesos del negocio desde el menú de tu cuenta.",
    panelHref: "/dashboard#sucursales",
    steps: [
      { title: "Sucursales", body: "Crea o edita los puntos de atención. Cada sucursal tiene un QR para recibir opiniones; puedes copiar su enlace o preparar el material para imprimir." },
      { title: "Equipo", body: "Consulta quién participa, su rol, sucursal y estado de acceso. Las personas autorizadas pueden agregar integrantes y mantener sus datos." },
      { title: "Permisos", body: "Define qué secciones puede usar cada rol operativo. Si una opción no aparece en tu cuenta, puede depender de estos permisos." },
      { title: "Configuración", body: "Ajusta la frecuencia de los informes y algunas reglas de seguimiento. Estos cambios suelen estar reservados a responsables del negocio." },
    ],
    note: "Algunos cambios solo están disponibles para responsables del negocio.",
  },
  {
    slug: "notificaciones",
    title: "Notificaciones",
    icon: BellRing,
    summary: "La campana del panel reúne avisos recientes y accesos a los asuntos relacionados.",
    panelHref: "/dashboard",
    steps: [
      { title: "Abre la campana", body: "Consulta los avisos recientes desde el panel." },
      { title: "Mira todos los avisos", body: "Usa Ver todas para revisar más notificaciones y abrir el asunto relacionado." },
      { title: "Continúa el seguimiento", body: "Las notificaciones no reemplazan la revisión de casos en Alertas." },
    ],
    note: "Si no hay avisos, vuelve a revisar cuando lleguen nuevas opiniones o cambie el estado de un caso.",
  },
] as const;

export const coachingGuide = {
  slug: "coaching",
  title: "Coaching",
  icon: UsersRound,
  summary: "Convierte las evaluaciones de escucha en conversaciones de acompañamiento con cada colaborador.",
  panelHref: "/dashboard/escucha/coaching",
  steps: [
    { title: "Revisa las prioridades", body: "Revisa las personas priorizadas para esta semana y la lista completa del periodo." },
    { title: "Abre una persona", body: "Abre a una persona para ver sus registros, su evolución y preguntas útiles para conversar." },
    { title: "Acuerda una acción", body: "Si tienes permiso, puedes dejar por escrito una acción acordada para darle continuidad." },
  ],
  note: "La prioridad orienta la conversación; no reemplaza el criterio de quien conoce al equipo.",
} as const;

export const allGuideSections = [...primaryGuideSections, coachingGuide, ...additionalGuideSections] as const;

export function getGuideSection(slug: string) {
  return allGuideSections.find((section) => section.slug === slug);
}
