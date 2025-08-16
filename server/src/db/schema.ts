import { serial, text, pgTable, timestamp, numeric, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const platformEnum = pgEnum('platform', ['instagram', 'youtube', 'tiktok', 'twitter', 'linkedin', 'facebook', 'other']);
export const campaignStatusEnum = pgEnum('campaign_status', ['draft', 'active', 'paused', 'completed', 'cancelled']);

// Influencers table
export const influencersTable = pgTable('influencers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  bio: text('bio'),
  portfolio_description: text('portfolio_description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Social media accounts table
export const socialMediaAccountsTable = pgTable('social_media_accounts', {
  id: serial('id').primaryKey(),
  influencer_id: integer('influencer_id').notNull().references(() => influencersTable.id, { onDelete: 'cascade' }),
  platform: platformEnum('platform').notNull(),
  username: text('username').notNull(),
  url: text('url').notNull(),
  follower_count: integer('follower_count'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Sponsors table
export const sponsorsTable = pgTable('sponsors', {
  id: serial('id').primaryKey(),
  company_name: text('company_name').notNull(),
  contact_email: text('contact_email').notNull().unique(),
  contact_phone: text('contact_phone'),
  industry: text('industry').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Products table
export const productsTable = pgTable('products', {
  id: serial('id').primaryKey(),
  sponsor_id: integer('sponsor_id').notNull().references(() => sponsorsTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  target_audience: text('target_audience'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Campaigns table
export const campaignsTable = pgTable('campaigns', {
  id: serial('id').primaryKey(),
  sponsor_id: integer('sponsor_id').notNull().references(() => sponsorsTable.id, { onDelete: 'cascade' }),
  product_id: integer('product_id').notNull().references(() => productsTable.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  budget: numeric('budget', { precision: 10, scale: 2 }).notNull(),
  target_audience: text('target_audience'),
  objectives: text('objectives'),
  status: campaignStatusEnum('status').notNull().default('draft'),
  start_date: timestamp('start_date'),
  end_date: timestamp('end_date'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Performance indicators table
export const performanceIndicatorsTable = pgTable('performance_indicators', {
  id: serial('id').primaryKey(),
  influencer_id: integer('influencer_id').notNull().references(() => influencersTable.id, { onDelete: 'cascade' }),
  platform: platformEnum('platform').notNull(),
  followers_count: integer('followers_count').notNull(),
  avg_views: integer('avg_views'),
  avg_engagement_rate: numeric('avg_engagement_rate', { precision: 5, scale: 2 }),
  total_posts: integer('total_posts'),
  last_updated: timestamp('last_updated').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const influencersRelations = relations(influencersTable, ({ many }) => ({
  socialMediaAccounts: many(socialMediaAccountsTable),
  performanceIndicators: many(performanceIndicatorsTable),
}));

export const socialMediaAccountsRelations = relations(socialMediaAccountsTable, ({ one }) => ({
  influencer: one(influencersTable, {
    fields: [socialMediaAccountsTable.influencer_id],
    references: [influencersTable.id],
  }),
}));

export const sponsorsRelations = relations(sponsorsTable, ({ many }) => ({
  products: many(productsTable),
  campaigns: many(campaignsTable),
}));

export const productsRelations = relations(productsTable, ({ one, many }) => ({
  sponsor: one(sponsorsTable, {
    fields: [productsTable.sponsor_id],
    references: [sponsorsTable.id],
  }),
  campaigns: many(campaignsTable),
}));

export const campaignsRelations = relations(campaignsTable, ({ one }) => ({
  sponsor: one(sponsorsTable, {
    fields: [campaignsTable.sponsor_id],
    references: [sponsorsTable.id],
  }),
  product: one(productsTable, {
    fields: [campaignsTable.product_id],
    references: [productsTable.id],
  }),
}));

export const performanceIndicatorsRelations = relations(performanceIndicatorsTable, ({ one }) => ({
  influencer: one(influencersTable, {
    fields: [performanceIndicatorsTable.influencer_id],
    references: [influencersTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Influencer = typeof influencersTable.$inferSelect;
export type NewInfluencer = typeof influencersTable.$inferInsert;

export type SocialMediaAccount = typeof socialMediaAccountsTable.$inferSelect;
export type NewSocialMediaAccount = typeof socialMediaAccountsTable.$inferInsert;

export type Sponsor = typeof sponsorsTable.$inferSelect;
export type NewSponsor = typeof sponsorsTable.$inferInsert;

export type Product = typeof productsTable.$inferSelect;
export type NewProduct = typeof productsTable.$inferInsert;

export type Campaign = typeof campaignsTable.$inferSelect;
export type NewCampaign = typeof campaignsTable.$inferInsert;

export type PerformanceIndicators = typeof performanceIndicatorsTable.$inferSelect;
export type NewPerformanceIndicators = typeof performanceIndicatorsTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  influencers: influencersTable,
  socialMediaAccounts: socialMediaAccountsTable,
  sponsors: sponsorsTable,
  products: productsTable,
  campaigns: campaignsTable,
  performanceIndicators: performanceIndicatorsTable,
};