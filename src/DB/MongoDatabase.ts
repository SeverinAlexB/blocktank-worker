import { MongoClient } from 'mongodb';
import { BlocktankCallback } from '../callback';
import { IDatabaseModel } from './DatabaseModel';


export class MongoDatabase {
  private static model: IDatabaseModel;
  private static client: MongoClient;
  private static dbName = 'Lighthouse';

  private static async connect(url: string) {
    if (this.model) {
      return this.model;
    }

    this.client = new MongoClient(url || "mongodb://0.0.0.0:27017/");
    await this.client.connect();
    const db = this.client.db(this.dbName)
    this.model = {
      db: db,
      LnChannelOrders: db.collection('LnChannelOrders'),
      Inventory: db.collection('Inventory'),
      BtcAddress: db.collection('BtcAddress'),
      LightningPeers: db.collection('LightningPeers'),
      LightningPeerGroups: db.collection('LightningPeerGroups'),
      LightningPeerLog: db.collection('LightningPeerLog'),
      LightningFwdEvent: db.collection('LightningFwdEvent'),

    }
    return this.model;
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

  public static async close() {
    if (this.client){
      await this.client.close();
    }

  }
}
