import { jsPDF } from "jspdf";
import fs from "fs";
import { NOTO_SANS_MALAYALAM_BASE64 } from "./src/lib/malayalamFont";

const doc = new jsPDF();
doc.addFileToVFS("NotoSansMalayalam-Regular.ttf", NOTO_SANS_MALAYALAM_BASE64);
doc.addFont("NotoSansMalayalam-Regular.ttf", "NotoSansMalayalam", "normal");
doc.setFont("NotoSansMalayalam", "normal");

const text1 = "പേര്";
const text2 = "പ" + "\u0D47" + "ര" + "\u0D4D";

// Using zero width joiner to fix chillu characters and conjuncts for rendering
const chillu = "ൽ";
const chillu2 = "\u0D32\u0D4D\u200D";

doc.text(text1, 10, 10);
doc.text(text2, 10, 20);
doc.text(chillu, 10, 30);
doc.text(chillu2, 10, 40);

const out = doc.output('arraybuffer');
fs.writeFileSync("test_render.pdf", Buffer.from(out));
