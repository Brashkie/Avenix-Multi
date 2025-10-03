/**
 * ╔═══════════════════════════════════════════════════╗
 * ║    AVENIX-MULTI - Dynamic Import Loader          ║
 * ║    Carga dinámica de módulos con cache-busting   ║
 * ╚═══════════════════════════════════════════════════╝
 */

import Helper from './helper.js'

/**
 * Carga dinámicamente un módulo ESM evitando cache
 * @template T
 * @param {string} modulePath - Ruta al módulo a cargar
 * @returns {Promise<T>} Módulo cargado
 * @throws {TypeError} Si modulePath no es string
 * @throws {Error} Si falla la carga del módulo
 */
export default async function dynamicImport(modulePath) {
  if (typeof modulePath !== 'string') {
    throw new TypeError('La ruta del módulo debe ser una cadena de texto')
  }

  try {
    // Convertir a ruta absoluta usando Helper
    const absolutePath = Helper.__filename(modulePath)
    
    // Timestamp único para evitar cache del navegador/Node
    const cacheBreaker = Date.now()
    
    // Import dinámico con query string para cache-busting
    const loadedModule = await import(`${absolutePath}?timestamp=${cacheBreaker}`)
    
    // Retornar export default si existe, sino el módulo completo
    return loadedModule && 'default' in loadedModule 
      ? loadedModule.default 
      : loadedModule
      
  } catch (error) {
    console.error(`Error cargando módulo: ${modulePath}`)
    console.error(error)
    throw error
  }
}

/**
 * Alias para compatibilidad
 */
export { dynamicImport as importLoader }
