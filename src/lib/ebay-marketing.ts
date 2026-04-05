/**
 * eBay Marketing Service — Promoted Listings
 *
 * Manages promoted listing campaigns to boost visibility on eBay.
 * Creates a single campaign and auto-adds new listings.
 */

import { ebayFetch } from "./ebay";

const CAMPAIGN_NAME = "ShirtyNation Auto-Promote";
const DEFAULT_AD_RATE = "3.0"; // 3% of sale price

interface Campaign {
  campaignId: string;
  campaignName: string;
  campaignStatus: string;
}

interface CampaignList {
  campaigns: Campaign[];
  total: number;
}

// --- Campaign Management ---

async function findOrCreateCampaign(): Promise<string> {
  // Check for existing campaign
  try {
    const result = await ebayFetch<CampaignList>(
      "/sell/marketing/v1/ad_campaign?campaign_name=" + encodeURIComponent(CAMPAIGN_NAME) + "&campaign_status=RUNNING"
    );

    if (result.campaigns && result.campaigns.length > 0) {
      return result.campaigns[0].campaignId;
    }
  } catch {
    // No campaigns found, create one
  }

  // Create new campaign
  const result = await ebayFetch<{ campaignId: string }>("/sell/marketing/v1/ad_campaign", {
    method: "POST",
    body: JSON.stringify({
      campaignName: CAMPAIGN_NAME,
      marketplaceId: "EBAY_US",
      fundingStrategy: {
        fundingModel: "COST_PER_SALE",
        bidPercentage: DEFAULT_AD_RATE,
      },
    }),
  });

  console.log(`  📣 Created campaign: ${result.campaignId}`);
  return result.campaignId;
}

// --- Add Listing to Campaign ---

export async function promoteListingOnEbay(listingId: string): Promise<void> {
  try {
    const campaignId = await findOrCreateCampaign();

    await ebayFetch(`/sell/marketing/v1/ad_campaign/${campaignId}/ad`, {
      method: "POST",
      body: JSON.stringify({
        listingId,
        bidPercentage: DEFAULT_AD_RATE,
      }),
    });

    console.log(`  📣 Listing ${listingId} added to promoted campaign (${DEFAULT_AD_RATE}%)`);
  } catch (err) {
    // Don't fail the pipeline if promotion fails — listing is still live
    console.log(`  ⚠️  Promoted listing failed (non-blocking): ${(err as Error).message.slice(0, 100)}`);
  }
}

// --- Campaign Stats ---

export async function getCampaignStats(): Promise<{
  campaignId: string;
  impressions: number;
  clicks: number;
  sales: number;
  spend: number;
} | null> {
  try {
    const result = await ebayFetch<CampaignList>(
      "/sell/marketing/v1/ad_campaign?campaign_name=" + encodeURIComponent(CAMPAIGN_NAME)
    );

    if (!result.campaigns || result.campaigns.length === 0) return null;

    return {
      campaignId: result.campaigns[0].campaignId,
      impressions: 0, // Would need reporting API for detailed stats
      clicks: 0,
      sales: 0,
      spend: 0,
    };
  } catch {
    return null;
  }
}
