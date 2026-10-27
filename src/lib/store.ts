/**
 * ╔═══════════════════════════════════════════════════╗
 * ║    AVENIX-MULTI - Store Manager                  ║
 * ║    Gestor de mensajes y estado de chats          ║
 * ╚═══════════════════════════════════════════════════╝
 */

import type { Contact, WAMessage } from '@whiskeysockets/baileys'
import type { AvenixSocket, ChatStore } from '../types/index.js'

// Socket activo para resolver mensajes del store
let boundConnection: AvenixSocket | null = null

// ═══════════════════════════════════════════════════
// Vinculación de eventos al store
// ═══════════════════════════════════════════════════
function bindStoreEvents(connection: AvenixSocket) {
  connection.chats ||= {}
  boundConnection = connection

  const getChat = (id: string): ChatStore => (connection.chats[id] ||= { id })

  const refreshGroup = async (groupId: string, subject?: string) => {
    const chatData = getChat(groupId)
    chatData.isChats = true
    const groupMeta = await connection.groupMetadata(groupId).catch(() => null)
    if (!groupMeta) return
    chatData.subject = subject || groupMeta.subject
    chatData.metadata = groupMeta
  }

  // Actualizar contactos
  const syncContacts = (contacts: Partial<Contact>[]) => {
    for (const contact of contacts) {
      if (!contact.id) continue
      const jid = connection.decodeJid(contact.id)
      if (!jid || jid === 'status@broadcast') continue

      const chatData = getChat(jid)
      const isGroup = jid.endsWith('@g.us')
      connection.chats[jid] = {
        ...chatData,
        ...contact,
        id: jid,
        ...(isGroup
          ? { subject: contact.name || chatData.subject || '' }
          : { name: contact.notify || contact.name || chatData.name || chatData.notify || '' })
      }
    }
  }

  connection.ev.on('contacts.upsert', syncContacts)
  connection.ev.on('contacts.update', syncContacts)

  // Historial inicial: chats + contactos
  connection.ev.on('messaging-history.set', ({ chats, contacts }) => {
    syncContacts(contacts)
    for (const { id: rawId, name, readOnly } of chats) {
      const id = connection.decodeJid(rawId)
      if (!id || id === 'status@broadcast') continue
      const chatData = getChat(id)
      chatData.isChats = !readOnly
      if (name) chatData[id.endsWith('@g.us') ? 'subject' : 'name'] = name
    }
  })

  // Participantes de grupos
  connection.ev.on('group-participants.update', async ({ id }) => {
    if (!id) return
    const groupId = connection.decodeJid(id)
    if (groupId !== 'status@broadcast') await refreshGroup(groupId)
  })

  // Información de grupos
  connection.ev.on('groups.update', async (groupUpdates) => {
    for (const update of groupUpdates) {
      if (!update.id) continue
      const groupId = connection.decodeJid(update.id)
      if (!groupId.endsWith('@g.us')) continue
      await refreshGroup(groupId, update.subject).catch(error => console.error('⚠️ Error actualizando grupos:', error))
    }
  })

  // Nuevos chats
  connection.ev.on('chats.upsert', (chats) => {
    for (const chat of chats) {
      if (!chat.id || chat.id === 'status@broadcast') continue
      connection.chats[chat.id] = { ...(connection.chats[chat.id] || {}), ...chat, id: chat.id, isChats: true } as ChatStore
      if (chat.id.endsWith('@g.us')) connection.insertAllGroup().catch(() => null)
    }
  })

  // Presencia (escribiendo, en línea, etc)
  connection.ev.on('presence.update', ({ id, presences }) => {
    const sender = Object.keys(presences)[0] || id
    const chatData = getChat(connection.decodeJid(sender))
    chatData.presences = presences[sender]?.lastKnownPresence || 'composing'
    if (id.endsWith('@g.us')) getChat(id)
  })
}

// ═══════════════════════════════════════════════════
// Cargar mensaje desde el store en memoria
// ═══════════════════════════════════════════════════
function retrieveMessage(jidOrId: string | null | undefined, messageId: string | null = null): WAMessage | null {
  const conn = boundConnection
  if (!conn || !jidOrId) return null

  if (!messageId) return conn.loadMessage(jidOrId) || null

  const chat = conn.chats[conn.decodeJid(jidOrId)]
  return chat?.messages?.[messageId] || conn.loadMessage(messageId) || null
}

// ═══════════════════════════════════════════════════
// Exportación
// ═══════════════════════════════════════════════════
export default {
  bind: bindStoreEvents,
  loadMessage: retrieveMessage
}
