#!/usr/bin/env node
import { defineProgram } from '@optique/core/program'
import { message } from '@optique/core/message'
import { runSync } from '@optique/run'
import CommonConfig from '~/src/config/common.js'
import { cliParser } from '~/src/interface/cli/parser/index.js'
import { dispatchCliCommand } from '~/src/interface/cli/command/dispatcher.js'
import Logger from '~/src/library/logger.js'
import { LogEventCode, LogLevel, LogStage, LogStatus } from '~/src/shared/logging/log_contract.js'

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
  Logger.event({
    eventCode: LogEventCode.WORKFLOW_FAILURE,
    stage: LogStage.CLI,
    status: LogStatus.FAILURE,
    level: LogLevel.ERROR,
    message: 'CLI 执行失败',
    error: Logger.serializeError(error),
  })
  console.error(error.stack || error.message)
  process.exit(1)
})
