export const contentTypes = [
  {
    key: "thumbnail",
    title: "Miniaturas",
    description:
      "Presenta el tema de tu video con una composición clara desde el primer vistazo.",
    format: "16:9",
  },
  {
    key: "social",
    title: "Posts para redes",
    description:
      "Convierte promociones, ideas y novedades en piezas listas para compartir.",
    format: "1:1",
  },
  {
    key: "banner",
    title: "Banners",
    description:
      "Extiende una campaña a canales y cabeceras sin reconstruirla desde cero.",
    format: "3:1",
  },
  {
    key: "cover",
    title: "Portadas",
    description:
      "Da una identidad reconocible a perfiles, comunidades y marcas personales.",
    format: "4:5",
  },
] as const;

export const creationSteps = [
  {
    title: "Elige el formato",
    description:
      "Selecciona una miniatura, un post, un banner o una portada.",
  },
  {
    title: "Describe tu idea",
    description:
      "Cuenta qué quieres comunicar, para quién y con qué intención.",
  },
  {
    title: "Revisa y descarga",
    description:
      "Compara las propuestas, elige una dirección y prepara tu publicación.",
  },
] as const;

export const pricingPlans = [
  {
    name: "Creator",
    description: "Para personas que crean contenido con constancia.",
    monthlyPrice: 12,
    yearlyPrice: 115,
    monthlyTokens: 120,
    trialTokens: 30,
    featured: false,
    features: [
      "Miniaturas, posts, banners y portadas",
      "Historial de proyectos",
      "Descargas en alta calidad",
      "Uso comercial incluido",
    ],
  },
  {
    name: "Pro",
    description: "Para marcas y equipos con más volumen de publicación.",
    monthlyPrice: 29,
    yearlyPrice: 278,
    monthlyTokens: 400,
    trialTokens: 80,
    featured: true,
    features: [
      "Todo lo incluido en Creator",
      "Más tokens cada mes",
      "Generaciones prioritarias",
      "Hasta 3 miembros por espacio",
      "Acceso anticipado a nuevas funciones",
    ],
  },
] as const;

export const examples = [
  {
    title: "Una carrera que se siente antes de empezar",
    description: "Miniatura para un canal de videojuegos",
    src: "/images/examples/gaming.webp",
    alt: "Vehículo futurista recorriendo una ciudad nocturna",
    className: "md:col-span-3 md:row-span-2",
  },
  {
    title: "El plato es el mensaje",
    description: "Promoción para un menú de temporada",
    src: "/images/examples/restaurant.webp",
    alt: "Plato de vegetales asados presentado sobre una mesa oscura",
    className: "md:col-span-2",
  },
  {
    title: "Energía para volver a moverse",
    description: "Creatividad para una rutina de entrenamiento",
    src: "/images/examples/fitness.webp",
    alt: "Atleta entrenando con cuerdas en un gimnasio de arquitectura moderna",
    className: "md:col-span-2",
  },
] as const;

export const traditionalFlow = [
  "Buscar una plantilla",
  "Ajustar capas y recursos",
  "Reconstruir cada formato",
  "Corregir la composición",
  "Exportar cada versión",
] as const;

export const crealyFlow = [
  "Elige el formato",
  "Describe tu idea",
  "Revisa y descarga",
] as const;

export const faqs = [
  {
    question: "¿Necesito saber diseñar?",
    answer:
      "No. Crealy está pensado para convertir una descripción clara en una propuesta visual sin obligarte a dominar un editor profesional.",
  },
  {
    question: "¿Qué tipo de contenido podré crear?",
    answer:
      "La primera versión contempla miniaturas, banners, posts y portadas para plataformas digitales.",
  },
  {
    question: "¿Podré editar los resultados?",
    answer:
      "Crealy se centrará primero en producir buenas direcciones con rapidez. Las opciones de edición se incorporarán progresivamente.",
  },
  {
    question: "¿Crealy ya está disponible?",
    answer:
      "Puedes crear tu cuenta y acceder al área privada. La generación de imágenes, los créditos y la facturación siguen en desarrollo.",
  },
  {
    question: "¿Las imágenes se generan con inteligencia artificial?",
    answer:
      "Sí. Crealy utilizará modelos de generación de imágenes para convertir instrucciones en contenido visual.",
  },
] as const;
