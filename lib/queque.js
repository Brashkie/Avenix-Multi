/**
 * ╔═══════════════════════════════════════════════════╗
 * ║    AVENIX-MULTI - Queue Manager                  ║
 * ║    Sistema de cola para procesamiento ordenado    ║
 * ╚═══════════════════════════════════════════════════╝
 */

import { EventEmitter } from 'events'

const validateNumber = (value) => typeof value === 'number' && !isNaN(value)
const sleep = (ms) => validateNumber(ms) ? new Promise(res => setTimeout(res, ms)) : Promise.resolve()

const QUEUE_DELAY_MS = 5000 // 5 segundos por defecto

/**
 * Clase para gestionar colas de procesamiento con delays
 */
export default class MessageQueue extends EventEmitter {
  _items = new Set()
  _delayMs = QUEUE_DELAY_MS
  _processing = false

  constructor(delayMs = QUEUE_DELAY_MS) {
    super()
    if (validateNumber(delayMs)) {
      this._delayMs = delayMs
    }
  }

  /**
   * Agrega un item a la cola
   */
  enqueue(item) {
    this._items.add(item)
    return this
  }

  /**
   * Verifica si un item está en la cola
   */
  contains(item) {
    return this._items.has(item)
  }

  /**
   * Elimina un item de la cola
   */
  remove(item) {
    return this._items.delete(item)
  }

  /**
   * Obtiene el primer item de la cola
   */
  peek() {
    return this._items.values().next().value
  }

  /**
   * Obtiene el último item de la cola
   */
  peekLast() {
    let lastItem
    for (const item of this._items) {
      lastItem = item
    }
    return lastItem
  }

  /**
   * Verifica si es el primer item
   */
  isHead(item) {
    return this.peek() === item
  }

  /**
   * Verifica si es el último item
   */
  isTail(item) {
    return this.peekLast() === item
  }

  /**
   * Obtiene la posición de un item en la cola
   */
  position(item) {
    return [...this._items].indexOf(item)
  }

  /**
   * Obtiene el tamaño de la cola
   */
  length() {
    return this._items.size
  }

  /**
   * Verifica si la cola está vacía
   */
  empty() {
    return this.length() === 0
  }

  /**
   * Limpia toda la cola
   */
  clear() {
    this._items.clear()
    return this
  }

  /**
   * Procesa el siguiente item en la cola
   */
  dequeue(item) {
    const target = item ?? this.peek()
    if (!target) return false

    if (!this.isHead(target)) {
      throw new Error('Cannot dequeue: item is not at the head of queue')
    }

    this.remove(target)
    this.emit(target)
    return true
  }

  /**
   * Espera el turno en la cola
   * @param {*} item - Item a esperar
   * @returns {Promise<void>}
   */
  async wait(item) {
    if (!this.contains(item)) {
      throw new Error('Item not found in queue')
    }

    return new Promise((resolve, reject) => {
      const processNext = async (shouldRemove = false) => {
        try {
          await sleep(this._delayMs)
          
          if (shouldRemove) {
            this.dequeue(item)
          }
          
          if (!this.empty()) {
            this.dequeue()
          }
          
          resolve()
        } catch (error) {
          reject(error)
        }
      }

      if (this.isHead(item)) {
        processNext(true)
      } else {
        this.once(item, processNext)
      }
    })
  }

  /**
   * Procesa toda la cola de forma secuencial
   */
  async processAll(handler) {
    if (this._processing) {
      throw new Error('Queue is already being processed')
    }

    this._processing = true

    try {
      while (!this.empty()) {
        const item = this.peek()
        
        if (handler && typeof handler === 'function') {
          await handler(item)
        }
        
        await sleep(this._delayMs)
        this.dequeue()
      }
    } finally {
      this._processing = false
    }
  }

  /**
   * Obtiene todos los items como array
   */
  toArray() {
    return [...this._items]
  }

  /**
   * Verifica si la cola está siendo procesada
   */
  isProcessing() {
    return this._processing
  }

  /**
   * Cambia el delay de la cola
   */
  setDelay(ms) {
    if (validateNumber(ms)) {
      this._delayMs = ms
    }
    return this
  }

  /**
   * Obtiene el delay actual
   */
  getDelay() {
    return this._delayMs
  }

  /**
   * Obtiene estadísticas de la cola
   */
  stats() {
    return {
      size: this.length(),
      isEmpty: this.empty(),
      isProcessing: this.isProcessing(),
      delay: this._delayMs,
      head: this.peek(),
      tail: this.peekLast()
    }
  }
}

/**
 * Exportar funciones auxiliares
 */
export { validateNumber, sleep }
