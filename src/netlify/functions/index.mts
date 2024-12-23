import type { Context, Config } from "@netlify/functions";

export default async (req: Request, ctx: Context) => {
  const data = { req, ctx };
  console.log(data);
  return new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json" },
  });
};

export const config: Config = {
  // schedule: "0 16 * * *", // 09:00 MST
  schedule: "* * * * *", // test: every minute
};
