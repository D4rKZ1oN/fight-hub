import type { MMADataProvider } from "./MMADataProvider";
import { EspnProvider } from "./espnProvider";
import { MockProvider } from "./mockProvider";

let provider: MMADataProvider | null = null;

export function getMMAProvider(): MMADataProvider {
  if (provider) return provider;
  const selected = (process.env.SPORTS_DATA_PROVIDER ?? "espn").toLowerCase();
  if (selected === "mock") {
    if (process.env.NODE_ENV === "production") throw new Error("MockProvider no puede usarse en producción.");
    provider = new MockProvider();
    return provider;
  }
  provider = new EspnProvider();
  return provider;
}
