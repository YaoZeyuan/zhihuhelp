import path from 'path'
export default class PathConfig {
  // 根路径
  static readonly rootPath = path.resolve(__dirname, '../../')
  // 项目打包时只打包dist目录, 因此路径中不能带src
  static readonly resourcePath = path.resolve(path.resolve(__dirname, '../'), 'public')
  static readonly cachePath = path.resolve(PathConfig.rootPath, '缓存文件')
  static readonly imgCachePath = path.resolve(PathConfig.cachePath, 'imgPool')
  static readonly htmlCachePath = path.resolve(PathConfig.cachePath, 'html')
  static readonly epubCachePath = path.resolve(PathConfig.cachePath, 'epub')
  static readonly outputPath = path.resolve(PathConfig.rootPath, '知乎助手输出的电子书')
  static readonly epubOutputPath = path.resolve(PathConfig.outputPath, 'epub')
  static readonly htmlOutputPath = path.resolve(PathConfig.outputPath, 'html')

  // package.json文件
  static readonly packageJsonUri = path.resolve(PathConfig.rootPath, 'package.json')

  // 本地配置文件, 随时更新
  static readonly configUri = path.resolve(PathConfig.rootPath, 'config.json')
  static readonly runtimeLogUri = path.resolve(PathConfig.rootPath, 'runtime.log')

  static readonly allPathList = [
    PathConfig.rootPath,
    PathConfig.cachePath,
    PathConfig.imgCachePath,
    PathConfig.htmlCachePath,
    PathConfig.outputPath,
    PathConfig.epubOutputPath,
    PathConfig.htmlOutputPath,
  ]
}
