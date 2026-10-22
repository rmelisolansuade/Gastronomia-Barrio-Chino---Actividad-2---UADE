const proposalForm = document.getElementById("proposal-form");

if (proposalForm) {
  const formFields = [...proposalForm.querySelectorAll("input, textarea")];
  const description = document.getElementById("proposal-description");
  const descriptionCount = document.getElementById("description-count");
  const proposalStatus = document.getElementById("proposal-status");
  const validatedFields = new Set();

  const getFieldError = (field) => {
    const value = field.value.trim();

    if (!value) return "Este campo es obligatorio.";

    if (field.validity.typeMismatch) return "Ingresá un correo electrónico válido (ejemplo@dominio.com).";

    if (field.name === "name") {
      if (/\p{N}/u.test(value)) return "El nombre y apellido no pueden contener números.";
      const words = value.split(/\s+/);
      if (words.length < 2) return "Ingresá tu nombre y apellido.";
      if (!/^[\p{L}][\p{L}\p{M}'’.-]*(?:\s+[\p{L}][\p{L}\p{M}'’.-]*)+$/u.test(value)) {
        return "Usá solo letras, espacios, apóstrofes, puntos o guiones.";
      }
    }

    if (field.name === "address" && !/\p{L}/u.test(value)) {
      return "La dirección debe incluir letras y números.";
    }

    if (field.name === "description") {
      if (!/^[\p{L}\p{M}\p{N}\s.,;:!?¿¡'’“”()\-–—/&%+#]+$/u.test(value)) {
        return "La descripción contiene caracteres no permitidos. Usá texto y puntuación común.";
      }
      if (!/\p{L}/u.test(value)) return "La descripción debe incluir texto, no solo símbolos o números.";
      const words = value.match(/[\p{L}\p{N}]+/gu) ?? [];
      if (words.length < 3) return "Describí el lugar con al menos 3 palabras.";
    }

    if (field.minLength > 0 && value.length < field.minLength) {
      return `Ingresá al menos ${field.minLength} caracteres.`;
    }
    
    if (field.maxLength > 0 && field.value.length > field.maxLength) {
      return `No superes los ${field.maxLength} caracteres.`;
    }

    return "";
  };

  const validateField = (field) => {
    const error = getFieldError(field);
    const errorMessage = document.getElementById(`${field.id}-error`);

    field.setAttribute("aria-invalid", String(Boolean(error)));
    errorMessage.textContent = error;
    return !error;
  };

  formFields.forEach((field) => {
    field.addEventListener("blur", () => {
      validatedFields.add(field);
      validateField(field);
    });

    field.addEventListener("input", () => {
      proposalStatus.textContent = "";
      if (validatedFields.has(field)) validateField(field);
      if (field === description) {
        descriptionCount.textContent = `${description.value.length}/500`;
      }
    });
  });

  proposalForm.addEventListener("submit", (event) => {
    event.preventDefault();
    validatedFields.clear();
    formFields.forEach((field) => validatedFields.add(field));

    const isFormValid = formFields.map(validateField).every(Boolean);
    if (!isFormValid) {
      proposalStatus.textContent = "Revisá los campos marcados antes de enviar.";
      proposalStatus.className = "mt-3 text-center text-sm text-red-800";
      proposalForm.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    proposalStatus.textContent = "¡Gracias! La propuesta está validada.";
    proposalStatus.className = "mt-3 text-center text-sm font-medium text-green-800";
    proposalForm.reset();
    formFields.forEach((field) => {
      field.removeAttribute("aria-invalid");
      validatedFields.delete(field);
    });
    descriptionCount.textContent = "0/500";
  });
}