const encoder = new TextEncoder();

export const hashPassword = async (password: string) => {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(password));
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
};

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
