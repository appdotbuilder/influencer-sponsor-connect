import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, Users, Target, DollarSign, Building2, Package, Filter, Star, TrendingUp } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { 
  Influencer,
  Campaign,
  Sponsor,
  Product,
  SearchInfluencersInput,
  SearchCampaignsInput
} from '../../../server/src/schema';

export default function Discovery() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Influencer search state
  const [influencerFilters, setInfluencerFilters] = useState<SearchInfluencersInput>({
    category: undefined,
    min_followers: undefined,
    max_followers: undefined,
    platform: undefined,
    min_engagement_rate: undefined,
    limit: 50,
    offset: 0
  });

  // Campaign search state
  const [campaignFilters, setCampaignFilters] = useState<SearchCampaignsInput>({
    category: undefined,
    min_budget: undefined,
    max_budget: undefined,
    status: undefined,
    sponsor_id: undefined,
    limit: 50,
    offset: 0
  });

  const loadInitialData = useCallback(async () => {
    try {
      const [influencersResult, campaignsResult, sponsorsResult, productsResult] = await Promise.all([
        trpc.getInfluencers.query(),
        trpc.getCampaigns.query(),
        trpc.getSponsors.query(),
        trpc.getProducts.query()
      ]);

      setInfluencers(influencersResult);
      setCampaigns(campaignsResult);
      setSponsors(sponsorsResult);
      setProducts(productsResult);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const searchInfluencers = async () => {
    setIsSearching(true);
    try {
      const results = await trpc.searchInfluencers.query(influencerFilters);
      setInfluencers(results);
    } catch (error) {
      console.error('Failed to search influencers:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const searchCampaigns = async () => {
    setIsSearching(true);
    try {
      const results = await trpc.searchCampaigns.query(campaignFilters);
      setCampaigns(results);
    } catch (error) {
      console.error('Failed to search campaigns:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const resetInfluencerFilters = () => {
    setInfluencerFilters({
      category: undefined,
      min_followers: undefined,
      max_followers: undefined,
      platform: undefined,
      min_engagement_rate: undefined,
      limit: 50,
      offset: 0
    });
    loadInitialData();
  };

  const resetCampaignFilters = () => {
    setCampaignFilters({
      category: undefined,
      min_budget: undefined,
      max_budget: undefined,
      status: undefined,
      sponsor_id: undefined,
      limit: 50,
      offset: 0
    });
    loadInitialData();
  };

  const getSponsorName = (sponsorId: number) => {
    const sponsor = sponsors.find((s: Sponsor) => s.id === sponsorId);
    return sponsor?.company_name || 'Unknown Sponsor';
  };

  const getProductName = (productId: number) => {
    const product = products.find((p: Product) => p.id === productId);
    return product?.name || 'Unknown Product';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.draft;
  };

  const getStatusEmoji = (status: string) => {
    const emojis: Record<string, string> = {
      draft: '📝',
      active: '🚀',
      paused: '⏸️',
      completed: '✅',
      cancelled: '❌'
    };
    return emojis[status] || emojis.draft;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">🔍 Discovery Hub</h2>
        <p className="text-gray-600 mt-1">Find the perfect matches for collaboration opportunities</p>
      </div>

      <Tabs defaultValue="influencers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-white/70 backdrop-blur-sm">
          <TabsTrigger value="influencers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Find Influencers
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Find Campaigns
          </TabsTrigger>
        </TabsList>

        {/* Influencer Discovery */}
        <TabsContent value="influencers" className="space-y-6">
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-purple-600" />
                Search Filters
              </CardTitle>
              <CardDescription>Find influencers based on your requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    placeholder="e.g., Fashion, Tech"
                    value={influencerFilters.category || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setInfluencerFilters((prev: SearchInfluencersInput) => ({ 
                        ...prev, 
                        category: e.target.value || undefined 
                      }))
                    }
                  />
                </div>
                
                <div>
                  <Label htmlFor="platform">Platform</Label>
                  <Select
                    value={influencerFilters.platform || ''}
                    onValueChange={(value: 'instagram' | 'youtube' | 'tiktok' | 'twitter' | 'linkedin' | 'facebook' | 'other' | '') =>
                      setInfluencerFilters((prev: SearchInfluencersInput) => ({ 
                        ...prev, 
                        platform: value || undefined 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All platforms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Platforms</SelectItem>
                      <SelectItem value="instagram">📸 Instagram</SelectItem>
                      <SelectItem value="youtube">🎥 YouTube</SelectItem>
                      <SelectItem value="tiktok">🎵 TikTok</SelectItem>
                      <SelectItem value="twitter">🐦 Twitter</SelectItem>
                      <SelectItem value="linkedin">💼 LinkedIn</SelectItem>
                      <SelectItem value="facebook">👥 Facebook</SelectItem>
                      <SelectItem value="other">🌐 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="min_followers">Min Followers</Label>
                  <Input
                    id="min_followers"
                    type="number"
                    placeholder="1000"
                    min="0"
                    value={influencerFilters.min_followers || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setInfluencerFilters((prev: SearchInfluencersInput) => ({ 
                        ...prev, 
                        min_followers: parseInt(e.target.value) || undefined 
                      }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="max_followers">Max Followers</Label>
                  <Input
                    id="max_followers"
                    type="number"
                    placeholder="100000"
                    min="0"
                    value={influencerFilters.max_followers || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setInfluencerFilters((prev: SearchInfluencersInput) => ({ 
                        ...prev, 
                        max_followers: parseInt(e.target.value) || undefined 
                      }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="min_engagement">Min Engagement %</Label>
                  <Input
                    id="min_engagement"
                    type="number"
                    placeholder="2.5"
                    min="0"
                    max="100"
                    step="0.1"
                    value={influencerFilters.min_engagement_rate || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setInfluencerFilters((prev: SearchInfluencersInput) => ({ 
                        ...prev, 
                        min_engagement_rate: parseFloat(e.target.value) || undefined 
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={searchInfluencers} disabled={isSearching} className="bg-purple-600 hover:bg-purple-700">
                  <Search className="h-4 w-4 mr-2" />
                  {isSearching ? 'Searching...' : 'Search Influencers'}
                </Button>
                <Button variant="outline" onClick={resetInfluencerFilters}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Influencers Results */}
          {influencers.length === 0 ? (
            <Card className="bg-white/70 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No influencers found</h3>
                <p className="text-gray-500 text-center">
                  Try adjusting your search filters or add some influencers to the platform
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {influencers.map((influencer: Influencer) => (
                <Card key={influencer.id} className="bg-white/70 backdrop-blur-sm hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {influencer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{influencer.name}</CardTitle>
                        <p className="text-sm text-gray-500">{influencer.email}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {influencer.bio && (
                      <p className="text-sm text-gray-600 line-clamp-2">{influencer.bio}</p>
                    )}
                    
                    {influencer.portfolio_description && (
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <h4 className="text-sm font-medium text-purple-700 mb-1 flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          Portfolio
                        </h4>
                        <p className="text-xs text-purple-600 line-clamp-2">
                          {influencer.portfolio_description}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs text-gray-500">
                        Joined {influencer.created_at.toLocaleDateString()}
                      </span>
                      <Button size="sm" variant="outline" className="text-xs">
                        View Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Campaign Discovery */}
        <TabsContent value="campaigns" className="space-y-6">
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-green-600" />
                Search Filters
              </CardTitle>
              <CardDescription>Find collaboration opportunities that match your interests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="campaign_category">Category</Label>
                  <Input
                    id="campaign_category"
                    placeholder="e.g., Fashion, Tech"
                    value={campaignFilters.category || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCampaignFilters((prev: SearchCampaignsInput) => ({ 
                        ...prev, 
                        category: e.target.value || undefined 
                      }))
                    }
                  />
                </div>
                
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={campaignFilters.status || ''}
                    onValueChange={(value: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled' | '') =>
                      setCampaignFilters((prev: SearchCampaignsInput) => ({ 
                        ...prev, 
                        status: value || undefined 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      <SelectItem value="draft">📝 Draft</SelectItem>
                      <SelectItem value="active">🚀 Active</SelectItem>
                      <SelectItem value="paused">⏸️ Paused</SelectItem>
                      <SelectItem value="completed">✅ Completed</SelectItem>
                      <SelectItem value="cancelled">❌ Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sponsor">Sponsor</Label>
                  <Select
                    value={campaignFilters.sponsor_id?.toString() || ''}
                    onValueChange={(value: string) =>
                      setCampaignFilters((prev: SearchCampaignsInput) => ({ 
                        ...prev, 
                        sponsor_id: value ? parseInt(value) : undefined 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All sponsors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Sponsors</SelectItem>
                      {sponsors.map((sponsor: Sponsor) => (
                        <SelectItem key={sponsor.id} value={sponsor.id.toString()}>
                          {sponsor.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="min_budget">Min Budget ($)</Label>
                  <Input
                    id="min_budget"
                    type="number"
                    placeholder="1000"
                    min="0"
                    step="0.01"
                    value={campaignFilters.min_budget || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCampaignFilters((prev: SearchCampaignsInput) => ({ 
                        ...prev, 
                        min_budget: parseFloat(e.target.value) || undefined 
                      }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="max_budget">Max Budget ($)</Label>
                  <Input
                    id="max_budget"
                    type="number"
                    placeholder="10000"
                    min="0"
                    step="0.01"
                    value={campaignFilters.max_budget || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCampaignFilters((prev: SearchCampaignsInput) => ({ 
                        ...prev, 
                        max_budget: parseFloat(e.target.value) || undefined 
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={searchCampaigns} disabled={isSearching} className="bg-green-600 hover:bg-green-700">
                  <Search className="h-4 w-4 mr-2" />
                  {isSearching ? 'Searching...' : 'Search Campaigns'}
                </Button>
                <Button variant="outline" onClick={resetCampaignFilters}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Results */}
          {campaigns.length === 0 ? (
            <Card className="bg-white/70 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
                <p className="text-gray-500 text-center">
                  Try adjusting your search filters or create some campaigns
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((campaign: Campaign) => (
                <Card key={campaign.id} className="bg-white/70 backdrop-blur-sm hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg line-clamp-2">{campaign.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getStatusColor(campaign.status)} variant="secondary">
                            {getStatusEmoji(campaign.status)} {campaign.status}
                          </Badge>
                          {campaign.status === 'active' && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Live
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building2 className="h-3 w-3" />
                        {getSponsorName(campaign.sponsor_id)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Package className="h-3 w-3" />
                        {getProductName(campaign.product_id)}
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                        <DollarSign className="h-3 w-3" />
                        ${campaign.budget.toLocaleString()} budget
                      </div>
                    </div>

                    {campaign.description && (
                      <p className="text-sm text-gray-600 line-clamp-3">{campaign.description}</p>
                    )}

                    {campaign.target_audience && (
                      <div className="p-2 bg-green-50 rounded text-xs">
                        <span className="text-green-700 font-medium">Target: </span>
                        <span className="text-green-600">{campaign.target_audience}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs text-gray-500">
                        {campaign.start_date 
                          ? `Starts ${campaign.start_date.toLocaleDateString()}`
                          : `Created ${campaign.created_at.toLocaleDateString()}`
                        }
                      </span>
                      <Button size="sm" variant="outline" className="text-xs">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}