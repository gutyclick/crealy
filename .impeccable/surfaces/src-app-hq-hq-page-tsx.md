---
version: 1
slug: "src-app-hq-hq-page-tsx"
primary_target: "src/app/(hq)/hq/page.tsx"
related_targets: ["src/app/(hq)/hq/layout.tsx","src/app/(hq)/hq/users/page.tsx","src/app/(hq)/hq/generations/page.tsx","src/app/(hq)/hq/feedback/page.tsx","src/app/(hq)/hq/jobs/page.tsx","src/app/(hq)/hq/billing/page.tsx","src/app/(hq)/hq/loading.tsx","src/app/(hq)/hq/error.tsx","src/components/hq/hq-navigation.tsx","src/components/hq/hq-ui.tsx"]
---

# Crealy HQ — Mesa de publicación operativa

- **Scope:** Centro interno de operaciones de Crealy: resumen, usuarios, generaciones, opiniones, cola de trabajos y facturación, junto con sus estados de carga y error.
- **Mode:** Operate.
- **Audience:** Administradores autorizados de Crealy que supervisan salud operativa, actividad de producto, cuentas, consumo, suscripciones y fallos.
- **Job:** Detectar primero las excepciones que requieren intervención y llegar con rapidez al registro operativo que permite entenderlas, sin convertir el HQ en una herramienta de edición o gestión prematura.
- **Primary task:** Leer el pulso de los últimos siete días, identificar anomalías en generaciones o jobs y abrir la vista especializada correspondiente para revisar datos reales.
- **Proof/content:** Métricas calculadas en servidor, identidades administrativas, generaciones, feedback, jobs, créditos y suscripciones reales; las consultas fallidas se muestran como error explícito y nunca como ceros inventados.
- **Constraints:** Acceso privado con AAL2, no indexable, interfaz inicialmente de consulta, español, tablas densas con región desplazable y foco visible, navegación persistente en escritorio y carril horizontal en móvil, lectura desde 320 px, `prefers-reduced-motion` para skeletons y color semántico accesible para éxito, advertencia y error.
- **Direction:** Extensión Operate de “La mesa de pruebas creativas”: un publishing floor negro mate y continuo, con divisiones editoriales, tipografía compacta y superficies planas que dejan respirar los datos. La lima conserva la regla global de señal lista y aparece solo en selección, acción primaria o estado saludable; ámbar y rojo quedan reservados para excepciones operativas.
- **Memorable moment:** El primer viewport funciona como una consola editorial continua: navegación fija, sesión administrativa verificable, pulso global en una banda métrica y una sola llamada de atención que conduce directamente a la cola cuando existe una anomalía.
- **Unresolved:** Las acciones administrativas mutables sobre usuarios, créditos o suscripciones quedan fuera hasta contar con una fase controlada y auditada; la escala futura de paginación, búsqueda y filtros se resolverá cuando el volumen real supere el límite actual de 100 registros.
