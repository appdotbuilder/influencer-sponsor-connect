import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { influencersTable } from '../db/schema';
import { type CreateInfluencerInput } from '../schema';
import { getInfluencers } from '../handlers/get_influencers';

// Test input data
const testInfluencer1: CreateInfluencerInput = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+1-555-0123',
  bio: 'Fashion and lifestyle influencer',
  portfolio_description: 'Specializing in fashion trends and lifestyle content'
};

const testInfluencer2: CreateInfluencerInput = {
  name: 'John Smith',
  email: 'john@example.com',
  phone: null,
  bio: null,
  portfolio_description: 'Tech reviewer and gaming content creator'
};

const testInfluencer3: CreateInfluencerInput = {
  name: 'Alice Johnson',
  email: 'alice@example.com',
  phone: '+1-555-0456',
  bio: 'Health and wellness advocate',
  portfolio_description: null
};

describe('getInfluencers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no influencers exist', async () => {
    const result = await getInfluencers();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return single influencer', async () => {
    // Create test data
    await db.insert(influencersTable)
      .values({
        name: testInfluencer1.name,
        email: testInfluencer1.email,
        phone: testInfluencer1.phone,
        bio: testInfluencer1.bio,
        portfolio_description: testInfluencer1.portfolio_description
      })
      .execute();

    const result = await getInfluencers();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Jane Doe');
    expect(result[0].email).toEqual('jane@example.com');
    expect(result[0].phone).toEqual('+1-555-0123');
    expect(result[0].bio).toEqual('Fashion and lifestyle influencer');
    expect(result[0].portfolio_description).toEqual('Specializing in fashion trends and lifestyle content');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return multiple influencers', async () => {
    // Create multiple test influencers
    await db.insert(influencersTable)
      .values([
        {
          name: testInfluencer1.name,
          email: testInfluencer1.email,
          phone: testInfluencer1.phone,
          bio: testInfluencer1.bio,
          portfolio_description: testInfluencer1.portfolio_description
        },
        {
          name: testInfluencer2.name,
          email: testInfluencer2.email,
          phone: testInfluencer2.phone,
          bio: testInfluencer2.bio,
          portfolio_description: testInfluencer2.portfolio_description
        },
        {
          name: testInfluencer3.name,
          email: testInfluencer3.email,
          phone: testInfluencer3.phone,
          bio: testInfluencer3.bio,
          portfolio_description: testInfluencer3.portfolio_description
        }
      ])
      .execute();

    const result = await getInfluencers();

    expect(result).toHaveLength(3);
    
    // Verify all influencers are returned
    const names = result.map(influencer => influencer.name);
    expect(names).toContain('Jane Doe');
    expect(names).toContain('John Smith');
    expect(names).toContain('Alice Johnson');

    // Verify each result has proper structure
    result.forEach(influencer => {
      expect(influencer.id).toBeDefined();
      expect(influencer.name).toBeDefined();
      expect(influencer.email).toBeDefined();
      expect(influencer.created_at).toBeInstanceOf(Date);
      expect(influencer.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should handle influencers with null fields correctly', async () => {
    // Create influencer with null optional fields
    await db.insert(influencersTable)
      .values({
        name: testInfluencer2.name,
        email: testInfluencer2.email,
        phone: testInfluencer2.phone,
        bio: testInfluencer2.bio,
        portfolio_description: testInfluencer2.portfolio_description
      })
      .execute();

    const result = await getInfluencers();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('John Smith');
    expect(result[0].email).toEqual('john@example.com');
    expect(result[0].phone).toBeNull();
    expect(result[0].bio).toBeNull();
    expect(result[0].portfolio_description).toEqual('Tech reviewer and gaming content creator');
  });

  it('should return influencers in database insertion order', async () => {
    // Insert in specific order
    const firstInfluencer = await db.insert(influencersTable)
      .values({
        name: 'First Influencer',
        email: 'first@example.com'
      })
      .returning()
      .execute();

    const secondInfluencer = await db.insert(influencersTable)
      .values({
        name: 'Second Influencer',
        email: 'second@example.com'
      })
      .returning()
      .execute();

    const result = await getInfluencers();

    expect(result).toHaveLength(2);
    // Results should maintain insertion order (by ID)
    expect(result[0].id).toBeLessThan(result[1].id);
    expect(result[0].name).toEqual('First Influencer');
    expect(result[1].name).toEqual('Second Influencer');
  });

  it('should verify data consistency with direct database query', async () => {
    // Create test data
    await db.insert(influencersTable)
      .values({
        name: testInfluencer1.name,
        email: testInfluencer1.email,
        phone: testInfluencer1.phone,
        bio: testInfluencer1.bio,
        portfolio_description: testInfluencer1.portfolio_description
      })
      .execute();

    const handlerResult = await getInfluencers();
    const directQuery = await db.select()
      .from(influencersTable)
      .execute();

    // Results should match exactly
    expect(handlerResult).toHaveLength(directQuery.length);
    expect(handlerResult[0].id).toEqual(directQuery[0].id);
    expect(handlerResult[0].name).toEqual(directQuery[0].name);
    expect(handlerResult[0].email).toEqual(directQuery[0].email);
    expect(handlerResult[0].created_at).toEqual(directQuery[0].created_at);
  });
});