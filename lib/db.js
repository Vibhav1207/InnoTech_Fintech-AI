import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

let mongoServer = null;

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, 
    };

    const connectToUri = async (uri) => {
        console.log(`Attempting to connect to MongoDB at ${uri}...`);
        return mongoose.connect(uri, opts).then((mongoose) => {
            console.log('MongoDB connected successfully.');
            return mongoose;
        });
    };

    if (MONGODB_URI) {
        cached.promise = connectToUri(MONGODB_URI).catch(async (err) => {
            console.warn('Failed to connect to primary MONGODB_URI:', err.message);
            console.log('Falling back to In-Memory MongoDB...');
            
            if (!mongoServer) {
                mongoServer = await MongoMemoryServer.create();
            }
            const uri = mongoServer.getUri();
            console.log(`In-Memory MongoDB started at ${uri}`);
            return connectToUri(uri);
        });
    } else {
        console.log('No MONGODB_URI provided. Starting In-Memory MongoDB...');
        cached.promise = (async () => {
             if (!mongoServer) {
                mongoServer = await MongoMemoryServer.create();
            }
            const uri = mongoServer.getUri();
            return connectToUri(uri);
        })();
    }
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('Final database connection failed:', e);
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
