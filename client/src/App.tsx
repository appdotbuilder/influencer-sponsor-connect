import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Building2, Target, TrendingUp, Search, Plus } from 'lucide-react';
import { trpc } from '@/utils/trpc';

// Import types
import type { 
  Influencer, 
  Sponsor, 
  Campaign,
  Product,
  PerformanceIndicators
} from '../../server/src/schema';

// Import components
import InfluencerManagement from '@/components/InfluencerManagement';
import SponsorManagement from '@/components/SponsorManagement';
import CampaignManagement from '@/components/CampaignManagement';
import Discovery from '@/components/Discovery';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    influencers: 0,
    sponsors: 0,
    campaigns: 0,
    activeCampaigns: 0
  });

  const loadStats = useCallback(async () => {
    try {
      const [influencers, sponsors, campaigns] = await Promise.all([
        trpc.getInfluencers.query(),
        trpc.getSponsors.query(),
        trpc.getCampaigns.query()
      ]);

      const activeCampaigns = campaigns.filter(
        (campaign: Campaign) => campaign.status === 'active'
      ).length;

      setStats({
        influencers: influencers.length,
        sponsors: sponsors.length,
        campaigns: campaigns.length,
        activeCampaigns
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            🤝 InfluConnect
          </h1>
          <p className="text-gray-600 text-lg">
            Connecting Influencers with Sponsors for Meaningful Collaborations
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/70 backdrop-blur-sm">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="influencers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Influencers
            </TabsTrigger>
            <TabsTrigger value="sponsors" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Sponsors
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="discovery" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Discovery
            </TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <span>Total Influencers</span>
                    <Users className="h-5 w-5" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.influencers}</div>
                  <p className="text-purple-100 text-sm">Content creators ready to collaborate</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <span>Active Sponsors</span>
                    <Building2 className="h-5 w-5" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.sponsors}</div>
                  <p className="text-blue-100 text-sm">Brands seeking partnerships</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <span>Total Campaigns</span>
                    <Target className="h-5 w-5" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.campaigns}</div>
                  <p className="text-green-100 text-sm">Collaboration opportunities</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <span>Active Campaigns</span>
                    <TrendingUp className="h-5 w-5" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
                  <p className="text-orange-100 text-sm">Currently running</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  Platform Overview
                </CardTitle>
                <CardDescription>
                  Welcome to InfluConnect - your bridge between creative talent and brand partnerships
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-purple-700">🎨 For Influencers</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Create and showcase your portfolio</li>
                      <li>• Link multiple social media accounts</li>
                      <li>• Discover brand collaboration opportunities</li>
                      <li>• Track your performance metrics</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-semibold text-blue-700">🏢 For Sponsors</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Find the perfect influencers for your brand</li>
                      <li>• Create targeted campaign opportunities</li>
                      <li>• Set budgets and campaign objectives</li>
                      <li>• Analyze performance indicators</li>
                    </ul>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      Instagram
                    </Badge>
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      YouTube
                    </Badge>
                    <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
                      TikTok
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Twitter
                    </Badge>
                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                      LinkedIn
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Facebook
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Influencer Management */}
          <TabsContent value="influencers">
            <InfluencerManagement onStatsUpdate={loadStats} />
          </TabsContent>

          {/* Sponsor Management */}
          <TabsContent value="sponsors">
            <SponsorManagement onStatsUpdate={loadStats} />
          </TabsContent>

          {/* Campaign Management */}
          <TabsContent value="campaigns">
            <CampaignManagement onStatsUpdate={loadStats} />
          </TabsContent>

          {/* Discovery */}
          <TabsContent value="discovery">
            <Discovery />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;