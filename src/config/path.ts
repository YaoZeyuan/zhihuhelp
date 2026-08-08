import path from 'path'
export default class PathConfig {
  // 根路径
  static readonly rootPath = path.resolve(__dirname, '../../')
  // 项目打包时只打包dist目录, 因此路径中不能带src
  static readonly resourcePath = path.resolve(path.resolve(__dirname, '../'), 'public')
  static cachePath = path.resolve(PathConfig.rootPath, '缓存文件')
  static imgCachePath = path.resolve(PathConfig.cachePath, 'imgPool')
  static htmlCachePath = path.resolve(PathConfig.cachePath, 'html')
  static epubCachePath = path.resolve(PathConfig.cachePath, 'epub')
  static logPath = path.resolve(PathConfig.rootPath, 'log')
  static outputPath = path.resolve(PathConfig.rootPath, '知乎助手输出的电子书')
  static epubOutputPath = path.resolve(PathConfig.outputPath, 'epub')
  static htmlOutputPath = path.resolve(PathConfig.outputPath, 'html')

  // package.json文件
  static readonly packageJsonUri = path.resolve(PathConfig.rootPath, 'package.json')

  // 本地配置文件, 随时更新
  static configUri = path.resolve(PathConfig.rootPath, 'config.json')
  static get runtimeLogUri() {
    return PathConfig.getRuntimeLogUri(new Date())
  }

  static get runtimeJsonlUri() {
    return PathConfig.getRuntimeJsonlUri(new Date())
  }

  static get frontendRuntimeJsonlUri() {
    return PathConfig.getFrontendRuntimeJsonlUri(new Date())
  }

  static get allPathList() {
    return [
      PathConfig.rootPath,
      PathConfig.cachePath,
      PathConfig.imgCachePath,
      PathConfig.htmlCachePath,
      PathConfig.epubCachePath,
      PathConfig.logPath,
      PathConfig.outputPath,
      PathConfig.epubOutputPath,
      PathConfig.htmlOutputPath,
    ]
  }

  static setConfigUri(configUri: string) {
    PathConfig.configUri = path.resolve(configUri)
  }

  static setOutputPath(outputPath: string) {
    PathConfig.outputPath = path.resolve(outputPath)
    PathConfig.epubOutputPath = path.resolve(PathConfig.outputPath, 'epub')
    PathConfig.htmlOutputPath = path.resolve(PathConfig.outputPath, 'html')
  }

  static setCachePath(cachePath: string) {
    PathConfig.cachePath = path.resolve(cachePath)
    PathConfig.imgCachePath = path.resolve(PathConfig.cachePath, 'imgPool')
    PathConfig.htmlCachePath = path.resolve(PathConfig.cachePath, 'html')
    PathConfig.epubCachePath = path.resolve(PathConfig.cachePath, 'epub')
  }

  static setLogPath(logPath: string) {
    PathConfig.logPath = path.resolve(logPath)
  }

  static getRuntimeLogUri(date: Date) {
    return path.resolve(PathConfig.logPath, `runtime.${PathConfig.formatLocalDate(date)}.log`)
  }

  static getRuntimeJsonlUri(date: Date) {
    return path.resolve(PathConfig.logPath, `runtime.${PathConfig.formatLocalDate(date)}.jsonl`)
  }

  static getFrontendRuntimeJsonlUri(date: Date) {
    return path.resolve(PathConfig.logPath, `frontend.runtime.${PathConfig.formatLocalDate(date)}.jsonl`)
  }

  private static formatLocalDate(date: Date) {
    const pad = (value: number) => `${value}`.padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  }
}
