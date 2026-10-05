import type { FighterFightHistoryItem } from "@/lib/types/mma";

/**
 * Compatibility shim.
 *
 * Older GitHub uploads left this file in the repository because browser-based
 * "Upload files" does not delete files that disappear from a newer ZIP.
 * The active v11 history implementation lives in UfcProvider and does NOT use
 * this class. Keeping this tiny shim prevents stale-file TypeScript build
 * failures while preserving the simple history flow.
 */
export class EspnHistoryProvider {
  async getFighterHistoryByName(_fighterName: string): Promise<FighterFightHistoryItem[]> {
    return [];
  }
}
