import path from 'path'
class Path {
    // 根路径
    static readonly rootPath = path.resolve(__dirname, '../../')
    static readonly resourcePath = path.resolve(Path.rootPath, 'src', 'public')
    static readonly cachePath = path.resolve(Path.rootPath, '缓存文件')
    static readonly imgCachePath = path.resolve(Path.cachePath, 'imgPool')
    static readonly htmlCachePath = path.resolve(Path.cachePath, 'html')
    // static readonly epubCachePath = path.resolve(Path.cachePath, 'epub')
    static readonly outputPath = path.resolve(Path.rootPath, '知乎助手输出的电子书')
    // static readonly epubOutputPath = path.resolve(Path.outputPath, 'epub')
    static readonly htmlOutputPath = path.resolve(Path.outputPath, 'html')

    static readonly allPathList = [
        Path.rootPath,

        Path.cachePath,
        Path.imgCachePath,
        Path.htmlCachePath,

        Path.outputPath,
        Path.htmlOutputPath,
    ]
}

export default Path