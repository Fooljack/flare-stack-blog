import {
  getOAuthApi,
  type OAuthHelpers,
  type OAuthProviderOptions,
} from "@cloudflare/workers-oauth-provider";
import { seconds } from "@/lib/duration";
import { flattenBlogScopes } from "./service/oauth-provider.scope";

export const OAUTH_PROVIDER_LOGIN_PAGE = "/login";
export const OAUTH_PROVIDER_CONSENT_PAGE = "/oauth/consent";
export const OAUTH_TOKEN_PATH = "/oauth/token";
export const OAUTH_CLIENT_REGISTRATION_PATH = "/oauth/register";
export const OAUTH_ACCESS_TOKEN_EXPIRES_IN = seconds("1h");
export const OAUTH_REFRESH_TOKEN_EXPIRES_IN = seconds("30d");

const OAUTH_STANDARD_SCOPE_VALUES = [
  "openid",
  "profile",
  "email",
  "offline_access",
] as const;

export const OAUTH_BLOG_SCOPE_GROUPS = {
  analytics: ["read"],
  posts: ["read", "write"],
  comments: ["read", "write"],
  media: ["read", "write"],
  // settings: ["read", "write"], // 暂时用不到
  "friend-links": ["read", "write"],
} as const;

export type OAuthStandardScope = (typeof OAUTH_STANDARD_SCOPE_VALUES)[number];
export type OAuthBlogScopeGroups = typeof OAUTH_BLOG_SCOPE_GROUPS;
export type OAuthBlogResource = keyof OAuthBlogScopeGroups;
export type OAuthBlogAction<R extends OAuthBlogResource> =
  OAuthBlogScopeGroups[R][number];

export type OAuthBlogScope = {
  [R in OAuthBlogResource]: `${R}:${OAuthBlogAction<R>}`;
}[OAuthBlogResource];
export type OAuthScope = OAuthStandardScope | OAuthBlogScope;
export type OAuthBlogScopeSelection = Partial<{
  [R in OAuthBlogResource]: readonly OAuthBlogAction<R>[];
}>;

export const OAUTH_STANDARD_SCOPES = [...OAUTH_STANDARD_SCOPE_VALUES];
export const OAUTH_BLOG_SCOPES = flattenBlogScopes(OAUTH_BLOG_SCOPE_GROUPS);
export const OAUTH_MANAGED_SCOPES: OAuthBlogScope[] = [...OAUTH_BLOG_SCOPES];
export const OAUTH_PROVIDER_SCOPES: OAuthScope[] = [
  ...OAUTH_STANDARD_SCOPE_VALUES,
  ...OAUTH_BLOG_SCOPES,
];

export const OAUTH_DEFAULT_BLOG_SCOPE_SELECTION =
  OAUTH_BLOG_SCOPE_GROUPS satisfies OAuthBlogScopeSelection;

export const OAUTH_DEFAULT_CLIENT_SCOPES: OAuthScope[] = [
  ...OAUTH_STANDARD_SCOPE_VALUES,
  ...flattenBlogScopes(OAUTH_DEFAULT_BLOG_SCOPE_SELECTION),
];

export function getOAuthAuthorizationServerUrl(baseURL: string) {
  return new URL(baseURL).origin;
}

export function getOAuthProtectedResourceUrl(baseURL: string) {
  return new URL("/", baseURL).toString();
}

type OAuthFetchHandler = ExportedHandler<Env> &
  Pick<Required<ExportedHandler<Env>>, "fetch">;

const oauthHelpersFallbackHandler: OAuthFetchHandler = {
  fetch: () => new Response("Not Found", { status: 404 }),
};

export function createWorkersOAuthProviderOptions(
  handlers: Pick<OAuthProviderOptions<Env>, "apiHandlers" | "defaultHandler">,
): OAuthProviderOptions<Env> {
  return {
    ...handlers,
    accessTokenTTL: OAUTH_ACCESS_TOKEN_EXPIRES_IN,
    allowPlainPKCE: false,
    authorizeEndpoint: OAUTH_PROVIDER_CONSENT_PAGE,
    clientRegistrationEndpoint: OAUTH_CLIENT_REGISTRATION_PATH,
    refreshTokenTTL: OAUTH_REFRESH_TOKEN_EXPIRES_IN,
    resourceMetadata: {
      scopes_supported: OAUTH_BLOG_SCOPES,
    },
    scopesSupported: OAUTH_PROVIDER_SCOPES,
    tokenEndpoint: OAUTH_TOKEN_PATH,
  };
}

export function getOAuthHelpers(env: Env): OAuthHelpers {
  const existingHelpers = env.OAUTH_PROVIDER;

  if (existingHelpers) {
    return existingHelpers;
  }

  return getOAuthApi(
    createWorkersOAuthProviderOptions({
      apiHandlers: {
        "/_oauth": oauthHelpersFallbackHandler,
      },
      defaultHandler: oauthHelpersFallbackHandler,
    }),
    env,
  );
}
