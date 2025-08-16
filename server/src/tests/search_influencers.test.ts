import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { influencersTable, socialMediaAccountsTable, performanceIndicatorsTable } from '../db/schema';
import { type SearchInfluencersInput } from '../schema';
import { searchInfluencers } from '../handlers/search_influencers';

describe('searchInfluencers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestInfluencer = async (data: {
    name: string;
    email: string;
    bio?: string;
    portfolio_description?: string;
  }) => {
    const [influencer] = await db.insert(influencersTable)
      .values({
        name: data.name,
        email: data.email,
        bio: data.bio || null,
        portfolio_description: data.portfolio_description || null,
        phone: null
      })
      .returning()
      .execute();
    return influencer;
  };

  const createSocialMediaAccount = async (influencerId: number, platform: string, followerCount?: number) => {
    await db.insert(socialMediaAccountsTable)
      .values({
        influencer_id: influencerId,
        platform: platform as any,
        username: `test_${platform}_user`,
        url: `https://${platform}.com/test_user`,
        follower_count: followerCount || null
      })
      .execute();
  };

  const createPerformanceIndicators = async (influencerId: number, data: {
    platform: string;
    followers_count: number;
    avg_engagement_rate?: number;
    avg_views?: number;
    total_posts?: number;
  }) => {
    await db.insert(performanceIndicatorsTable)
      .values({
        influencer_id: influencerId,
        platform: data.platform as any,
        followers_count: data.followers_count,
        avg_engagement_rate: data.avg_engagement_rate?.toString() || null,
        avg_views: data.avg_views || null,
        total_posts: data.total_posts || null
      })
      .execute();
  };

  it('should return all influencers when no filters are applied', async () => {
    // Create test influencers
    const influencer1 = await createTestInfluencer({
      name: 'Tech Reviewer',
      email: 'tech@example.com',
      bio: 'Technology enthusiast and reviewer'
    });

    const influencer2 = await createTestInfluencer({
      name: 'Fashion Blogger',
      email: 'fashion@example.com',
      bio: 'Fashion and lifestyle content creator'
    });

    const input: SearchInfluencersInput = {
      limit: 50,
      offset: 0
    };

    const results = await searchInfluencers(input);

    expect(results).toHaveLength(2);
    expect(results.map(r => r.name)).toContain('Tech Reviewer');
    expect(results.map(r => r.name)).toContain('Fashion Blogger');
  });

  it('should filter by category in bio', async () => {
    const techInfluencer = await createTestInfluencer({
      name: 'Tech Reviewer',
      email: 'tech@example.com',
      bio: 'Technology enthusiast and reviewer'
    });

    const fashionInfluencer = await createTestInfluencer({
      name: 'Fashion Blogger',
      email: 'fashion@example.com',
      bio: 'Fashion and lifestyle content creator'
    });

    // Create required performance indicators and social media accounts for category search
    await createSocialMediaAccount(techInfluencer.id, 'youtube');
    await createPerformanceIndicators(techInfluencer.id, {
      platform: 'youtube',
      followers_count: 10000
    });

    await createSocialMediaAccount(fashionInfluencer.id, 'instagram');
    await createPerformanceIndicators(fashionInfluencer.id, {
      platform: 'instagram',
      followers_count: 15000
    });

    const input: SearchInfluencersInput = {
      category: 'technology',
      limit: 50,
      offset: 0
    };

    const results = await searchInfluencers(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Tech Reviewer');
    expect(results[0].bio).toContain('Technology');
  });

  it('should filter by category in portfolio description', async () => {
    const fitnessInfluencer = await createTestInfluencer({
      name: 'Fitness Coach',
      email: 'fitness@example.com',
      portfolio_description: 'Specialized in fitness and wellness content'
    });

    const foodInfluencer = await createTestInfluencer({
      name: 'Food Blogger',
      email: 'food@example.com',
      portfolio_description: 'Culinary adventures and recipes'
    });

    // Create required performance indicators and social media accounts
    await createSocialMediaAccount(fitnessInfluencer.id, 'instagram');
    await createPerformanceIndicators(fitnessInfluencer.id, {
      platform: 'instagram',
      followers_count: 20000
    });

    await createSocialMediaAccount(foodInfluencer.id, 'tiktok');
    await createPerformanceIndicators(foodInfluencer.id, {
      platform: 'tiktok',
      followers_count: 25000
    });

    const input: SearchInfluencersInput = {
      category: 'fitness',
      limit: 50,
      offset: 0
    };

    const results = await searchInfluencers(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Fitness Coach');
    expect(results[0].portfolio_description).toContain('fitness');
  });

  it('should filter by minimum follower count', async () => {
    const smallInfluencer = await createTestInfluencer({
      name: 'Small Creator',
      email: 'small@example.com'
    });

    const largeInfluencer = await createTestInfluencer({
      name: 'Large Creator',
      email: 'large@example.com'
    });

    // Create performance indicators
    await createPerformanceIndicators(smallInfluencer.id, {
      platform: 'instagram',
      followers_count: 5000
    });

    await createPerformanceIndicators(largeInfluencer.id, {
      platform: 'youtube',
      followers_count: 50000
    });

    const input: SearchInfluencersInput = {
      min_followers: 10000,
      limit: 50,
      offset: 0
    };

    const results = await searchInfluencers(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Large Creator');
  });

  it('should filter by maximum follower count', async () => {
    const smallInfluencer = await createTestInfluencer({
      name: 'Small Creator',
      email: 'small@example.com'
    });

    const largeInfluencer = await createTestInfluencer({
      name: 'Large Creator',
      email: 'large@example.com'
    });

    // Create performance indicators
    await createPerformanceIndicators(smallInfluencer.id, {
      platform: 'instagram',
      followers_count: 5000
    });

    await createPerformanceIndicators(largeInfluencer.id, {
      platform: 'youtube',
      followers_count: 50000
    });

    const input: SearchInfluencersInput = {
      max_followers: 10000,
      limit: 50,
      offset: 0
    };

    const results = await searchInfluencers(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Small Creator');
  });

  it('should filter by follower count range', async () => {
    const smallInfluencer = await createTestInfluencer({
      name: 'Small Creator',
      email: 'small@example.com'
    });

    const mediumInfluencer = await createTestInfluencer({
      name: 'Medium Creator',
      email: 'medium@example.com'
    });

    const largeInfluencer = await createTestInfluencer({
      name: 'Large Creator',
      email: 'large@example.com'
    });

    // Create performance indicators
    await createPerformanceIndicators(smallInfluencer.id, {
      platform: 'instagram',
      followers_count: 5000
    });

    await createPerformanceIndicators(mediumInfluencer.id, {
      platform: 'youtube',
      followers_count: 25000
    });

    await createPerformanceIndicators(largeInfluencer.id, {
      platform: 'tiktok',
      followers_count: 100000
    });

    const input: SearchInfluencersInput = {
      min_followers: 10000,
      max_followers: 50000,
      limit: 50,
      offset: 0
    };

    const results = await searchInfluencers(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Medium Creator');
  });

  it('should filter by platform presence', async () => {
    const youtubeInfluencer = await createTestInfluencer({
      name: 'YouTube Creator',
      email: 'youtube@example.com'
    });

    const instagramInfluencer = await createTestInfluencer({
      name: 'Instagram Creator',
      email: 'instagram@example.com'
    });

    // Create social media accounts
    await createSocialMediaAccount(youtubeInfluencer.id, 'youtube');
    await createSocialMediaAccount(instagramInfluencer.id, 'instagram');

    const input: SearchInfluencersInput = {
      platform: 'youtube',
      limit: 50,
      offset: 0
    };

    const results = await searchInfluencers(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('YouTube Creator');
  });

  it('should filter by minimum engagement rate', async () => {
    const lowEngagementInfluencer = await createTestInfluencer({
      name: 'Low Engagement',
      email: 'low@example.com'
    });

    const highEngagementInfluencer = await createTestInfluencer({
      name: 'High Engagement',
      email: 'high@example.com'
    });

    // Create performance indicators
    await createPerformanceIndicators(lowEngagementInfluencer.id, {
      platform: 'instagram',
      followers_count: 10000,
      avg_engagement_rate: 2.5
    });

    await createPerformanceIndicators(highEngagementInfluencer.id, {
      platform: 'youtube',
      followers_count: 15000,
      avg_engagement_rate: 8.5
    });

    const input: SearchInfluencersInput = {
      min_engagement_rate: 5.0,
      limit: 50,
      offset: 0
    };

    const results = await searchInfluencers(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('High Engagement');
  });

  it('should apply multiple filters together', async () => {
    const perfectMatch = await createTestInfluencer({
      name: 'Perfect Match',
      email: 'perfect@example.com',
      bio: 'Technology content creator'
    });

    const wrongCategory = await createTestInfluencer({
      name: 'Wrong Category',
      email: 'wrong1@example.com',
      bio: 'Fashion blogger'
    });

    const wrongPlatform = await createTestInfluencer({
      name: 'Wrong Platform',
      email: 'wrong2@example.com',
      bio: 'Technology enthusiast'
    });

    const wrongFollowers = await createTestInfluencer({
      name: 'Wrong Followers',
      email: 'wrong3@example.com',
      bio: 'Technology reviewer'
    });

    // Create social media accounts and performance indicators
    await createSocialMediaAccount(perfectMatch.id, 'youtube');
    await createPerformanceIndicators(perfectMatch.id, {
      platform: 'youtube',
      followers_count: 25000,
      avg_engagement_rate: 6.5
    });

    await createSocialMediaAccount(wrongCategory.id, 'youtube');
    await createPerformanceIndicators(wrongCategory.id, {
      platform: 'youtube',
      followers_count: 25000,
      avg_engagement_rate: 6.5
    });

    await createSocialMediaAccount(wrongPlatform.id, 'instagram');
    await createPerformanceIndicators(wrongPlatform.id, {
      platform: 'instagram',
      followers_count: 25000,
      avg_engagement_rate: 6.5
    });

    await createSocialMediaAccount(wrongFollowers.id, 'youtube');
    await createPerformanceIndicators(wrongFollowers.id, {
      platform: 'youtube',
      followers_count: 5000,
      avg_engagement_rate: 6.5
    });

    const input: SearchInfluencersInput = {
      category: 'technology',
      platform: 'youtube',
      min_followers: 10000,
      min_engagement_rate: 5.0,
      limit: 50,
      offset: 0
    };

    const results = await searchInfluencers(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Perfect Match');
  });

  it('should handle pagination correctly', async () => {
    // Create multiple influencers
    for (let i = 1; i <= 5; i++) {
      await createTestInfluencer({
        name: `Influencer ${i}`,
        email: `influencer${i}@example.com`
      });
    }

    // Test first page
    const firstPageInput: SearchInfluencersInput = {
      limit: 2,
      offset: 0
    };

    const firstPageResults = await searchInfluencers(firstPageInput);
    expect(firstPageResults).toHaveLength(2);

    // Test second page
    const secondPageInput: SearchInfluencersInput = {
      limit: 2,
      offset: 2
    };

    const secondPageResults = await searchInfluencers(secondPageInput);
    expect(secondPageResults).toHaveLength(2);

    // Verify different results
    const firstPageIds = firstPageResults.map(r => r.id);
    const secondPageIds = secondPageResults.map(r => r.id);
    
    expect(firstPageIds).not.toEqual(secondPageIds);
  });

  it('should return empty results when no matches found', async () => {
    const techInfluencer = await createTestInfluencer({
      name: 'Tech Reviewer',
      email: 'tech@example.com',
      bio: 'Technology enthusiast'
    });

    await createSocialMediaAccount(techInfluencer.id, 'youtube');
    await createPerformanceIndicators(techInfluencer.id, {
      platform: 'youtube',
      followers_count: 10000
    });

    const input: SearchInfluencersInput = {
      category: 'nonexistent category',
      limit: 50,
      offset: 0
    };

    const results = await searchInfluencers(input);

    expect(results).toHaveLength(0);
  });

  it('should handle case-insensitive category matching', async () => {
    const techInfluencer = await createTestInfluencer({
      name: 'Tech Reviewer',
      email: 'tech@example.com',
      bio: 'TECHNOLOGY enthusiast and reviewer'
    });

    await createSocialMediaAccount(techInfluencer.id, 'youtube');
    await createPerformanceIndicators(techInfluencer.id, {
      platform: 'youtube',
      followers_count: 10000
    });

    const input: SearchInfluencersInput = {
      category: 'technology',
      limit: 50,
      offset: 0
    };

    const results = await searchInfluencers(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Tech Reviewer');
  });
});