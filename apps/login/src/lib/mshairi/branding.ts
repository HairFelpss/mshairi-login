import "server-only";

import { createLogger } from "@/lib/logger";
import { BrandingSettings, Theme } from "@zitadel/proto/zitadel/settings/v2/branding_settings_pb";
import { AuthRequest } from "@zitadel/proto/zitadel/oidc/v2/authorization_pb";
import { ResourceOwnerType } from "@zitadel/proto/zitadel/settings/v2/settings_pb";
import { headers } from "next/headers";
import { getBrand, MshairiBrandTheme, resolveBrandKey } from "./brands";

const logger = createLogger("mshairi-branding");

/** Set by proxy.ts from the requestId search param on every navigation. */
export const MSHAIRI_REQUEST_ID_HEADER = "x-mshairi-request-id";

type FetchAuthRequest = (authRequestId: string) => Promise<{ authRequest?: AuthRequest }>;

/** requestId → clientId, memoized (auth requests are immutable and short-lived). */
const clientIdCache = new Map<string, Promise<string | undefined>>();
const CLIENT_ID_CACHE_MAX = 1000;

const clientIdFromRequestId = (requestId: string, fetchAuthRequest: FetchAuthRequest): Promise<string | undefined> => {
  // Only OIDC auth requests carry a client_id we can map (saml_/device_ do not).
  if (!requestId.startsWith("oidc_")) return Promise.resolve(undefined);

  const cached = clientIdCache.get(requestId);
  if (cached) return cached;

  const pending = fetchAuthRequest(requestId.replace("oidc_", ""))
    .then((resp) => resp.authRequest?.clientId)
    .catch((error) => {
      logger.warn("Could not resolve auth request for brand mapping", {
        requestId,
        error: error instanceof Error ? error.message : String(error),
      });
      clientIdCache.delete(requestId);
      return undefined;
    });

  if (clientIdCache.size >= CLIENT_ID_CACHE_MAX) clientIdCache.clear();
  clientIdCache.set(requestId, pending);
  return pending;
};

const mergeTheme = (base: Theme | undefined, brand: MshairiBrandTheme): Theme =>
  ({
    ...base,
    primaryColor: brand.primaryColor,
    ...(brand.backgroundColor && { backgroundColor: brand.backgroundColor }),
    ...(brand.fontColor && { fontColor: brand.fontColor }),
    ...(brand.warnColor && { warnColor: brand.warnColor }),
    logoUrl: brand.logoUrl,
    iconUrl: brand.iconUrl,
  }) as Theme;

/**
 * Overlays the per-app Mshairi brand onto the fetched branding settings.
 *
 * Precedence (matches the platform decision): org label policy (native) wins;
 * otherwise the brand mapped to the auth request's client_id; otherwise the
 * default brand. Runs OUTSIDE the settings cache — the overlay is per-request
 * while the underlying settings stay cached per organization.
 */
export const applyMshairiBrand = async ({
  settings,
  fetchAuthRequest,
}: {
  settings: BrandingSettings | undefined;
  fetchAuthRequest: FetchAuthRequest;
}): Promise<BrandingSettings | undefined> => {
  // An org-level label policy is a negotiated per-tenant branding — never override it.
  if (settings?.resourceOwnerType === ResourceOwnerType.ORG) {
    return settings;
  }

  let requestId: string | null = null;
  try {
    requestId = (await headers()).get(MSHAIRI_REQUEST_ID_HEADER);
  } catch {
    // Outside a request scope (e.g. build-time render) — fall back to default brand.
  }

  const clientId = requestId ? await clientIdFromRequestId(requestId, fetchAuthRequest) : undefined;
  const brand = getBrand(resolveBrandKey(clientId));

  return {
    ...settings,
    lightTheme: mergeTheme(settings?.lightTheme, brand.light),
    darkTheme: mergeTheme(settings?.darkTheme, brand.dark),
    // Client-safe extras consumed via lib/mshairi/extras.ts (footer, debugging).
    mshairiBrandKey: brand.key,
    mshairiBrandName: brand.name,
    mshairiPoweredBy: brand.poweredByMshairi,
  } as BrandingSettings;
};
