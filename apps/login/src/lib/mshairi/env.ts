/**
 * SSOT for the Mshairi-specific environment variables — parsed ONCE with zod at
 * module load (fail-first: a malformed value crashes the boot instead of
 * silently falling back). Upstream Zitadel envs stay untouched to keep the
 * fork diff small; only vars introduced by the Mshairi patch live here.
 */
import { z } from "zod";
import { LANGS } from "@/lib/i18n";

export const BRAND_KEYS = ["seu-socio", "mshairi", "planejamento-escolar"] as const;
export type MshairiBrandKey = (typeof BRAND_KEYS)[number];
const LOCALE_CODES = LANGS.map((l) => l.code) as [string, ...string[]];

const brandByClientIdSchema = z
  .string()
  .transform((raw, ctx) => {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      ctx.addIssue({ code: "custom", message: "LOGIN_BRAND_BY_CLIENT_ID must be valid JSON" });
      return z.NEVER;
    }
  })
  .pipe(z.record(z.string().regex(/^\d+$/, "client_id must be numeric"), z.enum(BRAND_KEYS)));

const envSchema = z.object({
  /** JSON map { [oidcClientId]: brandKey }; unmapped clients get the default brand. */
  LOGIN_BRAND_BY_CLIENT_ID: brandByClientIdSchema.optional(),
  /**
   * Deployment language (e.g. "pt"). Overrides the instance setting AND the
   * browser Accept-Language; only an explicit pick in the language switcher
   * (NEXT_LOCALE cookie) wins over it.
   */
  MSHAIRI_DEFAULT_LANGUAGE: z.enum(LOCALE_CODES).optional(),
  /**
   * Skip the instance/org hosted-login translations from the API. Zitadel Cloud
   * falls back to its ENGLISH system catalog for locales it has no system file
   * for (e.g. pt) and upstream deepmerges it LAST — clobbering the local
   * locale files. Our fork owns the copy, so we opt out.
   */
  MSHAIRI_IGNORE_HOSTED_TRANSLATIONS: z.enum(["true", "false"]).optional(),
});

const parsed = envSchema.safeParse({
  LOGIN_BRAND_BY_CLIENT_ID: process.env.LOGIN_BRAND_BY_CLIENT_ID,
  MSHAIRI_DEFAULT_LANGUAGE: process.env.MSHAIRI_DEFAULT_LANGUAGE,
  MSHAIRI_IGNORE_HOSTED_TRANSLATIONS: process.env.MSHAIRI_IGNORE_HOSTED_TRANSLATIONS,
});

if (!parsed.success) {
  throw new Error(`[mshairi] Invalid environment configuration:\n${z.prettifyError(parsed.error)}`);
}

export const mshairiEnv = {
  brandByClientId: parsed.data.LOGIN_BRAND_BY_CLIENT_ID ?? {},
  defaultLanguage: parsed.data.MSHAIRI_DEFAULT_LANGUAGE,
  ignoreHostedTranslations: parsed.data.MSHAIRI_IGNORE_HOSTED_TRANSLATIONS === "true",
};
