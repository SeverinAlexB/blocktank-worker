import { MongoClient } from 'mongodb';
import { BlocktankCallback } from '../callback';
import { IDatabaseModel } from './DatabaseModel';


export class MongoDatabase {
  private static _db: IDatabaseModel;
  private static dbName = 'Lighthouse';

  private static async connect(url: string) {
    const client = new MongoClient(url || "mongodb://0.0.0.0:27017/");
    await client.connect();
    const mongoClient = client.db(this.dbName)
    this._db = {
      db: mongoClient,
      LnChannelOrders: mongoClient.collection('LnChannelOrders'),
      Inventory: mongoClient.collection('Inventory'),
      BtcAddress: mongoClient.collection('BtcAddress'),
      LightningPeers: mongoClient.collection('LightningPeers'),
      LightningPeerGroups: mongoClient.collection('LightningPeerGroups'),
      LightningPeerLog: mongoClient.collection('LightningPeerLog'),
      LightningFwdEvent: mongoClient.collection('LightningFwdEvent'),

    }
    return this._db;
  }

  // Wrapper to make it compatible with async + callbacks
  public static getDb(mongoUrl: string, callback?: BlocktankCallback): Promise<IDatabaseModel> {
    const promise = this.connect(mongoUrl);
    if (callback) {
      promise.then(data => {
        callback(null, data);
      }, err => {
        callback(err, null);
      })
    }
    return promise;
  }
}
