# EcoTrace Enterprise: Gestión Inteligente de Residuos

EcoTrace es una plataforma diseñada para transformar la sostenibilidad en un activo medible. Nuestro sistema permite auditar, trazar y certificar cada kilogramo reciclado, facilitando que las empresas gestionen altos volúmenes de reciclaje con total transparencia.

## 🚀 Tecnologías Aplicadas (Desarrollo Web)

Este proyecto ha sido desarrollado aplicando una arquitectura moderna de desarrollo web, dividida en componentes de cliente y servidor:

* **Frontend (Vite + React + TypeScript):** Se utilizó Vite para un entorno de desarrollo ultra rápido en macOS. El uso de TypeScript garantiza un tipado fuerte y reduce errores en la interfaz de usuario.
* **Backend (Node.js + Express):** Ubicado en `src/backend/server.js`, este servidor gestiona la lógica de negocio y la persistencia de datos en el puerto 4000.
* **Estilos (CSS Personalizado):** Se implementó un diseño limpio y profesional mediante `style.css`, enfocado en la experiencia de usuario (UX) corporativa.
* **Conectividad:** Uso de la librería **Axios** para la comunicación asíncrona entre el formulario de registro y la API del servidor.

## 🛠️ Estructura del Proyecto

* `index.html`: Punto de entrada de la aplicación.
* `src/main.tsx`: Archivo principal que renderiza la lógica de React.
* `src/App.tsx`: Contiene la estructura de la aplicación y la lógica de registro de empresas.
* `src/backend/server.js`: Servidor Express que maneja las rutas de la API y la conexión a MongoDB.
* `style.css`: Definiciones de estilos y branding de EcoTrace.

## 📋 Funcionalidades Principales

1.  **Registro Corporativo:** Formulario robusto para que empresas se den de alta en el sistema.
2.  **Trazabilidad Real:** Capacidad de seguimiento de materiales desde el origen hasta el reciclaje final.
3.  **Auditoría Antifraude:** Sistema de validación para asegurar que el pesaje y los materiales reportados sean verídicos.
4.  **Certificación ISO:** Preparación de datos para cumplimiento de normas internacionales de sostenibilidad.

## ⚙️ Instrucciones de Instalación y Ejecución

Para ejecutar este proyecto en un entorno local (macOS):

1.  **Instalar dependencias:**
    ```bash
    npm install
    ```
2.  **Iniciar el Servidor Backend:**
    ```bash
    cd src/backend
    node server.js
    ```
3.  **Iniciar el Frontend (en una nueva terminal):**
    ```bash
    npm run dev
    ```

---
**Proyecto Integrador - Sostenibilidad y Desarrollo Web**