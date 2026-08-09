import fs from 'fs'
import InitWorkflow from '~/src/application/workflow/init/init_workflow.js'
import FetchWorkflow from '~/src/application/workflow/fetch/customer.js'
import GenerateWorkflow from '~/src/application/workflow/generate/customer.js'
import {
  ensureTaskConfigFile,
  readTaskConfig,
} from '~/src/shared/config/task_config_parser.js'
import { createRunContext, RunContext, RunContextOptions, RunStage } from '~/src/shared/runtime/run_context.js'
import { TaskConfig, toLegacyTaskConfig } from '~/src/domain/task/task_config.js'
import Logger from '~/src/library/logger.js'
import {
  LogEventCode,
  LogLevel,
  LogStage,
  LogStatus,
} from '~/src/shared/logging/log_contract.js'
import { ExecutionOutcome, isExecutionOutcome } from '~/src/shared/runtime/execution_outcome.js'
import { runWithLogCorrelation } from '~/src/shared/runtime/log_correlation_context.js'

export type RunTaskWorkflowOptions = RunContextOptions & {
  rebase?: boolean
}

type WorkflowAction = 'init' | 'fetch' | 'generate' | 'run'
type StageTerminalStatus = typeof LogStatus.SUCCESS | typeof LogStatus.PARTIAL_SUCCESS
type StageResult = void | ExecutionOutcome | StageTerminalStatus

/**
 * CLI/GUI 共享的任务入口。
 *
 * 这里负责创建运行上下文、读取配置，并编排 init/fetch/generate 的完整链路。
 */
export default class RunTaskWorkflow {
  async init(options: RunTaskWorkflowOptions): Promise<RunContext> {
    const context = createRunContext(options)
    return this.runCommand('init', context, options, async () => {
      this.ensureConfig(context, 'init')
      await this.runInit(options, context, 'init')
      return context
    })
  }

  async fetch(options: RunTaskWorkflowOptions): Promise<RunContext> {
    const context = createRunContext(options)
    return this.runCommand('fetch', context, options, async () => {
      const config = this.readConfig(context, 'fetch')
      await this.runFetch(config, context, 'fetch')
      return context
    })
  }

  async generate(options: RunTaskWorkflowOptions): Promise<RunContext> {
    const context = createRunContext(options)
    return this.runCommand('generate', context, options, async () => {
      const config = this.readConfig(context, 'generate')
      await this.runGenerate(config, context, 'generate')
      return context
    })
  }

  async run(options: RunTaskWorkflowOptions): Promise<RunContext> {
    const context = createRunContext(options)
    return this.runCommand('run', context, options, async () => {
      this.ensureConfig(context, 'run')
      await this.runInit(options, context, 'run')
      const config = this.readConfig(context, 'run')
      await this.runFetch(config, context, 'run')
      await this.runGenerate(config, context, 'run')
      return context
    })
  }

  private async runCommand(
    action: WorkflowAction,
    context: RunContext,
    options: RunTaskWorkflowOptions,
    handler: () => Promise<RunContext>,
  ): Promise<RunContext> {
    return runWithLogCorrelation({ traceId: context.traceId, runId: context.runId }, async () => {
    const startedAt = Date.now()
    const jobId = `workflow-${action}`
    Logger.event({
      traceId: context.traceId,
      runId: context.runId,
      jobId,
      eventCode: LogEventCode.WORKFLOW_START,
      stage: context.trigger === 'gui' ? LogStage.IPC : LogStage.CLI,
      status: LogStatus.START,
      level: LogLevel.INFO,
      message: `开始执行 ${action} 工作流`,
      details: {
        action,
        rebase: options.rebase ?? false,
        ...this.createContextDetails(context),
      },
    })

    try {
      const result = await handler()
      const terminalStatus = context.outcomeStatus
      Logger.event({
        traceId: context.traceId,
        runId: context.runId,
        jobId,
        eventCode:
          terminalStatus === LogStatus.PARTIAL_SUCCESS
            ? LogEventCode.WORKFLOW_PARTIAL_SUCCESS
            : LogEventCode.WORKFLOW_SUCCESS,
        stage: context.trigger === 'gui' ? LogStage.IPC : LogStage.CLI,
        status: terminalStatus,
        level: terminalStatus === LogStatus.PARTIAL_SUCCESS ? LogLevel.WARN : LogLevel.INFO,
        message: terminalStatus === LogStatus.PARTIAL_SUCCESS ? `${action} 工作流部分完成` : `${action} 工作流执行完成`,
        durationMs: Date.now() - startedAt,
        details: {
          action,
          ...this.createContextDetails(context),
        },
      })
      return result
    } catch (error) {
      Logger.event({
        traceId: context.traceId,
        runId: context.runId,
        jobId,
        eventCode: LogEventCode.WORKFLOW_FAILURE,
        stage: context.trigger === 'gui' ? LogStage.IPC : LogStage.CLI,
        status: LogStatus.FAILURE,
        level: LogLevel.ERROR,
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
    })
  }

  private ensureConfig(context: RunContext, action: WorkflowAction): void {
    const startedAt = Date.now()
    const jobId = `config-ensure-${action}`
    const existedBefore = fs.existsSync(context.configPath)
    Logger.event({
      runId: context.runId,
      jobId,
      stage: LogStage.CONFIG,
      status: LogStatus.START,
      level: LogLevel.INFO,
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
        jobId,
        stage: LogStage.CONFIG,
        status: LogStatus.SUCCESS,
        level: LogLevel.INFO,
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
        jobId,
        stage: LogStage.CONFIG,
        status: LogStatus.FAILURE,
        level: LogLevel.ERROR,
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

  private readConfig(context: RunContext, action: WorkflowAction): TaskConfig {
    const startedAt = Date.now()
    const jobId = `config-read-${action}`
    Logger.event({
      runId: context.runId,
      jobId,
      stage: LogStage.CONFIG,
      status: LogStatus.START,
      level: LogLevel.INFO,
      message: '读取任务配置',
      details: {
        configPath: context.configPath,
      },
    })
    try {
      const config = readTaskConfig(context.configPath)
      Logger.event({
        runId: context.runId,
        jobId,
        stage: LogStage.CONFIG,
        status: LogStatus.SUCCESS,
        level: LogLevel.INFO,
        message: '任务配置读取完成',
        durationMs: Date.now() - startedAt,
        details: this.createConfigSummary(config),
      })
      return config
    } catch (error) {
      Logger.event({
        runId: context.runId,
        jobId,
        stage: LogStage.CONFIG,
        status: LogStatus.FAILURE,
        level: LogLevel.ERROR,
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

  private async runInit(options: RunTaskWorkflowOptions, context: RunContext, action: WorkflowAction): Promise<void> {
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
      `stage-init-${action}`,
    )
  }

  private async runFetch(config: TaskConfig, context: RunContext, action: WorkflowAction): Promise<ExecutionOutcome> {
    return this.runStage(
      context,
      'fetch',
      '抓取任务',
      () => new FetchWorkflow().execute(toLegacyTaskConfig(config), context),
      {
        taskCount: config.tasks.length,
        enabledTaskCount: config.tasks.filter((task) => task.skipFetch === false).length,
        skippedTaskCount: config.tasks.filter((task) => task.skipFetch).length,
      },
      `stage-fetch-${action}`,
    )
  }

  private async runGenerate(config: TaskConfig, context: RunContext, action: WorkflowAction): Promise<void> {
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
      `stage-generate-${action}`,
    )
  }

  private async runStage<T extends StageResult>(
    context: RunContext,
    stage: RunStage,
    label: string,
    handler: () => Promise<T>,
    details: { [key: string]: unknown },
    jobId: string,
  ): Promise<T> {
    const startedAt = Date.now()
    const outcomeStatusBeforeStage = context.outcomeStatus
    Logger.event({
      traceId: context.traceId,
      runId: context.runId,
      jobId,
      stage,
      status: LogStatus.START,
      level: LogLevel.INFO,
      message: `开始${label}`,
      details,
    })
    try {
      const result = await handler()
      let terminalStatus: StageTerminalStatus
      if (isExecutionOutcome(result)) {
        terminalStatus = result.status
      } else if (result === LogStatus.SUCCESS || result === LogStatus.PARTIAL_SUCCESS) {
        terminalStatus = result
      } else {
        terminalStatus = context.outcomeStatus !== outcomeStatusBeforeStage
          ? context.outcomeStatus
          : LogStatus.SUCCESS
      }
      if (terminalStatus === LogStatus.PARTIAL_SUCCESS) {
        context.outcomeStatus = LogStatus.PARTIAL_SUCCESS
      }
      Logger.event({
        traceId: context.traceId,
        runId: context.runId,
        jobId,
        stage,
        status: terminalStatus,
        level: terminalStatus === LogStatus.PARTIAL_SUCCESS ? LogLevel.WARN : LogLevel.INFO,
        message: terminalStatus === LogStatus.PARTIAL_SUCCESS ? `${label}部分完成` : `${label}完成`,
        durationMs: Date.now() - startedAt,
        details,
      })
      return result
    } catch (error) {
      Logger.event({
        traceId: context.traceId,
        runId: context.runId,
        jobId,
        stage,
        status: LogStatus.FAILURE,
        level: LogLevel.ERROR,
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
      traceId: context.traceId,
      configPath: context.configPath,
      databasePath: context.databasePath,
      outputPath: context.outputPath,
      cachePath: context.cachePath,
      logPath: context.logPath,
    }
  }
}
