export class DataSourceError extends Error {
  constructor(message: string, public status = 502) {
    super(message);
    this.name = "DataSourceError";
  }
}

export async function fetchJson<T>(url: string, revalidate: number): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json", "User-Agent": "FightHub/1.0" },
      next: { revalidate },
    });
    if (!response.ok) throw new DataSourceError(`Proveedor respondió ${response.status}`, response.status);
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof DataSourceError) throw error;
    throw new DataSourceError("No pudimos consultar el proveedor de datos.");
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchHtml(url: string, revalidate: number): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "Mozilla/5.0 (compatible; FightHub/1.0; +personal-project)",
      },
      next: { revalidate },
    });
    if (!response.ok) throw new DataSourceError(`Fuente respondió ${response.status}`, response.status);
    return await response.text();
  } catch (error) {
    if (error instanceof DataSourceError) throw error;
    throw new DataSourceError("No pudimos consultar la fuente oficial.");
  } finally {
    clearTimeout(timeout);
  }
}
