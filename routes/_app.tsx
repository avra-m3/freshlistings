import { type PageProps } from "$fresh/server.ts";
export default function App({ Component }: PageProps) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>FreshListings | Tech Demo for the future of Search</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <Component />
        <div className="mt-4 max-w-screen-lg mx-auto flex flex-col items-center justify-center">
          <span aria-label={"disclaimer"} className="text-xs text-gray-500">
            Data sourced from{" "}
            <a
              href={"https://insideairbnb.com/get-the-data/#:~:text=match%20at%20L2231%20Sydney%2C%20New,South%20Wales%2C%20Australia"}
            >
              inside Airbnb
            </a>.
            <br/>
            This site is for demonstration purposes only. The data is not real-time
            and will not reflect current listings or prices. This site is a tech
            demo for the future of search and should not be used for actual
            property searches or transactions.
          </span>
        </div>
      </body>
    </html>
  );
}
