/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                            𒁈 AVENIX-MULTI V2.0.0 𒁈                         ┃
 * ┃                   LIB/FUNCTIONS.JS - FUNCIONES AUXILIARES                   ┃
 * ┃                          Creado por: Hepein Oficial                          ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { fileTypeFromBuffer } from 'file-type'
import paint from './paint.js'
import { createHash } from 'crypto'
import { randomHex, sha256Hex, uuid } from './crypto.js'
import moment from 'moment-timezone'
import { exec } from 'child_process'
import { promisify } from 'util'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const execAsync = promisify(exec)

// ═══════════════════════════════════════════════════════════════════════════════
// │                           FUNCIONES DE TIEMPO                               │
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Convierte milisegundos a formato legible
 */
export function msToTime(ms) {
    if (!ms || isNaN(ms)) return '0 segundos'
    
    const seconds = Math.floor((ms / 1000) % 60)
    const minutes = Math.floor((ms / (1000 * 60)) % 60)
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24)
    const days = Math.floor(ms / (1000 * 60 * 60 * 24))
    
    let result: any[] = []
    if (days > 0) result.push(`${days} día${days > 1 ? 's' : ''}`)
    if (hours > 0) result.push(`${hours} hora${hours > 1 ? 's' : ''}`)
    if (minutes > 0) result.push(`${minutes} minuto${minutes > 1 ? 's' : ''}`)
    if (seconds > 0) result.push(`${seconds} segundo${seconds > 1 ? 's' : ''}`)
    
    return result.length > 0 ? result.join(', ') : '0 segundos'
}

/**
 * Obtiene la fecha y hora actual en zona horaria específica
 */
export function getCurrentTime(timezone = 'America/Lima') {
    return moment().tz(timezone).format('YYYY-MM-DD HH:mm:ss')
}

/**
 * Formato de tiempo para cooldowns
 */
export function formatCooldown(ms) {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Verificar si ha pasado el tiempo de cooldown
 */
export function checkCooldown(lastTime, cooldownMs) {
    const now = Date.now()
    const timePassed = now - (lastTime || 0)
    return {
        expired: timePassed >= cooldownMs,
        remaining: Math.max(0, cooldownMs - timePassed),
        remainingFormatted: formatCooldown(Math.max(0, cooldownMs - timePassed))
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                           FUNCIONES DE TEXTO                                │
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Capitalizar primera letra de cada palabra
 */
export function capitalize(text) {
    return text.replace(/\b\w/g, l => l.toUpperCase())
}

/**
 * Limpiar texto de caracteres especiales
 */
export function cleanText(text) {
    return text.replace(/[^\w\s]/gi, '').trim()
}

/**
 * Truncar texto con puntos suspensivos
 */
export function truncate(text, maxLength = 100) {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength - 3) + '...'
}

/**
 * Escapar caracteres especiales para Markdown
 */
export function escapeMarkdown(text) {
    return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&')
}

/**
 * Extraer menciones de un texto
 */
export function extractMentions(text) {
    const mentions = text.match(/@(\d{1,16})/g)
    return mentions ? mentions.map(m => m.replace('@', '') + '@s.whatsapp.net') : []
}

/**
 * Generar texto aleatorio
 */
export function randomString(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                           FUNCIONES DE ARCHIVOS                             │
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Verificar si un archivo existe
 */
export async function fileExists(filePath) {
    try {
        await fs.access(filePath)
        return true
    } catch {
        return false
    }
}

/**
 * Obtener información de un archivo
 */
export async function getFileInfo(buffer) {
    const fileType = await fileTypeFromBuffer(buffer)
    const size = buffer.length
    
    return {
        type: fileType?.mime || 'application/octet-stream',
        ext: fileType?.ext || 'bin',
        size: size,
        sizeFormatted: formatBytes(size)
    }
}

/**
 * Formatear bytes a formato legible
 */
export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Limpiar archivos temporales antiguos
 */
export async function cleanTempFiles(tempDir, maxAge = 3600000) { // 1 hora por defecto
    try {
        if (!await fileExists(tempDir)) return
        
        const files = await fs.readdir(tempDir)
        const now = Date.now()
        let cleaned = 0
        
        for (const file of files) {
            const filePath = path.join(tempDir, file)
            const stats = await fs.stat(filePath)
            
            if (now - stats.mtimeMs > maxAge) {
                await fs.unlink(filePath)
                cleaned++
            }
        }
        
        if (cleaned > 0) {
            console.log(paint.cyan(`𒁈 ${cleaned} archivos temporales limpiados`))
        }
        
        return cleaned
    } catch (error) {
        console.error(paint.red('Error limpiando archivos temporales:'), error)
        return 0
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                           FUNCIONES DE VALIDACIÓN                           │
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Validar URL
 */
export function isValidUrl(string) {
    try {
        new URL(string)
        return true
    } catch {
        return false
    }
}

/**
 * Validar número de teléfono
 */
export function isValidPhoneNumber(number) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    return phoneRegex.test(number.replace(/\s+/g, ''))
}

/**
 * Validar email
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

/**
 * Validar JID de WhatsApp
 */
export function isValidJid(jid) {
    const jidRegex = /^(\d{1,16}|[\w.-]+)@(s\.whatsapp\.net|g\.us|broadcast)$/
    return jidRegex.test(jid)
}

/**
 * Detectar si el texto es un comando
 */
export function isCommand(text, prefixes = ['#', '.', '/', '!', '?']) {
    if (!text || typeof text !== 'string') return false
    return prefixes.some(prefix => text.startsWith(prefix))
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                           FUNCIONES DE NÚMEROS                              │
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generar número aleatorio entre min y max
 */
export function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Formatear número con separadores de miles
 */
export function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * Redondear a decimales específicos
 */
export function roundTo(num, decimals = 2) {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

/**
 * Verificar si un valor es un número válido
 */
export function isValidNumber(value) {
    return !isNaN(value) && isFinite(value)
}

/**
 * Convertir string a número seguro
 */
export function safeNumber(value, defaultValue = 0) {
    const num = Number(value)
    return isValidNumber(num) ? num : defaultValue
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                           FUNCIONES DE ARRAYS                               │
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Obtener elemento aleatorio de un array
 */
export function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)]
}

/**
 * Mezclar array aleatoriamente
 */
export function shuffleArray(array) {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]]
    }
    return newArray
}

/**
 * Dividir array en chunks
 */
export function chunkArray(array, size) {
    const chunks: any[] = []
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size))
    }
    return chunks
}

/**
 * Eliminar duplicados de array
 */
export function uniqueArray(array) {
    return [...new Set(array)]
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                           FUNCIONES DE SEGURIDAD                            │
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generar hash MD5 (solo para compatibilidad con APIs externas; no es seguro)
 */
export function md5(text: string | Buffer) {
    return createHash('md5').update(text).digest('hex')
}

/**
 * Generar hash SHA256 (signalis-core)
 */
export function sha256(text: string | Buffer) {
    return sha256Hex(text)
}

/**
 * Generar UUID v4 (signalis-core)
 */
export function generateUUID() {
    return uuid()
}

/**
 * Generar token seguro (signalis-core)
 */
export function generateToken(length = 32) {
    return randomHex(length)
}

/**
 * Sanitizar entrada de usuario
 */
export function sanitizeInput(input) {
    if (typeof input !== 'string') return ''
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/[<>'"]/g, '')
        .trim()
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                           FUNCIONES DE SISTEMA                              │
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Obtener información del sistema
 */
export async function getSystemInfo() {
    const totalMem = process.memoryUsage()
    const cpuUsage = process.cpuUsage()
    
    return {
        uptime: process.uptime(),
        uptimeFormatted: msToTime(process.uptime() * 1000),
        memory: {
            rss: formatBytes(totalMem.rss),
            heapUsed: formatBytes(totalMem.heapUsed),
            heapTotal: formatBytes(totalMem.heapTotal),
            external: formatBytes(totalMem.external)
        },
        cpu: {
            user: cpuUsage.user,
            system: cpuUsage.system
        },
        version: process.version,
        platform: process.platform,
        arch: process.arch
    }
}

/**
 * Verificar disponibilidad de comando del sistema
 */
export async function commandExists(command) {
    try {
        await execAsync(`which ${command}`)
        return true
    } catch {
        return false
    }
}

/**
 * Ejecutar comando del sistema de forma segura
 */
export async function execSafe(command, timeout = 30000) {
    try {
        const { stdout, stderr } = await execAsync(command, { timeout })
        return { success: true as const, stdout, stderr }
    } catch (error) {
        return { success: false as const, error: error.message }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                           FUNCIONES DE RED                                  │
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Hacer petición HTTP con reintentos
 */
export async function fetchWithRetry(url: string | URL, options: Record<string, any> = {}, maxRetries = 3): Promise<Response> {
    const { timeout = 10000, ...fetchOptions } = options
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), timeout)
            
            const response = await fetch(url, {
                ...fetchOptions,
                signal: controller.signal
            })
            
            clearTimeout(timeoutId)
            
            if (response.ok) {
                return response
            }
            
            if (i === maxRetries - 1) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }
        } catch (error) {
            if (i === maxRetries - 1) {
                throw error
            }
            
            // Esperar antes del siguiente intento
            await new Promise<void>(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
        }
    }
    throw new Error(`No se pudo obtener ${url} tras ${maxRetries} intentos`)
}

/**
 * Descargar archivo de URL
 */
export async function downloadFile(url, maxSize = 50 * 1024 * 1024) {
    const response = await fetchWithRetry(url)
    
    const contentLength = response.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > maxSize) {
        throw new Error(`Archivo muy grande: ${formatBytes(parseInt(contentLength))}`)
    }
    
    const buffer = Buffer.from(await response.arrayBuffer())
    
    if (buffer.length > maxSize) {
        throw new Error(`Archivo muy grande: ${formatBytes(buffer.length)}`)
    }
    
    return buffer
}

/**
 * Verificar si una URL está activa
 */
export async function checkUrl(url, timeout = 5000) {
    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)
        
        const response = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        return {
            active: response.ok,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
        }
    } catch (error) {
        return {
            active: false,
            error: error.message
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                           FUNCIONES DE UTILIDAD                             │
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Crear delay/pausa
 */
export function sleep(ms) {
    return new Promise<void>(resolve => setTimeout(resolve, ms))
}

/**
 * Retry con backoff exponencial
 */
export async function retryWithBackoff(fn, maxAttempts = 3, baseDelay = 1000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn()
        } catch (error) {
            if (attempt === maxAttempts) {
                throw error
            }
            
            const delay = baseDelay * Math.pow(2, attempt - 1)
            await sleep(delay)
        }
    }
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout)
            func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
    }
}

/**
 * Throttle function
 */
export function throttle(func, limit) {
    let inThrottle
    return function(this: unknown, ...args: unknown[]) {
        if (!inThrottle) {
            func.apply(this, args)
            inThrottle = true
            setTimeout(() => inThrottle = false, limit)
        }
    }
}

/**
 * Escapar HTML
 */
export function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
}

/**
 * Generar mensaje de error formateado
 */
export function formatError(error, context = '') {
    const timestamp = getCurrentTime()
    return `[${timestamp}] ${context ? `[${context}] ` : ''}ERROR: ${error.message || error}`
}

/**
 * Verificar si el bot tiene permisos de administrador
 */
export function hasBotAdminPerms(participants, botJid) {
    const botParticipant = participants.find(p => p.id === botJid)
    return botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin')
}

/**
 * Verificar si el usuario es administrador
 */
export function isAdmin(participants, userJid) {
    const userParticipant = participants.find(p => p.id === userJid)
    return userParticipant && (userParticipant.admin === 'admin' || userParticipant.admin === 'superadmin')
}

/**
 * Obtener lista de administradores
 */
export function getAdmins(participants) {
    return participants
        .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
        .map(p => p.id)
}

export default {
    // Tiempo
    msToTime,
    getCurrentTime,
    formatCooldown,
    checkCooldown,
    
    // Texto
    capitalize,
    cleanText,
    truncate,
    escapeMarkdown,
    extractMentions,
    randomString,
    
    // Archivos
    fileExists,
    getFileInfo,
    formatBytes,
    cleanTempFiles,
    
    // Validación
    isValidUrl,
    isValidPhoneNumber,
    isValidEmail,
    isValidJid,
    isCommand,
    
    // Números
    randomNumber,
    formatNumber,
    roundTo,
    isValidNumber,
    safeNumber,
    
    // Arrays
    randomChoice,
    shuffleArray,
    chunkArray,
    uniqueArray,
    
    // Seguridad
    md5,
    sha256,
    generateUUID,
    generateToken,
    sanitizeInput,
    
    // Sistema
    getSystemInfo,
    commandExists,
    execSafe,
    
    // Red
    fetchWithRetry,
    downloadFile,
    checkUrl,
    
    // Utilidad
    sleep,
    retryWithBackoff,
    debounce,
    throttle,
    escapeHtml,
    formatError,
    hasBotAdminPerms,
    isAdmin,
    getAdmins
}
