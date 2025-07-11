export function formatEuro(cents: string | number) {
  if (typeof cents === "string") {
    cents = Number(cents);
  }

  if (Number.isNaN(cents)) {
    throw new Error(`invalid format: ${cents}`);
  }

  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
