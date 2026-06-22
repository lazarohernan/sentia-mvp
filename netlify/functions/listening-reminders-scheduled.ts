declare const Netlify: {
  env: {
    get(name: string): string | undefined;
  };
};

export default async () => {
  const siteUrl =
    Netlify.env.get("URL") ??
    Netlify.env.get("DEPLOY_PRIME_URL") ??
    "https://plataformamvp.netlify.app";
  const token =
    Netlify.env.get("LISTENING_REMINDER_CRON_TOKEN") ??
    Netlify.env.get("AGENT_INTERNAL_TOKEN");

  if (!token) {
    return new Response("Missing cron token", { status: 503 });
  }

  return fetch(`${siteUrl}/api/listening/reminders/scheduled`, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
};

export const config = {
  schedule: "* * * * *",
};
