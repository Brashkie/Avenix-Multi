/**
 * ╔═══════════════════════════════════════════════════╗
 * ║    AVENIX-MULTI - Store Manager                  ║
 * ║    Gestor de mensajes y estado de chats          ║
 * ╚═══════════════════════════════════════════════════╝
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'

const { initAuthCreds, BufferJSON, proto } = (await import('@whiskeysockets/baileys')).default

// ═══════════════════════════════════════════════════
// Mapeo de tipos de claves de autenticación
// ═══════════════════════════════════════════════════
const AUTH_KEY_TYPES = {
  'pre-key': 'preKeys',
  'session': 'sessions',
  'sender-key': 'senderKeys',
  'app-state-sync-key': 'appStateSyncKeys',
  'app-state-sync-version': 'appStateVersions',
  'sender-key-memory': 'senderKeyMemory'
}

// ═══════════════════════════════════════════════════
// Vinculación de eventos al store
// ═══════════════════════════════════════════════════
function bindStoreEvents(connection) {
  if (!connection.chats) {
    connection.chats = {}
  }

  // Actualizar contactos en base de datos
  function syncContactsToDB(contactsData) {
    if (!contactsData) return

    try {
      const contacts = contactsData.contacts || contactsData

      for (const contact of contacts) {
        const jid = connection.decodeJid(contact.id)
        if (!jid || jid === 'status@broadcast') continue

        let chatData = connection.chats[jid]
        if (!chatData) {
          chatData = connection.chats[jid] = { ...contact, id: jid }
        }

        const isGroup = jid.endsWith('@g.us')
        connection.chats[jid] = {
          ...chatData,
          ...contact,
          id: jid,
          ...(isGroup
            ? { subject: contact.subject || contact.name || chatData.subject || '' }
            : { name: contact.notify || contact.name || chatData.name || chatData.notify || '' })
        }
      }
    } catch (error) {
      console.error('⚠️ Error sincronizando contactos:', error)
    }
  }

  // Eventos de contactos
  connection.ev.on('contacts.upsert', syncContactsToDB)
  connection.ev.on('contacts.set', syncContactsToDB)
  connection.ev.on('groups.update', syncContactsToDB)

  // Evento: configuración de chats
  connection.ev.on('chats.set', async ({ chats }) => {
    try {
      for (let { id, name, readOnly } of chats) {
        id = connection.decodeJid(id)
        if (!id || id === 'status@broadcast') continue

        const isGroup = id.endsWith('@g.us')
        let chatData = connection.chats[id]

        if (!chatData) {
          chatData = connection.chats[id] = { id }
        }

        chatData.isChats = !readOnly

        if (name) {
          chatData[isGroup ? 'subject' : 'name'] = name
        }

        if (isGroup) {
          const groupMeta = await connection.groupMetadata(id).catch(() => null)
          if (!groupMeta) continue

          chatData.subject = name || groupMeta.subject
          chatData.metadata = groupMeta
        }
      }
    } catch (error) {
      console.error('⚠️ Error configurando chats:', error)
    }
  })

  // Evento: actualización de participantes en grupos
  connection.ev.on('group-participants.update', async ({ id, participants, action }) => {
    if (!id) return

    const groupId = connection.decodeJid(id)
    if (groupId === 'status@broadcast') return

    if (!(groupId in connection.chats)) {
      connection.chats[groupId] = { id: groupId }
    }

    const chatData = connection.chats[groupId]
    chatData.isChats = true

    const groupMeta = await connection.groupMetadata(groupId).catch(() => null)
    if (!groupMeta) return

    chatData.subject = groupMeta.subject
    chatData.metadata = groupMeta
  })

  // Evento: actualización de información de grupos
  connection.ev.on('groups.update', async (groupUpdates) => {
    try {
      for (const update of groupUpdates) {
        const groupId = connection.decodeJid(update.id)
        if (!groupId || groupId === 'status@broadcast') continue

        const isGroup = groupId.endsWith('@g.us')
        if (!isGroup) continue

        let chatData = connection.chats[groupId]
        if (!chatData) {
          chatData = connection.chats[groupId] = { id: groupId }
        }

        chatData.isChats = true

        const groupMeta = await connection.groupMetadata(groupId).catch(() => null)
        if (groupMeta) {
          chatData.metadata = groupMeta
        }

        if (update.subject || groupMeta?.subject) {
          chatData.subject = update.subject || groupMeta.subject
        }
      }
    } catch (error) {
      console.error('⚠️ Error actualizando grupos:', error)
    }
  })

  // Evento: nuevos chats
  connection.ev.on('chats.upsert', (chatUpsert) => {
    try {
      const { id, name } = chatUpsert
      if (!id || id === 'status@broadcast') return

      connection.chats[id] = {
        ...(connection.chats[id] || {}),
        ...chatUpsert,
        isChats: true
      }

      const isGroup = id.endsWith('@g.us')
      if (isGroup) {
        connection.insertAllGroup().catch(() => null)
      }
    } catch (error) {
      console.error('⚠️ Error insertando chat:', error)
    }
  })

  // Evento: actualización de presencia (escribiendo, en línea, etc)
  connection.ev.on('presence.update', async ({ id, presences }) => {
    try {
      const sender = Object.keys(presences)[0] || id
      const senderId = connection.decodeJid(sender)
      const presenceStatus = presences[sender]['lastKnownPresence'] || 'composing'

      let chatData = connection.chats[senderId]
      if (!chatData) {
        chatData = connection.chats[senderId] = { id: sender }
      }

      chatData.presences = presenceStatus

      if (id.endsWith('@g.us')) {
        let groupData = connection.chats[id]
        if (!groupData) {
          groupData = connection.chats[id] = { id }
        }
      }
    } catch (error) {
      console.error('⚠️ Error actualizando presencia:', error)
    }
  })
}

// ═══════════════════════════════════════════════════
// Autenticación en archivo único
// ═══════════════════════════════════════════════════
function createSingleFileAuth(filePath, logger) {
  let credentials
  let authKeys = {}
  let saveCounter = 0

  const persistAuthState = (forceWrite) => {
    logger?.trace('💾 Guardando estado de autenticación')
    saveCounter++

    if (forceWrite || saveCounter > 5) {
      writeFileSync(
        filePath,
        JSON.stringify(
          { creds: credentials, keys: authKeys },
          BufferJSON.replacer,
          2
        )
      )
      saveCounter = 0
    }
  }

  if (existsSync(filePath)) {
    const authData = JSON.parse(
      readFileSync(filePath, { encoding: 'utf-8' }),
      BufferJSON.reviver
    )
    credentials = authData.creds
    authKeys = authData.keys
  } else {
    credentials = initAuthCreds()
    authKeys = {}
  }

  return {
    state: {
      creds: credentials,
      keys: {
        get: (keyType, ids) => {
          const mappedKey = AUTH_KEY_TYPES[keyType]
          return ids.reduce((result, id) => {
            let keyValue = authKeys[mappedKey]?.[id]
            if (keyValue) {
              if (keyType === 'app-state-sync-key') {
                keyValue = proto.AppStateSyncKeyData.fromObject(keyValue)
              }
              result[id] = keyValue
            }
            return result
          }, {})
        },
        set: (data) => {
          for (const keyType in data) {
            const mappedKey = AUTH_KEY_TYPES[keyType]
            authKeys[mappedKey] = authKeys[mappedKey] || {}
            Object.assign(authKeys[mappedKey], data[keyType])
          }
          persistAuthState()
        }
      }
    },
    saveState: persistAuthState
  }
}

// ═══════════════════════════════════════════════════
// Cargar mensaje desde el store
// ═══════════════════════════════════════════════════
function retrieveMessage(jidOrId, messageId = null) {
  let foundMessage = null

  if (jidOrId && !messageId) {
    messageId = jidOrId
    const messageFilter = (msg) => msg.key?.id === messageId
    const messageStore = {}
    
    const searchResult = Object.entries(messageStore).find(([, messages]) => {
      return messages.find(messageFilter)
    })
    
    foundMessage = searchResult?.[1].find(messageFilter)
  } else {
    const decodedJid = jidOrId?.decodeJid?.()
    const messageStore = {}
    
    if (!(decodedJid in messageStore)) return null
    
    foundMessage = messageStore[decodedJid].find((msg) => msg.key.id === messageId)
  }

  return foundMessage || null
}

// ═══════════════════════════════════════════════════
// Exportación
// ═══════════════════════════════════════════════════
export default {
  bind: bindStoreEvents,
  useSingleFileAuthState: createSingleFileAuth,
  loadMessage: retrieveMessage
}
