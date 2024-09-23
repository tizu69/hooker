import { Elysia, t } from "elysia";
import { html, Html } from "@elysiajs/html";
import { Snowflake } from "nodejs-snowflake";

const snowflake = new Snowflake();
const hooks: Record<string, string> = {};
const error = (msg: string) => (
  <body>
    <p>{msg}</p>
    <a href="/">Back</a>
  </body>
);

new Elysia()
  .use(html())
  .get(
    "/",
    ({ query: { url } }) => {
      if (!url)
        return (
          <html>
            <head>
              <title>Hooker</title>
              <meta name="title" content="Hooker" />
              <meta
                name="description"
                content="A really simple abstraction layer for webhooks that makes them not deletable. Won't stay up forever."
              />
            </head>
            <body>
              <h1>Hello Hooker</h1>
              <p>
                A really simple abstraction layer for webhooks that makes them
                not deletable.
              </p>
              <p>
                NOTE! I will not keep this up forever. Maybe like an hour, until
                #everything has calmed down.
              </p>

              <form method="GET">
                <input type="url" name="url" placeholder="Webhook URL" />
                <button>Create</button>
              </form>
            </body>
          </html>
        );

      if (Object.values(hooks).includes(url))
        return error("Already registered!");
      if (!url.match(/^https:\/\/discord\.com\/api\/webhooks\/\d+\/.{10,100}$/))
        return error("Invalid webhook URL.");

      const id = snowflake.getUniqueID().toString();
      hooks[id] = url;
      console.log(`Registered: https://hooker.serveo.net/${id}`);
      return (
        <body>
          <h1>Created!</h1>
          <p>
            NOTE! You won't be able to generate a Hooker for this webhook ID
            again, nor get the existing one again.
          </p>
          <p>
            Use this link, partly compatible with the webhook API:{" "}
            <code>https://hooker.serveo.net/{id}</code>
          </p>
        </body>
      );
    },
    { query: t.Object({ url: t.Optional(t.String()) }) },
  )

  .post(
    "/:id",
    async ({ params: { id }, set, body }) => {
      if (!hooks[id]) {
        set.status = 400;
        return "oops";
      }

      const resp = await fetch(hooks[id], {
        method: "POST",
        body: JSON.stringify(body),
      });
      return await resp.json();
    },
    { params: t.Object({ id: t.Numeric() }) },
  )
  .get(
    "/:id",
    async ({ params: { id }, set, body }) => {
      if (!hooks[id]) {
        set.status = 400;
        return "oops";
      }

      const resp = await fetch(hooks[id], {
        method: "GET",
        body: JSON.stringify(body),
      });
      return {
        ...(await resp.json()),
        token: id + "",
        url: `https://hooker.serveo.net/${id}`,
      };
    },
    { params: t.Object({ id: t.Numeric() }) },
  )

  .listen(3000);
