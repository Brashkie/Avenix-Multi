/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                         𒁈 AVENIX-MULTI V6.1.0 𒁈                          ┃
 * ┃                     HANDLER FINAL - 100% FUNCIONAL                         ┃
 * ┃                  ERROR v.replace CORREGIDO - VERSIÓN ESTABLE               ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import { generateWAMessageFromContent } from '@whiskeysockets/baileys'
import { smsg } from '../lib/simple.js'
import { format } from 'util'
import { fileURLToPath } from 'url'
import path, { join } from 'path'
import { unwatchFile, watchFile } from 'fs'
import fs from 'fs'
import chalk from 'chalk'
import ws from 'ws'

const { proto } = (await import('@whiskeysockets/baileys')).default
const isNumber = x => typeof x === 'number' && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(() => resolve(), ms))

// ═══════════════════════════════════════════════════════════════════════════════
// │                           HANDLER PRINCIPAL                                 │
// ═══════════════════════════════════════════════════════════════════════════════

export async function handler(chatUpdate) {
  this.msgqueque ||= []
  this.uptime ||= Date.now()
  
  if (!chatUpdate) return
  this.pushMessage(chatUpdate.messages).catch(console.error)

  let m = chatUpdate.messages[chatUpdate.messages.length - 1]
  if (!m) return
  if (!global.db.data) await global.loadDatabase()

  try {
    m = smsg(this, m) || m
    if (!m) return
    
    global.mconn = m
    m.exp = 0
    m.money = 0

    try {
      // ═════════════════════════════════════════════════════════════════════════
      // │              INICIALIZACIÓN DE USUARIO RPG COMPLETO                   │
      // ═════════════════════════════════════════════════════════════════════════
      
      let user = global.db.data.users[m.sender]
      if (!user || typeof user !== 'object') global.db.data.users[m.sender] = user = {}

      Object.assign(user, {
        exp: isNumber(user.exp) ? user.exp : 0,
        money: isNumber(user.money) ? user.money : 10,
        diamond: isNumber(user.diamond) ? user.diamond : 3,
        joincount: isNumber(user.joincount) ? user.joincount : 1,
        health: isNumber(user.health) ? user.health : 100,
        crime: isNumber(user.crime) ? user.crime : 0,
        lastadventure: isNumber(user.lastadventure) ? user.lastadventure : 0,
        lastclaim: isNumber(user.lastclaim) ? user.lastclaim : 0,
        lastcofre: isNumber(user.lastcofre) ? user.lastcofre : 0,
        lastdiamantes: isNumber(user.lastdiamantes) ? user.lastdiamantes : 0,
        lastpago: isNumber(user.lastpago) ? user.lastpago : 0,
        lastcode: isNumber(user.lastcode) ? user.lastcode : 0,
        lastcodereg: isNumber(user.lastcodereg) ? user.lastcodereg : 0,
        lastduel: isNumber(user.lastduel) ? user.lastduel : 0,
        lastmining: isNumber(user.lastmining) ? user.lastmining : 0,
        lastdungeon: isNumber(user.lastdungeon) ? user.lastdungeon : 0,
        lastfishing: isNumber(user.lastfishing) ? user.lastfishing : 0,
        lastfight: isNumber(user.lastfight) ? user.lastfight : 0,
        lasthunt: isNumber(user.lasthunt) ? user.lasthunt : 0,
        lastweekly: isNumber(user.lastweekly) ? user.lastweekly : 0,
        lastmonthly: isNumber(user.lastmonthly) ? user.lastmonthly : 0,
        lastyearly: isNumber(user.lastyearly) ? user.lastyearly : 0,
        lastjb: isNumber(user.lastjb) ? user.lastjb : 0,
        lastrob: isNumber(user.lastrob) ? user.lastrob : 0,
        lastgift: isNumber(user.lastgift) ? user.lastgift : 0,
        lastreward: isNumber(user.lastreward) ? user.lastreward : 0,
        lastbet: isNumber(user.lastbet) ? user.lastbet : 0,
        muto: 'muto' in user ? user.muto : false,
        banned: 'banned' in user ? user.banned : false,
        bannedReason: user.bannedReason || '',
        warn: isNumber(user.warn) ? user.warn : 0,
        premium: 'premium' in user ? user.premium : false,
        premiumTime: user.premium ? user.premiumTime || 0 : 0,
        registered: 'registered' in user ? user.registered : false,
        name: user.name || m.name,
        age: isNumber(user.age) ? user.age : -1,
        regTime: isNumber(user.regTime) ? user.regTime : -1,
        genre: user.genre || '',
        birth: user.birth || '',
        marry: user.marry || '',
        description: user.description || '',
        afk: isNumber(user.afk) ? user.afk : -1,
        afkReason: user.afkReason || '',
        role: user.role || 'Novato',
        level: isNumber(user.level) ? user.level : 0,
        bank: isNumber(user.bank) ? user.bank : 0,
        useDocument: 'useDocument' in user ? user.useDocument : false,
        packstickers: user.packstickers || null,
        pc: isNumber(user.pc) ? user.pc : 0,
        sp: isNumber(user.sp) ? user.sp : 0,
        spada: isNumber(user.spada) ? user.spada : 0,
        sword: isNumber(user.sword) ? user.sword : 0,
        legendary: isNumber(user.legendary) ? user.legendary : 0,
        pet: isNumber(user.pet) ? user.pet : 0,
        horse: isNumber(user.horse) ? user.horse : 0,
        fox: isNumber(user.fox) ? user.fox : 0,
        dog: isNumber(user.dog) ? user.dog : 0,
        cat: isNumber(user.cat) ? user.cat : 0,
        centaur: isNumber(user.centaur) ? user.centaur : 0,
        phoenix: isNumber(user.phoenix) ? user.phoenix : 0,
        dragon: isNumber(user.dragon) ? user.dragon : 0,
        autolevelup: 'autolevelup' in user ? user.autolevelup : true
      })

      // ═════════════════════════════════════════════════════════════════════════
      // │                 INICIALIZACIÓN DE CHAT COMPLETO                       │
      // ═════════════════════════════════════════════════════════════════════════
      
      let chat = global.db.data.chats[m.chat]
      if (!chat || typeof chat !== 'object') global.db.data.chats[m.chat] = chat = {}
      
      Object.assign(chat, {
        isBanned: 'isBanned' in chat ? chat.isBanned : false,
        sAutoresponder: chat.sAutoresponder || '',
        sWelcome: chat.sWelcome || '',
        sBye: chat.sBye || '',
        sPromote: chat.sPromote || '',
        sDemote: chat.sDemote || '',
        welcome: 'welcome' in chat ? chat.welcome : true,
        detect: 'detect' in chat ? chat.detect : true,
        delete: 'delete' in chat ? chat.delete : false,
        antidelete: 'antidelete' in chat ? chat.antidelete : false,
        autolevelup: 'autolevelup' in chat ? chat.autolevelup : false,
        autoAceptar: 'autoAceptar' in chat ? chat.autoAceptar : true,
        autoRechazar: 'autoRechazar' in chat ? chat.autoRechazar : true,
        autosticker: 'autosticker' in chat ? chat.autosticker : false,
        autoresponder: 'autoresponder' in chat ? chat.autoresponder : false,
        antiBot: 'antiBot' in chat ? chat.antiBot : true,
        antiBot2: 'antiBot2' in chat ? chat.antiBot2 : true,
        antiLink: 'antiLink' in chat ? chat.antiLink : true,
        antiLink2: 'antiLink2' in chat ? chat.antiLink2 : false,
        antiFake: 'antiFake' in chat ? chat.antiFake : false,
        antifake: 'antifake' in chat ? chat.antifake : false,
        antiToxic: 'antiToxic' in chat ? chat.antiToxic : false,
        antiTraba: 'antiTraba' in chat ? chat.antiTraba : false,
        antiSpam: 'antiSpam' in chat ? chat.antiSpam : false,
        antiFlood: 'antiFlood' in chat ? chat.antiFlood : false,
        antiTelegram: 'antiTelegram' in chat ? chat.antiTelegram : false,
        antiDiscord: 'antiDiscord' in chat ? chat.antiDiscord : false,
        antiTiktok: 'antiTiktok' in chat ? chat.antiTiktok : false,
        antiYoutube: 'antiYoutube' in chat ? chat.antiYoutube : false,
        modoadmin: 'modoadmin' in chat ? chat.modoadmin : false,
        reaction: 'reaction' in chat ? chat.reaction : false,
        game: 'game' in chat ? chat.game : true,
        rpg: 'rpg' in chat ? chat.rpg : true,
        nsfw: 'nsfw' in chat ? chat.nsfw : false,
        modohorny: 'modohorny' in chat ? chat.modohorny : false,
        audios: 'audios' in chat ? chat.audios : true,
        autosimi: 'autosimi' in chat ? chat.autosimi : false,
        viewonce: 'viewonce' in chat ? chat.viewonce : false,
        expired: isNumber(chat.expired) ? chat.expired : 0
      })

      // ═════════════════════════════════════════════════════════════════════════
      // │                    CONFIGURACIONES GLOBALES                           │
      // ═════════════════════════════════════════════════════════════════════════
      
      var settings = global.db.data.settings[this.user.jid] || {}
      
      Object.assign(settings, {
        self: 'self' in settings ? settings.self : false,
        restrict: 'restrict' in settings ? settings.restrict : true,
        jadibotmd: 'jadibotmd' in settings ? settings.jadibotmd : true,
        antiPrivate: 'antiPrivate' in settings ? settings.antiPrivate : false,
        autoread: 'autoread' in settings ? settings.autoread : false,
        antiCall: 'antiCall' in settings ? settings.antiCall : false,
        antiSpam: 'antiSpam' in settings ? settings.antiSpam : false,
        status: settings.status || 0
      })
      
      global.db.data.settings[this.user.jid] = settings

    } catch (e) { 
      console.error('Error inicializando datos:', e) 
    }

    if (typeof m.text !== "string") m.text = ""
    globalThis.setting = global.db.data.settings[this.user.jid]

    // ═════════════════════════════════════════════════════════════════════════
    // │           SISTEMA DE PERMISOS Y ROLES (CORREGIDO v.replace)           │
    // ═════════════════════════════════════════════════════════════════════════
    
    // Sistema de detección de LID mejorado
    const detectwhat = m.sender.includes('@lid') ? '@lid' : '@s.whatsapp.net'
    
    // Owner y ROwner - CORREGIDO para manejar diferentes formatos
    const isROwner = (() => {
      try {
        if (!global.owner || !Array.isArray(global.owner)) return false
        
        return global.owner
          .map(([number]) => String(number).replace(/\D/g, "") + detectwhat)
          .includes(m.sender)
      } catch (e) {
        console.error('Error en isROwner:', e)
        return false
      }
    })()
    
    const isOwner = isROwner || m.fromMe
    
    // Premium
    const isPrems = isROwner || global.db.data.users[m.sender].premiumTime > 0
    
    // Mods - COMPLETAMENTE CORREGIDO
    const isMods = (() => {
      if (isOwner) return true
      if (!global.mods || !Array.isArray(global.mods) || global.mods.length === 0) return false
      
      try {
        const modsJids = global.mods.map(v => {
          // Manejar diferentes formatos de global.mods
          if (Array.isArray(v)) {
            // Formato: [['123456789', 'Nombre'], ['987654321', 'Otro']]
            return String(v[0]).replace(/[^0-9]/g, '') + detectwhat
          } else if (typeof v === 'number' || typeof v === 'string') {
            // Formato: ['123456789', '987654321'] o [123456789, 987654321]
            return String(v).replace(/[^0-9]/g, '') + detectwhat
          } else {
            return null
          }
        }).filter(Boolean)
        
        return modsJids.includes(m.sender)
      } catch (e) {
        console.error('Error en isMods:', e)
        return false
      }
    })()

    // Sistema de cola de mensajes
    if (opts["queque"] && m.text && !isMods) {
      const queque = this.msgqueque
      const previousID = queque[queque.length - 1]
      queque.push(m.id || m.key.id)
      setInterval(async () => { 
        if (!queque.includes(previousID)) clearInterval(this)
        await delay(5000) 
      }, 5000)
    }

    if (m.isBaileys) return
    
    m.exp += Math.ceil(Math.random() * 10)
    let usedPrefix
    let _user = global.db.data.users[m.sender]

    // Función auxiliar para obtener LID desde JID
    async function getLidFromJid(id, conn) { 
      if (id.endsWith('@lid')) return id
      const res = await conn.onWhatsApp(id).catch(() => [])
      return res[0]?.lid || id
    }

    const senderLid = await getLidFromJid(m.sender, this)
    const botLid = await getLidFromJid(this.user.jid, this)
    const senderJid = m.sender
    const botJid = this.user.jid

    const groupMetadata = m.isGroup ? ((this.chats[m.chat] || {}).metadata || await this.groupMetadata(m.chat).catch(() => null)) : {}
    const participants = m.isGroup && groupMetadata ? groupMetadata.participants || [] : []

    const user = participants.find(p => [p?.id, p?.jid].includes(senderLid) || [p?.id, p?.jid].includes(senderJid)) || {}
    const bot = participants.find(p => [p?.id, p?.jid].includes(botLid) || [p?.id, p?.jid].includes(botJid)) || {}

    const isRAdmin = user.admin === 'superadmin'
    const isAdmin = isRAdmin || user.admin === 'admin'
    const isBotAdmin = !!bot.admin

    const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins')
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      PROCESAMIENTO DE PLUGINS                         │
    // ═════════════════════════════════════════════════════════════════════════
    
    for (let name in global.plugins) {
      let plugin = global.plugins[name]
      if (!plugin || plugin.disabled) continue
      
      const __filename = join(___dirname, name)

      if (typeof plugin.all === 'function') {
        try {
          await plugin.all.call(this, m, { 
            chatUpdate, 
            __dirname: ___dirname, 
            __filename 
          })
        } catch (e) {
          console.error(`Error en plugin.all de ${name}:`, e)
        }
      }
      
      if (!opts['restrict'] && plugin.tags?.includes('admin')) continue

      const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
      let _prefix = plugin.customPrefix || this.prefix || global.prefix
      
      let match = (_prefix instanceof RegExp ? [[_prefix.exec(m.text), _prefix]] :
        Array.isArray(_prefix) ? _prefix.map(p => [
          p instanceof RegExp ? p.exec(m.text) : new RegExp(str2Regex(p)).exec(m.text), 
          p instanceof RegExp ? p : new RegExp(str2Regex(p))
        ]) :
        [[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]]
      ).find(p => p[1])

      if (typeof plugin.before === 'function') {
        try {
          if (await plugin.before.call(this, m, { 
            match, 
            conn: this, 
            participants, 
            groupMetadata, 
            user, 
            bot, 
            isROwner, 
            isOwner, 
            isRAdmin, 
            isAdmin, 
            isBotAdmin, 
            isPrems,
            isMods,
            chatUpdate, 
            __dirname: ___dirname, 
            __filename 
          })) continue
        } catch (e) {
          console.error(`Error en plugin.before de ${name}:`, e)
        }
      }
      
      if (typeof plugin !== 'function') continue

      if ((usedPrefix = (match[0] || '')[0])) {
        let noPrefix = m.text.replace(usedPrefix, '')
        let [command, ...args] = noPrefix.trim().split` `.filter(Boolean)
        
        args = args || []
        let _args = noPrefix.trim().split` `.slice(1)
        let text = _args.join` `
        command = (command || '').toLowerCase()
        
        console.log(chalk.cyan(`[CMD] ${command} | Prefix: ${usedPrefix} | User: ${m.sender.split('@')[0]}`))
        
        let fail = plugin.fail || global.dfail
        let isAccept = plugin.command instanceof RegExp ? plugin.command.test(command) :
          Array.isArray(plugin.command) ? plugin.command.some(cmd => 
            cmd instanceof RegExp ? cmd.test(command) : cmd === command
          ) :
          plugin.command === command

        global.comando = command
        
        if (!isAccept) continue

        console.log(chalk.green(`[✓] Ejecutando: ${command} | Plugin: ${name}`))

        m.plugin = name
        let chat = global.db.data.chats[m.chat]
        let userPlugin = global.db.data.users[m.sender]
        
        if (!['grupo-unbanchat.js', 'owner-exec.js', 'owner-exec2.js'].includes(name) && 
            chat?.isBanned && !isROwner) return
        
        if (m.text && userPlugin.banned && !isROwner) { 
          m.reply(`⚠️ *USUARIO BANEADO* 𒁈\n\nEstás baneado, no puedes usar comandos.\n\n${userPlugin.bannedReason ? `📋 *Motivo:* ${userPlugin.bannedReason}` : '📋 *Motivo:* Sin especificar'}\n\n💡 Si crees que esto es un error, contacta al propietario.`)
          return
        }

        let adminMode = global.db.data.chats[m.chat].modoadmin
        if (adminMode && !isOwner && !isROwner && m.isGroup && !isAdmin) {
          if (plugin.admin || plugin.botAdmin) {
            console.log(chalk.yellow(`[ModoAdmin] Bloqueado: ${command}`))
            return
          }
        }

        if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) { 
          fail('owner', m, this)
          continue 
        }
        if (plugin.rowner && !isROwner) { 
          fail('rowner', m, this)
          continue 
        }
        if (plugin.owner && !isOwner) { 
          fail('owner', m, this)
          continue 
        }
        if (plugin.mods && !isMods) { 
          fail('mods', m, this)
          continue 
        }
        if (plugin.premium && !isPrems) { 
          fail('premium', m, this)
          continue 
        }
        if (plugin.group && !m.isGroup) { 
          fail('group', m, this)
          continue 
        }
        if (plugin.botAdmin && !isBotAdmin) { 
          fail('botAdmin', m, this)
          continue 
        }
        if (plugin.admin && !isAdmin) { 
          fail('admin', m, this)
          continue 
        }
        if (plugin.private && m.isGroup) { 
          fail('private', m, this)
          continue 
        }
        if (plugin.register && !_user.registered) { 
          fail('unreg', m, this)
          continue 
        }

        m.isCommand = true
        
        let xp = 'exp' in plugin ? parseInt(plugin.exp) : 10
        m.exp += xp
        
        if (!isPrems && plugin.money && _user.money < plugin.money) {
          this.reply(m.chat, `💰 *MONEY INSUFICIENTE* 𒁈\n\nNecesitas: ${plugin.money} money\nTienes: ${_user.money} money`, m)
          continue
        }
        
        if (plugin.level > _user.level) {
          this.reply(m.chat, `📊 *NIVEL INSUFICIENTE* 𒁈\n\nRequiere nivel: ${plugin.level}\nTu nivel: ${_user.level}\n\nUsa comandos para subir de nivel`, m)
          continue
        }

        let extra = { 
          match, usedPrefix, noPrefix, _args, args, command, text, 
          conn: this, participants, groupMetadata, user, bot, 
          isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isPrems, isMods,
          chatUpdate, __dirname: ___dirname, __filename 
        }
        
        try {
          await plugin.call(this, m, extra)
          if (!isPrems) m.money = m.money || plugin.money || 0
        } catch (e) {
          m.error = e
          console.error(`Error ejecutando ${name}:`, e)
          
          let text = format(e)
          for (let key of Object.values(global.APIKeys || {})) {
            text = text.replace(new RegExp(key, 'g'), '#HIDDEN#')
          }
          
          m.reply(`❌ *ERROR* 𒁈\n\nOcurrió un error al ejecutar el comando.\n\n\`\`\`${text.slice(0, 200)}\`\`\``)
        } finally {
          if (typeof plugin.after === 'function') {
            try {
              await plugin.after.call(this, m, extra)
            } catch (e) {
              console.error(`Error en plugin.after de ${name}:`, e)
            }
          }
          if (m.money && m.money > 0) {
            this.reply(m.chat, `💰 Gastaste ${+m.money} money`, m)
          }
        }
        break
      }
    }

  } catch (e) { 
    console.error('Error general en handler:', e) 
  } finally {
    if (opts['queque'] && m.text) {
      const quequeIndex = this.msgqueque.indexOf(m.id || m.key.id)
      if (quequeIndex !== -1) this.msgqueque.splice(quequeIndex, 1)
    }

    if (m) {
      let utente = global.db.data.users[m.sender]
      if (utente && utente.muto) {
        await this.sendMessage(m.chat, { 
          delete: { 
            remoteJid: m.chat, 
            fromMe: false, 
            id: m.key.id, 
            participant: m.key.participant 
          }
        })
      }
      if (utente) {
        utente.exp += m.exp
        utente.money -= m.money * 1
      }
    }

    let stats = global.db.data.stats
    if (m.plugin) {
      let now = +new Date()
      let stat = stats[m.plugin] || { total: 0, success: 0, last: 0, lastSuccess: 0 }
      
      stat.total += 1
      stat.last = now
      
      if (!m.error) { 
        stat.success += 1
        stat.lastSuccess = now
      }
      
      stats[m.plugin] = stat
    }

    try { 
      if (!opts['noprint']) {
        const { default: print } = await import('../lib/print.js')
        await print(m, this)
      }
    } catch (e) { 
      console.log('Error en print:', m, m.quoted, e) 
    }
    
    if (opts['autoread']) await this.readMessages([m.key])
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                     HANDLER DE ACTUALIZACIÓN DE PARTICIPANTES              │
// ═══════════════════════════════════════════════════════════════════════════════

export async function participantsUpdate({ id, participants, action }) {
  if (opts['self']) return
  if (this.isInit) return
  if (global.db.data == null) await global.loadDatabase()
  
  let chat = global.db.data.chats[id] || {}
  let text = ''
  
  switch (action) {
    case 'add':
    case 'remove':
      if (chat.welcome) {
        for (let user of participants) {
          let pp = './media/avatar.png'
          try {
            pp = await this.profilePictureUrl(user, 'image')
          } catch (e) {
            console.log('Error obteniendo avatar:', e)
          } finally {
            text = (action === 'add' ? (chat.sWelcome || this.welcome || global.welcome || 
              '👋 Bienvenido @user al grupo') : 
              (chat.sBye || this.bye || global.bye || 'Adiós @user'))
              .replace(/@user/g, '@' + user.split('@')[0])
              .replace(/@subject/g, await this.getName(id))
              .replace(/@desc/g, (await this.groupMetadata(id)).desc?.toString() || 'Sin descripción')
            
            this.sendFile(id, pp, 'pp.jpg', text, null, false, { 
              mentions: [user] 
            })
          }
        }
      }
      break
      
    case 'promote':
      if (chat.detect) {
        text = (chat.sPromote || this.spromote || global.spromote || 
          '@user ahora es admin')
          .replace('@user', '@' + participants[0].split('@')[0])
        
        this.sendMessage(id, { text, mentions: [participants[0]] })
      }
      break
      
    case 'demote':
      if (chat.detect) {
        text = (chat.sDemote || this.sdemote || global.sdemote || 
          '@user ya no es admin')
          .replace('@user', '@' + participants[0].split('@')[0])
        
        this.sendMessage(id, { text, mentions: [participants[0]] })
      }
      break
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                     HANDLER DE ACTUALIZACIÓN DE GRUPOS                     │
// ═══════════════════════════════════════════════════════════════════════════════

export async function groupsUpdate(updates) {
  if (opts['self']) return
  
  for (const update of updates) {
    const id = update.id
    if (!id) continue
    
    let chat = global.db.data.chats[id]
    if (!chat?.detect) continue
    
    if (update.desc) {
      await this.sendMessage(id, { 
        text: (chat.sDesc || this.sDesc || global.sDesc || 
          '📝 Descripción actualizada:\n@desc')
          .replace('@desc', update.desc.toString())
      })
    }
    
    if (update.subject) {
      await this.sendMessage(id, { 
        text: (chat.sSubject || this.sSubject || global.sSubject || 
          '🏷️ Nombre actualizado:\n@subject')
          .replace('@subject', update.subject)
      })
    }
    
    if (update.revoke) {
      await this.sendMessage(id, { 
        text: (chat.sRevoke || this.sRevoke || global.sRevoke || 
          '🔗 Link restablecido:\n@revoke')
          .replace('@revoke', update.revoke)
      })
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                     HANDLER DE MENSAJES ELIMINADOS                         │
// ═══════════════════════════════════════════════════════════════════════════════

export async function deleteUpdate(message) {
  try {
    const { fromMe, id, participant } = message
    if (fromMe) return
    
    let msg = this.serializeM(this.loadMessage(id))
    if (!msg) return
    
    let chat = global.db.data.chats[msg.chat] || {}
    if (!chat.antidelete) return
    
    let text = `🗑️ *MENSAJE ELIMINADO* 𒁈\n\n`
    text += `👤 Usuario: @${participant.split('@')[0]}\n`
    text += `⏰ Hora: ${new Date().toLocaleString('es-MX')}\n\n`
    
    if (msg.text) {
      text += `💬 Texto:\n${msg.text}\n\n`
    }
    
    text += `⚠️ Este mensaje fue eliminado por el usuario`
    
    await this.reply(msg.chat, text, null, { mentions: [participant] })
    
  } catch (e) {
    console.error('Error en deleteUpdate:', e)
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                         HANDLER DE LLAMADAS                                 │
// ═══════════════════════════════════════════════════════════════════════════════

export async function callUpdate(json) {
  let { content, participants } = json
  
  if (json.content[0].tag == 'offer') {
    let callerId = content[0].attrs['call-creator']
    let settings = global.db.data.settings[this.user.jid] || {}
    
    if (settings.antiCall) {
      await this.updateBlockStatus(callerId, 'block')
      
      let text = `📞 *ANTI-CALL ACTIVADO* 𒁈\n\n`
      text += `👤 Usuario: @${callerId.split('@')[0]}\n`
      text += `🚫 Acción: Bloqueado automáticamente\n`
      text += `⚠️ Razón: Llamada rechazada\n\n`
      text += `💡 Para desactivar: *.anticall off*`
      
      for (let [jid] of global.owner.filter(([number, _, isDev]) => isDev && number)) {
        let data = (await this.onWhatsApp(jid + '@s.whatsapp.net'))[0] || {}
        if (data.exists) {
          this.reply(data.jid, text, null, { mentions: [callerId] })
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      FUNCIÓN DE MANEJO DE FALLOS                           │
// ═══════════════════════════════════════════════════════════════════════════════

global.dfail = (type, m, usedPrefix, command, conn) => {
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
    group: `📱 *SOLO GRUPOS* 𒁈\n\nEste comando solo funciona en grupos.\n\n𒁈 *Avenix-Multi*`
  }[type]
  
  if (msg) return m.reply(msg).then(_ => m.react('✖️'))
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                         OBSERVADOR DE ARCHIVOS                             │
// ═══════════════════════════════════════════════════════════════════════════════

let file = global.__filename(import.meta.url, true)

watchFile(file, async () => {
  unwatchFile(file)
  console.log(chalk.cyan('📁 Handler actualizado: handler.js'))
  
  if (global.conns && global.conns.length > 0) {
    const users = [...new Set([
      ...global.conns.filter(conn => 
        conn.user && 
        conn.ws.socket && 
        conn.ws.socket.readyState !== ws.CLOSED
      ).map(conn => conn)
    ])]
    
    for (const userConn of users) {
      userConn.subreloadHandler(false)
    }
  }
})
