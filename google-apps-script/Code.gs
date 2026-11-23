/**
 * VIDA Promo 24hs — Google Apps Script Backend para Google Sheets
 * ===============================================================
 * Hoja vinculada:
 * https://docs.google.com/spreadsheets/d/1d7CoQ_m1gSeWMt0RhTGOvRb3lVELQS_aEFOfKzxnomU/edit?usp=sharing
 *
 * Funciones:
 *   1. Guarda los registros del formulario en la pestaña "Registros Promo 24hs"
 *      (Nombre y Apellido, Celular, Email opcional, Fecha de edición, Fecha y Hora).
 *   2. Guarda y lee la fecha de la próxima edición de la Promo 24hs en la pestaña
 *      "Config Promo" (protegida con el código 161616) para que aplique a TODOS los visitantes.
 *
 * INSTRUCCIONES DE INSTALACIÓN:
 * 1. Abrí el Google Sheet anterior -> Extensiones -> Apps Script.
 * 2. Pegá TODO este código y guardá (Ctrl + S) como "VIDA Promo 24hs Backend".
 * 3. Hacé clic en "Implementar" -> "Nueva implementación" -> tipo "Aplicación web".
 *    - Ejecutar como: "Yo"
 *    - Quién tiene acceso: "Cualquier usuario"
 * 4. Copiá la URL de la aplicación web y pegala en js/config.js (appsScriptWebAppUrl).
 */

const SPREADSHEET_ID = "1d7CoQ_m1gSeWMt0RhTGOvRb3lVELQS_aEFOfKzxnomU";
const LEADS_SHEET_NAME = "Registros Promo 24hs";
const CONFIG_SHEET_NAME = "Config Promo";
const ADMIN_CODE = "161616";
const TIMEZONE_UY = "America/Montevideo";

const LEADS_HEADERS = [
  "Fecha y Hora Registro",
  "Fecha Edición Promo",
  "Nombre y Apellido",
  "Celular",
  "Email",
  "Origen",
];

function getOrCreateLeadsSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(LEADS_SHEET_NAME);

  if (!sheet) {
    const firstSheet = ss.getSheets()[0];
    if (firstSheet && firstSheet.getLastRow() === 0) {
      sheet = firstSheet;
      sheet.setName(LEADS_SHEET_NAME);
    } else {
      sheet = ss.insertSheet(LEADS_SHEET_NAME);
    }
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(LEADS_HEADERS);
    const headerRange = sheet.getRange(1, 1, 1, LEADS_HEADERS.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#304689");
    headerRange.setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function getOrCreateConfigSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(CONFIG_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG_SHEET_NAME);
    sheet.appendRow(["Clave", "Valor", "Última Actualización"]);
    const headerRange = sheet.getRange(1, 1, 1, 3);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#942F4A");
    headerRange.setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
    sheet.appendRow(["PROMO_DATE", "", ""]);
  }

  return sheet;
}

function readPromoDate_() {
  const sheet = getOrCreateConfigSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return "";
  const values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === "PROMO_DATE") {
      const raw = values[i][1];
      if (raw instanceof Date) {
        return Utilities.formatDate(raw, TIMEZONE_UY, "yyyy-MM-dd");
      }
      return String(raw || "").trim();
    }
  }
  return "";
}

function writePromoDate_(promoDateStr) {
  const sheet = getOrCreateConfigSheet_();
  const now = Utilities.formatDate(new Date(), TIMEZONE_UY, "yyyy-MM-dd HH:mm:ss");
  const lastRow = sheet.getLastRow();

  if (lastRow >= 2) {
    const keys = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < keys.length; i++) {
      if (String(keys[i][0]).trim() === "PROMO_DATE") {
        const rowNum = i + 2;
        sheet.getRange(rowNum, 2).setValue(promoDateStr ? "'" + promoDateStr : "");
        sheet.getRange(rowNum, 3).setValue(now);
        return;
      }
    }
  }

  sheet.appendRow(["PROMO_DATE", promoDateStr ? "'" + promoDateStr : "", now]);
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/**
 * GET:
 * - ?action=get_config -> devuelve la fecha configurada y la fecha actual de Uruguay
 * - default -> verificación de salud del servicio
 */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || "health";
  const serverDateUY = Utilities.formatDate(new Date(), TIMEZONE_UY, "yyyy-MM-dd");

  if (action === "get_config") {
    return jsonResponse_({
      ok: true,
      promoDate: readPromoDate_(),
      serverDateUY: serverDateUY,
    });
  }

  return jsonResponse_({
    ok: true,
    service: "VIDA Promo 24hs API",
    spreadsheetId: SPREADSHEET_ID,
    promoDate: readPromoDate_(),
    serverDateUY: serverDateUY,
    timestamp: new Date().toISOString(),
  });
}

/**
 * POST:
 * - action = "register": guarda un nuevo interesado (Nombre y Apellido, Celular, Email opcional)
 * - action = "set_promo_date": actualiza la fecha de próxima edición (requiere code === "161616")
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    const rawBody = (e && e.postData && e.postData.contents) || "{}";
    let data = {};
    try {
      data = JSON.parse(rawBody);
    } catch (parseErr) {
      data = (e && e.parameter) || {};
    }

    if (data.action === "set_promo_date") {
      if (String(data.code || "").trim() !== ADMIN_CODE) {
        return jsonResponse_({ ok: false, error: "Código inválido." });
      }
      const nextDate = String(data.promoDate || "").trim();
      if (nextDate && !/^\d{4}-\d{2}-\d{2}$/.test(nextDate)) {
        return jsonResponse_({ ok: false, error: "Formato de fecha inválido (YYYY-MM-DD)." });
      }
      writePromoDate_(nextDate);
      return jsonResponse_({
        ok: true,
        promoDate: nextDate,
      });
    }

    if (data.action === "register") {
      const sheet = getOrCreateLeadsSheet_();
      const now = Utilities.formatDate(new Date(), TIMEZONE_UY, "yyyy-MM-dd HH:mm:ss");
      const editionDate = String(data.promoEditionDate || readPromoDate_() || "").trim();

      sheet.appendRow([
        now,
        editionDate ? "'" + editionDate : "",
        String(data.nombreApellido || "").trim(),
        "'" + String(data.celular || "").trim(),
        String(data.email || "").trim().toLowerCase(),
        String(data.source || "Landing Promo 24hs").trim(),
      ]);

      return jsonResponse_({
        ok: true,
        rowNumber: sheet.getLastRow(),
        savedAt: now,
      });
    }

    return jsonResponse_({
      ok: false,
      error: "Acción no reconocida: " + String(data.action || ""),
    });
  } catch (err) {
    return jsonResponse_({
      ok: false,
      error: err && err.message ? err.message : String(err),
    });
  } finally {
    lock.releaseLock();
  }
}
