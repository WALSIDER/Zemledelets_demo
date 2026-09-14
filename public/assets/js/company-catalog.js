function normalizeEnterpriseText(value) {
  return String(value || "").trim().toLocaleLowerCase("ru").replace(/ё/g, "е");
}

function filterEnterpriseCompanies(items, filters) {
  const words = normalizeEnterpriseText(filters.search).split(/\s+/).filter(Boolean);
  return items.filter((company) => {
    const specialties = Array.isArray(company.specialties) ? company.specialties : [];
    const text = normalizeEnterpriseText([
      company.name, company.city, company.region, company.description,
      company.catalogSummary, ...specialties
    ].join(" "));
    return words.every((word) => text.includes(word))
      && (!filters.region || (company.region || company.city) === filters.region)
      && (!filters.specialty || specialties.includes(filters.specialty))
      && (!filters.verified || company.verified);
  }).sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "ru")
    * (filters.sort === "name-desc" ? -1 : 1));
}

function renderEnterpriseTag(label) {
  const description = getTagDescription(label) || `Направление деятельности компании: ${label}.`;
  return `<span class="tag ${getTagClass(label) || "practice"}" data-tag-description="${escapeHtml(description)}">${escapeHtml(label)}</span>`;
}

function renderEnterpriseCard(company) {
  const name = company.name || "Компания";
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  const specialties = Array.isArray(company.specialties) ? company.specialties : [];
  const href = `company-card.html?slug=${encodeURIComponent(company.slug || "")}`;
  const tone = Array.from(name).reduce((sum, letter) => sum + letter.codePointAt(0), 0) % 3;
  return `
    <article class="enterprise_card white_card card_link_surface" data-href="${href}" tabindex="0" role="link" aria-label="Открыть компанию: ${escapeHtml(name)}">
      <div class="enterprise_card_top">
        <span class="enterprise_monogram enterprise_monogram--${tone}" aria-hidden="true">${escapeHtml(initials)}</span>
        ${renderEnterpriseTag(company.verified ? "Проверено" : "На модерации")}
      </div>
      <h2>${escapeHtml(name)}</h2>
      <div class="enterprise_location">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>
        <span>${escapeHtml(company.city || company.region || "Регион не указан")}${company.founded ? ` · ${escapeHtml(company.founded)}` : ""}</span>
      </div>
      <p class="enterprise_description">${escapeHtml(company.catalogSummary || company.description || "Компания ещё не добавила описание.")}</p>
      ${specialties.length ? `<ul class="enterprise_specialties" aria-label="Специализация">${specialties.map((item) => `<li>${renderEnterpriseTag(item)}</li>`).join("")}</ul>` : ""}
      <div class="enterprise_card_footer">
        <span class="enterprise_activity">${escapeHtml(company.activeOffersLabel || "Нет активных объявлений")}</span>
      </div>
    </article>`;
}

function mountCompanyDirectory(items) {
  const form = document.getElementById("companies-filters");
  const search = document.getElementById("companies-search");
  const region = document.getElementById("companies-region");
  const specialty = document.getElementById("companies-specialty");
  const verified = document.getElementById("companies-verified");
  const sort = document.getElementById("companies-sort");
  const list = document.getElementById("companies-list");
  const meta = document.getElementById("companies-results-meta");
  const pagination = document.getElementById("companies-pagination");
  let page = 1;
  const pageSize = 12;
  const regions = [...new Set(items.map((item) => item.region || item.city).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ru"));
  const specialties = [...new Set(items.flatMap((item) => Array.isArray(item.specialties) ? item.specialties : []).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ru"));
  const options = (values) => values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
  region.innerHTML = '<option value="">Все регионы</option>' + options(regions);
  specialty.innerHTML = '<option value="">Все направления</option>' + options(specialties);
  document.getElementById("companies-total").textContent = String(items.length);
  const summary = document.getElementById("companies-summary");
  summary.innerHTML = `<span>Регионов: <strong>${regions.length}</strong></span><span>Проверенных компаний: <strong>${items.filter((company) => company.verified).length}</strong></span>`;
  summary.hidden = false;
  const join = document.getElementById("companies-join");
  if (state.user) {
    join.href = "profile.html";
    join.textContent = "Моя компания ↗";
  }

  const render = () => {
    const filtered = filterEnterpriseCompanies(items, {
      search: search.value, region: region.value, specialty: specialty.value,
      verified: verified.checked, sort: sort.value
    });
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
    page = Math.min(page, pages);
    const offset = (page - 1) * pageSize;
    meta.textContent = filtered.length > pageSize
      ? `Показано ${offset + 1}–${Math.min(offset + pageSize, filtered.length)} из ${filtered.length}`
      : `Найдено компаний: ${filtered.length}`;
    if (filtered.length) {
      list.innerHTML = filtered.slice(offset, offset + pageSize).map(renderEnterpriseCard).join("");
    } else {
      list.innerHTML = `<div class="enterprise_empty white_card"><span class="enterprise_empty_mark" aria-hidden="true">⌕</span><h2>${items.length ? "Компании не найдены" : "В каталоге пока нет компаний"}</h2><p>${items.length ? "Попробуйте другой запрос или сбросьте фильтры." : "Добавьте своё предприятие, чтобы партнёры могли найти вас."}</p>${items.length ? '<button type="button" class="button_alt" data-company-reset>Сбросить фильтры</button>' : '<a class="button_main" href="auth.html#register">Добавить компанию</a>'}</div>`;
      list.querySelector("[data-company-reset]")?.addEventListener("click", () => form.reset());
    }
    renderPagination(pagination, page, pages, filtered.length, (nextPage) => {
      page = nextPage;
      render();
      document.querySelector(".enterprise_toolbar").scrollIntoView({ block: "center" });
    });
    bindLinkedCards(list);
    hydrateTagTooltips(list);
    list.setAttribute("aria-busy", "false");
  };
  const update = () => { page = 1; render(); };
  form.addEventListener("submit", (event) => { event.preventDefault(); update(); });
  search.addEventListener("input", update);
  [region, specialty, verified, sort].forEach((control) => control.addEventListener("change", update));
  form.addEventListener("reset", (event) => {
    event.preventDefault();
    search.value = "";
    region.value = "";
    specialty.value = "";
    verified.checked = false;
    sort.value = "name";
    update();
  });
  render();
}
