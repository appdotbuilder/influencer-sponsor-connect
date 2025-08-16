import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { campaignsTable, productsTable, sponsorsTable } from '../db/schema';
import { type SearchCampaignsInput } from '../schema';
import { searchCampaigns } from '../handlers/search_campaigns';

describe('searchCampaigns', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test data
  const createTestData = async () => {
    // Create sponsors
    const sponsors = await db.insert(sponsorsTable)
      .values([
        {
          company_name: 'Tech Corp',
          contact_email: 'contact@techcorp.com',
          industry: 'Technology',
          description: 'Tech company'
        },
        {
          company_name: 'Fashion Brand',
          contact_email: 'contact@fashion.com',
          industry: 'Fashion',
          description: 'Fashion company'
        }
      ])
      .returning()
      .execute();

    // Create products
    const products = await db.insert(productsTable)
      .values([
        {
          sponsor_id: sponsors[0].id,
          name: 'Tech Product',
          category: 'electronics',
          description: 'A tech product'
        },
        {
          sponsor_id: sponsors[1].id,
          name: 'Fashion Product',
          category: 'clothing',
          description: 'A fashion product'
        }
      ])
      .returning()
      .execute();

    // Create campaigns
    await db.insert(campaignsTable)
      .values([
        {
          sponsor_id: sponsors[0].id,
          product_id: products[0].id,
          title: 'Tech Campaign',
          budget: '1000.00',
          status: 'active',
          description: 'Tech campaign'
        },
        {
          sponsor_id: sponsors[1].id,
          product_id: products[1].id,
          title: 'Fashion Campaign',
          budget: '500.00',
          status: 'draft',
          description: 'Fashion campaign'
        },
        {
          sponsor_id: sponsors[0].id,
          product_id: products[0].id,
          title: 'Big Budget Campaign',
          budget: '5000.00',
          status: 'active',
          description: 'High budget campaign'
        }
      ])
      .execute();

    return { sponsors, products };
  };

  it('should return all campaigns with default pagination', async () => {
    await createTestData();

    const input: SearchCampaignsInput = {
      limit: 50,
      offset: 0
    };

    const results = await searchCampaigns(input);

    expect(results).toHaveLength(3);
    expect(results[0].title).toBeDefined();
    expect(typeof results[0].budget).toBe('number');
    expect(results[0].status).toBeDefined();
  });

  it('should filter campaigns by category', async () => {
    await createTestData();

    const input: SearchCampaignsInput = {
      category: 'electronics',
      limit: 50,
      offset: 0
    };

    const results = await searchCampaigns(input);

    expect(results).toHaveLength(2); // Two tech campaigns
    results.forEach(campaign => {
      expect(campaign.title).toMatch(/Tech|Big Budget/);
    });
  });

  it('should filter campaigns by status', async () => {
    await createTestData();

    const input: SearchCampaignsInput = {
      status: 'active',
      limit: 50,
      offset: 0
    };

    const results = await searchCampaigns(input);

    expect(results).toHaveLength(2);
    results.forEach(campaign => {
      expect(campaign.status).toBe('active');
    });
  });

  it('should filter campaigns by sponsor_id', async () => {
    const { sponsors } = await createTestData();

    const input: SearchCampaignsInput = {
      sponsor_id: sponsors[1].id, // Fashion Brand
      limit: 50,
      offset: 0
    };

    const results = await searchCampaigns(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Fashion Campaign');
    expect(results[0].sponsor_id).toBe(sponsors[1].id);
  });

  it('should filter campaigns by budget range', async () => {
    await createTestData();

    const input: SearchCampaignsInput = {
      min_budget: 100,
      max_budget: 1500,
      limit: 50,
      offset: 0
    };

    const results = await searchCampaigns(input);

    expect(results).toHaveLength(2);
    results.forEach(campaign => {
      expect(campaign.budget).toBeGreaterThanOrEqual(100);
      expect(campaign.budget).toBeLessThanOrEqual(1500);
    });
  });

  it('should filter campaigns by minimum budget only', async () => {
    await createTestData();

    const input: SearchCampaignsInput = {
      min_budget: 2000,
      limit: 50,
      offset: 0
    };

    const results = await searchCampaigns(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Big Budget Campaign');
    expect(results[0].budget).toBe(5000);
  });

  it('should filter campaigns by maximum budget only', async () => {
    await createTestData();

    const input: SearchCampaignsInput = {
      max_budget: 600,
      limit: 50,
      offset: 0
    };

    const results = await searchCampaigns(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Fashion Campaign');
    expect(results[0].budget).toBe(500);
  });

  it('should combine multiple filters', async () => {
    const { sponsors } = await createTestData();

    const input: SearchCampaignsInput = {
      category: 'electronics',
      status: 'active',
      sponsor_id: sponsors[0].id,
      min_budget: 500,
      limit: 50,
      offset: 0
    };

    const results = await searchCampaigns(input);

    expect(results).toHaveLength(2);
    results.forEach(campaign => {
      expect(campaign.status).toBe('active');
      expect(campaign.sponsor_id).toBe(sponsors[0].id);
      expect(campaign.budget).toBeGreaterThanOrEqual(500);
    });
  });

  it('should handle pagination correctly', async () => {
    await createTestData();

    // Test limit
    const limitedInput: SearchCampaignsInput = {
      limit: 2,
      offset: 0
    };

    const limitedResults = await searchCampaigns(limitedInput);
    expect(limitedResults).toHaveLength(2);

    // Test offset
    const offsetInput: SearchCampaignsInput = {
      limit: 50,
      offset: 2
    };

    const offsetResults = await searchCampaigns(offsetInput);
    expect(offsetResults).toHaveLength(1);
  });

  it('should return empty array when no campaigns match filters', async () => {
    await createTestData();

    const input: SearchCampaignsInput = {
      category: 'nonexistent',
      limit: 50,
      offset: 0
    };

    const results = await searchCampaigns(input);

    expect(results).toHaveLength(0);
  });

  it('should handle campaigns with null optional fields', async () => {
    const { sponsors, products } = await createTestData();

    // Create campaign with minimal data
    await db.insert(campaignsTable)
      .values({
        sponsor_id: sponsors[0].id,
        product_id: products[0].id,
        title: 'Minimal Campaign',
        budget: '100.00',
        status: 'draft',
        description: null,
        target_audience: null,
        objectives: null,
        start_date: null,
        end_date: null
      })
      .execute();

    const input: SearchCampaignsInput = {
      limit: 50,
      offset: 0
    };

    const results = await searchCampaigns(input);

    const minimalCampaign = results.find(c => c.title === 'Minimal Campaign');
    expect(minimalCampaign).toBeDefined();
    expect(minimalCampaign!.description).toBeNull();
    expect(minimalCampaign!.target_audience).toBeNull();
    expect(minimalCampaign!.objectives).toBeNull();
    expect(minimalCampaign!.start_date).toBeNull();
    expect(minimalCampaign!.end_date).toBeNull();
    expect(typeof minimalCampaign!.budget).toBe('number');
  });

  it('should return campaigns with all required fields', async () => {
    await createTestData();

    const input: SearchCampaignsInput = {
      limit: 50,
      offset: 0
    };

    const results = await searchCampaigns(input);

    expect(results.length).toBeGreaterThan(0);

    results.forEach(campaign => {
      // Required fields
      expect(campaign.id).toBeDefined();
      expect(campaign.sponsor_id).toBeDefined();
      expect(campaign.product_id).toBeDefined();
      expect(campaign.title).toBeDefined();
      expect(campaign.budget).toBeDefined();
      expect(typeof campaign.budget).toBe('number');
      expect(campaign.status).toBeDefined();
      expect(campaign.created_at).toBeInstanceOf(Date);
      expect(campaign.updated_at).toBeInstanceOf(Date);
    });
  });
});