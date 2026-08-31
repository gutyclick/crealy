---
version: 1
slug: "src-app-dashboard-generations-id-page-tsx"
primary_target: "src/app/(dashboard)/generations/[id]/page.tsx"
related_targets: ["src/components/generation/generation-feedback.tsx","src/app/api/generations/[id]/feedback/route.ts"]
---

# Detalle de generación y opinión

- **Scope:** Resultado privado individual, descarga y evaluación ligada a la generación.
- **Mode:** Operate.
- **Audience:** La persona que acaba de recibir una pieza o vuelve a evaluarla desde su historial.
- **Job:** Juzgar el resultado, conservarlo o explicar con precisión por qué no sirve.
- **Primary task:** Registrar «Me sirve» o «No me sirve» con la menor fricción posible.
- **Proof/content:** Imagen generada, configuración real, evaluación automática y decisión persistida del usuario.
- **Constraints:** La señal rápida se guarda primero; los detalles son progresivos y opcionales. Una respuesta de red obsoleta nunca puede presentar cambios posteriores como guardados. En 320 px los veredictos se apilan. El feedback general desaparece para evitar duplicidad.
- **Direction:** Extensión continua de la mesa de producción mate; el juicio aparece inmediatamente debajo del resultado y usa lima solo para selección y confirmación.
- **Memorable moment:** Al elegir un veredicto, el panel revela motivos concretos y un comentario opcional sin convertir la opinión en otra tarea de creación.
- **Feedback boundary:** Esta superficie solo registra la opinión. Nunca ofrece regenerar, corregir ni consumir créditos; cualquier nueva creación comienza desde su flujo correspondiente.
