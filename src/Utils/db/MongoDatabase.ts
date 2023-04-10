import { MongoClient } from 'mongodb';
import { IDatabaseModel } from './DatabaseModel';


export class MongoDatabase {
  private static model: IDatabaseModel;
  private static client: MongoClient;
  private static dbName = 'Lighthouse';

  public static async connect(url: string) {
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

  public static async close() {
    if (this.client){
      await this.client.close();
    }

  }
}
