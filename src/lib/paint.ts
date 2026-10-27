/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                     𒁈 AVENIX-MULTI - LIB/PAINT.TS 𒁈                          ┃
 * ┃         Estilos de consola encadenables construidos sobre ansimax            ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 *
 * Uso: paint.cyan.bold('texto'), paint.bold.bgRgb(255, 0, 0)('texto')
 */

import { color } from 'ansimax'

type Style = (text: string) => string

const STYLES = {
    black: color.black,
    red: color.red,
    green: color.green,
    yellow: color.yellow,
    blue: color.blue,
    magenta: color.magenta,
    cyan: color.cyan,
    white: color.white,
    gray: color.gray,
    grey: color.grey,
    orange: color.orange,
    purple: color.purple,
    redBright: color.brightRed,
    greenBright: color.brightGreen,
    yellowBright: color.brightYellow,
    blueBright: color.brightBlue,
    magentaBright: color.brightMagenta,
    cyanBright: color.brightCyan,
    whiteBright: color.brightWhite,
    bgBlack: color.bgBlack,
    bgRed: color.bgRed,
    bgGreen: color.bgGreen,
    bgYellow: color.bgYellow,
    bgBlue: color.bgBlue,
    bgMagenta: color.bgMagenta,
    bgCyan: color.bgCyan,
    bgWhite: color.bgWhite,
    bgBlueBright: color.bgHex('#5c7cfa'),
    bgMagentaBright: color.bgHex('#e599f7'),
    bold: color.bold,
    dim: color.dim,
    italic: color.italic,
    underline: color.underline,
    inverse: color.inverse,
    strikethrough: color.strikethrough,
    rainbow: color.rainbow
} satisfies Record<string, Style>

export type StyleName = keyof typeof STYLES

export type Paint = ((text: unknown) => string) & { readonly [K in StyleName]: Paint } & {
    rgb(r: number, g: number, b: number): Paint
    bgRgb(r: number, g: number, b: number): Paint
    hex(hex: string): Paint
    bgHex(hex: string): Paint
}

const FACTORIES = {
    rgb: color.rgb,
    bgRgb: color.bgRgb,
    hex: color.hex,
    bgHex: color.bgHex
} as const

function build(stack: readonly Style[]): Paint {
    const apply = (text: unknown): string => {
        let out = String(text)
        for (let i = stack.length - 1; i >= 0; i--) out = stack[i](out)
        return out
    }
    return new Proxy(apply, {
        get(target, prop) {
            if (typeof prop !== 'string') return Reflect.get(target, prop)
            if (prop in STYLES) return build([...stack, STYLES[prop as StyleName]])
            if (prop in FACTORIES) {
                const factory = FACTORIES[prop as keyof typeof FACTORIES] as (...a: never[]) => Style
                return (...args: never[]) => build([...stack, factory(...args)])
            }
            return Reflect.get(target, prop)
        }
    }) as Paint
}

export const paint: Paint = build([])

export default paint
