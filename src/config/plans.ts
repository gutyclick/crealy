import type { PlanKey } from "@/types/billing";

export type PlanDefinition = {
  key: PlanKey;
  name: string;
  description: string;
  monthlyCredits: number;
  features: string[];
  isVisible: boolean;
  featured: boolean;
  priceLabel: string;
  priceSuffix?: string;
};

export function getPlanDefinitions({
  freeSignupCredits,
  proMonthlyCredits,
  businessMonthlyCredits,
  proPriceLabel,
  businessPriceLabel,
  businessVisible,
}: {
  freeSignupCredits: number;
  proMonthlyCredits: number;
  businessMonthlyCredits: number;
  proPriceLabel: string;
  businessPriceLabel: string;
  businessVisible: boolean;
}): PlanDefinition[] {
  return [
    {
      key: "free",
      name: "Gratis",
      description: "Para probar Crealy y crear tus primeras imágenes.",
      monthlyCredits: 0,
      features: [
        `${freeSignupCredits} créditos de bienvenida`,
        "Generación y edición básica",
        "Historial creativo privado",
        "Sin tarjeta obligatoria",
      ],
      isVisible: true,
      featured: false,
      priceLabel: "0",
      priceSuffix: "para empezar",
    },
    {
      key: "pro",
      name: "Pro",
      description:
        "Para creadores que generan contenido de forma frecuente.",
      monthlyCredits: proMonthlyCredits,
      features: [
        `${proMonthlyCredits} créditos en cada ciclo mensual`,
        "Generación en alta calidad",
        "Edición conversacional",
        "Administración desde Stripe",
      ],
      isVisible: true,
      featured: true,
      priceLabel: proPriceLabel || "Precio pendiente",
      priceSuffix: proPriceLabel ? "/ mes" : undefined,
    },
    {
      key: "business",
      name: "Business",
      description: "Para operaciones creativas con mayor volumen.",
      monthlyCredits: businessMonthlyCredits,
      features: [
        `${businessMonthlyCredits} créditos mensuales configurables`,
        "Todo lo incluido en Pro",
        "Preparado para futuras capacidades",
      ],
      isVisible: businessVisible,
      featured: false,
      priceLabel: businessPriceLabel,
      priceSuffix: businessPriceLabel ? "/ mes" : undefined,
    },
  ];
}
