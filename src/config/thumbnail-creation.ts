import type {
  ThumbnailArchetype,
  ThumbnailNiche,
  ThumbnailPreset,
  ThumbnailTextMode,
} from "@/types/generation";

export const THUMBNAIL_PRESETS: ReadonlyArray<{
  id: ThumbnailPreset;
  label: string;
  description: string;
  direction: readonly string[];
}> = [
  { id: "impactful", label: "Impactante", description: "Directa, intensa y de alto contraste.", direction: ["Primer plano dominante", "Emoción intensa", "Texto grande", "Colores fuertes"] },
  { id: "curiosity", label: "Curiosidad", description: "Abre una pregunta visual.", direction: ["Información parcialmente oculta", "Elemento inesperado", "Sombras y profundidad"] },
  { id: "result", label: "Resultado", description: "El cambio o logro es el protagonista.", direction: ["Resultado visible", "Cifra o transformación", "Mensaje directo"] },
  { id: "comparison", label: "Comparación", description: "Dos opciones, una diferencia inmediata.", direction: ["División clara", "Contraste entre lados", "Poco texto"] },
  { id: "minimal", label: "Minimalista", description: "Una idea con mucho espacio visual.", direction: ["Uno o dos elementos", "Fondo limpio", "Texto muy corto"] },
  { id: "cinematic", label: "Cinematográfica", description: "Una escena narrativa con profundidad.", direction: ["Iluminación dramática", "Apariencia realista", "Momento importante"] },
] as const;

export const THUMBNAIL_PRESET_CRAFT: Record<ThumbnailPreset, readonly string[]> = {
  impactful: [
    "Un protagonista ocupa 40â€“65 % del encuadre con una silueta inequÃ­voca",
    "Encuadre asimÃ©trico, profundidad marcada y un Ãºnico choque visual",
    "Contraste tonal extremo con luz de recorte; evita el neÃ³n genÃ©rico",
    "Debe sentirse como el instante decisivo de una historia, no como una foto de stock",
  ],
  curiosity: [
    "Revela suficiente contexto para entender el tema y oculta solo la respuesta",
    "Usa una anomalÃ­a visual concreta, una mirada o una escala inesperada",
    "Construye el recorrido visual sujeto â†’ pista â†’ texto",
    "Evita signos de interrogaciÃ³n, flechas y cÃ­rculos si no aportan informaciÃ³n",
  ],
  result: [
    "El resultado verificable es el objeto mÃ¡s grande o luminoso",
    "Muestra una consecuencia concreta, cifra o estado final; no una promesa abstracta",
    "Separa con claridad protagonista y evidencia",
    "El texto nombra el beneficio que la imagen demuestra",
  ],
  comparison: [
    "Dos estados inequÃ­vocos con una frontera diseÃ±ada, no un collage",
    "Cambia encuadre, luz, escala o material para hacer visible la diferencia",
    "MantÃ©n un solo protagonista o producto por lado",
    "El texto identifica el criterio decisivo y no repite etiquetas obvias",
  ],
  minimal: [
    "Uno o dos elementos como mÃ¡ximo y abundante espacio negativo intencional",
    "Silueta, objeto o gesto icÃ³nico; nada decorativo",
    "Contraste sofisticado mediante escala y color, no mediante efectos",
    "Texto ultracorto con composiciÃ³n tipogrÃ¡fica editorial",
  ],
  cinematic: [
    "Escena con primer plano, plano medio y fondo atmosfÃ©rico",
    "Luz motivada, color grading coherente y profundidad Ã³ptica",
    "Captura el instante anterior o posterior al evento clave para crear tensiÃ³n",
    "Evita el pÃ³ster genÃ©rico, las partÃ­culas gratuitas y el teal-orange automÃ¡tico",
  ],
};

export const THUMBNAIL_DISTINCTIVENESS_RULES = [
  "No uses por defecto rostro centrado con resplandor y fondo abstracto",
  "No uses flechas, cÃ­rculos rojos ni signos de interrogaciÃ³n sin funciÃ³n narrativa",
  "Prohibidas las frases genÃ©ricas Â¿QUÃ‰ PASÃ“?, NO LO CREERÃ�S e INCREÃ�BLE",
  "La composiciÃ³n debe responder al tema concreto y no parecer una plantilla reutilizada",
  "Cada nueva generaciÃ³n debe cambiar encuadre, ritmo, relaciÃ³n de escala o metÃ¡fora visual",
] as const;

export const THUMBNAIL_TEXT_MODES: ReadonlyArray<{
  id: ThumbnailTextMode;
  label: string;
  description: string;
}> = [
  { id: "automatic", label: "Texto automático", description: "Crealy elegirá una frase breve que complemente el título." },
  { id: "custom", label: "Escribir mi texto", description: "Usaremos exactamente el texto que indiques." },
  { id: "none", label: "Sin texto", description: "La imagen comunicará el concepto por sí sola." },
] as const;

export const THUMBNAIL_NICHES: ReadonlyArray<{ id: ThumbnailNiche; label: string }> = [
  { id: "technology_ai", label: "Inteligencia artificial y tecnología" },
  { id: "finance_business", label: "Finanzas y negocios" },
  { id: "gaming", label: "Gaming" },
  { id: "education", label: "Educación y tutoriales" },
  { id: "productivity", label: "Productividad" },
  { id: "fitness_health", label: "Fitness y salud" },
  { id: "entertainment", label: "Entretenimiento e historias" },
  { id: "travel", label: "Viajes" },
  { id: "beauty_lifestyle", label: "Belleza y estilo de vida" },
  { id: "reactions_news", label: "Reacciones, noticias y actualidad" },
  { id: "general", label: "General" },
] as const;

export const THUMBNAIL_ARCHETYPES: ReadonlyArray<{ id: ThumbnailArchetype; label: string }> = [
  { id: "result", label: "Resultado" },
  { id: "curiosity", label: "Curiosidad" },
  { id: "comparison", label: "Comparación" },
  { id: "warning", label: "Advertencia" },
  { id: "transformation", label: "Transformación" },
  { id: "extreme_moment", label: "Momento extremo" },
] as const;

export const THUMBNAIL_GLOBAL_RULES = [
  "Una sola idea principal y un foco visual dominante.",
  "Máximo un rostro protagonista y dos elementos secundarios.",
  "Composición comprensible en menos de un segundo y legible en móvil.",
  "Alto contraste, sujeto separado del fondo y márgenes seguros.",
  "Formato horizontal 16:9, listo para publicar.",
] as const;

export const THUMBNAIL_AVOID = [
  "composición saturada",
  "collage innecesario",
  "texto pequeño o cortado",
  "palabras duplicadas o letras aleatorias",
  "texto adicional inventado",
  "marcas de agua o logos aleatorios",
  "interfaces sin sentido",
  "rostros, manos u ojos deformados",
  "objetos duplicados",
  "apariencia genérica de stock",
  "elementos no relacionados",
  "clickbait engañoso",
] as const;
