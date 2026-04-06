import { Container, getContainer } from "@cloudflare/containers";

export class MetaAdsMCP extends Container {
  defaultPort = 8080;
  sleepAfter = "5m";

  constructor(ctx, env) {
    super(ctx, env);
    // Use this.envVars in constructor — getEnv() does NOT exist in @cloudflare/containers
    // Setting META_ACCESS_TOKEN here means all users share the server-side token
    // and do NOT need to pass access_token as a tool argument
    this.envVars = {
      META_APP_ID: env.META_APP_ID || "",
      META_APP_SECRET: env.META_APP_SECRET || "",
      META_ACCESS_TOKEN: env.META_ACCESS_TOKEN || "",
      META_ADS_ACCOUNT_ID: env.META_ADS_ACCOUNT_ID || "",
      META_ADS_DISABLE_CALLBACK_SERVER: env.META_ADS_DISABLE_CALLBACK_SERVER || "1",
    };
  }
}

export default {
  async fetch(request, env) {
    const container = getContainer(env.META_ADS_MCP, "v2");
    return container.fetch(request);
  }
};
