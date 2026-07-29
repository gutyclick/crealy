import "server-only";

export function buildEditInstruction({
  instruction,
  preserveComposition,
  width,
  height,
}: {
  instruction: string;
  preserveComposition: boolean;
  width: number;
  height: number;
}) {
  return [
    "Edita la imagen adjunta y devuelve una imagen terminada.",
    `Cambio solicitado: ${instruction.trim()}`,
    preserveComposition
      ? "Conserva encuadre, composición, jerarquía, sujetos, logotipos y texto que no formen parte explícita del cambio."
      : "Puedes recomponer la escena cuando ayude a cumplir el cambio, manteniendo la intención y el contenido reconocible.",
    `Mantén la proporción aproximada ${width}:${height}.`,
    "No expliques el proceso ni devuelvas texto fuera de la imagen.",
  ].join("\n");
}

