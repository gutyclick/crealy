export type BillingPeriod = "monthly" | "annual";
export type PublicPlanId = "free" | "starter" | "creator" | "pro";

export type PricingPlan = {
  id: PublicPlanId;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice?: number;
  credits: number;
  popular?: boolean;
  estimatedUsage: { standard: number; hd: number; bannerOrCover: number };
  features: string[];
  cta: string;
  supportingText: string;
};

export const PRICING_PLANS: PricingPlan[] = [
  { id: "free", name: "Gratis", description: "Prueba Crealy y crea tus primeros diseños.", monthlyPrice: 0, credits: 3, estimatedUsage: { standard: 3, hd: 1, bannerOrCover: 0 }, features: ["Prueba Crealy sin riesgo", "Herramientas de creación con IA", "Calidad adaptada a cada formato", "Sin tarjeta de crédito", "Exportación sencilla"], cta: "Probar Crealy gratis", supportingText: "Sin tarjeta. Empieza a crear en segundos." },
  { id: "starter", name: "Starter", description: "Para quienes crean contenido de vez en cuando.", monthlyPrice: 5, annualPrice: 48, credits: 10, estimatedUsage: { standard: 10, hd: 3, bannerOrCover: 2 }, features: ["Todas las herramientas de creación", "Miniaturas, posts, banners y covers", "Calidad adaptada a cada formato", "Historial de diseños", "Sin marca de agua", "Uso comercial"], cta: "Empezar", supportingText: "Ideal para proyectos personales y creadores ocasionales." },
  { id: "creator", name: "Creator", description: "Para creadores que publican contenido todas las semanas.", monthlyPrice: 15, annualPrice: 144, credits: 60, popular: true, estimatedUsage: { standard: 60, hd: 20, bannerOrCover: 12 }, features: ["Todo lo incluido en Starter", "6 veces más créditos que Starter", "Generación prioritaria", "Historial ampliado", "Más variaciones por proyecto", "Organización de diseños", "Ideal para YouTube y redes"], cta: "Empezar como Creator", supportingText: "La mejor relación entre precio, volumen y flexibilidad." },
  { id: "pro", name: "Pro", description: "Para profesionales, freelancers y negocios que crean a gran escala.", monthlyPrice: 40, annualPrice: 384, credits: 180, estimatedUsage: { standard: 180, hd: 60, bannerOrCover: 36 }, features: ["Todo lo incluido en Creator", "Máximo volumen de generación", "Mayor prioridad de procesamiento", "Historial completo", "Uso comercial profesional", "Ideal para múltiples clientes", "Producción a gran escala"], cta: "Escalar mi negocio", supportingText: "Diseñado para quienes convierten contenido en negocio." },
];

export function displayPrice(plan: PricingPlan, period: BillingPeriod) {
  if (plan.id === "free") return { primary: "$0", suffix: "para empezar", detail: "3 créditos incluidos" };
  if (period === "annual" && plan.annualPrice) return { primary: `$${Math.round(plan.annualPrice / 12)}`, suffix: "/ mes", detail: `$${plan.annualPrice} facturados anualmente` };
  return { primary: `$${plan.monthlyPrice}`, suffix: "/ mes", detail: `${plan.credits} créditos mensuales` };
}
