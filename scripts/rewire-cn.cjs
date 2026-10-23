// Point shadcn primitives at the shared cn helper in @/lib/utils instead of the `cn` package.
const fs = require('fs')
const path = require('path')
const dir = path.join(process.argv[2], 'components', 'ui')
let n = 0
for (const f of fs.readdirSync(dir)) {
  const p = path.join(dir, f)
  const s = fs.readFileSync(p, 'utf8')
  const t = s.replace(/import \{ cn \} from ["']cn["']/g, `import { cn } from "@/lib/utils"`)
  if (t !== s) {
    fs.writeFileSync(p, t, 'utf8')
    n++
  }
}
console.log('rewired:', n)
