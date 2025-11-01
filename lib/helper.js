/**
 * Helper Functions - Avenix-Multi
 * Utilidades globales y funciones auxiliares
 */
//helper.js
import yargs from 'yargs'
import os from 'os'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { createRequire } from 'module'
import fs from 'fs'
import { Readable } from 'stream'

/**
 * Obtiene la ruta del archivo actual
 * @param {ImportMeta | string} pathURL 
 * @param {boolean} rmPrefix
 * @returns {string}
 */
const getFilename = (pathURL = import.meta, rmPrefix = os.platform() !== 'win32') => {
    const filepath = typeof pathURL === 'string' ? pathURL : pathURL.url
    if (rmPrefix && filepath.startsWith('file:///')) {
        return fileURLToPath(filepath)
    }
    return filepath
}

/**
 * Obtiene el directorio del archivo actual
 * @param {ImportMeta | string} pathURL
 * @returns {string}
 */
const getDirname = (pathURL = import.meta) => {
    const directory = path.dirname(getFilename(pathURL, true))
    return directory.replace(/\/$/, '')
}

/**
 * Crea función require para módulos ESM
 * @param {ImportMeta | string} directory
 * @returns {NodeRequire}
 */
const getRequire = (directory = import.meta) => {
    const url = typeof directory === 'string' ? directory : directory.url
    return createRequire(url)
}

/**
 * Verifica si un archivo existe
 * @param {string} filepath
 * @returns {Promise<boolean>}
 */
const fileExists = async (filepath) => {
    try {
        await fs.promises.access(filepath, fs.constants.F_OK)
        return true
    } catch {
        return false
    }
}

/**
 * Verifica si un archivo existe (síncrono)
 * @param {string} filepath
 * @returns {boolean}
 */
const fileExistsSync = (filepath) => {
    try {
        fs.accessSync(filepath, fs.constants.F_OK)
        return true
    } catch {
        return false
    }
}

/**
 * Construye URL de API con parámetros y API key
 * @param {string} serviceName
 * @param {string} endpoint
 * @param {Object} params
 * @param {string} apiKeyParam
 * @returns {string}
 */
const buildAPIUrl = (serviceName, endpoint = '/', params = {}, apiKeyParam = null) => {
    const baseUrl = global.APIs?.[serviceName] || serviceName
    const queryParams = { ...params }
    
    if (apiKeyParam && global.APIKeys?.[serviceName]) {
        queryParams[apiKeyParam] = global.APIKeys[serviceName]
    }
    
    const queryString = Object.keys(queryParams).length > 0
        ? '?' + new URLSearchParams(queryParams).toString()
        : ''
    
    return baseUrl + endpoint + queryString
}

/**
 * Parsea argumentos de línea de comandos
 */
const commandOptions = yargs(process.argv.slice(2)).exitProcess(false).parse()

/**
 * Regex para detectar prefijos de comandos
 */
const commandPrefix = new RegExp(
    '^[' + (commandOptions['prefix'] || '‎xzXZ/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.\\-')
        .replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&') + ']'
)

/**
 * Guarda un stream a un archivo
 * @param {Readable} readStream
 * @param {string} outputPath
 * @returns {Promise<void>}
 */
const saveStream = (readStream, outputPath) => {
    return new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(outputPath)
        
        readStream.pipe(writeStream)
        
        writeStream.once('finish', () => {
            writeStream.close()
            resolve()
        })
        
        writeStream.once('error', (error) => {
            writeStream.close()
            reject(error)
        })
        
        readStream.once('error', (error) => {
            writeStream.close()
            reject(error)
        })
    })
}

/**
 * Símbolos internos para verificación de streams
 */
const streamDestroyed = Symbol('streamDestroyed')
const streamReadable = Symbol('streamReadable')

/**
 * Verifica si es un stream legible de Node.js
 * @param {any} obj
 * @param {boolean} strict
 * @returns {boolean}
 */
const isReadableNodeStream = (obj, strict = false) => {
    if (!obj) return false
    
    const hasRequiredMethods = typeof obj.pipe === 'function' && typeof obj.on === 'function'
    
    if (!hasRequiredMethods) return false
    
    if (strict) {
        return typeof obj.pause === 'function' && typeof obj.resume === 'function'
    }
    
    return true
}

/**
 * Verifica si es un stream de Node.js (readable o writable)
 * @param {any} obj
 * @returns {boolean}
 */
const isNodeStream = (obj) => {
    if (!obj) return false
    
    return !!(
        obj._readableState ||
        obj._writableState ||
        (typeof obj.write === 'function' && typeof obj.on === 'function') ||
        (typeof obj.pipe === 'function' && typeof obj.on === 'function')
    )
}

/**
 * Verifica si un stream está destruido
 * @param {any} stream
 * @returns {boolean | null}
 */
const isStreamDestroyed = (stream) => {
    if (!isNodeStream(stream)) return null
    
    const state = stream._readableState || stream._writableState
    
    return !!(stream.destroyed || stream[streamDestroyed] || state?.destroyed)
}

/**
 * Verifica si un stream legible ha terminado
 * @param {any} stream
 * @param {boolean} strict
 * @returns {boolean | null}
 */
const isReadableFinished = (stream, strict = true) => {
    if (!isReadableNodeStream(stream)) return null
    
    const readState = stream._readableState
    
    if (readState?.errored) return false
    
    if (strict) {
        return !!readState?.endEmitted
    }
    
    return !!(readState?.endEmitted || (readState?.ended && readState?.length === 0))
}

/**
 * Verifica si es un stream legible activo
 * @param {any} stream
 * @returns {boolean | null}
 */
const isActiveReadableStream = (stream) => {
    if (!stream) return null
    
    // Verificar marca personalizada
    if (stream[streamReadable] != null) {
        return stream[streamReadable]
    }
    
    // Verificar propiedad readable
    if (typeof stream.readable !== 'boolean') return null
    
    // Si está destruido, no es legible
    if (isStreamDestroyed(stream)) return false
    
    // Verificar si es un stream de Node.js legible y activo
    return (
        (isReadableNodeStream(stream) && !!stream.readable && !isReadableFinished(stream, false)) ||
        stream instanceof fs.ReadStream ||
        stream instanceof Readable
    )
}

/**
 * Lee un archivo como buffer
 * @param {string} filepath
 * @returns {Promise<Buffer>}
 */
const readFileAsBuffer = async (filepath) => {
    return await fs.promises.readFile(filepath)
}

/**
 * Escribe datos en un archivo
 * @param {string} filepath
 * @param {string | Buffer} data
 * @returns {Promise<void>}
 */
const writeToFile = async (filepath, data) => {
    await fs.promises.writeFile(filepath, data)
}

/**
 * Crea un directorio si no existe
 * @param {string} directory
 * @returns {Promise<void>}
 */
const ensureDirectory = async (directory) => {
    if (!await fileExists(directory)) {
        await fs.promises.mkdir(directory, { recursive: true })
    }
}

/**
 * Elimina un archivo si existe
 * @param {string} filepath
 * @returns {Promise<boolean>}
 */
const removeFile = async (filepath) => {
    try {
        if (await fileExists(filepath)) {
            await fs.promises.unlink(filepath)
            return true
        }
        return false
    } catch {
        return false
    }
}

/**
 * Formatea tiempo en milisegundos a string legible
 * @param {number} ms
 * @returns {string}
 */
const formatDuration = (ms) => {
    if (isNaN(ms)) return '--:--:--'
    
    const seconds = Math.floor((ms / 1000) % 60)
    const minutes = Math.floor((ms / (1000 * 60)) % 60)
    const hours = Math.floor(ms / (1000 * 60 * 60))
    
    return [hours, minutes, seconds]
        .map(v => v.toString().padStart(2, '0'))
        .join(':')
}

/**
 * Formatea bytes a tamaño legible
 * @param {number} bytes
 * @returns {string}
 */
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    
    const units = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const index = Math.floor(Math.log(bytes) / Math.log(1024))
    const size = (bytes / Math.pow(1024, index)).toFixed(2)
    
    return `${size} ${units[index]}`
}

/**
 * Espera un tiempo determinado
 * @param {number} ms
 * @returns {Promise<void>}
 */
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Genera un ID único
 * @returns {string}
 */
const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export default {
    __filename: getFilename,
    __dirname: getDirname,
    __require: getRequire,
    fileExists,
    fileExistsSync,
    API: buildAPIUrl,
    saveStream,
    isReadableStream: isActiveReadableStream,
    isReadableNodeStream,
    isNodeStream,
    isStreamDestroyed,
    isReadableFinished,
    readFileAsBuffer,
    writeToFile,
    ensureDirectory,
    removeFile,
    formatDuration,
    formatFileSize,
    sleep,
    generateId,
    opts: commandOptions,
    prefix: commandPrefix
}

// También exportar individualmente para imports destructurados
export {
    getFilename as __filename,
    getDirname as __dirname,
    getRequire as __require,
    fileExists,
    fileExistsSync,
    buildAPIUrl as API,
    saveStream,
    isActiveReadableStream as isReadableStream,
    isReadableNodeStream,
    isNodeStream,
    isStreamDestroyed,
    isReadableFinished,
    readFileAsBuffer,
    writeToFile,
    ensureDirectory,
    removeFile,
    formatDuration,
    formatFileSize,
    sleep,
    generateId,
    commandOptions as opts,
    commandPrefix as prefix
}
