/**
 * Client-safe accessor for the Mshairi fields piggybacked onto BrandingSettings
 * by applyMshairiBrand (server). Kept dependency-free so client components can
 * import it without pulling server-only code.
 */
export type MshairiExtras = {
  mshairiBrandKey?: string;
  mshairiBrandName?: string;
  mshairiPoweredBy?: boolean;
};

export const mshairiExtras = (branding?: unknown): MshairiExtras => (branding ?? {}) as MshairiExtras;
