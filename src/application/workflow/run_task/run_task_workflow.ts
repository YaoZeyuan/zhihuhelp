import InitWorkflow from '~/src/application/workflow/init/init_workflow'
import FetchWorkflow from '~/src/application/workflow/fetch/customer'
import GenerateWorkflow from '~/src/application/workflow/generate/customer'
import {
  ensureTaskConfigFile,
  readTaskConfig,
} from '~/src/shared/config/task_config_parser'
import { createRunContext, RunContext, RunContextOptions } from '~/src/shared/runtime/run_context'
import { toLegacyTaskConfig } from '~/src/domain/task/task_config'
import Logger from '~/src/library/logger'

export type RunTaskWorkflowOptions = RunContextOptions & {
  rebase?: boolean
}

/**
 * CLI/GUI 共享的任务入口。
 *
 * 该 workflow 负责创建运行上下文并编排 init/fetch/generate 的完整链路。
 */
export default class RunTaskWorkflow {
  async init(options: RunTaskWorkflowOptions): Promise<RunContext> {
    const context = createRunContext(options)
    ensureTaskConfigFile(context.configPath)
    await this.runInit(options, context)
    return context
  }

  async fetch(options: RunTaskWorkflowOptions): Promise<RunContext> {
    const context = createRunContext(options)
    const config = readTaskConfig(context.configPath)
    await this.runFetch(config, context)
    return context
  }

  async generate(options: RunTaskWorkflowOptions): Promise<RunContext> {
    const context = createRunContext(options)
    const config = readTaskConfig(context.configPath)
    await this.runGenerate(config, context)
    return context
  }

  async run(options: RunTaskWorkflowOptions): Promise<RunContext> {
    const context = createRunContext(options)
    ensureTaskConfigFile(context.configPath)
    await this.runInit(options, context)
    const config = readTaskConfig(context.configPath)
    await this.runFetch(config, context)
    await this.runGenerate(config, context)
    Logger.event({
      runId: context.runId,
      stage: 'output',
      level: 'info',
      message: '完整任务执行完毕',
    })
    return context
  }

  private async runInit(options: RunTaskWorkflowOptions, context: RunContext): Promise<void> {
    await new InitWorkflow().execute(
      {
        rebase: options.rebase ?? false,
      },
      context,
    )
  }

  private async runFetch(config: ReturnType<typeof readTaskConfig>, context: RunContext): Promise<void> {
    Logger.event({
      runId: context.runId,
      stage: 'fetch',
      level: 'info',
      message: '开始抓取任务',
    })
    await new FetchWorkflow().execute(toLegacyTaskConfig(config))
    Logger.event({
      runId: context.runId,
      stage: 'fetch',
      level: 'info',
      message: '抓取任务完成',
    })
  }

  private async runGenerate(config: ReturnType<typeof readTaskConfig>, context: RunContext): Promise<void> {
    Logger.event({
      runId: context.runId,
      stage: 'generate',
      level: 'info',
      message: '开始生成电子书',
    })
    await new GenerateWorkflow().execute(toLegacyTaskConfig(config))
    Logger.event({
      runId: context.runId,
      stage: 'generate',
      level: 'info',
      message: '电子书生成完成',
    })
  }
}
