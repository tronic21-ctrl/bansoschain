export function shortenHex(value: string, chars = 6): string {
  return `${value.slice(0, chars + 2)}...${value.slice(-4)}`;
}

export function formatTimestamp(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatAmount(weiString: string): string {
  const wei = BigInt(weiString);
  const whole = wei / 10n ** 18n;
  return `${whole.toString()} mDANA`;
}
