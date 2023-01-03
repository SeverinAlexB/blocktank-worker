import { Collection, Db } from "mongodb";

export interface IDatabaseModel {
    db: Db,
    LnChannelOrders: Collection,
    Inventory: Collection,
    BtcAddress: Collection,
    LightningPeers: Collection,
    LightningPeerGroups: Collection,
    LightningPeerLog: Collection,
    LightningFwdEvent: Collection,
}