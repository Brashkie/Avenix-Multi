/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                            𒁈 AVENIX-MULTI V2.0.0 𒁈                         ┃
 * ┃                 LIB/DOWNLOAD.JS - DESCARGA DE CONTENIDO                     ┃
 * ┃                          Creado por: Hepein Oficial                          ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import paint from './paint.js'
import { downloadFile, fetchWithRetry } from './functions.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ═══════════════════════════════════════════════════════════════════════════════
// │                        CLASE PRINCIPAL DE DOWNLOADER                        │
// ═══════════════════════════════════════════════════════════════════════════════

class AvenixDownloader {
    tempDir: string
    maxVideoSize: number
    maxAudioSize: number
    timeout: number
    platforms: any

    constructor() {
        this.tempDir = path.join(__dirname, '../../tmp')
        this.maxVideoSize = 100 * 1024 * 1024 // 100MB
        this.maxAudioSize = 50 * 1024 * 1024  // 50MB
        this.timeout = 60000 // 60 segundos
        
        // Configuración para diferentes plataformas
        this.platforms = {
            youtube: {
                patterns: [/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/],
                maxDuration: 600 // 10 minutos
            },
            tiktok: {
                patterns: [/(?:tiktok\.com\/).*\/video\/(\d+)/],
                maxDuration: 300 // 5 minutos
            },
            instagram: {
                patterns: [/(?:instagram\.com\/)(?:p|reel|tv)\/([^/?#&]+)/],
                maxDuration: 300 // 5 minutos
            },
            facebook: {
                patterns: [/(?:facebook\.com|fb\.watch).*\/(\d+)/],
                maxDuration: 600 // 10 minutos
            },
            twitter: {
                patterns: [/(?:twitter\.com|x\.com)\/.*\/status\/(\d+)/],
                maxDuration: 300 // 5 minutos
            }
        }
        
        this.init()
    }
    
    async init() {
        try {
            await fs.mkdir(this.tempDir, { recursive: true })
            console.log(paint.green('𒁈 Download engine inicializado'))
        } catch (error) {
            console.error(paint.red('𒁈 Error inicializando downloader:'), error)
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           FUNCIONES DE UTILIDAD                             │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    generateTempPath(ext = 'tmp') {
        return path.join(this.tempDir, `dl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`)
    }
    
    async cleanupFile(filePath) {
        try {
            await fs.unlink(filePath)
        } catch (error) {
            // Ignorar si el archivo no existe
        }
    }
    
    detectPlatform(url) {
        for (const [platform, config] of Object.entries(this.platforms as Record<string, any>)) {
            for (const pattern of config.patterns) {
                const match = url.match(pattern)
                if (match) {
                    return { platform, id: match[1], config }
                }
            }
        }
        return null
    }
    
    async checkYtDlp() {
        return new Promise((resolve) => {
            const ytdlp = spawn('yt-dlp', ['--version'])
            ytdlp.on('close', (code) => {
                resolve(code === 0)
            })
            ytdlp.on('error', () => {
                resolve(false)
            })
        })
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                             YOUTUBE DOWNLOADER                              │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async downloadYouTube(url, options: Record<string, any> = {}) {
        try {
            console.log(paint.cyan(`𒁈 Descargando de YouTube: ${url}`))
            
            const {
                quality = 'medium',
                audioOnly = false,
                maxDuration = 600
            } = options
            
            // Verificar yt-dlp
            const hasYtDlp = await this.checkYtDlp()
            if (!hasYtDlp) {
                throw new Error('yt-dlp no está instalado')
            }
            
            // Obtener información del video primero
            const info = await this.getYouTubeInfo(url)
            if (!info.success) {
                throw new Error('No se pudo obtener información del video')
            }
            
            if (info.duration > maxDuration) {
                throw new Error(`Video muy largo (${info.duration}s, máximo: ${maxDuration}s)`)
            }
            
            const outputPath = audioOnly ? 
                this.generateTempPath('mp3') : 
                this.generateTempPath('mp4')
            
            // Configurar argumentos de yt-dlp
            const args = [
                '--no-warnings',
                '--no-check-certificate',
                '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                '-o', outputPath
            ]
            
            if (audioOnly) {
                args.push(
                    '-x', '--audio-format', 'mp3',
                    '--audio-quality', '128K'
                )
            } else {
                // Configurar calidad de video
                switch (quality) {
                    case 'low':
                        args.push('-f', 'worst[height<=360]/worst')
                        break
                    case 'medium':
                        args.push('-f', 'best[height<=720]/best')
                        break
                    case 'high':
                        args.push('-f', 'best[height<=1080]/best')
                        break
                    default:
                        args.push('-f', 'best[height<=720]/best')
                }
            }
            
            args.push(url)
            
            // Ejecutar yt-dlp
            const result = await this.runYtDlp(args)
            
            if (!result.success) {
                throw new Error(result.error)
            }
            
            // Verificar que el archivo se descargó
            const files = await fs.readdir(this.tempDir)
            const downloadedFile = files.find(file => 
                file.startsWith('dl_') && 
                (file.endsWith('.mp4') || file.endsWith('.mp3'))
            )
            
            if (!downloadedFile) {
                throw new Error('Archivo no encontrado después de la descarga')
            }
            
            const filePath = path.join(this.tempDir, downloadedFile)
            const buffer = await fs.readFile(filePath)
            
            // Verificar tamaño
            const maxSize = audioOnly ? this.maxAudioSize : this.maxVideoSize
            if (buffer.length > maxSize) {
                await this.cleanupFile(filePath)
                throw new Error(`Archivo muy grande: ${(buffer.length / 1024 / 1024).toFixed(1)}MB`)
            }
            
            await this.cleanupFile(filePath)
            
            console.log(paint.green(`𒁈 Descarga completada: ${(buffer.length / 1024).toFixed(1)}KB`))
            
            return {
                success: true as const,
                buffer: buffer,
                title: info.title,
                duration: info.duration,
                size: buffer.length,
                type: audioOnly ? 'audio' : 'video',
                format: audioOnly ? 'mp3' : 'mp4'
            }
            
        } catch (error) {
            console.error(paint.red('𒁈 Error descargando YouTube:'), error)
            return { success: false as const, error: error.message }
        }
    }
    
    async getYouTubeInfo(url) {
        try {
            const args = [
                '--no-warnings',
                '--dump-json',
                '--no-download',
                url
            ]
            
            const result = await this.runYtDlp(args)
            
            if (!result.success) {
                return { success: false as const, error: result.error }
            }
            
            const info = JSON.parse(result.stdout)
            
            return {
                success: true as const,
                title: info.title,
                duration: info.duration || 0,
                uploader: info.uploader,
                view_count: info.view_count,
                thumbnail: info.thumbnail,
                description: info.description
            }
            
        } catch (error) {
            return { success: false as const, error: error.message }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                             TIKTOK DOWNLOADER                               │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async downloadTikTok(url, options: Record<string, any> = {}) {
        try {
            console.log(paint.cyan(`𒁈 Descargando de TikTok: ${url}`))
            
            const { audioOnly = false } = options
            
            // Intentar con diferentes métodos
            let result = await this.downloadTikTokWithYtDlp(url, audioOnly)
            
            if (!result.success) {
                result = await this.downloadTikTokWithAPI(url, audioOnly)
            }
            
            return result
            
        } catch (error) {
            console.error(paint.red('𒁈 Error descargando TikTok:'), error)
            return { success: false as const, error: error.message }
        }
    }
    
    async downloadTikTokWithYtDlp(url, audioOnly = false) {
        try {
            const hasYtDlp = await this.checkYtDlp()
            if (!hasYtDlp) {
                throw new Error('yt-dlp no disponible')
            }
            
            const outputPath = audioOnly ? 
                this.generateTempPath('mp3') : 
                this.generateTempPath('mp4')
            
            const args = [
                '--no-warnings',
                '--user-agent', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
                '-o', outputPath
            ]
            
            if (audioOnly) {
                args.push('-x', '--audio-format', 'mp3')
            }
            
            args.push(url)
            
            const result = await this.runYtDlp(args)
            
            if (!result.success) {
                throw new Error(result.error)
            }
            
            // Buscar archivo descargado
            const files = await fs.readdir(this.tempDir)
            const downloadedFile = files.find(file => 
                file.startsWith('dl_') && 
                (file.endsWith('.mp4') || file.endsWith('.mp3'))
            )
            
            if (!downloadedFile) {
                throw new Error('Archivo no encontrado')
            }
            
            const filePath = path.join(this.tempDir, downloadedFile)
            const buffer = await fs.readFile(filePath)
            
            await this.cleanupFile(filePath)
            
            return {
                success: true as const,
                buffer: buffer,
                size: buffer.length,
                type: audioOnly ? 'audio' : 'video',
                format: audioOnly ? 'mp3' : 'mp4'
            }
            
        } catch (error) {
            return { success: false as const, error: error.message }
        }
    }
    
    async downloadTikTokWithAPI(url, audioOnly = false) {
        try {
            // API alternativa para TikTok
            const apiUrl = `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`
            
            const response = await fetchWithRetry(apiUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            })
            
            const data: any = await response.json()
            
            if (!data.video) {
                throw new Error('No se pudo obtener video de la API')
            }
            
            const videoUrl = audioOnly ? data.music : data.video.noWatermark
            if (!videoUrl) {
                throw new Error('URL de descarga no disponible')
            }
            
            const buffer = await downloadFile(videoUrl, this.maxVideoSize)
            
            return {
                success: true as const,
                buffer: buffer,
                title: data.title || 'TikTok Video',
                author: data.author?.unique_id,
                size: buffer.length,
                type: audioOnly ? 'audio' : 'video',
                format: audioOnly ? 'mp3' : 'mp4'
            }
            
        } catch (error) {
            return { success: false as const, error: error.message }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                            INSTAGRAM DOWNLOADER                             │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async downloadInstagram(url, options: Record<string, any> = {}) {
        try {
            console.log(paint.cyan(`𒁈 Descargando de Instagram: ${url}`))
            
            const { audioOnly = false } = options
            
            // Intentar con yt-dlp primero
            let result = await this.downloadInstagramWithYtDlp(url, audioOnly)
            
            if (!result.success) {
                result = await this.downloadInstagramWithAPI(url, audioOnly)
            }
            
            return result
            
        } catch (error) {
            console.error(paint.red('𒁈 Error descargando Instagram:'), error)
            return { success: false as const, error: error.message }
        }
    }
    
    async downloadInstagramWithYtDlp(url, audioOnly = false) {
        try {
            const hasYtDlp = await this.checkYtDlp()
            if (!hasYtDlp) {
                throw new Error('yt-dlp no disponible')
            }
            
            const outputPath = audioOnly ? 
                this.generateTempPath('mp3') : 
                this.generateTempPath('mp4')
            
            const args = [
                '--no-warnings',
                '--cookies-from-browser', 'chrome',
                '-o', outputPath
            ]
            
            if (audioOnly) {
                args.push('-x', '--audio-format', 'mp3')
            }
            
            args.push(url)
            
            const result = await this.runYtDlp(args)
            
            if (!result.success) {
                throw new Error(result.error)
            }
            
            const files = await fs.readdir(this.tempDir)
            const downloadedFile = files.find(file => 
                file.startsWith('dl_') && 
                (file.endsWith('.mp4') || file.endsWith('.mp3') || file.endsWith('.jpg'))
            )
            
            if (!downloadedFile) {
                throw new Error('Archivo no encontrado')
            }
            
            const filePath = path.join(this.tempDir, downloadedFile)
            const buffer = await fs.readFile(filePath)
            
            await this.cleanupFile(filePath)
            
            const isImage = downloadedFile.endsWith('.jpg')
            
            return {
                success: true as const,
                buffer: buffer,
                size: buffer.length,
                type: isImage ? 'image' : (audioOnly ? 'audio' : 'video'),
                format: isImage ? 'jpg' : (audioOnly ? 'mp3' : 'mp4')
            }
            
        } catch (error) {
            return { success: false as const, error: error.message }
        }
    }
    
    async downloadInstagramWithAPI(url, audioOnly = false) {
        try {
            // API alternativa para Instagram
            const apiUrl = `https://api.saveig.app/api/download?url=${encodeURIComponent(url)}`
            
            const response = await fetchWithRetry(apiUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            })
            
            const data: any = await response.json()
            
            if (!data.success || !data.data) {
                throw new Error('API de Instagram falló')
            }
            
            const media = data.data[0] // Primer elemento
            const downloadUrl = audioOnly ? media.audio : media.url
            
            if (!downloadUrl) {
                throw new Error('URL de descarga no disponible')
            }
            
            const buffer = await downloadFile(downloadUrl, this.maxVideoSize)
            
            return {
                success: true as const,
                buffer: buffer,
                size: buffer.length,
                type: media.type || (audioOnly ? 'audio' : 'video'),
                format: audioOnly ? 'mp3' : 'mp4'
            }
            
        } catch (error) {
            return { success: false as const, error: error.message }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                            DOWNLOADER UNIVERSAL                             │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async download(url, options: Record<string, any> = {}) {
        try {
            const platform = this.detectPlatform(url)
            
            if (!platform) {
                return await this.downloadGeneric(url, options)
            }
            
            console.log(paint.cyan(`𒁈 Plataforma detectada: ${platform.platform}`))
            
            switch (platform.platform) {
                case 'youtube':
                    return await this.downloadYouTube(url, options)
                    
                case 'tiktok':
                    return await this.downloadTikTok(url, options)
                    
                case 'instagram':
                    return await this.downloadInstagram(url, options)
                    
                case 'facebook':
                case 'twitter':
                    return await this.downloadWithYtDlp(url, options)
                    
                default:
                    return await this.downloadGeneric(url, options)
            }
            
        } catch (error) {
            console.error(paint.red('𒁈 Error en descarga universal:'), error)
            return { success: false as const, error: error.message }
        }
    }
    
    async downloadWithYtDlp(url, options: Record<string, any> = {}) {
        try {
            const hasYtDlp = await this.checkYtDlp()
            if (!hasYtDlp) {
                throw new Error('yt-dlp no está disponible')
            }
            
            const { audioOnly = false, quality = 'medium' } = options
            
            const outputPath = audioOnly ? 
                this.generateTempPath('mp3') : 
                this.generateTempPath('mp4')
            
            const args = [
                '--no-warnings',
                '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                '-o', outputPath
            ]
            
            if (audioOnly) {
                args.push('-x', '--audio-format', 'mp3')
            } else {
                args.push('-f', 'best[height<=720]/best')
            }
            
            args.push(url)
            
            const result = await this.runYtDlp(args)
            
            if (!result.success) {
                throw new Error(result.error)
            }
            
            const files = await fs.readdir(this.tempDir)
            const downloadedFile = files.find(file => 
                file.startsWith('dl_') && 
                (file.endsWith('.mp4') || file.endsWith('.mp3'))
            )
            
            if (!downloadedFile) {
                throw new Error('Archivo no encontrado')
            }
            
            const filePath = path.join(this.tempDir, downloadedFile)
            const buffer = await fs.readFile(filePath)
            
            await this.cleanupFile(filePath)
            
            return {
                success: true as const,
                buffer: buffer,
                size: buffer.length,
                type: audioOnly ? 'audio' : 'video',
                format: audioOnly ? 'mp3' : 'mp4'
            }
            
        } catch (error) {
            return { success: false as const, error: error.message }
        }
    }
    
    async downloadGeneric(url, options: Record<string, any> = {}) {
        try {
            console.log(paint.cyan(`𒁈 Descarga genérica: ${url}`))
            
            const buffer = await downloadFile(url, this.maxVideoSize)
            
            // Detectar tipo de archivo
            const contentType = options.type || 'application/octet-stream'
            let type = 'file'
            let format = 'bin'
            
            if (contentType.startsWith('image/')) {
                type = 'image'
                format = contentType.split('/')[1]
            } else if (contentType.startsWith('video/')) {
                type = 'video'
                format = contentType.split('/')[1]
            } else if (contentType.startsWith('audio/')) {
                type = 'audio'
                format = contentType.split('/')[1]
            }
            
            return {
                success: true as const,
                buffer: buffer,
                size: buffer.length,
                type: type,
                format: format
            }
            
        } catch (error) {
            return { success: false as const, error: error.message }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           EJECUTOR DE YT-DLP                                │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    runYtDlp(args: string[]): Promise<{ success: boolean; output?: string; error?: string; [key: string]: any }> {
        return new Promise((resolve) => {
            const ytdlp = spawn('yt-dlp', args)
            
            let stdout = ''
            let stderr = ''
            
            ytdlp.stdout.on('data', (data) => {
                stdout += data.toString()
            })
            
            ytdlp.stderr.on('data', (data) => {
                stderr += data.toString()
            })
            
            ytdlp.on('close', (code) => {
                if (code === 0) {
                    resolve({ success: true, stdout, stderr })
                } else {
                    resolve({ success: false, error: stderr || 'Error desconocido', stdout })
                }
            })
            
            ytdlp.on('error', (error) => {
                resolve({ success: false, error: `Error ejecutando yt-dlp: ${error.message}` })
            })
            
            // Timeout
            setTimeout(() => {
                ytdlp.kill('SIGKILL')
                resolve({ success: false, error: 'Timeout en yt-dlp' })
            }, this.timeout)
        })
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           FUNCIONES ADICIONALES                             │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async getVideoInfo(url) {
        try {
            const platform = this.detectPlatform(url)
            
            if (platform?.platform === 'youtube') {
                return await this.getYouTubeInfo(url)
            }
            
            // Info genérica con yt-dlp
            const hasYtDlp = await this.checkYtDlp()
            if (!hasYtDlp) {
                return { success: false as const, error: 'yt-dlp no disponible' }
            }
            
            const args = [
                '--no-warnings',
                '--dump-json',
                '--no-download',
                url
            ]
            
            const result = await this.runYtDlp(args)
            
            if (!result.success) {
                return { success: false as const, error: result.error }
            }
            
            const info = JSON.parse(result.stdout)
            
            return {
                success: true as const,
                title: info.title,
                duration: info.duration || 0,
                uploader: info.uploader,
                thumbnail: info.thumbnail,
                description: info.description,
                platform: platform?.platform || 'unknown'
            }
            
        } catch (error) {
            return { success: false as const, error: error.message }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           LIMPIEZA AUTOMÁTICA                               │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async cleanup() {
        try {
            const files = await fs.readdir(this.tempDir)
            const oldFiles = files.filter(file => {
                return file.startsWith('dl_') && 
                       (Date.now() - parseInt(file.split('_')[1]) > 300000) // 5 minutos
            })
            
            await Promise.all(
                oldFiles.map(file => 
                    this.cleanupFile(path.join(this.tempDir, file))
                )
            )
            
            if (oldFiles.length > 0) {
                console.log(paint.cyan(`𒁈 Downloader: ${oldFiles.length} archivos temporales limpiados`))
            }
            
        } catch (error) {
            console.error(paint.red('𒁈 Error limpiando archivos de downloader:'), error)
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                              INSTANCIA GLOBAL                               │
// ═══════════════════════════════════════════════════════════════════════════════

const downloader = new AvenixDownloader()

// Limpieza automática cada 10 minutos
setInterval(() => {
    downloader.cleanup()
}, 10 * 60 * 1000)

export default downloader
