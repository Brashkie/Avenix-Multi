/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                     𒁈 AVENIX-MULTI - TYPES/INDEX.TS 𒁈                         ┃
 * ┃            Tipos compartidos: socket, mensajes, plugins y base de datos      ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import type {
    BaileysEventMap,
    Contact,
    GroupMetadata,
    GroupParticipant,
    WAMessage,
    WAMessageKey,
    WASocket,
    proto
} from '@whiskeysockets/baileys'

// ═══════════════════════════════════════════════════════════════════════════════
// │                                  STORE                                      │
// ═══════════════════════════════════════════════════════════════════════════════

export interface ChatStore {
    id: string
    name?: string
    subject?: string
    notify?: string
    vname?: string
    verifiedName?: string
    isChats?: boolean
    presences?: string
    metadata?: GroupMetadata
    messages?: Record<string, WAMessage>
    [key: string]: any
}

export interface FileInfo {
    res?: Response
    filename?: string
    mime: string
    ext: string
    data: Buffer
    deleteFile(): Promise<void> | undefined
}

export type Quoted = WAMessage | SMessage | proto.IWebMessageInfo | null | undefined
export type SendOptions = Record<string, any>

// ═══════════════════════════════════════════════════════════════════════════════
// │                             SOCKET EXTENDIDO                                │
// ═══════════════════════════════════════════════════════════════════════════════

export interface BotLogger {
    info(...args: unknown[]): void
    error(...args: unknown[]): void
    warn(...args: unknown[]): void
    debug(...args: unknown[]): void
    trace?(...args: unknown[]): void
    level?: string
    child?(...args: unknown[]): BotLogger
}

export interface ConnExtras {
    chats: Record<string, ChatStore>
    user: Contact & { jid: string }
    logger: BotLogger

    decodeJid(jid: string): string
    decodeJid(jid: string | null | undefined): string | null | undefined
    getName(jid?: string, withoutContact?: boolean): Promise<string>
    parseMention(text?: string): string[]
    reply(jid: string, text: string | Buffer, quoted?: Quoted, options?: SendOptions): Promise<WAMessage | undefined>
    getFile(path: string | Buffer | ArrayBuffer, saveToFile?: boolean): Promise<FileInfo>
    sendFile(
        jid: string,
        path: string | Buffer,
        filename?: string,
        caption?: string,
        quoted?: Quoted,
        ptt?: boolean,
        options?: SendOptions
    ): Promise<WAMessage | undefined>
    sendButton(
        jid: string,
        text: string,
        footer: string,
        buffer: string | Buffer | null | undefined,
        buttons: [string, string][],
        copy?: string | number | null,
        urls?: [string, string][] | null,
        quoted?: Quoted,
        options?: SendOptions
    ): Promise<string>
    sendList(
        jid: string,
        title: string,
        text: string,
        buttonText: string,
        listSections: unknown[],
        quoted?: Quoted,
        options?: SendOptions
    ): Promise<string>
    sendListB(
        jid: string,
        title: string,
        text: string,
        buttonText: string,
        buffer: string | Buffer | null | undefined,
        listSections: unknown[],
        quoted?: Quoted,
        options?: SendOptions
    ): Promise<string>
    sendSylph(
        jid: string,
        text: string,
        buffer: string | Buffer | null | undefined,
        title: string,
        body: string,
        url: string,
        quoted?: Quoted,
        options?: SendOptions
    ): Promise<string>
    sendSylphy(jid: string, medias: AlbumMedia[], options?: SendOptions & { delay?: number; quoted?: Quoted }): Promise<WAMessage>
    sendPayment(jid: string, amount: number, text: string, quoted?: Quoted, options?: SendOptions): Promise<string>
    sendEvent(jid: string, text: string, des: string, loc: string, link: string): Promise<string>
    sendPoll(jid: string, name: string, optiPoll: string[] | string[][], options?: SendOptions): Promise<WAMessage | undefined>
    sendContact(jid: string, data: [string, string] | [string, string][], quoted?: Quoted, options?: SendOptions): Promise<WAMessage | undefined>
    sendContactArray(jid: string, data: string[] | string[][], quoted?: Quoted, options?: SendOptions): Promise<WAMessage | undefined>
    downloadM(m: any, type: string, saveToFile?: boolean): Promise<Buffer | string>
    copyNForward(jid: string, message: any, forceForward?: boolean | number, options?: SendOptions): Promise<WAMessage>
    cMod(jid: string, message: any, text?: string, sender?: string, options?: SendOptions): proto.WebMessageInfo
    fakeReply(jid: string, text?: string, fakeJid?: string, fakeText?: string, fakeGroupJid?: string, options?: SendOptions): Promise<WAMessage | undefined>
    loadMessage(messageID: string): WAMessage | undefined
    processMessageStubType(m: WAMessage): Promise<void>
    insertAllGroup(): Promise<Record<string, ChatStore>>
    pushMessage(m: WAMessage | WAMessage[]): Promise<void>
    sendGroupV4Invite(
        jid: string,
        participant: string,
        inviteCode: string,
        inviteExpiration: number | string,
        groupName?: string,
        caption?: string,
        jpegThumbnail?: Buffer,
        options?: SendOptions
    ): Promise<WAMessage>
    waitEvent<E extends keyof BaileysEventMap>(eventName: E, is?: () => boolean, maxTries?: number): Promise<BaileysEventMap[E]>
    serializeM(m: WAMessage | undefined | null): SMessage | undefined
    setStatus(status: string): Promise<unknown>
    resolveLid(jid: string): Promise<string>

    // Estado de ejecución asignado por el kernel
    isInit?: boolean
    well?: boolean
    msgqueque?: string[]
    uptime?: number
    withoutContact?: boolean
    prefix?: Prefix
    welcome?: string
    bye?: string
    spromote?: string
    sdemote?: string
    sDesc?: string
    sSubject?: string
    sRevoke?: string
    handler?: (update: BaileysEventMap['messages.upsert']) => Promise<void>
    connectionUpdate?: (update: BaileysEventMap['connection.update']) => Promise<void>
    credsUpdate?: () => Promise<void>
    participantsUpdate?: (update: BaileysEventMap['group-participants.update']) => Promise<void>
    groupsUpdate?: (update: BaileysEventMap['groups.update']) => Promise<void>
    onDelete?: (key: WAMessageKey) => Promise<void>
    onCall?: (calls: BaileysEventMap['call']) => Promise<void>
    subreloadHandler?: (restartConn: boolean) => Promise<boolean>
    isSubBot?: boolean
    /** Estado temporal de descargas de YouTube (plugins/download-ytdl) */
    ytdl?: Record<string, any>
    /** Plantillas personalizadas del menú (plugins/main-menu) */
    menu?: Partial<Record<'before' | 'header' | 'body' | 'footer' | 'after', string>>
}

export type AvenixSocket = Omit<WASocket, 'user' | 'logger'> & ConnExtras

export interface AlbumMedia {
    type: 'image' | 'video'
    data: Buffer | { url: string }
    caption?: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                          MENSAJE SERIALIZADO                                │
// ═══════════════════════════════════════════════════════════════════════════════

interface MessageActions {
    download(saveToFile?: boolean): Promise<Buffer | string>
    reply(text: string | Buffer, chatId?: string | null, options?: SendOptions): Promise<WAMessage | undefined>
    copy(): SMessage
    forward(jid: string, force?: boolean, options?: SendOptions): Promise<WAMessage | undefined>
    copyNForward(jid: string, forceForward?: boolean | number, options?: SendOptions): Promise<WAMessage>
    cMod(jid: string, text?: string, sender?: string, options?: SendOptions): proto.WebMessageInfo
    delete(): Promise<WAMessage | undefined>
    react(text: string): Promise<WAMessage | undefined>
}

export interface QuotedMessage extends MessageActions {
    mtype: string
    mediaMessage: proto.IMessage | null
    mediaType: string | null
    id: string
    chat: string
    isBaileys: boolean
    sender: string
    fromMe: boolean
    text: string
    mentionedJid: string[]
    name: string
    vM: proto.WebMessageInfo
    fakeObj: proto.WebMessageInfo
    mimetype?: string
    seconds?: number
    caption?: string
    [key: string]: any
}

export interface SMessage extends proto.IWebMessageInfo, MessageActions {
    key: WAMessageKey
    conn: AvenixSocket
    id: string
    isBaileys: boolean
    chat: string
    isGroup: boolean
    sender: string
    fromMe: boolean
    mtype: string
    msg: any
    mediaMessage: proto.IMessage | null
    mediaType: string | null
    quoted: QuotedMessage | null
    text: string
    mentionedJid: string[]
    name: string
    getQuotedObj(): SMessage | null

    // Asignados por el handler
    exp: number
    money: number
    plugin?: string
    error?: unknown
    isCommand?: boolean
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                                 PLUGINS                                     │
// ═══════════════════════════════════════════════════════════════════════════════

export type Prefix = RegExp | string | (RegExp | string)[]

export interface BaseContext {
    conn: AvenixSocket
    participants: GroupParticipant[]
    groupMetadata: Partial<GroupMetadata>
    user: Partial<GroupParticipant>
    bot: Partial<GroupParticipant>
    isROwner: boolean
    isOwner: boolean
    isRAdmin: boolean
    isAdmin: boolean
    isBotAdmin: boolean
    isPrems: boolean
    isMods: boolean
    chatUpdate: BaileysEventMap['messages.upsert']
    __dirname: string
    __filename: string
}

export interface BeforeContext extends BaseContext {
    match: [RegExpExecArray | null, RegExp] | undefined
}

export interface PluginContext extends BeforeContext {
    usedPrefix: string
    noPrefix: string
    _args: string[]
    args: string[]
    command: string
    text: string
}

export type FailType =
    | 'rowner' | 'owner' | 'mods' | 'premium' | 'private' | 'admin'
    | 'botAdmin' | 'unreg' | 'restrict' | 'group'
    | 'dev' | 'helper' | 'contributor' | 'betaTester' | 'donator' | 'partner' | 'influencer' | 'vip' | 'verified'

export type FailHandler = (type: FailType, m: SMessage, usedPrefix: string, command: string, conn: AvenixSocket) => unknown

export interface PluginMeta {
    help?: string[]
    tags?: string[]
    command?: RegExp | string | (RegExp | string)[]
    customPrefix?: Prefix
    disabled?: boolean
    rowner?: boolean
    owner?: boolean
    mods?: boolean
    premium?: boolean
    group?: boolean
    private?: boolean
    admin?: boolean
    botAdmin?: boolean
    register?: boolean
    // Roles del sistema de 14 roles (kernel/config.ts)
    dev?: boolean
    helper?: boolean
    contributor?: boolean
    betaTester?: boolean
    donator?: boolean
    partner?: boolean
    influencer?: boolean
    vip?: boolean
    verified?: boolean
    limit?: number | boolean
    level?: number
    money?: number
    exp?: number
    priority?: number
    fail?: FailHandler
    before?: (this: AvenixSocket, m: SMessage, ctx: BeforeContext) => unknown
    all?: (this: AvenixSocket, m: SMessage, ctx: { chatUpdate: BaileysEventMap['messages.upsert']; __dirname: string; __filename: string }) => unknown
    after?: (this: AvenixSocket, m: SMessage, ctx: PluginContext) => unknown
}

export type PluginHandler = ((this: AvenixSocket, m: SMessage, ctx: PluginContext) => unknown) & PluginMeta
export type Plugin = PluginHandler | PluginMeta

// ═══════════════════════════════════════════════════════════════════════════════
// │                              BASE DE DATOS                                  │
// ═══════════════════════════════════════════════════════════════════════════════

export interface DBUser {
    exp: number
    money: number
    diamond: number
    level: number
    limit?: number
    health: number
    role: string
    name: string
    registered: boolean
    premium: boolean
    premiumTime: number
    banned: boolean
    bannedReason: string
    warn: number
    muto: boolean
    afk: number
    afkReason: string
    bank: number
    autolevelup: boolean
    badges?: string[]
    [key: string]: any
}

export interface DBChat {
    isBanned: boolean
    welcome: boolean
    detect: boolean
    antidelete: boolean
    modoadmin: boolean
    sWelcome: string
    sBye: string
    sPromote: string
    sDemote: string
    expired: number
    [key: string]: any
}

export interface DBSettings {
    self: boolean
    restrict: boolean
    jadibotmd: boolean
    antiPrivate: boolean
    autoread: boolean
    antiCall: boolean
    antiSpam: boolean
    status: number
    [key: string]: any
}

export interface PluginStat {
    total: number
    success: number
    last: number
    lastSuccess: number
}

export interface DatabaseSchema {
    users: Record<string, DBUser>
    chats: Record<string, DBChat>
    settings: Record<string, DBSettings>
    stats: Record<string, PluginStat>
    msgs: Record<string, any>
    sticker: Record<string, any>
    [key: string]: any
}
