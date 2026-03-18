import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { serverEnv } from "@/lib/env/server.env";
import { adminMiddleware } from "@/lib/middlewares";
import { GetOAuthClientMetadataInputSchema } from "../../oauth-clients/schema/oauth-client.schema";
import * as OAuthClientService from "../../oauth-clients/service/oauth-client.service";
import {
  getOAuthHelpers,
  OAUTH_PROVIDER_CONSENT_PAGE,
} from "../oauth-provider.config";

const CompleteOAuthConsentInputSchema = z.object({
  accept: z.boolean(),
  oauthQuery: z.string(),
  scope: z.array(z.string()),
});

export const getOAuthClientMetadataFn = createServerFn({
  method: "POST",
})
  .middleware([adminMiddleware])
  .inputValidator(GetOAuthClientMetadataInputSchema)
  .handler(({ context, data }) =>
    OAuthClientService.getOAuthClientMetadata(context, data.clientId),
  );

export const completeOAuthConsentFn = createServerFn({
  method: "POST",
})
  .middleware([adminMiddleware])
  .inputValidator(CompleteOAuthConsentInputSchema)
  .handler(async ({ context, data }) => {
    const oauth = getOAuthHelpers(context.env);
    const consentUrl = new URL(
      `${OAUTH_PROVIDER_CONSENT_PAGE}?${data.oauthQuery}`,
      serverEnv(context.env).BETTER_AUTH_URL,
    );
    const request = await oauth.parseAuthRequest(new Request(consentUrl));

    if (!data.accept) {
      const redirectUrl = new URL(request.redirectUri);
      redirectUrl.searchParams.set("error", "access_denied");
      if (request.state) {
        redirectUrl.searchParams.set("state", request.state);
      }
      return {
        redirectTo: redirectUrl.toString(),
      };
    }

    return await oauth.completeAuthorization({
      metadata: {
        clientId: request.clientId,
      },
      props: {
        clientId: request.clientId,
        scopes: data.scope,
        subject: context.session.user.id,
        userId: context.session.user.id,
      },
      request,
      scope: data.scope,
      userId: context.session.user.id,
    });
  });
