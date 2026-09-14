const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'public/assets/js/app.js'), 'utf8');
const helpers = app.slice(app.indexOf('function escapeHtml(value) {'), app.indexOf('function formatMetric(value) {'));
const context = vm.createContext({});
const sharedFunctions = [
  ['function normalizeText(value) {', 'function setFeedback('],
  ['function getTagClass(type) {', 'function setSession('],
  ['function getTagDescription(text) {', 'function getListingValueLabel('],
  ['function bindLinkedCards(scope = document) {', 'function getListingPageContext(']
].map(([start, end]) => app.slice(app.indexOf(start), app.indexOf(end, app.indexOf(start)))).join('\n');
vm.runInContext(helpers + sharedFunctions + fs.readFileSync(path.join(root, 'public/assets/js/company-catalog.js'), 'utf8'), context);
const companies = [
  { name: 'Янтарь', region: 'Курская область', city: 'Курск', specialties: ['Зерно'], verified: true, slug: 'yantar' },
  { name: 'Агро Ёлка', region: 'Липецкая область', city: 'Липецк', specialties: ['Сервис'], description: 'Ремонт техники', verified: false, slug: 'agro' },
  { name: 'Берег', region: 'Курская область', city: 'Курск', specialties: ['Сервис'], verified: true, slug: 'bereg' }
];
const names = (items) => Array.from(items, (item) => item.name);

test('combines search, region, specialty and verification filters', () => {
  assert.deepEqual(names(context.filterEnterpriseCompanies(companies, {
    search: 'КУРСК сервис', region: 'Курская область', specialty: 'Сервис', verified: true
  })), ['Берег']);
  assert.equal(context.filterEnterpriseCompanies(companies, { search: 'Курск', region: 'Липецкая область' }).length, 0);
});

test('search tolerates whitespace, case and е/ё', () => {
  assert.deepEqual(names(context.filterEnterpriseCompanies(companies, { search: '  елка   РЕМОНТ ' })), ['Агро Ёлка']);
});

test('sorts in Russian without changing the original list', () => {
  const original = names(companies);
  assert.deepEqual(names(context.filterEnterpriseCompanies(companies, {})), ['Агро Ёлка', 'Берег', 'Янтарь']);
  assert.deepEqual(names(context.filterEnterpriseCompanies(companies, { sort: 'name-desc' })), ['Янтарь', 'Берег', 'Агро Ёлка']);
  assert.deepEqual(names(companies), original);
});

test('handles missing optional fields and an empty catalogue', () => {
  assert.equal(context.filterEnterpriseCompanies([], {}).length, 0);
  const card = context.renderEnterpriseCard({ name: 'Новое предприятие', slug: 'new' });
  assert.ok(card.includes('company-card.html?slug=new'));
  assert.ok(!card.includes('undefined'));
  assert.ok(!card.includes('enterprise_verified'));
});

test('escapes company content and keeps untrusted slugs inside the URL parameter', () => {
  const card = context.renderEnterpriseCard({
    name: '<script>alert(1)</script>', slug: 'x" onclick="alert(1)',
    catalogSummary: '<img src=x onerror=alert(1)>', specialties: ['<svg onload=alert(1)>'],
    activeOffersLabel: '7 активных закупок', verified: true
  });
  assert.ok(!card.includes('<script>'));
  assert.ok(!card.includes('<img src=x'));
  assert.ok(!card.includes('<svg onload='));
  assert.ok(card.includes('slug=x%22%20onclick%3D%22alert(1)'));
  assert.ok(card.includes('7 активных закупок'));
});

test('directory controls update results, paginate and reset together', () => {
  const nodes = new Map();
  const node = (id) => {
    if (!nodes.has(id)) nodes.set(id, {
      value: '', checked: false, innerHTML: '', textContent: '', hidden: true,
      listeners: {}, attributes: {},
      addEventListener(type, callback) { this.listeners[type] = callback; },
      setAttribute(key, value) { this.attributes[key] = value; },
      querySelector() { return null; },
      querySelectorAll() { return []; },
      scrollIntoView() {},
      reset() { this.listeners.reset({ preventDefault() {} }); }
    });
    return nodes.get(id);
  };
  context.document = { getElementById: node, querySelector: node };
  context.state = { user: null };
  let changePage;
  context.renderPagination = (_node, _page, _pages, _total, callback) => { changePage = callback; };
  const many = Array.from({ length: 25 }, (_, index) => ({
    ...companies[index % companies.length], name: `Компания ${String(index).padStart(2, '0')}`
  }));
  context.mountCompanyDirectory(many);
  const cardCount = () => (node('companies-list').innerHTML.match(/<article /g) || []).length;
  assert.equal(cardCount(), 12);
  assert.equal(node('companies-total').textContent, '25');
  changePage(3);
  assert.equal(cardCount(), 1);
  node('companies-search').value = 'несуществующая';
  node('companies-search').listeners.input();
  assert.equal(cardCount(), 0);
  assert.ok(node('companies-list').innerHTML.includes('Компании не найдены'));
  node('companies-filters').reset();
  assert.equal(cardCount(), 12);
  assert.equal(node('companies-sort').value, 'name');
  node('companies-region').value = 'Липецкая область';
  node('companies-region').listeners.change();
  assert.equal(cardCount(), 8);
  node('companies-verified').checked = true;
  node('companies-verified').listeners.change();
  assert.equal(cardCount(), 0);
  node('companies-filters').reset();
  assert.equal(cardCount(), 12);
  assert.equal(node('companies-list').attributes['aria-busy'], 'false');
});

test('company specializations use shared colored tags and descriptions', () => {
  const labels = ['Экспорт', 'Хранение', 'Логистика', 'Официальный дилер', 'Сервис', 'Запчасти', 'Закупки', 'Сезонные контракты', 'Запросы цен', 'Выездной сервис', 'Техника', 'Проверено', 'На модерации'];
  for (const label of labels) {
    assert.ok(context.getTagClass(label), label);
    assert.ok(context.getTagDescription(label), label);
    assert.ok(context.renderEnterpriseTag(label).includes('class="tag '));
  }
  assert.ok(context.renderEnterpriseTag('Новое направление').includes('data-tag-description="Направление деятельности компании: Новое направление.'));
  const card = context.renderEnterpriseCard(companies[0]);
  assert.ok(card.includes('card_link_surface'));
  assert.ok(card.includes('role="link"'));
  assert.ok(!card.includes('enterprise_profile_link'));
  assert.ok(!card.includes('О компании'));
});

test('whole card opens the company by click, Enter or Space without binding twice', () => {
  context.window = { location: { href: '' } };
  const listeners = {};
  const card = {
    dataset: { href: 'company-card.html?slug=yantar' },
    addEventListener(type, callback) { assert.ok(!listeners[type]); listeners[type] = callback; }
  };
  const scope = { querySelectorAll: () => [card] };
  context.bindLinkedCards(scope);
  context.bindLinkedCards(scope);
  listeners.click({ target: { closest: () => null } });
  assert.equal(context.window.location.href, card.dataset.href);
  for (const key of ['Enter', ' ']) {
    context.window.location.href = '';
    let prevented = false;
    listeners.keydown({ target: card, key, preventDefault() { prevented = true; } });
    assert.equal(context.window.location.href, card.dataset.href);
    assert.ok(prevented);
  }
});

test('shared tooltip hydration retains a description for a new specialization', () => {
  const attributes = {};
  const tag = {
    textContent: 'Новое направление', dataset: { tagDescription: 'Описание нового направления.' },
    setAttribute(key, value) { attributes[key] = value; },
    removeAttribute(key) { delete attributes[key]; },
    hasAttribute(key) { return key in attributes; }
  };
  context.hydrateTagTooltips({ querySelectorAll: () => [tag] });
  assert.equal(attributes['data-tooltip'], 'Описание нового направления.');
  assert.equal(attributes.tabindex, '0');
});
