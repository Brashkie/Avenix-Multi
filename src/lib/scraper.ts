/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                            𒁈 AVENIX-MULTI V2.0.0 𒁈                         ┃
 * ┃                LIB/SCRAPER.JS - WEB SCRAPING Y EXTRACCIÓN                   ┃
 * ┃                          Creado por: Hepein Oficial                          ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import * as cheerio from 'cheerio'
import paint from './paint.js'
import { fetchWithRetry } from './functions.js'

// ═══════════════════════════════════════════════════════════════════════════════
// │                        CLASE PRINCIPAL DE SCRAPER                           │
// ═══════════════════════════════════════════════════════════════════════════════

class AvenixScraper {
    userAgents: string[]
    defaultHeaders: any
    timeout: number

    constructor() {
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        ]
        
        this.defaultHeaders = {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.8,en;q=0.6',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
        
        this.timeout = 15000
        console.log(paint.green('𒁈 Scraper engine inicializado'))
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           FUNCIONES DE UTILIDAD                             │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    getRandomUserAgent() {
        return this.userAgents[Math.floor(Math.random() * this.userAgents.length)]
    }
    
    getHeaders(custom: Record<string, any> = {}) {
        return {
            ...this.defaultHeaders,
            'User-Agent': this.getRandomUserAgent(),
            ...custom
        }
    }
    
    async fetchPage(url, options: Record<string, any> = {}): Promise<{ success: boolean; data?: any; response?: Response; error?: string }> {
        try {
            const headers = this.getHeaders(options.headers)
            
            const response = await fetchWithRetry(url, {
                headers,
                timeout: options.timeout || this.timeout,
                ...options
            })
            
            const text = await response.text()
            return { success: true as const, data: text, response }
        } catch (error) {
            console.error(paint.red(`𒁈 Error fetching ${url}:`), error.message)
            return { success: false as const, error: error.message }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                             YOUTUBE SCRAPER                                 │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async searchYouTube(query, limit = 10) {
        try {
            console.log(paint.cyan(`𒁈 Buscando en YouTube: ${query}`))
            
            const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
            const { success, data } = await this.fetchPage(searchUrl)
            
            if (!success) throw new Error('Error obteniendo página de YouTube')
            
            // Extraer datos de video usando regex
            const scriptRegex = /var ytInitialData = ({.+?});/
            const match = data.match(scriptRegex)
            
            if (!match) throw new Error('No se encontraron datos de video')
            
            const ytData = JSON.parse(match[1])
            const videos: any[] = []
            
            const contents = ytData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || []
            
            for (const item of contents) {
                if (item.videoRenderer && videos.length < limit) {
                    const video = item.videoRenderer
                    videos.push({
                        title: video.title?.runs?.[0]?.text || 'Sin título',
                        videoId: video.videoId,
                        url: `https://www.youtube.com/watch?v=${video.videoId}`,
                        thumbnail: video.thumbnail?.thumbnails?.[0]?.url,
                        duration: video.lengthText?.simpleText || 'Desconocido',
                        channel: video.ownerText?.runs?.[0]?.text || 'Desconocido',
                        views: video.viewCountText?.simpleText || 'Sin datos',
                        published: video.publishedTimeText?.simpleText || 'Desconocido'
                    })
                }
            }
            
            console.log(paint.green(`𒁈 ${videos.length} videos encontrados en YouTube`))
            return { success: true as const, results: videos }
            
        } catch (error) {
            console.error(paint.red('𒁈 Error buscando en YouTube:'), error)
            return { success: false as const, error: error.message, results: [] }
        }
    }
    
    async getYouTubeVideoInfo(videoId) {
        try {
            const url = `https://www.youtube.com/watch?v=${videoId}`
            const { success, data } = await this.fetchPage(url)
            
            if (!success) throw new Error('Error obteniendo video')
            
            const $ = cheerio.load(data)
            
            // Extraer información básica
            const title = $('meta[property="og:title"]').attr('content') || 'Sin título'
            const description = $('meta[property="og:description"]').attr('content') || 'Sin descripción'
            const thumbnail = $('meta[property="og:image"]').attr('content')
            const duration = $('meta[property="video:duration"]').attr('content')
            
            // Extraer datos adicionales del script
            const scriptMatch = data.match(/var ytInitialPlayerResponse = ({.+?});/)
            let additionalData: Record<string, any> = {}
            
            if (scriptMatch) {
                const playerData = JSON.parse(scriptMatch[1])
                additionalData = {
                    channel: playerData?.videoDetails?.author || 'Desconocido',
                    views: playerData?.videoDetails?.viewCount || '0',
                    likes: playerData?.videoDetails?.averageRating || 'N/A'
                }
            }
            
            return {
                success: true as const,
                video: {
                    title,
                    description,
                    thumbnail,
                    duration,
                    url,
                    videoId,
                    ...additionalData
                }
            }
            
        } catch (error) {
            return { success: false as const, error: error.message }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                             GOOGLE SEARCH                                   │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async googleSearch(query, limit = 10) {
        try {
            console.log(paint.cyan(`𒁈 Buscando en Google: ${query}`))
            
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=${limit}&hl=es`
            const { success, data } = await this.fetchPage(searchUrl)
            
            if (!success) throw new Error('Error obteniendo resultados de Google')
            
            const $ = cheerio.load(data)
            const results: any[] = []
            
            $('.g').each((i, element) => {
                if (results.length >= limit) return false
                
                const $el = $(element)
                const link = $el.find('a[href]').first()
                const title = link.find('h3').text()
                const url = link.attr('href')
                const snippet = $el.find('.VwiC3b, .s3v9rd').text()
                
                if (title && url && !url.includes('google.com')) {
                    results.push({
                        title: title.trim(),
                        url: url.trim(),
                        snippet: snippet.trim()
                    })
                }
            })
            
            console.log(paint.green(`𒁈 ${results.length} resultados encontrados en Google`))
            return { success: true as const, results }
            
        } catch (error) {
            console.error(paint.red('𒁈 Error buscando en Google:'), error)
            return { success: false as const, error: error.message, results: [] }
        }
    }
    
    async googleImages(query, limit = 20) {
        try {
            console.log(paint.cyan(`𒁈 Buscando imágenes en Google: ${query}`))
            
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch&num=${limit}`
            const { success, data } = await this.fetchPage(searchUrl)
            
            if (!success) throw new Error('Error obteniendo imágenes de Google')
            
            const images: any[] = []
            const regex = /"ou":"([^"]+)"/g
            let match
            
            while ((match = regex.exec(data)) !== null && images.length < limit) {
                const imageUrl = match[1]
                if (imageUrl && imageUrl.startsWith('http')) {
                    images.push({
                        url: imageUrl,
                        thumbnail: imageUrl // Google ya optimiza las imágenes
                    })
                }
            }
            
            console.log(paint.green(`𒁈 ${images.length} imágenes encontradas`))
            return { success: true as const, results: images }
            
        } catch (error) {
            console.error(paint.red('𒁈 Error buscando imágenes:'), error)
            return { success: false as const, error: error.message, results: [] }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                             WIKIPEDIA SCRAPER                               │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async searchWikipedia(query, lang = 'es') {
        try {
            console.log(paint.cyan(`𒁈 Buscando en Wikipedia: ${query}`))
            
            const searchUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`
            const { success, data } = await this.fetchPage(searchUrl)
            
            if (!success) throw new Error('Artículo no encontrado en Wikipedia')
            
            const article = JSON.parse(data)
            
            if (article.type === 'disambiguation') {
                // Si es página de desambiguación, buscar páginas relacionadas
                const relatedUrl = `https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=5&format=json`
                const relatedRes = await this.fetchPage(relatedUrl)
                
                if (relatedRes.success) {
                    const relatedData = JSON.parse(relatedRes.data)
                    return {
                        success: true as const,
                        type: 'disambiguation',
                        suggestions: relatedData[1] || [],
                        urls: relatedData[3] || []
                    }
                }
            }
            
            return {
                success: true as const,
                type: 'article',
                article: {
                    title: article.title,
                    extract: article.extract,
                    thumbnail: article.thumbnail?.source,
                    url: article.content_urls?.desktop?.page,
                    lang: article.lang
                }
            }
            
        } catch (error) {
            console.error(paint.red('𒁈 Error buscando en Wikipedia:'), error)
            return { success: false as const, error: error.message }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                             SOCIAL MEDIA SCRAPERS                           │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async instagramPost(url) {
        try {
            console.log(paint.cyan(`𒁈 Extrayendo post de Instagram`))
            
            // Convertir URL si es necesario
            if (url.includes('/reel/')) {
                url = url.replace('/reel/', '/p/')
            }
            
            const { success, data } = await this.fetchPage(url + '?__a=1&__d=dis')
            
            if (!success) throw new Error('Error obteniendo post de Instagram')
            
            const $ = cheerio.load(data)
            
            // Extraer datos de meta tags
            const title = $('meta[property="og:title"]').attr('content') || 'Sin título'
            const description = $('meta[property="og:description"]').attr('content') || 'Sin descripción'
            const image = $('meta[property="og:image"]').attr('content')
            const video = $('meta[property="og:video"]').attr('content')
            
            return {
                success: true as const,
                post: {
                    title,
                    description,
                    image,
                    video,
                    url
                }
            }
            
        } catch (error) {
            console.error(paint.red('𒁈 Error extrayendo de Instagram:'), error)
            return { success: false as const, error: error.message }
        }
    }
    
    async tiktokPost(url) {
        try {
            console.log(paint.cyan(`𒁈 Extrayendo post de TikTok`))
            
            const { success, data } = await this.fetchPage(url)
            
            if (!success) throw new Error('Error obteniendo post de TikTok')
            
            const $ = cheerio.load(data)
            
            // Extraer datos de meta tags
            const title = $('meta[property="og:title"]').attr('content') || 'Sin título'
            const description = $('meta[property="og:description"]').attr('content') || 'Sin descripción'
            const image = $('meta[property="og:image"]').attr('content')
            const video = $('meta[property="og:video"]').attr('content')
            
            // Extraer datos del script JSON
            const scriptMatch = data.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application\/json">(.+?)<\/script>/)
            let additionalData: Record<string, any> = {}
            
            if (scriptMatch) {
                try {
                    const jsonData = JSON.parse(scriptMatch[1])
                    const videoData = jsonData?.default?.VideoPage?.video
                    if (videoData) {
                        additionalData = {
                            author: videoData.author || 'Desconocido',
                            plays: videoData.stats?.playCount || 0,
                            likes: videoData.stats?.diggCount || 0,
                            shares: videoData.stats?.shareCount || 0
                        }
                    }
                } catch (e) {
                    // Ignorar errores de parsing
                }
            }
            
            return {
                success: true as const,
                post: {
                    title,
                    description,
                    image,
                    video,
                    url,
                    ...additionalData
                }
            }
            
        } catch (error) {
            console.error(paint.red('𒁈 Error extrayendo de TikTok:'), error)
            return { success: false as const, error: error.message }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                             PINTEREST SCRAPER                               │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async searchPinterest(query, limit = 20) {
        try {
            console.log(paint.cyan(`𒁈 Buscando en Pinterest: ${query}`))
            
            const searchUrl = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`
            const { success, data } = await this.fetchPage(searchUrl)
            
            if (!success) throw new Error('Error obteniendo resultados de Pinterest')
            
            const images: any[] = []
            
            // Extraer URLs de imágenes usando regex
            const imageRegex = /"url_sig":"([^"]+)".*?"url":"([^"]+)"/g
            let match
            
            while ((match = imageRegex.exec(data)) !== null && images.length < limit) {
                const imageUrl = match[2].replace(/\\u002F/g, '/')
                if (imageUrl.startsWith('https://')) {
                    images.push({
                        url: imageUrl,
                        thumbnail: imageUrl
                    })
                }
            }
            
            console.log(paint.green(`𒁈 ${images.length} imágenes encontradas en Pinterest`))
            return { success: true as const, results: images }
            
        } catch (error) {
            console.error(paint.red('𒁈 Error buscando en Pinterest:'), error)
            return { success: false as const, error: error.message, results: [] }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                             NOTICIAS SCRAPER                                │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async getNews(query = '', limit = 10) {
        try {
            console.log(paint.cyan(`𒁈 Obteniendo noticias: ${query || 'generales'}`))
            
            const sources = [
                'https://rss.cnn.com/rss/edition.rss',
                'https://feeds.bbci.co.uk/news/rss.xml',
                'https://www.elpais.com/rss/elpais/portada.xml'
            ]
            
            const allNews: any[] = []
            
            for (const source of sources) {
                try {
                    const { success, data } = await this.fetchPage(source)
                    if (success) {
                        const $ = cheerio.load(data, { xmlMode: true })
                        
                        $('item').each((i, element) => {
                            if (allNews.length >= limit * 2) return false
                            
                            const $item = $(element)
                            const title = $item.find('title').text()
                            const link = $item.find('link').text()
                            const description = $item.find('description').text()
                            const pubDate = $item.find('pubDate').text()
                            
                            if (title && link) {
                                if (!query || title.toLowerCase().includes(query.toLowerCase())) {
                                    allNews.push({
                                        title: title.trim(),
                                        url: link.trim(),
                                        description: description.trim(),
                                        publishedAt: pubDate.trim(),
                                        source: source.includes('cnn') ? 'CNN' : 
                                               source.includes('bbc') ? 'BBC' : 'El País'
                                    })
                                }
                            }
                        })
                    }
                } catch (e) {
                    continue
                }
            }
            
            const news = allNews.slice(0, limit)
            console.log(paint.green(`𒁈 ${news.length} noticias encontradas`))
            return { success: true as const, results: news }
            
        } catch (error) {
            console.error(paint.red('𒁈 Error obteniendo noticias:'), error)
            return { success: false as const, error: error.message, results: [] }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                             CLIMA SCRAPER                                   │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async getWeather(city) {
        try {
            console.log(paint.cyan(`𒁈 Obteniendo clima para: ${city}`))
            
            const searchUrl = `https://www.google.com/search?q=clima+${encodeURIComponent(city)}&hl=es`
            const { success, data } = await this.fetchPage(searchUrl)
            
            if (!success) throw new Error('Error obteniendo datos del clima')
            
            const $ = cheerio.load(data)
            
            // Extraer datos del clima
            const location = $('#wob_loc').text() || city
            const time = $('#wob_dts').text() || 'Desconocido'
            const info = $('#wob_dc').text() || 'Sin información'
            const temp = $('#wob_tm').text() || 'N/A'
            const precipitation = $('#wob_pp').text() || 'N/A'
            const humidity = $('#wob_hm').text() || 'N/A'
            const wind = $('#wob_ws').text() || 'N/A'
            
            // Pronóstico extendido
            const forecast: any[] = []
            $('.wob_df').each((i, element) => {
                if (forecast.length >= 5) return false
                
                const $day = $(element)
                const dayName = $day.find('.QrNVmd').text()
                const dayTemp = $day.find('.gNCp2e .wob_t').text()
                const nightTemp = $day.find('.QrNVmd + .gNCp2e .wob_t').text()
                const condition = $day.find('img').attr('alt')
                
                if (dayName && dayTemp) {
                    forecast.push({
                        day: dayName,
                        high: dayTemp,
                        low: nightTemp || 'N/A',
                        condition: condition || 'Desconocido'
                    })
                }
            })
            
            return {
                success: true as const,
                weather: {
                    location,
                    time,
                    condition: info,
                    temperature: temp,
                    precipitation,
                    humidity,
                    wind,
                    forecast
                }
            }
            
        } catch (error) {
            console.error(paint.red('𒁈 Error obteniendo clima:'), error)
            return { success: false as const, error: error.message }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                             FUNCIONES GENERALES                             │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async scrapeGeneric(url, selectors: Record<string, any> = {}) {
        try {
            console.log(paint.cyan(`𒁈 Scrapeando: ${url}`))
            
            const { success, data } = await this.fetchPage(url)
            
            if (!success) throw new Error('Error obteniendo página')
            
            const $ = cheerio.load(data)
            const result: Record<string, any> = {}
            
            // Aplicar selectores personalizados
            for (const [key, selector] of Object.entries(selectors)) {
                try {
                    const element = $(selector)
                    if (element.length > 0) {
                        result[key] = element.text().trim() || element.attr('content') || element.attr('href')
                    }
                } catch (e) {
                    result[key] = null
                }
            }
            
            // Meta tags básicos si no se especifican selectores
            if (Object.keys(selectors).length === 0) {
                result.title = $('title').text() || $('meta[property="og:title"]').attr('content')
                result.description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content')
                result.image = $('meta[property="og:image"]').attr('content')
                result.url = url
            }
            
            return { success: true as const, data: result }
            
        } catch (error) {
            console.error(paint.red('𒁈 Error en scraping genérico:'), error)
            return { success: false as const, error: error.message }
        }
    }
    
    async extractEmails(url) {
        try {
            const { success, data } = await this.fetchPage(url)
            
            if (!success) throw new Error('Error obteniendo página')
            
            const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
            const emails = [...new Set(data.match(emailRegex) || [])]
            
            return { success: true as const, emails }
            
        } catch (error) {
            return { success: false as const, error: error.message, emails: [] }
        }
    }
    
    async extractPhoneNumbers(url) {
        try {
            const { success, data } = await this.fetchPage(url)
            
            if (!success) throw new Error('Error obteniendo página')
            
            const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g
            const phones = [...new Set(data.match(phoneRegex) || [])]
            
            return { success: true as const, phones }
            
        } catch (error) {
            return { success: false as const, error: error.message, phones: [] }
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                              INSTANCIA GLOBAL                               │
// ═══════════════════════════════════════════════════════════════════════════════

const scraper = new AvenixScraper()

export default scraper
