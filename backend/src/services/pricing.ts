import { PricingRule } from "../models/models.js";

export const DEFAULT_RULES: Record<string, { base: number; per_word: number; per_slide: number }> = {
  "PPT Presentation": { base: 30.00, per_word: 0.00, per_slide: 6.00 },
  "Report Formatting": { base: 25.00, per_word: 0.04, per_slide: 0.00 },
  "Research Assistance": { base: 40.00, per_word: 0.06, per_slide: 0.00 },
  "Proofreading & Editing": { base: 15.00, per_word: 0.02, per_slide: 0.00 },
  "Referencing & Citation": { base: 20.00, per_word: 0.03, per_slide: 0.00 },
  "Data Analysis": { base: 50.00, per_word: 0.05, per_slide: 10.00 },
  "Programming Support": { base: 45.00, per_word: 0.08, per_slide: 0.00 },
  "Document Design": { base: 25.00, per_word: 0.00, per_slide: 5.00 },
};

export interface PricingEstimationRequest {
  service_type: string;
  word_count?: number;
  slide_count?: number;
  priority_level?: string;
}

export interface PricingEstimationResponse {
  estimated_total: number;
  deposit_required: number;
  final_balance: number;
  base_price: number;
  word_cost: number;
  slide_cost: number;
  priority_multiplier: number;
}

export async function calculateQuote(request: PricingEstimationRequest): Promise<PricingEstimationResponse> {
  const dbRule = await PricingRule.findOne({ where: { service_type: request.service_type } });

  let basePrice = 20.00;
  let pricePerWord = 0.04;
  let pricePerSlide = 4.00;
  let urgentMult = 1.50;
  let expressMult = 2.00;

  if (dbRule) {
    basePrice = Number(dbRule.base_price);
    pricePerWord = Number(dbRule.price_per_word);
    pricePerSlide = Number(dbRule.price_per_slide);
    urgentMult = Number(dbRule.urgent_multiplier);
    expressMult = Number(dbRule.express_multiplier);
  } else {
    const rule = DEFAULT_RULES[request.service_type];
    if (rule) {
      basePrice = rule.base;
      pricePerWord = rule.per_word;
      pricePerSlide = rule.per_slide;
    }
  }

  let priorityMultiplier = 1.00;
  if (request.priority_level === "urgent") {
    priorityMultiplier = urgentMult;
  } else if (request.priority_level === "express") {
    priorityMultiplier = expressMult;
  }

  const wordCount = request.word_count || 0;
  const slideCount = request.slide_count || 0;

  const wordCost = wordCount * pricePerWord;
  const slideCost = slideCount * pricePerSlide;

  const rawTotal = basePrice + wordCost + slideCost;
  const estimatedTotal = Number((rawTotal * priorityMultiplier).toFixed(2));

  const depositRequired = Number((estimatedTotal * 0.30).toFixed(2));
  const finalBalance = Number((estimatedTotal - depositRequired).toFixed(2));

  return {
    estimated_total: estimatedTotal,
    deposit_required: depositRequired,
    final_balance: finalBalance,
    base_price: basePrice,
    word_cost: Number(wordCost.toFixed(2)),
    slide_cost: Number(slideCost.toFixed(2)),
    priority_multiplier: priorityMultiplier
  };
}

export async function seedPricingRules() {
  const count = await PricingRule.count();
  if (count === 0) {
    for (const [sType, rates] of Object.entries(DEFAULT_RULES)) {
      await PricingRule.create({
        service_type: sType,
        base_price: rates.base,
        price_per_word: rates.per_word,
        price_per_slide: rates.per_slide,
        urgent_multiplier: 1.50,
        express_multiplier: 2.00
      });
    }
    console.log("Seeded default pricing rules.");
  }
}
