import { PDFParse } from "pdf-parse";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const workerPath = require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");

PDFParse.setWorker(pathToFileURL(workerPath).toString());

export const runtime = "nodejs";

export async function POST(request: Request) {
  let parser: PDFParse | null = null;
  console.log(workerPath);
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "Missing PDF file." }, { status: 400 });
    }

    console.log("[parse-pdf] file", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("[parse-pdf] buffer", { bytes: buffer.byteLength });

    parser = new PDFParse({ data: buffer });
    const info = await parser.getInfo();
    const textResult = await parser.getText();

    console.log("[parse-pdf] parsed", {
      pages: textResult.total,
      textLength: textResult.text.length,
      info: info.info,
    });
    console.log("[parse-pdf] text sample", textResult.text.slice(0, 500));

    return Response.json({ text: textResult.text, pages: textResult.total });
  } catch (error) {
    console.error("[parse-pdf] error", error);
    return Response.json(
      { error: "Unable to parse PDF." },
      { status: 500 },
    );
  } finally {
    if (parser) {
      await parser.destroy();
    }
  }
}
