import Dexie from 'dexie'

const db = new Dexie('MapAlbum')

db.version(1).stores({
  cityRecords: 'cityId, visited, updatedAt',
})

db.version(2).stores({
  cityRecords: 'cityId, visited, updatedAt',
  routes: 'id, name, createdAt',
})

export default db
