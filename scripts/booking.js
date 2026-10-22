const bookingForm = document.getElementById("booking-form");

if (bookingForm) {
  const bookingSection = document.getElementById("reserva");
  const bookingDate = document.getElementById("booking-date");
  const bookingTime = document.getElementById("booking-time");
  const bookingGuests = document.getElementById("booking-guests");
  const bookingCurrency = document.getElementById("booking-currency");
  const bookingStatus = document.getElementById("booking-status");
  const exchangeDetails = document.getElementById("exchange-details");
  const exchangeRateText = document.getElementById("exchange-rate");
  const exchangeDateText = document.getElementById("exchange-date");
  const errors = new Map();
  const basePriceARS = 5000;
  const stopName = bookingSection.dataset.stopName;
  const stopShort = bookingSection.dataset.stopShort;
  const stopNumber = bookingSection.dataset.stopNumber;
  const openMinutes = Number(bookingSection.dataset.openHour) * 60;
  const closeMinutes = Number(bookingSection.dataset.closeHour) * 60;
  let exchangeRate = null;
  let exchangeReferenceDate = "";
  let exchangeLoadFailed = false;

  const fieldNames = ["name", "email", "date", "time", "guests", "currency"];
  fieldNames.forEach((name) => errors.set(name, document.getElementById(`booking-${name}-error`)));

  const todayLocal = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  bookingDate.min = todayLocal();
  document.querySelector("[data-reservation-stop-title]").textContent = stopShort;
  document.getElementById("summary-stop").textContent = `${stopNumber}. ${stopShort}`;

  const formattedDate = (dateString) => {
    if (!dateString) return "A confirmar";
    const [year, month, day] = dateString.split("-").map(Number);
    return new Intl.DateTimeFormat("es-AR", { dateStyle: "short" }).format(new Date(year, month - 1, day));
  };

  const formatMoney = (amount, currency, fractionDigits = 2) => {
    if (currency === "USD") {
      return `${new Intl.NumberFormat("en-US", { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }).format(amount)} USD`;
    }
    return `$${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(amount)} ARS`;
  };

  const populateTimeOptions = () => {
    const selectedDate = bookingDate.value;
    bookingTime.replaceChildren(new Option("Seleccioná un horario", ""));
    if (!selectedDate) return;

    const [year, month, day] = selectedDate.split("-").map(Number);
    const weekday = new Date(year, month - 1, day).getDay();
    if (weekday === 1) {
      bookingTime.replaceChildren(new Option("Cerrado los lunes", ""));
      return;
    }

    for (let minutes = openMinutes; minutes < closeMinutes; minutes += 30) {
      const hour = String(Math.floor(minutes / 60) % 24).padStart(2, "0");
      const minute = String(minutes % 60).padStart(2, "0");
      const time = `${hour}:${minute}`;
      bookingTime.add(new Option(`${time} hs`, time));
    }
  };

  const updateSummary = () => {
    const guests = Number(bookingGuests.value) || 0;
    const currency = bookingCurrency.value;
    const totalARS = basePriceARS * guests;
    const summaryDate = document.getElementById("summary-date");
    const summaryTime = document.getElementById("summary-time");

    document.getElementById("summary-stop").textContent = `${stopNumber}. ${stopShort}`;
    summaryDate.textContent = formattedDate(bookingDate.value);
    summaryTime.textContent = bookingTime.value ? `${bookingTime.value} hs` : "A confirmar";
    document.getElementById("summary-guests").textContent = `${guests || 0} ${guests === 1 ? "persona" : "personas"}`;

    if (currency === "USD") {
      exchangeDetails.classList.remove("hidden");
      document.getElementById("summary-currency-name").textContent = "Dólares estadounidenses";
      if (exchangeRate) {
        document.getElementById("summary-unit-price").textContent = `${formatMoney(basePriceARS / exchangeRate, "USD", 4)} por persona`;
        document.getElementById("summary-total").textContent = formatMoney(totalARS / exchangeRate, "USD");
        exchangeRateText.textContent = `Tipo de cambio oficial venta: 1 USD = ${formatMoney(exchangeRate, "ARS")}.`;
        exchangeDateText.textContent = `Fecha de referencia: ${exchangeReferenceDate}`;
      } else {
        document.getElementById("summary-unit-price").textContent = "Cotización pendiente";
        document.getElementById("summary-total").textContent = "Cotización pendiente";
        exchangeRateText.textContent = exchangeLoadFailed ? "No pudimos obtener la cotización. Probá nuevamente más tarde o seleccioná ARS." : "Consultando cotización oficial...";
        exchangeDateText.textContent = "El pago en USD queda deshabilitado hasta contar con una cotización vigente.";
      }
    } else {
      exchangeDetails.classList.add("hidden");
      document.getElementById("summary-currency-name").textContent = "Pesos argentinos";
      document.getElementById("summary-unit-price").textContent = `${formatMoney(basePriceARS, "ARS")} por persona`;
      document.getElementById("summary-total").textContent = formatMoney(totalARS, "ARS");
    }
  };

  const validateField = (name) => {
    const field = bookingForm.elements[name];
    const value = field.value.trim();
    let error = "";

    if (name === "name") {
      if (!value) error = "Ingresá tu nombre completo.";
      else if (/\p{N}/u.test(value)) error = "El nombre no puede contener números.";
      else if (value.length < 5 || !/^[\p{L}][\p{L}\p{M}'’.-]*(?:\s+[\p{L}][\p{L}\p{M}'’.-]*)+$/u.test(value)) error = "Ingresá nombre y apellido usando letras.";
    }
    if (name === "email") {
      if (!value) error = "Ingresá tu correo electrónico.";
      else if (field.validity.typeMismatch) error = "Ingresá un correo electrónico válido.";
    }
    if (name === "date") {
      if (!value) error = "Seleccioná la fecha de visita.";
      else if (value < todayLocal()) error = "La fecha no puede ser anterior a hoy.";
      else {
        const [year, month, day] = value.split("-").map(Number);
        if (new Date(year, month - 1, day).getDay() === 1) error = "Este local permanece cerrado los lunes.";
      }
    }
    if (name === "time") {
      if (!bookingDate.value) error = "Primero elegí una fecha disponible.";
      else if (!field.value) error = "Seleccioná un horario disponible.";
      else if (bookingDate.value === todayLocal()) {
        const [hour, minute] = field.value.split(":").map(Number);
        const selectedTime = new Date();
        selectedTime.setHours(hour, minute, 0, 0);
        if (selectedTime <= new Date()) error = "Elegí un horario posterior a la hora actual.";
      }
    }
    if (name === "guests") {
      const guests = Number(field.value);
      if (!field.value || !Number.isInteger(guests) || guests < 1 || guests > 15) error = "La cantidad debe ser un número entero entre 1 y 15.";
    }
    if (name === "currency") {
      if (!['ARS', 'USD'].includes(field.value)) error = "Seleccioná pesos argentinos o dólares estadounidenses.";
      else if (field.value === "USD" && !exchangeRate) error = exchangeLoadFailed ? "No hay cotización disponible; seleccioná ARS para continuar." : "Esperá a que se cargue la cotización oficial para pagar en USD.";
    }

    field.setAttribute("aria-invalid", String(Boolean(error)));
    errors.get(name).textContent = error;
    return !error;
  };

  const validateAll = () => fieldNames.map(validateField).every(Boolean);

  const loadExchangeRate = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch("https://dolarapi.com/v1/dolares/oficial", { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error("No se pudo consultar DolarApi.");
      const quote = await response.json();
      const rate = Number(quote.venta);
      if (!Number.isFinite(rate) || rate <= 0 || !quote.fechaActualizacion) throw new Error("La cotización recibida no es válida.");

      exchangeRate = rate;
      exchangeReferenceDate = new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(quote.fechaActualizacion));
      exchangeLoadFailed = false;
      if (bookingCurrency.value === "USD") validateField("currency");
    } catch (error) {
      exchangeLoadFailed = true;
      if (bookingCurrency.value === "USD") validateField("currency");
    } finally {
      clearTimeout(timeoutId);
    }
    updateSummary();
  };

  bookingDate.addEventListener("change", () => {
    populateTimeOptions();
    validateField("date");
    if (bookingForm.elements.time.value || bookingForm.elements.time.getAttribute("aria-invalid") === "true") {
      validateField("time");
    }
    updateSummary();
  });

  bookingTime.addEventListener("change", () => {
    validateField("time");
    updateSummary();
  });

  bookingGuests.addEventListener("input", () => {
    updateSummary();
    if (bookingGuests.getAttribute("aria-invalid") === "true") validateField("guests");
  });

  bookingCurrency.addEventListener("change", () => {
    validateField("currency");
    updateSummary();
  });

  ["name", "email"].forEach((name) => {
    const field = bookingForm.elements[name];
    field.addEventListener("blur", () => validateField(name));
    field.addEventListener("input", () => {
      bookingStatus.textContent = "";
      if (field.getAttribute("aria-invalid") === "true") validateField(name);
    });
  });

  bookingForm.addEventListener("input", () => {
    bookingStatus.textContent = "";
  });

  bookingForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateAll()) {
      bookingStatus.textContent = "Revisá los campos marcados antes de continuar.";
      bookingStatus.className = "mt-3 text-center text-sm text-red-200";
      bookingForm.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    const amount = document.getElementById("summary-total").textContent;
    bookingStatus.textContent = `Solicitud validada para ${stopShort}, el ${formattedDate(bookingDate.value)} a las ${bookingTime.value} hs. Total: ${amount}.`;
    bookingStatus.className = "mt-3 text-center text-sm font-medium text-green-800";
  });

  populateTimeOptions();
  updateSummary();
  loadExchangeRate();
}
