CREATE TYPE "public"."message_status" AS ENUM('streaming', 'complete', 'aborted', 'error');--> statement-breakpoint
CREATE TABLE "liquachat_account" (
	"id" uuid PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"password" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "liquachat_chat_tree" (
	"id" uuid PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"data" json
);
--> statement-breakpoint
CREATE TABLE "liquachat_chat" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"public" boolean NOT NULL,
	"userId" uuid NOT NULL,
	"customInstructions" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "liquachat_jwks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"publicKey" text NOT NULL,
	"privateKey" text NOT NULL,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "liquachat_message" (
	"id" uuid PRIMARY KEY NOT NULL,
	"chatId" uuid NOT NULL,
	"userId" uuid,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"status" "message_status" NOT NULL,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "liquachat_session" (
	"id" uuid PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"token" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "liquachat_session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "liquachat_user" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean NOT NULL,
	"image" text,
	"isAnonymous" boolean,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "liquachat_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "liquachat_verification" (
	"id" uuid PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp,
	"updatedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "liquachat_account" ADD CONSTRAINT "liquachat_account_userId_liquachat_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."liquachat_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liquachat_chat_tree" ADD CONSTRAINT "liquachat_chat_tree_userId_liquachat_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."liquachat_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liquachat_chat" ADD CONSTRAINT "liquachat_chat_userId_liquachat_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."liquachat_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liquachat_message" ADD CONSTRAINT "liquachat_message_chatId_liquachat_chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."liquachat_chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liquachat_message" ADD CONSTRAINT "liquachat_message_userId_liquachat_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."liquachat_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liquachat_session" ADD CONSTRAINT "liquachat_session_userId_liquachat_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."liquachat_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_user_id_idx" ON "liquachat_chat" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "message_chat_id_idx" ON "liquachat_message" USING btree ("chatId");--> statement-breakpoint
CREATE INDEX "message_user_id_idx" ON "liquachat_message" USING btree ("userId");