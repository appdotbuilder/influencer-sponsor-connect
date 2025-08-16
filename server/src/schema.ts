import { z } from 'zod';

// Influencer schema
export const influencerSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  bio: z.string().nullable(),
  portfolio_description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Influencer = z.infer<typeof influencerSchema>;

// Social media account schema
export const socialMediaAccountSchema = z.object({
  id: z.number(),
  influencer_id: z.number(),
  platform: z.enum(['instagram', 'youtube', 'tiktok', 'twitter', 'linkedin', 'facebook', 'other']),
  username: z.string(),
  url: z.string().url(),
  follower_count: z.number().int().nonnegative().nullable(),
  created_at: z.coerce.date()
});

export type SocialMediaAccount = z.infer<typeof socialMediaAccountSchema>;

// Sponsor schema
export const sponsorSchema = z.object({
  id: z.number(),
  company_name: z.string(),
  contact_email: z.string().email(),
  contact_phone: z.string().nullable(),
  industry: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Sponsor = z.infer<typeof sponsorSchema>;

// Product schema
export const productSchema = z.object({
  id: z.number(),
  sponsor_id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  category: z.string(),
  target_audience: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Product = z.infer<typeof productSchema>;

// Campaign schema
export const campaignSchema = z.object({
  id: z.number(),
  sponsor_id: z.number(),
  product_id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  budget: z.number().positive(),
  target_audience: z.string().nullable(),
  objectives: z.string().nullable(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']),
  start_date: z.coerce.date().nullable(),
  end_date: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Campaign = z.infer<typeof campaignSchema>;

// Performance indicators schema
export const performanceIndicatorsSchema = z.object({
  id: z.number(),
  influencer_id: z.number(),
  platform: z.enum(['instagram', 'youtube', 'tiktok', 'twitter', 'linkedin', 'facebook', 'other']),
  followers_count: z.number().int().nonnegative(),
  avg_views: z.number().int().nonnegative().nullable(),
  avg_engagement_rate: z.number().min(0).max(100).nullable(),
  total_posts: z.number().int().nonnegative().nullable(),
  last_updated: z.coerce.date(),
  created_at: z.coerce.date()
});

export type PerformanceIndicators = z.infer<typeof performanceIndicatorsSchema>;

// Input schemas for creating entities
export const createInfluencerInputSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  portfolio_description: z.string().nullable().optional()
});

export type CreateInfluencerInput = z.infer<typeof createInfluencerInputSchema>;

export const createSocialMediaAccountInputSchema = z.object({
  influencer_id: z.number(),
  platform: z.enum(['instagram', 'youtube', 'tiktok', 'twitter', 'linkedin', 'facebook', 'other']),
  username: z.string(),
  url: z.string().url(),
  follower_count: z.number().int().nonnegative().nullable().optional()
});

export type CreateSocialMediaAccountInput = z.infer<typeof createSocialMediaAccountInputSchema>;

export const createSponsorInputSchema = z.object({
  company_name: z.string(),
  contact_email: z.string().email(),
  contact_phone: z.string().nullable().optional(),
  industry: z.string(),
  description: z.string().nullable().optional()
});

export type CreateSponsorInput = z.infer<typeof createSponsorInputSchema>;

export const createProductInputSchema = z.object({
  sponsor_id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  category: z.string(),
  target_audience: z.string().nullable().optional()
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

export const createCampaignInputSchema = z.object({
  sponsor_id: z.number(),
  product_id: z.number(),
  title: z.string(),
  description: z.string().nullable().optional(),
  budget: z.number().positive(),
  target_audience: z.string().nullable().optional(),
  objectives: z.string().nullable().optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']).default('draft'),
  start_date: z.coerce.date().nullable().optional(),
  end_date: z.coerce.date().nullable().optional()
});

export type CreateCampaignInput = z.infer<typeof createCampaignInputSchema>;

export const createPerformanceIndicatorsInputSchema = z.object({
  influencer_id: z.number(),
  platform: z.enum(['instagram', 'youtube', 'tiktok', 'twitter', 'linkedin', 'facebook', 'other']),
  followers_count: z.number().int().nonnegative(),
  avg_views: z.number().int().nonnegative().nullable().optional(),
  avg_engagement_rate: z.number().min(0).max(100).nullable().optional(),
  total_posts: z.number().int().nonnegative().nullable().optional()
});

export type CreatePerformanceIndicatorsInput = z.infer<typeof createPerformanceIndicatorsInputSchema>;

// Update schemas
export const updateInfluencerInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  portfolio_description: z.string().nullable().optional()
});

export type UpdateInfluencerInput = z.infer<typeof updateInfluencerInputSchema>;

export const updateSponsorInputSchema = z.object({
  id: z.number(),
  company_name: z.string().optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().nullable().optional(),
  industry: z.string().optional(),
  description: z.string().nullable().optional()
});

export type UpdateSponsorInput = z.infer<typeof updateSponsorInputSchema>;

export const updateCampaignInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  budget: z.number().positive().optional(),
  target_audience: z.string().nullable().optional(),
  objectives: z.string().nullable().optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']).optional(),
  start_date: z.coerce.date().nullable().optional(),
  end_date: z.coerce.date().nullable().optional()
});

export type UpdateCampaignInput = z.infer<typeof updateCampaignInputSchema>;

// Search and filter schemas
export const searchInfluencersInputSchema = z.object({
  category: z.string().optional(),
  min_followers: z.number().int().nonnegative().optional(),
  max_followers: z.number().int().nonnegative().optional(),
  platform: z.enum(['instagram', 'youtube', 'tiktok', 'twitter', 'linkedin', 'facebook', 'other']).optional(),
  min_engagement_rate: z.number().min(0).max(100).optional(),
  limit: z.number().int().positive().default(50),
  offset: z.number().int().nonnegative().default(0)
});

export type SearchInfluencersInput = z.infer<typeof searchInfluencersInputSchema>;

export const searchCampaignsInputSchema = z.object({
  category: z.string().optional(),
  min_budget: z.number().positive().optional(),
  max_budget: z.number().positive().optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']).optional(),
  sponsor_id: z.number().optional(),
  limit: z.number().int().positive().default(50),
  offset: z.number().int().nonnegative().default(0)
});

export type SearchCampaignsInput = z.infer<typeof searchCampaignsInputSchema>;

// ID parameter schemas
export const idParamSchema = z.object({
  id: z.number()
});

export type IdParam = z.infer<typeof idParamSchema>;