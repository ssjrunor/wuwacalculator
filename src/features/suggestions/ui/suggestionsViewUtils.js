export function formatNumber(num) {
    if (num == null) return '-';
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + 'B';
    if (num >= 10_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 100_000) return Math.floor(num).toLocaleString();
    return Math.floor(num).toLocaleString();
}
