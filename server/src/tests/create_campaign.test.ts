import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { campaignsTable, sponsorsTable, productsTable } from '../db/schema';
import { type CreateCampaignInput } from '../schema';
import { createCampaign } from '../handlers/create_campaign';
import { eq } from 'drizzle-orm';

describe('createCampaign', () => {
  let testSponsorId: number;
  let testProductId: number;

  beforeEach(async () => {
    await createDB();

    // Create test sponsor
    const sponsor = await db.insert(sponsorsTable)
      .values({
        company_name: 'Test Company',
        contact_email: 'test@company.com',
        industry: 'Technology',
        contact_phone: '+1234567890',
        description: 'A test company'
      })
      .returning()
      .execute();
    testSponsorId = sponsor[0].id;

    // Create test product
    const product = await db.insert(productsTable)
      .values({
        sponsor_id: testSponsorId,
        name: 'Test Product',
        description: 'A test product',
        category: 'Software',
        target_audience: 'Developers'
      })
      .returning()
      .execute();
    testProductId = product[0].id;
  });

  afterEach(resetDB);

  const baseTestInput: CreateCampaignInput = {
    sponsor_id: 0, // Will be set in tests
    product_id: 0, // Will be set in tests
    title: 'Test Campaign',
    description: 'A campaign for testing',
    budget: 5000.00,
    target_audience: 'Tech influencers',
    objectives: 'Increase brand awareness',
    status: 'draft' as const,
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-12-31')
  };

  it('should create a campaign with all fields', async () => {
    const testInput = {
      ...baseTestInput,
      sponsor_id: testSponsorId,
      product_id: testProductId
    };

    const result = await createCampaign(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Campaign');
    expect(result.description).toEqual('A campaign for testing');
    expect(result.budget).toEqual(5000.00);
    expect(typeof result.budget).toBe('number');
    expect(result.target_audience).toEqual('Tech influencers');
    expect(result.objectives).toEqual('Increase brand awareness');
    expect(result.status).toEqual('draft');
    expect(result.sponsor_id).toEqual(testSponsorId);
    expect(result.product_id).toEqual(testProductId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.start_date).toBeInstanceOf(Date);
    expect(result.end_date).toBeInstanceOf(Date);
  });

  it('should create a campaign with minimal required fields', async () => {
    const minimalInput = {
      sponsor_id: testSponsorId,
      product_id: testProductId,
      title: 'Minimal Campaign',
      budget: 1000.50
    } as CreateCampaignInput;

    const result = await createCampaign(minimalInput);

    expect(result.title).toEqual('Minimal Campaign');
    expect(result.budget).toEqual(1000.50);
    expect(typeof result.budget).toBe('number');
    expect(result.description).toBeNull();
    expect(result.target_audience).toBeNull();
    expect(result.objectives).toBeNull();
    expect(result.status).toEqual('draft'); // Default status
    expect(result.start_date).toBeNull();
    expect(result.end_date).toBeNull();
    expect(result.sponsor_id).toEqual(testSponsorId);
    expect(result.product_id).toEqual(testProductId);
  });

  it('should save campaign to database', async () => {
    const testInput = {
      ...baseTestInput,
      sponsor_id: testSponsorId,
      product_id: testProductId
    };

    const result = await createCampaign(testInput);

    // Query database to verify campaign was saved
    const campaigns = await db.select()
      .from(campaignsTable)
      .where(eq(campaignsTable.id, result.id))
      .execute();

    expect(campaigns).toHaveLength(1);
    expect(campaigns[0].title).toEqual('Test Campaign');
    expect(campaigns[0].description).toEqual('A campaign for testing');
    expect(parseFloat(campaigns[0].budget)).toEqual(5000.00);
    expect(campaigns[0].sponsor_id).toEqual(testSponsorId);
    expect(campaigns[0].product_id).toEqual(testProductId);
    expect(campaigns[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different campaign statuses', async () => {
    const activeInput = {
      ...baseTestInput,
      sponsor_id: testSponsorId,
      product_id: testProductId,
      title: 'Active Campaign',
      status: 'active' as const
    };

    const result = await createCampaign(activeInput);

    expect(result.status).toEqual('active');
    expect(result.title).toEqual('Active Campaign');
  });

  it('should handle decimal budget values correctly', async () => {
    const testInput = {
      ...baseTestInput,
      sponsor_id: testSponsorId,
      product_id: testProductId,
      budget: 1234.56
    };

    const result = await createCampaign(testInput);

    expect(result.budget).toEqual(1234.56);
    expect(typeof result.budget).toBe('number');

    // Verify in database
    const campaign = await db.select()
      .from(campaignsTable)
      .where(eq(campaignsTable.id, result.id))
      .execute();

    expect(parseFloat(campaign[0].budget)).toEqual(1234.56);
  });

  it('should throw error when sponsor does not exist', async () => {
    const invalidInput = {
      ...baseTestInput,
      sponsor_id: 99999, // Non-existent sponsor
      product_id: testProductId
    };

    await expect(createCampaign(invalidInput))
      .rejects.toThrow(/sponsor with id 99999 not found/i);
  });

  it('should throw error when product does not exist', async () => {
    const invalidInput = {
      ...baseTestInput,
      sponsor_id: testSponsorId,
      product_id: 99999 // Non-existent product
    };

    await expect(createCampaign(invalidInput))
      .rejects.toThrow(/product with id 99999 not found/i);
  });

  it('should throw error when product does not belong to sponsor', async () => {
    // Create another sponsor and product
    const otherSponsor = await db.insert(sponsorsTable)
      .values({
        company_name: 'Other Company',
        contact_email: 'other@company.com',
        industry: 'Marketing'
      })
      .returning()
      .execute();

    const otherProduct = await db.insert(productsTable)
      .values({
        sponsor_id: otherSponsor[0].id,
        name: 'Other Product',
        category: 'Service'
      })
      .returning()
      .execute();

    const invalidInput = {
      ...baseTestInput,
      sponsor_id: testSponsorId, // Original sponsor
      product_id: otherProduct[0].id // Product from different sponsor
    };

    await expect(createCampaign(invalidInput))
      .rejects.toThrow(/product .* does not belong to sponsor/i);
  });

  it('should handle null date values', async () => {
    const testInput = {
      ...baseTestInput,
      sponsor_id: testSponsorId,
      product_id: testProductId,
      start_date: null,
      end_date: null
    };

    const result = await createCampaign(testInput);

    expect(result.start_date).toBeNull();
    expect(result.end_date).toBeNull();
  });
});