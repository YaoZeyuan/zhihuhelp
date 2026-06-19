import fs from 'fs'
import InitWorkflow from '~/src/application/workflow/init/init_workflow'
import FetchWorkflow from '~/src/application/workflow/fetch/customer'
import GenerateWorkflow from '~/src/application/workflow/generate/customer'
import {
  ensureTaskConfigFile,
  readTaskConfig,
} from '~/src/shared/config/task_config_parser'
import { createRunContext, RunContext, RunContextOptions, RunStage } from '~/src/shared/runtime/run_context'
import { TaskConfig, toLegacyTaskConfig } from '~/src/domain/task/task_config'
import Logger from '~/src/library/logger'

export type RunTaskWorkflowOptions = RunContextOptions & {
  rebase?: boolean
}

type WorkflowAction = 'init' | 'fetch' | 'generate' | 'run'

/**
 * CLI/GUI 共享的任务入口。
 *
 * 这里负责创建运行上下文、读取配置，并编排 init/fetch/generate 的完整链路。
 */
export default class RunTaskWorkflow {
  async init(options: RunTaskWorkflowOptions): Promise<RunContext> {
    const context = createRunContext(options)
    return this.runCommand('init', context, options, async () => {
      this.ensureConfig(context)
      await this.runInit(options, context)
      return context
    })
  }

  async fetch(options: RunTaskWorkflowOptions): Promise<RunContext> {
    const context = createRunContext(options)
    return this.runCommand('fetch', context, options, async () => {
      const config = this.readConfig(context)
      await this.runFetch(config, context)
      return context
    })
  }

  async generate(options: RunTaskWorkflowOptions): Promise<RunContext> {
    const context = createRunContext(options)
    return this.runCommand('generate', context, options, async () => {
      const config = this.readConfig(context)
      await this.runGenerate(config, context)
      return context
    })
  }

  async run(options: RunTaskWorkflowOptions): Promise<RunContext> {
    const context = createRunContext(options)
    return this.runCommand('run', context, options, async () => {
      this.ensureConfig(context)
      await this.runInit(options, context)
      const config = this.readConfig(context)
      await this.runFetch(config, context)
      await this.runGenerate(config, context)
      Logger.event({
        runId: context.runId,
        stage: 'output',
        status: 'success',
        level: 'info',
        message: '完整任务执行完毕',
        details: this.createContextDetails(context),
      })
      return context
    })
  }

  private async runCommand(
    action: WorkflowAction,
    context: RunContext,
    options: RunTaskWorkflowOptions,
    handler: () => Promise<RunContext>,
  ): Promise<RunContext> {
    const startedAt = Date.now()
    Logger.event({
      runId: context.runId,
      stage: 'cli',
      status: 'start',
      level: 'info',
      message: `开始执行 ${action} 工作流`,
      details: {
        action,
        rebase: options.rebase ?? false,
        ...this.createContextDetails(context),
      },
    })

    try {
      const result = await handler()
      Logger.event({
        runId: context.runId,
        stage: 'cli',
        status: 'success',
        level: 'info',
        message: `${action} 工作流执行完成`,
        durationMs: Date.now() - startedAt,
        details: {
          action,
          ...this.createContextDetails(context),
        },
      })
      return result
    } catch (error) {
      Logger.event({
        runId: context.runId,
        stage: 'cli',
        status: 'failure',
        level: 'error',
        message: `${action} 工作流执行失败`,
        durationMs: Date.now() - startedAt,
        error: Logger.serializeError(error),
        details: {
          action,
          ...this.createContextDetails(context),
        },
      })
      throw error
    }
  }

  private ensureConfig(context: RunContext): void {
    const startedAt = Date.now()
    const existedBefore = fs.existsSync(context.configPath)
    Logger.event({
      runId: context.runId,
      stage: 'config',
      status: 'start',
      level: 'info',
      message: '检查任务配置文件',
      details: {
        configPath: context.configPath,
        existedBefore,
      },
    })
    try {
      ensureTaskConfigFile(context.configPath)
      Logger.event({
        runId: context.runId,
        stage: 'config',
        status: 'success',
        level: 'info',
        message: existedBefore ? '任务配置文件已存在' : '任务配置文件不存在，已写入默认配置',
        durationMs: Date.now() - startedAt,
        details: {
          configPath: context.configPath,
          createdDefaultConfig: existedBefore === false,
        },
      })
    } catch (error) {
      Logger.event({
        runId: context.runId,
        stage: 'config',
        status: 'failure',
        level: 'error',
        message: '任务配置文件检查失败',
        durationMs: Date.now() - startedAt,
        error: Logger.serializeError(error),
        details: {
          configPath: context.configPath,
        },
      })
      throw error
    }
  }

  private readConfig(context: RunContext): TaskConfig {
    const startedAt = Date.now()
    Logger.event({
      runId: context.runId,
      stage: 'config',
      status: 'start',
      level: 'info',
      message: '读取任务配置',
      details: {
        configPath: context.configPath,
      },
    })
    try {
      const config = readTaskConfig(context.configPath)
      Logger.event({
        runId: context.runId,
        stage: 'config',
        status: 'success',
        level: 'info',
        message: '任务配置读取完成',
        durationMs: Date.now() - startedAt,
        details: this.createConfigSummary(config),
      })
      return config
    } catch (error) {
      Logger.event({
        runId: context.runId,
        stage: 'config',
        status: 'failure',
        level: 'error',
        message: '任务配置读取失败',
        durationMs: Date.now() - startedAt,
        error: Logger.serializeError(error),
        details: {
          configPath: context.configPath,
        },
      })
      throw error
    }
  }

  private async runInit(options: RunTaskWorkflowOptions, context: RunContext): Promise<void> {
    await this.runStage(context, 'init', '初始化运行环境', () =>
      new InitWorkflow().execute(
        {
          rebase: options.rebase ?? false,
        },
        context,
      ),
      {
        rebase: options.rebase ?? false,
        databasePath: context.databasePath,
        outputPath: context.outputPath,
      },
    )
  }

  private async runFetch(config: TaskConfig, context: RunContext): Promise<void> {
    await this.runStage(
      context,
      'fetch',
      '抓取任务',
      () => new FetchWorkflow().execute(toLegacyTaskConfig(config), context),
      {
        taskCount: config.tasks.length,
        enabledTaskCount: config.tasks.filter((task) => task.skipFetch === false).length,
        skippedTaskCount: config.tasks.filter((task) => task.skipFetch).length,
      },
    )
  }

  private async runGenerate(config: TaskConfig, context: RunContext): Promise<void> {
    await this.runStage(
      context,
      'generate',
      '生成电子书',
      () => new GenerateWorkflow().execute(toLegacyTaskConfig(config), context),
      {
        taskCount: config.tasks.length,
        title: config.generate.title,
        mode: config.generate.mode,
        imageQuality: config.generate.imageQuality,
        outputFormats: config.generate.outputFormats,
        outputPath: context.outputPath,
      },
    )
  }

  private async runStage(
    context: RunContext,
    stage: RunStage,
    label: string,
    handler: () => Promise<void>,
    details: { [key: string]: unknown },
  ): Promise<void> {
    const startedAt = Date.now()
    Logger.event({
      runId: context.runId,
      stage,
      status: 'start',
      level: 'info',
      message: `开始${label}`,
      details,
    })
    try {
      await handler()
      Logger.event({
        runId: context.runId,
        stage,
        status: 'success',
        level: 'info',
        message: `${label}完成`,
        durationMs: Date.now() - startedAt,
        details,
      })
    } catch (error) {
      Logger.event({
        runId: context.runId,
        stage,
        status: 'failure',
        level: 'error',
        message: `${label}失败`,
        durationMs: Date.now() - startedAt,
        error: Logger.serializeError(error),
        details,
      })
      throw error
    }
  }

  private createConfigSummary(config: TaskConfig): { [key: string]: unknown } {
    return {
      request: {
        uaLength: config.request.ua.length,
        hasCookie: config.request.cookie.trim().length > 0,
        cookieLength: config.request.cookie.length,
      },
      taskCount: config.tasks.length,
      enabledTaskCount: config.tasks.filter((task) => task.skipFetch === false).length,
      skippedTaskCount: config.tasks.filter((task) => task.skipFetch).length,
      tasks: config.tasks.map((task, index) => ({
        index,
        type: task.type,
        id: task.id,
        rawInputText: task.rawInputText,
        comment: task.comment,
        skipFetch: task.skipFetch,
      })),
      generate: {
        title: config.generate.title,
        mode: config.generate.mode,
        imageQuality: config.generate.imageQuality,
        maxItemsPerBook: config.generate.maxItemsPerBook,
        outputFormats: config.generate.outputFormats,
        orderBy: config.generate.orderBy,
        comment: config.generate.comment,
      },
    }
  }

  private createContextDetails(context: RunContext): { [key: string]: unknown } {
    return {
      runId: context.runId,
      configPath: context.configPath,
      databasePath: context.databasePath,
      outputPath: context.outputPath,
    }
  }
}
