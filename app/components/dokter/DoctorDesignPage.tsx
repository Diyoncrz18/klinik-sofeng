import { readFile } from "node:fs/promises";
import path from "node:path";

import DoctorDesignShell from "./DoctorDesignShell";

function extractDoctorDesign(html: string) {
  const bodyMatch = html.match(/<body([^>]*)>([\s\S]*?)<\/body>/i);

  if (!bodyMatch) {
    throw new Error("Body markup was not found in designdokterpage/dokter.html.");
  }

  const bodyAttributes = bodyMatch[1];
  const bodyClassName = bodyAttributes.match(/class="([^"]*)"/i)?.[1] ?? "";
  const bodyContent = bodyMatch[2];
  const scriptMatch = bodyContent.match(/<script>([\s\S]*?)<\/script>\s*$/i);
  const scriptContent = scriptMatch?.[1]?.trim() ?? "";
  const bodyHtml = bodyContent.replace(/<script>[\s\S]*?<\/script>\s*$/i, "").trim();
  const inlineStyles = Array.from(html.matchAll(/<style>([\s\S]*?)<\/style>/gi))
    .map((match) => match[1].trim())
    .join("\n");

  return {
    bodyClassName,
    bodyHtml,
    inlineStyles,
    scriptContent,
  };
}

export default async function DoctorDesignPage({
  initialPageId = "dashboard",
}: {
  initialPageId?: string;
}) {
  const designRoot = path.join(process.cwd(), "designdokterpage");
  const [html, tailwindCss] = await Promise.all([
    readFile(path.join(designRoot, "dokter.html"), "utf8"),
    readFile(path.join(designRoot, "styles", "tailwind-3.4.17.css"), "utf8"),
  ]);

  const { bodyClassName, bodyHtml, inlineStyles, scriptContent } = extractDoctorDesign(html);

  return (
    <DoctorDesignShell
      bodyClassName={bodyClassName}
      bodyHtml={bodyHtml}
      initialPageId={initialPageId}
      styles={`${tailwindCss}\n${inlineStyles}`}
      scriptContent={scriptContent}
    />
  );
}
