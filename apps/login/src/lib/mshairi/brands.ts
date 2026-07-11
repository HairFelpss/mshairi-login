/**
 * Mshairi per-app brand catalog.
 *
 * A brand is the DEFAULT visual identity applied when the organization has no
 * explicit label policy (org policy always wins — native Zitadel behavior).
 * The active brand is resolved from the OIDC client_id of the auth request via
 * the LOGIN_BRAND_BY_CLIENT_ID env map (validated in ./env.ts, fail-first).
 */
import { mshairiEnv, MshairiBrandKey } from "./env";

export type { MshairiBrandKey };

export type MshairiBrandTheme = {
  primaryColor: string;
  backgroundColor?: string;
  fontColor?: string;
  warnColor?: string;
  logoUrl: string;
  iconUrl: string;
};

export type MshairiBrand = {
  key: MshairiBrandKey;
  name: string;
  /** Renders the "powered by Mshairi" footer (all brands except Mshairi itself). */
  poweredByMshairi: boolean;
  light: MshairiBrandTheme;
  dark: MshairiBrandTheme;
};

export const DEFAULT_BRAND_KEY: MshairiBrandKey = "seu-socio";

export const MSHAIRI_BRANDS: Record<MshairiBrandKey, MshairiBrand> = {
  // Kituo-menyu product brand — green ramp anchored at #2E6F40 (kituo design-tokens).
  "seu-socio": {
    key: "seu-socio",
    name: "Seu Sócio",
    poweredByMshairi: true,
    light: {
      primaryColor: "#2e6f40",
      logoUrl: "/mshairi/seu-socio-light.svg",
      iconUrl: "/mshairi/seu-socio-light.svg",
    },
    dark: {
      primaryColor: "#55a86c",
      logoUrl: "/mshairi/seu-socio-dark.svg",
      iconUrl: "/mshairi/seu-socio-dark.svg",
    },
  },
  // Mshairi platform brand — Soft UI teal, oklch(0.62 0.11 195) ≈ #009a9b (libs/ui theme).
  mshairi: {
    key: "mshairi",
    name: "Mshairi",
    poweredByMshairi: false,
    light: {
      primaryColor: "#009a9b",
      logoUrl: "/mshairi/mshairi-light.svg",
      iconUrl: "/mshairi/mshairi-light.svg",
    },
    dark: {
      primaryColor: "#41b2b2",
      logoUrl: "/mshairi/mshairi-dark.svg",
      iconUrl: "/mshairi/mshairi-dark.svg",
    },
  },
  // Placeholder until their identity is defined.
  "planejamento-escolar": {
    key: "planejamento-escolar",
    name: "Planejamento Escolar",
    poweredByMshairi: true,
    light: {
      primaryColor: "#2563eb",
      logoUrl: "/mshairi/planejamento-escolar-light.svg",
      iconUrl: "/mshairi/planejamento-escolar-light.svg",
    },
    dark: {
      primaryColor: "#60a5fa",
      logoUrl: "/mshairi/planejamento-escolar-dark.svg",
      iconUrl: "/mshairi/planejamento-escolar-dark.svg",
    },
  },
};

export const resolveBrandKey = (clientId?: string): MshairiBrandKey => {
  if (!clientId) return DEFAULT_BRAND_KEY;
  return mshairiEnv.brandByClientId[clientId] ?? DEFAULT_BRAND_KEY;
};

export const getBrand = (key: MshairiBrandKey): MshairiBrand => MSHAIRI_BRANDS[key];
