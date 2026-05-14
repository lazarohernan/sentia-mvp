import type { DashboardNotification } from "@/domain/dashboard/schemas";

export const dashboardMockContext = {
  company: "Operacion retail",
  scope: "24 sucursales",
  period: "Ultimos 7 dias",
  owner: "Experiencia cliente",
};

export const dashboardMockAiInsight = {
  status: "Insight IA",
  confidence: "Alta confianza",
  headline: "Mall Norte necesita revisión operativa hoy.",
  detail:
    "La IA cruza comentarios, CSAT y estados abiertos. El patrón más claro apunta a espera prolongada y poca explicación al cliente durante el servicio.",
  action: "Priorizar revisión con gerencia de turno",
};

export const dashboardMockAiSignals = [
  {
    label: "Prioridad",
    value: "Mall Norte",
    detail: "Mayor concentración de riesgo",
  },
  {
    label: "Patrón dominante",
    value: "Tiempo de espera",
    detail: "Tema repetido en comentarios recientes",
  },
  {
    label: "Señal positiva",
    value: "Centro",
    detail: "Satisfacción estable y menos casos abiertos",
  },
];

export const dashboardMockSummary = [
  {
    label: "Comentarios",
    value: "1,248",
    detail: "+18% esta semana",
  },
  {
    label: "CSAT",
    value: "4.2/5",
    detail: "CSAT promedio",
  },
  {
    label: "Alertas",
    value: "7",
    detail: "3 requieren seguimiento",
  },
  {
    label: "Sucursales",
    value: "24",
    detail: "18 activas hoy",
  },
];

export const dashboardMockComments = [
  {
    id: "comentario-001",
    customer: "Cliente verificado",
    business: "Cafeteria",
    branch: "Centro",
    sentiment: "Positivo",
    csatScore: 5,
    status: "Nuevo",
    message: "La atencion fue rapida y resolvieron mi solicitud sin vueltas.",
    receivedAt: "Hace 12 min",
  },
  {
    id: "comentario-002",
    customer: "Compra reciente",
    business: "Cafeteria",
    branch: "Mall Norte",
    sentiment: "Riesgo",
    csatScore: 2,
    status: "En revision",
    message: "El tiempo de espera fue alto y nadie explico el retraso.",
    receivedAt: "Hace 28 min",
  },
  {
    id: "comentario-003",
    customer: "Visitante frecuente",
    business: "Retail",
    branch: "Boulevard",
    sentiment: "Neutral",
    csatScore: 3,
    status: "Nuevo",
    message: "El producto estaba bien, pero el area de caja se sentia lenta.",
    receivedAt: "Hace 1 h",
  },
  {
    id: "comentario-004",
    customer: "Cliente digital",
    business: "Retail",
    branch: "Centro",
    sentiment: "Riesgo",
    csatScore: 2,
    status: "Pendiente",
    message: "La promocion no estaba clara y el personal no pudo explicarla.",
    receivedAt: "Hace 2 h",
  },
  {
    id: "comentario-005",
    customer: "Visita familiar",
    business: "Restaurante",
    branch: "Boulevard",
    sentiment: "Positivo",
    csatScore: 5,
    status: "Resuelto",
    message: "El equipo fue amable y la mesa estuvo lista rapidamente.",
    receivedAt: "Hace 3 h",
  },
  {
    id: "comentario-006",
    customer: "Cliente recurrente",
    business: "Restaurante",
    branch: "Mall Norte",
    sentiment: "Riesgo",
    csatScore: 1,
    status: "En revision",
    message: "El pedido salio incompleto y tuve que pedir ayuda dos veces.",
    receivedAt: "Hace 4 h",
  },
  {
    id: "comentario-007",
    customer: "Nueva compra",
    business: "Cafeteria",
    branch: "Centro",
    sentiment: "Neutral",
    csatScore: 3,
    status: "Nuevo",
    message: "Buena atencion, aunque el area de espera estaba saturada.",
    receivedAt: "Hace 5 h",
  },
];

export const dashboardMockAlerts = [
  {
    title: "Aumento de espera",
    branch: "Mall Norte",
    priority: "Alta",
    detail: "Se repiten comentarios sobre filas y tiempos de respuesta.",
  },
  {
    title: "Seguimiento pendiente",
    branch: "Centro",
    priority: "Media",
    detail: "Un cliente solicito contacto por una incidencia abierta.",
  },
];

export const dashboardMockNotifications: DashboardNotification[] = [
  {
    id: "notification-001",
    title: "Mall Norte requiere atencion",
    detail: "Subieron los comentarios por espera en la ultima hora.",
    time: "Hace 8 min",
    href: "/dashboard#alertas",
    unread: true,
    tone: "danger",
  },
  {
    id: "notification-002",
    title: "Nuevo comentario con riesgo",
    detail: "Centro recibio una observacion con CSAT 2/5.",
    time: "Hace 21 min",
    href: "/dashboard#comentarios",
    unread: true,
    tone: "warning",
  },
  {
    id: "notification-003",
    title: "Boulevard estabilizo servicio",
    detail: "La sucursal bajo volumen de incidencias este turno.",
    time: "Hace 1 h",
    href: "/dashboard#resumen",
    unread: false,
    tone: "success",
  },
];

export const dashboardMockBranches = [
  {
    name: "Centro",
    score: "88%",
    comments: "342",
    status: "Estable",
  },
  {
    name: "Mall Norte",
    score: "64%",
    comments: "219",
    status: "En observacion",
  },
  {
    name: "Boulevard",
    score: "79%",
    comments: "186",
    status: "Estable",
  },
];

export const dashboardMockQrRecords = [
  {
    id: "qr-001",
    business: "Cafeteria",
    branch: "Centro",
    slug: "cafeteria-centro",
    status: "Activo",
    createdAt: "2026-04-24",
    scans: 184,
    comments: 42,
  },
  {
    id: "qr-002",
    business: "Cafeteria",
    branch: "Mall Norte",
    slug: "cafeteria-mall-norte",
    status: "Activo",
    createdAt: "2026-04-25",
    scans: 129,
    comments: 31,
  },
  {
    id: "qr-003",
    business: "Retail",
    branch: "Boulevard",
    slug: "retail-boulevard",
    status: "Pausado",
    createdAt: "2026-04-26",
    scans: 64,
    comments: 13,
  },
];

export const dashboardMockTeam = [
  {
    name: "Gerencia de turno",
    role: "Seguimiento operativo",
    status: "Activo",
  },
  {
    name: "Servicio al cliente",
    role: "Respuesta a comentarios",
    status: "Activo",
  },
  {
    name: "Administracion",
    role: "Revision ejecutiva",
    status: "Pendiente",
  },
];
