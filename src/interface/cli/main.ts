#!/usr/bin/env node
import { defineProgram } from '@optique/core/program'
import { message } from '@optique/core/message'
import { runSync } from '@optique/run'
import CommonConfig from '~/src/config/common'
import { cliParser } from '~/src/interface/cli/parser'
import { dispatchCliCommand } from '~/src/interface/cli/command/dispatcher'

const program = defineProgram({
  parser: cliParser,
  metadata: {
    name: 'zhihuhelp',
    version: CommonConfig.version,
    brief: message`知乎助手命令行入口`,
    description: message`抓取知乎内容到本地 SQLite，并生成 HTML/EPUB。`,
  },
})

async function main(): Promise<void> {
  const command = runSync(program, {
    help: 'both',
    version: {
      value: CommonConfig.version,
      option: true,
    },
    aboveError: 'usage',
    showDefault: true,
  })

  await dispatchCliCommand(command)
}

main().catch((error: Error) => {
  console.error(error.stack || error.message)
  process.exit(1)
})
