# RentaFlow — Guía de instalación y configuración

## 1. Requisitos previos

- **Node.js 20+** — [nodejs.org/en/download](https://nodejs.org/en/download/)
- **Firebase CLI** — `npm install -g firebase-tools`
- Cuenta de **Firebase** (proyecto creado en [console.firebase.google.com](https://console.firebase.google.com))

---

## 2. Instalación

```bash
# Instalar dependencias del frontend
cd C:\Users\octav\OneDrive\Desktop\prototipo
npm install

# Instalar dependencias de las Cloud Functions
cd functions
npm install
cd ..
```

---

## 3. Configurar Firebase

### 3.1 Crear proyecto en Firebase Console

1. Ir a [console.firebase.google.com](https://console.firebase.google.com)
2. Crear nuevo proyecto (sin Google Analytics para simplificar)
3. Activar **Authentication → Email/Password**
4. Crear base de datos **Firestore** en modo producción
5. En **Project Settings → General**, copiar la configuración de la Web App

### 3.2 Editar `.env.local`

Reemplazar los valores en `.env.local` con los de tu proyecto Firebase:

```env
VITE_FIREBASE_API_KEY=AIzaSy_TU_CLAVE
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto-id
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 3.3 Editar `.firebaserc`

```json
{
  "projects": {
    "default": "tu-proyecto-id"
  }
}
```

---

## 4. Correr en desarrollo

```bash
npm run dev
```

La app estará en `http://localhost:5173`

---

## 5. Configurar Google Calendar (opcional para el prototipo)

1. Ir a [console.cloud.google.com](https://console.cloud.google.com)
2. Activar **Google Calendar API**
3. Crear una **Service Account** con rol Editor
4. Generar clave JSON
5. Compartir tu calendario de Google con el email de la service account (con permisos de escritura)
6. Configurar en las Cloud Functions:

```bash
firebase functions:secrets:set GOOGLE_CALENDAR_CLIENT_EMAIL
firebase functions:secrets:set GOOGLE_CALENDAR_PRIVATE_KEY
firebase functions:secrets:set GOOGLE_CALENDAR_ID
```

---

## 6. Configurar notificaciones por email (opcional)

Usar Gmail con contraseña de aplicación:
1. Gmail → Seguridad → Verificación en dos pasos → Contraseñas de aplicación
2. Generar contraseña para "Correo"

```bash
firebase functions:secrets:set SMTP_USER      # tu-email@gmail.com
firebase functions:secrets:set SMTP_PASSWORD  # contraseña-de-aplicación
```

---

## 7. Deploy

### Frontend + Hosting

```bash
npm run build
firebase deploy --only hosting
```

### Cloud Functions

```bash
cd functions
npm run build
cd ..
firebase deploy --only functions
```

### Todo junto

```bash
npm run build && firebase deploy
```

---

## 8. Emuladores locales (desarrollo sin Firebase real)

```bash
firebase emulators:start
```

Interfaces:
- App: `http://localhost:5000`
- Emulator UI: `http://localhost:4000`
- Auth: `http://localhost:9099`
- Firestore: `http://localhost:8080`
- Functions: `http://localhost:5001`

---

## 9. Estructura de archivos

```
prototipo/
├── src/
│   ├── app/
│   │   ├── routes/          # AppRouter, PrivateRoute
│   │   └── store/           # Zustand store (propiedades)
│   ├── features/
│   │   ├── auth/            # AuthContext, login/register
│   │   ├── propiedades/     # CRUD, wizard, hooks, service
│   │   └── servicios/       # ServicioCard, useConsultarDeuda
│   ├── shared/
│   │   ├── components/      # Layout, Badge, StatsCard
│   │   └── lib/             # firebase.ts, utils.ts, types.ts
│   ├── pages/               # Dashboard, Propiedades, Detail, Forms
│   └── main.tsx
├── functions/src/
│   ├── scraping/            # EDESUR, Metrogas, AySA
│   ├── calendario/          # Google Calendar
│   ├── notificaciones/      # Email resumen mensual
│   └── index.ts             # Exports de todas las functions
├── firestore.rules
├── firebase.json
└── .env.local
```

---

## 10. Notas sobre scraping

> Los scrapers en `functions/src/scraping/` usan Puppeteer para navegar los portales
> de EDESUR, Metrogas y AySA. Los portales pueden cambiar su estructura HTML sin previo
> aviso, por lo que puede ser necesario actualizar los selectores CSS.
>
> Para producción, evaluar acuerdos de API directa con las distribuidoras.
