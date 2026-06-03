(function () {
  const body = document.body;
  const navToggle = document.querySelector("[data-nav-toggle]");
  const navMenu = document.querySelector("[data-nav-menu]");

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

  function setupForms() {
    document.querySelectorAll("form[data-success]").forEach((form) => {
      const status = form.querySelector("[data-form-status]");

      form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }

        if (status) {
          status.textContent = form.dataset.success || "Thank you. Our engineering team will contact you shortly.";
        }
        form.reset();
      });
    });
  }

  function setupQuotePrefill() {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    const product = params.get("product");
    const categoryField = document.querySelector("[data-category-field]");
    const productField = document.querySelector("[data-product-field]");
    const contactMessage = document.querySelector('textarea[name="message"]');

    if (category && categoryField) {
      categoryField.value = category;
    }

    if (product && productField) {
      productField.value = product;
    }

    if (product && contactMessage && !contactMessage.value) {
      contactMessage.value = `I would like to inquire about: ${product}`;
    }
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
  setupForms();
  setupQuotePrefill();
  setupProductFiltering();
})();
