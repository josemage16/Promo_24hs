/**
 * VIDA Promo 24hs — Lógica principal
 * - Consulta fecha de vigencia desde Google Sheets (Apps Script) o respaldo local
 * - Compara con la fecha actual de Uruguay (America/Montevideo)
 * - Si coincide: despliega el formulario de registro + contador regresivo 24hs
 * - Si NO coincide: oculta el formulario y muestra el cartel de Instagram
 * - Gestiona el código discreto "161616" en el pie para abrir el modal de edición de fecha
 * - Envía los registros del formulario a Google Sheets
 */

(function () {
  "use strict";

  const CFG = window.PROMO24_CONFIG;
  const LOCAL_DATE_KEY = "vida_promo24_date";

  // Elementos del DOM
  const heroPromoPill = document.getElementById("heroPromoPill");
  const heroPromoPillText = document.getElementById("heroPromoPillText");
  const countdownBox = document.getElementById("countdownBox");
  const countdownHours = document.getElementById("countdownHours");
  const countdownMinutes = document.getElementById("countdownMinutes");
  const countdownSeconds = document.getElementById("countdownSeconds");

  const cardLoadingState = document.getElementById("cardLoadingState");
  const activePromoPanel = document.getElementById("activePromoPanel");
  const inactivePromoPanel = document.getElementById("inactivePromoPanel");

  const promoForm = document.getElementById("promoForm");
  const nombreApellidoInput = document.getElementById("nombreApellido");
  const celularInput = document.getElementById("celular");
  const emailInput = document.getElementById("email");
  const submitPromoBtn = document.getElementById("submitPromoBtn");
  const formAlert = document.getElementById("formAlert");

  // Elementos de administración (código 161616)
  const adminAccessForm = document.getElementById("adminAccessForm");
  const adminCodeInput = document.getElementById("adminCodeInput");
  const adminModal = document.getElementById("adminModal");
  const adminModalClose = document.getElementById("adminModalClose");
  const adminCurrentStatus = document.getElementById("adminCurrentStatus");
  const adminDateForm = document.getElementById("adminDateForm");
  const adminPromoDateInput = document.getElementById("adminPromoDate");
  const adminSaveDateBtn = document.getElementById("adminSaveDateBtn");
  const adminSetTodayBtn = document.getElementById("adminSetTodayBtn");
  const adminClearDateBtn = document.getElementById("adminClearDateBtn");
  const adminModalAlert = document.getElementById("adminModalAlert");

  let activePromoDate = "";
  let countdownInterval = null;

  /* ------------------------------------------------------------------------
     Utilidades de fecha en zona horaria de Uruguay (America/Montevideo)
     ------------------------------------------------------------------------ */
  function getUruguayNowParts() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: CFG.promo.timezone || "America/Montevideo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const parts = {};
    formatter.formatToParts(now).forEach(function (p) {
      if (p.type !== "literal") parts[p.type] = p.value;
    });
    const hourNum = Number(parts.hour) === 24 ? 0 : Number(parts.hour);
    return {
      dateStr: parts.year + "-" + parts.month + "-" + parts.day,
      hour: hourNum,
      minute: Number(parts.minute),
      second: Number(parts.second),
    };
  }

  function formatDateDisplay(yyyyMmDd) {
    if (!yyyyMmDd || !/^\d{4}-\d{2}-\d{2}$/.test(yyyyMmDd)) return "Sin fecha configurada";
    const parts = yyyyMmDd.split("-");
    return parts[2] + "/" + parts[1] + "/" + parts[0];
  }

  function getLocalStoredDate() {
    try {
      return (localStorage.getItem(LOCAL_DATE_KEY) || "").trim();
    } catch (e) {
      return "";
    }
  }

  function setLocalStoredDate(dateStr) {
    try {
      if (dateStr) {
        localStorage.setItem(LOCAL_DATE_KEY, dateStr);
      } else {
        localStorage.removeItem(LOCAL_DATE_KEY);
      }
    } catch (e) {
      // Ignorar errores de almacenamiento
    }
  }

  /* ------------------------------------------------------------------------
     Carga de configuración de fecha (Apps Script -> fallback local)
     ------------------------------------------------------------------------ */
  async function loadPromoDate() {
    const webAppUrl = (CFG.googleSheets.appsScriptWebAppUrl || "").trim();

    if (webAppUrl) {
      try {
        const sep = webAppUrl.indexOf("?") === -1 ? "?" : "&";
        const resp = await fetch(webAppUrl + sep + "action=get_config&t=" + Date.now(), {
          method: "GET",
          cache: "no-store",
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.ok) {
            const remoteDate = String(data.promoDate || "").trim();
            setLocalStoredDate(remoteDate);
            return remoteDate;
          }
        }
      } catch (err) {
        console.warn("No se pudo leer fecha remota de Apps Script, usando respaldo local:", err);
      }
    }

    const stored = getLocalStoredDate();
    if (stored) return stored;
    return (CFG.promo.defaultPromoDate || "").trim();
  }

  /* ------------------------------------------------------------------------
     Renderizado según vigencia de la fecha
     ------------------------------------------------------------------------ */
  function isPromoActiveToday(promoDateStr) {
    if (!promoDateStr) return false;
    const uy = getUruguayNowParts();
    return uy.dateStr === promoDateStr;
  }

  function startCountdown() {
    stopCountdown();
    function tick() {
      const uy = getUruguayNowParts();
      if (uy.dateStr !== activePromoDate) {
        // Pasó la medianoche en Uruguay: cerrar promo automáticamente
        renderPromoState(activePromoDate);
        return;
      }
      const secondsElapsed = uy.hour * 3600 + uy.minute * 60 + uy.second;
      const remaining = Math.max(0, 86400 - secondsElapsed - 1);
      const hrs = Math.floor(remaining / 3600);
      const mins = Math.floor((remaining % 3600) / 60);
      const secs = remaining % 60;

      countdownHours.textContent = String(hrs).padStart(2, "0");
      countdownMinutes.textContent = String(mins).padStart(2, "0");
      countdownSeconds.textContent = String(secs).padStart(2, "0");
    }
    tick();
    countdownInterval = setInterval(tick, 1000);
  }

  function stopCountdown() {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  }

  function renderPromoState(promoDateStr) {
    activePromoDate = promoDateStr || "";
    const active = isPromoActiveToday(activePromoDate);

    if (cardLoadingState) cardLoadingState.hidden = true;

    if (active) {
      activePromoPanel.hidden = false;
      inactivePromoPanel.hidden = true;
      countdownBox.hidden = false;
      heroPromoPill.classList.remove("promo-pill--inactive");
      heroPromoPillText.textContent = "Promo 24hs · ¡Vigente hoy!";
      startCountdown();
    } else {
      activePromoPanel.hidden = true;
      inactivePromoPanel.hidden = false;
      countdownBox.hidden = true;
      heroPromoPill.classList.add("promo-pill--inactive");
      heroPromoPillText.textContent = "Promo sorpresa mensual · Solo 24hs";
      stopCountdown();
    }
  }

  /* ------------------------------------------------------------------------
     Formulario de registro (Nombre y Apellido, Celular, Email opcional)
     ------------------------------------------------------------------------ */
  function setFieldError(inputId, msg) {
    const input = document.getElementById(inputId);
    const errEl = document.getElementById(inputId + "Error");
    if (input) input.classList.toggle("is-invalid", Boolean(msg));
    if (errEl) errEl.textContent = msg || "";
  }

  function showFormAlert(type, message) {
    formAlert.className = "alert alert--" + type;
    formAlert.textContent = message;
    formAlert.hidden = false;
  }

  function hideFormAlert() {
    formAlert.hidden = true;
    formAlert.textContent = "";
  }

  function validateLeadForm() {
    setFieldError("nombreApellido", "");
    setFieldError("celular", "");
    setFieldError("email", "");

    let valid = true;
    const nombreApellido = nombreApellidoInput.value.trim();
    const celularRaw = celularInput.value.trim();
    const celularDigits = celularRaw.replace(/[^\d]/g, "");
    const email = emailInput.value.trim();

    if (nombreApellido.length < 3 || nombreApellido.indexOf(" ") === -1) {
      setFieldError("nombreApellido", "Ingresá tu nombre y apellido completo.");
      valid = false;
    }

    if (celularDigits.length < 8 || celularDigits.length > 15) {
      setFieldError("celular", "Ingresá un número de celular válido (ej: 099 123 456).");
      valid = false;
    }

    // Email NO obligatorio: solo validamos formato si el usuario escribió algo
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setFieldError("email", "Si ingresás un email, verificá que tenga un formato válido.");
      valid = false;
    }

    return valid;
  }

  async function handleLeadSubmit(ev) {
    ev.preventDefault();
    hideFormAlert();

    if (!isPromoActiveToday(activePromoDate)) {
      renderPromoState(activePromoDate);
      return;
    }

    if (!validateLeadForm()) {
      showFormAlert("error", "Por favor revisá los campos indicados antes de enviar.");
      return;
    }

    const payload = {
      action: "register",
      promoEditionDate: activePromoDate,
      nombreApellido: nombreApellidoInput.value.trim(),
      celular: celularInput.value.trim(),
      email: emailInput.value.trim().toLowerCase(),
      source: "Landing Promo 24hs",
    };

    const originalLabel = submitPromoBtn.textContent;
    submitPromoBtn.disabled = true;
    submitPromoBtn.textContent = "Enviando registro...";

    const webAppUrl = (CFG.googleSheets.appsScriptWebAppUrl || "").trim();

    try {
      if (webAppUrl) {
        const resp = await fetch(webAppUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload),
        });

        if (!resp.ok) {
          throw new Error("HTTP " + resp.status);
        }

        const result = await resp.json().catch(function () {
          return { ok: true };
        });

        if (result && result.ok === false) {
          throw new Error(result.error || "No se pudo guardar el registro.");
        }
      }

      promoForm.reset();
      showFormAlert(
        "success",
        webAppUrl
          ? "¡Registro confirmado! Accediste a tu bonificación de $1.000 en la primera cuota de VIDA Tradicional. Un asesor de VIDA se comunicará a la brevedad."
          : "¡Registro validado en modo prueba! Recordá conectar tu URL de Google Apps Script en js/config.js para guardar los datos en tu Google Sheet."
      );
    } catch (err) {
      console.error("Error enviando lead:", err);
      showFormAlert(
        "error",
        "No pudimos enviar tus datos en este momento. Por favor reintentá o escribinos por WhatsApp al 2204 3739."
      );
    } finally {
      submitPromoBtn.disabled = false;
      submitPromoBtn.textContent = originalLabel;
    }
  }

  /* ------------------------------------------------------------------------
     Administración oculta con código "161616"
     ------------------------------------------------------------------------ */
  function showAdminAlert(type, message) {
    adminModalAlert.className = "alert alert--" + type;
    adminModalAlert.textContent = message;
    adminModalAlert.hidden = false;
  }

  function hideAdminAlert() {
    adminModalAlert.hidden = true;
    adminModalAlert.textContent = "";
  }

  function updateAdminStatusSummary() {
    const uy = getUruguayNowParts();
    const active = isPromoActiveToday(activePromoDate);
    adminCurrentStatus.innerHTML =
      "<strong>Fecha actual (Uruguay):</strong> " +
      formatDateDisplay(uy.dateStr) +
      "<br><strong>Próxima edición configurada:</strong> " +
      formatDateDisplay(activePromoDate) +
      "<br><strong>Estado actual de la landing:</strong> " +
      (active ? "ACTIVA (formulario visible)" : "INACTIVA (cartel de Instagram visible)");
  }

  function openAdminModal() {
    hideAdminAlert();
    adminPromoDateInput.value = activePromoDate || getUruguayNowParts().dateStr;
    updateAdminStatusSummary();
    adminModal.classList.add("is-open");
    adminModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    setTimeout(function () {
      adminPromoDateInput.focus();
    }, 60);
  }

  function closeAdminModal() {
    adminModal.classList.remove("is-open");
    adminModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  async function savePromoDate(newDateStr) {
    hideAdminAlert();
    adminSaveDateBtn.disabled = true;
    adminSaveDateBtn.textContent = "Guardando...";

    const webAppUrl = (CFG.googleSheets.appsScriptWebAppUrl || "").trim();
    let syncedRemote = false;

    try {
      if (webAppUrl) {
        const resp = await fetch(webAppUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            action: "set_promo_date",
            code: CFG.promo.adminCode,
            promoDate: newDateStr,
          }),
        });

        if (!resp.ok) throw new Error("HTTP " + resp.status);
        const data = await resp.json().catch(function () {
          return { ok: true };
        });
        if (data && data.ok === false) {
          throw new Error(data.error || "Error guardando fecha en Google Sheets.");
        }
        syncedRemote = true;
      }

      setLocalStoredDate(newDateStr);
      renderPromoState(newDateStr);
      updateAdminStatusSummary();

      showAdminAlert(
        "success",
        (newDateStr
          ? "Fecha de próxima edición guardada: " + formatDateDisplay(newDateStr) + ". "
          : "Fecha eliminada (landing en estado inactivo). ") +
          (syncedRemote
            ? "Sincronizada en Google Sheets para todos los visitantes."
            : "Guardada en este navegador (conectá Apps Script en js/config.js para que aplique globalmente a todos los visitantes).")
      );
    } catch (err) {
      console.error("Error guardando fecha de promo:", err);
      showAdminAlert(
        "error",
        "No se pudo guardar la fecha en Google Sheets. Verificá tu implementación de Apps Script."
      );
    } finally {
      adminSaveDateBtn.disabled = false;
      adminSaveDateBtn.textContent = "Guardar fecha";
    }
  }

  function bindEvents() {
    // Enlaces WhatsApp dinámicos
    const waUrl =
      "https://api.whatsapp.com/send?phone=" +
      CFG.brand.whatsappNumber +
      "&text=" +
      encodeURIComponent(CFG.brand.whatsappMessage);
    document.querySelectorAll("[data-whatsapp-link]").forEach(function (el) {
      el.setAttribute("href", waUrl);
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    });

    if (promoForm) {
      promoForm.addEventListener("submit", handleLeadSubmit);
    }

    // Acceso con código 161616
    if (adminAccessForm) {
      adminAccessForm.addEventListener("submit", function (ev) {
        ev.preventDefault();
        const entered = (adminCodeInput.value || "").trim();
        if (entered === String(CFG.promo.adminCode)) {
          adminCodeInput.value = "";
          openAdminModal();
        } else {
          adminCodeInput.value = "";
        }
      });
    }

    if (adminModalClose) {
      adminModalClose.addEventListener("click", closeAdminModal);
    }

    if (adminModal) {
      adminModal.addEventListener("click", function (ev) {
        if (ev.target === adminModal) closeAdminModal();
      });
    }

    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && adminModal && adminModal.classList.contains("is-open")) {
        closeAdminModal();
      }
    });

    if (adminDateForm) {
      adminDateForm.addEventListener("submit", function (ev) {
        ev.preventDefault();
        const selectedDate = (adminPromoDateInput.value || "").trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
          showAdminAlert("error", "Seleccioná una fecha válida.");
          return;
        }
        savePromoDate(selectedDate);
      });
    }

    if (adminSetTodayBtn) {
      adminSetTodayBtn.addEventListener("click", function () {
        const todayUy = getUruguayNowParts().dateStr;
        adminPromoDateInput.value = todayUy;
        savePromoDate(todayUy);
      });
    }

    if (adminClearDateBtn) {
      adminClearDateBtn.addEventListener("click", function () {
        adminPromoDateInput.value = "";
        savePromoDate("");
      });
    }
  }

  async function init() {
    bindEvents();
    const loadedDate = await loadPromoDate();
    renderPromoState(loadedDate);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
