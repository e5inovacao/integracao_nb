export type Variation = { cor?: string; link_image?: string };

export const norm = (s?: string) => 
  (s ?? "").toLowerCase()
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();

const COLOR_ALIASES: Record<string, string[]> = {
  "azul marinho": ["navy", "azul escuro", "marinho"],
  "verde agua": ["verde-agua", "verde água", "mint"],
  "grafite": ["graphite", "cinza escuro", "chumbo"],
  "marrom": ["cafe", "café", "brown"],
  "cinza": ["prata", "silver", "gray", "grey"],
};

const expand = (c: string) => {
  const n = norm(c), hits = new Set([n]);
  for (const [b, a] of Object.entries(COLOR_ALIASES))
    if ([b, ...a].map(norm).includes(n)) [b, ...a].map(norm).forEach(x => hits.add(x));
  return [...hits];
};

const extractDrive = (id: string) => id.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1]
  || id.match(/[?&]id=([a-zA-Z0-9_-]+)/)?.[1];

export const sanitize = (u?: string) => {
  if (!u) return null;
  const s = u.trim();
  if (/^data:image\//.test(s)) return s;
  if (s.includes("drive.google.com")) {
    const id = extractDrive(s);
    return id ? `https://drive.google.com/uc?export=view&id=${id}` : s;
  }
  return /^https?:\/\//.test(s) ? s : null;
};

export const parseVariacoes = (raw: any): Variation[] => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const j = JSON.parse(raw);
      return Array.isArray(j) ? j : [];
    } catch {
      return [];
    }
  }
  return [];
};

export const collectVarImgs = (raw: any) =>
  parseVariacoes(raw)
    .map(v => ({ color: v.cor || "", url: sanitize(v.link_image) }))
    .filter(v => v.color && v.url);

export const findIdxByColor = (imgs: { color: string; url: string }[], cor?: string) => {
  if (!imgs.length) return -1;
  if (!cor) return 0;
  const want = norm(cor), al = new Set(expand(cor));
  const i1 = imgs.findIndex(i => norm(i.color) === want);
  if (i1 >= 0) return i1;
  const i2 = imgs.findIndex(i => al.has(norm(i.color)));
  return i2 >= 0 ? i2 : 0;
};