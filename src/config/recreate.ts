import type {
  RecreatePreservation,
  RecreatePreservationKey,
  RecreateReferenceRole,
} from "@/types/recreate";
import type { PlanKey } from "@/types/billing";

export const MAX_RECREATE_ELEMENTS = 4;
export const FREE_RECREATE_ELEMENTS = 2;
export const MAX_RECREATE_REFERENCE_IMAGES = MAX_RECREATE_ELEMENTS + 1;

export function getRecreateElementLimit(plan: PlanKey) {
  return plan === "free" ? FREE_RECREATE_ELEMENTS : MAX_RECREATE_ELEMENTS;
}

export const RECREATE_REFERENCE_ROLES = [
  {
    id: "protagonist",
    label: "Protagonista",
    prompt: "protagonista principal; debe dominar la jerarquía visual",
  },
  {
    id: "product",
    label: "Producto",
    prompt: "producto u objeto principal; conserva geometría, detalles y marca si pertenece al usuario",
  },
  {
    id: "background",
    label: "Fondo",
    prompt: "material para el fondo o ambiente; no debe competir con el foco principal",
  },
  {
    id: "supporting",
    label: "Secundario",
    prompt: "elemento secundario de apoyo; debe reforzar la historia sin dominarla",
  },
] as const satisfies ReadonlyArray<{
  id: RecreateReferenceRole;
  label: string;
  prompt: string;
}>;

export const RECREATE_PRESERVATION_OPTIONS = [
  { id: "composition", label: "Composición", detail: "Distribución y jerarquía" },
  { id: "pose", label: "Pose", detail: "Gesto y dirección corporal" },
  { id: "lighting", label: "Iluminación", detail: "Contraste y dirección de luz" },
  { id: "colors", label: "Colores", detail: "Relación cromática" },
  { id: "typography", label: "Tipografía", detail: "Escala, peso y ubicación" },
] as const satisfies ReadonlyArray<{
  id: RecreatePreservationKey;
  label: string;
  detail: string;
}>;

export const DEFAULT_RECREATE_PRESERVATION: RecreatePreservation = {
  composition: true,
  pose: true,
  lighting: true,
  colors: true,
  typography: true,
};
