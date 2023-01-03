// Deprecated?

// import { MongoClient, ObjectId } from 'mongodb';
// let _db: MongoClient = null

// function getDb (config, callback: any) {
//   const url = config.db_url
//   const dbName = 'Lighthouse'
//   MongoClient.connect(url || "mongodb://0.0.0.0:27017/", 
//   async function (err, client) {
//     if (err) throw err
//     const db = client.db(dbName)
//     _db = {
//       db,
//       LnChannelOrders: db.collection('LnChannelOrders'),
//       Inventory: db.collection('Inventory'),
//       BtcAddress: db.collection('BtcAddress'),
//       LightningPeers: db.collection('LightningPeers'),
//       LightningPeerGroups: db.collection('LightningPeerGroups'),
//       LightningPeerLog: db.collection('LightningPeerLog'),
//       LightningFwdEvent: db.collection('LightningFwdEvent'),
//       ObjectId
//     }
//     callback(null, _db)
//   })
// }

// module.exports = (config, callback: any) => {
//   return new Promise((resolve, reject) => {
//     if (_db) {
//       return callback ? callback(null, _db) : resolve(_db)
//     }
//     getDb(config, (err, db) => {
//       if (err) {
//         return callback ? callback(err) : reject(err)
//       }
//       callback ? callback(null, db) : resolve(db)
//     })
//   })
// }
