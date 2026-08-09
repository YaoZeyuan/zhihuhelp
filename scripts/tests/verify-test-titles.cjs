const fs = require('node:fs')
const path = require('node:path')
const { parseSync } = require('@babel/core')

const REPOSITORY_ROOT = path.resolve(__dirname, '..', '..')
const DEFAULT_TEST_ROOT = path.resolve(REPOSITORY_ROOT, 'tests')
const TEST_FILE_PATTERN = /\.test\.(?:[cm]?[jt]sx?)$/i
const TEST_API_NAME_SET = new Set(['describe', 'it', 'test'])
const TEST_API_BUILDER_METHOD_SET = new Set(['each', 'for', 'skipIf', 'runIf', 'extend'])
const HAN_CHARACTER_PATTERN = /\p{Script=Han}/u

function listTestFiles(testRoot = DEFAULT_TEST_ROOT) {
  const result = []

  function walk(currentPath) {
    for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
      const entryPath = path.resolve(currentPath, entry.name)
      if (entry.isDirectory()) {
        walk(entryPath)
      } else if (entry.isFile() && TEST_FILE_PATTERN.test(entry.name)) {
        result.push(entryPath)
      }
    }
  }

  if (fs.existsSync(testRoot)) {
    walk(testRoot)
  }
  return result.sort()
}

function getRootTestApiName(node) {
  if (node?.type === 'Identifier') {
    return node.name
  }
  if (node?.type === 'MemberExpression' || node?.type === 'OptionalMemberExpression') {
    return getRootTestApiName(node.object)
  }
  if (node?.type === 'CallExpression' || node?.type === 'OptionalCallExpression') {
    return getRootTestApiName(node.callee)
  }
  if (node?.type === 'TaggedTemplateExpression') {
    return getRootTestApiName(node.tag)
  }
  return undefined
}

function getMemberPropertyName(memberNode) {
  if (memberNode?.type !== 'MemberExpression' && memberNode?.type !== 'OptionalMemberExpression') {
    return undefined
  }
  if (memberNode.computed === false && memberNode.property?.type === 'Identifier') {
    return memberNode.property.name
  }
  if (memberNode.property?.type === 'StringLiteral') {
    return memberNode.property.value
  }
  return undefined
}

function isTestApiBuilderCall(node) {
  const propertyName = getMemberPropertyName(node?.callee)
  return TEST_API_BUILDER_METHOD_SET.has(propertyName)
}

function getStaticTitle(argumentNode, source) {
  if (argumentNode?.type === 'StringLiteral') {
    return {
      text: argumentNode.value,
      display: argumentNode.value,
    }
  }
  if (argumentNode?.type === 'TemplateLiteral') {
    return {
      text: argumentNode.quasis.map((item) => item.value.cooked ?? item.value.raw).join(''),
      display: source.slice(argumentNode.start, argumentNode.end),
    }
  }
  return undefined
}

function visitAst(node, visitor) {
  if (node === null || typeof node !== 'object') {
    return
  }
  if (typeof node.type === 'string') {
    visitor(node)
  }
  for (const [key, value] of Object.entries(node)) {
    if (['loc', 'start', 'end', 'extra', 'tokens', 'comments', 'errors'].includes(key)) {
      continue
    }
    if (Array.isArray(value)) {
      for (const child of value) {
        visitAst(child, visitor)
      }
    } else if (value !== null && typeof value === 'object') {
      visitAst(value, visitor)
    }
  }
}

function inspectTestFile(filePath, testRoot) {
  const source = fs.readFileSync(filePath, 'utf8')
  const relativePath = path.relative(testRoot, filePath).split(path.sep).join('/')
  const violations = []
  let titleCount = 0
  let ast

  try {
    ast = parseSync(source, {
      filename: filePath,
      babelrc: false,
      configFile: false,
      sourceType: 'unambiguous',
      parserOpts: {
        plugins: ['typescript', 'jsx', ['decorators', { decoratorsBeforeExport: true }]],
      },
    })
  } catch (error) {
    violations.push({
      file: relativePath,
      line: error?.loc?.line ?? 1,
      title: '<无法解析>',
      reason: error instanceof Error ? error.message : String(error),
    })
    return { titleCount, violations }
  }

  visitAst(ast, (node) => {
    if (node.type !== 'CallExpression' && node.type !== 'OptionalCallExpression') {
      return
    }
    const apiName = getRootTestApiName(node.callee)
    if (TEST_API_NAME_SET.has(apiName) === false || node.arguments.length === 0) {
      return
    }
    if (isTestApiBuilderCall(node)) {
      return
    }

    const argumentNode = node.arguments[0]
    const title = getStaticTitle(argumentNode, source)
    titleCount += 1
    if (title === undefined) {
      violations.push({
        file: relativePath,
        line: argumentNode.loc?.start?.line ?? node.loc?.start?.line ?? 1,
        title: source.slice(argumentNode.start, argumentNode.end),
        reason: '测试标题必须使用可静态检查的字符串或模板字符串',
      })
      return
    }

    if (HAN_CHARACTER_PATTERN.test(title.text) === false) {
      violations.push({
        file: relativePath,
        line: argumentNode.loc?.start?.line ?? node.loc?.start?.line ?? 1,
        title: title.display,
        reason: '测试标题必须包含中文描述',
      })
    }
  })

  return { titleCount, violations }
}

function verifyTestTitles({ testRoot = DEFAULT_TEST_ROOT } = {}) {
  const testFiles = listTestFiles(testRoot)
  const violations = []
  let titleCount = 0

  for (const filePath of testFiles) {
    const fileResult = inspectTestFile(filePath, testRoot)
    titleCount += fileResult.titleCount
    violations.push(...fileResult.violations)
  }

  return {
    testRoot,
    fileCount: testFiles.length,
    titleCount,
    violations,
  }
}

function runCli() {
  const result = verifyTestTitles()
  if (result.violations.length > 0) {
    console.error(`测试标题语言检查失败：发现 ${result.violations.length} 项问题。`)
    for (const violation of result.violations) {
      console.error(`${violation.file}:${violation.line} ${violation.reason}：${violation.title}`)
    }
    process.exitCode = 1
    return
  }

  console.log(`测试标题语言检查通过：${result.fileCount} 个文件，${result.titleCount} 个标题。`)
}

module.exports = {
  getRootTestApiName,
  getStaticTitle,
  inspectTestFile,
  isTestApiBuilderCall,
  listTestFiles,
  verifyTestTitles,
}

if (require.main === module) {
  runCli()
}
