export function formatDateTime(value) {
  if (!value) {
    return 'sem data';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatCount(value, singular, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`;
}

export function formatPercent(value) {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}
