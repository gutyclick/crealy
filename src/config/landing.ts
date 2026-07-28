export const contentTypes = [
  {
    key: "thumbnail",
    title: "Miniaturas",
    description:
      "Imágenes llamativas para destacar tus videos y causar una mejor primera impresión.",
    format: "16:9",
    visual: "/images/examples/gaming.webp",
  },
  {
    key: "social",
    title: "Posts para redes",
    description:
      "Contenido visual preparado para comunicar promociones, ideas y novedades.",
    format: "1:1",
    visual: "/images/examples/productivity.webp",
  },
  {
    key: "banner",
    title: "Banners",
    description:
      "Composiciones horizontales para campañas, canales y páginas digitales.",
    format: "3:1",
    visual: "/images/examples/technology.webp",
  },
  {
    key: "cover",
    title: "Portadas",
    description:
      "Imágenes adaptadas para perfiles, comunidades y marcas personales.",
    format: "4:5",
    visual: "/images/examples/restaurant.webp",
  },
] as const;

export const creationSteps = [
  {
    title: "Elige qué quieres crear",
    description:
      "Selecciona una miniatura, un banner, una publicación o una portada.",
  },
  {
    title: "Describe tu idea",
    description:
      "Explica el tema, el estilo y el mensaje que quieres comunicar.",
  },
  {
    title: "Genera y descarga",
    description:
      "Revisa las propuestas, elige tu favorita y utilízala en tu contenido.",
  },
] as const;

export const pricingPlans = [
  {
    name: "Creator",
    description: "Para crear contenido con constancia y probar nuevas ideas.",
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
    description: "Para marcas y equipos que necesitan producir más cada semana.",
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
    title: "Tecnología",
    description: "Lanzamiento de un producto digital",
    src: "/images/examples/technology.webp",
    alt: "Dispositivo tecnológico transparente iluminado en un estudio oscuro",
    className: "md:col-span-2 md:row-span-1",
  },
  {
    title: "Videojuegos",
    description: "Miniatura de un video de carreras",
    src: "/images/examples/gaming.webp",
    alt: "Vehículo futurista recorriendo una ciudad nocturna",
    className: "md:col-span-2 md:row-span-1",
  },
  {
    title: "Productividad",
    description: "Publicación para una rutina de enfoque",
    src: "/images/examples/productivity.webp",
    alt: "Escritorio minimalista con libreta, teclado, planta y temporizador",
    className: "md:row-span-2",
  },
  {
    title: "Restaurantes",
    description: "Promoción de un menú de temporada",
    src: "/images/examples/restaurant.webp",
    alt: "Plato de vegetales asados presentado sobre una mesa oscura",
    className: "md:row-span-2",
  },
  {
    title: "Fitness",
    description: "Creatividad para una rutina de entrenamiento",
    src: "/images/examples/fitness.webp",
    alt: "Atleta entrenando con cuerdas en un gimnasio de arquitectura moderna",
    className: "md:col-span-2",
  },
  {
    title: "Podcast",
    description: "Portada para un nuevo episodio",
    src: "/images/examples/podcast.webp",
    alt: "Micrófono y audífonos en un estudio de grabación oscuro",
    className: "md:col-span-2",
  },
] as const;

export const traditionalFlow = [
  "Elegir una plantilla",
  "Ajustar capas y recursos",
  "Revisar cada tamaño",
  "Corregir la composición",
  "Exportar diferentes versiones",
] as const;

export const crealyFlow = [
  "Elige el formato",
  "Describe tu idea",
  "Genera propuestas",
  "Elige el resultado",
  "Descarga y publica",
] as const;

export const faqs = [
  {
    question: "¿Necesito saber diseñar?",
    answer:
      "No. Crealy está pensado para convertir una descripción sencilla en una propuesta visual.",
  },
  {
    question: "¿Qué tipo de contenido podré crear?",
    answer:
      "Inicialmente podrás crear miniaturas, banners, posts y portadas para plataformas digitales.",
  },
  {
    question: "¿Podré editar los resultados?",
    answer:
      "El producto se centrará primero en generar buenos resultados con rapidez. Las opciones de edición se incorporarán progresivamente.",
  },
  {
    question: "¿Crealy ya está disponible?",
    answer:
      "Estamos construyendo la primera versión. Podrás registrarte para conocer las novedades del lanzamiento.",
  },
  {
    question: "¿Las imágenes se generan con inteligencia artificial?",
    answer:
      "Sí. Crealy utilizará modelos de generación de imágenes para convertir instrucciones en contenido visual.",
  },
] as const;
