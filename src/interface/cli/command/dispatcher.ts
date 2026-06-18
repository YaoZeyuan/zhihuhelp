import RunTaskWorkflow from '~/src/application/workflow/run_task/run_task_workflow'
import { CliCommand } from '~/src/interface/cli/parser'

/**
 * 将 Optique 解析出的 CLI 指令派发到 application workflow。
 */
export async function dispatchCliCommand(command: CliCommand): Promise<void> {
  const workflow = new RunTaskWorkflow()

  switch (command.action) {
    case 'init':
      await workflow.init({
        configPath: command.configPath,
        databasePath: command.databasePath,
        rebase: command.rebase,
      })
      return
    case 'fetch':
      await workflow.fetch({
        configPath: command.configPath,
        databasePath: command.databasePath,
      })
      return
    case 'generate':
      await workflow.generate({
        configPath: command.configPath,
        databasePath: command.databasePath,
        outputPath: command.outputPath,
      })
      return
    case 'run':
      await workflow.run({
        configPath: command.configPath,
        databasePath: command.databasePath,
        outputPath: command.outputPath,
        rebase: command.rebase,
      })
      return
  }
}
