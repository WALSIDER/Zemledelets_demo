const http = require("node:http");
const fsSync = require("node:fs");
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const { URL } = require("node:url");
const { AsyncLocalStorage } = require("node:async_hooks");
const runtimeContext = new AsyncLocalStorage();

function runWithRuntime(runtime, callback) {
  return runtimeContext.run(runtime, callback);
}

const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
loadEnvFile(path.join(ROOT_DIR, ".env"));
const DATA_FILE = path.join(ROOT_DIR, "data", "db.json");
const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT || 3000);
const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const NEWS_KINDS = [
  "Новость",
  "Статья",
  "Аналитика",
  "Пресс-релиз"
];

const NEWS_TAGS = [
  "Рынок · Аналитика",
  "События · Тренды",
  "Практика · Гайд",
  "Политика · Регулирование",
  "Экспорт · Логистика",
  "Урожай · Погода",
  "Животноводство · Ветеринария",
  "Техника · Инфраструктура",
  "Финансы · Господдержка",
  "Наука · Технологии"
];

const SAFE_NEWS_KINDS = [
  "\u041d\u043e\u0432\u043e\u0441\u0442\u044c",
  "\u0421\u0442\u0430\u0442\u044c\u044f",
  "\u0410\u043d\u0430\u043b\u0438\u0442\u0438\u043a\u0430",
  "\u041f\u0440\u0435\u0441\u0441-\u0440\u0435\u043b\u0438\u0437"
];

const SAFE_NEWS_TAGS = [
  "\u0420\u044b\u043d\u043e\u043a \u00b7 \u0410\u043d\u0430\u043b\u0438\u0442\u0438\u043a\u0430",
  "\u0421\u043e\u0431\u044b\u0442\u0438\u044f \u00b7 \u0422\u0440\u0435\u043d\u0434\u044b",
  "\u041f\u0440\u0430\u043a\u0442\u0438\u043a\u0430 \u00b7 \u0413\u0430\u0439\u0434",
  "\u041f\u043e\u043b\u0438\u0442\u0438\u043a\u0430 \u00b7 \u0420\u0435\u0433\u0443\u043b\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435",
  "\u042d\u043a\u0441\u043f\u043e\u0440\u0442 \u00b7 \u041b\u043e\u0433\u0438\u0441\u0442\u0438\u043a\u0430",
  "\u0423\u0440\u043e\u0436\u0430\u0439 \u00b7 \u041f\u043e\u0433\u043e\u0434\u0430",
  "\u0416\u0438\u0432\u043e\u0442\u043d\u043e\u0432\u043e\u0434\u0441\u0442\u0432\u043e \u00b7 \u0412\u0435\u0442\u0435\u0440\u0438\u043d\u0430\u0440\u0438\u044f",
  "\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u00b7 \u0418\u043d\u0444\u0440\u0430\u0441\u0442\u0440\u0443\u043a\u0442\u0443\u0440\u0430",
  "\u0424\u0438\u043d\u0430\u043d\u0441\u044b \u00b7 \u0413\u043e\u0441\u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430",
  "\u041d\u0430\u0443\u043a\u0430 \u00b7 \u0422\u0435\u0445\u043d\u043e\u043b\u043e\u0433\u0438\u0438"
];

const LEGACY_NEWS_KIND_MAP = new Map([
  ["РќРѕРІРѕСЃС‚СЊ", SAFE_NEWS_KINDS[0]],
  ["РЎС‚Р°С‚СЊСЏ", SAFE_NEWS_KINDS[1]],
  ["РђРЅР°Р»РёС‚РёРєР°", SAFE_NEWS_KINDS[2]],
  ["РџСЂРµСЃСЃ-СЂРµР»РёР·", SAFE_NEWS_KINDS[3]],
  ["РќРѕРІРѕСЃС‚СЊ", SAFE_NEWS_KINDS[0]],
  ["РЎС‚Р°С‚СЊСЏ", SAFE_NEWS_KINDS[1]],
  ["РђРЅР°Р»РёС‚РёРєР°", SAFE_NEWS_KINDS[2]],
  ["РџСЂРµСЃСЃ-СЂРµР»РёР·", SAFE_NEWS_KINDS[3]]
]);

const LEGACY_NEWS_TAG_MAP = new Map([
  ["Р С‹РЅРѕРє В· РђРЅР°Р»РёС‚РёРєР°", SAFE_NEWS_TAGS[0]],
  ["РЎРѕР±С‹С‚РёСЏ В· РўСЂРµРЅРґС‹", SAFE_NEWS_TAGS[1]],
  ["РџСЂР°РєС‚РёРєР° В· Р“Р°Р№Рґ", SAFE_NEWS_TAGS[2]],
  ["РџРѕР»РёС‚РёРєР° В· Р РµРіСѓР»РёСЂРѕРІР°РЅРёРµ", SAFE_NEWS_TAGS[3]],
  ["Р­РєСЃРїРѕСЂС‚ В· Р›РѕРіРёСЃС‚РёРєР°", SAFE_NEWS_TAGS[4]],
  ["РЈСЂРѕР¶Р°Р№ В· РџРѕРіРѕРґР°", SAFE_NEWS_TAGS[5]],
  ["Р–РёРІРѕС‚РЅРѕРІРѕРґСЃС‚РІРѕ В· Р’РµС‚РµСЂРёРЅР°СЂРёСЏ", SAFE_NEWS_TAGS[6]],
  ["РўРµС…РЅРёРєР° В· РРЅС„СЂР°СЃС‚СЂСѓРєС‚СѓСЂР°", SAFE_NEWS_TAGS[7]],
  ["Р¤РёРЅР°РЅСЃС‹ В· Р“РѕСЃРїРѕРґРґРµСЂР¶РєР°", SAFE_NEWS_TAGS[8]],
  ["РќР°СѓРєР° В· РўРµС…РЅРѕР»РѕРіРёРё", SAFE_NEWS_TAGS[9]],
  ["Р С‹РЅРѕРє В· РђРЅР°Р»РёС‚РёРєР°", SAFE_NEWS_TAGS[0]],
  ["РЎРѕР±С‹С‚РёСЏ В· РўСЂРµРЅРґС‹", SAFE_NEWS_TAGS[1]],
  ["РџСЂР°РєС‚РёРєР° В· Р“Р°Р№Рґ", SAFE_NEWS_TAGS[2]],
  ["РџРѕР»РёС‚РёРєР° В· Р РµРіСѓР»РёСЂРѕРІР°РЅРёРµ", SAFE_NEWS_TAGS[3]],
  ["Р­РєСЃРїРѕСЂС‚ В· Р›РѕРіРёСЃС‚РёРєР°", SAFE_NEWS_TAGS[4]],
  ["РЈСЂРѕР¶Р°Р№ В· РџРѕРіРѕРґР°", SAFE_NEWS_TAGS[5]],
  ["Р–РёРІРѕС‚РЅРѕРІРѕРґСЃС‚РІРѕ В· Р’РµС‚РµСЂРёРЅР°СЂРёСЏ", SAFE_NEWS_TAGS[6]],
  ["РўРµС…РЅРёРєР° В· РРЅС„СЂР°СЃС‚СЂСѓРєС‚СѓСЂР°", SAFE_NEWS_TAGS[7]],
  ["Р¤РёРЅР°РЅСЃС‹ В· Р“РѕСЃРїРѕРґРґРµСЂР¶РєР°", SAFE_NEWS_TAGS[8]],
  ["РќР°СѓРєР° В· РўРµС…РЅРѕР»РѕРіРёРё", SAFE_NEWS_TAGS[9]]
]);

const NEWS_SYNC_LIMIT = Math.max(1, Number(process.env.NEWS_SYNC_LIMIT || 12));
const NEWS_STARTUP_LIMIT = Math.max(1, Number(process.env.NEWS_STARTUP_LIMIT || 48));
const NEWS_SYNC_INTERVAL_MINUTES = Math.max(5, Number(process.env.NEWS_SYNC_INTERVAL_MINUTES || 30));
const NEWS_SYNC_ON_STARTUP = String(process.env.NEWS_SYNC_ON_STARTUP || "true").trim().toLowerCase() !== "false";
const NEWS_SYNC_SECRET = String(process.env.NEWS_SYNC_TOKEN || "").trim();
const OLLAMA_MODEL = String(process.env.OLLAMA_MODEL || "llama3.2").trim();
const OLLAMA_API_BASE = String(process.env.OLLAMA_API_BASE || "http://127.0.0.1:11434/v1").trim().replace(/\/+$/, "");
const DEFAULT_FETCH_TIMEOUT = 15000;
const NEWS_MAX_ITEMS = 200;
const SITE_SOURCE_NAME = "ЗемледелецЪ";
const NEWS_OUTPUT_LANGUAGE = String(process.env.NEWS_OUTPUT_LANGUAGE || "ru").trim().toLowerCase();
const EXTERNAL_NEWS_SOURCES = [
  {
    name: "Agrotrend",
    type: "html",
    language: "ru",
    siteUrl: "https://agrotrend.ru/",
    listUrl: "https://agrotrend.ru/news",
    articlePattern: /^https?:\/\/agrotrend\.ru\/news\/\d+-[^/?#]+\/?$/i,
    kindHint: "\u041d\u043e\u0432\u043e\u0441\u0442\u044c"
  },
  {
    name: "APK-news",
    type: "html",
    language: "ru",
    siteUrl: "https://www.apk-news.ru/",
    listUrl: "https://www.apk-news.ru/",
    articlePattern: /^https?:\/\/(?:www\.)?apk-news\.ru\/(?!category\/|tag\/|media\/|agrarnoe-stavropole\/|agrarnaya-kuban\/|ea-redirect\/|tehnicheskie-trebovaniya\/|varianty-razmeshheniya-reklamnyh-modulej\/|polzovatelskoe-soglashenie\/|priglashaem-na-rabotu\/|author\/|page\/|wp-content\/|wp-json\/)[^/?#]+\/?$/i,
    kindHint: "\u041d\u043e\u0432\u043e\u0441\u0442\u044c"
  },
  {
    name: "Агроинвестор",
    type: "rss",
    siteUrl: "https://www.agroinvestor.ru/",
    feedUrl: "https://www.agroinvestor.ru/feed/public-agronews.xml",
    kindHint: "Новость"
  },
  {
    name: "Агроинвестор PRO",
    type: "rss",
    siteUrl: "https://www.agroinvestor.ru/",
    feedUrl: "https://www.agroinvestor.ru/feed/public-agrotechnika-articles.xml",
    kindHint: "Статья"
  },
  {
    name: "Агроинвестор Журнал",
    type: "rss",
    siteUrl: "https://www.agroinvestor.ru/",
    feedUrl: "https://www.agroinvestor.ru/feed/public-agroinvestor-articles.xml",
    kindHint: "Статья"
  },
  {
    name: "FAO",
    type: "rss",
    language: "en",
    siteUrl: "https://www.fao.org/newsroom/en",
    feedUrl: "https://www.fao.org/feeds/fao-newsroom-rss",
    kindHint: "Новость"
  },
  {
    name: "USDA",
    type: "rss",
    language: "en",
    siteUrl: "https://www.usda.gov/about-usda/news/press-releases",
    feedUrl: "https://www.usda.gov/rss/latest-releases.xml",
    kindHint: "Пресс-релиз"
  },
  {
    name: "USDA Blog",
    type: "rss",
    language: "en",
    siteUrl: "https://www.usda.gov/about-usda/blog",
    feedUrl: "https://www.usda.gov/rss/latest-blogs.xml",
    kindHint: "Статья"
  }
];

const ROOT_PAGE_FILES = new Set([
  "auth.html",
  "companies.html",
  "company-card.html",
  "events.html",
  "listing-detail.html",
  "marketplace.html",
  "news-detail.html",
  "news.html",
  "profile.html",
  "tenders.html"
]);

let writeQueue = Promise.resolve();
let scheduledNewsSync = null;
let lastNewsSyncSuccessAt = 0;

function loadEnvFile(filePath) {
  if (!fsSync.existsSync(filePath)) {
    return;
  }

  const raw = fsSync.readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^(['"])([\s\S]*)\1$/, "$2");

    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
}

async function readDb() {
  const runtime = runtimeContext.getStore();
  if (runtime) return runtime.readDb();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  return JSON.parse(raw);
}

function writeDb(db) {
  const runtime = runtimeContext.getStore();
  if (runtime) return runtime.writeDb(db);
  writeQueue = writeQueue.then(() =>
    fs.writeFile(DATA_FILE, `${JSON.stringify(db, null, 2)}\n`, "utf8")
  );

  return writeQueue;
}

function hashPassword(password, salt = crypto.randomBytes(12).toString("hex")) {
  const hash = crypto.createHash("sha256").update(`${salt}:${password}`).digest("hex");
  return { salt, hash };
}

function verifyPassword(password, user) {
  const { hash } = hashPassword(password, user.passwordSalt);
  return hash === user.passwordHash;
}

function makeId(prefix) {
  return `${prefix}-${crypto.randomBytes(6).toString("hex")}`;
}

function makeToken() {
  return crypto.randomBytes(24).toString("hex");
}

function slugify(value) {
  const translitMap = new Map([
    ["а", "a"], ["б", "b"], ["в", "v"], ["г", "g"], ["д", "d"], ["е", "e"], ["ё", "e"], ["ж", "zh"], ["з", "z"], ["и", "i"],
    ["й", "y"], ["к", "k"], ["л", "l"], ["м", "m"], ["н", "n"], ["о", "o"], ["п", "p"], ["р", "r"], ["с", "s"], ["т", "t"],
    ["у", "u"], ["ф", "f"], ["х", "h"], ["ц", "c"], ["ч", "ch"], ["ш", "sh"], ["щ", "sch"], ["ъ", ""], ["ы", "y"], ["ь", ""],
    ["э", "e"], ["ю", "yu"], ["я", "ya"]
  ]);

  const latin = value
    .trim()
    .toLowerCase()
    .split("")
    .map((char) => translitMap.get(char) ?? char)
    .join("");

  return latin
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-") || `company-${crypto.randomBytes(3).toString("hex")}`;
}

function ensureUniqueSlug(baseSlug, companies) {
  const existing = new Set(companies.map((company) => company.slug));
  if (!existing.has(baseSlug)) {
    return baseSlug;
  }

  let index = 2;
  let nextSlug = `${baseSlug}-${index}`;
  while (existing.has(nextSlug)) {
    index += 1;
    nextSlug = `${baseSlug}-${index}`;
  }

  return nextSlug;
}

function sanitizeText(value, maxLength = 500) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

function normalizeNewsKindLabel(value) {
  const normalized = sanitizeText(value, 120);
  return LEGACY_NEWS_KIND_MAP.get(normalized) || normalized;
}

function normalizeNewsTagLabel(value) {
  const normalized = sanitizeText(value, 160);
  return LEGACY_NEWS_TAG_MAP.get(normalized) || normalized;
}

function normalizeNewsItemLabels(item) {
  return {
    ...item,
    kind: normalizeNewsKindLabel(item?.kind || ""),
    tag: normalizeNewsTagLabel(item?.tag || "")
  };
}

function getNewsSyncIntervalMs() {
  return NEWS_SYNC_INTERVAL_MINUTES * 60 * 1000;
}

function getLatestKnownNewsSyncAt(db) {
  const persisted = String(db?.newsSync?.lastSuccessAt || "").trim();
  const persistedTs = persisted ? Date.parse(persisted) : NaN;
  if (Number.isFinite(persistedTs)) {
    return persistedTs;
  }

  const importedAtValues = (db?.news || [])
    .map((item) => Date.parse(item?.importedAt || item?.publishedAtIso || ""))
    .filter((value) => Number.isFinite(value));

  if (importedAtValues.length) {
    return Math.max(...importedAtValues);
  }

  return 0;
}

function shouldRunAutomaticNewsSync(db) {
  if (scheduledNewsSync) {
    return false;
  }

  const latestKnownSyncAt = Math.max(lastNewsSyncSuccessAt, getLatestKnownNewsSyncAt(db));
  if (!latestKnownSyncAt) {
    return true;
  }

  return Date.now() - latestKnownSyncAt >= getNewsSyncIntervalMs();
}

function ensureAutomaticNewsSync(db) {
  const runtime = runtimeContext.getStore();
  if (runtime) {
    runtime.scheduleNewsSync(db);
    return;
  }
  if (!shouldRunAutomaticNewsSync(db)) {
    return;
  }

  syncNewsFromSources({ limit: NEWS_SYNC_LIMIT }).catch((error) => {
    console.error(`Автоматическая проверка новостей завершилась ошибкой: ${error.message}`);
  });
}

function normalizeWhitespace(value) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtmlEntities(value) {
  const normalized = String(value ?? "");
  const entities = new Map([
    ["&amp;", "&"],
    ["&lt;", "<"],
    ["&gt;", ">"],
    ["&quot;", "\""],
    ["&#39;", "'"],
    ["&nbsp;", " "],
    ["&laquo;", "«"],
    ["&raquo;", "»"],
    ["&ndash;", "–"],
    ["&mdash;", "—"],
    ["&hellip;", "…"]
  ]);

  return normalized.replace(/&[a-z#0-9]+;/gi, (match) => {
    if (entities.has(match)) {
      return entities.get(match);
    }

    const numeric = match.match(/^&#(\d+);$/);
    if (numeric) {
      return String.fromCodePoint(Number(numeric[1]));
    }

    const hex = match.match(/^&#x([0-9a-f]+);$/i);
    if (hex) {
      return String.fromCodePoint(parseInt(hex[1], 16));
    }

    return match;
  });
}

function stripHtml(value) {
  return normalizeWhitespace(
    decodeHtmlEntities(
      String(value ?? "")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
        .replace(/<!--[\s\S]*?-->/g, " ")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(p|div|section|article|li|h1|h2|h3|h4|h5|h6)>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
    )
  );
}

function parseIsoDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function formatRuDate(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return "Дата уточняется";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function formatReadTime(minutes) {
  const safeMinutes = Math.max(1, Number(minutes) || 1);
  const mod10 = safeMinutes % 10;
  const mod100 = safeMinutes % 100;
  const suffix = mod10 === 1 && mod100 !== 11
    ? "минута"
    : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
      ? "минуты"
      : "минут";
  return `${safeMinutes} ${suffix}`;
}

function estimateReadTimeMinutes(text) {
  const words = normalizeWhitespace(text).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

function canUseOllama() {
  return Boolean(OLLAMA_API_BASE && OLLAMA_MODEL && (!runtimeContext.getStore() || process.env.OLLAMA_API_BASE));
}

async function validateOllamaConfig() {
  if (!canUseOllama()) {
    console.log("Ollama is not configured, foreign news translation is disabled.");
    return false;
  }

  try {
    const response = await fetch(`${OLLAMA_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        temperature: 0,
        max_tokens: 20,
        messages: [
          {
            role: "user",
            content: "Reply with the single word OK."
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Ollama validation failed: ${response.status} ${truncateText(errorText, 240)}`);
      return false;
    }

    console.log(`Ollama is ready: ${OLLAMA_MODEL} @ ${OLLAMA_API_BASE}`);
    return true;
  } catch (error) {
    console.error(`Ollama validation failed: ${error.message}`);
    return false;
  }
}

async function fetchText(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || DEFAULT_FETCH_TIMEOUT);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "ZemledeletsNewsBot/1.0",
        "Accept": options.accept || "*/*",
        ...options.headers
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Источник ${url} вернул ${response.status}.`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function extractXmlTag(block, tagName) {
  const match = block.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  if (!match) {
    return "";
  }

  return normalizeWhitespace(
    decodeHtmlEntities(
      match[1]
        .replace(/^<!\[CDATA\[/, "")
        .replace(/\]\]>$/, "")
    )
  );
}

function parseRssItems(xml) {
  const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];
  return items.map((itemXml) => ({
    title: extractXmlTag(itemXml, "title"),
    link: extractXmlTag(itemXml, "link"),
    description: stripHtml(extractXmlTag(itemXml, "description")),
    author: extractXmlTag(itemXml, "author") || extractXmlTag(itemXml, "dc:creator"),
    publishedAtIso: parseIsoDate(extractXmlTag(itemXml, "pubDate")),
    category: extractXmlTag(itemXml, "category"),
    imageUrl: extractImageUrl(itemXml)
  }));
}

function resolveAbsoluteUrl(rawUrl, baseUrl = "") {
  const normalizedUrl = decodeHtmlEntities(String(rawUrl || "")).trim();
  if (!normalizedUrl) {
    return "";
  }

  try {
    return baseUrl ? new URL(normalizedUrl, baseUrl).toString() : normalizedUrl;
  } catch {
    return "";
  }
}

function stripTrailingListDate(value) {
  return normalizeWhitespace(
    String(value ?? "")
      .replace(/\s+\d{1,2}[./]\d{1,2}[./]\d{4}(?:\s*(?:г\.?)?)?(?:\s+\d{1,2}:\d{2})?$/i, "")
  );
}

function parseLooseDate(value) {
  const match = String(value ?? "").match(/(\d{1,2})[./](\d{1,2})[./](\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (!match) {
    return null;
  }

  const [, day, month, year, hours = "12", minutes = "00"] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes)));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function parseHtmlSourceItems(html, source, perSourceLimit) {
  const anchors = [...String(html ?? "").matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  const seen = new Set();
  const items = [];

  for (const match of anchors) {
    const externalUrl = resolveAbsoluteUrl(match[1], source.listUrl || source.siteUrl);
    if (!externalUrl || !source.articlePattern?.test(externalUrl) || seen.has(externalUrl)) {
      continue;
    }

    const body = normalizeWhitespace(stripHtml(match[2]));
    const title = sanitizeText(stripTrailingListDate(body), 180);
    if (title.length < 16) {
      continue;
    }

    seen.add(externalUrl);
    items.push({
      sourceName: source.name,
      sourceUrl: source.siteUrl,
      listUrl: source.listUrl,
      title,
      description: "",
      author: source.name,
      externalUrl,
      publishedAtIso: parseLooseDate(body) || null,
      kindHint: source.kindHint,
      imageUrl: "",
      sourceLanguage: source.language || ""
    });

    if (items.length >= perSourceLimit) {
      break;
    }
  }

  return items;
}

function extractImageUrl(content, baseUrl = "") {
  const source = String(content ?? "");
  const patterns = [
    /<media:content[^>]+url=["']([^"']+)["']/i,
    /<media:thumbnail[^>]+url=["']([^"']+)["']/i,
    /<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image\//i,
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
    /<img[^>]+src=["']([^"']+)["']/i
  ];

  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (!match?.[1]) {
      continue;
    }

    const rawUrl = decodeHtmlEntities(match[1]).trim();
    if (!rawUrl) {
      continue;
    }

    try {
      return baseUrl ? new URL(rawUrl, baseUrl).toString() : rawUrl;
    } catch {
      return rawUrl;
    }
  }

  return "";
}

function extractMetaContent(html, attributeName, attributeValue) {
  const source = String(html ?? "");
  const pattern = new RegExp(
    `<meta[^>]+${attributeName}=["']${attributeValue}["'][^>]+content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]+${attributeName}=["']${attributeValue}["']`,
    "i"
  );
  const match = source.match(pattern);
  return normalizeWhitespace(decodeHtmlEntities(match?.[1] || match?.[2] || ""));
}

function extractJsonLdValue(html, fieldName) {
  const match = String(html ?? "").match(new RegExp(`"${fieldName}"\\s*:\\s*"([^"]+)"`, "i"));
  return normalizeWhitespace(decodeHtmlEntities(match?.[1] || ""));
}

function extractJsonLdAuthor(html) {
  const source = String(html ?? "");
  const directMatch = source.match(/"author"\s*:\s*"([^"]+)"/i);
  if (directMatch?.[1]) {
    return normalizeWhitespace(decodeHtmlEntities(directMatch[1]));
  }

  const nestedMatch = source.match(/"author"\s*:\s*(?:\[[^\]]*?\{|\{)[\s\S]*?"name"\s*:\s*"([^"]+)"/i);
  return normalizeWhitespace(decodeHtmlEntities(nestedMatch?.[1] || ""));
}

function parseArticleMetadata(html, url = "") {
  const publishedAtIso = parseIsoDate(
    extractMetaContent(html, "property", "article:published_time") ||
    extractMetaContent(html, "name", "article:published_time") ||
    extractMetaContent(html, "itemprop", "datePublished") ||
    extractJsonLdValue(html, "datePublished")
  ) || parseIsoDate((String(html ?? "").match(/<time\b[^>]*datetime=["']([^"']+)["']/i) || [])[1]);

  const author = normalizeWhitespace(
    extractMetaContent(html, "name", "author") ||
    extractMetaContent(html, "property", "author") ||
    extractJsonLdAuthor(html)
  );

  const title = normalizeWhitespace(
    extractMetaContent(html, "property", "og:title") ||
    extractJsonLdValue(html, "headline")
  );

  const description = normalizeWhitespace(
    extractMetaContent(html, "property", "og:description") ||
    extractMetaContent(html, "name", "description")
  );

  return {
    title,
    description,
    author,
    publishedAtIso,
    imageUrl: extractImageUrl(html, url)
  };
}

function hasCyrillicText(value) {
  return /[А-Яа-яЁё]/.test(String(value ?? ""));
}

function getDefaultNewsAuthor(sourceName = SITE_SOURCE_NAME) {
  const safeSourceName = sanitizeText(sourceName || SITE_SOURCE_NAME, 120) || SITE_SOURCE_NAME;
  return safeSourceName === SITE_SOURCE_NAME ? `Редакция ${SITE_SOURCE_NAME}` : safeSourceName;
}

function normalizeNewsAuthor(author, sourceName = SITE_SOURCE_NAME) {
  const safeSourceName = sanitizeText(sourceName || SITE_SOURCE_NAME, 120) || SITE_SOURCE_NAME;
  const rawAuthor = sanitizeText(author || "", 120);

  if (!rawAuthor) {
    return getDefaultNewsAuthor(safeSourceName);
  }

  if (safeSourceName !== SITE_SOURCE_NAME) {
    if (new RegExp(`^редакция\\s+${safeSourceName}$`, "i").test(rawAuthor) || /^редакция$/i.test(rawAuthor)) {
      return safeSourceName;
    }

    return rawAuthor.replace(/^редакция\s+/i, "").trim() || safeSourceName;
  }

  return rawAuthor;
}

function extractReadableParagraphs(html, maxCount = 5) {
  const text = String(html ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|section|article|li|h1|h2|h3|h4|h5|h6)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n");

  const plain = decodeHtmlEntities(text).replace(/<[^>]+>/g, " ");
  const lines = plain
    .split(/\n+/)
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean)
    .filter((line) => line.length >= 70 && line.length <= 700)
    .filter((line) => !/cookie|privacy|подпис|зарегистр|реклам|политик|consent/i.test(line));

  return [...new Set(lines)].slice(0, maxCount);
}

function extractArticleBodySection(html) {
  const source = String(html ?? "");
  const markers = [
    'itemprop="articleBody"',
    "class=\"article__body\"",
    "class='article__body'"
  ];

  const startIndex = markers
    .map((marker) => source.indexOf(marker))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];

  if (startIndex === undefined) {
    return "";
  }

  const openTagStart = source.lastIndexOf("<", startIndex);
  const contentStart = source.indexOf(">", startIndex);
  if (openTagStart < 0 || contentStart < 0) {
    return "";
  }

  const endMarkers = [
    'class="article__footer"',
    "class='article__footer'",
    "</article>",
    '<section class="read-next"',
    "<section class=\"read-next\""
  ];

  const sectionEnd = endMarkers
    .map((marker) => source.indexOf(marker, contentStart + 1))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];

  return source.slice(contentStart + 1, sectionEnd > 0 ? sectionEnd : undefined);
}

function extractParagraphsFromHtml(html, maxCount = 18) {
  const source = String(html ?? "");
  const paragraphs = [...source.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => stripHtml(match[1]))
    .map((paragraph) => normalizeWhitespace(paragraph))
    .filter(Boolean)
    .filter((paragraph) => paragraph.length >= 35)
    .filter((paragraph) => !/cookie|privacy|подпис|зарегистр|реклам|consent/i.test(paragraph));

  return [...new Set(paragraphs)].slice(0, maxCount);
}

function extractParagraphsFromText(text, maxCount = 12) {
  return [...new Set(
    String(text ?? "")
      .split(/\n+/)
      .map((paragraph) => normalizeWhitespace(paragraph))
      .filter(Boolean)
      .filter((paragraph) => paragraph.length >= 35)
  )].slice(0, maxCount);
}

function isAgricultureRelevant(text) {
  const haystack = normalizeWhitespace(text).toLowerCase();
  const keywords = [
    "agro", "agri", "farm", "farming", "agriculture", "agrifood", "grain", "harvest", "wheat",
    "fertilizer", "livestock", "crop", "seed", "tractor", "food security",
    "агро", "сельхоз", "сельск", "урож", "зерн", "пшени", "семен", "удобрен", "животнов",
    "ветеринар", "посевн", "трактор", "логистик", "экспорт", "минсельхоз"
  ];

  return keywords.some((keyword) => haystack.includes(keyword));
}

function inferNewsTag(text) {
  const haystack = normalizeWhitespace(text).toLowerCase();
  const checks = [
    ["Политика · Регулирование", ["law", "policy", "regulation", "ministry", "government", "господдерж", "закон", "регулирован", "минсельхоз", "субсид"]],
    ["Экспорт · Логистика", ["export", "shipment", "port", "logistics", "rail", "экспорт", "поставка", "логист", "порт", "перевоз"]],
    ["Урожай · Погода", ["weather", "harvest", "drought", "rain", "forecast", "урож", "погод", "засух", "осад", "посевн"]],
    ["Животноводство · Ветеринария", ["livestock", "dairy", "cattle", "veter", "swine", "животнов", "молок", "коров", "ветеринар", "свин"]],
    ["Техника · Инфраструктура", ["tractor", "machinery", "equipment", "storage", "элеватор", "техник", "машин", "оборуд", "инфраструкт"]],
    ["Финансы · Господдержка", ["investment", "credit", "subsid", "fund", "finance", "финанс", "инвест", "кредит", "субсид", "грант"]],
    ["Наука · Технологии", ["research", "technology", "innovation", "science", "наук", "технолог", "исследован", "селекц"]],
    ["Практика · Гайд", ["guide", "how to", "tips", "practice", "кейс", "гайд", "практик", "совет"]],
    ["События · Тренды", ["forum", "conference", "event", "trend", "summit", "выстав", "форум", "конференц", "мероприят", "тренд"]],
    ["Рынок · Аналитика", ["market", "price", "demand", "supply", "рын", "аналит", "цен", "спрос", "предложен"]]
  ];

  const found = checks.find(([, words]) => words.some((word) => haystack.includes(word)));
  return normalizeNewsTagLabel(found?.[0] || SAFE_NEWS_TAGS[0]);
}

function inferNewsKind(item) {
  const text = `${item.title} ${item.description} ${item.sourceName} ${item.author}`;
  const haystack = normalizeWhitespace(text).toLowerCase();
  if (/press release|пресс-релиз|news release|official release/.test(haystack)) {
    return "Пресс-релиз";
  }

  if (/analysis|аналит|outlook|forecast|report/.test(haystack)) {
    return "Аналитика";
  }

  if (/guide|статья|интервью|story|feature/.test(haystack)) {
    return "Статья";
  }

  return normalizeNewsKindLabel(item.kindHint || SAFE_NEWS_KINDS[0]);
}

function fallbackNewsEnrichment(item, textSample) {
  const combinedText = normalizeWhitespace([item.title, item.description, textSample].filter(Boolean).join(" "));
  const minutes = estimateReadTimeMinutes(combinedText);
  const paragraphs = extractParagraphsFromText(textSample, 12);

  return {
    kind: inferNewsKind(item),
    tag: inferNewsTag(combinedText),
    title: sanitizeText(item.title, 180),
    author: normalizeNewsAuthor(item.author, item.sourceName),
    summary: sanitizeText(item.description || item.title, 280),
    readTimeMinutes: minutes,
    body: paragraphs.length ? paragraphs : [item.description || item.title],
    aiProcessed: false
  };
}

async function classifyNewsWithOllamaLegacy(item, textSample) {
  const model = OLLAMA_MODEL;
  if (!model) {
    return fallbackNewsEnrichment(item, textSample);
  }

  const articleText = normalizeWhitespace([
    `Источник: ${item.sourceName}`,
    `Заголовок: ${item.title}`,
    item.description ? `Краткое описание: ${item.description}` : "",
    textSample ? `Фрагменты текста: ${textSample}` : ""
  ].filter(Boolean).join("\n\n"));

  const response = await fetch(`${OLLAMA_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.15,
      max_tokens: 1400,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Ты редактор аграрной B2B-платформы. На входе новость или статья из внешнего источника. " +
            "Нужно вернуть только JSON без пояснений. " +
            `kind должен быть одним из: ${NEWS_KINDS.join(", ")}. ` +
            `tag должен быть одним из: ${NEWS_TAGS.join(", ")}. ` +
            `title переведи на ${NEWS_OUTPUT_LANGUAGE === "ru" ? "русский" : NEWS_OUTPUT_LANGUAGE} и сделай редакционно аккуратным без искажения смысла. ` +
            "summary напиши по-русски, нейтрально и делово, 1-2 предложения, без выдуманных фактов. " +
            "body верни как массив из 2-4 абзацев по-русски, только пересказ фактов из текста. " +
            "author либо имя автора/организации, если оно явно видно, либо название источника без слова 'Редакция'. " +
            "readTimeMinutes верни как целое число минут чтения этой версии материала."
        },
        {
          role: "user",
          content: articleText
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama returned ${response.status}.`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content || "{}";
  const parsed = JSON.parse(content);

  return {
    kind: SAFE_NEWS_KINDS.includes(parsed.kind) ? parsed.kind : inferNewsKind(item),
    tag: SAFE_NEWS_TAGS.includes(parsed.tag) ? parsed.tag : inferNewsTag(articleText),
    title: sanitizeText(parsed.title || item.title, 180),
    author: normalizeNewsAuthor(parsed.author || item.author, item.sourceName),
    summary: sanitizeText(parsed.summary || item.description || item.title, 320),
    readTimeMinutes: Math.max(1, Math.min(20, Number(parsed.readTimeMinutes) || estimateReadTimeMinutes(articleText))),
    body: Array.isArray(parsed.body)
      ? parsed.body.map((paragraph) => sanitizeText(paragraph, 2200)).filter(Boolean).slice(0, 8)
      : [],
    aiProcessed: true
  };
}

async function classifyNewsWithOllama(item, textSample) {
  if (!canUseOllama()) {
    return fallbackNewsEnrichment(item, textSample);
  }

  const articleText = normalizeWhitespace([
    `Source: ${item.sourceName}`,
    `Title: ${item.title}`,
    item.description ? `Summary: ${item.description}` : "",
    textSample ? `Article excerpt: ${textSample}` : ""
  ].filter(Boolean).join("\n\n"));

  const response = await fetch(`${OLLAMA_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-request-id": crypto.randomUUID()
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      temperature: 0.15,
      max_tokens: 1400,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an editor of an agricultural B2B platform. " +
            "Return only valid JSON without markdown or explanations. " +
            `kind must be one of: ${SAFE_NEWS_KINDS.join(", ")}. ` +
            `tag must be one of: ${SAFE_NEWS_TAGS.join(", ")}. ` +
            `Translate title, summary and body to ${NEWS_OUTPUT_LANGUAGE}. ` +
            "Keep the meaning accurate, avoid invented facts, and write in a calm editorial tone. " +
            "summary must be 1-2 sentences. " +
            "body must be an array of 2-4 paragraphs based only on the provided text. " +
            "author should be a visible author or organization name; otherwise use the source name without the word 'Редакция'. " +
            "readTimeMinutes must be an integer for the translated version. " +
            "Use this JSON schema: " +
            "{\"kind\":\"...\",\"tag\":\"...\",\"title\":\"...\",\"author\":\"...\",\"summary\":\"...\",\"readTimeMinutes\":1,\"body\":[\"...\"]}"
        },
        {
          role: "user",
          content: articleText
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama returned ${response.status}: ${truncateText(errorText, 240)}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  const serializedContent = Array.isArray(content)
    ? content
        .map((part) => {
          if (typeof part === "string") {
            return part;
          }

          if (part?.type === "text") {
            return part.text || "";
          }

          return "";
        })
        .join("")
    : String(content || "{}");
  const parsed = JSON.parse(serializedContent);

  return {
    kind: SAFE_NEWS_KINDS.includes(parsed.kind) ? parsed.kind : inferNewsKind(item),
    tag: SAFE_NEWS_TAGS.includes(parsed.tag) ? parsed.tag : inferNewsTag(articleText),
    title: sanitizeText(parsed.title || item.title, 180),
    author: normalizeNewsAuthor(parsed.author || item.author, item.sourceName),
    summary: sanitizeText(parsed.summary || item.description || item.title, 320),
    readTimeMinutes: Math.max(1, Math.min(20, Number(parsed.readTimeMinutes) || estimateReadTimeMinutes(articleText))),
    body: Array.isArray(parsed.body)
      ? parsed.body.map((paragraph) => sanitizeText(paragraph, 2200)).filter(Boolean).slice(0, 8)
      : [],
    aiProcessed: true
  };
}

async function enrichExternalNewsItem(item, textSample) {
  if (!canUseOllama()) {
    return fallbackNewsEnrichment(item, textSample);
  }

  try {
    return await classifyNewsWithOllama(item, textSample);
  } catch {
    return fallbackNewsEnrichment(item, textSample);
  }
}

async function fetchArticlePreview(url) {
  if (!url) {
    return { text: "", imageUrl: "", paragraphs: [], publishedAtIso: null, author: "", title: "", description: "" };
  }

  try {
    const html = await fetchText(url, { accept: "text/html,application/xhtml+xml", timeoutMs: 12000 });
    const metadata = parseArticleMetadata(html, url);
    const articleSection = extractArticleBodySection(html);
    const paragraphs = extractParagraphsFromHtml(articleSection || html, 18);
    const text = paragraphs.join("\n\n") || extractReadableParagraphs(html, 8).join("\n\n");
    return {
      text,
      imageUrl: metadata.imageUrl || extractImageUrl(articleSection || html, url) || extractImageUrl(html, url),
      paragraphs,
      publishedAtIso: metadata.publishedAtIso || null,
      author: metadata.author || "",
      title: metadata.title || "",
      description: metadata.description || ""
    };
  } catch {
    return { text: "", imageUrl: "", paragraphs: [], publishedAtIso: null, author: "", title: "", description: "" };
  }
}

async function fetchRssSource(source, perSourceLimit) {
  try {
    const xml = await fetchText(source.feedUrl, {
      accept: "application/rss+xml, application/xml, text/xml, */*"
    });
    return parseRssItems(xml)
      .filter((item) => item.link && item.title)
      .map((item) => ({
        sourceName: source.name,
        sourceUrl: source.siteUrl,
        feedUrl: source.feedUrl,
        title: item.title,
        description: item.description,
        author: item.author,
        externalUrl: item.link,
        publishedAtIso: item.publishedAtIso || new Date().toISOString(),
        kindHint: source.kindHint,
        imageUrl: item.imageUrl,
        sourceLanguage: source.language || ""
      }))
      .filter((item) => isAgricultureRelevant(`${item.title} ${item.description}`))
      .slice(0, perSourceLimit);
  } catch {
    return [];
  }
}

async function fetchHtmlSource(source, perSourceLimit) {
  try {
    const html = await fetchText(source.listUrl, {
      accept: "text/html,application/xhtml+xml"
    });

    return parseHtmlSourceItems(html, source, perSourceLimit)
      .filter((item) => isAgricultureRelevant(item.title));
  } catch {
    return [];
  }
}

function dedupeExternalItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = getExternalNewsKey(item);
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function getExternalNewsKey(item) {
  const url = normalizeWhitespace(String(item?.externalUrl || item?.link || ""));
  if (url) {
    return url.toLowerCase();
  }

  return `${normalizeWhitespace(String(item?.sourceName || ""))}::${normalizeWhitespace(String(item?.title || ""))}`.toLowerCase();
}

async function collectExternalNews(limit = NEWS_SYNC_LIMIT) {
  const perSourceLimit = Math.max(2, Math.ceil(limit * 1.5));
  const batches = await Promise.all(
    EXTERNAL_NEWS_SOURCES.map((source) => (
      source.type === "html"
        ? fetchHtmlSource(source, perSourceLimit)
        : fetchRssSource(source, perSourceLimit)
    ))
  );

  return dedupeExternalItems(
    batches
      .flat()
      .sort((a, b) => (b.publishedAtIso || "").localeCompare(a.publishedAtIso || ""))
  ).slice(0, limit * 2);
}

async function syncNewsFromSources({ limit = NEWS_SYNC_LIMIT } = {}) {
  if (scheduledNewsSync) {
    return scheduledNewsSync;
  }

  scheduledNewsSync = (async () => {
    const db = await readDb();
    const syncStartedAt = new Date().toISOString();
    const externalItems = await collectExternalNews(limit);
    const existingNews = Array.isArray(db.news) ? db.news : [];
    const existingItems = new Map(
      existingNews.map((item, index) => [
        getExternalNewsKey(item),
        { item, index }
      ])
    );

    const imported = [];
    const updated = [];
    const skipped = [];

    for (const sourceItem of externalItems) {
      if (imported.length >= limit) {
        break;
      }

      const key = getExternalNewsKey(sourceItem);
      const existingEntry = existingItems.get(key);
      const articlePreview = await fetchArticlePreview(sourceItem.externalUrl);
      const previewText = articlePreview.text || "";
      const previewParagraphs = Array.isArray(articlePreview.paragraphs) ? articlePreview.paragraphs : [];
      const sourceTitle = sourceItem.title || articlePreview.title || "";
      const sourceDescription = sourceItem.description || articlePreview.description || "";
      const sourceAuthor = sourceItem.author || articlePreview.author || sourceItem.sourceName;
      const sourceLanguage = (sourceItem.sourceLanguage || "").trim().toLowerCase();
      const sourceText = `${sourceTitle} ${sourceDescription} ${previewText}`.trim();
      const shouldTranslate = Boolean(
        sourceLanguage && sourceLanguage !== NEWS_OUTPUT_LANGUAGE
      ) || (NEWS_OUTPUT_LANGUAGE === "ru" && sourceText && !hasCyrillicText(sourceText));

      if (shouldTranslate && !canUseOllama()) {
        skipped.push(sourceItem.externalUrl);
        continue;
      }

      const enriched = await enrichExternalNewsItem({
        ...sourceItem,
        title: sourceTitle,
        description: sourceDescription,
        author: sourceAuthor
      }, previewText);
      if (shouldTranslate && !enriched.aiProcessed) {
        skipped.push(sourceItem.externalUrl);
        continue;
      }

      const publishedAtIso = sourceItem.publishedAtIso || articlePreview.publishedAtIso || new Date().toISOString();
      const readTimeMinutes = Math.max(
        1,
        Number(enriched.readTimeMinutes) || estimateReadTimeMinutes(previewText || sourceDescription)
      );
      const summary = sanitizeText(enriched.summary || sourceDescription || sourceTitle, 320);
      const body = (enriched.body || [])
        .map((paragraph) => sanitizeText(paragraph, 2200))
        .filter(Boolean)
        .filter((paragraph) => normalizeWhitespace(paragraph).toLowerCase() !== normalizeWhitespace(summary).toLowerCase())
        .slice(0, 12);

      const newsItem = {
        id: existingEntry?.item?.id || makeId("news"),
        kind: normalizeNewsKindLabel(SAFE_NEWS_KINDS.includes(enriched.kind) ? enriched.kind : inferNewsKind(sourceItem)),
        tag: normalizeNewsTagLabel(SAFE_NEWS_TAGS.includes(enriched.tag) ? enriched.tag : inferNewsTag(`${sourceTitle} ${sourceDescription} ${previewText}`)),
        title: sanitizeText(enriched.title || sourceTitle, 180),
        summary,
        publishedAt: formatRuDate(publishedAtIso),
        publishedAtIso,
        readTimeMinutes,
        readTime: formatReadTime(readTimeMinutes),
        body,
        author: normalizeNewsAuthor(enriched.author || sourceAuthor, sourceItem.sourceName),
        sourceName: sourceItem.sourceName,
        sourceUrl: sourceItem.sourceUrl,
        externalUrl: sourceItem.externalUrl,
        coverImage: sourceItem.imageUrl || articlePreview.imageUrl || existingEntry?.item?.coverImage || "",
        translated: shouldTranslate,
        originalLanguage: sourceLanguage || (shouldTranslate ? "en" : NEWS_OUTPUT_LANGUAGE),
        originalTitle: sanitizeText(sourceTitle, 180),
        translationProvider: shouldTranslate && enriched.aiProcessed ? "Ollama" : "",
        sourceType: "external",
        importedAt: new Date().toISOString()
      };

      if (!newsItem.body.length) {
        newsItem.body = previewParagraphs.length
          ? previewParagraphs
            .map((paragraph) => sanitizeText(paragraph, 2200))
            .filter(Boolean)
            .filter((paragraph) => normalizeWhitespace(paragraph).toLowerCase() !== normalizeWhitespace(summary).toLowerCase())
            .slice(0, 12)
          : [];
      }

      if (!newsItem.body.length) {
        skipped.push(sourceItem.externalUrl);
        continue;
      }

      if (existingEntry) {
        existingNews[existingEntry.index] = {
          ...existingEntry.item,
          ...newsItem
        };
        updated.push(newsItem);
        continue;
      }

      existingNews.unshift(newsItem);
      imported.push(newsItem);
    }

    db.news = existingNews
      .sort((a, b) => String(b.publishedAtIso || "").localeCompare(String(a.publishedAtIso || "")))
      .slice(0, NEWS_MAX_ITEMS);

    db.newsSync = {
      lastAttemptAt: syncStartedAt,
      lastSuccessAt: new Date().toISOString(),
      importedCount: imported.length,
      updatedCount: updated.length,
      skippedCount: skipped.length
    };

    lastNewsSyncSuccessAt = Date.parse(db.newsSync.lastSuccessAt) || Date.now();

    await writeDb(db);

    return {
      importedCount: imported.length,
      updatedCount: updated.length,
      skippedCount: skipped.length,
      items: imported
    };
  })();

  try {
    return await scheduledNewsSync;
  } finally {
    scheduledNewsSync = null;
  }
}

function isSyncAuthorized(req, body, url) {
  if (!NEWS_SYNC_SECRET) {
    return true;
  }

  const token = String(
    req.headers["x-sync-token"] ||
    body?.token ||
    url.searchParams.get("token") ||
    ""
  ).trim();

  return token === NEWS_SYNC_SECRET;
}

function startNewsSyncSchedule() {
  const intervalMs = NEWS_SYNC_INTERVAL_MINUTES * 60 * 1000;

  if (NEWS_SYNC_ON_STARTUP) {
    syncNewsFromSources({ limit: NEWS_STARTUP_LIMIT }).catch((error) => {
      console.error(`Стартовая синхронизация новостей завершилась ошибкой: ${error.message}`);
    });
  }

  return setInterval(() => {
    syncNewsFromSources({ limit: NEWS_SYNC_LIMIT }).catch((error) => {
      console.error(`Плановая синхронизация новостей завершилась ошибкой: ${error.message}`);
    });
  }, intervalMs);
}

async function parseJsonBody(req) {
  const chunks = [];
  let total = 0;

  for await (const chunk of req) {
    total += chunk.length;
    if (total > 1024 * 1024) {
      throw new Error("Размер запроса превышает 1 МБ.");
    }
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("Некорректный JSON в теле запроса.");
  }
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, JSON_HEADERS);
  res.end(JSON.stringify(payload));
}

function getAuthToken(req, url) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }

  const tokenFromQuery = url.searchParams.get("token");
  return tokenFromQuery ? tokenFromQuery.trim() : "";
}

function getCompanyById(db, companyId) {
  return db.companies.find((company) => company.id === companyId) ?? null;
}

function buildPublicCompany(company) {
  return {
    id: company.id,
    slug: company.slug,
    name: company.name,
    city: company.city,
    region: company.region,
    founded: company.founded,
    verified: company.verified,
    activeOffersLabel: company.activeOffersLabel,
    activeOffers: company.activeOffers,
    description: company.description,
    catalogSummary: company.catalogSummary,
    about: company.about,
    specialties: company.specialties,
    phone: company.phone,
    email: company.email,
    managerHours: company.managerHours
  };
}

function buildMarketplaceItem(db, item) {
  const company = getCompanyById(db, item.companyId);
  return {
    ...item,
    company: company ? buildPublicCompany(company) : null
  };
}

function buildTenderItem(db, item) {
  const company = getCompanyById(db, item.companyId);
  return {
    ...item,
    company: company ? buildPublicCompany(company) : null
  };
}

function buildProfile(db, companyId) {
  const company = getCompanyById(db, companyId);
  if (!company) {
    return null;
  }

  const ownOffers = db.marketplace.filter((item) => item.companyId === companyId);
  const ownTenders = db.tenders.filter((item) => item.companyId === companyId);
  const activity = db.activity.filter((item) => item.companyId === companyId);

  return {
    company: buildPublicCompany(company),
    status: company.profileStatus,
    stats: {
      offers: Math.max(ownOffers.length, company.activeOffers || 0),
      responses: company.responseCount || 0,
      tenders: ownTenders.length
    },
    activity,
    offers: ownOffers.map((item) => buildMarketplaceItem(db, item)),
    tenders: ownTenders.map((item) => buildTenderItem(db, item))
  };
}

function buildSessionUser(db, session) {
  const user = db.users.find((item) => item.id === session.userId);
  if (!user) {
    return null;
  }

  const company = getCompanyById(db, user.companyId);
  if (!company) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    company: buildPublicCompany(company)
  };
}

async function getSessionUser(req, url, db) {
  const token = getAuthToken(req, url);
  if (!token) {
    return null;
  }

  const session = db.sessions.find((item) => item.token === token);
  if (!session) {
    return null;
  }

  return {
    token,
    user: buildSessionUser(db, session)
  };
}

async function handleApi(req, res, url) {
  const db = await readDb();
  const pathname = url.pathname;

  if (req.method === "GET" && pathname === "/api/bootstrap") {
    const session = await getSessionUser(req, url, db);
    return sendJson(res, 200, {
      siteMetrics: db.siteMetrics,
      user: session?.user ?? null
    });
  }

  if (req.method === "GET" && pathname === "/api/marketplace") {
    return sendJson(res, 200, {
      items: db.marketplace.map((item) => buildMarketplaceItem(db, item))
    });
  }

  if (req.method === "GET" && pathname.startsWith("/api/marketplace/")) {
    const itemId = pathname.slice("/api/marketplace/".length);
    const item = db.marketplace.find((entry) => entry.id === itemId);

    if (!item) {
      return sendJson(res, 404, { error: "Предложение не найдено." });
    }

    return sendJson(res, 200, {
      item: buildMarketplaceItem(db, item)
    });
  }

  if (req.method === "GET" && pathname === "/api/tenders") {
    return sendJson(res, 200, {
      items: db.tenders.map((item) => buildTenderItem(db, item))
    });
  }

  if (req.method === "GET" && pathname.startsWith("/api/tenders/")) {
    const itemId = pathname.slice("/api/tenders/".length);
    const item = db.tenders.find((entry) => entry.id === itemId);

    if (!item) {
      return sendJson(res, 404, { error: "Закупка не найдена." });
    }

    return sendJson(res, 200, {
      item: buildTenderItem(db, item)
    });
  }

  if (req.method === "GET" && pathname === "/api/companies") {
    return sendJson(res, 200, {
      items: db.companies.map((company) => buildPublicCompany(company))
    });
  }

  if (req.method === "GET" && pathname.startsWith("/api/companies/")) {
    const slug = pathname.slice("/api/companies/".length);
    const company = db.companies.find((item) => item.slug === slug);

    if (!company) {
      return sendJson(res, 404, { error: "Компания не найдена." });
    }

    const offers = db.marketplace
      .filter((item) => item.companyId === company.id)
      .map((item) => buildMarketplaceItem(db, item));

    return sendJson(res, 200, {
      company: buildPublicCompany(company),
      offers
    });
  }

  if (req.method === "GET" && pathname === "/api/news") {
    ensureAutomaticNewsSync(db);
    return sendJson(res, 200, {
      items: db.news.map((item) => normalizeNewsItemLabels(item)),
      taxonomy: {
        kinds: SAFE_NEWS_KINDS,
        tags: SAFE_NEWS_TAGS
      },
      sync: db.newsSync || null
    });
  }

  if (req.method === "POST" && pathname === "/api/news/sync") {
    const body = await parseJsonBody(req);
    if (!isSyncAuthorized(req, body, url)) {
      return sendJson(res, 403, { error: "Синхронизация новостей запрещена." });
    }

    const limit = Math.max(1, Math.min(NEWS_MAX_ITEMS, Number(body.limit) || NEWS_SYNC_LIMIT));
    const result = await syncNewsFromSources({ limit });
    return sendJson(res, 200, {
      message: result.importedCount
        ? `Импортировано ${result.importedCount} материалов.`
        : "Новых материалов не найдено.",
      importedCount: result.importedCount,
      skippedCount: result.skippedCount,
      items: result.items.map((item) => normalizeNewsItemLabels(item)),
      taxonomy: {
        kinds: SAFE_NEWS_KINDS,
        tags: SAFE_NEWS_TAGS
      }
    });
  }

  if (req.method === "GET" && pathname === "/api/events") {
    return sendJson(res, 200, {
      items: db.events
    });
  }

  if (req.method === "POST" && pathname === "/api/auth/register") {
    const body = await parseJsonBody(req);
    const companyName = sanitizeText(body.companyName, 120);
    const email = sanitizeText(body.email, 160).toLowerCase();
    const password = String(body.password ?? "");
    const description = sanitizeText(body.description, 600);

    if (!companyName || !email || !password || !description) {
      return sendJson(res, 400, { error: "Заполните все поля регистрации." });
    }

    if (!email.includes("@")) {
      return sendJson(res, 400, { error: "Укажите корректный e-mail." });
    }

    if (password.length < 6) {
      return sendJson(res, 400, { error: "Пароль должен содержать минимум 6 символов." });
    }

    const existingUser = db.users.find((user) => user.email === email);
    if (existingUser) {
      return sendJson(res, 409, { error: "Пользователь с таким e-mail уже зарегистрирован." });
    }

    const companyId = makeId("company");
    const userId = makeId("user");
    const slug = ensureUniqueSlug(slugify(companyName), db.companies);
    const { salt, hash } = hashPassword(password);
    const now = new Date().toISOString();

    const company = {
      id: companyId,
      slug,
      name: companyName,
      city: "Не указан",
      region: "Регион не указан",
      founded: `С ${new Date().getUTCFullYear()} года`,
      verified: false,
      activeOffersLabel: "0 активных предложений",
      activeOffers: 0,
      responseCount: 0,
      profileStatus: "Новый профиль ожидает верификацию",
      description,
      catalogSummary: description,
      about: description,
      specialties: ["Новая компания", "Профиль на модерации"],
      phone: "Добавьте телефон в профиле",
      email,
      managerHours: "Укажите часы работы менеджера"
    };

    const user = {
      id: userId,
      email,
      passwordSalt: salt,
      passwordHash: hash,
      companyId,
      createdAt: now
    };

    const token = makeToken();

    db.companies.unshift(company);
    db.users.push(user);
    db.sessions.push({ token, userId, createdAt: now });
    db.activity.unshift({
      id: makeId("activity"),
      companyId,
      title: "Профиль создан",
      text: "Заполните карточку компании и разместите первое объявление."
    });
    db.siteMetrics.companies += 1;

    await writeDb(db);

    return sendJson(res, 201, {
      message: "Компания зарегистрирована.",
      token,
      user: {
        id: user.id,
        email: user.email,
        company: buildPublicCompany(company)
      }
    });
  }

  if (req.method === "POST" && pathname === "/api/auth/login") {
    const body = await parseJsonBody(req);
    const email = sanitizeText(body.email, 160).toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return sendJson(res, 400, { error: "Введите e-mail и пароль." });
    }

    const user = db.users.find((item) => item.email === email);
    if (!user || !verifyPassword(password, user)) {
      return sendJson(res, 401, { error: "Неверный e-mail или пароль." });
    }

    const token = makeToken();
    db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
    await writeDb(db);

    return sendJson(res, 200, {
      message: "Вход выполнен.",
      token,
      user: {
        id: user.id,
        email: user.email,
        company: buildPublicCompany(getCompanyById(db, user.companyId))
      }
    });
  }

  if (req.method === "GET" && pathname === "/api/auth/me") {
    const session = await getSessionUser(req, url, db);
    if (!session?.user) {
      return sendJson(res, 401, { error: "Сессия не найдена." });
    }

    return sendJson(res, 200, {
      user: session.user
    });
  }

  if (req.method === "GET" && pathname === "/api/profile") {
    const session = await getSessionUser(req, url, db);
    if (!session?.user) {
      return sendJson(res, 401, { error: "Для просмотра профиля нужно войти." });
    }

    const profile = buildProfile(db, session.user.company.id);
    return sendJson(res, 200, profile);
  }

  if (req.method === "POST" && pathname === "/api/subscribe") {
    const body = await parseJsonBody(req);
    const email = sanitizeText(body.email, 160).toLowerCase();

    if (!email || !email.includes("@")) {
      return sendJson(res, 400, { error: "Укажите корректный e-mail для подписки." });
    }

    const existing = db.subscribers.find((item) => item.email === email);
    if (existing) {
      return sendJson(res, 200, { message: "Этот e-mail уже подписан на рассылку." });
    }

    db.subscribers.push({
      id: makeId("subscriber"),
      email,
      createdAt: new Date().toISOString()
    });

    await writeDb(db);

    return sendJson(res, 201, { message: "Подписка оформлена." });
  }

  return sendJson(res, 404, { error: "API-эндпоинт не найден." });
}

async function serveStatic(res, pathname) {
  const decoded = decodeURIComponent(pathname);
  const relativePath = decoded.replace(/^\/+/, "");
  let absolutePath = "";

  if (decoded === "/" || decoded === "/index.html") {
    absolutePath = path.join(PUBLIC_DIR, "index.html");
  } else if (decoded.startsWith("/assets/") || decoded.startsWith("/partials/")) {
    absolutePath = path.join(PUBLIC_DIR, relativePath);
  } else if (ROOT_PAGE_FILES.has(decoded.slice(1))) {
    absolutePath = path.join(PUBLIC_DIR, "pages", decoded.slice(1));
  } else {
    absolutePath = path.join(PUBLIC_DIR, relativePath);
  }

  if (!absolutePath.startsWith(PUBLIC_DIR)) {
    sendJson(res, 403, { error: "Доступ запрещен." });
    return;
  }

  try {
    const file = await fs.readFile(absolutePath);
    const ext = path.extname(absolutePath).toLowerCase();
    const contentType = MIME_TYPES[ext] ?? "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-store"
    });
    res.end(file);
  } catch (error) {
    if (error.code === "ENOENT") {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Файл не найден.");
      return;
    }

    throw error;
  }
}

function createServer() {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);

      if (url.pathname.startsWith("/api/")) {
        await handleApi(req, res, url);
        return;
      }

      await serveStatic(res, url.pathname);
    } catch (error) {
      const statusCode = error.message?.includes("JSON") || error.message?.includes("Размер")
        ? 400
        : 500;

      sendJson(res, statusCode, {
        error: statusCode === 500 ? "Внутренняя ошибка сервера." : error.message
      });
    }
  });
}

if (require.main === module) {
  if (process.argv.includes("--sync-news")) {
    syncNewsFromSources()
      .then((result) => {
        console.log(`Импортировано материалов: ${result.importedCount}`);
        process.exit(0);
      })
      .catch((error) => {
        console.error(`Синхронизация новостей завершилась ошибкой: ${error.message}`);
        process.exit(1);
      });
  } else {
    createServer().listen(PORT, HOST, () => {
      console.log(`Zemledelets backend запущен: http://${HOST}:${PORT}`);
      validateOllamaConfig().catch(() => {});
      startNewsSyncSchedule();
    });
  }
}

module.exports = { createServer, syncNewsFromSources, startNewsSyncSchedule, handleApi, runWithRuntime };
