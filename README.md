# Productos Álvarez — Aplicación Web de Pastelería Artesanal

Proyecto de fin de ciclo (TFG) del Ciclo Formativo de Grado Superior en **Desarrollo de Aplicaciones Web (DAW)**.

Aplicación web completa para una pastelería artesanal que incluye catálogo de productos, tienda online con carrito de compra, sistema de pedidos y panel de administración. La arquitectura separa el frontend estático (desplegado en Netlify) de la API REST (desplegada en Railway junto a la base de datos MySQL).

---

## Stack tecnológico

### Backend
| Tecnología | Versión |
|---|---|
| Node.js | 24.x |
| Express | ^4.21.2 |
| mysql2 | ^3.11.3 |
| bcryptjs | ^3.0.3 |
| dotenv | ^16.4.5 |
| cors | ^2.8.5 |
| nodemon *(dev)* | ^3.1.4 |

### Frontend
| Tecnología | Versión |
|---|---|
| HTML5 | — |
| CSS3 | — |
| JavaScript ES Modules (vanilla) | — |

### Base de datos
| Tecnología | Versión |
|---|---|
| MySQL | 8.x |

### Infraestructura
| Servicio | Uso |
|---|---|
| [Railway](https://railway.app) | Backend Node.js + MySQL |
| [Netlify](https://netlify.com) | Frontend estático |

---

## Estructura de carpetas

```
TFG_app V2.0/
├── index.html                        # Página de inicio (home)
├── README.md
│
└── src/
    ├── assets/
    │   └── img/
    │       ├── products/             # Imágenes de productos
    │       ├── galeria/              # Imágenes de galería y taller
    │       ├── home/                 # Imágenes de la página de inicio
    │       └── footer/               # Logos del footer
    │
    ├── css/
    │   └── styles.css                # Hoja de estilos global
    │
    ├── js/
    │   ├── config.js                 # URL base de la API (detección local/producción)
    │   ├── app.js                    # Scripts globales / home
    │   ├── tienda.js                 # Listado y filtrado de productos
    │   ├── producto.js               # Detalle de producto
    │   ├── galeria.js                # Galería con lightbox
    │   ├── carrito.js                # Carrito de compra
    │   ├── checkout.js               # Formulario y envío de pedido
    │   ├── login.js                  # Autenticación de usuario
    │   ├── register.js               # Registro de usuario
    │   ├── mis-pedidos.js            # Historial de pedidos del usuario
    │   ├── admin.js                  # Panel de administración
    │   ├── admin-login.js            # Autenticación de administrador
    │   └── user-menu.js              # Menú de usuario compartido
    │
    ├── pages/
    │   ├── tienda.html
    │   ├── producto.html
    │   ├── galeria.html
    │   ├── carrito.html
    │   ├── checkout.html
    │   ├── login.html
    │   ├── register.html
    │   ├── mis-pedidos.html
    │   ├── contacto.html
    │   ├── admin.html
    │   └── admin-login.html
    │
    └── backend/
        ├── server.js                 # Punto de entrada — servidor Express
        ├── package.json
        ├── .env                      # Variables de entorno locales (no incluir en git)
        ├── .env.example              # Plantilla de variables de entorno
        ├── .gitignore
        ├── config/
        │   └── db.js                 # Pool de conexión MySQL
        ├── routes/
        │   ├── productRoutes.js
        │   ├── orderRoutes.js
        │   └── authRoutes.js
        └── controllers/
            ├── productController.js
            ├── orderController.js
            └── authController.js
```

---

## Requisitos previos

- [Node.js](https://nodejs.org) v18 o superior
- [npm](https://www.npmjs.com) v9 o superior
- [MySQL](https://www.mysql.com) 8.x en ejecución local
- Cliente MySQL (MySQL Workbench, DBeaver o CLI)

---

## Instalación local

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd "TFG_app V2.0"
```

### 2. Instalar dependencias del backend

```bash
cd src/backend
npm install
```

### 3. Configurar las variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con los valores locales (ver sección [Variables de entorno](#variables-de-entorno)).

### 4. Crear la base de datos

Conectarse a MySQL y ejecutar:

```sql
CREATE DATABASE tfg_pasteleria CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Después importar el esquema y los datos iniciales si se dispone del archivo `.sql` de volcado.

### 5. Arrancar el servidor de desarrollo

```bash
npm run dev
```

El backend quedará disponible en `http://localhost:3000`.

### 6. Servir el frontend

Abrir los archivos HTML con un servidor local (por ejemplo, la extensión **Live Server** de VS Code) apuntando a la raíz del proyecto. Los scripts JS detectan automáticamente `localhost` y apuntan al backend local.

---

## Variables de entorno

El backend lee su configuración de un archivo `.env` ubicado en `src/backend/`. Nunca se debe incluir este archivo en el repositorio.

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto en el que escucha el servidor | `3000` |
| `DB_HOST` | Host del servidor MySQL | `localhost` |
| `DB_USER` | Usuario de la base de datos | `root` |
| `DB_PASSWORD` | Contraseña de la base de datos | `contraseña_segura` |
| `DB_NAME` | Nombre de la base de datos | `tfg_pasteleria` |

La plantilla `.env.example` está disponible en `src/backend/.env.example`.

---

## Despliegue

### Backend en Railway

Railway gestiona tanto el servidor Node.js como la base de datos MySQL en la misma plataforma.

#### Base de datos MySQL

1. Crear un nuevo proyecto en [railway.app](https://railway.app).
2. Añadir un servicio **MySQL** desde el panel de Railway.
3. Railway genera automáticamente las variables de conexión (`MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`, `MYSQLPORT`). Anotarlas para usarlas en el siguiente paso.

#### Servicio Node.js

1. Añadir un nuevo servicio desde el repositorio de GitHub.
2. Establecer el **Root Directory** como `src/backend`.
3. Railway detecta automáticamente Node.js y ejecutará `npm start` (`node server.js`).
4. En la pestaña **Variables** del servicio, añadir:

   | Variable | Valor |
   |---|---|
   | `DB_HOST` | host proporcionado por Railway MySQL |
   | `DB_USER` | usuario proporcionado por Railway MySQL |
   | `DB_PASSWORD` | contraseña proporcionada por Railway MySQL |
   | `DB_NAME` | nombre de la base de datos |
   | `PORT` | Railway lo inyecta automáticamente, no es necesario definirlo |

5. En **Settings → Networking**, generar un dominio público. La URL de este proyecto es: `https://tfg-pasteleria-production.up.railway.app`

### Frontend en Netlify

1. Conectar el repositorio de GitHub en [app.netlify.com](https://app.netlify.com).
2. Configurar el build:
   - **Base directory**: raíz del proyecto (vacío)
   - **Build command**: vacío (no hay proceso de compilación)
   - **Publish directory**: `.` (raíz del proyecto)
3. Desplegar el sitio.
4. El sitio queda disponible en `https://tfg-pasteleriav2.netlify.app`. Ir a **Site configuration → Snippet injection** y añadir el siguiente snippet en el `<head>` de todas las páginas:

   ```html
   <script>window.__BACKEND_URL__ = "https://tfg-pasteleria-production.up.railway.app";</script>
   ```

   Esto permite que `src/js/config.js` apunte al backend correcto en producción sin recompilar nada.

5. El backend en Railway ya tiene CORS restringido al dominio de Netlify:

   ```js
   app.use(cors({ origin: "https://tfg-pasteleriav2.netlify.app" }));
   ```

---

## Endpoints de la API

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/products` | Listar productos públicos |
| `GET` | `/api/products/:id` | Detalle de un producto |
| `GET` | `/api/products/admin/all` | Listar todos los productos (admin) |
| `PUT` | `/api/products/:id/display-mode` | Actualizar modo y stock (admin) |
| `POST` | `/api/orders` | Crear un nuevo pedido |
| `GET` | `/api/orders` | Listar todos los pedidos (admin) |
| `GET` | `/api/orders/:id` | Detalle de un pedido |
| `GET` | `/api/orders/user/:email` | Pedidos de un usuario |
| `PUT` | `/api/orders/:id/status` | Actualizar estado de pedido (admin) |
| `POST` | `/api/auth/register` | Registro de usuario |
| `POST` | `/api/auth/login` | Inicio de sesión |
| `GET` | `/api/test-db` | Verificar conexión a la base de datos |

---

## Autor

**Gonzalo Díaz Gajete**
Ciclo Formativo de Grado Superior — Desarrollo de Aplicaciones Web (DAW)
Curso 2024–2025
