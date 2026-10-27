/**
 * ╔═══════════════════════════════════════════════════╗
 * ║    AVENIX-MULTI - Log Capture System             ║
 * ║    Sistema de captura de salida de consola       ║
 * ╚═══════════════════════════════════════════════════╝
 */

let logBuffer: any[] = []
let errorBuffer: any[] = []
let isCapturing = false
let originalStdoutWrite: any = null
let originalStderrWrite: any = null

/**
 * Configuración del sistema de logs
 */
const logConfig = {
  maxBufferSize: 200,
  maxErrorSize: 100,
  timestampEnabled: true,
  colorStrip: true
}

/**
 * Remueve códigos ANSI de color del texto
 * @param {string} text - Texto con posibles códigos de color
 * @returns {string} Texto limpio
 */
function stripAnsiColors(text) {
  if (!logConfig.colorStrip) return text
  return text.replace(/\x1B\[\d+m/g, '')
}

/**
 * Crea una entrada de log con timestamp
 * @param {Buffer|string} data - Datos a registrar
 * @returns {Object} Entrada de log estructurada
 */
function createLogEntry(data) {
  const text = Buffer.isBuffer(data) ? data.toString('utf8') : String(data)
  
  return {
    timestamp: logConfig.timestampEnabled ? Date.now() : null,
    text: stripAnsiColors(text),
    raw: data,
    length: text.length
  }
}

/**
 * Activa la captura de logs de stdout y stderr
 * @param {Object} options - Opciones de configuración
 * @returns {Object} Controlador de captura
 */
export function enableLogCapture(options: Record<string, any> = {}) {
  if (isCapturing) {
    console.warn('⚠️ La captura de logs ya está activa')
    return { stop, isActive: () => isCapturing }
  }

  // Aplicar configuración personalizada
  Object.assign(logConfig, options)

  // Guardar referencias originales
  originalStdoutWrite = process.stdout.write.bind(process.stdout)
  originalStderrWrite = process.stderr.write.bind(process.stderr)

  // Interceptar stdout
  process.stdout.write = ((chunk: any, encoding?: any, callback?: any) => {
    const entry = createLogEntry(chunk)
    logBuffer.push(entry)
    
    // Mantener tamaño del buffer
    if (logBuffer.length > logConfig.maxBufferSize) {
      logBuffer.shift()
    }

    return originalStdoutWrite(chunk, encoding, callback)
  }) as typeof process.stdout.write

  // Interceptar stderr
  process.stderr.write = ((chunk: any, encoding?: any, callback?: any) => {
    const entry = createLogEntry(chunk)
    errorBuffer.push(entry)
    
    // Mantener tamaño del buffer
    if (errorBuffer.length > logConfig.maxErrorSize) {
      errorBuffer.shift()
    }

    return originalStderrWrite(chunk, encoding, callback)
  }) as typeof process.stderr.write

  isCapturing = true
  console.log('✅ Sistema de captura de logs activado')

  return {
    stop,
    isActive: () => isCapturing,
    clearLogs,
    getStats
  }
}

/**
 * Detiene la captura de logs
 */
export function stop() {
  if (!isCapturing) {
    console.warn('⚠️ La captura de logs no está activa')
    return false
  }

  if (originalStdoutWrite) {
    process.stdout.write = originalStdoutWrite
  }
  
  if (originalStderrWrite) {
    process.stderr.write = originalStderrWrite
  }

  isCapturing = false
  originalStdoutWrite = null
  originalStderrWrite = null
  
  console.log('🛑 Sistema de captura de logs detenido')
  return true
}

/**
 * Retorna todos los logs capturados como Buffer
 * @returns {Buffer}
 */
export function getAllLogs() {
  const buffers = logBuffer.map(entry => 
    Buffer.isBuffer(entry.raw) ? entry.raw : Buffer.from(entry.text, 'utf8')
  )
  
  return Buffer.concat(buffers)
}

/**
 * Retorna logs como texto plano
 * @param {number} lastN - Número de últimas entradas (opcional)
 * @returns {string}
 */
export function getLogsAsText(lastN) {
  const entries = lastN ? logBuffer.slice(-lastN) : logBuffer
  return entries.map(entry => entry.text).join('')
}

/**
 * Retorna logs estructurados con timestamp
 * @param {number} lastN - Número de últimas entradas (opcional)
 * @returns {Array<Object>}
 */
export function getStructuredLogs(lastN) {
  return lastN ? logBuffer.slice(-lastN) : [...logBuffer]
}

/**
 * Retorna todos los errores capturados
 * @returns {Buffer}
 */
export function getAllErrors() {
  const buffers = errorBuffer.map(entry => 
    Buffer.isBuffer(entry.raw) ? entry.raw : Buffer.from(entry.text, 'utf8')
  )
  
  return Buffer.concat(buffers)
}

/**
 * Retorna errores como texto
 * @param {number} lastN - Número de últimos errores
 * @returns {string}
 */
export function getErrorsAsText(lastN) {
  const entries = lastN ? errorBuffer.slice(-lastN) : errorBuffer
  return entries.map(entry => entry.text).join('')
}

/**
 * Limpia todos los logs capturados
 */
export function clearLogs() {
  const previousCount = logBuffer.length
  logBuffer = []
  console.log(`🧹 ${previousCount} entradas de log eliminadas`)
}

/**
 * Limpia todos los errores capturados
 */
export function clearErrors() {
  const previousCount = errorBuffer.length
  errorBuffer = []
  console.log(`🧹 ${previousCount} errores eliminados`)
}

/**
 * Limpia todo (logs y errores)
 */
export function clearAll() {
  clearLogs()
  clearErrors()
}

/**
 * Retorna estadísticas de captura
 * @returns {Object}
 */
export function getStats() {
  const totalLogSize = logBuffer.reduce((sum, entry) => sum + entry.length, 0)
  const totalErrorSize = errorBuffer.reduce((sum, entry) => sum + entry.length, 0)

  return {
    isCapturing,
    logs: {
      count: logBuffer.length,
      totalSize: totalLogSize,
      maxSize: logConfig.maxBufferSize,
      oldest: logBuffer[0]?.timestamp || null,
      newest: logBuffer[logBuffer.length - 1]?.timestamp || null
    },
    errors: {
      count: errorBuffer.length,
      totalSize: totalErrorSize,
      maxSize: logConfig.maxErrorSize,
      oldest: errorBuffer[0]?.timestamp || null,
      newest: errorBuffer[errorBuffer.length - 1]?.timestamp || null
    },
    config: { ...logConfig }
  }
}

/**
 * Busca en logs por palabra clave
 * @param {string} keyword - Palabra a buscar
 * @param {boolean} caseSensitive - Sensible a mayúsculas
 * @returns {Array<Object>}
 */
export function searchLogs(keyword, caseSensitive = false) {
  const searchTerm = caseSensitive ? keyword : keyword.toLowerCase()
  
  return logBuffer.filter(entry => {
    const text = caseSensitive ? entry.text : entry.text.toLowerCase()
    return text.includes(searchTerm)
  })
}

/**
 * Exporta logs a archivo (retorna contenido para escribir)
 * @param {Object} options - Opciones de exportación
 * @returns {string}
 */
export function exportLogs(options: Record<string, any> = {}) {
  const {
    includeTimestamps = true,
    includeErrors = true,
    format = 'text'
  } = options

  let output = `═══════════════════════════════════════════════════\n`
  output += `  AVENIX-MULTI - Exportación de Logs\n`
  output += `  Fecha: ${new Date().toISOString()}\n`
  output += `═══════════════════════════════════════════════════\n\n`

  output += `--- LOGS DE SALIDA (${logBuffer.length}) ---\n\n`
  
  logBuffer.forEach((entry, index) => {
    if (includeTimestamps && entry.timestamp) {
      const date = new Date(entry.timestamp)
      output += `[${date.toISOString()}] `
    }
    output += entry.text
    if (!entry.text.endsWith('\n')) output += '\n'
  })

  if (includeErrors && errorBuffer.length > 0) {
    output += `\n--- ERRORES (${errorBuffer.length}) ---\n\n`
    
    errorBuffer.forEach((entry, index) => {
      if (includeTimestamps && entry.timestamp) {
        const date = new Date(entry.timestamp)
        output += `[${date.toISOString()}] `
      }
      output += entry.text
      if (!entry.text.endsWith('\n')) output += '\n'
    })
  }

  return output
}

/**
 * Verifica si la captura está activa
 * @returns {boolean}
 */
export function isActive() {
  return isCapturing
}

// Export default para compatibilidad
export default {
  enable: enableLogCapture,
  stop,
  getAllLogs,
  getLogsAsText,
  getStructuredLogs,
  getAllErrors,
  getErrorsAsText,
  clearLogs,
  clearErrors,
  clearAll,
  getStats,
  searchLogs,
  exportLogs,
  isActive
}
