/**
 * Configuración centralizada — VIDA Promo 24hs
 * ============================================
 * Hoja de Google Sheets vinculada:
 * https://docs.google.com/spreadsheets/d/1d7CoQ_m1gSeWMt0RhTGOvRb3lVELQS_aEFOfKzxnomU/edit?usp=sharing
 */

window.PROMO24_CONFIG = {
  brand: {
    name: "VIDA Servicio de Compañía",
    phoneDisplay: "2204 3739",
    phoneHref: "tel:+59822043739",
    whatsappNumber: "59822043739",
    whatsappMessage:
      "Hola VIDA Servicio de Compañía, quiero consultar por la Promo 24hs y los beneficios de ser Socio VIDA.",
    websiteUrl: "https://www.vida.com.uy",
    buenaVidaUrl: "https://www.vida.com.uy/buenavida",
    instagramHandle: "@vidaserviciodecomp",
    instagramUrl: "https://www.instagram.com/vidaserviciodecomp/",
  },

  promo: {
    /**
     * Zona horaria oficial de Uruguay para determinar la vigencia exacta de 24hs.
     */
    timezone: "America/Montevideo",
    /**
     * Código para desplegar el modal de configuración de fecha de próxima edición.
     */
    adminCode: "161616",
    /**
     * Fecha de respaldo en formato YYYY-MM-DD (solo se usa si todavía no se configuró
     * una fecha en Google Sheets ni en localStorage). Dejar "" para iniciar inactiva.
     */
    defaultPromoDate: "",
  },

  googleSheets: {
    spreadsheetId: "1d7CoQ_m1gSeWMt0RhTGOvRb3lVELQS_aEFOfKzxnomU",
    spreadsheetUrl:
      "https://docs.google.com/spreadsheets/d/1d7CoQ_m1gSeWMt0RhTGOvRb3lVELQS_aEFOfKzxnomU/edit?usp=sharing",
    /**
     * TODO: Pegá aquí la Web App URL generada al implementar google-apps-script/Code.gs
     * desde tu planilla de Google Sheets.
     * Ejemplo: "https://script.google.com/macros/s/AKfycb.../exec"
     */
    appsScriptWebAppUrl: "",
  },
};
