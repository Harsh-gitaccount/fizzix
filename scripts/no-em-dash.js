#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const SRC_DIR = path.join(__dirname, '..', 'src')
const EM_DASH = '—'
const EN_DASH = '–'

let errors = 0

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full)
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      const content = fs.readFileSync(full, 'utf-8')
      const lines = content.split('\n')
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(EM_DASH)) {
          console.error(`${path.relative(process.cwd(), full)}:${i + 1} contains em dash`)
          errors++
        }
        if (lines[i].includes(EN_DASH)) {
          console.error(`${path.relative(process.cwd(), full)}:${i + 1} contains en dash`)
          errors++
        }
      }
    }
  }
}

walk(SRC_DIR)

if (errors > 0) {
  console.error(`\nFound ${errors} em/en dash violation(s). Use " - " instead.`)
  process.exit(1)
} else {
  console.log('No em/en dashes found.')
}
