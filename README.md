# SGA LIN — Sistema de Gestión de Almacén

Aplicación web de gestión de almacén desarrollada para Ferreterías LIN S.A. como proyecto final de ciclo formativo DAW.

---

## Descripción

SGA LIN permite gestionar el stock de un almacén: consultar ubicaciones, registrar entradas y salidas de mercancía, hacer picking, ver informes con gráficas y visualizar el almacén en un plano 2D interactivo y en un visor 3D inmersivo.

El proyecto funciona **sin base de datos real**: el backend carga los datos desde archivos JSON (`backend/data/`) y los mantiene en memoria mientras el servidor está en ejecución. Esto permite arrancar el proyecto en cualquier máquina sin instalar SQL Server ni ningún motor de base de datos.

---

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | HTML5 + CSS3 + JavaScript vanilla (sin frameworks) |
| Backend | Node.js + Express 5 |
| Datos | Archivos JSON en `backend/data/`, cargados en memoria al arrancar |
| Gráficas | Chart.js (CDN) |
| Visor 3D | Three.js (módulo ES) + modelo GLTF + texturas |

---

## Requisitos previos

- **Node.js** v18 o superior — [nodejs.org](https://nodejs.org)
- **Visual Studio Code** con la extensión **Live Server** instalada (para servir el frontend)

Para comprobar que Node está instalado:

```bash
node --version
```

---

## Instalación

Solo hay que instalar las dependencias del backend. El frontend no tiene dependencias (usa CDNs).

```bash
cd backend
npm install
```

Esto instala: `express`, `cors`, `helmet`, `express-rate-limit`.

---

## Cómo arrancar

El proyecto tiene dos partes que hay que ejecutar por separado.

### 1. Backend (API REST)

```bash
cd backend
npm start
```

La API arranca en `http://localhost:3000`. Al iniciar verás:

```
🗂️  [SIM] SGA LIN — Modo simulación (datos desde backend/data/)
SGA API en http://localhost:3000
```

Puedes verificar que funciona abriendo `http://localhost:3000/health` en el navegador.

### 2. Frontend

Abre la carpeta del proyecto en VS Code y lanza **Live Server** sobre `frontend/index.html` (clic derecho → *Open with Live Server*).

Esto sirve el frontend normalmente en `http://127.0.0.1:5500`.

> **Importante:** No abras los archivos HTML directamente desde el explorador de archivos del sistema operativo. Las llamadas a la API fallarían por restricciones CORS del navegador. Siempre usa Live Server o cualquier otro servidor HTTP local.

---

## Estructura del proyecto

```
PROYECTO-SGA-JS-NODE.JS-Presentacion/
├── backend/
│   ├── api.js              # Punto de entrada — arranca el servidor en el puerto 3000
│   ├── app.js              # Configuración Express: middleware + montaje de rutas
│   ├── db.js               # Capa de simulación: carga los JSON y expone funciones de consulta (no está en el repo)
│   ├── data/               # Datos de la aplicación (archivos JSON)
│   │   ├── articulos.json
│   │   ├── almacenes.json
│   │   ├── ubicaciones.json
│   │   ├── stock.json
│   │   ├── proveedores.json
│   │   ├── clientes.json
│   │   ├── usuarios.json
│   │   ├── subfamilias.json
│   │   └── empresa.json
│   ├── routes/             # Rutas de la API REST (una por módulo)
│   │   ├── health.routes.js
│   │   ├── articulos.routes.js
│   │   ├── stock.routes.js
│   │   ├── terceros.routes.js
│   │   ├── ubicaciones.routes.js
│   │   ├── visor.routes.js
│   │   ├── analytics.routes.js
│   │   ├── lotes.routes.js
│   │   ├── config.routes.js
│   │   ├── escrituras.routes.js
│   │   ├── movimientos.routes.js
│   │   ├── system.routes.js
│   │   └── admin.routes.js
│   └── services/           # Lógica de negocio
│       ├── analytics.service.js
│       ├── visor.service.js
│       ├── terceros.service.js
│       └── config.service.js
│
└── frontend/
    ├── index.html          # Dashboard principal
    ├── css/                # Hojas de estilo (base, layout, componentes, módulos)
    ├── js/
    │   ├── api.js          # Cliente HTTP: todas las llamadas al backend pasan por aquí
    │   ├── index.js        # Inicialización del dashboard
    │   ├── pages/          # Scripts de páginas concretas
    │   ├── ui/             # Componentes de interfaz reutilizables (sidebar, layout)
    │   ├── ferreteria/     # Scripts de las fichas maestras
    │   ├── visor/          # Scripts del visor de maestros
    │   ├── informes/       # Scripts de informes y gráficas
    │   └── opciones/       # Scripts de los módulos operativos
    ├── pages/              # Páginas HTML de cada módulo (23 páginas)
    │   ├── ferreteria/
    │   ├── informes/
    │   ├── opciones/
    │   │   ├── almacen-y-stock/       (9 subpáginas)
    │   │   ├── logistica-y-pedidos/   (6 subpáginas)
    │   │   ├── control-de-lotes-y-minimos/
    │   │   └── sistema/               (2 subpáginas)
    │   └── acerca_de/
    └── 3d/                 # Visor 3D del almacén (Three.js)
        ├── mapa-3d.html
        ├── mapa-3d.css
        ├── datos/          # Datos de demostración para el visor 3D
        ├── texturas/       # Texturas del almacén (metal, paredes, suelo, techo)
        ├── warehouse_shelving_unit/  # Modelo GLTF de estanterías
        └── js/             # 9 scripts del visor 3D
```

---

## Módulos de la aplicación

### Dashboard
Pantalla de inicio con KPIs de stock y acceso rápido a todos los módulos.

### Ferretería
Fichas maestras operativas: artículos, proveedores, clientes, operarios, y registro de entradas y salidas.

### Opciones — Almacén y Stock

| Módulo | Descripción |
|---|---|
| **Almacenes** | Plano 2D interactivo del almacén. Cada celda muestra el estado del stock (verde / ámbar / gris). Clic en una celda para ver el detalle. Incluye botón para abrir el visor 3D. |
| **Consulta de stock** | Búsqueda de stock por artículo, ubicación y lote. Panel lateral con detalle al hacer clic en una fila. |
| **Movimientos por artículo** | Histórico de movimientos filtrable por artículo, fechas, tipo y ubicación. Exportable a CSV. |
| **Artículos por ubicación** | Qué artículos hay en cada ubicación y sus mínimos/máximos. |
| **Ubicaciones** | Maestro de ubicaciones del almacén. |
| **Entrada de mercancía** | Registro de entradas: artículo, ubicación, cantidad y lote. |
| **Salida de mercancía** | Registro de salidas de stock. |
| **Regularizaciones** | Ajuste manual del stock de una ubicación. |
| **Generar ubicaciones** | Crea rangos de ubicaciones de forma masiva. |

### Opciones — Logística y Pedidos

| Módulo | Descripción |
|---|---|
| **Picking** | Gestión de tareas de picking en el almacén. Confirmación y desconfirmación de líneas. |
| **Expediciones** | Consulta y gestión de expediciones. |
| **Hojas de ruta** | Listado de hojas de ruta para reparto. |
| **Situación de pedidos de venta** | Estado actual de los pedidos pendientes de servir. |
| **Borrar picking** | Herramienta para limpiar tareas de picking. |
| **Poner a cero carrusel** | Reinicio del carrusel automatizado. |

### Opciones — Control de Lotes y Mínimos
Gestión de subfamilias de artículos y control de niveles de reposición.

### Opciones — Sistema
Gestión de usuarios y copia de seguridad de datos.

### Informes
Panel de analítica con seis pestañas:

| Pestaña | Contenido |
|---|---|
| **Resumen** | KPIs globales, movimientos por día, top artículos, entradas vs salidas y alertas de stock bajo mínimo |
| **Trabajadores** | Actividad por operario: movimientos, unidades, entradas, salidas |
| **Almacén** | Ocupación por almacén y ubicaciones más activas |
| **Movimientos** | Distribución por tipo y por día de la semana, con tabla de últimos movimientos |
| **Proveedores** | Ranking de proveedores por actividad y unidades suministradas |
| **Artículos** | Rotación de artículos, stock por familia y artículos sin movimiento |

### Visor
Tablas de consulta rápida de artículos, proveedores y clientes.

### Almacén 3D
Visor inmersivo accesible desde el botón *Ver en 3D* de la pantalla de almacenes. Permite recorrer el almacén con teclado y ratón (WASD + puntero bloqueado). Incluye modelo GLTF de estanterías, texturas personalizadas y sprites de información sobre las ubicaciones. Desarrollado con Three.js como módulo ES.

---

## API REST

El backend expone los siguientes endpoints en `http://localhost:3000`:

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Estado del servidor |
| GET | `/articulos` | Catálogo de artículos |
| GET | `/articulos/:cod` | Ficha de un artículo concreto |
| GET | `/proveedores` | Lista de proveedores |
| GET | `/clientes` | Lista de clientes |
| GET | `/operarios` | Lista de operarios |
| GET | `/almacenes` | Maestro de almacenes |
| GET | `/ubicaciones` | Maestro de ubicaciones |
| GET | `/subfamilias` | Subfamilias de artículos |
| GET | `/consulta-de-stock` | Stock filtrado por artículo, ubicación o lote |
| GET | `/movimientos-por-articulo` | Histórico de movimientos con filtros |
| GET | `/articulos-por-ubicacion` | Artículos agrupados por ubicación |
| GET | `/minimos-maximos` | Niveles mínimos y máximos de stock |
| GET | `/regularizaciones` | Consulta de regularizaciones |
| GET | `/picking` | Tareas de picking activas |
| GET | `/expediciones` | Expediciones |
| GET | `/situacion-pedidos-venta` | Estado de pedidos de venta |
| POST | `/entrada-mercancia` | Registrar entrada de mercancía |
| POST | `/picking/confirmar` | Confirmar línea de picking |
| POST | `/picking/desconfirmar` | Desconfirmar línea de picking |
| GET | `/visor/articulos` | Listado del visor de artículos |
| GET | `/visor/proveedores` | Listado del visor de proveedores |
| GET | `/visor/clientes` | Listado del visor de clientes |
| GET | `/estadisticas/dashboard` | Datos del dashboard |
| GET | `/estadisticas/alertas` | Alertas de stock bajo mínimo |
| GET | `/analitica/*` | Endpoints de analítica por sección |
| GET | `/datos/:tabla` | Volcado completo de una tabla JSON (depuración) |

---

## Datos de demostración

Los archivos en `backend/data/` contienen datos representativos de una ferretería:

- **22 artículos** (ART001–ART022): tornillos, tuercas, arandelas, herramientas, sellantes, etc.
- **3 almacenes**: ALM1 (principal), ALM2 (exterior), PICK (zona picking)
- **13 ubicaciones** distribuidas entre los tres almacenes
- **5 proveedores** y **5 clientes**
- **5 usuarios** del sistema (3 operarios, 1 jefe de almacén, 1 usuario sistema)
- **2 artículos bajo mínimo** (ART021 y ART022) para que las alertas de stock tengan datos visibles

Los movimientos históricos (entradas, salidas, traspasos) se generan al arrancar el servidor y se mantienen en memoria durante la sesión. Las escrituras realizadas desde la aplicación también se guardan en memoria, pero **no persisten al reiniciar el servidor**.

---

## Notas técnicas

- `backend/db.js` está en `.gitignore` porque es la capa de simulación específica de cada entorno. Si clonas el repositorio necesitarás este archivo para que el servidor funcione.
- El visor 3D requiere un navegador con soporte WebGL (cualquier navegador moderno lo tiene).
- La seguridad del backend incluye cabeceras HTTP seguras (`helmet`) y limitación de peticiones por IP (`express-rate-limit`: 200 req / 15 min).
- El backend usa **Express 5** (última versión estable).
- El frontend no usa ningún bundler ni framework: carga scripts y estilos directamente. No se necesita compilar nada.
