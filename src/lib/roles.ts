/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                     𒁈 AVENIX-MULTI - LIB/ROLES.TS 𒁈                          ┃
 * ┃        Resolución del sistema de 14 roles definido en kernel/config.ts       ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import type { DBUser } from '../types/index.js'

export type RoleListName =
    | 'owner' | 'devs' | 'mods' | 'helpers' | 'contributors'
    | 'betaTesters' | 'donators' | 'partners' | 'influencers' | 'prems'

/** Normaliza una entrada de rol (`'519...'`, `519...` o `['519...', 'Nombre', true]`) a solo dígitos. */
export const roleNumber = (entry: unknown): string =>
    String(Array.isArray(entry) ? entry[0] : entry).replace(/\D/g, '')

/** Números (solo dígitos) de una lista de roles global. */
export function roleNumbers(list: RoleListName): Set<string> {
    const entries = (global[list] as unknown[] | undefined) || []
    return new Set(entries.map(roleNumber).filter(Boolean))
}

/** Comprueba si un JID o número pertenece a la lista de roles indicada. */
export function hasRole(list: RoleListName, jidOrNumber: string | Iterable<string>): boolean {
    const numbers = roleNumbers(list)
    const candidates = typeof jidOrNumber === 'string' ? [jidOrNumber] : jidOrNumber
    for (const c of candidates) if (numbers.has(c.split('@')[0].replace(/\D/g, ''))) return true
    return false
}

/** Owner con la marca de desarrollador (`global.owner = [['número', 'nombre', true]]`). */
export function isRootOwner(jidOrNumber: string): boolean {
    const n = jidOrNumber.split('@')[0].replace(/\D/g, '')
    return (global.owner || []).some(([number, , isDev]) => roleNumber(number) === n && !!isDev)
}

export const isVip = (user: Partial<DBUser> | undefined) => !!user?.vip && (user.vipTime || 0) > Date.now()
export const isVerified = (user: Partial<DBUser> | undefined) => !!user?.verified
