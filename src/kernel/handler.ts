/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                         𒁈 AVENIX-MULTI V6.0.0 𒁈                          ┃
 * ┃                    HANDLER PRINCIPAL - TYPESCRIPT                           ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import path from 'path'
import { format } from 'util'
import { fileURLToPath } from 'url'
import { unwatchFile, watchFile } from 'fs'
import { jidNormalizedUser } from '@whiskeysockets/baileys'
import type { BaileysEventMap, GroupMetadata, GroupParticipant, WAMessageKey } from '@whiskeysockets/baileys'
import paint from '../lib/paint.js'
import print from '../lib/print.js'
import { hasRole, isVerified, isVip } from '../lib/roles.js'
import { smsg } from '../lib/simple.js'
import type {
  AvenixSocket,
  BaseContext,
  DBChat,
  DBSettings,
  DBUser,
  FailHandler,
  PluginContext,
  PluginMeta,
  SMessage
} from '../types/index.js'

const isNumber = (x: unknown): x is number => typeof x === 'number' && !isNaN(x)
const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))
const num = (value: unknown, fallback: number) => (isNumber(value) ? value : fallback)
const bool = (obj: object, key: string, fallback: boolean): boolean =>
  key in obj ? Boolean((obj as Record<string, unknown>)[key]) : fallback

const PLUGINS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../plugins')
const BAN_EXEMPT_PLUGINS = ['grupo-unbanchat', 'owner-exec', 'owner-exec2']
const escapeRegex = (str: string) => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')

// Contadores numéricos que todo usuario debe tener
const USER_COUNTERS = [
  'lastadventure', 'lastclaim', 'lastcofre', 'lastdiamantes', 'lastpago', 'lastcode', 'lastcodereg',
  'lastduel', 'lastmining', 'lastdungeon', 'lastfishing', 'lastfight', 'lasthunt', 'lastweekly',
  'lastmonthly', 'lastyearly', 'lastjb', 'lastrob', 'lastgift', 'lastreward', 'lastbet', 'crime',
  'pc', 'sp', 'spada', 'sword', 'legendary', 'pet', 'horse', 'fox', 'dog', 'cat', 'centaur', 'phoenix', 'dragon'
] as const

const CHAT_FLAGS: [string, boolean][] = [
  ['isBanned', false], ['welcome', true], ['detect', true], ['delete', false], ['antidelete', false],
  ['autolevelup', false], ['autoAceptar', true], ['autoRechazar', true], ['autosticker', false],
  ['autoresponder', false], ['antiBot', true], ['antiBot2', true], ['antiLink', true], ['antiLink2', false],
  ['antiFake', false], ['antifake', false], ['antiToxic', false], ['antiTraba', false], ['antiSpam', false],
  ['antiFlood', false], ['antiTelegram', false], ['antiDiscord', false], ['antiTiktok', false],
  ['antiYoutube', false], ['modoadmin', false], ['reaction', false], ['game', true], ['rpg', true],
  ['nsfw', false], ['modohorny', false], ['audios', true], ['autosimi', false], ['viewonce', false]
]

// ═══════════════════════════════════════════════════════════════════════════════
// │                       INICIALIZACIÓN DE DATOS                               │
// ═══════════════════════════════════════════════════════════════════════════════

function ensureUser(jid: string, name: string): DBUser {
  const users = global.db.data.users
  const user = users[jid] && typeof users[jid] === 'object' ? users[jid] : (users[jid] = {} as DBUser)

  for (const key of USER_COUNTERS) user[key] = num(user[key], 0)
  Object.assign(user, {
    exp: num(user.exp, 0),
    money: num(user.money, 10),
    diamond: num(user.diamond, 3),
    joincount: num(user.joincount, 1),
    health: num(user.health, 100),
    muto: bool(user, 'muto', false),
    banned: bool(user, 'banned', false),
    bannedReason: user.bannedReason || '',
    warn: num(user.warn, 0),
    premium: bool(user, 'premium', false),
    premiumTime: user.premium ? user.premiumTime || 0 : 0,
    registered: bool(user, 'registered', false),
    name: user.name || name,
    age: num(user.age, -1),
    regTime: num(user.regTime, -1),
    genre: user.genre || '',
    birth: user.birth || '',
    marry: user.marry || '',
    description: user.description || '',
    afk: num(user.afk, -1),
    afkReason: user.afkReason || '',
    role: user.role || 'Novato',
    level: num(user.level, 0),
    bank: num(user.bank, 0),
    useDocument: bool(user, 'useDocument', false),
    packstickers: user.packstickers || null,
    autolevelup: bool(user, 'autolevelup', true)
  })
  return user
}

function ensureChat(jid: string): DBChat {
  const chats = global.db.data.chats
  const chat = chats[jid] && typeof chats[jid] === 'object' ? chats[jid] : (chats[jid] = {} as DBChat)
  for (const [key, fallback] of CHAT_FLAGS) chat[key] = bool(chat, key, fallback)
  for (const key of ['sAutoresponder', 'sWelcome', 'sBye', 'sPromote', 'sDemote']) chat[key] ||= ''
  chat.expired = num(chat.expired, 0)
  return chat
}

function ensureSettings(botJid: string): DBSettings {
  const settings = (global.db.data.settings[botJid] ||= {} as DBSettings)
  Object.assign(settings, {
    self: bool(settings, 'self', false),
    restrict: bool(settings, 'restrict', true),
    jadibotmd: bool(settings, 'jadibotmd', true),
    antiPrivate: bool(settings, 'antiPrivate', false),
    autoread: bool(settings, 'autoread', false),
    antiCall: bool(settings, 'antiCall', false),
    antiSpam: bool(settings, 'antiSpam', false),
    status: settings.status || 0
  })
  return settings
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                              PERMISOS                                       │
// ═══════════════════════════════════════════════════════════════════════════════

const digits = (value: unknown) => String(value).replace(/\D/g, '')

// Marcas de rol opcionales de los plugins → lista global que las habilita
const ROLE_FLAGS = [
  ['dev', 'devs'], ['helper', 'helpers'], ['contributor', 'contributors'], ['betaTester', 'betaTesters'],
  ['donator', 'donators'], ['partner', 'partners'], ['influencer', 'influencers']
] as const

/** Todas las identidades (número y LID) bajo las que puede aparecer el remitente. */
function senderIdentities(m: SMessage): Set<string> {
  const key = m.key as WAMessageKey & { participantAlt?: string; remoteJidAlt?: string }
  return new Set(
    [m.sender, key.participant, key.participantAlt, m.isGroup ? undefined : key.remoteJidAlt]
      .filter((v): v is string => !!v)
      .map(jid => jidNormalizedUser(jid))
  )
}

function matchesParticipant(p: GroupParticipant, ids: Set<string>) {
  return [p.id, p.phoneNumber, p.lid].some(v => !!v && ids.has(jidNormalizedUser(v)))
}

function buildPrefixMatch(prefix: NonNullable<PluginMeta['customPrefix']>, text: string): PluginContext['match'] {
  const toRegex = (p: RegExp | string) => (p instanceof RegExp ? p : new RegExp(escapeRegex(p)))
  const list = Array.isArray(prefix) ? prefix : [prefix]
  for (const p of list) {
    const re = toRegex(p)
    const match = re.exec(text)
    if (match) return [match, re]
  }
  return undefined
}

function commandMatches(command: PluginMeta['command'], name: string) {
  if (command instanceof RegExp) return command.test(name)
  if (Array.isArray(command)) return command.some(c => (c instanceof RegExp ? c.test(name) : c === name))
  return command === name
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                           HANDLER PRINCIPAL                                 │
// ═══════════════════════════════════════════════════════════════════════════════

export async function handler(this: AvenixSocket, chatUpdate: BaileysEventMap['messages.upsert']) {
  const queue = (this.msgqueque ||= [])
  this.uptime ||= Date.now()
  if (!chatUpdate) return

  this.pushMessage(chatUpdate.messages).catch(console.error)
  // Solo los mensajes nuevos ejecutan comandos; 'append' es historial sincronizado
  if (chatUpdate.type !== 'notify') return

  const raw = chatUpdate.messages[chatUpdate.messages.length - 1]
  if (!raw) return
  if (!global.db.data) await global.loadDatabase()

  const m = smsg(this, raw)
  if (!m) return

  const botJid = this.user.jid
  let queued = false

  try {
    global.mconn = m
    m.exp = 0
    m.money = 0

    let userData: DBUser
    try {
      userData = ensureUser(m.sender, m.name)
      ensureChat(m.chat)
      global.setting = ensureSettings(botJid)
    } catch (e) {
      console.error('Error inicializando datos:', e)
      return
    }

    if (typeof m.text !== 'string') m.text = ''

    // ── Roles ────────────────────────────────────────────────────────────────
    const ids = senderIdentities(m)
    ids.add(await this.resolveLid(m.sender))
    const isROwner = hasRole('owner', ids)
    const isOwner = isROwner || m.fromMe
    const isMods = isOwner || hasRole('mods', ids)
    const isPrems = isROwner || userData.premiumTime > 0 || hasRole('prems', ids)

    // ── Cola de mensajes (procesa en orden a los usuarios normales) ───────────
    if (global.opts['queque'] && m.text && !isMods) {
      const previousID = queue[queue.length - 1]
      queue.push(m.id)
      queued = true
      for (let tries = 0; previousID && queue.includes(previousID) && tries < 30; tries++) await delay(1000)
    }

    if (m.isBaileys) return
    m.exp += Math.ceil(Math.random() * 10)

    // ── Metadatos del grupo ─────────────────────────────────────────────────
    const groupMetadata: Partial<GroupMetadata> = m.isGroup
      ? this.chats[m.chat]?.metadata || await this.groupMetadata(m.chat).catch(() => ({}))
      : {}
    const participants = groupMetadata.participants || []
    const botIds = new Set([botJid, this.user.lid].filter((v): v is string => !!v).map(jid => jidNormalizedUser(jid)))
    const user: Partial<GroupParticipant> = participants.find(p => matchesParticipant(p, ids)) || {}
    const bot: Partial<GroupParticipant> = participants.find(p => matchesParticipant(p, botIds)) || {}

    const isRAdmin = user.admin === 'superadmin'
    const isAdmin = isRAdmin || user.admin === 'admin'
    const isBotAdmin = !!bot.admin

    const base: BaseContext = {
      conn: this, participants, groupMetadata, user, bot,
      isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isPrems, isMods,
      chatUpdate, __dirname: PLUGINS_DIR, __filename: ''
    }

    // ── Plugins ─────────────────────────────────────────────────────────────
    for (const [name, plugin] of Object.entries(global.plugins)) {
      if (!plugin || plugin.disabled) continue
      const __filename = path.join(PLUGINS_DIR, name)

      if (typeof plugin.all === 'function') {
        try {
          await plugin.all.call(this, m, { chatUpdate, __dirname: PLUGINS_DIR, __filename })
        } catch (e) {
          console.error(`Error en plugin.all de ${name}:`, e)
        }
      }

      if (!global.opts['restrict'] && plugin.tags?.includes('admin')) continue

      const match = buildPrefixMatch(plugin.customPrefix || this.prefix || global.prefix, m.text)

      if (typeof plugin.before === 'function') {
        try {
          if (await plugin.before.call(this, m, { ...base, match, __filename })) continue
        } catch (e) {
          console.error(`Error en plugin.before de ${name}:`, e)
        }
      }

      if (typeof plugin !== 'function') continue
      const usedPrefix = match?.[0]?.[0]
      if (!usedPrefix) continue

      const noPrefix = m.text.replace(usedPrefix, '')
      const [rawCommand = '', ...args] = noPrefix.trim().split(' ').filter(Boolean)
      const _args = noPrefix.trim().split(' ').slice(1)
      const text = _args.join(' ')
      const command = rawCommand.toLowerCase()

      if (!commandMatches(plugin.command, command)) continue
      global.comando = command
      console.log(paint.green(`[✓] ${command} | Plugin: ${name} | User: ${m.sender.split('@')[0]}`))

      m.plugin = name
      const chat = global.db.data.chats[m.chat]
      const pluginId = name.replace(/\.(t|j)s$/, '')

      if (!BAN_EXEMPT_PLUGINS.includes(pluginId) && chat?.isBanned && !isROwner) return

      if (m.text && userData.banned && !isROwner) {
        await m.reply(`⚠️ *USUARIO BANEADO* 𒁈\n\nEstás baneado, no puedes usar comandos.\n\n${userData.bannedReason ? `📋 *Motivo:* ${userData.bannedReason}` : '📋 *Motivo:* Sin especificar'}\n\n💡 Si crees que esto es un error, contacta al propietario.`)
        return
      }

      if (chat?.modoadmin && m.isGroup && !isOwner && !isAdmin && (plugin.admin || plugin.botAdmin)) {
        console.log(paint.yellow(`[ModoAdmin] Bloqueado: ${command}`))
        return
      }

      const fail: FailHandler = plugin.fail || global.dfail
      const denied = (type: Parameters<FailHandler>[0]) => {
        fail(type, m, usedPrefix, command, this)
        return true
      }
      if (plugin.rowner && plugin.owner && !isOwner && denied('owner')) continue
      if (plugin.rowner && !isROwner && denied('rowner')) continue
      if (plugin.owner && !isOwner && denied('owner')) continue
      if (plugin.mods && !isMods && denied('mods')) continue
      if (plugin.premium && !isPrems && denied('premium')) continue
      if (plugin.group && !m.isGroup && denied('group')) continue
      if (plugin.botAdmin && !isBotAdmin && denied('botAdmin')) continue
      if (plugin.admin && !isAdmin && denied('admin')) continue
      if (plugin.private && m.isGroup && denied('private')) continue
      if (plugin.register && !userData.registered && denied('unreg')) continue
      if (!isOwner) {
        const missing = ROLE_FLAGS.find(([flag, list]) => plugin[flag] && !hasRole(list, ids))
        if (missing && denied(missing[0])) continue
        if (plugin.vip && !isVip(userData) && denied('vip')) continue
        if (plugin.verified && !isVerified(userData) && denied('verified')) continue
      }

      m.isCommand = true
      m.exp += plugin.exp !== undefined ? Number(plugin.exp) || 0 : 10

      if (!isPrems && plugin.money && userData.money < plugin.money) {
        await this.reply(m.chat, `💰 *MONEY INSUFICIENTE* 𒁈\n\nNecesitas: ${plugin.money} money\nTienes: ${userData.money} money`, m)
        continue
      }
      if (plugin.level && plugin.level > userData.level) {
        await this.reply(m.chat, `📊 *NIVEL INSUFICIENTE* 𒁈\n\nRequiere nivel: ${plugin.level}\nTu nivel: ${userData.level}\n\nUsa comandos para subir de nivel`, m)
        continue
      }

      const extra: PluginContext = { ...base, match, usedPrefix, noPrefix, _args, args, command, text, __filename }
      try {
        await plugin.call(this, m, extra)
        if (!isPrems) m.money = m.money || plugin.money || 0
      } catch (e) {
        m.error = e
        if (typeof e === 'string') {
          // Los plugins lanzan strings como respuesta de uso/validación
          await m.reply(e)
        } else {
          console.error(`Error ejecutando ${name}:`, e)
          let errText = format(e)
          for (const key of Object.values(global.APIKeys || {})) errText = errText.replaceAll(key, '#HIDDEN#')
          await m.reply(`❌ *ERROR* 𒁈\n\nOcurrió un error al ejecutar el comando.\n\n\`\`\`${errText.slice(0, 200)}\`\`\``)
        }
      } finally {
        if (typeof plugin.after === 'function') {
          try {
            await plugin.after.call(this, m, extra)
          } catch (e) {
            console.error(`Error en plugin.after de ${name}:`, e)
          }
        }
        if (m.money > 0) await this.reply(m.chat, `💰 Gastaste ${m.money} money`, m)
      }
      break
    }
  } catch (e) {
    console.error('Error general en handler:', e)
  } finally {
    if (queued) {
      const idx = queue.indexOf(m.id)
      if (idx !== -1) queue.splice(idx, 1)
    }

    const utente = global.db.data.users[m.sender]
    if (utente) {
      if (utente.muto) await this.sendMessage(m.chat, { delete: m.key }).catch(() => null)
      utente.exp += m.exp
      utente.money -= m.money
    }

    if (m.plugin) {
      const now = Date.now()
      const stat = (global.db.data.stats[m.plugin] ||= { total: 0, success: 0, last: 0, lastSuccess: 0 })
      stat.total += 1
      stat.last = now
      if (!m.error) {
        stat.success += 1
        stat.lastSuccess = now
      }
    }

    if (!global.opts['noprint']) await print(m, this).catch(e => console.log('Error en print:', e))
    if (global.opts['autoread']) await this.readMessages([m.key]).catch(() => null)
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                     HANDLER DE ACTUALIZACIÓN DE PARTICIPANTES              │
// ═══════════════════════════════════════════════════════════════════════════════

export async function participantsUpdate(
  this: AvenixSocket,
  { id, participants, action }: BaileysEventMap['group-participants.update']
) {
  if (global.opts['self'] || this.isInit) return
  if (!global.db.data) await global.loadDatabase()

  const chat = global.db.data.chats[id]
  if (!chat) return
  const jidOf = (p: GroupParticipant) => p.phoneNumber || p.id
  const tag = (p: GroupParticipant) => '@' + jidOf(p).split('@')[0]

  switch (action) {
    case 'add':
    case 'remove': {
      if (!chat.welcome) return
      const metadata = await this.groupMetadata(id).catch(() => null)
      const subject = metadata?.subject || await this.getName(id)
      for (const participant of participants) {
        const jid = jidOf(participant)
        const template = action === 'add'
          ? chat.sWelcome || this.welcome || global.welcome || global.bienvenida || '👋 Bienvenido @user al grupo'
          : chat.sBye || this.bye || global.bye || global.despedida || 'Adiós @user'
        const text = template
          .replace(/@user/g, tag(participant))
          .replace(/@subject/g, subject)
          .replace(/@desc/g, metadata?.desc?.toString() || 'Sin descripción')

        const image = await this.profilePictureUrl(participant.id, 'image').catch(() => undefined) || global.avatar
        if (image) await this.sendFile(id, image, 'pp.jpg', text, null, false, { mentions: [jid] }).catch(console.error)
        else await this.sendMessage(id, { text, mentions: [jid] }).catch(console.error)
      }
      break
    }
    case 'promote':
    case 'demote': {
      if (!chat.detect || !participants[0]) return
      const template = action === 'promote'
        ? chat.sPromote || this.spromote || global.spromote || global.promote || '@user ahora es admin'
        : chat.sDemote || this.sdemote || global.sdemote || global.demote || '@user ya no es admin'
      await this.sendMessage(id, {
        text: template.replace(/@user/g, tag(participants[0])),
        mentions: [jidOf(participants[0])]
      })
      break
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                     HANDLER DE ACTUALIZACIÓN DE GRUPOS                     │
// ═══════════════════════════════════════════════════════════════════════════════

export async function groupsUpdate(this: AvenixSocket, updates: BaileysEventMap['groups.update']) {
  if (global.opts['self']) return

  for (const update of updates) {
    const id = update.id
    if (!id) continue
    const chat = global.db.data.chats[id]
    if (!chat?.detect) continue

    if (update.desc) {
      await this.sendMessage(id, {
        text: (chat.sDesc || this.sDesc || global.sDesc || '📝 Descripción actualizada:\n@desc').replace('@desc', update.desc.toString())
      })
    }
    if (update.subject) {
      await this.sendMessage(id, {
        text: (chat.sSubject || this.sSubject || global.sSubject || '🏷️ Nombre actualizado:\n@subject').replace('@subject', update.subject)
      })
    }
    const revoke = (update as { revoke?: string }).revoke
    if (revoke) {
      await this.sendMessage(id, {
        text: (chat.sRevoke || this.sRevoke || global.sRevoke || '🔗 Link restablecido:\n@revoke').replace('@revoke', revoke)
      })
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                     HANDLER DE MENSAJES ELIMINADOS                         │
// ═══════════════════════════════════════════════════════════════════════════════

export async function deleteUpdate(this: AvenixSocket, update: BaileysEventMap['messages.delete']) {
  if (!('keys' in update)) return
  for (const key of update.keys) {
    try {
      if (key.fromMe || !key.id) continue
      const msg = this.serializeM(this.loadMessage(key.id))
      if (!msg) continue

      const chat = global.db.data.chats[msg.chat]
      if (!chat?.antidelete) continue

      const participant = key.participant || msg.sender
      let text = `🗑️ *MENSAJE ELIMINADO* 𒁈\n\n`
      text += `👤 Usuario: @${participant.split('@')[0]}\n`
      text += `⏰ Hora: ${new Date().toLocaleString('es-MX')}\n\n`
      if (msg.text) text += `💬 Texto:\n${msg.text}\n\n`
      text += `⚠️ Este mensaje fue eliminado por el usuario`

      await this.reply(msg.chat, text, null, { mentions: [participant] })
    } catch (e) {
      console.error('Error en deleteUpdate:', e)
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                         HANDLER DE LLAMADAS                                 │
// ═══════════════════════════════════════════════════════════════════════════════

export async function callUpdate(this: AvenixSocket, calls: BaileysEventMap['call']) {
  const settings = global.db.data.settings[this.user.jid]
  if (!settings?.antiCall) return

  for (const call of calls) {
    if (call.status !== 'offer' || call.isGroup) continue
    const callerId = call.callerPn || call.from
    await this.rejectCall(call.id, call.from).catch(() => null)
    await this.updateBlockStatus(call.from, 'block').catch(console.error)

    let text = `📞 *ANTI-CALL ACTIVADO* 𒁈\n\n`
    text += `👤 Usuario: @${callerId.split('@')[0]}\n`
    text += `🚫 Acción: Bloqueado automáticamente\n`
    text += `⚠️ Razón: Llamada rechazada\n\n`
    text += `💡 Para desactivar: *.anticall off*`

    for (const [number, , isDev] of global.owner) {
      if (!isDev || !number) continue
      await this.reply(`${digits(number)}@s.whatsapp.net`, text, null, { mentions: [callerId] }).catch(console.error)
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      FUNCIÓN DE MANEJO DE FALLOS                           │
// ═══════════════════════════════════════════════════════════════════════════════

global.dfail = (type, m, usedPrefix) => {
  const msg = {
    rowner: `🚫 *ACCESO RESTRINGIDO* 𒁈\n\nSolo el *Creador Principal* puede usar este comando.\n\n𒁈 *Avenix-Multi*`,
    owner: `🔒 *SOLO PROPIETARIO* 𒁈\n\nEste comando solo puede ser usado por el *Propietario* del bot.\n\n𒁈 *Avenix-Multi*`,
    mods: `⚙️ *SOLO MODERADORES* 𒁈\n\nEste comando es solo para *Moderadores*.\n\n𒁈 *Avenix-Multi*`,
    premium: `💎 *PREMIUM REQUERIDO* 𒁈\n\nEste comando es exclusivo para usuarios *Premium*.\n\nContacta al propietario para obtener acceso premium.\n\n𒁈 *Avenix-Multi*`,
    private: `👤 *SOLO CHAT PRIVADO* 𒁈\n\nEste comando solo funciona en chat privado.\n\n𒁈 *Avenix-Multi*`,
    admin: `👑 *SOLO ADMINISTRADORES* 𒁈\n\nEste comando solo puede ser usado por *Administradores* del grupo.\n\n𒁈 *Avenix-Multi*`,
    botAdmin: `🤖 *BOT NO ES ADMIN* 𒁈\n\nNecesito ser *Administrador* para usar este comando.\n\n𒁈 *Avenix-Multi*`,
    unreg: `📝 *REGISTRO REQUERIDO* 𒁈\n\nDebes registrarte para usar los comandos.\n\n📋 Regístrate con: *${usedPrefix || '.'}reg nombre.edad*\n📌 Ejemplo: *${usedPrefix || '.'}reg Juan.25*\n\n𒁈 *Avenix-Multi*`,
    restrict: `🚫 *FUNCIÓN DESHABILITADA* 𒁈\n\nEsta función fue deshabilitada por el propietario.\n\n𒁈 *Avenix-Multi*`,
    group: `📱 *SOLO GRUPOS* 𒁈\n\nEste comando solo funciona en grupos.\n\n𒁈 *Avenix-Multi*`,
    dev: `💻 *SOLO DESARROLLADORES* 𒁈\n\nEste comando es exclusivo para *Developers*.\n\n𒁈 *Avenix-Multi*`,
    helper: `🛠️ *SOLO HELPERS* 𒁈\n\nEste comando es exclusivo para *Helpers*.\n\n𒁈 *Avenix-Multi*`,
    contributor: `⭐ *SOLO CONTRIBUTORS* 𒁈\n\nEste comando es exclusivo para *Contributors*.\n\n𒁈 *Avenix-Multi*`,
    betaTester: `🧪 *SOLO BETA TESTERS* 𒁈\n\nEste comando es exclusivo para *Beta Testers*.\n\n𒁈 *Avenix-Multi*`,
    donator: `💝 *SOLO DONADORES* 𒁈\n\nEste comando es exclusivo para *Donadores*.\n\n𒁈 *Avenix-Multi*`,
    partner: `🤝 *SOLO PARTNERS* 𒁈\n\nEste comando es exclusivo para *Partners*.\n\n𒁈 *Avenix-Multi*`,
    influencer: `🌟 *SOLO INFLUENCERS* 𒁈\n\nEste comando es exclusivo para *Influencers*.\n\n𒁈 *Avenix-Multi*`,
    vip: `⭐ *SOLO VIP* 𒁈\n\nEste comando es exclusivo para usuarios *VIP* activos.\n\n𒁈 *Avenix-Multi*`,
    verified: `✅ *SOLO VERIFICADOS* 𒁈\n\nEste comando es exclusivo para usuarios *Verificados*.\n\n𒁈 *Avenix-Multi*`
  }[type]

  if (msg) return m.reply(msg).then(() => m.react('✖️'))
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                         OBSERVADOR DE ARCHIVOS                             │
// ═══════════════════════════════════════════════════════════════════════════════

const file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(paint.cyan('📁 Handler actualizado: handler.ts'))
  for (const subConn of global.conns || []) {
    if (subConn.user && subConn.ws.isOpen) subConn.subreloadHandler?.(false)
  }
})
