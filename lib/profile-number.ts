export function generateProfileNumber(): string {
  const prefix = "SM";
  const year = new Date().getFullYear().toString().slice(-2);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const seq = Date.now().toString(36).slice(-4).toUpperCase();
  return `${prefix}${year}${random}${seq}`;
}
