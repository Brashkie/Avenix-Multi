/**
 * ╔═══════════════════════════════════════════════════╗
 * ║    AVENIX-MULTI - MongoDB Database Handler       ║
 * ║    Adaptador para base de datos MongoDB          ║
 * ╚═══════════════════════════════════════════════════╝
 */

import mongoose from 'mongoose'

const connectionConfig = {
  useNewUrlParser: true,
  useUnifiedTopology: true
}

// ═══════════════════════════════════════════════════
// Clase MongoDB Simple - Single Document
// ═══════════════════════════════════════════════════
export class mongoDB {
  connectionUrl: any
  config: any
  storage: any
  document: any
  schema: any
  connection: Promise<boolean>

  constructor(connectionUrl, config = connectionConfig) {
    this.connectionUrl = connectionUrl
    this.config = config
    this.storage = {}
    this.document = null
    this.schema = null
    this.connection = this.initConnection()
  }

  async initConnection() {
    try {
      await mongoose.connect(this.connectionUrl, this.config)
      console.log('✓ MongoDB conectado (Simple)')
      return true
    } catch (error) {
      console.error('❌ Error conectando a MongoDB:', error)
      throw error
    }
  }

  async read() {
    await this.connection

    const dataSchema = new mongoose.Schema({
      data: {
        type: Object,
        required: true,
        default: {}
      }
    }, { timestamps: true })

    this.schema = mongoose.models['avenix_data'] || mongoose.model('avenix_data', dataSchema)
    this.document = await this.schema.findOne({})

    if (!this.document) {
      console.log('📝 Creando documento inicial en MongoDB')
      this.storage = {}
      this.document = await new this.schema({ data: this.storage }).save()
    } else {
      this.storage = this.document.data
    }

    return this.storage
  }

  async write(newData) {
    if (!newData) {
      throw new Error('Los datos no pueden estar vacíos')
    }

    if (!this.document) {
      console.log('📝 Creando nuevo documento')
      return await new this.schema({ data: newData }).save()
    }

    this.document.data = newData
    this.storage = newData
    await this.document.save()
    
    return this.document
  }
}

// ═══════════════════════════════════════════════════
// Clase MongoDB Avanzada - Multiple Collections
// ═══════════════════════════════════════════════════
export class mongoDBV2 {
  connectionUrl: any
  config: any
  collections: any
  storage: Record<string, any>
  indexDoc: any
  indexSchema: any
  connection: Promise<boolean>

  constructor(connectionUrl, config = connectionConfig) {
    this.connectionUrl = connectionUrl
    this.config = config
    this.collections = []
    this.storage = {}
    this.indexDoc = null
    this.indexSchema = null
    this.connection = this.initConnection()
  }

  async initConnection() {
    try {
      await mongoose.connect(this.connectionUrl, this.config)
      console.log('✓ MongoDB conectado (Avanzado)')
      return true
    } catch (error) {
      console.error('❌ Error conectando a MongoDB:', error)
      throw error
    }
  }

  async read() {
    await this.connection

    // Schema para índice de colecciones
    const indexSchema = new mongoose.Schema({
      data: [{
        name: { type: String, required: true }
      }]
    }, { timestamps: true })

    this.indexSchema = mongoose.models['avenix_collections'] || mongoose.model('avenix_collections', indexSchema)
    this.indexDoc = await this.indexSchema.findOne({})

    if (!this.indexDoc || !this.indexDoc.data) {
      console.log('📝 Inicializando índice de colecciones')
      await this.indexSchema.create({ data: [] })
      this.indexDoc = await this.indexSchema.findOne({})
    }

    const invalidCollections: any[] = []
    this.storage = {}

    // Leer cada colección registrada
    for (const { name } of this.indexDoc.data) {
      let collectionModel

      try {
        const collectionSchema = new mongoose.Schema({
          data: { type: Array, required: true }
        }, { timestamps: true })

        collectionModel = mongoose.models[name] || mongoose.model(name, collectionSchema)
      } catch (error) {
        console.error(`⚠️ Error cargando colección ${name}:`, error.message)
        invalidCollections.push(name)
        continue
      }

      this.collections.push({ name, model: collectionModel })
      const documents = await collectionModel.find({})
      this.storage[name] = Object.fromEntries(documents.map(doc => doc.data))
    }

    // Limpiar colecciones inválidas del índice
    if (invalidCollections.length > 0) {
      console.log(`🧹 Limpiando ${invalidCollections.length} colecciones inválidas`)
      this.indexDoc.data = this.indexDoc.data.filter(item => !invalidCollections.includes(item.name))
      await this.indexDoc.save()
    }

    return this.storage
  }

  async write(newData) {
    if (!this.indexDoc || !newData) {
      throw new Error('Índice no inicializado o datos vacíos')
    }

    const updatedIndex: any[] = []

    for (const collectionName of Object.keys(newData)) {
      let collectionObj = this.collections.find(item => item.name === collectionName)
      let collectionModel

      if (!collectionObj) {
        // Crear nueva colección
        const schema = new mongoose.Schema({
          data: { type: Array, required: true }
        }, { timestamps: true })

        collectionModel = mongoose.models[collectionName] || mongoose.model(collectionName, schema)
        this.collections.push({ name: collectionName, model: collectionModel })
      } else {
        // Usar colección existente y limpiar documentos antiguos
        collectionModel = collectionObj.model
        await collectionModel.deleteMany({}).catch(err => {
          console.error(`⚠️ Error limpiando colección ${collectionName}:`, err.message)
        })
      }

      // Preparar datos para inserción masiva
      const bulkInsertData = Object.entries(newData[collectionName] as Record<string, any>).map(([key, value]) => ({
        data: [key, value]
      }))

      if (bulkInsertData.length > 0) {
        await collectionModel.insertMany(bulkInsertData).catch(err => {
          console.error(`⚠️ Error insertando en ${collectionName}:`, err.message)
        })
      }

      updatedIndex.push({ name: collectionName })
    }

    // Actualizar índice de colecciones
    this.indexDoc.data = updatedIndex
    await this.indexDoc.save()

    console.log(`✓ ${updatedIndex.length} colecciones actualizadas en MongoDB`)
    return true
  }

  async deleteCollection(collectionName) {
    const collectionObj = this.collections.find(item => item.name === collectionName)
    
    if (collectionObj) {
      await collectionObj.model.deleteMany({})
      this.collections = this.collections.filter(item => item.name !== collectionName)
      this.indexDoc.data = this.indexDoc.data.filter(item => item.name !== collectionName)
      await this.indexDoc.save()
      delete this.storage[collectionName]
      
      console.log(`🗑️ Colección ${collectionName} eliminada`)
      return true
    }
    
    return false
  }
}

export default { mongoDB, mongoDBV2 }
