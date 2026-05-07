import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const LINE_LIMIT = 500

const SRC_PATTERN = /^src\/.*\.(ts|tsx|js|jsx)$/
const CONVEX_PATTERN = /^convex\/.*\.(ts|tsx|js|jsx)$/
const GENERATED_PATTERN = /^convex\/_generated\//

function isInScope(filePath: string): boolean {
  if (GENERATED_PATTERN.test(filePath)) return false
  return SRC_PATTERN.test(filePath) || CONVEX_PATTERN.test(filePath)
}

export async function checkFileSizes(
  files: Array<string>,
  limit: number = LINE_LIMIT,
): Promise<boolean> {
  const violating: Array<{ file: string; lines: number }> = []

  for (const file of files) {
    if (!isInScope(file)) continue

    try {
      const content = readFileSync(resolve(file), 'utf-8')
      const lines = content.split('\n')
      // Handle trailing newline (split produces empty last element)
      const lineCount = lines[lines.length - 1] === '' ? lines.length - 1 : lines.length

      if (lineCount > limit) {
        violating.push({ file, lines: lineCount })
      }
    } catch {
      // File doesn't exist or can't be read — skip
      continue
    }
  }

  if (violating.length > 0) {
    console.error(
      `\nERROR: The following file(s) exceed ${limit} lines. Please refactor:\n`,
    )
    for (const v of violating) {
      console.error(`  ${v.file} (${v.lines} lines)`)
    }
    console.error(
      '\nHint: Extract code into smaller modules. Do NOT simply trim lines.\n',
    )
    return false
  }

  return true
}

async function main() {
  const files = process.argv.slice(2)
  const success = await checkFileSizes(files)
  process.exit(success ? 0 : 1)
}

if (import.meta.main) {
  main()
}
