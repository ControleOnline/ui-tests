const CSS_VAR_FALLBACK_HEX_REGEX =
  /^var\([^,]+,\s*(#[0-9a-fA-F]{3}|#[0-9a-fA-F]{6})\s*\)$/;
const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function normalizeHex(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const raw = value.trim().replace(/;$/, '');
  const fallbackMatch = raw.match(CSS_VAR_FALLBACK_HEX_REGEX);
  const color = fallbackMatch?.[1] || raw;

  if (!HEX_COLOR_REGEX.test(color)) {
    return null;
  }

  if (color.length === 4) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
  }

  return color;
}

export const withOpacity = (hexColor, opacity = 1) => {
  const normalized = normalizeHex(hexColor);

  if (!normalized) {
    return hexColor;
  }

  const clamped = Math.max(0, Math.min(1, opacity));
  const intValue = parseInt(normalized.slice(1), 16);
  const r = (intValue >> 16) & 255;
  const g = (intValue >> 8) & 255;
  const b = intValue & 255;

  return `rgba(${r}, ${g}, ${b}, ${clamped})`;
};

export const buildAssetUrl = (asset) => {
  if (!asset) {
    return null;
  }

  if (typeof asset === 'string') {
    return asset;
  }

  const rawUrl = asset.url || asset.path || asset.uri;

  if (!rawUrl || typeof rawUrl !== 'string') {
    return null;
  }

  if (/^https?:\/\//i.test(rawUrl)) {
    return rawUrl;
  }

  if (/^\/\//.test(rawUrl)) {
    return `https:${rawUrl}`;
  }

  const domain = asset.domain;
  if (typeof domain === 'string' && domain.trim()) {
    const normalizedDomain = /^https?:\/\//i.test(domain)
      ? domain
      : `https://${domain}`;
    const normalizedPath = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
    return `${normalizedDomain}${normalizedPath}`;
  }

  return rawUrl;
};
