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
    "Un protagonista ocupa 40–65 % del encuadre con una silueta inequívoca",
    "Encuadre asimétrico, profundidad marcada y un único choque visual",
    "Contraste tonal extremo con luz de recorte; evita el neón genérico",
    "Debe sentirse como el instante decisivo de una historia, no como una foto de stock",
  ],
  curiosity: [
    "Revela suficiente contexto para entender el tema y oculta solo la respuesta",
    "Usa una anomalía visual concreta, una mirada o una escala inesperada",
    "Construye el recorrido visual sujeto → pista → texto",
    "Evita signos de interrogación, flechas y círculos si no aportan información",
  ],
  result: [
    "El resultado verificable es el objeto más grande o luminoso",
    "Muestra una consecuencia concreta, cifra o estado final; no una promesa abstracta",
    "Separa con claridad protagonista y evidencia",
    "El texto nombra el beneficio que la imagen demuestra",
  ],
  comparison: [
    "Dos estados inequívocos con una frontera diseñada, no un collage",
    "Cambia encuadre, luz, escala o material para hacer visible la diferencia",
    "Mantén un solo protagonista o producto por lado",
    "El texto identifica el criterio decisivo y no repite etiquetas obvias",
  ],
  minimal: [
    "Uno o dos elementos como máximo y abundante espacio negativo intencional",
    "Silueta, objeto o gesto icónico; nada decorativo",
    "Contraste sofisticado mediante escala y color, no mediante efectos",
    "Texto ultracorto con composición tipográfica editorial",
  ],
  cinematic: [
    "Escena con primer plano, plano medio y fondo atmosférico",
    "Luz motivada, color grading coherente y profundidad óptica",
    "Captura el instante anterior o posterior al evento clave para crear tensión",
    "Evita el póster genérico, las partículas gratuitas y el teal-orange automático",
  ],
};

export const THUMBNAIL_DISTINCTIVENESS_RULES = [
  "No uses por defecto rostro centrado con resplandor y fondo abstracto",
  "No uses flechas, círculos rojos ni signos de interrogación sin función narrativa",
  "Prohibidas las frases genéricas ¿QUÉ PASÓ?, NO LO CREERÁS e INCREÍBLE",
  "La composición debe responder al tema concreto y no parecer una plantilla reutilizada",
  "Cada nueva generación debe cambiar encuadre, ritmo, relación de escala o metáfora visual",
  "No recurras siempre a texto blanco y amarillo: decide el color por contraste, emoción y escena",
  "El acabado debe ser específico del nicho y del relato, nunca una plantilla de miniatura genérica",
  "No coloques sistemáticamente un titular enorme a la derecha: decide posición, escala y alineación a partir de la mirada, la evidencia y el espacio negativo",
  "El texto puede ser central, compacto, sutil, superpuesto o integrado en una superficie; evita que todas las piezas parezcan el mismo póster 3D",
  "No inventes una representación concreta de un resultado que el usuario no describió; usa ambigüedad localizada y legible cuando ese vacío sostenga una curiosidad honesta",
  "Las expresiones deben sentirse capturadas durante la acción, con piel y luz naturales; evita el rostro sintético de asombro usado como plantilla",
] as const;

export const THUMBNAIL_IDENTITY_RULES = [
  "La fotografía subida es la autoridad absoluta para la identidad del sujeto",
  "Conserva geometría facial, distancia entre ojos, nariz, mandíbula, boca, edad aparente, tono y textura real de piel",
  "Se permite una expresión distinta solo mediante cambios anatómicamente naturales; no reemplaces ni idealices el rostro",
  "No embellezcas, rejuvenezcas, estilices, mezcles ni reconstruyas la cara como otra persona",
  "Retoca luz, contraste, color y separación del fondo sin borrar poros ni rasgos identificables",
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
  "resultados concretos inventados para detalles que el brief deja desconocidos",
  "logotipos aproximados, deformados o que impliquen patrocinio",
  "rostros, manos u ojos deformados",
  "objetos duplicados",
  "apariencia genérica de stock",
  "elementos no relacionados",
  "clickbait engañoso",
] as const;
