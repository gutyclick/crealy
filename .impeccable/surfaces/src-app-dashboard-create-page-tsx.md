---
version: 1
slug: "src-app-dashboard-create-page-tsx"
primary_target: "src/app/(dashboard)/create/page.tsx"
related_targets: ["src/components/generation/generation-form.tsx","src/components/generation/reference-image-picker.tsx","src/app/api/generations/route.ts"]
---

# Crear — referencias visuales

- **Scope:** Espacio privado para generar imágenes desde un brief y hasta cuatro referencias visuales.
- **Mode:** Operate.
- **Audience:** Creadores, emprendedores, dueños de negocio y community managers autenticados.
- **Job:** Convertir una idea breve y referencias de personas, productos u objetos en una pieza útil sin exponer complejidad técnica.
- **Primary task:** Elegir destino y formato, describir la idea, adjuntar hasta cuatro referencias opcionales, generar, revisar y descargar.
- **Proof/content:** Previsualización numerada, estado real de cada subida, resultado privado, descarga PNG y continuación del proyecto.
- **Constraints:** Archivos directos al bucket privado mediante URL firmada; OpenAI y validación sensible sólo desde servidor; máximo cuatro referencias; identidad y rasgos se preservan mediante instrucciones explícitas, sin prometer coincidencia perfecta; responsive desde 320 px.
- **Direction:** Estudio mate de producción con formulario secuencial a la izquierda y lienzo persistente a la derecha.
- **Memorable moment:** Las referencias pasan de miniaturas ordenadas a una composición nueva que conserva sus rasgos distintivos.
- **Unresolved:** Aplicar `20260728030000_add_generation_references.sql` y verificar el flujo real con credenciales del entorno desplegado.
