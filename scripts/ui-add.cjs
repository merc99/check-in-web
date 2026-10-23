// `npm run ui:add -- button card ...`: runs `shadcn add`, then points the new files'
// `cn` import at @/lib/utils (clsx + tailwind-merge). This shadcn CLI writes
// `import { cn } from "cn"` (a separate package) whatever the style; we use one helper.
const { spawnSync } = require('child_process')
const path = require('path')

const root = path.join(__dirname, '..')
const args = process.argv.slice(2)
if (!args.length) {
  console.error('Usage: npm run ui:add -- <component> [more...]')
  process.exit(1)
}
const add = spawnSync('npx', ['shadcn@latest', 'add', ...args], { cwd: root, stdio: 'inherit', shell: true })
if (add.status !== 0) process.exit(add.status ?? 1)
const rewire = spawnSync(process.execPath, [path.join(__dirname, 'rewire-cn.cjs'), root], { stdio: 'inherit' })
process.exit(rewire.status ?? 0)
