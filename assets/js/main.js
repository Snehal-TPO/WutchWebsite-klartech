(function () {
  const body = document.body;
  const navToggle = document.querySelector("[data-nav-toggle]");
  const navMenu = document.querySelector("[data-nav-menu]");
  const successMessage = "Thanks for your interest in our product. We\u2019ll get back to you soon.";

  function setActiveNavigation() {
    const currentPage = body.dataset.page;
    if (!currentPage) return;

    document.querySelectorAll("[data-nav-link]").forEach((link) => {
      if (link.dataset.navLink === currentPage) {
        link.setAttribute("aria-current", "page");
      }
    });
  }

  function setupMobileNavigation() {
    if (!navToggle || !navMenu) return;

    navToggle.addEventListener("click", () => {
      const isOpen = navMenu.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    navMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navMenu.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        navMenu.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  function setStatus(form, message, type) {
    const status = form.querySelector("[data-form-status]");
    if (!status) return;

    status.textContent = message;
    status.classList.toggle("is-error", type === "error");
    status.classList.toggle("is-loading", type === "loading");
  }

  function getFieldValue(form, name) {
    return String(new FormData(form).get(name) || "").trim();
  }

  function buildWhatsAppMessage(form) {
    const name = getFieldValue(form, "name");
    const phone = getFieldValue(form, "phone");
    const email = getFieldValue(form, "email");
    const product = getFieldValue(form, "product_selected");
    const message = getFieldValue(form, "message");

    return [
      "New product inquiry from Wucht Electronics website",
      "",
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Email: ${email}`,
      `Product: ${product}`,
      "",
      `Message: ${message}`,
    ].join("\n");
  }

  function getWhatsAppUrl(form) {
    const businessNumber = form.dataset.whatsappNumber || "919421556284";
    return `https://wa.me/${businessNumber}?text=${encodeURIComponent(buildWhatsAppMessage(form))}`;
  }

  async function submitToWeb3Forms(form, allowCcEmail) {
    const payload = new FormData(form);

    if (!allowCcEmail) {
      payload.delete("ccemail");
    }

    const response = await fetch(form.action, {
      method: "POST",
      body: payload,
      headers: { Accept: "application/json" },
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to send inquiry.");
    }

    return result;
  }

  function setupInquiryForms() {
    document.querySelectorAll("[data-inquiry-form]").forEach((form) => {
      const submitButton = form.querySelector('button[type="submit"]');
      const whatsappButton = form.querySelector("[data-whatsapp-inquiry]");

      async function handleInquirySubmit(event) {
        event.preventDefault();

        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }

        const accessKey = form.querySelector("[data-web3forms-key]");
        if (!accessKey || !/^[0-9a-f-]{36}$/i.test(accessKey.value)) {
          setStatus(form, "Add your Web3Forms access key before publishing this form.", "error");
          return;
        }

        setStatus(form, "Sending inquiry...", "loading");
        if (submitButton) submitButton.disabled = true;

        try {
          try {
            await submitToWeb3Forms(form, true);
          } catch (error) {
            const ccMayBeBlocked = /cc|carbon|copy|pro|premium|plan|feature/i.test(error.message);
            if (!ccMayBeBlocked) {
              throw error;
            }

            await submitToWeb3Forms(form, false);
          }

          form.reset();
          setStatus(form, form.dataset.success || successMessage, "success");
        } catch (error) {
          setStatus(form, `We could not send the inquiry right now. ${error.message} Please try WhatsApp or email.`, "error");
        } finally {
          if (submitButton) submitButton.disabled = false;
        }
      }

      form.addEventListener("submit", handleInquirySubmit);

      if (submitButton) {
        submitButton.addEventListener("click", handleInquirySubmit);
      }

      if (whatsappButton) {
        const updateWhatsAppLink = () => {
          whatsappButton.setAttribute("href", getWhatsAppUrl(form));
        };

        form.addEventListener("input", updateWhatsAppLink);
        form.addEventListener("change", updateWhatsAppLink);
        updateWhatsAppLink();

        whatsappButton.addEventListener("click", (event) => {
          if (!form.checkValidity()) {
            event.preventDefault();
            form.reportValidity();
            return;
          }

          updateWhatsAppLink();
        });
      }
    });
  }

  function setupQuotePrefill() {
    const params = new URLSearchParams(window.location.search);
    const product = params.get("product");
    const productFields = document.querySelectorAll("[data-product-field]");

    if (!product || !productFields.length) return;

    productFields.forEach((field) => {
      const matchingOption = Array.from(field.options || []).find((option) => option.value === product);

      if (matchingOption) {
        field.value = product;
        return;
      }

      if (field.tagName === "SELECT") {
        const customOption = new Option(product, product);
        field.add(customOption);
        field.value = product;
      } else {
        field.value = product;
      }
    });
  }

  function setupProductFiltering() {
    const search = document.querySelector("[data-product-search]");
    const cards = Array.from(document.querySelectorAll("[data-product-card]"));
    const tabs = Array.from(document.querySelectorAll("[data-filter]"));
    const noResults = document.querySelector("[data-no-results]");
    const sections = Array.from(document.querySelectorAll("[data-product-section]"));

    if (!cards.length) return;

    let activeCategory = "all";

    function applyFilters() {
      const query = search ? search.value.trim().toLowerCase() : "";
      let visibleCount = 0;

      cards.forEach((card) => {
        const categoryMatch = activeCategory === "all" || card.dataset.category === activeCategory;
        const haystack = `${card.dataset.search || ""} ${card.textContent || ""}`.toLowerCase();
        const searchMatch = !query || haystack.includes(query);
        const isVisible = categoryMatch && searchMatch;
        card.hidden = !isVisible;
        if (isVisible) visibleCount += 1;
      });

      sections.forEach((section) => {
        const sectionHasVisibleCards = Array.from(section.querySelectorAll("[data-product-card]")).some((card) => !card.hidden);
        section.hidden = !sectionHasVisibleCards;
      });

      if (noResults) {
        noResults.hidden = visibleCount !== 0;
      }
    }

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((item) => item.classList.remove("is-active"));
        tab.classList.add("is-active");
        activeCategory = tab.dataset.filter || "all";
        applyFilters();
      });
    });

    if (search) {
      search.addEventListener("input", applyFilters);
    }
  }

  setActiveNavigation();
  setupMobileNavigation();
  setupQuotePrefill();
  setupInquiryForms();
  setupProductFiltering();
})();
