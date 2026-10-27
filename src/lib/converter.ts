/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                            𒁈 AVENIX-MULTI V2.0.0 𒁈                         ┃
 * ┃                    LIB/CONVERTER.JS - CONVERSIÓN MULTIMEDIA                 ┃
 * ┃                          Creado por: Hepein Oficial                          ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import { spawn } from 'child_process'
import { promises as fs, statSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { fileTypeFromBuffer } from 'file-type'
import paint from './paint.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ═══════════════════════════════════════════════════════════════════════════════
// │                        CONFIGURACIÓN DE CONVERSIÓN                          │
// ═══════════════════════════════════════════════════════════════════════════════

class AvenixConverter {
    tempDir: string
    maxFileSize: number
    supportedFormats: any

    constructor() {
        this.tempDir = path.join(__dirname, '../../tmp')
        this.maxFileSize = 50 * 1024 * 1024 // 50MB
        this.supportedFormats = {
            image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
            video: ['mp4', 'avi', 'mov', 'mkv', 'webm', '3gp'],
            audio: ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'opus']
        }
        
        this.init()
    }
    
    async init() {
        try {
            // Crear directorio temporal
            await fs.mkdir(this.tempDir, { recursive: true })
        } catch (error) {
            console.error(paint.red('𒁈 Error inicializando converter:'), error)
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           FUNCIONES DE UTILIDAD                             │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    generateTempPath(ext = 'tmp') {
        return path.join(this.tempDir, `avenix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`)
    }
    
    async cleanupFile(filePath) {
        try {
            await fs.unlink(filePath)
        } catch (error) {
            // Archivo ya no existe, ignorar
        }
    }
    
    async validateFile(buffer) {
        if (!Buffer.isBuffer(buffer)) {
            throw new Error('Input debe ser un Buffer')
        }
        
        if (buffer.length > this.maxFileSize) {
            throw new Error(`Archivo muy grande (max: ${this.maxFileSize / 1024 / 1024}MB)`)
        }
        
        return await fileTypeFromBuffer(buffer)
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           CONVERSIÓN DE STICKERS                            │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async toSticker(buffer, options: Record<string, any> = {}) {
        const inputPath = this.generateTempPath('input')
        const outputPath = this.generateTempPath('webp')
        
        try {
            // Validar archivo
            const fileType = await this.validateFile(buffer)
            if (!fileType) {
                throw new Error('Tipo de archivo no detectado')
            }
            
            // Escribir archivo temporal
            await fs.writeFile(inputPath, buffer)
            
            // Configurar opciones de conversión
            const {
                quality = 80,
                width = 512,
                height = 512,
                fps = 10,
                duration = 6
            } = options
            
            // Determinar si es imagen o video
            const isVideo = fileType.mime.startsWith('video/') || fileType.ext === 'gif'
            
            let ffmpegArgs
            if (isVideo) {
                // Conversión de video/gif a sticker animado
                ffmpegArgs = [
                    '-i', inputPath,
                    '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=transparent`,
                    '-c:v', 'libwebp',
                    '-quality', quality.toString(),
                    '-fps_mode', 'vfr',
                    '-r', fps.toString(),
                    '-t', duration.toString(),
                    '-loop', '0',
                    '-preset', 'picture',
                    '-an',
                    '-vsync', '0',
                    '-s', `${width}x${height}`,
                    '-y',
                    outputPath
                ]
            } else {
                // Conversión de imagen a sticker estático
                ffmpegArgs = [
                    '-i', inputPath,
                    '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=transparent`,
                    '-c:v', 'libwebp',
                    '-quality', quality.toString(),
                    '-preset', 'picture',
                    '-y',
                    outputPath
                ]
            }
            
            await this.runFFmpeg(ffmpegArgs)
            
            // Leer resultado
            const result = await fs.readFile(outputPath)
            
            return result
            
        } catch (error) {
            throw new Error(`Error convirtiendo a sticker: ${error.message}`)
        } finally {
            // Limpiar archivos temporales
            await Promise.all([
                this.cleanupFile(inputPath),
                this.cleanupFile(outputPath)
            ])
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           CONVERSIÓN DE AUDIO                               │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async toAudio(buffer, format = 'mp3', options: Record<string, any> = {}) {
        const inputPath = this.generateTempPath('input')
        const outputPath = this.generateTempPath(format)
        
        try {
            // Validar archivo
            await this.validateFile(buffer)
            
            // Escribir archivo temporal
            await fs.writeFile(inputPath, buffer)
            
            // Configurar opciones
            const {
                bitrate = '128k',
                frequency = 44100,
                channels = 2
            } = options
            
            let ffmpegArgs
            
            switch (format.toLowerCase()) {
                case 'mp3':
                    ffmpegArgs = [
                        '-i', inputPath,
                        '-c:a', 'libmp3lame',
                        '-b:a', bitrate,
                        '-ar', frequency.toString(),
                        '-ac', channels.toString(),
                        '-y',
                        outputPath
                    ]
                    break
                    
                case 'ogg':
                case 'opus':
                    ffmpegArgs = [
                        '-i', inputPath,
                        '-c:a', 'libopus',
                        '-b:a', bitrate,
                        '-ar', '48000',
                        '-ac', channels.toString(),
                        '-y',
                        outputPath
                    ]
                    break
                    
                case 'wav':
                    ffmpegArgs = [
                        '-i', inputPath,
                        '-c:a', 'pcm_s16le',
                        '-ar', frequency.toString(),
                        '-ac', channels.toString(),
                        '-y',
                        outputPath
                    ]
                    break
                    
                default:
                    throw new Error(`Formato de audio no soportado: ${format}`)
            }
            
            await this.runFFmpeg(ffmpegArgs)
            
            // Leer resultado
            const result = await fs.readFile(outputPath)
            
            return result
            
        } catch (error) {
            throw new Error(`Error convirtiendo audio: ${error.message}`)
        } finally {
            // Limpiar archivos temporales
            await Promise.all([
                this.cleanupFile(inputPath),
                this.cleanupFile(outputPath)
            ])
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           CONVERSIÓN DE VIDEO                               │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async toVideo(buffer, format = 'mp4', options: Record<string, any> = {}) {
        const inputPath = this.generateTempPath('input')
        const outputPath = this.generateTempPath(format)
        
        try {
            // Validar archivo
            await this.validateFile(buffer)
            
            // Escribir archivo temporal
            await fs.writeFile(inputPath, buffer)
            
            // Configurar opciones
            const {
                quality = 'medium',
                width,
                height,
                fps = 30,
                duration
            } = options
            
            let qualitySettings
            switch (quality) {
                case 'low':
                    qualitySettings = ['-crf', '32', '-preset', 'fast']
                    break
                case 'medium':
                    qualitySettings = ['-crf', '28', '-preset', 'medium']
                    break
                case 'high':
                    qualitySettings = ['-crf', '23', '-preset', 'slow']
                    break
                default:
                    qualitySettings = ['-crf', '28', '-preset', 'medium']
            }
            
            let ffmpegArgs = ['-i', inputPath]
            
            // Filtros de video
            let videoFilters: any[] = []
            
            if (width && height) {
                videoFilters.push(`scale=${width}:${height}`)
            }
            
            if (videoFilters.length > 0) {
                ffmpegArgs.push('-vf', videoFilters.join(','))
            }
            
            // Configuración de codec
            ffmpegArgs.push(
                '-c:v', 'libx264',
                ...qualitySettings,
                '-r', fps.toString()
            )
            
            // Duración si se especifica
            if (duration) {
                ffmpegArgs.push('-t', duration.toString())
            }
            
            ffmpegArgs.push('-y', outputPath)
            
            await this.runFFmpeg(ffmpegArgs)
            
            // Leer resultado
            const result = await fs.readFile(outputPath)
            
            return result
            
        } catch (error) {
            throw new Error(`Error convirtiendo video: ${error.message}`)
        } finally {
            // Limpiar archivos temporales
            await Promise.all([
                this.cleanupFile(inputPath),
                this.cleanupFile(outputPath)
            ])
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                         CONVERSIÓN DE IMÁGENES                              │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async toImage(buffer, format = 'jpg', options: Record<string, any> = {}) {
        const inputPath = this.generateTempPath('input')
        const outputPath = this.generateTempPath(format)
        
        try {
            // Validar archivo
            await this.validateFile(buffer)
            
            // Escribir archivo temporal
            await fs.writeFile(inputPath, buffer)
            
            // Configurar opciones
            const {
                quality = 90,
                width,
                height
            } = options
            
            let ffmpegArgs = ['-i', inputPath]
            
            // Filtros de imagen
            let videoFilters: any[] = []
            
            if (width && height) {
                videoFilters.push(`scale=${width}:${height}`)
            }
            
            if (videoFilters.length > 0) {
                ffmpegArgs.push('-vf', videoFilters.join(','))
            }
            
            // Configuración según formato
            switch (format.toLowerCase()) {
                case 'jpg':
                case 'jpeg':
                    ffmpegArgs.push('-q:v', Math.floor((100 - quality) * 31 / 100).toString())
                    break
                case 'png':
                    // PNG es lossless, no usa quality
                    break
                case 'webp':
                    ffmpegArgs.push('-quality', quality.toString())
                    break
            }
            
            ffmpegArgs.push('-y', outputPath)
            
            await this.runFFmpeg(ffmpegArgs)
            
            // Leer resultado
            const result = await fs.readFile(outputPath)
            
            return result
            
        } catch (error) {
            throw new Error(`Error convirtiendo imagen: ${error.message}`)
        } finally {
            // Limpiar archivos temporales
            await Promise.all([
                this.cleanupFile(inputPath),
                this.cleanupFile(outputPath)
            ])
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           EJECUTOR DE FFMPEG                                │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    runFFmpeg(args) {
        return new Promise<void>((resolve, reject) => {
            const ffmpeg = spawn('ffmpeg', args)
            
            let stderr = ''
            
            ffmpeg.stderr.on('data', (data) => {
                stderr += data.toString()
            })
            
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    resolve()
                } else {
                    reject(new Error(`FFmpeg falló con código ${code}: ${stderr}`))
                }
            })
            
            ffmpeg.on('error', (error) => {
                reject(new Error(`Error ejecutando FFmpeg: ${error.message}`))
            })
            
            // Timeout de 2 minutos
            setTimeout(() => {
                ffmpeg.kill('SIGKILL')
                reject(new Error('FFmpeg timeout'))
            }, 2 * 60 * 1000)
        })
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           FUNCIONES ESPECIALES                              │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async extractAudioFromVideo(buffer, format = 'mp3') {
        const inputPath = this.generateTempPath('input')
        const outputPath = this.generateTempPath(format)
        
        try {
            await fs.writeFile(inputPath, buffer)
            
            const ffmpegArgs = [
                '-i', inputPath,
                '-vn',
                '-c:a', format === 'mp3' ? 'libmp3lame' : 'copy',
                '-y',
                outputPath
            ]
            
            await this.runFFmpeg(ffmpegArgs)
            
            return await fs.readFile(outputPath)
            
        } finally {
            await Promise.all([
                this.cleanupFile(inputPath),
                this.cleanupFile(outputPath)
            ])
        }
    }
    
    async createThumbnail(buffer, time = '00:00:01') {
        const inputPath = this.generateTempPath('input')
        const outputPath = this.generateTempPath('jpg')
        
        try {
            await fs.writeFile(inputPath, buffer)
            
            const ffmpegArgs = [
                '-i', inputPath,
                '-ss', time,
                '-vframes', '1',
                '-vf', 'scale=320:240',
                '-y',
                outputPath
            ]
            
            await this.runFFmpeg(ffmpegArgs)
            
            return await fs.readFile(outputPath)
            
        } finally {
            await Promise.all([
                this.cleanupFile(inputPath),
                this.cleanupFile(outputPath)
            ])
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           LIMPIEZA AUTOMÁTICA                               │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async cleanupTempFiles() {
        try {
            const files = await fs.readdir(this.tempDir)
            const oldFiles = files.filter(file => {
                const filePath = path.join(this.tempDir, file)
                try {
                    const stats = statSync(filePath)
                    const ageMs = Date.now() - stats.mtimeMs
                    return ageMs > 30 * 60 * 1000 // 30 minutos
                } catch {
                    return true
                }
            })
            
            await Promise.all(
                oldFiles.map(file => 
                    this.cleanupFile(path.join(this.tempDir, file))
                )
            )
            
            if (oldFiles.length > 0) {
                console.log(paint.cyan(`𒁈 Converter: ${oldFiles.length} archivos temporales limpiados`))
            }
            
        } catch (error) {
            console.error(paint.red('𒁈 Error limpiando archivos temporales:'), error)
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                              INSTANCIA GLOBAL                               │
// ═══════════════════════════════════════════════════════════════════════════════

const converter = new AvenixConverter()

// Limpieza automática cada 15 minutos
setInterval(() => {
    converter.cleanupTempFiles()
}, 15 * 60 * 1000)

export default converter
