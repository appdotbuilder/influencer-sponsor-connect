import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createInfluencerInputSchema,
  updateInfluencerInputSchema,
  createSocialMediaAccountInputSchema,
  createSponsorInputSchema,
  updateSponsorInputSchema,
  createProductInputSchema,
  createCampaignInputSchema,
  updateCampaignInputSchema,
  createPerformanceIndicatorsInputSchema,
  searchInfluencersInputSchema,
  searchCampaignsInputSchema,
  idParamSchema
} from './schema';

// Import handlers
import { createInfluencer } from './handlers/create_influencer';
import { getInfluencers } from './handlers/get_influencers';
import { getInfluencerById } from './handlers/get_influencer_by_id';
import { updateInfluencer } from './handlers/update_influencer';
import { searchInfluencers } from './handlers/search_influencers';
import { createSocialMediaAccount } from './handlers/create_social_media_account';
import { createSponsor } from './handlers/create_sponsor';
import { getSponsors } from './handlers/get_sponsors';
import { getSponsorById } from './handlers/get_sponsor_by_id';
import { updateSponsor } from './handlers/update_sponsor';
import { createProduct } from './handlers/create_product';
import { getProducts } from './handlers/get_products';
import { getProductsBySponsor } from './handlers/get_products_by_sponsor';
import { createCampaign } from './handlers/create_campaign';
import { getCampaigns } from './handlers/get_campaigns';
import { searchCampaigns } from './handlers/search_campaigns';
import { updateCampaign } from './handlers/update_campaign';
import { createPerformanceIndicators } from './handlers/create_performance_indicators';
import { getPerformanceIndicatorsByInfluencer } from './handlers/get_performance_indicators';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Influencer management
  createInfluencer: publicProcedure
    .input(createInfluencerInputSchema)
    .mutation(({ input }) => createInfluencer(input)),

  getInfluencers: publicProcedure
    .query(() => getInfluencers()),

  getInfluencerById: publicProcedure
    .input(idParamSchema)
    .query(({ input }) => getInfluencerById(input.id)),

  updateInfluencer: publicProcedure
    .input(updateInfluencerInputSchema)
    .mutation(({ input }) => updateInfluencer(input)),

  searchInfluencers: publicProcedure
    .input(searchInfluencersInputSchema)
    .query(({ input }) => searchInfluencers(input)),

  // Social media accounts
  createSocialMediaAccount: publicProcedure
    .input(createSocialMediaAccountInputSchema)
    .mutation(({ input }) => createSocialMediaAccount(input)),

  // Sponsor management
  createSponsor: publicProcedure
    .input(createSponsorInputSchema)
    .mutation(({ input }) => createSponsor(input)),

  getSponsors: publicProcedure
    .query(() => getSponsors()),

  getSponsorById: publicProcedure
    .input(idParamSchema)
    .query(({ input }) => getSponsorById(input.id)),

  updateSponsor: publicProcedure
    .input(updateSponsorInputSchema)
    .mutation(({ input }) => updateSponsor(input)),

  // Product management
  createProduct: publicProcedure
    .input(createProductInputSchema)
    .mutation(({ input }) => createProduct(input)),

  getProducts: publicProcedure
    .query(() => getProducts()),

  getProductsBySponsor: publicProcedure
    .input(idParamSchema)
    .query(({ input }) => getProductsBySponsor(input.id)),

  // Campaign/Opportunity management
  createCampaign: publicProcedure
    .input(createCampaignInputSchema)
    .mutation(({ input }) => createCampaign(input)),

  getCampaigns: publicProcedure
    .query(() => getCampaigns()),

  searchCampaigns: publicProcedure
    .input(searchCampaignsInputSchema)
    .query(({ input }) => searchCampaigns(input)),

  updateCampaign: publicProcedure
    .input(updateCampaignInputSchema)
    .mutation(({ input }) => updateCampaign(input)),

  // Performance indicators
  createPerformanceIndicators: publicProcedure
    .input(createPerformanceIndicatorsInputSchema)
    .mutation(({ input }) => createPerformanceIndicators(input)),

  getPerformanceIndicatorsByInfluencer: publicProcedure
    .input(idParamSchema)
    .query(({ input }) => getPerformanceIndicatorsByInfluencer(input.id)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();