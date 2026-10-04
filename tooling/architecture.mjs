import path from 'node:path'

export function boundaryViolation(filename, specifier) {
  const normalized = filename.replaceAll('\\', '/')
  const root = normalized.lastIndexOf('/src/')
  if (root < 0) return null
  const source = normalized.slice(root + 5)
  const feature = /^features\/([^/]+)\/(.+)$/.exec(source)
  const layer = feature?.[2].split('/')[0]
  if (!specifier.startsWith('.')) {
    if (layer === 'domain' || layer === 'application')
      return 'Core code may only import its own domain and application.'
    if (
      specifier.startsWith('/') ||
      specifier.startsWith('@/') ||
      specifier.startsWith('~/') ||
      specifier.startsWith('#')
    )
      return 'Use relative imports so feature boundaries stay explicit.'
    return null
  }
  const target = path.posix
    .normalize(path.posix.join(path.posix.dirname(source), specifier))
    .replace(/\.(ts|vue|js|mjs)$/, '')
  const destination = /^features\/([^/]+)(?:\/(.*))?$/.exec(target)
  if (feature) {
    if (!destination)
      return 'Features cannot depend on application composition or files outside features.'
    if (feature[1] !== destination[1]) {
      if (layer === 'domain' || layer === 'application')
        return 'Core code cannot depend on another feature.'
      if (destination[2] && destination[2] !== 'index')
        return 'Import other features through their public index.'
      return null
    }
    const targetLayer = destination[2]?.split('/')[0]
    if (layer === 'domain' && targetLayer !== 'domain')
      return 'Domain imports must stay inside domain.'
    if (
      layer === 'application' &&
      !['domain', 'application'].includes(targetLayer)
    )
      return 'Application may only depend on domain and ports.'
    if (
      layer === 'adapters' &&
      !['domain', 'application', 'adapters'].includes(targetLayer)
    )
      return 'Adapters cannot depend on UI or public barrels.'
    if (layer === 'ui' && targetLayer === 'adapters')
      return 'UI receives services; it cannot import concrete adapters.'
    if (layer === 'index.ts' && targetLayer === 'adapters')
      return 'Keep concrete adapters out of the public feature API.'
  } else if (destination?.[2] && destination[2] !== 'index') {
    if (source === 'app/bootstrap.ts' && destination[2].startsWith('adapters/'))
      return null
    return 'Only app/bootstrap.ts may wire concrete adapters; use public feature APIs elsewhere.'
  }
  return null
}

export default {
  meta: { name: 'hamcrab-architecture' },
  rules: {
    boundaries: {
      meta: {
        type: 'problem',
        schema: [],
        messages: { boundary: '{{reason}}' },
      },
      create(context) {
        const filename = context.filename ?? context.getFilename()
        function check(node, source) {
          const value =
            source?.value ??
            (source?.type === 'TemplateLiteral' &&
            source.expressions.length === 0
              ? source.quasis[0].value.cooked
              : undefined)
          if (typeof value !== 'string') {
            if (filename.replaceAll('\\', '/').includes('/src/'))
              context.report({
                node,
                messageId: 'boundary',
                data: {
                  reason:
                    'Import paths must be static so boundaries can be checked.',
                },
              })
            return
          }
          const reason = boundaryViolation(filename, value)
          if (reason)
            context.report({ node, messageId: 'boundary', data: { reason } })
        }
        return {
          ImportDeclaration: (node) => check(node, node.source),
          ExportNamedDeclaration: (node) => {
            if (node.source) check(node, node.source)
          },
          ExportAllDeclaration: (node) => check(node, node.source),
          ImportExpression: (node) => check(node, node.source),
          TSImportType: (node) => check(node, node.argument ?? node.source),
          TSExternalModuleReference: (node) => check(node, node.expression),
          CallExpression: (node) => {
            if (
              node.callee.type === 'Identifier' &&
              node.callee.name === 'require'
            )
              check(node, node.arguments[0])
          },
        }
      },
    },
  },
}
