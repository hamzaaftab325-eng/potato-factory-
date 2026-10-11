import { createServer } from "vite";
import { renderToString } from "react-dom/server";
import React from "react";
import { readFile, writeFile } from "node:fs/promises";

// Vercel serves complete page content before hydration. The dynamic 3D module
// is loaded by the client effect, so this build step requires no graphics driver.
const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});
try {
  const { default: App } = await server.ssrLoadModule("/src/App.jsx");
  const content = renderToString(React.createElement(App));
  const page = await readFile("dist/index.html", "utf8");
  await writeFile(
    "dist/index.html",
    page.replace('<div id="root"></div>', `<div id="root">${content}</div>`),
  );
} finally {
  await server.close();
}
