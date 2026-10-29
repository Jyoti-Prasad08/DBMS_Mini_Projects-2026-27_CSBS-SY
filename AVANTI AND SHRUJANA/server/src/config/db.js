/**
 * Database Connection Configuration
 * -------------------------------------------------------------
 * File: src/config/db.js
 * Purpose: Connects the Node.js / Express backend to the MongoDB database
 *          using the Mongoose ODM library.
 * Architecture Role: Foundation layer for persistence across all 7 collections
 *                    and their ER relationships.
 * Operations:
 *   - connectDB(): Establishes connection to MongoDB and handles connection events.
 */

import mongoose from 'mongoose';

/**
 * connectDB
 * Connects to MongoDB using the MONGO_URI specified in the environment variables.
 * Falls back to default local MongoDB instance if not provided.
 */
export const connectDB = async () => {
  try {
    // Read connection string from environment or use standard local default
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/cinemadb';

    // Connect via Mongoose with standard modern driver options
    const conn = await mongoose.connect(uri);

    console.log(`[MongoDB] Successfully connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[MongoDB Connection Error] ${error.message}`);
    // Terminate server process on fatal DB connection failure
    process.exit(1);
  }
};
