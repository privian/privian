const timeUnits: Record<string, number> = {
  year: 24 * 60 * 60 * 1000 * 365,
  month: 24 * 60 * 60 * 1000 * 365 / 12,
  day: 24 * 60 * 60 * 1000,
  hour: 60 * 60 * 1000,
  minute: 60 * 1000,
  second: 1000
}

export function formatDate(date?: Date | number | string) {
  if (!date) {
    return date;
  }
  date = new Date(date);
  return new Intl.DateTimeFormat(void 0).format(date.getTime());
}

export function formatTimeAgo(date?: Date | number | string) {
  if (!date) {
    return date;
  }
  const diff = new Date(date).getTime() - new Date().getTime();
	const relativeFormatter = new Intl.RelativeTimeFormat(void 0, {
    numeric: 'auto',
  });
  for (const unit in timeUnits) {
    if (Math.abs(diff) > timeUnits[unit] || unit == 'second') {
      return relativeFormatter.format(Math.round(diff/timeUnits[unit]), unit as any);
    }
  }
  return new Date(date).toLocaleTimeString();
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions) {
	return new Intl.NumberFormat(void 0, options).format(value);
}

export function formatPercent(num: number, fractions: number = 1) {
  return new Intl.NumberFormat(void 0, {
    maximumFractionDigits: fractions,
    minimumFractionDigits: fractions,
  }).format(num) + ' %';
}

export function formatBytes(bytes: number, decimals: number = 2) {
  if (bytes === 0) {
    return '0 Bytes';
  }
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatPrice(num: number, currency: string, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(void 0, { style: 'currency', currency, ...options }).format(num);
}

export function formatCurrency(currencyCode: string) {
  return new Intl.DisplayNames(void 0, { type: 'currency' }).of(currencyCode);
}

export function formatLanguage(language: string) {
  return new Intl.DisplayNames(void 0, { type: 'language' }).of(language);
}