import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { sponsorsTable, productsTable, campaignsTable } from '../db/schema';
import { type UpdateCampaignInput } from '../schema';
import { updateCampaign } from '../handlers/update_campaign';
import { eq } from 'drizzle-orm';

describe('updateCampaign', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create prerequisite data
  const createTestData = async () => {
    // Create sponsor
    const sponsor = await db.insert(sponsorsTable)
      .values({
        company_name: 'Test Sponsor',
        contact_email: 'sponsor@test.com',
        industry: 'Technology'
      })
      .returning()
      .execute();

    // Create product
    const product = await db.insert(productsTable)
      .values({
        sponsor_id: sponsor[0].id,
        name: 'Test Product',
        category: 'Software'
      })
      .returning()
      .execute();

    // Create campaign
    const campaign = await db.insert(campaignsTable)
      .values({
        sponsor_id: sponsor[0].id,
        product_id: product[0].id,
        title: 'Original Campaign',
        description: 'Original description',
        budget: '1000.00',
        target_audience: 'Tech enthusiasts',
        objectives: 'Brand awareness',
        status: 'draft'
      })
      .returning()
      .execute();

    return { sponsor: sponsor[0], product: product[0], campaign: campaign[0] };
  };

  it('should update campaign title and description', async () => {
    const { campaign } = await createTestData();

    const updateInput: UpdateCampaignInput = {
      id: campaign.id,
      title: 'Updated Campaign Title',
      description: 'Updated campaign description'
    };

    const result = await updateCampaign(updateInput);

    expect(result.id).toEqual(campaign.id);
    expect(result.title).toEqual('Updated Campaign Title');
    expect(result.description).toEqual('Updated campaign description');
    expect(result.budget).toEqual(1000); // Should remain unchanged but converted to number
    expect(result.status).toEqual('draft'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > campaign.updated_at).toBe(true);
  });

  it('should update campaign budget with numeric conversion', async () => {
    const { campaign } = await createTestData();

    const updateInput: UpdateCampaignInput = {
      id: campaign.id,
      budget: 2500.75
    };

    const result = await updateCampaign(updateInput);

    expect(result.id).toEqual(campaign.id);
    expect(result.budget).toEqual(2500.75);
    expect(typeof result.budget).toBe('number');
    expect(result.title).toEqual('Original Campaign'); // Should remain unchanged
  });

  it('should update campaign status', async () => {
    const { campaign } = await createTestData();

    const updateInput: UpdateCampaignInput = {
      id: campaign.id,
      status: 'active'
    };

    const result = await updateCampaign(updateInput);

    expect(result.id).toEqual(campaign.id);
    expect(result.status).toEqual('active');
    expect(result.title).toEqual('Original Campaign'); // Should remain unchanged
  });

  it('should update campaign dates', async () => {
    const { campaign } = await createTestData();

    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');

    const updateInput: UpdateCampaignInput = {
      id: campaign.id,
      start_date: startDate,
      end_date: endDate
    };

    const result = await updateCampaign(updateInput);

    expect(result.id).toEqual(campaign.id);
    expect(result.start_date).toBeInstanceOf(Date);
    expect(result.end_date).toBeInstanceOf(Date);
    expect(result.start_date?.getTime()).toEqual(startDate.getTime());
    expect(result.end_date?.getTime()).toEqual(endDate.getTime());
  });

  it('should update multiple fields simultaneously', async () => {
    const { campaign } = await createTestData();

    const updateInput: UpdateCampaignInput = {
      id: campaign.id,
      title: 'Multi-field Update',
      budget: 3000.99,
      status: 'completed',
      target_audience: 'Updated audience',
      objectives: 'Updated objectives'
    };

    const result = await updateCampaign(updateInput);

    expect(result.id).toEqual(campaign.id);
    expect(result.title).toEqual('Multi-field Update');
    expect(result.budget).toEqual(3000.99);
    expect(result.status).toEqual('completed');
    expect(result.target_audience).toEqual('Updated audience');
    expect(result.objectives).toEqual('Updated objectives');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should handle null values correctly', async () => {
    const { campaign } = await createTestData();

    const updateInput: UpdateCampaignInput = {
      id: campaign.id,
      description: null,
      target_audience: null,
      objectives: null,
      start_date: null,
      end_date: null
    };

    const result = await updateCampaign(updateInput);

    expect(result.id).toEqual(campaign.id);
    expect(result.description).toBeNull();
    expect(result.target_audience).toBeNull();
    expect(result.objectives).toBeNull();
    expect(result.start_date).toBeNull();
    expect(result.end_date).toBeNull();
    expect(result.title).toEqual('Original Campaign'); // Should remain unchanged
  });

  it('should save updated data to database', async () => {
    const { campaign } = await createTestData();

    const updateInput: UpdateCampaignInput = {
      id: campaign.id,
      title: 'Database Persistence Test',
      budget: 1500.50
    };

    await updateCampaign(updateInput);

    // Verify data is saved in database
    const savedCampaign = await db.select()
      .from(campaignsTable)
      .where(eq(campaignsTable.id, campaign.id))
      .execute();

    expect(savedCampaign).toHaveLength(1);
    expect(savedCampaign[0].title).toEqual('Database Persistence Test');
    expect(parseFloat(savedCampaign[0].budget)).toEqual(1500.50);
    expect(savedCampaign[0].updated_at).toBeInstanceOf(Date);
    expect(savedCampaign[0].updated_at > campaign.updated_at).toBe(true);
  });

  it('should throw error for non-existent campaign', async () => {
    const updateInput: UpdateCampaignInput = {
      id: 99999,
      title: 'Non-existent Campaign'
    };

    await expect(updateCampaign(updateInput)).rejects.toThrow(/Campaign with id 99999 not found/i);
  });

  it('should handle all campaign statuses', async () => {
    const { campaign } = await createTestData();

    const statuses = ['draft', 'active', 'paused', 'completed', 'cancelled'] as const;

    for (const status of statuses) {
      const updateInput: UpdateCampaignInput = {
        id: campaign.id,
        status: status
      };

      const result = await updateCampaign(updateInput);
      expect(result.status).toEqual(status);
    }
  });

  it('should preserve foreign key relationships after update', async () => {
    const { campaign, sponsor, product } = await createTestData();

    const updateInput: UpdateCampaignInput = {
      id: campaign.id,
      title: 'FK Preservation Test'
    };

    const result = await updateCampaign(updateInput);

    expect(result.sponsor_id).toEqual(sponsor.id);
    expect(result.product_id).toEqual(product.id);
  });
});