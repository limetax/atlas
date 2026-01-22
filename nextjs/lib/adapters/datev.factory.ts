import { IDATEVAdapter } from "@/lib/adapters/datev.adapter";
import { getKlardatenAdapter } from "@/lib/infrastructure/klardaten.client";

export function getDATEVAdapter(): IDATEVAdapter {
  // Current implementation: Klardaten Gateway
  return getKlardatenAdapter();
}
