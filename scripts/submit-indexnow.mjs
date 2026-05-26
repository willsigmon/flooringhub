const siteUrl = process.env.SITE_URL ?? "https://www.flooringhubnc.com";
const indexNowKey = process.env.INDEXNOW_KEY ?? "a887cf456f9b40fa967b57da4ff7e71f";
const keyLocation = `${siteUrl}/${indexNowKey}.txt`;

const changedPaths = [
  "/",
  "/terms.html",
  "/privacy.html",
  "/thank-you.html"
];

const urlList = changedPaths.map((path) => new URL(path, siteUrl).toString());
const host = new URL(siteUrl).host;

console.log(`Submitting ${urlList.length} URLs to IndexNow for host ${host}...`);

const response = await fetch("https://api.indexnow.org/IndexNow", {
  method: "POST",
  headers: {
    "Content-Type": "application/json; charset=utf-8",
  },
  body: JSON.stringify({
    host,
    key: indexNowKey,
    keyLocation,
    urlList,
  }),
});

const body = await response.text();

if (!response.ok) {
  console.error("IndexNow submission failed");
  console.error("Status:", response.status);
  console.error(body);
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      status: response.status,
      host,
      keyLocation,
      submitted: urlList.length,
      body: body || "OK",
    },
    null,
    2,
  ),
);
