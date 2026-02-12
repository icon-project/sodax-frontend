// MongoDB database connection exports
// Re-exports the MongoDB client and database instance from auth.ts
// Use these for CMS CRUD operations (News, Articles, Glossary)
export { getMongoClient, getDb } from './auth';
