# Sistema de Estacionamiento Medido en Tiempo Real

## Resumen Ejecutivo
Un sistema integral que transforma el estacionamiento medido tradicional en una red de datos en tiempo real. Elimina el tráfico generado por la búsqueda de lugares, optimiza la recaudación del municipio y reduce la carga cognitiva del operario en la calle, vinculando datos en vivo con algoritmos de ruteo inteligente.

Convierte a los trabajadores actuales en la red de sensores humanos más grande de la ciudad. Esa data alimenta un algoritmo que guía a los conductores directamente a un lugar vacío, reduciendo el tráfico innecesario y operando con infraestructura cero.

---

## Arquitectura y Tech Stack

### Frontend (Next.js)
El ecosistema de interfaces del cliente operará bajo Next.js, aprovechando Server-Side Rendering (SSR) y componentes reactivos para el mapa en vivo.
* **Framework:** Next.js
* **UI/Estilos:** Tailwind CSS y Shadcn UI. Enfoque en un diseño minimalista, plano y directo, eliminando elementos superfluos para maximizar la legibilidad y la velocidad de operación.

### Backend (Go)
El procesamiento concurrente de eventos (entradas y salidas en tiempo real) y el cálculo matemático de las rutas requiere alta eficiencia.
* **Lenguaje/Framework:** Go (Golang)
* **Funciones Clave:** WebSocket/SSE para la actualización del mapa de calor en vivo, exposición de APIs REST para el dashboard, y ejecución del motor de búsqueda de rutas.

---

## Requerimientos Funcionales: Los 3 Ejes del Producto

### 1. Interfaz del Operario (Input de Datos)
El éxito del sistema depende de que la recolección de datos no tenga fricciones.
* **UX/UI:** Diseño ultracompacto y plano. Pantalla  de alto contraste. Componentes grandes y sin texto innecesario.
* **Flujo de Usuario:**
  * Al iniciar el turno, el operario selecciona su cuadra (con un cupo máximo predefinido, ej: 20 lugares).
  * **Cero tipeo:** La pantalla principal se reduce a dos botones masivos: `[+ Entró]` y `[- Salió]`.
* **Valor Core:** Sirve como un contador digital de la propia cuadra para el operario, facilitando su trabajo sin sumar tareas administrativas.

### 2. App del Conductor (Ruteo Inteligente)
Diseñada para ruteo proactivo, no reactivo. Evita que múltiples autos compitan por el mismo espacio basándose en mapas estáticos.
* **Map Viewer en Vivo:** Mapa de las calles (ej: centro de Corrientes) con estacionamiento medido coloreadas por disponibilidad:
  * **Verde:** Alta disponibilidad.
  * **Amarillo:** Baja disponibilidad.
  * **Rojo/Gris:** Lleno.
* **Búsqueda A* Dinámica:** 
  * El conductor ingresa su **destino final**.
  * El backend en Go ejecuta el algoritmo  para calcular la ruta más corta, penalizando algorítmicamente las cuadras saturadas.
  * El sistema traza la ruta hacia la cuadra con lugar confirmado más cercana al objetivo.
* **Asistencia IA (Input Natural):** Cuadro de texto simple donde el usuario puede pedir, por ejemplo: *"Voy al Banco de Corrientes, buscame el mejor lugar"*, y el sistema computa y devuelve la ruta óptima directamente.

### 3. Dashboard Administrativo (Municipio)
Panel de control central para la toma de decisiones y análisis volumétrico.
* **Mapa de Calor Urbano:** Visualización en vivo del centro de la ciudad detallando niveles de saturación en tiempo real.
* **Métricas Analíticas:** 
  * Tiempo promedio de ocupación por cuadra.
  * Detección de horarios pico reales.
  * Identificación de zonas subutilizadas.
* **Gestión Dinámica de Recursos:** Data accionable para reasignar personal a zonas de mayor volumen operativo, o modelar ajustes tarifarios en base a la demanda en tiempo real.