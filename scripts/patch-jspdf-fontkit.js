import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fontkitDir = path.resolve(__dirname, "../node_modules/jspdf-fontkit/lib")

const filesToPatch = ["jspdf-fontkit.js", "jspdf-fontkit.umd.cjs"]

filesToPatch.forEach((file) => {
  const filePath = path.join(fontkitDir, file)
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, "utf8")
    if (!content.includes("if (!u) return { x: 0, y: 0 };")) {
      content = content.replaceAll(
        "getAnchor(u) {",
        "getAnchor(u) { if (!u) return { x: 0, y: 0 };"
      )
      fs.writeFileSync(filePath, content, "utf8")
      console.log(`[postinstall] Successfully patched getAnchor in ${file}`)
    }
  }
})
