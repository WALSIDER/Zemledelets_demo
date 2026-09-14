const TOKEN_KEY = "zemledelets_token";
const THEME_KEY = "zemledelets_theme";
const LANGUAGE_KEY = "zemledelets_language";
const DASHBOARD_TAB_KEY = "zemledelets_dashboard_tab";
const DASHBOARD_COMPANY_KEY = "zemledelets_company_profile";
const MAX_COMPANY_DOCUMENTS = 10;
const LIGHT_THEME = "light";
const DARK_THEME = "dark";
const DEFAULT_LANGUAGE = "ru";
const NEWS_REFRESH_INTERVAL_MS = 30 * 60 * 1000;
const COMPANY_CATEGORY_OPTIONS = [
  "Зерно и аналитика",
  "Масличные культуры",
  "Семена",
  "Удобрения",
  "Средства защиты растений",
  "Сельхозтехника",
  "Запчасти и сервис",
  "Логистика",
  "Хранение и элеваторы",
  "Переработка",
  "Животноводство",
  "Корма и добавки",
  "Финансы и страхование",
  "Агроконсалтинг",
  "Экспорт и трейдинг"
];
const RUSSIAN_REGION_OPTIONS = [
  "Алтайский край",
  "Амурская область",
  "Архангельская область",
  "Астраханская область",
  "Белгородская область",
  "Брянская область",
  "Владимирская область",
  "Волгоградская область",
  "Вологодская область",
  "Воронежская область",
  "Донецкая Народная Республика",
  "Еврейская автономная область",
  "Забайкальский край",
  "Запорожская область",
  "Ивановская область",
  "Иркутская область",
  "Кабардино-Балкарская Республика",
  "Калининградская область",
  "Калужская область",
  "Камчатский край",
  "Карачаево-Черкесская Республика",
  "Кемеровская область — Кузбасс",
  "Кировская область",
  "Костромская область",
  "Краснодарский край",
  "Красноярский край",
  "Курганская область",
  "Курская область",
  "Ленинградская область",
  "Липецкая область",
  "Луганская Народная Республика",
  "Магаданская область",
  "Москва",
  "Московская область",
  "Мурманская область",
  "Ненецкий автономный округ",
  "Нижегородская область",
  "Новгородская область",
  "Новосибирская область",
  "Омская область",
  "Оренбургская область",
  "Орловская область",
  "Пензенская область",
  "Пермский край",
  "Приморский край",
  "Псковская область",
  "Республика Адыгея",
  "Республика Алтай",
  "Республика Башкортостан",
  "Республика Бурятия",
  "Республика Дагестан",
  "Республика Ингуретия",
  "Республика Калмыкия",
  "Республика Карелия",
  "Республика Коми",
  "Республика Крым",
  "Республика Марий Эл",
  "Республика Мордовия",
  "Республика Саха (Якутия)",
  "Республика Северная Осетия — Алания",
  "Республика Татарстан",
  "Республика Тыва",
  "Республика Хакасия",
  "Ростовская область",
  "Рязанская область",
  "Самарская область",
  "Санкт-Петербург",
  "Саратовская область",
  "Сахалинская область",
  "Свердловская область",
  "Севастополь",
  "Смоленская область",
  "Ставропольский край",
  "Тамбовская область",
  "Тверская область",
  "Томская область",
  "Тульская область",
  "Тюменская область",
  "Удмуртская Республика",
  "Ульяновская область",
  "Хабаровский край",
  "Ханты-Мансийский автономный округ — Югра",
  "Херсонская область",
  "Челябинская область",
  "Чеченская Республика",
  "Чувашская Республика",
  "Чукотский автономный округ",
  "Ямало-Ненецкий автономный округ",
  "Ярославская область"
];
const state = {
  token: "",
  user: null,
  theme: getStoredTheme(),
  language: getStoredLanguage()
};

applyTheme(state.theme);
applyLanguage(state.language);

document.addEventListener("DOMContentLoaded", () => {
  state.token = localStorage.getItem(TOKEN_KEY) || "";
  bootstrapApp().catch((error) => {
    console.error(error);
  });
});

async function bootstrapApp() {
  await loadSharedHeader();
  await loadSharedFooter();
  mountLanguageControl();
  mountThemeToggle();
  setupHeaderProfileDropdown();
  mountLanguageSettingsPanel();
  setupStickyHeader();
  document.querySelectorAll('a[href="#"]').forEach((link) => {
    link.addEventListener("click", (event) => event.preventDefault());
  });
  await initApp();
}

async function initApp() {
  await hydrateSession();
  await loadCurrentPage();
  hydrateTagTooltips(document);
}

async function hydrateSession() {
  if (!state.token) {
    applyAuthState();
    return;
  }

  try {
    const response = await api("/api/auth/me");
    state.user = response.user;
  } catch {
    clearSession(false);
  }

  applyAuthState();
}

async function loadCurrentPage() {
  const page = getCurrentPage();

  switch (page) {
    case "index.html":
      await loadHomePage();
      return;
    case "auth.html":
      bindAuthForms();
      return;
    case "profile.html":
      await loadProfilePage();
      setupDashboardProfilePage();
      return;
    case "marketplace.html":
      await loadMarketplacePage();
      return;
    case "tenders.html":
      await loadTendersPage();
      return;
    case "companies.html":
      await loadCompaniesPage();
      return;
    case "company-card.html":
      await loadCompanyPage();
      return;
    case "listing-detail.html":
      await loadListingPage();
      return;
    case "news.html":
      await loadNewsPage();
      return;
    case "news-detail.html":
      await loadNewsDetailPage();
      return;
    case "events.html":
      await loadEventsPage();
      return;
    default:
      return;
  }
}

function getCurrentPage() {
  const current = window.location.pathname.split("/").pop();
  return current ? (current.includes(".") ? current : `${current}.html`) : "index.html";
}

function getStoredTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  return savedTheme === DARK_THEME ? DARK_THEME : LIGHT_THEME;
}

function getStoredLanguage() {
  const savedLanguage = localStorage.getItem(LANGUAGE_KEY);
  return savedLanguage === "en" ? "en" : DEFAULT_LANGUAGE;
}

function createMockCompanyDocument(name, content, type = "text/plain") {
  const body = String(content ?? "").trim() || name;
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    type,
    size: body.length,
    url: `data:${type};charset=utf-8,${encodeURIComponent(body)}`
  };
}

function getDefaultCompanyDocuments() {
  return [
    createMockCompanyDocument("Сертификат качества.pdf", "Сертификат качества на партии продовольственной пшеницы. Демонстрационный файл для карточки компании.", "application/pdf"),
    createMockCompanyDocument("Карточка реквизитов.docx", "Карточка реквизитов компании. Демонстрационный файл для публичной карточки компании.", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    createMockCompanyDocument("Прайс-лист поставок.xlsx", "Таблица с базовыми ценами и условиями поставок. Демонстрационный файл для карточки компании.", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
    createMockCompanyDocument("Производственная площадка.webp", "Изображение производственной площадки. Демонстрационный файл для карточки компании.", "image/webp")
  ];
}

function normalizeCompanyDocuments(value) {
  if (Array.isArray(value)) {
    return value
      .filter((entry) => entry && typeof entry === "object")
      .map((entry, index) => ({
        id: typeof entry.id === "string" && entry.id ? entry.id : `doc-${index}-${Date.now()}`,
        name: typeof entry.name === "string" && entry.name.trim() ? entry.name.trim() : `Документ ${index + 1}`,
        type: typeof entry.type === "string" && entry.type ? entry.type : "application/octet-stream",
        size: Number.isFinite(entry.size) ? entry.size : String(entry.url || "").length,
        url: typeof entry.url === "string" ? entry.url : ""
      }))
      .filter((entry) => entry.url)
      .slice(0, MAX_COMPANY_DOCUMENTS);
  }

  if (typeof value === "string" && value.trim()) {
    return [createMockCompanyDocument("Документы компании.txt", value.trim())];
  }

  return [];
}

function getCompanyDocumentExtension(name) {
  const match = String(name || "").trim().match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toUpperCase() : "FILE";
}

function getCompanyDocumentIconClass(name) {
  const extension = getCompanyDocumentExtension(name).toLowerCase();

  if (["pdf"].includes(extension)) {
    return "pdf";
  }
  if (["doc", "docx", "rtf", "txt"].includes(extension)) {
    return "doc";
  }
  if (["xls", "xlsx", "csv"].includes(extension)) {
    return "sheet";
  }
  if (["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(extension)) {
    return "image";
  }
  if (["ppt", "pptx"].includes(extension)) {
    return "slides";
  }
  if (["zip", "rar", "7z"].includes(extension)) {
    return "archive";
  }

  return "file";
}

function getCompanyDocumentIconSrc(name) {
  const iconClass = getCompanyDocumentIconClass(name);

  if (iconClass === "pdf") {
    return "/assets/img/profile/pdf.png";
  }
  if (iconClass === "doc") {
    return "/assets/img/profile/doc.png";
  }
  if (iconClass === "sheet") {
    return "/assets/img/profile/xsl.png";
  }
  if (iconClass === "image") {
    const extension = getCompanyDocumentExtension(name).toLowerCase();
    if (extension === "webp") {
      return "/assets/img/profile/webp.png";
    }
    return "/assets/img/profile/image.png";
  }

  return "/assets/img/profile/document.png";
}

function getCompanyDocumentLabel(name) {
  const normalized = String(name || "").trim();
  if (!normalized) {
    return "Документ";
  }

  return normalized.replace(/\.[a-zA-Z0-9]+$/, "") || normalized;
}

function formatCompanyDocumentSize(size) {
  const safeSize = Number(size) || 0;
  if (safeSize >= 1024 * 1024) {
    return `${(safeSize / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (safeSize >= 1024) {
    return `${Math.round(safeSize / 1024)} KB`;
  }
  return safeSize ? `${safeSize} B` : "Файл";
}

function renderCompanyDocumentTile(entry, options = {}) {
  const { editable = false } = options;
  const extension = getCompanyDocumentExtension(entry.name);
  const label = getCompanyDocumentLabel(entry.name);
  const iconClass = getCompanyDocumentIconClass(entry.name);
  const iconSrc = getCompanyDocumentIconSrc(entry.name);

  return `
    <div class="dashboard_document_item${editable ? " dashboard_document_item--editor" : ""}">
      <a class="dashboard_document_link" href="${escapeHtml(entry.url)}" target="_blank" rel="noopener">
        <span class="dashboard_document_icon_wrap">
          <span class="dashboard_document_icon dashboard_document_icon--${escapeHtml(iconClass)}">
            <img class="dashboard_document_icon_image" src="${escapeHtml(iconSrc)}" alt="" />
          </span>
        </span>
        <span class="dashboard_document_content">
          <span class="dashboard_document_name">${escapeHtml(label)}</span>
          <span class="dashboard_document_caption">.${escapeHtml(extension.toLowerCase())}</span>
        </span>
      </a>
      ${editable ? `
        <button class="dashboard_document_remove" type="button" data-company-document-remove="${escapeHtml(entry.id)}">Убрать</button>
      ` : ""}
    </div>
  `;
}

function getStoredCompanyProfileState() {
  try {
    const raw = localStorage.getItem(DASHBOARD_COMPANY_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return {
      ...parsed,
      documents: normalizeCompanyDocuments(parsed.documents)
    };
  } catch {
    return null;
  }
}

function getCompanyInfoIconSrc(type) {
  const iconMap = {
    phone: "/assets/img/profile/Телефон.png",
    email: "/assets/img/profile/Почта.png",
    site: "/assets/img/profile/Сайт.png",
    director: "/assets/img/profile/Руководитель.png",
    inn: "/assets/img/profile/ИНН.png",
    ogrn: "/assets/img/profile/ОГРН.png",
    address: "/assets/img/profile/Адрес.png"
  };

  return iconMap[type] || "/assets/img/profile/document.png";
}

async function loadSharedHeader() {
  const headerContainer = document.getElementById("site-header");
  if (!headerContainer) {
    return;
  }

  const response = await fetch("/partials/header.html", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load shared header");
  }

  headerContainer.innerHTML = await response.text();
  syncHeaderNavigation();
}

async function loadSharedFooter() {
  const footerContainer = document.getElementById("site-footer");
  if (!footerContainer) {
    return;
  }

  const response = await fetch("/partials/footer.html", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load shared footer");
  }

  footerContainer.innerHTML = await response.text();
}

function syncHeaderNavigation() {
  const currentPage = getCurrentPage();
  const menuLinks = document.querySelectorAll(".menu .menu_li");

  menuLinks.forEach((link) => link.classList.remove("active"));
  document.querySelector(".header_profile_trigger")?.classList.remove("is-active");

  const directMatch = document.querySelector(`.menu > a.menu_li[href="${currentPage}"]`);
  if (directMatch) {
    directMatch.classList.add("active");
    return;
  }

  if (currentPage === "listing-detail.html") {
    const listingContext = getListingPageContext();
    const listingLink = document.querySelector(`.menu > a.menu_li[href="${listingContext.kind === "tenders" ? "tenders.html" : "marketplace.html"}"]`);
    if (listingLink) {
      listingLink.classList.add("active");
      return;
    }
  }

  if (currentPage === "news-detail.html") {
    const newsLink = document.querySelector('.menu > a.menu_li[href="news.html"]');
    if (newsLink) {
      newsLink.classList.add("active");
      return;
    }
  }

  if (["profile.html", "company-card.html", "auth.html"].includes(currentPage)) {
    const profileTrigger = document.querySelector(".header_profile_trigger");
    if (profileTrigger) {
      profileTrigger.classList.add("is-active");
    }
  }
}

function setupHeaderProfileDropdown() {
  const dropdown = document.querySelector(".header_profile_dropdown");
  const trigger = dropdown?.querySelector(".header_profile_trigger");
  if (!dropdown || !trigger || dropdown.dataset.bound === "true") {
    return;
  }

  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    const willOpen = !dropdown.classList.contains("is-open");
    document.querySelectorAll(".header_profile_dropdown.is-open").forEach((item) => {
      item.classList.remove("is-open");
      item.querySelector(".header_profile_trigger")?.setAttribute("aria-expanded", "false");
    });
    dropdown.classList.toggle("is-open", willOpen);
    trigger.setAttribute("aria-expanded", willOpen ? "true" : "false");
  });

  if (!document.body.dataset.headerProfileMenuBound) {
    document.addEventListener("click", () => {
      document.querySelectorAll(".header_profile_dropdown.is-open").forEach((item) => {
        item.classList.remove("is-open");
        item.querySelector(".header_profile_trigger")?.setAttribute("aria-expanded", "false");
      });
    });
    document.body.dataset.headerProfileMenuBound = "true";
  }

  dropdown.dataset.bound = "true";
}

function setupStickyHeader() {
  const headerContainer = document.getElementById("site-header");
  const header = headerContainer?.querySelector("header");
  if (!header) {
    return;
  }

  if (!headerContainer.dataset.stickyBound) {
    window.addEventListener("scroll", updateStickyHeaderState, { passive: true });
    window.addEventListener("resize", refreshStickyHeaderMetrics, { passive: true });
    headerContainer.dataset.stickyBound = "true";
  }

  refreshStickyHeaderMetrics();
}

function refreshStickyHeaderMetrics() {
  const headerContainer = document.getElementById("site-header");
  const header = headerContainer?.querySelector("header");
  if (!headerContainer || !header) {
    return;
  }

  const wasSticky = headerContainer.classList.contains("is-sticky");
  if (wasSticky) {
    headerContainer.classList.remove("is-sticky");
  }

  const fullHeight = header.offsetHeight;
  headerContainer.style.minHeight = `${fullHeight}px`;
  headerContainer.dataset.stickyThreshold = String(Math.max(110, fullHeight - 56));

  if (wasSticky) {
    headerContainer.classList.add("is-sticky");
  }

  updateStickyHeaderState();
}

function updateStickyHeaderState() {
  const headerContainer = document.getElementById("site-header");
  if (!headerContainer) {
    return;
  }

  const threshold = Number(headerContainer.dataset.stickyThreshold || 140);
  const shouldStick = window.scrollY > threshold;
  const isSticky = headerContainer.classList.contains("is-sticky");

  if (shouldStick && !isSticky) {
    headerContainer.classList.add("is-sticky");
    headerContainer.classList.remove("sticky-enter");
    void headerContainer.offsetWidth;
    headerContainer.classList.add("sticky-enter");
    window.setTimeout(() => {
      headerContainer.classList.remove("sticky-enter");
    }, 360);
    return;
  }

  if (!shouldStick && isSticky) {
    headerContainer.classList.remove("is-sticky");
  }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  state.theme = theme;
}

function applyLanguage(language) {
  const nextLanguage = language === "en" ? "en" : DEFAULT_LANGUAGE;
  document.documentElement.lang = nextLanguage;
  state.language = nextLanguage;
}

function getHeaderPreferencesContainer() {
  const headerLine = document.querySelector(".second_line");
  if (!headerLine) {
    return null;
  }

  let container = headerLine.querySelector(".header_preferences");
  if (!container) {
    container = document.createElement("div");
    container.className = "header_preferences";
    headerLine.append(container);
  }

  return container;
}

function mountLanguageControl() {
  const preferences = getHeaderPreferencesContainer();
  if (!preferences || preferences.querySelector(".language_control")) {
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "language_control";
  wrapper.innerHTML = `
    <button type="button" class="language_trigger" aria-haspopup="true" aria-expanded="false" aria-label="Язык сайта">
      <span class="language_trigger_flag"></span>
      <span class="language_trigger_arrow">▾</span>
    </button>
    <div class="language_menu" role="menu" aria-label="Язык сайта">
      <button type="button" class="language_option" data-language="ru" role="menuitem" aria-label="Русский" title="Русский">🇷🇺</button>
      <button type="button" class="language_option" data-language="en" role="menuitem" aria-label="English" title="English">🇬🇧</button>
    </div>
  `;

  const trigger = wrapper.querySelector(".language_trigger");
  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    const willOpen = !wrapper.classList.contains("is-open");
    document.querySelectorAll(".language_control.is-open").forEach((item) => {
      item.classList.remove("is-open");
      item.querySelector(".language_trigger")?.setAttribute("aria-expanded", "false");
    });
    wrapper.classList.toggle("is-open", willOpen);
    trigger.setAttribute("aria-expanded", willOpen ? "true" : "false");
  });

  wrapper.querySelectorAll(".language_option").forEach((button) => {
    button.addEventListener("click", () => {
      const nextLanguage = button.dataset.language || DEFAULT_LANGUAGE;
      localStorage.setItem(LANGUAGE_KEY, nextLanguage);
      applyLanguage(nextLanguage);
      wrapper.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
      syncLanguageSelects();
    });
  });

  if (!document.body.dataset.languageMenuBound) {
    document.addEventListener("click", () => {
      document.querySelectorAll(".language_control.is-open").forEach((item) => {
        item.classList.remove("is-open");
        item.querySelector(".language_trigger")?.setAttribute("aria-expanded", "false");
      });
    });
    document.body.dataset.languageMenuBound = "true";
  }

  preferences.append(wrapper);
  syncLanguageSelects();
}

function syncLanguageSelects() {
  document.querySelectorAll(".profile_language_select").forEach((control) => {
    control.value = state.language;
  });

  document.querySelectorAll(".language_option").forEach((button) => {
    const isActive = button.dataset.language === state.language;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  document.querySelectorAll(".language_control").forEach((control) => {
    const flag = control.querySelector(".language_trigger_flag");
    if (flag) {
      flag.textContent = state.language === "en" ? "🇬🇧" : "🇷🇺";
    }
  });
}

function mountLanguageSettingsPanel() {
  const select = document.getElementById("profile-language-select");
  if (!select || select.dataset.bound === "true") {
    syncLanguageSelects();
    return;
  }

  select.value = state.language;
  select.addEventListener("change", () => {
    localStorage.setItem(LANGUAGE_KEY, select.value);
    applyLanguage(select.value);
    syncLanguageSelects();
  });
  select.dataset.bound = "true";
}

function mountThemeToggle() {
  const preferences = getHeaderPreferencesContainer();
  if (!preferences || preferences.querySelector(".theme_toggle")) {
    return;
  }

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "theme_toggle";
  toggle.addEventListener("click", () => {
    const nextTheme = state.theme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
    localStorage.setItem(THEME_KEY, nextTheme);
    applyTheme(nextTheme);
    syncThemeToggle(toggle);
  });

  preferences.append(toggle);
  syncThemeToggle(toggle);
}

function syncThemeToggle(toggle) {
  const isDark = state.theme === DARK_THEME;
  toggle.dataset.theme = state.theme;
  toggle.innerHTML = `<img src="${isDark ? "/assets/img/header/Светлая.png" : "/assets/img/header/Темная.png"}" alt="" />`;
  toggle.setAttribute("aria-label", isDark ? "Переключить на дневную тему" : "Переключить на тёмную тему");
  toggle.title = isDark ? "Дневная тема" : "Тёмная тема";
}

function applyAuthState() {
  const authLinks = document.querySelectorAll('a[href="auth.html"]');
  const profileLinks = document.querySelectorAll('a[href="profile.html"]');
  const headerProfileLinks = document.querySelectorAll("[data-header-profile-link]");
  const headerNotificationLinks = document.querySelectorAll("[data-header-notification-link]");

  authLinks.forEach((link) => {
    if (link.hasAttribute("data-header-notification-link")) {
      return;
    }

    if (!link.dataset.originalText) {
      link.dataset.originalText = link.textContent.trim();
      link.dataset.originalHref = link.getAttribute("href") || "auth.html";
    }

    const keepAsAuthButton = link.id === "header-auth-button";

    if (keepAsAuthButton) {
      link.textContent = link.dataset.originalText;
      link.href = link.dataset.originalHref;
      link.style.display = state.user ? "none" : "";
      delete link.dataset.logoutLink;
      return;
    }

    if (state.user) {
      link.textContent = "Выйти";
      link.dataset.logoutLink = "true";
      link.href = "#logout";
      if (!link.dataset.boundLogout) {
        link.addEventListener("click", (event) => {
          if (link.dataset.logoutLink !== "true") {
            return;
          }
          event.preventDefault();
          clearSession();
          window.location.href = "auth.html";
        });
        link.dataset.boundLogout = "true";
      }
      return;
    }

    link.textContent = link.dataset.originalText;
    link.href = link.dataset.originalHref;
    delete link.dataset.logoutLink;
  });

  profileLinks.forEach((link) => {
    if (link.classList.contains("primary")) {
      link.textContent = "Профиль";
    }
  });

  headerProfileLinks.forEach((link) => {
    link.href = state.user ? "profile.html" : "auth.html";
  });

  headerNotificationLinks.forEach((link) => {
    link.href = state.user ? "profile.html#requests" : "auth.html";
  });

  refreshStickyHeaderMetrics();
}

async function loadHomePage() {
  const stats = document.querySelectorAll("[data-site-stat]");
  const subscribeForm = document.getElementById("subscribe-form");

  try {
    const response = await api("/api/bootstrap");
    stats.forEach((node) => {
      const key = node.dataset.siteStat;
      const value = response.siteMetrics?.[key];
      if (typeof value === "number") {
        node.textContent = formatMetric(value);
      }
    });
  } catch (error) {
    console.error(error);
  }

  if (subscribeForm) {
    subscribeForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const emailInput = subscribeForm.querySelector('input[name="email"]');
      const feedback = document.getElementById("subscribe-feedback");
      const submitButton = subscribeForm.querySelector("button");

      if (!emailInput) {
        return;
      }

      setFeedback(feedback, "Отправляем заявку...", "info");
      submitButton.disabled = true;

      try {
        const response = await api("/api/subscribe", {
          method: "POST",
          body: {
            email: emailInput.value
          }
        });

        setFeedback(feedback, response.message, "success");
        subscribeForm.reset();
      } catch (error) {
        setFeedback(feedback, error.message, "error");
      } finally {
        submitButton.disabled = false;
      }
    });
  }
}

function bindAuthForms() {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  if (state.user) {
    setFeedback(
      document.getElementById("auth-page-feedback"),
      `Вы уже вошли как ${state.user.company.name}. Можно сразу перейти в профиль.`,
      "info"
    );
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const feedback = document.getElementById("login-feedback");
      const submitButton = loginForm.querySelector('button[type="submit"]');
      const payload = {
        email: loginForm.email.value,
        password: loginForm.password.value
      };

      submitButton.disabled = true;
      setFeedback(feedback, "Проверяем данные...", "info");

      try {
        const response = await api("/api/auth/login", {
          method: "POST",
          body: payload
        });

        setSession(response.token, response.user);
        setFeedback(feedback, "Вход выполнен. Перенаправляем в профиль...", "success");
        window.setTimeout(() => {
          window.location.href = "profile.html";
        }, 600);
      } catch (error) {
        setFeedback(feedback, error.message, "error");
      } finally {
        submitButton.disabled = false;
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const feedback = document.getElementById("register-feedback");
      const submitButton = registerForm.querySelector('button[type="submit"]');
      const payload = {
        companyName: registerForm.companyName.value,
        email: registerForm.email.value,
        password: registerForm.password.value,
        description: registerForm.description.value
      };

      submitButton.disabled = true;
      setFeedback(feedback, "Создаём профиль компании...", "info");

      try {
        const response = await api("/api/auth/register", {
          method: "POST",
          body: payload
        });

        setSession(response.token, response.user);
      setFeedback(feedback, "Профиль компании создан. Переходим в кабинет...", "success");
        window.setTimeout(() => {
          window.location.href = "profile.html";
        }, 700);
      } catch (error) {
        setFeedback(feedback, error.message, "error");
      } finally {
        submitButton.disabled = false;
      }
    });
  }
}

async function loadProfilePage() {
  const sidebar = document.getElementById("profile-sidebar");
  const content = document.getElementById("profile-content");

  if (!sidebar || !content) {
    return;
  }

  if (!state.user) {
    sidebar.querySelector("#profile-status-box").innerHTML = "<strong>Требуется вход</strong><br>Войдите, чтобы увидеть данные компании и отклики.";
    content.innerHTML = `
      <h2 class="panel_title">Личный кабинет недоступен</h2>
      <p class="panel_text">После входа здесь будет доступна сводка компании, активные предложения, отклики и быстрые действия для работы на платформе.</p>
      <div class="card_actions">
        <a class="button_main" href="auth.html">Войти</a>
        <a class="button_alt" href="auth.html#register">Создать профиль</a>
      </div>
    `;
    return;
  }

  try {
    const response = await api("/api/profile");
    const { company, stats, activity } = response;
    const statusBox = document.getElementById("profile-status-box");

    if (statusBox) {
      statusBox.innerHTML = `<strong>Статус профиля</strong><br>${escapeHtml(response.status)}`;
    }

    content.innerHTML = `
      <div class="top">
        <h2 class="panel_title" style="margin:0;">${escapeHtml(company.name)}</h2>
        ${company.verified ? '<span class="tag verified">Проверено</span>' : '<span class="tag">На модерации</span>'}
      </div>
      <p class="panel_text">${escapeHtml(company.description)}</p>
      <div class="offer_meta">
        <span>${escapeHtml(company.region)}</span>
        <span>${escapeHtml(company.founded)}</span>
        <span>${escapeHtml(company.activeOffersLabel)}</span>
      </div>
      <div class="stats_row">
        <div class="stat_box"><div class="num">${escapeHtml(String(stats.offers))}</div><p>активных объявлений</p></div>
        <div class="stat_box"><div class="num">${escapeHtml(String(stats.responses))}</div><p>новых откликов</p></div>
        <div class="stat_box"><div class="num">${escapeHtml(String(stats.tenders))}</div><p>активных тендера</p></div>
      </div>
      <div class="card_stack" style="margin-top:24px;">
        ${activity.length ? activity.map((item) => `
          <div class="profile_item">
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.text)}</p>
          </div>
        `).join("") : `
          <div class="profile_item">
            <h3>Пока без активности</h3>
            <p>Разместите первое объявление или тендер, чтобы здесь появились изменения по вашему кабинету.</p>
          </div>
        `}
      </div>
      <div class="card_actions">
        <a class="button_main" href="marketplace.html">Смотреть рынок</a>
        <a class="button_alt" href="tenders.html">Открыть тендеры</a>
        <a class="button_alt" href="company-card.html?slug=${encodeURIComponent(company.slug)}">Карточка компании</a>
      </div>
    `;
  } catch (error) {
    content.innerHTML = `
      <h2 class="panel_title">Не удалось загрузить профиль</h2>
      <p class="panel_text">${escapeHtml(error.message)}</p>
      <div class="card_actions"><a class="button_main" href="auth.html">Войти заново</a></div>
    `;
  }
}

function setupDashboardProfilePage() {
  const tabs = [...document.querySelectorAll("[data-dashboard-tab]")];
  const panels = [...document.querySelectorAll("[data-dashboard-panel]")];
  if (!tabs.length || !panels.length) {
    return;
  }

  const panelNames = new Set(panels.map((panel) => panel.getAttribute("data-dashboard-panel")));
  const storedTab = localStorage.getItem(DASHBOARD_TAB_KEY) || "";
  const hashTab = window.location.hash ? window.location.hash.slice(1) : "";
  const companyPanel = document.querySelector('[data-dashboard-panel="company"]');
  const companyModeSections = companyPanel ? [...companyPanel.querySelectorAll("[data-company-mode]")] : [];
  const companyEditStartButtons = [...document.querySelectorAll("[data-company-edit-start]")];
  const companyEditSaveButton = companyPanel?.querySelector("[data-company-edit-save]") || null;
  const companyEditCancelButton = companyPanel?.querySelector("[data-company-edit-cancel]") || null;
  const companyPublicLink = companyPanel?.querySelector("[data-company-public-link]") || null;
  const companyLogoInput = companyPanel?.querySelector("[data-company-logo-input]") || null;
  const companyLogoFilename = companyPanel?.querySelector("[data-company-logo-filename]") || null;
  const companyLogoDropzone = companyPanel?.querySelector("[data-company-logo-dropzone]") || null;
  const companyCategoryPicker = companyPanel?.querySelector(".dashboard_category_picker") || null;
  const companyCategorySelect = companyPanel?.querySelector("[data-company-category-select]") || null;
  const companyRegionPicker = companyPanel?.querySelector(".dashboard_region_picker") || null;
  const companyRegionSelect = companyPanel?.querySelector("[data-company-region-select]") || null;
  const companyFieldMap = companyPanel
    ? {
        name: companyPanel.querySelector('[data-company-field="name"]'),
        category: companyPanel.querySelector('[data-company-field="category"]'),
        region: companyRegionSelect || companyPanel.querySelector('[data-company-field="region"]'),
        email: companyPanel.querySelector('[data-company-field="email"]'),
        phone: companyPanel.querySelector('[data-company-field="phone"]'),
        site: companyPanel.querySelector('[data-company-field="site"]'),
        director: companyPanel.querySelector('[data-company-field="director"]'),
        inn: companyPanel.querySelector('[data-company-field="inn"]'),
        ogrn: companyPanel.querySelector('[data-company-field="ogrn"]'),
        address: companyPanel.querySelector('[data-company-field="address"]'),
        description: companyPanel.querySelector('[data-company-field="description"]'),
        documents: companyPanel.querySelector('[data-company-field="documents"]')
      }
    : {};
  const companyDisplayMap = {
    name: [...document.querySelectorAll("[data-company-name-display]")],
    description: [...document.querySelectorAll("[data-company-description-display]")],
    category: [...document.querySelectorAll("[data-company-category-display]")],
    region: [...document.querySelectorAll("[data-company-region-display]")],
    email: [...document.querySelectorAll("[data-company-email-display]")],
    phone: [...document.querySelectorAll("[data-company-phone-display]")],
    site: [...document.querySelectorAll("[data-company-site-display]")],
    director: [...document.querySelectorAll("[data-company-director-display]")],
    inn: [...document.querySelectorAll("[data-company-inn-display]")],
    ogrn: [...document.querySelectorAll("[data-company-ogrn-display]")],
    address: [...document.querySelectorAll("[data-company-address-display]")],
    documents: [...document.querySelectorAll("[data-company-documents-display]")]
  };
  const companyLogoDisplays = [...document.querySelectorAll("[data-company-logo-display]")];
  const companyLogoPreview = companyPanel?.querySelector("[data-company-logo-preview]") || null;
  const companyDocumentsDisplayNodes = companyDisplayMap.documents;
  const companyDocumentsEmptyNodes = [];
  let companyDocumentsInput = null;
  let companyDocumentsEditor = null;
  let companyDocumentsEditorEmpty = null;
  let companySavedState = null;
  let companyEditingLogo = null;
  let companyEditingLogoName = "";
  let companyEditingDocuments = [];
  let companyCategoryInput = null;
  let companyCategoryMenu = null;
  let companyRegionInput = null;
  let companyRegionMenu = null;

  const persistCompanyState = (state) => {
    try {
      localStorage.setItem(DASHBOARD_COMPANY_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota / privacy mode failures in mock profile mode.
    }
  };

  const populateCategorySelect = (currentValue, filterText = "") => {
    if (!companyCategorySelect) {
      return;
    }
    const normalizedFilter = normalizeText(filterText || "");
    const filteredOptions = COMPANY_CATEGORY_OPTIONS.filter((value) => !normalizedFilter || normalizeText(value).includes(normalizedFilter));
    const options = currentValue && !filteredOptions.includes(currentValue)
      ? [currentValue, ...filteredOptions]
      : filteredOptions;
    companyCategorySelect.innerHTML = options
      .map((value) => `<option value="${escapeHtml(value)}"${value === currentValue ? " selected" : ""}>${escapeHtml(value)}</option>`)
      .join("");
    if (companyCategoryMenu) {
      companyCategoryMenu.innerHTML = options
        .map((value) => `<button class="dashboard_region_option${value === currentValue ? " active" : ""}" type="button" data-company-category-option="${escapeHtml(value)}">${escapeHtml(value)}</button>`)
        .join("");
    }
    if (companyCategoryInput) {
      companyCategoryInput.value = typeof filterText === "string" ? filterText : (currentValue || "");
    }
  };

  const closeCompanyCategoryDropdown = () => {
    if (companyCategoryPicker) {
      companyCategoryPicker.classList.remove("is-open");
    }
    if (companyCategoryInput) {
      companyCategoryInput.setAttribute("aria-expanded", "false");
    }
    if (companyCategoryMenu) {
      companyCategoryMenu.hidden = true;
    }
  };

  const openCompanyCategoryDropdown = () => {
    if (!companyCategoryPicker || !companyCategoryMenu || !companyCategoryInput) {
      return;
    }
    companyCategoryPicker.classList.add("is-open");
    companyCategoryInput.setAttribute("aria-expanded", "true");
    companyCategoryMenu.hidden = false;
  };

  const buildCompanyCategoryDropdown = () => {
    if (!companyCategoryPicker || !companyCategorySelect) {
      return;
    }
    const legacyInput = companyCategoryPicker.querySelector("[data-company-category-input]");
    if (legacyInput instanceof HTMLInputElement) {
      companyCategoryInput = legacyInput;
      companyCategoryInput.classList.add("dashboard_region_input");
      companyCategoryInput.setAttribute("autocomplete", "off");
      companyCategoryInput.setAttribute("aria-expanded", "false");
    }

    companyCategorySelect.hidden = true;
    companyCategorySelect.tabIndex = -1;

    companyCategoryMenu = document.createElement("div");
    companyCategoryMenu.className = "dashboard_region_menu";
    companyCategoryMenu.dataset.companyCategoryMenu = "";
    companyCategoryMenu.hidden = true;

    companyCategoryPicker.append(companyCategoryMenu);
  };

  const populateRegionSelect = (currentValue, filterText = "") => {
    if (!companyRegionSelect) {
      return;
    }
    const normalizedFilter = normalizeText(filterText || "");
    const filteredOptions = RUSSIAN_REGION_OPTIONS.filter((value) => !normalizedFilter || normalizeText(value).includes(normalizedFilter));
    const options = currentValue && !filteredOptions.includes(currentValue)
      ? [currentValue, ...filteredOptions]
      : filteredOptions;
    companyRegionSelect.innerHTML = options
      .map((value) => `<option value="${escapeHtml(value)}"${value === currentValue ? " selected" : ""}>${escapeHtml(value)}</option>`)
      .join("");
    if (companyRegionMenu) {
      companyRegionMenu.innerHTML = options
        .map((value) => `<button class="dashboard_region_option${value === currentValue ? " active" : ""}" type="button" data-company-region-option="${escapeHtml(value)}">${escapeHtml(value)}</button>`)
        .join("");
    }
    if (companyRegionInput) {
      companyRegionInput.value = typeof filterText === "string" ? filterText : (currentValue || "");
    }
  };

  const closeCompanyRegionDropdown = () => {
    if (companyRegionPicker) {
      companyRegionPicker.classList.remove("is-open");
    }
    if (companyRegionInput) {
      companyRegionInput.setAttribute("aria-expanded", "false");
    }
    if (companyRegionMenu) {
      companyRegionMenu.hidden = true;
    }
  };

  const openCompanyRegionDropdown = () => {
    if (!companyRegionPicker || !companyRegionMenu || !companyRegionInput) {
      return;
    }
    companyRegionPicker.classList.add("is-open");
    companyRegionInput.setAttribute("aria-expanded", "true");
    companyRegionMenu.hidden = false;
  };

  const buildCompanyRegionDropdown = () => {
    if (!companyRegionPicker || !companyRegionSelect) {
      return;
    }
    const legacyInput = companyRegionPicker.querySelector('input[data-company-field="region"]');
    if (legacyInput) {
      companyRegionInput = legacyInput;
      companyRegionInput.classList.add("dashboard_region_input");
      companyRegionInput.hidden = false;
      companyRegionInput.removeAttribute("aria-hidden");
      companyRegionInput.tabIndex = 0;
      companyRegionInput.setAttribute("autocomplete", "off");
      companyRegionInput.setAttribute("aria-expanded", "false");
    }

    companyRegionSelect.hidden = true;
    companyRegionSelect.tabIndex = -1;

    companyRegionMenu = document.createElement("div");
    companyRegionMenu.className = "dashboard_region_menu";
    companyRegionMenu.dataset.companyRegionMenu = "";
    companyRegionMenu.hidden = true;

    companyRegionPicker.append(companyRegionMenu);
  };

  const formatDocumentSize = (size) => {
    const safeSize = Number(size) || 0;
    if (safeSize >= 1024 * 1024) {
      return `${(safeSize / (1024 * 1024)).toFixed(1)} MB`;
    }
    if (safeSize >= 1024) {
      return `${Math.round(safeSize / 1024)} KB`;
    }
    return safeSize ? `${safeSize} B` : "Файл";
  };

  const createCompanyDocumentsUi = () => {
    companyDocumentsDisplayNodes.forEach((node) => {
      node.classList.add("dashboard_document_list");
      node.textContent = "";
      let emptyNode = node.parentElement?.querySelector("[data-company-documents-empty]");
      if (!emptyNode && node.parentElement) {
        emptyNode = document.createElement("p");
        emptyNode.className = "dashboard_documents_empty";
        emptyNode.dataset.companyDocumentsEmpty = "true";
        emptyNode.hidden = true;
        emptyNode.textContent = "Файлы пока не добавлены.";
        node.insertAdjacentElement("afterend", emptyNode);
      }
      if (emptyNode) {
        companyDocumentsEmptyNodes.push(emptyNode);
      }
    });

    const documentsField = companyFieldMap.documents;
    if (!documentsField) {
      return;
    }

    documentsField.hidden = true;

    const editor = document.createElement("div");
    editor.className = "dashboard_document_editor";
    editor.innerHTML = `
      <div class="dashboard_document_editor_head">
        <p>Прикрепляйте документы, которые можно открыть в карточке компании: сертификаты, реквизиты, шаблоны договоров, презентации и кейсы.</p>
        <label class="button_alt dashboard_upload_button" for="company-documents-input">Добавить файлы</label>
        <input id="company-documents-input" type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/png,image/webp,text/plain" hidden />
      </div>
      <div class="dashboard_document_list dashboard_document_list--editor" data-company-documents-editor></div>
      <p class="dashboard_documents_empty" data-company-documents-editor-empty hidden>Файлы пока не добавлены.</p>
    `;
    documentsField.insertAdjacentElement("afterend", editor);

    companyDocumentsInput = editor.querySelector("#company-documents-input");
    companyDocumentsEditor = editor.querySelector("[data-company-documents-editor]");
    companyDocumentsEditorEmpty = editor.querySelector("[data-company-documents-editor-empty]");
  };

  const renderCompanyDocuments = (documents) => {
    const items = normalizeCompanyDocuments(documents);
    const emptyMarkup = !items.length;

    companyDocumentsDisplayNodes.forEach((node) => {
      node.hidden = emptyMarkup;
      node.innerHTML = items.map((entry) => renderCompanyDocumentTile(entry)).join("");
    });

    companyDocumentsEmptyNodes.forEach((node) => {
      node.hidden = !emptyMarkup;
    });
  };

  const renderCompanyDocumentsEditor = (documents) => {
    if (!companyDocumentsEditor || !companyDocumentsEditorEmpty) {
      return;
    }

    const items = normalizeCompanyDocuments(documents);
    companyDocumentsEditor.hidden = !items.length;
    companyDocumentsEditor.innerHTML = items.map((entry) => renderCompanyDocumentTile(entry, { editable: true })).join("");
    companyDocumentsEditorEmpty.hidden = Boolean(items.length);
  };

  const readCompanyDocuments = (files) => Promise.all(
    files.map((file, index) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size || 0,
          url: typeof reader.result === "string" ? reader.result : ""
        });
      };
      reader.readAsDataURL(file);
    }))
  );

  const getCompanyInitials = (name) => {
    const normalized = (name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
    return normalized || "ЛК";
  };

  const renderCompanyLogo = (target, logoUrl, companyName) => {
    if (!target) {
      return;
    }
    const image = target.querySelector("img");
    const fallback = target.querySelector("span");
    if (image) {
      if (logoUrl) {
        image.src = logoUrl;
        image.hidden = false;
      } else {
        image.hidden = true;
        image.removeAttribute("src");
      }
    }
    if (fallback) {
      fallback.textContent = getCompanyInitials(companyName);
      fallback.hidden = Boolean(logoUrl);
    }
    target.classList.toggle("has-image", Boolean(logoUrl));
  };

  const renderCompanyLogoFilename = (label, hasLogo) => {
    if (!companyLogoFilename) {
      return;
    }
    companyLogoFilename.textContent = label || (hasLogo ? "" : "Файл не выбран");
  };

  const applyCompanyLogoFile = (file) => {
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      companyEditingLogo = typeof reader.result === "string" ? reader.result : "";
      companyEditingLogoName = file.name || "";
      renderCompanyLogo(companyLogoPreview, companyEditingLogo, companyFieldMap.name?.value || companySavedState?.name || "");
      renderCompanyLogoFilename(companyEditingLogoName, Boolean(companyEditingLogo));
    };
    reader.readAsDataURL(file);
  };

  const renderCompanyState = (state) => {
    if (!state) {
      return;
    }
    Object.entries(companyDisplayMap).forEach(([key, nodes]) => {
      if (key === "documents") {
        return;
      }
      const nextValue = state[key] || "";
      nodes.forEach((node) => {
        node.textContent = nextValue;
      });
    });
    renderCompanyDocuments(state.documents);
    companyLogoDisplays.forEach((target) => renderCompanyLogo(target, state.logo, state.name));
    renderCompanyLogo(companyLogoPreview, state.logo, state.name);
  };

  const fillCompanyForm = (state) => {
    if (!companyPanel || !state) {
      return;
    }
    Object.entries(companyFieldMap).forEach(([key, field]) => {
      if (field) {
        field.value = key === "documents" ? "" : (state[key] || "");
      }
    });
    populateCategorySelect(state.category || "");
    populateRegionSelect(state.region || "");
    companyEditingLogo = state.logo || "";
    companyEditingLogoName = state.logoName || "";
    companyEditingDocuments = normalizeCompanyDocuments(state.documents);
    renderCompanyDocumentsEditor(companyEditingDocuments);
    renderCompanyLogo(companyLogoPreview, companyEditingLogo, state.name);
    renderCompanyLogoFilename(state.logoName, Boolean(state.logo));
  };

  const readCompanyFormState = () => ({
    name: companyFieldMap.name?.value.trim() || "Название компании",
    category: companyFieldMap.category?.value.trim() || "Категория",
    region: companyFieldMap.region?.value.trim() || "Регион",
    email: companyFieldMap.email?.value.trim() || "E-mail",
    phone: companyFieldMap.phone?.value.trim() || "Телефон",
    site: companyFieldMap.site?.value.trim() || "Сайт компании",
    description: companyFieldMap.description?.value.trim() || "Описание компании",
    documents: companyFieldMap.documents?.value.trim() || "Документы не указаны",
    logo: companyEditingLogo || companySavedState?.logo || ""
  });

  const setCompanyEditMode = (isEditing) => {
    if (!companyPanel || !companyModeSections.length) {
      return;
    }
    companyPanel.classList.toggle("is-editing", isEditing);
    companyModeSections.forEach((section) => {
      const sectionMode = section.getAttribute("data-company-mode");
      const shouldShow = sectionMode === (isEditing ? "edit" : "view");
      section.hidden = !shouldShow;
    });
    companyEditStartButtons.forEach((button) => {
      button.hidden = isEditing;
    });
    if (companyEditSaveButton) {
      companyEditSaveButton.hidden = !isEditing;
    }
    if (companyEditCancelButton) {
      companyEditCancelButton.hidden = !isEditing;
    }
    if (companyPublicLink) {
      companyPublicLink.hidden = isEditing;
    }
    if (isEditing && companySavedState) {
      fillCompanyForm(companySavedState);
    }
  };

  if (companyPanel) {
    createCompanyDocumentsUi();
    buildCompanyCategoryDropdown();
    buildCompanyRegionDropdown();
    const storedCompanyState = getStoredCompanyProfileState();
    companySavedState = {
      ...readCompanyFormState(),
      director: companyFieldMap.director?.value.trim() || "\u0420\u0443\u043a\u043e\u0432\u043e\u0434\u0438\u0442\u0435\u043b\u044c \u043d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d",
      inn: companyFieldMap.inn?.value.trim() || "\u0418\u041d\u041d \u043d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d",
      ogrn: companyFieldMap.ogrn?.value.trim() || "\u041e\u0413\u0420\u041d \u043d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d",
      address: companyFieldMap.address?.value.trim() || "\u0410\u0434\u0440\u0435\u0441 \u043d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d",
      documents: getDefaultCompanyDocuments(),
      ...(storedCompanyState || {})
    };
    fillCompanyForm(companySavedState);
    renderCompanyState(companySavedState);
    setCompanyEditMode(false);

    companyEditStartButtons.forEach((button) => {
      button.addEventListener("click", () => {
        setActiveTab("company", { editCompany: true });
      });
    });

    companyEditCancelButton?.addEventListener("click", () => {
      fillCompanyForm(companySavedState);
      setCompanyEditMode(false);
    });

    companyEditSaveButton?.addEventListener("click", () => {
      companySavedState = {
        ...readCompanyFormState(),
        director: companyFieldMap.director?.value.trim() || "\u0420\u0443\u043a\u043e\u0432\u043e\u0434\u0438\u0442\u0435\u043b\u044c \u043d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d",
        inn: companyFieldMap.inn?.value.trim() || "\u0418\u041d\u041d \u043d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d",
        ogrn: companyFieldMap.ogrn?.value.trim() || "\u041e\u0413\u0420\u041d \u043d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d",
        address: companyFieldMap.address?.value.trim() || "\u0410\u0434\u0440\u0435\u0441 \u043d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d",
        logoName: companyEditingLogoName,
        documents: normalizeCompanyDocuments(companyEditingDocuments)
      };
      persistCompanyState(companySavedState);
      renderCompanyState(companySavedState);
      setCompanyEditMode(false);
    });

    companyLogoInput?.addEventListener("change", (event) => {
      const input = event.currentTarget;
      const file = input instanceof HTMLInputElement ? input.files?.[0] : null;
      if (!file) {
        return;
      }
      applyCompanyLogoFile(file);
    });

    if (companyLogoDropzone) {
      ["dragenter", "dragover"].forEach((eventName) => {
        companyLogoDropzone.addEventListener(eventName, (event) => {
          event.preventDefault();
          companyLogoDropzone.classList.add("is-dragover");
        });
      });

      ["dragleave", "dragend", "drop"].forEach((eventName) => {
        companyLogoDropzone.addEventListener(eventName, (event) => {
          event.preventDefault();
          companyLogoDropzone.classList.remove("is-dragover");
        });
      });

      companyLogoDropzone.addEventListener("drop", (event) => {
        const files = [...(event.dataTransfer?.files || [])];
        const file = files[0];
        if (!file) {
          return;
        }
        applyCompanyLogoFile(file);
        if (companyLogoInput instanceof HTMLInputElement) {
          companyLogoInput.value = "";
        }
      });
    }

    companyDocumentsInput?.addEventListener("change", async (event) => {
      const input = event.currentTarget;
      const files = input instanceof HTMLInputElement ? [...(input.files || [])] : [];
      if (!files.length) {
        return;
      }

      const availableSlots = Math.max(0, MAX_COMPANY_DOCUMENTS - companyEditingDocuments.length);
      if (!availableSlots) {
        window.alert(`Можно прикрепить не больше ${MAX_COMPANY_DOCUMENTS} файлов.`);
        input.value = "";
        return;
      }

      const filesToRead = files.slice(0, availableSlots);
      if (files.length > availableSlots) {
        window.alert(`Можно прикрепить не больше ${MAX_COMPANY_DOCUMENTS} файлов. Лишние файлы не добавлены.`);
      }

      const nextDocuments = await readCompanyDocuments(filesToRead);
      companyEditingDocuments = [...companyEditingDocuments, ...nextDocuments]
        .filter((entry) => entry.url)
        .slice(0, MAX_COMPANY_DOCUMENTS);
      renderCompanyDocumentsEditor(companyEditingDocuments);
      input.value = "";
    });

    companyDocumentsEditor?.addEventListener("click", (event) => {
      const trigger = event.target instanceof HTMLElement ? event.target.closest("[data-company-document-remove]") : null;
      if (!trigger) {
        return;
      }

      const documentId = trigger.getAttribute("data-company-document-remove") || "";
      companyEditingDocuments = companyEditingDocuments.filter((entry) => entry.id !== documentId);
      renderCompanyDocumentsEditor(companyEditingDocuments);
    });

    companyFieldMap.name?.addEventListener("input", () => {
      renderCompanyLogo(companyLogoPreview, companyEditingLogo, companyFieldMap.name?.value || "");
    });

    companyCategorySelect?.addEventListener("change", () => {
      if (companyFieldMap.category) {
        companyFieldMap.category.value = companyCategorySelect.value;
      }
    });

    companyCategoryInput?.addEventListener("focus", () => {
      populateCategorySelect(companyCategorySelect?.value || "", companyCategoryInput?.value || "");
      openCompanyCategoryDropdown();
    });

    companyCategoryInput?.addEventListener("input", () => {
      populateCategorySelect(companyCategorySelect?.value || "", companyCategoryInput?.value || "");
      openCompanyCategoryDropdown();
    });

    companyCategoryInput?.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        companyCategoryInput.value = companyCategorySelect?.value || "";
        closeCompanyCategoryDropdown();
        companyCategoryInput.blur();
      }
    });

    companyCategoryMenu?.addEventListener("click", (event) => {
      const trigger = event.target instanceof HTMLElement ? event.target.closest("[data-company-category-option]") : null;
      if (!trigger || !companyCategorySelect) {
        return;
      }
      const value = trigger.getAttribute("data-company-category-option") || "";
      companyCategorySelect.value = value;
      if (companyFieldMap.category) {
        companyFieldMap.category.value = value;
      }
      populateCategorySelect(value);
      closeCompanyCategoryDropdown();
      companyCategoryInput?.blur();
    });

    companyRegionSelect?.addEventListener("change", () => {
      if (companyFieldMap.region) {
        companyFieldMap.region.value = companyRegionSelect.value;
      }
    });

    companyRegionInput?.addEventListener("focus", () => {
      populateRegionSelect(companyRegionSelect?.value || "", companyRegionInput?.value || "");
      openCompanyRegionDropdown();
    });

    companyRegionInput?.addEventListener("input", () => {
      populateRegionSelect(companyRegionSelect?.value || "", companyRegionInput?.value || "");
      openCompanyRegionDropdown();
    });

    companyRegionInput?.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        companyRegionInput.value = companyRegionSelect?.value || "";
        closeCompanyRegionDropdown();
        companyRegionInput.blur();
      }
    });

    companyRegionMenu?.addEventListener("click", (event) => {
      const trigger = event.target instanceof HTMLElement ? event.target.closest("[data-company-region-option]") : null;
      if (!trigger || !companyRegionSelect) {
        return;
      }
      const value = trigger.getAttribute("data-company-region-option") || "";
      companyRegionSelect.value = value;
      if (companyFieldMap.region) {
        companyFieldMap.region.value = value;
      }
      populateRegionSelect(value);
      closeCompanyRegionDropdown();
      companyRegionInput?.blur();
    });

    document.addEventListener("click", (event) => {
      if (!(event.target instanceof Node)) {
        return;
      }
      if (companyCategoryPicker && !companyCategoryPicker.contains(event.target)) {
        if (companyCategoryInput && companyCategorySelect) {
          companyCategoryInput.value = companyCategorySelect.value || "";
        }
        closeCompanyCategoryDropdown();
      }
      if (!companyRegionPicker) {
        return;
      }
      if (!companyRegionPicker.contains(event.target)) {
        if (companyRegionInput && companyRegionSelect) {
          companyRegionInput.value = companyRegionSelect.value || "";
        }
        closeCompanyRegionDropdown();
      }
    });
  }

  const setActiveTab = (tabName, options = {}) => {
    const target = panelNames.has(tabName) ? tabName : "overview";

    tabs.forEach((tab) => {
      const isActive = tab.getAttribute("data-dashboard-tab") === target;
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    panels.forEach((panel) => {
      const isActive = panel.getAttribute("data-dashboard-panel") === target;
      panel.classList.toggle("active", isActive);
      panel.hidden = !isActive;
    });

    localStorage.setItem(DASHBOARD_TAB_KEY, target);
    if (window.location.hash.slice(1) !== target) {
      history.replaceState(null, "", `${window.location.pathname}#${target}`);
    }

    if (companyPanel && target === "company") {
      setCompanyEditMode(Boolean(options.editCompany));
    }
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      setActiveTab(tab.getAttribute("data-dashboard-tab") || "overview", { editCompany: false });
    });
  });

  document.querySelectorAll("[data-dashboard-open]").forEach((control) => {
    control.addEventListener("click", () => {
      setActiveTab(control.getAttribute("data-dashboard-open") || "overview", {
        editCompany: control.getAttribute("data-dashboard-edit") === "company"
      });
    });
  });

  window.addEventListener("hashchange", () => {
    const nextTab = window.location.hash ? window.location.hash.slice(1) : "overview";
    setActiveTab(nextTab, { editCompany: false });
  });

  setActiveTab(hashTab || storedTab || "overview", { editCompany: false });
}

async function loadMarketplacePage() {
  const container = document.getElementById("marketplace-list");
  const filterPanel = document.getElementById("marketplace-filters");
  const searchInput = document.getElementById("marketplace-search");
  const resultsMeta = document.getElementById("marketplace-results-meta");
  const regionSelect = document.getElementById("marketplace-region");
  const priceSelect = document.getElementById("marketplace-price");
  const verifiedToggle = document.getElementById("marketplace-verified");
  const paginationContainer = document.getElementById("marketplace-pagination");
  if (!container) {
    return;
  }

  container.innerHTML = loadingMarkup("Подбираем актуальные предложения...");

  try {
    const response = await api("/api/marketplace");
    mountFilterableList({
      items: response.items,
      container,
      filterPanel,
      searchInput,
      resultsMeta,
      regionSelect,
      priceSelect,
      verifiedToggle,
      paginationContainer,
      pageSize: 10,
      renderItem: renderOfferCard,
      searchText: getMarketplaceSearchText,
      itemLabel: "предложений",
      emptyTitle: "Подходящих предложений пока нет",
      emptyText: "Измените запрос или сбросьте часть фильтров, чтобы снова показать активные карточки рынка.",
      extraFilter: (item, controls) => {
        const itemRegion = normalizeText(item.company?.region || item.company?.city || "");
        if (controls.region && controls.region !== "all" && itemRegion !== controls.region) {
          return false;
        }

        if (controls.price && controls.price !== "all" && !matchesPriceRange(item.priceLabel, controls.price)) {
          return false;
        }

        if (controls.verifiedOnly && !item.company?.verified) {
          return false;
        }

        return true;
      }
    });
  } catch (error) {
    container.innerHTML = errorMarkup(error.message);
  }
}

async function loadTendersPage() {
  const container = document.getElementById("tenders-list");
  const filterPanel = document.getElementById("tenders-filters");
  const searchInput = document.getElementById("tenders-search");
  const resultsMeta = document.getElementById("tenders-results-meta");
  const regionSelect = document.getElementById("tenders-region");
  const paginationContainer = document.getElementById("tenders-pagination");
  if (!container) {
    return;
  }

  container.innerHTML = loadingMarkup("Собираем активные закупки...");

  try {
    const response = await api("/api/tenders");
    mountFilterableList({
      items: response.items,
      container,
      filterPanel,
      searchInput,
      resultsMeta,
      regionSelect,
      paginationContainer,
      pageSize: 10,
      renderItem: renderTenderCard,
      searchText: getTenderSearchText,
      itemLabel: "закупок",
      emptyTitle: "Подходящих закупок пока нет",
      emptyText: "Попробуйте изменить параметры поиска или снять часть ограничений, чтобы увидеть больше активных тендеров.",
      extraFilter: (item, controls) => {
        const itemRegion = normalizeText(item.company?.region || item.company?.city || "");
        if (controls.region && controls.region !== "all" && itemRegion !== controls.region) {
          return false;
        }

        return true;
      }
    });
  } catch (error) {
    container.innerHTML = errorMarkup(error.message);
  }
}

async function loadCompaniesPage() {
  const container = document.getElementById("companies-list");
  if (!container) {
    return;
  }

  container.setAttribute("aria-busy", "true");
  container.innerHTML = '<div class="enterprise_empty white_card">Открываем каталог компаний…</div>';

  try {
    const response = await api("/api/companies");
    mountCompanyDirectory(response.items);
  } catch (error) {
    container.innerHTML = '<div class="enterprise_empty white_card"><h2>Не удалось загрузить каталог</h2><p>Проверьте соединение и попробуйте ещё раз.</p><button class="button_alt" type="button" data-companies-retry>Повторить</button></div>';
    container.querySelector("[data-companies-retry]").addEventListener("click", loadCompaniesPage);
    container.setAttribute("aria-busy", "false");
    document.getElementById("companies-results-meta").textContent = "Каталог временно недоступен";
  }
}

async function loadCompanyPage() {
  const main = document.getElementById("company-card-main");
  const side = document.getElementById("company-card-side");
  if (!main || !side) {
    return;
  }

  const slug = new URLSearchParams(window.location.search).get("slug") || "chernozem-grain";
  main.innerHTML = loadingMarkup("Готовим карточку компании...");

  try {
    const response = await api(`/api/companies/${encodeURIComponent(slug)}`);
    const offers = response.offers || [];
    const storedCompanyState = slug === "chernozem-grain" ? getStoredCompanyProfileState() : null;
    const companyDocuments = normalizeCompanyDocuments(storedCompanyState?.documents || (slug === "chernozem-grain" ? getDefaultCompanyDocuments() : []));
    const company = storedCompanyState
      ? {
          ...response.company,
          name: storedCompanyState.name || response.company.name,
          description: storedCompanyState.description || response.company.description,
          city: storedCompanyState.region || response.company.city,
          site: storedCompanyState.site || response.company.site,
          director: storedCompanyState.director || response.company.director,
          inn: storedCompanyState.inn || response.company.inn,
          ogrn: storedCompanyState.ogrn || response.company.ogrn,
          address: storedCompanyState.address || response.company.address,
          email: storedCompanyState.email || response.company.email,
          phone: storedCompanyState.phone || response.company.phone
        }
      : response.company;

    document.title = `Земледелецъ — ${company.name}`;

    main.innerHTML = `
      <div class="top">
        <h2 class="panel_title" style="margin:0;">${escapeHtml(company.name)}</h2>
        ${company.verified ? '<span class="tag verified">Проверено</span>' : '<span class="tag">На модерации</span>'}
      </div>
      <p class="panel_text">${escapeHtml(company.description)}</p>
      <div class="offer_meta">
        <span>${escapeHtml(company.city)}</span>
        <span>${escapeHtml(company.founded)}</span>
        <span>${escapeHtml(company.activeOffersLabel)}</span>
      </div>
      <h3 class="panel_title" style="font-size:22px; margin-top:28px;">О компании</h3>
      <p class="panel_text">${escapeHtml(company.about)}</p>
      <div class="dashboard_company_overview_rows company_card_details">
        <div class="dashboard_company_overview_row">
          <span>\u0420\u0443\u043a\u043e\u0432\u043e\u0434\u0438\u0442\u0435\u043b\u044c</span>
          <strong>${escapeHtml(company.director || "\u041d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d")}</strong>
        </div>
        <div class="dashboard_company_overview_row">
          <span>\u0418\u041d\u041d</span>
          <strong>${escapeHtml(company.inn || "\u041d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d")}</strong>
        </div>
        <div class="dashboard_company_overview_row">
          <span>\u041e\u0413\u0420\u041d</span>
          <strong>${escapeHtml(company.ogrn || "\u041d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d")}</strong>
        </div>
        <div class="dashboard_company_overview_row">
          <span>\u0421\u0430\u0439\u0442</span>
          <strong>${escapeHtml(company.site || "\u041d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d")}</strong>
        </div>
        <div class="dashboard_company_overview_row">
          <span>\u042e\u0440\u0438\u0434\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0430\u0434\u0440\u0435\u0441</span>
          <strong>${escapeHtml(company.address || "\u041d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d")}</strong>
        </div>
      </div>
      ${companyDocuments.length ? `
        <h3 class="panel_title" style="font-size:22px; margin-top:28px;">Документы и доверие</h3>
        <div class="dashboard_document_list company_documents_block">
          ${companyDocuments.map((entry) => renderCompanyDocumentTile(entry)).join("")}
        </div>
      ` : ""}
      <h3 class="panel_title" style="font-size:22px; margin-top:28px;">Активные предложения</h3>
      <div class="offer_list">
        ${offers.length ? offers.map((item) => `
          <div class="offer_item">
            <div class="top"><h3>${escapeHtml(item.title)}</h3><strong>${escapeHtml(item.priceLabel)}</strong></div>
            <p>${escapeHtml(item.summary)}</p>
          </div>
        `).join("") : `
          <div class="offer_item">
            <div class="top"><h3>Предложения ещё не опубликованы</h3><strong>0</strong></div>
            <p>Карточка компании уже доступна для деловых обращений. Первое предложение можно разместить в любой удобный момент.</p>
          </div>
        `}
      </div>
    `;

    side.innerHTML = `
      <h2 class="panel_title">Быстрая связь</h2>
      <p class="panel_text">Контакты, специализация и ключевая информация о компании собраны в одном блоке для быстрого делового обращения.</p>
      <div class="mini_box mini_box--icon"><div class="mini_box_label"><img class="mini_box_icon" src="${escapeHtml(getCompanyInfoIconSrc("phone"))}" alt="" /><strong>Телефон</strong></div><span>${escapeHtml(company.phone)}</span></div>
      <div class="mini_box mini_box--icon"><div class="mini_box_label"><img class="mini_box_icon" src="${escapeHtml(getCompanyInfoIconSrc("email"))}" alt="" /><strong>E-mail</strong></div><span>${escapeHtml(company.email)}</span></div>
      <div class="mini_box mini_box--icon"><div class="mini_box_label"><img class="mini_box_icon" src="${escapeHtml(getCompanyInfoIconSrc("site"))}" alt="" /><strong>\u0421\u0430\u0439\u0442</strong></div><span>${escapeHtml(company.site || "\u041d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d")}</span></div>
      <div class="mini_box mini_box--icon"><div class="mini_box_label"><img class="mini_box_icon" src="${escapeHtml(getCompanyInfoIconSrc("inn"))}" alt="" /><strong>\u0418\u041d\u041d</strong></div><span>${escapeHtml(company.inn || "\u041d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d")}</span></div>
      <div class="mini_box"><strong>Менеджер</strong><br>${escapeHtml(company.managerHours)}</div>
      <div class="mini_box"><strong>Специализация</strong><br>${escapeHtml(company.specialties.join(", "))}</div>
      <div class="card_actions">
        <a class="button_main" href="${state.user ? "profile.html" : "auth.html"}">Отправить запрос</a>
        <a class="button_alt" href="marketplace.html">К предложениям</a>
      </div>
    `;
  } catch (error) {
    main.innerHTML = errorMarkup(error.message);
    side.innerHTML = `
      <h2 class="panel_title">Карточка недоступна</h2>
      <p class="panel_text">${escapeHtml(error.message)}</p>
    `;
  }
}

async function loadListingPage() {
  const main = document.getElementById("listing-detail-main");
  if (!main) {
    return;
  }

  const context = getListingPageContext();
  if (!context.id) {
    main.innerHTML = errorMarkup("Не удалось определить карточку. Вернитесь в список и откройте предложение заново.");
    return;
  }

  main.innerHTML = loadingMarkup("Открываем карточку...");

  try {
    const item = await fetchListingItem(context.kind, context.id);
    const company = item.company || {};
    const typeTagClass = getTagClass(item.type);
    const categoryTagClass = getTagClass(item.category);
    const valueLabel = getListingValueLabel(item, context.kind);
    const valueCaption = context.kind === "tenders" ? "Срок приема предложений" : "Цена";
    const detailParagraphs = buildListingDetailParagraphs(item, company, context.kind);
    const detailItems = buildListingInfoItems(item, company, context.kind);
    const coverImage = getListingCoverImage(item, context.kind);
    const relatedHref = context.kind === "tenders" ? "tenders.html" : "marketplace.html";
    const companyHref = `company-card.html?slug=${encodeURIComponent(company.slug || "")}`;
    const actionHref = state.user ? "profile.html" : "auth.html";

    document.title = `Земледелецъ — ${item.title}`;

    main.innerHTML = `
      <div class="listing_hero">
        <div class="listing_cover">
          <img src="${escapeHtml(coverImage.src)}" alt="${escapeHtml(coverImage.alt)}" />
        </div>
        <div class="listing_intro">
          <div class="listing_tags">
            <span class="tag ${typeTagClass}">${escapeHtml(item.type)}</span>
            <span class="tag ${categoryTagClass}">${escapeHtml(item.category)}</span>
            <span class="tag infrastructure">${escapeHtml(company.region || company.city || "Регион уточняется")}</span>
          </div>
          <div class="listing_headline">
            <div>
              <h2 class="panel_title">${escapeHtml(item.title)}</h2>
              <p class="panel_text">${escapeHtml(item.summary)}</p>
            </div>
            <div class="listing_value_column">
              <div class="listing_value_card">
                <span class="listing_value_label">${valueCaption}</span>
                <strong class="listing_value">${escapeHtml(valueLabel)}</strong>
              </div>
              <div class="listing_value_actions">
                <a class="button_main" href="${actionHref}">${escapeHtml(item.ctaLabel || "Откликнуться")}</a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="listing_section">
        <h3 class="panel_title">Описание</h3>
        ${detailParagraphs.map((paragraph) => `<p class="panel_text">${escapeHtml(paragraph)}</p>`).join("")}
      </div>
      <div class="listing_section">
        <h3 class="panel_title">Ключевая информация</h3>
        <div class="listing_info_grid">
          ${detailItems.map((entry) => `
            <div class="listing_info_item">
              <span class="listing_info_label">${escapeHtml(entry.label)}</span>
              <strong class="listing_info_value">${escapeHtml(entry.value)}</strong>
            </div>
          `).join("")}
        </div>
      </div>
      <div class="listing_section">
        <h3 class="panel_title">Компания-инициатор</h3>
        <div class="listing_company_card card_link_surface" data-href="${companyHref}" tabindex="0" role="link" aria-label="Открыть компанию: ${escapeHtml(company.name || "Компания")}">
          <div class="listing_company_row">
            <a class="listing_company_link" href="${companyHref}">${escapeHtml(company.name || "Карточка компании")}</a>
            ${company.verified ? '<span class="tag verified">Проверено</span>' : '<span class="tag moderation">На модерации</span>'}
          </div>
          <p class="panel_text">${escapeHtml(company.description || "В карточке компании собраны специализация, контакты и активные направления работы.")}</p>
          <div class="listing_company_meta">
            <span>${escapeHtml(company.region || company.city || "Регион уточняется")}</span>
            <span>${escapeHtml(company.founded || "Год основания уточняется")}</span>
            <span>${escapeHtml(company.activeOffersLabel || "Компания на площадке")}</span>
          </div>
          <div class="card_actions">
            <a class="button_main" href="${actionHref}">Связаться</a>
          </div>
        </div>
        <div class="card_actions">
          <a class="button_alt" href="${relatedHref}">Назад к списку</a>
        </div>
      </div>
    `;
    bindLinkedCards(main);
  } catch (error) {
    main.innerHTML = errorMarkup(error.message);
  }
}

async function fetchListingItem(kind, id) {
  try {
    const response = await api(`/api/${kind}/${encodeURIComponent(id)}`);
    if (response?.item) {
      return response.item;
    }
  } catch (error) {
    const fallbackResponse = await api(`/api/${kind}`);
    const fallbackItem = (fallbackResponse.items || []).find((entry) => entry.id === id);
    if (fallbackItem) {
      return fallbackItem;
    }

    throw error;
  }

  throw new Error("Карточка не найдена.");
}

async function loadNewsPage() {
  const container = document.getElementById("news-list");
  const filterPanel = document.getElementById("news-filters");
  const searchInput = document.getElementById("news-search");
  const resultsMeta = document.getElementById("news-results-meta");
  const paginationContainer = document.getElementById("news-pagination");
  if (!container) {
    return;
  }

  container.innerHTML = loadingMarkup("Подбираем свежие материалы...");

  try {
    const renderNewsFeed = async () => {
      const response = await api("/api/news");
      mountFilterableList({
        items: response.items,
        container,
        filterPanel,
        searchInput,
        resultsMeta,
        paginationContainer,
        pageSize: 10,
        renderItem: renderNewsCard,
        searchText: getNewsSearchText,
        itemLabel: "материалов",
        emptyTitle: "Подходящих материалов пока нет",
        emptyText: "Измените запрос или сбросьте часть фильтров, чтобы снова показать материалы редакции."
      });
    };

    await renderNewsFeed();
    setupNewsAutoRefresh();

    syncNewsFeedIfNeeded()
      .then(() => renderNewsFeed())
      .catch(() => undefined);
  } catch (error) {
    container.innerHTML = errorMarkup(error.message);
  }
}

async function loadNewsDetailPage() {
  const main = document.getElementById("news-detail-main");
  if (!main) {
    return;
  }

  const id = new URLSearchParams(window.location.search).get("id") || "";
  if (!id) {
    main.innerHTML = errorMarkup("Не удалось определить материал. Вернитесь в ленту и откройте статью заново.");
    return;
  }

  main.innerHTML = loadingMarkup("Открываем материал...");

  try {
    const item = await fetchNewsItem(id);
    const tagClass = getTagClass(item.tag);
    const kindClass = getTagClass(item.kind);
    const coverImage = getNewsCoverImage(item);
    const body = getNewsBodyParagraphs(item);

    document.title = `Земледелецъ — ${item.title}`;

      main.innerHTML = `
        <div class="news_detail_cover">
          <img src="${escapeHtml(coverImage.src)}" alt="${escapeHtml(coverImage.alt)}" />
        </div>
        <div class="news_detail_head">
          <div class="listing_tags">
            <span class="tag ${tagClass}">${escapeHtml(item.tag)}</span>
            ${item.kind ? `<span class="tag ${kindClass}">${escapeHtml(item.kind)}</span>` : ""}
          </div>
          <div class="news_detail_title_row">
            <h1 class="panel_title news_detail_title">${escapeHtml(item.title)}</h1>
            ${renderTranslatedBadge(item)}
          </div>
          <div class="news_meta">
            ${renderNewsSourceIdentity(item)}
            <span>${escapeHtml(item.publishedAt || "Дата публикации уточняется")}</span>
            ${item.readTime ? `<span>${escapeHtml(item.readTime)}</span>` : ""}
          </div>
      </div>
      <div class="news_detail_body">
        ${body.map((paragraph) => `<p class="panel_text">${escapeHtml(paragraph)}</p>`).join("")}
      </div>
      <div class="card_actions">
        ${item.externalUrl ? `<a class="button_main" href="${escapeHtml(item.externalUrl)}" target="_blank" rel="noreferrer">Оригинал источника</a>` : ""}
        <a class="button_alt" href="news.html">Назад к ленте</a>
      </div>
    `;
  } catch (error) {
    main.innerHTML = errorMarkup(error.message);
  }
}

async function fetchNewsItem(id) {
  const response = await api("/api/news");
  const item = (response.items || []).find((entry) => entry.id === id);
  if (!item) {
    throw new Error("Материал не найден.");
  }

  return item;
}

async function syncNewsFeedIfNeeded() {
  try {
    await api("/api/news/sync", {
      method: "POST",
      body: { limit: 36 }
    });
  } catch {
    return;
  }
}

function setupNewsAutoRefresh() {
  if (getCurrentPage() !== "news.html" || window.__newsAutoRefreshBound) {
    return;
  }

  window.__newsAutoRefreshBound = true;
  window.setInterval(() => {
    window.location.reload();
  }, NEWS_REFRESH_INTERVAL_MS);
}

async function loadEventsPage() {
  const container = document.getElementById("events-list");
  if (!container) {
    return;
  }

  container.innerHTML = loadingMarkup("Собираем ближайшие события...");

  try {
    const response = await api("/api/events");
    container.innerHTML = response.items.map(renderEventCard).join("");
  } catch (error) {
    container.innerHTML = errorMarkup(error.message);
  }
}

function mountFilterableList({
  items,
  container,
  filterPanel,
  searchInput,
  resultsMeta,
  regionSelect,
  priceSelect,
  verifiedToggle,
  paginationContainer,
  pageSize = 10,
  renderItem,
  searchText,
  itemLabel,
  emptyTitle,
  emptyText,
  extraFilter
}) {
  const filterGroups = Array.from(filterPanel?.querySelectorAll("[data-filter-group]") || []);
  const activeFilters = Object.fromEntries(
    filterGroups.map((group) => [group.dataset.filterGroup, getActiveFilterValue(group)])
  );
  const extraControls = {
    region: normalizeText(regionSelect?.value || "all") || "all",
    price: normalizeText(priceSelect?.value || "all") || "all",
    verifiedOnly: Boolean(verifiedToggle?.checked)
  };
  let currentPage = 1;

  hydrateRegionOptions(items, regionSelect);

  const renderFilteredItems = () => {
    const query = normalizeText(searchInput?.value || "");
    const filteredItems = items.filter((item) => {
      const matchesFilters = filterGroups.every((group) => {
        const key = group.dataset.filterGroup;
        const expectedValue = normalizeText(activeFilters[key] || "all");
        if (expectedValue === "all") {
          return true;
        }

        return normalizeText(item[key]) === expectedValue;
      });

      if (!matchesFilters) {
        return false;
      }

      if (extraFilter && !extraFilter(item, extraControls)) {
        return false;
      }

      return !query || searchText(item).includes(query);
    });

    const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
    currentPage = Math.min(currentPage, totalPages);
    const pageStart = (currentPage - 1) * pageSize;
    const pageItems = filteredItems.slice(pageStart, pageStart + pageSize);

    container.innerHTML = filteredItems.length
      ? pageItems.map(renderItem).join("")
      : emptyResultsMarkup(emptyTitle, emptyText);
    bindLinkedCards(container);
    hydrateTagTooltips(container);
    renderPagination(paginationContainer, currentPage, totalPages, filteredItems.length, (nextPage) => {
      currentPage = nextPage;
      renderFilteredItems();
    });

    if (resultsMeta) {
      const parts = [`Найдено ${filteredItems.length} из ${items.length} ${itemLabel}.`];
      if (query) {
        parts.push(`Поиск: «${searchInput.value.trim()}».`);
      }

      const selectedFilters = Object.values(activeFilters).filter((value) => value !== "all").length;
      const extraFiltersCount =
        (extraControls.region !== "all" ? 1 : 0) +
        (extraControls.price !== "all" ? 1 : 0) +
        (extraControls.verifiedOnly ? 1 : 0);
      const totalFilters = selectedFilters + extraFiltersCount;
      if (totalFilters) {
        parts.push(`Активно фильтров: ${totalFilters}.`);
      }

      if (filteredItems.length > pageSize) {
        parts.push(`Страница ${currentPage} из ${totalPages}.`);
      }

      resultsMeta.textContent = parts.join(" ");
    }
  };

  filterGroups.forEach((group) => {
    group.addEventListener("click", (event) => {
      const button = event.target.closest(".pill");
      if (!button) {
        return;
      }

      group.querySelectorAll(".pill").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      activeFilters[group.dataset.filterGroup] = button.dataset.filterValue || "all";
      currentPage = 1;
      renderFilteredItems();
    });
  });

  regionSelect?.addEventListener("change", () => {
    extraControls.region = normalizeText(regionSelect.value || "all") || "all";
    currentPage = 1;
    renderFilteredItems();
  });

  priceSelect?.addEventListener("change", () => {
    extraControls.price = normalizeText(priceSelect.value || "all") || "all";
    currentPage = 1;
    renderFilteredItems();
  });

  verifiedToggle?.addEventListener("change", () => {
    extraControls.verifiedOnly = Boolean(verifiedToggle.checked);
    currentPage = 1;
    renderFilteredItems();
  });

  searchInput?.addEventListener("input", () => {
    currentPage = 1;
    renderFilteredItems();
  });

  renderFilteredItems();
}

function bindLinkedCards(scope = document) {
  scope.querySelectorAll(".offer_item--linked[data-href], .card_link_surface[data-href]").forEach((card) => {
    if (card.dataset.linkBound === "true") {
      return;
    }

    const goToCard = () => {
      const href = card.dataset.href;
      if (href) {
        window.location.href = href;
      }
    };

    card.addEventListener("click", (event) => {
      if (event.target.closest("a, button, input, textarea, select, label")) {
        return;
      }

      goToCard();
    });

    card.addEventListener("keydown", (event) => {
      if (event.target !== card) {
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        goToCard();
      }
    });

    card.dataset.linkBound = "true";
  });
}

function hydrateTagTooltips(scope = document) {
  scope.querySelectorAll(".tag").forEach((tag) => {
    const text = tag.textContent?.trim();
    const description = getTagDescription(text);

    if (!description) {
      tag.removeAttribute("data-tooltip");
      tag.removeAttribute("aria-label");
      return;
    }

    tag.setAttribute("data-tooltip", description);
    tag.setAttribute("aria-label", `${text}: ${description}`);
    if (!tag.hasAttribute("tabindex")) {
      tag.setAttribute("tabindex", "0");
    }
  });
}

function getListingPageContext() {
  const searchParams = new URLSearchParams(window.location.search);
  const kind = searchParams.get("kind") === "tenders" ? "tenders" : "marketplace";
  const id = searchParams.get("id") || "";
  return { kind, id };
}

function getListingHref(kind, id) {
  return `listing-detail.html?kind=${encodeURIComponent(kind)}&id=${encodeURIComponent(id || "")}`;
}

function getTagDescription(text) {
  const value = normalizeText(text);
  if (!value) {
    return "";
  }

  const descriptions = {
    "продажа": "Компания предлагает товар или партию к покупке.",
    "покупка": "Компания ищет поставщика и собирает встречные предложения.",
    "услуги": "Карточка с сервисом, арендой или подрядной работой.",
    "аренда": "Предложение техники, оборудования или мощностей во временное пользование.",
    "совместная поставка": "Объединенная поставка или закупка для получения лучших условий.",
    "тендер": "Формальный отбор подрядчика или поставщика по условиям заказчика.",
    "запрос цен": "Быстрый сбор коммерческих цен без сложной тендерной процедуры.",
    "долгосрочный контракт": "Поиск партнера на регулярные поставки или обслуживание.",
    "запрос предложений": "Сбор расширенных коммерческих предложений с условиями и составом работ.",
    "конкурс": "Сравнение нескольких участников по цене, срокам и дополнительным условиям.",
    "зерно": "Зерновые культуры и товарные партии для торговли или переработки.",
    "семена": "Посевной материал для сезонных работ и контрактных поставок.",
    "удобрения": "Минеральные и иные удобрения для сельхозпроизводства.",
    "сзр": "Средства защиты растений и сопутствующие решения.",
    "техника": "Сельхозтехника, машины и оборудование.",
    "запчасти": "Комплектующие, расходники и детали для обслуживания техники.",
    "топливо": "Топливо и энергоресурсы для сельхозработ и логистики.",
    "гсм": "Горюче-смазочные материалы для транспорта и техники.",
    "логистика": "Перевозка, экспедирование и организация поставок.",
    "хранение": "Складские, элеваторные и иные мощности для хранения продукции.",
    "инфраструктура": "Объекты, мощности и технические решения для производственного контура.",
    "проверено": "Компания подтвердила профиль и прошла полную проверку документов на площадке.",
    "на модерации": "Профиль компании еще проходит проверку и уточнение данных.",
    "рынок · аналитика": "Материал о динамике рынка, ценах и отраслевых тенденциях.",
    "события · тренды": "Новость о заметных изменениях, форматах и рыночных сигналах.",
    "практика · гайд": "Практический материал с прикладными советами и разбором кейсов.",
    "политика · регулирование": "Материал о правилах, законах, нормативных изменениях и отраслевом регулировании.",
    "экспорт · логистика": "Новость о поставках, маршрутах, экспорте, перевозке и инфраструктуре движения товара.",
    "урожай · погода": "Материал о сезонных полевых работах, погодных рисках, урожайности и прогнозах.",
    "животноводство · ветеринария": "Материал о молочном и мясном секторе, здоровье животных и ветеринарной практике.",
    "техника · инфраструктура": "Новость о машинах, оборудовании, элеваторах, мощностях и производственной инфраструктуре.",
    "финансы · господдержка": "Материал о субсидиях, инвестициях, кредитовании и инструментах поддержки отрасли.",
    "наука · технологии": "Публикация о селекции, исследованиях, агротехнологиях и прикладных инновациях.",
    "новость": "Короткий редакционный материал о событии, факте или заметном изменении на рынке.",
    "статья": "Развернутый материал с контекстом, выводами и прикладными наблюдениями редакции.",
    "аналитика": "Материал с цифрами, рыночными сигналами, сравнением факторов и редакционными выводами.",
    "пресс-релиз": "Официальное сообщение компании, ведомства или организации, опубликованное в деловом формате.",
    "выставка": "Отраслевое событие с экспозицией, встречами и переговорами.",
    "выездное мероприятие": "Полевой или демонстрационный формат на площадке участника.",
    "деловая встреча": "Камерный формат для переговоров, нетворка и профильных обсуждений."
  };

  if (descriptions[value]) {
    return descriptions[value];
  }

  if (value.includes("область")) {
    return "Регион, в котором работает компания или размещена карточка.";
  }

  return "";
}

function getListingValueLabel(item, kind) {
  return kind === "tenders" ? item.deadline || "Срок уточняется" : item.priceLabel || "Цена по запросу";
}

function buildListingDetailParagraphs(item, company, kind) {
  if (kind === "tenders") {
    return [
      `${item.title} размещена компанией ${company.name || "из отрасли"} для быстрого сбора релевантных предложений от поставщиков и подрядчиков.`,
      `${item.summary} В карточке уже вынесены ключевые ориентиры по срокам, формату участия и параметрам закупки, чтобы стороны быстрее перешли к деловому диалогу.`,
      `Компания ${company.name || "заказчик"} работает в регионе ${company.region || company.city || "размещения карточки"} и использует площадку для прозрачного отбора коммерческих предложений по понятным условиям.`
    ];
  }

  return [
    `${item.title} опубликовано компанией ${company.name || "из отрасли"} как прямое рыночное предложение для потенциальных покупателей и партнеров.`,
    `${item.summary} Карточка помогает сразу оценить формат сделки, предмет предложения и основные условия без лишней переписки на первом шаге.`,
    `Компания ${company.name || "инициатор"} работает в регионе ${company.region || company.city || "размещения карточки"} и ведет коммуникацию через площадку в удобном деловом формате.`
  ];
}

function buildListingInfoItems(item, company, kind) {
  const meta = item.meta || [];
  const region = company?.region || company?.city || "Регион уточняется";

  if (kind === "tenders") {
    return [
      { label: "Формат", value: item.type || "Тендер" },
      { label: "Категория", value: item.category || "Категория уточняется" },
      { label: "Область", value: region },
      { label: "Условия участия", value: meta[0] || "Условия участия уточняются после первого контакта." },
      { label: "Коммерческие условия", value: meta[1] || "Коммерческие условия согласовываются с заказчиком." },
      { label: "Требуемые документы", value: meta[2] || "Коммерческое предложение, реквизиты компании и подтверждение условий поставки." }
    ];
  }

  return [
    { label: "Формат", value: item.type || "Предложение" },
    { label: "Категория", value: item.category || "Категория уточняется" },
    { label: "Область", value: region },
    { label: "Партия или объем", value: meta[0] || "Объем поставки уточняется по запросу." },
    { label: "Условия работы", value: meta[1] || "Условия работы уточняются при обращении." },
    { label: "Логистика или сервис", value: meta[2] || "Логистика и сопровождение обсуждаются отдельно." }
  ];
}

function getListingCoverImage(item, kind) {
  const category = normalizeText(item.category);
  if (category.includes("сем")) {
    return {
      src: "assets/img/listing-seeds.svg",
      alt: `${item.title} — визуальный баннер по категории семян`
    };
  }

  if (category.includes("удобр")) {
    return {
      src: "assets/img/listing-inputs.svg",
      alt: `${item.title} — визуальный баннер по категории удобрений`
    };
  }

  if (category.includes("тех")) {
    return {
      src: "assets/img/listing-tech.svg",
      alt: `${item.title} — визуальный баннер по категории техники`
    };
  }

  if (category.includes("инфраструкт") || category.includes("логист")) {
    return {
      src: "assets/img/listing-infra.svg",
      alt: `${item.title} — визуальный баннер по инфраструктуре и логистике`
    };
  }

  return kind === "tenders"
    ? {
        src: "assets/img/listing-infra.svg",
        alt: `${item.title} — баннер для карточки закупки`
      }
    : {
        src: "assets/img/listing-seeds.svg",
        alt: `${item.title} — баннер для карточки предложения`
      };
}

function getNewsCoverImage(item) {
  if (item?.coverImage) {
    return {
      src: item.coverImage,
      alt: item.title || "Обложка материала"
    };
  }

  const tag = normalizeText(item.tag);
  if (tag.includes("рынок") || tag.includes("экспорт") || tag.includes("урожай")) {
    return {
      src: "assets/img/news-market.svg",
      alt: `${item.title} — обложка материала о рынке`
    };
  }

  if (tag.includes("события") || tag.includes("политика") || tag.includes("финансы")) {
    return {
      src: "assets/img/news-trends.svg",
      alt: `${item.title} — обложка материала о событиях и трендах`
    };
  }

  return {
    src: "assets/img/news-guide.svg",
    alt: `${item.title} — обложка практического материала`
  };
}

function getNewsSourceName(item) {
  return item?.sourceName || "ЗемледелецЪ";
}

function getNewsAuthorLabel(item) {
  const author = String(item?.author || "").trim();
  const sourceName = getNewsSourceName(item);
  if (!author || normalizeText(author) === normalizeText(sourceName)) {
    return "";
  }

  return author;
}

function getNewsSourceInitials(item) {
  const sourceName = getNewsSourceName(item);
  const parts = sourceName.split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase() || sourceName.slice(0, 1).toUpperCase();
}

function renderNewsSourceIdentity(item) {
  const sourceName = getNewsSourceName(item);
  const authorLabel = getNewsAuthorLabel(item);
  const isInternalSource = normalizeText(sourceName) === normalizeText("ЗемледелецЪ");

  return `
    <span class="news_source">
      <span class="news_source_icon${isInternalSource ? " is-logo" : ""}">
        ${isInternalSource
          ? '<img src="/assets/img/zemledelets_logo.png" alt="ЗемледелецЪ" />'
          : `<span>${escapeHtml(getNewsSourceInitials(item))}</span>`}
      </span>
      <span class="news_source_text">
        <span class="news_source_name">${escapeHtml(sourceName)}</span>
        ${authorLabel ? `<span class="news_source_author">${escapeHtml(authorLabel)}</span>` : ""}
      </span>
    </span>
  `;
}

function renderTranslatedBadge(item) {
  if (!item?.translated) {
    return "";
  }

  const provider = String(item.translationProvider || "").trim();
  const hint = provider
    ? `\u041c\u0430\u0442\u0435\u0440\u0438\u0430\u043b \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u0438 \u043f\u0435\u0440\u0435\u0432\u0435\u0434\u0435\u043d \u043d\u0430 \u0440\u0443\u0441\u0441\u043a\u0438\u0439 \u0447\u0435\u0440\u0435\u0437 ${provider}.`
    : "\u041c\u0430\u0442\u0435\u0440\u0438\u0430\u043b \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u0438 \u043f\u0435\u0440\u0435\u0432\u0435\u0434\u0435\u043d \u043d\u0430 \u0440\u0443\u0441\u0441\u043a\u0438\u0439.";

  return `<span class="news_translated_badge" title="${escapeHtml(hint)}">\u041f\u0435\u0440\u0435\u0432\u0435\u0434\u0435\u043d\u043e</span>`;
}

function getNewsBodyParagraphs(item) {
  const summary = normalizeText(item?.summary || "");
  const title = normalizeText(item?.title || "");
  const sourceName = normalizeText(getNewsSourceName(item));
  const paragraphs = Array.isArray(item?.body)
    ? item.body
    : typeof item?.body === "string"
      ? item.body.split(/\n{2,}/)
      : [];
  const cleaned = paragraphs
    .map((paragraph) => String(paragraph || "").trim())
    .filter(Boolean)
    .map((paragraph) => paragraph.replace(/\s*[вЂ“вЂ”-]\s*[^вЂ“вЂ”-]+$/, (tail) => {
      const normalizedTail = normalizeText(tail.replace(/^[\sвЂ“вЂ”-]+/, ""));
      return normalizedTail === sourceName ? "" : tail;
    }).trim())
    .map((paragraph) => {
      const normalizedParagraph = normalizeText(paragraph);
      if (normalizedParagraph === title) {
        return "";
      }

      if (normalizedParagraph.startsWith(`${title} `)) {
        return paragraph.slice(item.title.length).trim();
      }

      return paragraph;
    })
    .filter(Boolean)
    .filter((paragraph) => {
      const normalizedParagraph = normalizeText(paragraph);
      return normalizedParagraph !== summary
        && normalizedParagraph !== title
        && normalizedParagraph !== sourceName
        && normalizedParagraph !== `- ${sourceName}`
        && normalizedParagraph !== `вЂ” ${sourceName}`
        && normalizedParagraph !== `вЂ“ ${sourceName}`;
    });

  return cleaned.length ? cleaned : [String(item?.summary || item?.title || "").trim()].filter(Boolean);
}

function getActiveFilterValue(group) {
  return group.querySelector(".pill.active")?.dataset.filterValue || "all";
}

function hydrateRegionOptions(items, select) {
  if (!select) {
    return;
  }

  const currentValue = select.value || "all";
  const regions = [...new Set(
    items
      .map((item) => item.company?.region || item.company?.city || "")
      .map((value) => String(value).trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "ru"));

  select.innerHTML = [
    '<option value="all">Все области</option>',
    ...regions.map((region) => `<option value="${escapeHtml(normalizeText(region))}">${escapeHtml(region)}</option>`)
  ].join("");

  select.value = regions.some((region) => normalizeText(region) === currentValue) ? currentValue : "all";
}

function renderPagination(container, currentPage, totalPages, totalItems, onPageChange) {
  if (!container) {
    return;
  }

  if (totalItems <= 10 || totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  const buttons = [];
  buttons.push(`
    <button class="pagination_button" type="button" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""}>
      Назад
    </button>
  `);

  for (let page = 1; page <= totalPages; page += 1) {
    buttons.push(`
      <button class="pagination_button ${page === currentPage ? "active" : ""}" type="button" data-page="${page}">
        ${page}
      </button>
    `);
  }

  buttons.push(`
    <button class="pagination_button" type="button" data-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""}>
      Вперед
    </button>
  `);

  container.innerHTML = buttons.join("");
  container.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.disabled) {
        return;
      }

      const nextPage = Number(button.dataset.page || currentPage);
      if (nextPage >= 1 && nextPage <= totalPages && nextPage !== currentPage) {
        onPageChange(nextPage);
      }
    });
  });
}

function matchesPriceRange(priceLabel, range) {
  const normalizedRange = normalizeText(range);
  const normalizedLabel = normalizeText(priceLabel);

  if (normalizedRange === "request") {
    return normalizedLabel.includes("по запросу");
  }

  const numericPrice = parsePriceValue(priceLabel);
  if (numericPrice === null) {
    return false;
  }

  if (normalizedRange === "0-10000") {
    return numericPrice <= 10000;
  }

  if (normalizedRange === "10000-30000") {
    return numericPrice > 10000 && numericPrice <= 30000;
  }

  if (normalizedRange === "30000-50000") {
    return numericPrice > 30000 && numericPrice <= 50000;
  }

  if (normalizedRange === "50000+") {
    return numericPrice > 50000;
  }

  return true;
}

function parsePriceValue(priceLabel) {
  const match = String(priceLabel || "").replace(/\s+/g, "").match(/(\d[\d.,]*)/);
  if (!match) {
    return null;
  }

  const numeric = Number(match[1].replace(",", "."));
  return Number.isFinite(numeric) ? numeric : null;
}

function getMarketplaceSearchText(item) {
  const company = item.company || {};
  return normalizeText([
    item.title,
    item.summary,
    item.type,
    item.category,
    item.priceLabel,
    company.name,
    company.region,
    ...(item.meta || [])
  ].filter(Boolean).join(" "));
}

function getTenderSearchText(item) {
  const company = item.company || {};
  return normalizeText([
    item.title,
    item.summary,
    item.type,
    item.category,
    item.deadline,
    company.name,
    company.region,
    ...(item.meta || [])
  ].filter(Boolean).join(" "));
}

function getNewsSearchText(item) {
  return normalizeText([
    item.title,
    item.summary,
    item.tag,
    item.kind,
    item.author,
    item.sourceName,
    item.publishedAt,
    item.readTime,
    ...((item.body || []).slice(0, 3))
  ].filter(Boolean).join(" "));
}

function renderOfferCard(item) {
  const company = item.company || {};
  const actionHref = state.user ? "profile.html" : "auth.html";
  const typeTagClass = getTagClass(item.type);
  const categoryTagClass = getTagClass(item.category);
  const detailHref = getListingHref("marketplace", item.id);

  return `
    <div class="offer_item offer_item--linked" data-href="${detailHref}" tabindex="0" role="link" aria-label="Открыть карточку: ${escapeHtml(item.title)}">
      <div class="top">
        <div><span class="tag ${typeTagClass}">${escapeHtml(item.type)}</span> <span class="tag ${categoryTagClass}">${escapeHtml(item.category)}</span></div>
        <strong>${escapeHtml(item.priceLabel)}</strong>
      </div>
      <h3><a class="card_title_link" href="${detailHref}">${escapeHtml(item.title)}</a></h3>
      <p>${escapeHtml(company.name || "Компания")} · ${escapeHtml(company.region || "Регион уточняется")}</p>
      <div class="offer_meta">${renderMeta(item.meta)}</div>
      <div class="offer_actions">
        <a class="button_alt" href="company-card.html?slug=${encodeURIComponent(company.slug || "")}">Карточка компании</a>
        <a class="button_main" href="${actionHref}">${escapeHtml(item.ctaLabel)}</a>
      </div>
    </div>
  `;
}

function renderTenderCard(item) {
  const company = item.company || {};
  const typeTagClass = getTagClass(item.type);
  const categoryTagClass = getTagClass(item.category);
  const detailHref = getListingHref("tenders", item.id);
  return `
    <div class="offer_item offer_item--linked" data-href="${detailHref}" tabindex="0" role="link" aria-label="Открыть карточку: ${escapeHtml(item.title)}">
      <div class="top">
        <div><span class="tag ${typeTagClass}">${escapeHtml(item.type)}</span> <span class="tag ${categoryTagClass}">${escapeHtml(item.category)}</span></div>
        <strong>${escapeHtml(item.deadline)}</strong>
      </div>
      <h3><a class="card_title_link" href="${detailHref}">${escapeHtml(item.title)}</a></h3>
      <p>${escapeHtml(company.name || "Компания")} · ${escapeHtml(company.region || "Регион уточняется")}</p>
      <div class="offer_meta">${renderMeta(item.meta)}</div>
      <div class="offer_actions">
        <a class="button_alt" href="company-card.html?slug=${encodeURIComponent(company.slug || "")}">Карточка заказчика</a>
        <a class="button_main" href="${state.user ? "profile.html" : "auth.html"}">${escapeHtml(item.ctaLabel)}</a>
      </div>
    </div>
  `;
}

function renderNewsCard(item) {
    const tagClass = getTagClass(item.tag);
    const detailHref = `news-detail.html?id=${encodeURIComponent(item.id || "")}`;
    return `
      <article class="news_item offer_item--linked" data-href="${detailHref}" tabindex="0" role="link" aria-label="Открыть материал: ${escapeHtml(item.title)}">
        <div class="top"><span class="tag ${tagClass}">${escapeHtml(item.tag)}</span></div>
        <div class="news_title_row">
          <h3><a class="card_title_link" href="${detailHref}">${escapeHtml(item.title)}</a></h3>
          ${renderTranslatedBadge(item)}
        </div>
        <p>${escapeHtml(item.summary)}</p>
        <div class="news_meta">
          ${renderNewsSourceIdentity(item)}
          <span>${escapeHtml(item.kind || "Материал")}</span>
          <span>${escapeHtml(item.publishedAt || "Дата уточняется")}</span>
          ${item.readTime ? `<span>${escapeHtml(item.readTime)}</span>` : ""}
        </div>
        <div class="card_actions"><a class="button_main" href="${detailHref}">Читать</a></div>
    </article>
  `;
}

function renderEventCard(item) {
  const tagClass = getTagClass(item.type);
  return `
    <div class="event_item white_card">
      <div class="top"><span class="tag ${tagClass}">${escapeHtml(item.type)}</span></div>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.dateLabel)} В· ${escapeHtml(item.location)}. ${escapeHtml(item.summary)}</p>
      <div class="card_actions"><a class="button_main" href="${state.user ? "profile.html" : "auth.html"}">${escapeHtml(item.ctaLabel)}</a></div>
    </div>
  `;
}

function renderMeta(items = []) {
  return items.map((item) => `<span>${escapeHtml(item)}</span>`).join("");
}

function getTagClass(type) {
  if (type === "\u041f\u043e\u043a\u0443\u043f\u043a\u0430") {
    return "buy";
  }

  if (type === "\u0422\u0435\u043d\u0434\u0435\u0440") {
    return "tender";
  }

  if (type === "\u0417\u0430\u043f\u0440\u043e\u0441 \u0446\u0435\u043d") {
    return "rfq";
  }

  if (type === "\u0414\u043e\u043b\u0433\u043e\u0441\u0440\u043e\u0447\u043d\u044b\u0439 \u043a\u043e\u043d\u0442\u0440\u0430\u043a\u0442") {
    return "contract";
  }

  if (type === "\u0417\u0430\u043f\u0440\u043e\u0441 \u043f\u0440\u0435\u0434\u043b\u043e\u0436\u0435\u043d\u0438\u0439") {
    return "proposal";
  }

  if (type === "\u041a\u043e\u043d\u043a\u0443\u0440\u0441") {
    return "contest";
  }

  if (type === "\u041f\u0440\u043e\u0434\u0430\u0436\u0430") {
    return "sale";
  }

  if (type === "\u0423\u0441\u043b\u0443\u0433\u0438") {
    return "service";
  }

  if (type === "\u0421\u0435\u043c\u0435\u043d\u0430") {
    return "seeds";
  }

  if (type === "\u0423\u0434\u043e\u0431\u0440\u0435\u043d\u0438\u044f") {
    return "inputs";
  }

  if (type === "\u0418\u043d\u0444\u0440\u0430\u0441\u0442\u0440\u0443\u043a\u0442\u0443\u0440\u0430" || type === "\u041b\u043e\u0433\u0438\u0441\u0442\u0438\u043a\u0430") {
    return "infrastructure";
  }

  if (type === "\u0422\u0435\u0445\u043d\u0438\u043a\u0430") {
    return "tech";
  }

  if (type === "\u0420\u044b\u043d\u043e\u043a \u00b7 \u0410\u043d\u0430\u043b\u0438\u0442\u0438\u043a\u0430") {
    return "market";
  }

  if (type === "\u0421\u043e\u0431\u044b\u0442\u0438\u044f \u00b7 \u0422\u0440\u0435\u043d\u0434\u044b") {
    return "events";
  }

  if (type === "\u041f\u0440\u0430\u043a\u0442\u0438\u043a\u0430 \u00b7 \u0413\u0430\u0439\u0434") {
    return "practice";
  }

  if (type === "\u041f\u043e\u043b\u0438\u0442\u0438\u043a\u0430 \u00b7 \u0420\u0435\u0433\u0443\u043b\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435") {
    return "policy";
  }

  if (type === "\u042d\u043a\u0441\u043f\u043e\u0440\u0442 \u00b7 \u041b\u043e\u0433\u0438\u0441\u0442\u0438\u043a\u0430") {
    return "export";
  }

  if (type === "\u0423\u0440\u043e\u0436\u0430\u0439 \u00b7 \u041f\u043e\u0433\u043e\u0434\u0430") {
    return "weather";
  }

  if (type === "\u0416\u0438\u0432\u043e\u0442\u043d\u043e\u0432\u043e\u0434\u0441\u0442\u0432\u043e \u00b7 \u0412\u0435\u0442\u0435\u0440\u0438\u043d\u0430\u0440\u0438\u044f") {
    return "livestock";
  }

  if (type === "\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u00b7 \u0418\u043d\u0444\u0440\u0430\u0441\u0442\u0440\u0443\u043a\u0442\u0443\u0440\u0430") {
    return "industry";
  }

  if (type === "\u0424\u0438\u043d\u0430\u043d\u0441\u044b \u00b7 \u0413\u043e\u0441\u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430") {
    return "finance";
  }

  if (type === "\u041d\u0430\u0443\u043a\u0430 \u00b7 \u0422\u0435\u0445\u043d\u043e\u043b\u043e\u0433\u0438\u0438") {
    return "science";
  }

  if (type === "\u0410\u043d\u0430\u043b\u0438\u0442\u0438\u043a\u0430") {
    return "analysis";
  }

  if (type === "\u041f\u0440\u0435\u0441\u0441-\u0440\u0435\u043b\u0438\u0437") {
    return "release";
  }

  if (type === "\u0412\u044b\u0441\u0442\u0430\u0432\u043a\u0430") {
    return "expo";
  }

  if (type === "\u0412\u044b\u0435\u0437\u0434\u043d\u043e\u0435 \u043c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u0435") {
    return "field";
  }

  if (type === "\u0414\u0435\u043b\u043e\u0432\u0430\u044f \u0432\u0441\u0442\u0440\u0435\u0447\u0430") {
    return "meeting";
  }

  return "";
}

function setSession(token, user) {
  state.token = token;
  state.user = user;
  localStorage.setItem(TOKEN_KEY, token);
  applyAuthState();
}

function clearSession(redirect = true) {
  state.token = "";
  state.user = null;
  localStorage.removeItem(TOKEN_KEY);

  if (redirect) {
    window.location.href = "auth.html";
  }
}

function loadingMarkup(text) {
  return `<div class="mini_box status_message">${escapeHtml(text)}</div>`;
}

function errorMarkup(text) {
  return `<div class="mini_box status_message error">${escapeHtml(text)}</div>`;
}

function emptyResultsMarkup(title, text) {
  return `
    <div class="offer_item">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(text)}</p>
    </div>
  `;
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function setFeedback(node, text, type) {
  if (!node) {
    return;
  }

  node.textContent = text;
  node.className = `status_message ${type}`.trim();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatMetric(value) {
  if (value >= 1000) {
    return new Intl.NumberFormat("ru-RU").format(value);
  }

  return String(value);
}

async function api(url, options = {}) {
  const headers = new Headers(options.headers || {});

  if (state.token) {
    headers.set("Authorization", `Bearer ${state.token}`);
  }

  const hasBody = options.body !== undefined;
  const response = await fetch(url, {
    method: options.method || "GET",
    headers: hasBody ? withJsonHeader(headers) : headers,
    cache: "no-store",
    body: hasBody ? JSON.stringify(options.body) : undefined
  });

  const raw = await response.text();
  const data = raw ? JSON.parse(raw) : {};

  if (!response.ok) {
    throw new Error(data.error || "Запрос завершился с ошибкой.");
  }

  return data;
}

function withJsonHeader(headers) {
  headers.set("Content-Type", "application/json; charset=utf-8");
  return headers;
}
