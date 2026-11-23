# VIDA — Promo 24hs (Landing Responsive)

Landing page responsive con el look & feel oficial de **[www.vida.com.uy](https://www.vida.com.uy)** para promocionar la **Promo 24hs** de **VIDA Servicio de Compañía**.

Repositorio sincronizado: https://github.com/josemage16/Promo_24hs

---

## Características principales

- **Identidad visual oficial de VIDA:** colores institucionales (`#304689`, `#942F4A`, `#C74061`, `#96B942`), tipografía **Quicksand** y logotipos oficiales.
- **Control automático de vigencia (24 horas en horario de Uruguay `America/Montevideo`):**
  - **En la fecha configurada:** muestra el formulario de registro (**Nombre y Apellido**, **Celular**, **Email opcional**) junto a un contador regresivo hasta la medianoche.
  - **Fuera de la fecha configurada:** oculta por completo el formulario y muestra el cartel *"Seguinos en Instagram para saber cuándo quedará activa esta promo"* con acceso directo a `@vidaserviciodecomp`.
- **Panel discreto de configuración (código `161616`):**
  - En el pie de página (esquina inferior derecha) hay un campo discreto donde al ingresar **`161616`** se despliega un modal para cargar la fecha de la próxima edición.
  - Al conectarlo con Google Apps Script, esa fecha se guarda en la pestaña **`Config Promo`** del Google Sheet y se sincroniza automáticamente para todos los visitantes.
- **Guardado de leads en Google Sheets:**
  - Planilla oficial: `https://docs.google.com/spreadsheets/d/1d7CoQ_m1gSeWMt0RhTGOvRb3lVELQS_aEFOfKzxnomU/edit?usp=sharing`

---

## Conectar Google Sheets (Apps Script)

1. Abrí la planilla:  
   https://docs.google.com/spreadsheets/d/1d7CoQ_m1gSeWMt0RhTGOvRb3lVELQS_aEFOfKzxnomU/edit?usp=sharing
2. Entrá a **Extensiones → Apps Script**.
3. Borrá el contenido inicial y pegá todo el código de [`google-apps-script/Code.gs`](google-apps-script/Code.gs).
4. Guardá el proyecto y hacé clic en **Implementar → Nueva implementación → Aplicación web**:
   - **Ejecutar como:** Yo
   - **Quién tiene acceso:** Cualquier usuario
5. Copiá la **URL de la aplicación web** (`https://script.google.com/macros/s/.../exec`) y pegala en [`js/config.js`](js/config.js) dentro de `googleSheets.appsScriptWebAppUrl`.

---

## Publicar online gratis en GitHub Pages

1. Entrá a https://github.com/josemage16/Promo_24hs/settings/pages
2. En **Source**, elegí **Deploy from a branch** → rama **`main`** → carpeta **`/ (root)`** → **Save**.
3. Quedará publicada en `https://josemage16.github.io/Promo_24hs/`.
