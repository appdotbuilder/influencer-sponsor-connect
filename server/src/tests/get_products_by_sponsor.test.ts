import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { sponsorsTable, productsTable } from '../db/schema';
import { getProductsBySponsor } from '../handlers/get_products_by_sponsor';
import { eq } from 'drizzle-orm';

describe('getProductsBySponsor', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all products for a given sponsor', async () => {
    // Create test sponsor
    const sponsorResult = await db.insert(sponsorsTable)
      .values({
        company_name: 'Test Company',
        contact_email: 'test@company.com',
        industry: 'Technology',
        description: 'A test company'
      })
      .returning()
      .execute();
    const sponsorId = sponsorResult[0].id;

    // Create test products for this sponsor
    const product1 = {
      sponsor_id: sponsorId,
      name: 'Product 1',
      description: 'First test product',
      category: 'Electronics',
      target_audience: 'Tech enthusiasts'
    };

    const product2 = {
      sponsor_id: sponsorId,
      name: 'Product 2',
      description: 'Second test product',
      category: 'Software',
      target_audience: 'Developers'
    };

    await db.insert(productsTable)
      .values([product1, product2])
      .execute();

    // Test the handler
    const result = await getProductsBySponsor(sponsorId);

    // Verify results
    expect(result).toHaveLength(2);
    
    // Check first product
    expect(result[0].name).toEqual('Product 1');
    expect(result[0].description).toEqual('First test product');
    expect(result[0].category).toEqual('Electronics');
    expect(result[0].target_audience).toEqual('Tech enthusiasts');
    expect(result[0].sponsor_id).toEqual(sponsorId);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Check second product
    expect(result[1].name).toEqual('Product 2');
    expect(result[1].description).toEqual('Second test product');
    expect(result[1].category).toEqual('Software');
    expect(result[1].target_audience).toEqual('Developers');
    expect(result[1].sponsor_id).toEqual(sponsorId);
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
    expect(result[1].updated_at).toBeInstanceOf(Date);
  });

  it('should return empty array when sponsor has no products', async () => {
    // Create test sponsor with no products
    const sponsorResult = await db.insert(sponsorsTable)
      .values({
        company_name: 'Empty Company',
        contact_email: 'empty@company.com',
        industry: 'Services',
        description: 'A company with no products'
      })
      .returning()
      .execute();
    const sponsorId = sponsorResult[0].id;

    // Test the handler
    const result = await getProductsBySponsor(sponsorId);

    // Should return empty array
    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should return empty array for non-existent sponsor', async () => {
    // Test with non-existent sponsor ID
    const result = await getProductsBySponsor(999999);

    // Should return empty array
    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should only return products for the specified sponsor', async () => {
    // Create two test sponsors
    const sponsor1Result = await db.insert(sponsorsTable)
      .values({
        company_name: 'Company 1',
        contact_email: 'test1@company.com',
        industry: 'Technology',
        description: 'First test company'
      })
      .returning()
      .execute();
    const sponsor1Id = sponsor1Result[0].id;

    const sponsor2Result = await db.insert(sponsorsTable)
      .values({
        company_name: 'Company 2',
        contact_email: 'test2@company.com',
        industry: 'Healthcare',
        description: 'Second test company'
      })
      .returning()
      .execute();
    const sponsor2Id = sponsor2Result[0].id;

    // Create products for both sponsors
    await db.insert(productsTable)
      .values([
        {
          sponsor_id: sponsor1Id,
          name: 'Sponsor 1 Product A',
          category: 'Electronics',
          description: 'Product A from sponsor 1'
        },
        {
          sponsor_id: sponsor1Id,
          name: 'Sponsor 1 Product B',
          category: 'Software',
          description: 'Product B from sponsor 1'
        },
        {
          sponsor_id: sponsor2Id,
          name: 'Sponsor 2 Product A',
          category: 'Healthcare',
          description: 'Product A from sponsor 2'
        }
      ])
      .execute();

    // Test the handler for sponsor 1
    const result = await getProductsBySponsor(sponsor1Id);

    // Should only return products for sponsor 1
    expect(result).toHaveLength(2);
    result.forEach(product => {
      expect(product.sponsor_id).toEqual(sponsor1Id);
      expect(product.name).toMatch(/Sponsor 1 Product/);
    });

    // Verify the specific products are returned
    const productNames = result.map(p => p.name).sort();
    expect(productNames).toEqual(['Sponsor 1 Product A', 'Sponsor 1 Product B']);
  });

  it('should handle products with null optional fields', async () => {
    // Create test sponsor
    const sponsorResult = await db.insert(sponsorsTable)
      .values({
        company_name: 'Minimal Company',
        contact_email: 'minimal@company.com',
        industry: 'Services'
      })
      .returning()
      .execute();
    const sponsorId = sponsorResult[0].id;

    // Create product with minimal data (null optional fields)
    await db.insert(productsTable)
      .values({
        sponsor_id: sponsorId,
        name: 'Minimal Product',
        category: 'Services',
        description: null,
        target_audience: null
      })
      .execute();

    // Test the handler
    const result = await getProductsBySponsor(sponsorId);

    // Verify results handle null values correctly
    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Minimal Product');
    expect(result[0].category).toEqual('Services');
    expect(result[0].description).toBeNull();
    expect(result[0].target_audience).toBeNull();
    expect(result[0].sponsor_id).toEqual(sponsorId);
  });
});