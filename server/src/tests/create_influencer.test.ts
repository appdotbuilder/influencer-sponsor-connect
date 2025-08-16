import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { influencersTable } from '../db/schema';
import { type CreateInfluencerInput } from '../schema';
import { createInfluencer } from '../handlers/create_influencer';
import { eq } from 'drizzle-orm';

// Test input with all fields
const fullTestInput: CreateInfluencerInput = {
  name: 'Jane Smith',
  email: 'jane.smith@example.com',
  phone: '+1234567890',
  bio: 'Fashion and lifestyle influencer with a passion for sustainable brands.',
  portfolio_description: 'Specializing in fashion content with 500K+ engaged followers across platforms.'
};

// Minimal test input
const minimalTestInput: CreateInfluencerInput = {
  name: 'John Doe',
  email: 'john.doe@example.com'
};

describe('createInfluencer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an influencer with all fields', async () => {
    const result = await createInfluencer(fullTestInput);

    // Basic field validation
    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toEqual('jane.smith@example.com');
    expect(result.phone).toEqual('+1234567890');
    expect(result.bio).toEqual('Fashion and lifestyle influencer with a passion for sustainable brands.');
    expect(result.portfolio_description).toEqual('Specializing in fashion content with 500K+ engaged followers across platforms.');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create an influencer with minimal fields', async () => {
    const result = await createInfluencer(minimalTestInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.phone).toBeNull();
    expect(result.bio).toBeNull();
    expect(result.portfolio_description).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save influencer to database', async () => {
    const result = await createInfluencer(fullTestInput);

    // Query using proper drizzle syntax
    const influencers = await db.select()
      .from(influencersTable)
      .where(eq(influencersTable.id, result.id))
      .execute();

    expect(influencers).toHaveLength(1);
    const savedInfluencer = influencers[0];
    expect(savedInfluencer.name).toEqual('Jane Smith');
    expect(savedInfluencer.email).toEqual('jane.smith@example.com');
    expect(savedInfluencer.phone).toEqual('+1234567890');
    expect(savedInfluencer.bio).toEqual('Fashion and lifestyle influencer with a passion for sustainable brands.');
    expect(savedInfluencer.portfolio_description).toEqual('Specializing in fashion content with 500K+ engaged followers across platforms.');
    expect(savedInfluencer.created_at).toBeInstanceOf(Date);
    expect(savedInfluencer.updated_at).toBeInstanceOf(Date);
  });

  it('should handle null optional fields correctly', async () => {
    const inputWithNulls: CreateInfluencerInput = {
      name: 'Test User',
      email: 'test@example.com',
      phone: null,
      bio: null,
      portfolio_description: null
    };

    const result = await createInfluencer(inputWithNulls);

    expect(result.name).toEqual('Test User');
    expect(result.email).toEqual('test@example.com');
    expect(result.phone).toBeNull();
    expect(result.bio).toBeNull();
    expect(result.portfolio_description).toBeNull();

    // Verify in database
    const influencers = await db.select()
      .from(influencersTable)
      .where(eq(influencersTable.id, result.id))
      .execute();

    expect(influencers).toHaveLength(1);
    const savedInfluencer = influencers[0];
    expect(savedInfluencer.phone).toBeNull();
    expect(savedInfluencer.bio).toBeNull();
    expect(savedInfluencer.portfolio_description).toBeNull();
  });

  it('should enforce unique email constraint', async () => {
    // Create first influencer
    await createInfluencer(fullTestInput);

    // Try to create second influencer with same email
    const duplicateInput: CreateInfluencerInput = {
      name: 'Different Name',
      email: 'jane.smith@example.com' // Same email
    };

    await expect(createInfluencer(duplicateInput))
      .rejects
      .toThrow(/unique constraint|duplicate key/i);
  });

  it('should create multiple influencers with different emails', async () => {
    const firstInfluencer = await createInfluencer(fullTestInput);
    const secondInfluencer = await createInfluencer(minimalTestInput);

    expect(firstInfluencer.id).not.toEqual(secondInfluencer.id);
    expect(firstInfluencer.email).not.toEqual(secondInfluencer.email);

    // Verify both exist in database
    const allInfluencers = await db.select()
      .from(influencersTable)
      .execute();

    expect(allInfluencers).toHaveLength(2);
  });

  it('should set timestamps correctly', async () => {
    const beforeCreate = new Date();
    const result = await createInfluencer(fullTestInput);
    const afterCreate = new Date();

    // Check that timestamps are within expected range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());

    // In creation, created_at and updated_at should be very close
    const timeDiff = Math.abs(result.updated_at.getTime() - result.created_at.getTime());
    expect(timeDiff).toBeLessThan(1000); // Less than 1 second difference
  });
});