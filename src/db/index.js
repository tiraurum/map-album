import Dexie from 'dexie'

const db = new Dexie('MapAlbum')

db.version(1).stores({
  cityRecords: 'cityId, visited, updatedAt',
})

export default db
