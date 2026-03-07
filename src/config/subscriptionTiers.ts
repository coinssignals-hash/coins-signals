export const SUBSCRIPTION_TIERS = {
  basico: {
    product_id: 'prod_U6dAUZT4TsqQfd',
    monthly_price_id: 'price_1T8PuZFfDZBRyL2bLQdjTchT',
    weekly_price_id: 'price_1T8Pv5FfDZBRyL2blgKsCyPS',
  },
  plus: {
    product_id: 'prod_U6dCe0USixk7Bi',
    monthly_price_id: 'price_1T8Pw3FfDZBRyL2blMymB3Td',
    weekly_price_id: 'price_1T8PwdFfDZBRyL2b7QWza7u4',
  },
  premium: {
    product_id: 'prod_U6dDQE3VZYCoHl',
    monthly_price_id: 'price_1T8Px6FfDZBRyL2b9x2Y04jZ',
    weekly_price_id: 'price_1T8PyUFfDZBRyL2bG4ggSH7Y',
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;
