import { createTable } from "./create-table";

export const users = createTable("user", (d) => ({
  id: d.uuid().primaryKey(),
  name: d.text().notNull(),
  email: d.text().notNull().unique(),
  emailVerified: d
    .boolean()
    .$defaultFn(() => false)
    .notNull(),
  image: d.text(),
  isAnonymous: d.boolean(),
  createdAt: d
    .timestamp()
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: d
    .timestamp()
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
}));

export const sessions = createTable("session", (d) => ({
  id: d.uuid().primaryKey(),
  userId: d
    .uuid()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: d.text().notNull().unique(),
  expiresAt: d.timestamp().notNull(),
  ipAddress: d.text(),
  userAgent: d.text(),
  createdAt: d.timestamp().notNull(),
  updatedAt: d.timestamp().notNull(),
}));

export const accounts = createTable("account", (d) => ({
  id: d.uuid().primaryKey(),
  userId: d
    .uuid()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: d.text().notNull(), // The ID of the account as provided by the SSO or equal to userId for credential accounts
  providerId: d.text().notNull(),
  accessToken: d.text(),
  refreshToken: d.text(),
  idToken: d.text(),
  accessTokenExpiresAt: d.timestamp(),
  refreshTokenExpiresAt: d.timestamp(),
  scope: d.text(),
  password: d.text(),
  createdAt: d.timestamp().notNull(),
  updatedAt: d.timestamp().notNull(),
}));

export const verifications = createTable("verification", (d) => ({
  id: d.uuid().primaryKey(),
  identifier: d.text().notNull(),
  value: d.text().notNull(),
  expiresAt: d.timestamp().notNull(),
  createdAt: d.timestamp().$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedAt: d.timestamp().$defaultFn(() => /* @__PURE__ */ new Date()),
}));

export const jwkss = createTable("jwks", (d) => ({
  id: d.uuid().primaryKey(),
  publicKey: d.text().notNull(),
  privateKey: d.text().notNull(),
  createdAt: d.timestamp().notNull(),
}));
