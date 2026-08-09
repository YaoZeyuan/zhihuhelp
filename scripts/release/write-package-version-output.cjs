#!/usr/bin/env node
'use strict'

const fs = require('node:fs')
const path = require('node:path')

const rootPath = path.resolve(__dirname, '../..')
const outputPath = process.env.GITHUB_OUTPUT
if (!outputPath) {
  throw new Error('GITHUB_OUTPUT is required')
}

const packageJson = JSON.parse(fs.readFileSync(path.resolve(rootPath, 'package.json'), 'utf8'))
if (typeof packageJson.version !== 'string' || !/^[0-9A-Za-z.+-]+$/.test(packageJson.version)) {
  throw new Error(`package.json contains an unsafe version: ${String(packageJson.version)}`)
}

fs.appendFileSync(outputPath, `packageVersion=${packageJson.version}\n`, 'utf8')
