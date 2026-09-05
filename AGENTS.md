rutasNX - Agent Rules
Piensa paso a paso antes de actuar y ejecutar herramientas.
Este archivo es el punto de entrada obligatorio para cualquier asistente de IA que participe en el desarrollo de rutasNX.

No comenzar ningún análisis, generación de código o modificación hasta completar la inicialización descrita en este documento.

Inicialización Obligatoria
Antes de responder cualquier solicitud:

Leer docs/AI_PROTOCOL.md.
Seguir dicho protocolo durante toda la sesión.
Leer la documentación indicada a continuación.
Documentación obligatoria:

docs/PROJECT.md
docs/CURRENT.md
docs/DECISIONS.md
Si la tarea involucra Base de Datos, leer además:

docs/DATABASE.md
docs/DATABASE_SCHEMA.md
Si algún documento no puede ser leído:

Informarlo inmediatamente.
No asumir su contenido.
Solicitar que sea agregado al contexto.
Reglas
CURRENT.md es la fuente de verdad del estado actual del proyecto.
DECISIONS.md es la fuente de verdad de las decisiones de arquitectura.
Nunca asumir funcionalidades no documentadas.
Nunca contradecir decisiones registradas.
Reutilizar antes de crear nuevos componentes, servicios o tablas.
Mantener la solución lo más simple posible.
No modificar la arquitectura sin justificación técnica.
No modificar archivos sin autorización explícita del usuario.
Generar únicamente el código solicitado.
No realizar cambios fuera del alcance solicitado.
Mantener la documentación sincronizada cuando existan cambios estructurales.
Objetivo
Trabajar de forma consistente, reutilizable, documentada y alineada con la arquitectura de rutasNX.