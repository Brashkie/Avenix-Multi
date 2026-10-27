/**
 * Prueba de humo: importa cada módulo del bot y valida que los plugins exporten
 * un plugin válido. Se ejecuta en un directorio temporal para no dejar archivos.
 *
 *   npm run test:smoke
 */
import { mkdtempSync, readdirSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join, resolve } from 'path'
import { pathToFileURL } from 'url'

const root = resolve(import.meta.dirname, '..')
const workdir = mkdtempSync(join(tmpdir(), 'avenix-smoke-'))
process.chdir(workdir)

const load = (file: string) => import(pathToFileURL(join(root, file)).href)

await load('src/kernel/config.ts')
const { protoType, serialize } = await load('src/lib/simple.ts')
protoType()
serialize()
const { StrenorDatabase } = await load('src/lib/storage.ts')
global.opts = {}
global.db = new StrenorDatabase('database', { users: {}, chats: {}, settings: {}, stats: {}, msgs: {}, sticker: {} })
await global.db.read()

let ok = 0
const failed: string[] = []
for (const dir of ['src/lib', 'src/plugins', 'src/kernel']) {
    for (const file of readdirSync(join(root, dir)).filter(f => f.endsWith('.ts') && f !== 'start.ts')) {
        try {
            const mod = await load(`${dir}/${file}`)
            if (dir === 'src/plugins') {
                const plugin = mod.default
                const valid = typeof plugin === 'function' || typeof plugin?.before === 'function' || typeof plugin?.all === 'function'
                if (!valid) {
                    failed.push(`${dir}/${file}: no exporta un plugin válido por defecto`)
                    continue
                }
            }
            ok++
        } catch (e: any) {
            failed.push(`${dir}/${file}: ${String(e?.message || e).split('\n')[0]}`)
        }
    }
}

// Ningún módulo debe persistir en JSON
const jsonFiles: string[] = []
const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name)
        if (entry.isDirectory()) walk(full)
        else if (entry.name.endsWith('.json')) jsonFiles.push(full.slice(workdir.length + 1))
    }
}
walk(workdir)
if (jsonFiles.length) failed.push(`Archivos JSON generados: ${jsonFiles.join(', ')}`)

const { closeAll } = await load('src/lib/storage.ts')
closeAll()
process.chdir(root)
rmSync(workdir, { recursive: true, force: true })

console.log(`\n✓ Módulos cargados: ${ok}`)
if (failed.length) {
    console.error(`✗ Fallos (${failed.length}):\n  ${failed.join('\n  ')}`)
    process.exit(1)
}
console.log('✓ Sin archivos JSON generados')
process.exit(0)
