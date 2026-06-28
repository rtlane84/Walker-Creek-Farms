export function getMutationErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (error && typeof error === "object") {
    const data = (error as { data?: { error?: string } }).data;
    if (data?.error) return data.error;
    if ("message" in error && typeof (error as Error).message === "string") {
      return (error as Error).message;
    }
  }
  return fallback;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
