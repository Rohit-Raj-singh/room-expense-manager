export function formatINR(value) {
  const n = Number(value) || 0;
  return `₹${Math.round(n)}`;
}

export function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
}

