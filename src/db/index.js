import Dexie from 'dexie'

const db = new Dexie('MapAlbum')

db.version(1).stores({
  cityRecords: 'cityId, visited, updatedAt',
})

db.version(2).stores({
  cityRecords: 'cityId, visited, updatedAt',
  routes: 'id, name, createdAt',
})

// v3: migrate visited → status, adjust index
db.version(3).stores({
  cityRecords: 'cityId, status, updatedAt',
  routes: 'id, name, createdAt',
}).upgrade(async (tx) => {
  await tx.table('cityRecords').toCollection().modify((r) => {
    if (r.visited && !r.status) r.status = 'visited'
  })
})

// v4: photos store for PhotoDropBox
db.version(4).stores({
  cityRecords: 'cityId, status, updatedAt',
  routes: 'id, name, createdAt',
  photos: 'id, cityId, dateTimeOriginal, createdAt',
})

export default db
