import { betterAuth, type BetterAuthOptions } from "better-auth";
import { MongoClient, type Db } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

// Lazy MongoDB connection - only connects when actually needed (not at build time)
let mongoClient: MongoClient | null = null;
let db: Db | null = null;
let authInstance: ReturnType<typeof betterAuth> | null = null;

function getMongoClient(): MongoClient {
  if (!mongoClient) {
    const uri = process.env.DATABASE_URI;
    if (!uri) {
      throw new Error("DATABASE_URI environment variable is not set");
    }
    mongoClient = new MongoClient(uri);
  }
  return mongoClient;
}

function getDb(): Db {
  if (!db) {
    db = getMongoClient().db("sodax-cms");
  }
  return db;
}

function getAuthConfig(): BetterAuthOptions {
  return {
    database: mongodbAdapter(getDb(), {
      client: getMongoClient(),
    }),
    emailAndPassword: {
      enabled: false, // Disable email/password, only allow Google OAuth
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || "",
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60, // 5 minutes
      },
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: false,
        },
        permissions: {
          type: "string", // JSON string of permissions array
          required: false,
        },
      },
    },
    advanced: {
      useSecureCookies: process.env.NODE_ENV === "production",
    },
  };
}

// Lazy auth initialization
function getAuth() {
  if (!authInstance) {
    authInstance = betterAuth(getAuthConfig());
  }
  return authInstance;
}

// Export a proxy object that lazily initializes auth
export const auth = new Proxy({} as ReturnType<typeof betterAuth>, {
  get(_, prop) {
    return getAuth()[prop as keyof ReturnType<typeof betterAuth>];
  },
});

// Export lazy getters for MongoDB client and db for CMS operations
export { getMongoClient, getDb };
