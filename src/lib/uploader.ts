/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                            𒁈 AVENIX-MULTI V2.0.0 𒁈                         ┃
 * ┃                  LIB/UPLOADER.JS - UPLOAD A SERVICIOS EXTERNOS              ┃
 * ┃                          Creado por: Hepein Oficial                          ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { fileTypeFromBuffer } from 'file-type'
import paint from './paint.js'
import { openAsBlob } from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ═══════════════════════════════════════════════════════════════════════════════
// │                        CLASE PRINCIPAL DE UPLOADER                          │
// ═══════════════════════════════════════════════════════════════════════════════

class AvenixUploader {
    tempDir: string
    maxFileSize: number
    timeout: number
    services: any

    constructor() {
        this.tempDir = path.join(__dirname, '../../tmp')
        this.maxFileSize = 100 * 1024 * 1024 // 100MB
        this.timeout = 30000 // 30 segundos
        
        // Configuración de servicios
        this.services = {
            imgur: {
                url: 'https://api.imgur.com/3/image',
                headers: {
                    'Authorization': 'Client-ID ' + (process.env.IMGUR_CLIENT_ID || 'a0113671de07199'),
                },
                maxSize: 10 * 1024 * 1024, // 10MB
                supportedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
            },
            catbox: {
                url: 'https://catbox.moe/user/api.php',
                maxSize: 200 * 1024 * 1024, // 200MB
                supportedTypes: ['*'] // Acepta cualquier tipo
            },
            fileio: {
                url: 'https://file.io/',
                maxSize: 100 * 1024 * 1024, // 100MB
                supportedTypes: ['*'],
                expires: '1d' // Expira en 1 día
            },
            tmpfiles: {
                url: 'https://tmpfiles.org/api/v1/upload',
                maxSize: 100 * 1024 * 1024, // 100MB
                supportedTypes: ['*']
            },
            uguu: {
                url: 'https://uguu.se/upload.php',
                maxSize: 128 * 1024 * 1024, // 128MB
                supportedTypes: ['*']
            }
        }
        
        this.init()
    }
    
    async init() {
        try {
            await fs.mkdir(this.tempDir, { recursive: true })
            console.log(paint.green('𒁈 Uploader engine inicializado'))
        } catch (error) {
            console.error(paint.red('𒁈 Error inicializando uploader:'), error)
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           FUNCIONES DE UTILIDAD                             │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    generateTempPath(ext = 'tmp') {
        return path.join(this.tempDir, `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`)
    }
    
    async cleanupFile(filePath) {
        try {
            await fs.unlink(filePath)
        } catch (error) {
            // Ignorar si el archivo no existe
        }
    }
    
    async validateFile(buffer, service) {
        if (!Buffer.isBuffer(buffer)) {
            throw new Error('Input debe ser un Buffer')
        }
        
        if (buffer.length === 0) {
            throw new Error('Buffer vacío')
        }
        
        if (buffer.length > this.maxFileSize) {
            throw new Error(`Archivo muy grande (max: ${this.maxFileSize / 1024 / 1024}MB)`)
        }
        
        const serviceConfig = this.services[service]
        if (serviceConfig && buffer.length > serviceConfig.maxSize) {
            throw new Error(`Archivo muy grande para ${service} (max: ${serviceConfig.maxSize / 1024 / 1024}MB)`)
        }
        
        const fileType = await fileTypeFromBuffer(buffer)
        
        // Verificar tipos soportados
        if (serviceConfig && serviceConfig.supportedTypes[0] !== '*') {
            if (!fileType || !serviceConfig.supportedTypes.includes(fileType.mime)) {
                throw new Error(`Tipo de archivo no soportado por ${service}`)
            }
        }
        
        return fileType
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           UPLOAD A IMGUR                                    │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async uploadToImgur(buffer, options: Record<string, any> = {}) {
        try {
            const fileType = await this.validateFile(buffer, 'imgur')
            const service = this.services.imgur
            
            console.log(paint.cyan('𒁈 Subiendo imagen a Imgur...'))
            
            const formData = new FormData()
            formData.append('image', buffer.toString('base64'))
            formData.append('type', 'base64')
            
            if (options.title) formData.append('title', options.title)
            if (options.description) formData.append('description', options.description)
            
            const response = await fetch(service.url, {
                method: 'POST',
                headers: service.headers,
                body: formData,
                signal: AbortSignal.timeout(this.timeout)
            })
            
            const result: any = await response.json()
            
            if (!result.success) {
                throw new Error(result.data?.error || 'Error desconocido de Imgur')
            }
            
            const data = result.data
            console.log(paint.green(`𒁈 Imagen subida a Imgur: ${data.link}`))
            
            return {
                success: true as const,
                url: data.link,
                deleteUrl: `https://imgur.com/delete/${data.deletehash}`,
                service: 'imgur',
                size: buffer.length,
                type: fileType?.mime || 'unknown',
                filename: options.filename || `imgur_${data.id}.${fileType?.ext || 'jpg'}`
            }
            
        } catch (error) {
            console.error(paint.red('𒁈 Error subiendo a Imgur:'), error)
            throw new Error(`Error subiendo a Imgur: ${error.message}`)
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           UPLOAD A CATBOX                                   │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async uploadToCatbox(buffer, options: Record<string, any> = {}) {
        try {
            const fileType = await this.validateFile(buffer, 'catbox')
            const service = this.services.catbox
            
            console.log(paint.cyan('𒁈 Subiendo archivo a Catbox...'))
            
            const tempPath = this.generateTempPath(fileType?.ext || 'bin')
            await fs.writeFile(tempPath, buffer)
            
            try {
                const formData = new FormData()
                formData.append('reqtype', 'fileupload')
                formData.append('fileToUpload', await openAsBlob(tempPath), path.basename(tempPath))
                
                const response = await fetch(service.url, {
                    method: 'POST',
                    body: formData,
                    signal: AbortSignal.timeout(this.timeout)
                })
                
                const url = await response.text()
                
                if (!url.startsWith('https://files.catbox.moe/')) {
                    throw new Error('Respuesta inválida de Catbox')
                }
                
                console.log(paint.green(`𒁈 Archivo subido a Catbox: ${url}`))
                
                return {
                    success: true as const,
                    url: url.trim(),
                    service: 'catbox',
                    size: buffer.length,
                    type: fileType?.mime || 'application/octet-stream',
                    filename: options.filename || `catbox_${Date.now()}.${fileType?.ext || 'bin'}`
                }
                
            } finally {
                await this.cleanupFile(tempPath)
            }
            
        } catch (error) {
            console.error(paint.red('𒁈 Error subiendo a Catbox:'), error)
            throw new Error(`Error subiendo a Catbox: ${error.message}`)
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           UPLOAD A FILE.IO                                  │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async uploadToFileIO(buffer, options: Record<string, any> = {}) {
        try {
            const fileType = await this.validateFile(buffer, 'fileio')
            const service = this.services.fileio
            
            console.log(paint.cyan('𒁈 Subiendo archivo a File.io...'))
            
            const tempPath = this.generateTempPath(fileType?.ext || 'bin')
            await fs.writeFile(tempPath, buffer)
            
            try {
                const formData = new FormData()
                formData.append('file', await openAsBlob(tempPath), path.basename(tempPath))
                
                if (options.expires) {
                    formData.append('expires', options.expires)
                } else {
                    formData.append('expires', service.expires)
                }
                
                const response = await fetch(service.url, {
                    method: 'POST',
                    body: formData,
                    signal: AbortSignal.timeout(this.timeout)
                })
                
                const result: any = await response.json()
                
                if (!result.success) {
                    throw new Error(result.message || 'Error desconocido de File.io')
                }
                
                console.log(paint.green(`𒁈 Archivo subido a File.io: ${result.link}`))
                
                return {
                    success: true as const,
                    url: result.link,
                    service: 'file.io',
                    size: buffer.length,
                    type: fileType?.mime || 'application/octet-stream',
                    filename: options.filename || `fileio_${result.key}.${fileType?.ext || 'bin'}`,
                    expires: result.expiry
                }
                
            } finally {
                await this.cleanupFile(tempPath)
            }
            
        } catch (error) {
            console.error(paint.red('𒁈 Error subiendo a File.io:'), error)
            throw new Error(`Error subiendo a File.io: ${error.message}`)
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           UPLOAD A UGUU                                     │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async uploadToUguu(buffer, options: Record<string, any> = {}) {
        try {
            const fileType = await this.validateFile(buffer, 'uguu')
            const service = this.services.uguu
            
            console.log(paint.cyan('𒁈 Subiendo archivo a Uguu...'))
            
            const tempPath = this.generateTempPath(fileType?.ext || 'bin')
            await fs.writeFile(tempPath, buffer)
            
            try {
                const formData = new FormData()
                formData.append('files[]', await openAsBlob(tempPath), path.basename(tempPath))
                
                const response = await fetch(service.url, {
                    method: 'POST',
                    body: formData,
                    signal: AbortSignal.timeout(this.timeout)
                })
                
                const result: any = await response.json()
                
                if (!result.success || !result.files || result.files.length === 0) {
                    throw new Error('Error desconocido de Uguu')
                }
                
                const fileData = result.files[0]
                
                console.log(paint.green(`𒁈 Archivo subido a Uguu: ${fileData.url}`))
                
                return {
                    success: true as const,
                    url: fileData.url,
                    service: 'uguu',
                    size: buffer.length,
                    type: fileType?.mime || 'application/octet-stream',
                    filename: options.filename || fileData.name || `uguu_${Date.now()}.${fileType?.ext || 'bin'}`
                }
                
            } finally {
                await this.cleanupFile(tempPath)
            }
            
        } catch (error) {
            console.error(paint.red('𒁈 Error subiendo a Uguu:'), error)
            throw new Error(`Error subiendo a Uguu: ${error.message}`)
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           UPLOAD A TMPFILES                                 │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async uploadToTmpFiles(buffer, options: Record<string, any> = {}) {
        try {
            const fileType = await this.validateFile(buffer, 'tmpfiles')
            const service = this.services.tmpfiles
            
            console.log(paint.cyan('𒁈 Subiendo archivo a TmpFiles...'))
            
            const tempPath = this.generateTempPath(fileType?.ext || 'bin')
            await fs.writeFile(tempPath, buffer)
            
            try {
                const formData = new FormData()
                formData.append('file', await openAsBlob(tempPath), path.basename(tempPath))
                
                const response = await fetch(service.url, {
                    method: 'POST',
                    body: formData,
                    signal: AbortSignal.timeout(this.timeout)
                })
                
                const result: any = await response.json()
                
                if (!result.data || !result.data.url) {
                    throw new Error('Error desconocido de TmpFiles')
                }
                
                console.log(paint.green(`𒁈 Archivo subido a TmpFiles: ${result.data.url}`))
                
                return {
                    success: true as const,
                    url: result.data.url,
                    service: 'tmpfiles',
                    size: buffer.length,
                    type: fileType?.mime || 'application/octet-stream',
                    filename: options.filename || `tmpfiles_${Date.now()}.${fileType?.ext || 'bin'}`
                }
                
            } finally {
                await this.cleanupFile(tempPath)
            }
            
        } catch (error) {
            console.error(paint.red('𒁈 Error subiendo a TmpFiles:'), error)
            throw new Error(`Error subiendo a TmpFiles: ${error.message}`)
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           UPLOAD AUTOMÁTICO                                 │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async upload(buffer, options: Record<string, any> = {}) {
        const fileType = await fileTypeFromBuffer(buffer)
        const isImage = fileType?.mime?.startsWith('image/')
        
        // Seleccionar el mejor servicio automáticamente
        let services: any[] = []
        
        if (isImage && buffer.length <= this.services.imgur.maxSize) {
            services.push('imgur')
        }
        
        services.push('catbox', 'uguu', 'tmpfiles', 'fileio')
        
        // Filtrar por tamaño
        services = services.filter(service => {
            const config = this.services[service]
            return buffer.length <= config.maxSize
        })
        
        // Intentar upload con cada servicio hasta que uno funcione
        for (const service of services) {
            try {
                console.log(paint.yellow(`𒁈 Intentando upload con ${service}...`))
                
                let result
                switch (service) {
                    case 'imgur':
                        result = await this.uploadToImgur(buffer, options)
                        break
                    case 'catbox':
                        result = await this.uploadToCatbox(buffer, options)
                        break
                    case 'fileio':
                        result = await this.uploadToFileIO(buffer, options)
                        break
                    case 'uguu':
                        result = await this.uploadToUguu(buffer, options)
                        break
                    case 'tmpfiles':
                        result = await this.uploadToTmpFiles(buffer, options)
                        break
                    default:
                        continue
                }
                
                if (result.success) {
                    return result
                }
                
            } catch (error) {
                console.log(paint.yellow(`𒁈 ${service} falló, intentando siguiente...`))
                continue
            }
        }
        
        throw new Error('Todos los servicios de upload fallaron')
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           FUNCIONES ESPECIALES                              │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async uploadMultiple(buffers, options: Record<string, any> = {}) {
        const results: any[] = []
        const errors: any[] = []
        
        console.log(paint.cyan(`𒁈 Subiendo ${buffers.length} archivos...`))
        
        for (let i = 0; i < buffers.length; i++) {
            try {
                const fileOptions = {
                    ...options,
                    filename: options.filename ? `${options.filename}_${i + 1}` : undefined
                }
                
                const result = await this.upload(buffers[i], fileOptions)
                results.push(result)
                
                console.log(paint.green(`𒁈 Archivo ${i + 1}/${buffers.length} subido`))
                
                // Pequeña pausa entre uploads
                if (i < buffers.length - 1) {
                    await new Promise<void>(resolve => setTimeout(resolve, 1000))
                }
                
            } catch (error) {
                console.error(paint.red(`𒁈 Error subiendo archivo ${i + 1}:`), error.message)
                errors.push({ index: i, error: error.message })
            }
        }
        
        return {
            success: results.length > 0,
            results,
            errors,
            total: buffers.length,
            uploaded: results.length,
            failed: errors.length
        }
    }
    
    async uploadFromUrl(url, options: Record<string, any> = {}) {
        try {
            console.log(paint.cyan(`𒁈 Descargando desde URL: ${url}`))
            
            const response = await fetch(url, { signal: AbortSignal.timeout(this.timeout) })
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }
            
            const buffer = Buffer.from(await response.arrayBuffer())
            
            console.log(paint.cyan(`𒁈 Descargado ${(buffer.length / 1024).toFixed(1)}KB, re-subiendo...`))
            
            return await this.upload(buffer, options)
            
        } catch (error) {
            throw new Error(`Error descargando desde URL: ${error.message}`)
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           UTILIDADES ADICIONALES                            │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    getServiceInfo() {
        return Object.entries(this.services as Record<string, any>).map(([name, config]) => ({
            name,
            maxSize: `${(config.maxSize / 1024 / 1024).toFixed(1)}MB`,
            supportedTypes: config.supportedTypes[0] === '*' ? 'Todos' : config.supportedTypes.join(', ')
        }))
    }
    
    async validateUrl(url) {
        try {
            const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) })
            return {
                valid: response.ok,
                size: parseInt(response.headers.get('content-length') || '0'),
                type: response.headers.get('content-type'),
                status: response.status
            }
        } catch (error) {
            return {
                valid: false,
                error: error.message
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // │                           LIMPIEZA AUTOMÁTICA                               │
    // ═══════════════════════════════════════════════════════════════════════════════
    
    async cleanup() {
        try {
            const files = await fs.readdir(this.tempDir)
            const oldFiles = files.filter(file => {
                return file.startsWith('upload_') && 
                       (Date.now() - parseInt(file.split('_')[1]) > 300000) // 5 minutos
            })
            
            await Promise.all(
                oldFiles.map(file => 
                    this.cleanupFile(path.join(this.tempDir, file))
                )
            )
            
            if (oldFiles.length > 0) {
                console.log(paint.cyan(`𒁈 Uploader: ${oldFiles.length} archivos temporales limpiados`))
            }
            
        } catch (error) {
            console.error(paint.red('𒁈 Error limpiando archivos de uploader:'), error)
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                              INSTANCIA GLOBAL                               │
// ═══════════════════════════════════════════════════════════════════════════════

const uploader = new AvenixUploader()

// Limpieza automática cada 15 minutos
setInterval(() => {
    uploader.cleanup()
}, 15 * 60 * 1000)

export default uploader
