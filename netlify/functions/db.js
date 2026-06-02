const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = 'tracking-app';

let client = null;
let database = null;

async function getDb() {
  if (database) return database;
  if (!MONGO_URI) {
    throw new Error('MONGO_URI environment variable is not set');
  }
  try {
    client = new MongoClient(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      retryWrites: true,
      w: 'majority',
    });
    await client.connect();
    database = client.db(DB_NAME);
    return database;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    if (client) { try { await client.close(); } catch {} client = null; }
    throw error;
  }
}

async function getCollection(name) {
  const db = await getDb();
  return db.collection(name.toLowerCase());
}

const COLLECTION_MAP = {
  USERS: 'users',
  HABITS: 'habits',
  DAILY_LOGS: 'daily_logs',
  MISSIONS: 'missions',
  ANALYTICS: 'analytics',
  FOCUS_SESSIONS: 'focus_sessions',
  ACHIEVEMENTS: 'achievements',
};

function getCollectionName(sheetName) {
  return COLLECTION_MAP[sheetName] || sheetName.toLowerCase();
}

async function readAll(sheetName) {
  const col = await getCollection(getCollectionName(sheetName));
  const docs = await col.find({}).toArray();
  return docs.map(({ _id, ...rest }) => rest);
}

async function insertOne(sheetName, doc) {
  const col = await getCollection(getCollectionName(sheetName));
  const result = await col.insertOne(doc);
  return result;
}

async function replaceAll(sheetName, docs) {
  const col = await getCollection(getCollectionName(sheetName));
  await col.deleteMany({});
  if (docs.length > 0) {
    const result = await col.insertMany(docs);
    return result;
  }
  return { insertedCount: 0 };
}

async function updateByIndex(sheetName, index, data) {
  const col = await getCollection(getCollectionName(sheetName));
  const docs = await col.find({}).toArray();
  if (index < 0 || index >= docs.length) {
    throw new Error('Row index out of range');
  }
  await col.updateOne({ _id: docs[index]._id }, { $set: data });
}

async function deleteByIndex(sheetName, index) {
  const col = await getCollection(getCollectionName(sheetName));
  const docs = await col.find({}).toArray();
  if (index < 0 || index >= docs.length) {
    throw new Error('Row index out of range');
  }
  await col.deleteOne({ _id: docs[index]._id });
}

async function closeConnection() {
  if (client) {
    await client.close();
    client = null;
    database = null;
  }
}

module.exports = {
  getDb,
  getCollection,
  getCollectionName,
  readAll,
  insertOne,
  replaceAll,
  updateByIndex,
  deleteByIndex,
  closeConnection,
};
