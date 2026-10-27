import axios from 'axios'
import type { AlbumMedia, PluginHandler } from '../types/index.js'

const handler: PluginHandler = async (m, { conn, args }) => {
  if (!args.length) {
    return m.reply('Por favor, proporciona una consulta.\n\nEjemplo: .pinterest gato')
  }

  await m.react('⏱️')

  try {
    const query = args.join(' ')
    const { data } = await axios.get(`https://api.dorratz.com/v2/pinterest?q=${encodeURIComponent(query)}`)

    if (!Array.isArray(data) || data.length === 0) {
      return m.reply('No se encontraron resultados.')
    }

    const medias: AlbumMedia[] = data.slice(0, 10).map((item, i) => ({
      type: 'image',
      data: { url: item.image_large_url },
      caption: i === 0 ? '🌙 Imágenes encontradas en Pinterest' : ''
    }))

    if (medias.length < 2) {
      return conn.sendFile(m.chat, (medias[0].data as { url: string }).url, 'pin.jpg', medias[0].caption, m)
    }
    await conn.sendSylphy(m.chat, medias, { quoted: m })
  } catch (error) {
    console.error('Error durante la búsqueda en Pinterest:', error)
    await m.reply('❌ No se pudo completar la búsqueda en Pinterest.')
  }
}

handler.help = ['pinterest']
handler.tags = ['search']
handler.command = ['pinterest', 'pin']

export default handler
