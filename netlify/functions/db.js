const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = 'tracking-app';

let client = null;
let database = null;
let useLocalFallback = false;

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

const seedData = {
  users: [
    { id: 'demo_user_001', username: 'Commander', email: 'commander@nexus.io', role: 'admin', level: 12, xp: 3450, streak: 23, total_focus_hours: 156.5, created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), last_active: new Date().toISOString() },
    { id: 'user_002', username: 'Shadow', email: 'shadow@nexus.io', role: 'user', level: 8, xp: 2100, streak: 15, total_focus_hours: 89.2, created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), last_active: new Date().toISOString() },
    { id: 'user_003', username: 'Phoenix', email: 'phoenix@nexus.io', role: 'user', level: 15, xp: 5200, streak: 45, total_focus_hours: 210.3, created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), last_active: new Date().toISOString() },
  ],
  habits: [
    { id: 'habit_001', user_id: 'demo_user_001', name: 'Morning Meditation', description: '15 min mindfulness', category: 'mindfulness', frequency: 'daily', status: 'active', streak: 23, created_at: new Date().toISOString() },
    { id: 'habit_002', user_id: 'demo_user_001', name: 'Read 30 Pages', description: 'Read 30 pages of a book', category: 'learning', frequency: 'daily', status: 'active', streak: 18, created_at: new Date().toISOString() },
  ],
  daily_logs: [],
  missions: [
    { id: 'mission_001', user_id: 'demo_user_001', title: 'Complete Project Alpha', description: 'Finish the main project', difficulty: 'epic', status: 'active', progress: 60, rewards: { xp: 1000, badges: ['project_complete'] }, created_at: new Date().toISOString() },
  ],
  analytics: [],
  focus_sessions: [],
  achievements: [
    { id: 'ach_001', user_id: 'demo_user_001', name: '7 Day Streak', description: 'Maintain a 7-day streak', unlocked_at: new Date().toISOString(), icon: '🔥' },
    { id: 'ach_002', user_id: 'demo_user_001', name: 'First Mission', description: 'Complete your first mission', unlocked_at: new Date().toISOString(), icon: '⭐' },
  ],
};

let localStore = {};

function initLocalStore() {
  localStore = {};
  for (const [key, data] of Object.entries(seedData)) {
    localStore[key] = data.map(item => ({ ...item }));
  }
}

initLocalStore();

async function getDb() {
  if (database) return database;
  if (useLocalFallback) throw new Error('Using local fallback');

  if (!MONGO_URI) {
    console.warn('MONGO_URI not set, switching to local fallback');
    useLocalFallback = true;
    throw new Error('Using local fallback');
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
    console.warn('Switching to local in-memory fallback');
    if (client) { try { await client.close(); } catch {} client = null; }
    useLocalFallback = true;
    throw new Error('Using local fallback');
  }
}

async function getCollection(name) {
  if (useLocalFallback) {
    if (!localStore[name]) {
      localStore[name] = [];
    }
    return createLocalCollection(name);
  }
  try {
    const db = await getDb();
    return db.collection(name.toLowerCase());
  } catch {
    useLocalFallback = true;
    if (!localStore[name]) {
      localStore[name] = [];
    }
    return createLocalCollection(name);
  }
}

function createLocalCollection(name) {
  return {
    find: () => ({
      toArray: async () => [...localStore[name]],
    }),
    findOne: async (query) => {
      const entries = localStore[name];
      const key = Object.keys(query)[0];
      return entries.find(e => e[key] === query[key]) || null;
    },
    insertOne: async (doc) => {
      localStore[name].push({ ...doc });
      return { insertedId: doc._id || doc.id };
    },
    insertMany: async (docs) => {
      localStore[name].push(...docs.map(d => ({ ...d })));
      return { insertedCount: docs.length };
    },
    deleteMany: async () => {
      localStore[name] = [];
      return { deletedCount: 0 };
    },
    deleteOne: async (query) => {
      const key = Object.keys(query)[0];
      const idx = localStore[name].findIndex(e => e[key] === query[key]);
      if (idx !== -1) localStore[name].splice(idx, 1);
      return { deletedCount: idx !== -1 ? 1 : 0 };
    },
    updateOne: async (query, update) => {
      const key = Object.keys(query)[0];
      const entry = localStore[name].find(e => e[key] === query[key]);
      if (entry && update.$set) {
        Object.assign(entry, update.$set);
      }
    },
    countDocuments: async () => localStore[name].length,
  };
}

async function readAll(sheetName) {
  const col = await getCollection(getCollectionName(sheetName));
  if (useLocalFallback) {
    return [...localStore[getCollectionName(sheetName)]];
  }
  const docs = await col.find({}).toArray();
  return docs.map(({ _id, ...rest }) => rest);
}

async function insertOne(sheetName, doc) {
  const col = await getCollection(getCollectionName(sheetName));
  return col.insertOne(doc);
}

async function replaceAll(sheetName, docs) {
  const col = await getCollection(getCollectionName(sheetName));
  await col.deleteMany({});
  if (docs.length > 0) {
    return col.insertMany(docs);
  }
  return { insertedCount: 0 };
}

async function updateByIndex(sheetName, index, data) {
  const col = await getCollection(getCollectionName(sheetName));
  const docs = await col.find({}).toArray();
  if (index < 0 || index >= docs.length) {
    throw new Error('Row index out of range');
  }
  if (useLocalFallback) {
    Object.assign(localStore[getCollectionName(sheetName)][index], data);
    return;
  }
  await col.updateOne({ _id: docs[index]._id }, { $set: data });
}

async function deleteByIndex(sheetName, index) {
  const col = await getCollection(getCollectionName(sheetName));
  const docs = await col.find({}).toArray();
  if (index < 0 || index >= docs.length) {
    throw new Error('Row index out of range');
  }
  if (useLocalFallback) {
    localStore[getCollectionName(sheetName)].splice(index, 1);
    return;
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
