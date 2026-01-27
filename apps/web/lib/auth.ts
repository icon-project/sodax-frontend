import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

// MongoDB client for Better Auth and CMS operations
const mongoClient = new MongoClient(process.env.DATABASE_URI || "");
const db = mongoClient.db("sodax-cms");

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    client: mongoClient, // Enables database transactions
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
        defaultValue: "user",
      },
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
});

// Export MongoDB client and db for CMS operations
export { mongoClient, db };
