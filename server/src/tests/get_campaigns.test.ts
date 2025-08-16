import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { campaignsTable, sponsorsTable, productsTable } from '../db/schema';
import { getCampaigns } from '../handlers/get_campaigns';

describe('getCampaigns', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no campaigns exist', async () => {
    const result = await getCampaigns();

    expect(result).toEqual([]);
  });

  it('should return all campaigns', async () => {
    // Create prerequisite sponsor
    const sponsorResult = await db.insert(sponsorsTable)
      .values({
        company_name: 'Test Sponsor',
        contact_email: 'sponsor@test.com',
        industry: 'Technology'
      })
      .returning()
      .execute();

    const sponsorId = sponsorResult[0].id;

    // Create prerequisite product
    const productResult = await db.insert(productsTable)
      .values({
        sponsor_id: sponsorId,
        name: 'Test Product',
        category: 'Software'
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Create test campaigns
    await db.insert(campaignsTable)
      .values([
        {
          sponsor_id: sponsorId,
          product_id: productId,
          title: 'Summer Campaign',
          description: 'A summer marketing campaign',
          budget: '1000.50',
          status: 'active',
          target_audience: 'Young adults',
          objectives: 'Increase brand awareness'
        },
        {
          sponsor_id: sponsorId,
          product_id: productId,
          title: 'Winter Campaign',
          description: 'A winter marketing campaign',
          budget: '2500.75',
          status: 'draft',
          target_audience: 'Professionals',
          objectives: 'Drive sales'
        }
      ])
      .execute();

    const result = await getCampaigns();

    expect(result).toHaveLength(2);
    
    // Check first campaign
    const summerCampaign = result.find(c => c.title === 'Summer Campaign');
    expect(summerCampaign).toBeDefined();
    expect(summerCampaign!.description).toEqual('A summer marketing campaign');
    expect(summerCampaign!.budget).toEqual(1000.50);
    expect(typeof summerCampaign!.budget).toBe('number');
    expect(summerCampaign!.status).toEqual('active');
    expect(summerCampaign!.target_audience).toEqual('Young adults');
    expect(summerCampaign!.objectives).toEqual('Increase brand awareness');
    expect(summerCampaign!.sponsor_id).toEqual(sponsorId);
    expect(summerCampaign!.product_id).toEqual(productId);
    expect(summerCampaign!.created_at).toBeInstanceOf(Date);
    expect(summerCampaign!.updated_at).toBeInstanceOf(Date);

    // Check second campaign
    const winterCampaign = result.find(c => c.title === 'Winter Campaign');
    expect(winterCampaign).toBeDefined();
    expect(winterCampaign!.description).toEqual('A winter marketing campaign');
    expect(winterCampaign!.budget).toEqual(2500.75);
    expect(typeof winterCampaign!.budget).toBe('number');
    expect(winterCampaign!.status).toEqual('draft');
    expect(winterCampaign!.target_audience).toEqual('Professionals');
    expect(winterCampaign!.objectives).toEqual('Drive sales');
  });

  it('should handle campaigns with null optional fields', async () => {
    // Create prerequisite sponsor
    const sponsorResult = await db.insert(sponsorsTable)
      .values({
        company_name: 'Test Sponsor',
        contact_email: 'sponsor@test.com',
        industry: 'Technology'
      })
      .returning()
      .execute();

    const sponsorId = sponsorResult[0].id;

    // Create prerequisite product
    const productResult = await db.insert(productsTable)
      .values({
        sponsor_id: sponsorId,
        name: 'Test Product',
        category: 'Software'
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Create campaign with minimal required fields
    await db.insert(campaignsTable)
      .values({
        sponsor_id: sponsorId,
        product_id: productId,
        title: 'Minimal Campaign',
        budget: '500.00'
        // Optional fields left as null/default
      })
      .execute();

    const result = await getCampaigns();

    expect(result).toHaveLength(1);
    
    const campaign = result[0];
    expect(campaign.title).toEqual('Minimal Campaign');
    expect(campaign.budget).toEqual(500.00);
    expect(typeof campaign.budget).toBe('number');
    expect(campaign.status).toEqual('draft'); // Default status
    expect(campaign.description).toBeNull();
    expect(campaign.target_audience).toBeNull();
    expect(campaign.objectives).toBeNull();
    expect(campaign.start_date).toBeNull();
    expect(campaign.end_date).toBeNull();
  });

  it('should handle campaigns with dates', async () => {
    // Create prerequisite sponsor
    const sponsorResult = await db.insert(sponsorsTable)
      .values({
        company_name: 'Test Sponsor',
        contact_email: 'sponsor@test.com',
        industry: 'Technology'
      })
      .returning()
      .execute();

    const sponsorId = sponsorResult[0].id;

    // Create prerequisite product
    const productResult = await db.insert(productsTable)
      .values({
        sponsor_id: sponsorId,
        name: 'Test Product',
        category: 'Software'
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');

    // Create campaign with dates
    await db.insert(campaignsTable)
      .values({
        sponsor_id: sponsorId,
        product_id: productId,
        title: 'Scheduled Campaign',
        budget: '1500.00',
        start_date: startDate,
        end_date: endDate
      })
      .execute();

    const result = await getCampaigns();

    expect(result).toHaveLength(1);
    
    const campaign = result[0];
    expect(campaign.title).toEqual('Scheduled Campaign');
    expect(campaign.start_date).toBeInstanceOf(Date);
    expect(campaign.end_date).toBeInstanceOf(Date);
    expect(campaign.start_date!.getFullYear()).toEqual(2024);
    expect(campaign.start_date!.getMonth()).toEqual(0); // January
    expect(campaign.end_date!.getMonth()).toEqual(11); // December
  });
});