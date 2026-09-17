export const formatZAR = (n) => (typeof n === "number" ? `R${Math.round(n)}` : "R—");

export const formatRange = (min, max) => `${formatZAR(min)}-${formatZAR(max)}`;
