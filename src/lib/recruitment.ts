/** Règles de validation partagées entre le formulaire (client) et l'API (serveur). */

export const MAX_CV_BYTES = 5 * 1024 * 1024; // 5 Mo
export const ALLOWED_CV_EXTENSIONS = ["pdf", "doc", "docx"] as const;

/** Vérifie la signature réelle du fichier : l'extension ou le type déclaré par le navigateur ne suffisent pas. */
export function detectCvType(bytes: Uint8Array): { ext: "pdf" | "doc" | "docx"; mime: string } | null {
  const startsWith = (sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (startsWith([0x25, 0x50, 0x44, 0x46])) return { ext: "pdf", mime: "application/pdf" }; // %PDF
  if (startsWith([0xd0, 0xcf, 0x11, 0xe0])) return { ext: "doc", mime: "application/msword" };
  if (startsWith([0x50, 0x4b, 0x03, 0x04]))
    return { ext: "docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
  return null;
}

export function safeFileName(name: string, ext: string) {
  const base = name
    .replace(/\.[^.]+$/, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "cv"}.${ext}`;
}

export function formatBytes(n: number) {
  return n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} Ko` : `${(n / (1024 * 1024)).toFixed(1)} Mo`;
}
