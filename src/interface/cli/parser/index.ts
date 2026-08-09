import { object, or } from '@optique/core/constructs'
import type { InferValue } from '@optique/core/parser'
import { command, constant, option } from '@optique/core/primitives'
import { optional, withDefault } from '@optique/core/modifiers'
import { string } from '@optique/core/valueparser'
import { message } from '@optique/core/message'

const configOption = (required: boolean) => {
  const parser = option('--config', string({ metavar: 'FILE' }), {
    description: message`任务配置文件路径`,
  })
  return required ? parser : withDefault(parser, 'config.json')
}

const databaseOption = () =>
  optional(
    option('--database', string({ metavar: 'FILE' }), {
      description: message`SQLite 数据库文件路径`,
    }),
  )

const outputOption = () =>
  optional(
    option('--output', string({ metavar: 'DIR' }), {
      description: message`HTML/EPUB 输出目录`,
    }),
  )

export const cliParser = or(
  command(
    'init',
    object({
      action: constant('init' as const),
      configPath: configOption(false),
      databasePath: databaseOption(),
      rebase: option('--rebase', {
        description: message`删除旧数据库并重建`,
      }),
    }),
    {
      description: message`初始化目录和 SQLite 数据库`,
    },
  ),
  command(
    'fetch',
    object({
      action: constant('fetch' as const),
      configPath: configOption(true),
      databasePath: databaseOption(),
    }),
    {
      description: message`按配置抓取知乎内容并写入 SQLite`,
    },
  ),
  command(
    'generate',
    object({
      action: constant('generate' as const),
      configPath: configOption(true),
      databasePath: databaseOption(),
      outputPath: outputOption(),
    }),
    {
      description: message`从 SQLite 生成 HTML/EPUB`,
    },
  ),
  command(
    'run',
    object({
      action: constant('run' as const),
      configPath: configOption(true),
      databasePath: databaseOption(),
      outputPath: outputOption(),
      rebase: option('--rebase', {
        description: message`执行前删除旧数据库并重建`,
      }),
    }),
    {
      description: message`执行 init、fetch、generate 完整链路`,
    },
  ),
)

export type CliCommand = InferValue<typeof cliParser>
