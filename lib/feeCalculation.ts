export interface FeeCalculationInput {
  discountedSubtotal: number;
  rawDeliveryFee: number;
  hasDashPass: boolean;
}

export interface FeeCalculationResult {
  serviceFee: number;
  deliveryFee: number;
  displayDeliveryFee: number;
  dashPassSavings: number;
  tax: number;
}

export function calculateFees({ discountedSubtotal, rawDeliveryFee, hasDashPass }: FeeCalculationInput): FeeCalculationResult {
  const serviceFee = Math.round(discountedSubtotal * 0.15 * 100) / 100;
  const deliveryFee = hasDashPass ? 0 : rawDeliveryFee;
  const displayDeliveryFee = deliveryFee + serviceFee;
  const dashPassSavings = hasDashPass ? rawDeliveryFee : 0;
  const tax = Math.round(discountedSubtotal * 0.085 * 100) / 100;
  return { serviceFee, deliveryFee, displayDeliveryFee, dashPassSavings, tax };
}
