/**
 * Declaraciones de las variables globales del bot (definidas en kernel/config.ts y kernel/start.ts).
 */

import type { StrenorDatabase } from '../lib/storage.js'
import type { AvenixSocket, DatabaseSchema, FailHandler, Plugin, SMessage } from './index.js'

type RoleEntry = [number: string, name?: string, isDev?: boolean]
type Media = Buffer | null

interface RPGClass {
    name: string
    bonusHealth?: number
    bonusAttack?: number
    bonusDefense?: number
    bonusMagicAttack?: number
    bonusMana?: number
    bonusSpeed?: number
    bonusCritRate?: number
    requiredLevel: number
}

interface Achievement {
    name: string
    description: string
    points: number
    reward: Record<string, number>
}

type BotDatabase = StrenorDatabase<DatabaseSchema>

declare global {
    // ── Roles ──────────────────────────────────────────────────────────────────
    var owner: RoleEntry[]
    var devs: RoleEntry[]
    var mods: (RoleEntry | string | number)[]
    var helpers: RoleEntry[]
    var contributors: RoleEntry[]
    var betaTesters: RoleEntry[]
    var donators: RoleEntry[]
    var partners: RoleEntry[]
    var influencers: RoleEntry[]
    var prems: string[]

    // ── Conexión ───────────────────────────────────────────────────────────────
    var AvenixJadibts: boolean
    var botNumberCode: string
    var confirmCode: string
    var obtenerQrWeb: number
    var keepAliveRender: number
    var sessionName: string
    var sessions: string
    var nameqr: string
    var botNumber: string
    var conns: AvenixSocket[]
    var rutaJadiBot: string

    // ── Información del bot ────────────────────────────────────────────────────
    var botname: string
    var namebot: string
    var textbot: string
    var wm: string
    var author: string
    var dev: string
    var vs: string
    var vsJB: string
    var packname: string
    var stickpack: string
    var stickauth: string
    var wait: string
    var listo: string
    var error: string
    var loading: string
    var success: string

    // ── Redes ──────────────────────────────────────────────────────────────────
    var yt: string
    var ig: string
    var fb: string
    var tk: string
    var github: string
    var md: string
    var web: string
    var group: string
    var group2: string
    var canal: string
    var asistencia: string
    var comunidad: string

    // ── APIs ───────────────────────────────────────────────────────────────────
    var APIs: Record<string, string>
    var APIKeys: Record<string, string>
    var API: (name: string, path?: string, query?: Record<string, string>, apikeyqueryname?: string) => string

    // ── RPG ────────────────────────────────────────────────────────────────────
    var multiplier: number
    var maxLevel: number
    var maxwarn: number
    var monedas: string
    var moneda: string
    var diamond_emoji: string
    var gold_emoji: string
    var gem_emoji: string
    var limitDefault: number
    var expDefault: number
    var moneyDefault: number
    var diamondDefault: number
    var goldDefault: number
    var gemDefault: number
    var bankLimitDefault: number
    var maxBankLimit: number
    var classes: Record<string, RPGClass>
    var guildConfig: { createCost: number; maxMembers: number; minLevel: number; maxNameLength: number }
    var pvpConfig: {
        minLevel: number
        rewardWin: number
        rewardDraw: number
        cooldown: number
        arenaPointsPerWin: number
        streakBonus: number
    }
    var pvpRanks: Record<number, string>
    var achievements: Record<string, Achievement>
    var badges: Record<string, { emoji: string; name: string }>
    var cooldowns: Record<string, number>

    // ── Media ──────────────────────────────────────────────────────────────────
    var imagen1: Media
    var imagen2: Media
    var imagen3: Media
    var imagen4: Media
    var imagen5: Media
    var catalogo: Media
    var miniurl: Media
    var avatar: Media
    var logo: Media

    // ── Canales y mensajes ─────────────────────────────────────────────────────
    var ch: Record<string, string>
    var channelNames: Record<string, string>
    var resultado: string
    var advertencia: string
    var informacion: string
    var error_msg: string
    var exito: string
    var proceso: string
    var bienvenida: string
    var despedida: string
    var promote: string
    var demote: string
    var welcome: string | undefined
    var bye: string | undefined
    var spromote: string | undefined
    var sdemote: string | undefined
    var sDesc: string
    var sSubject: string
    var sIcon: string
    var sRevoke: string

    // ── Tiempo ─────────────────────────────────────────────────────────────────
    var timezone: string
    var botdate: () => string
    var bottime: () => string
    var botDateTime: () => string
    var formatDate: (date: Date | number | string) => string
    var formatTime: (date: Date | number | string) => string
    var formatDateTime: (date: Date | number | string) => string
    var timestamp: { start: Date; connect?: Date }

    // ── Rutas y opciones ───────────────────────────────────────────────────────
    var authFile: string
    var authFileJB: string
    var dbFile: string
    var sessionFolder: string
    var tempFolder: string
    var mediaFolder: string
    var pdoc: string[]
    var usePairingCode: boolean
    var useQR: boolean
    var maxSessions: number
    var autoRead: boolean
    var selfMode: boolean
    var gconly: boolean
    var pconly: boolean
    var limitDaily: number
    var limitPremium: number
    var limitVIP: number
    var antiSpam: { enabled: boolean; maxCommands: number; timeWindow: number; banTime: number }
    var notifications: Record<string, boolean>
    var roleMessages: Record<string, string>

    // ── Utilidades ─────────────────────────────────────────────────────────────
    var estilo: (texto: string) => Record<string, any>
    var formatNumber: (num: number | string) => string
    var getPvPRank: (rating: number) => string
    var xpToLevel: (xp: number) => number
    var levelToXp: (level: number) => number
    var generateId: () => string
    var hasBadge: (user: { badges?: string[] }, badgeName: string) => boolean
    var addBadge: (user: { badges?: string[] }, badgeName: string) => boolean
    var removeBadge: (user: { badges?: string[] }, badgeName: string) => boolean

    // ── Runtime (kernel/start.ts) ──────────────────────────────────────────────
    var opts: Record<string, any>
    var prefix: RegExp
    var db: BotDatabase
    var loadDatabase: () => Promise<DatabaseSchema>
    var conn: AvenixSocket
    var plugins: Record<string, Plugin>
    var reloadHandler: (restartConn?: boolean) => Promise<boolean>
    var reload: (event: string, filename: string | null) => Promise<unknown>
    var dfail: FailHandler
    var stopped: string | undefined
    var support: Readonly<Record<'ffmpeg' | 'ffprobe' | 'ffmpegWebp' | 'convert' | 'magick' | 'gm' | 'find', boolean>> | undefined
    var mconn: SMessage | undefined
    var comando: string | undefined
    var setting: Record<string, any> | undefined
    var filenameOf: (pathURL?: string, rmPrefix?: boolean) => string
    var dirnameOf: (pathURL: string) => string

    // ── Estadísticas usadas por plugins ────────────────────────────────────────
    var msgCount: Record<string, number> | undefined
    var totalMessages: number | undefined
    var totalUsers: number | undefined
    var totalChats: number | undefined
    var totalCommands: number | undefined
    var totalMediaMessages: number | undefined
    var startDate: Date | undefined
    var lastMessageDate: Date | undefined
}

export {}
