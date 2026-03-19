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
  const serviceFee = Math.round(discountedSubtotal * 0.05 * 100) / 100;
  const dashPassServiceFee = hasDashPass ? Math.round(serviceFee * 0.5 * 100) / 100 : serviceFee;
  const dashPassDeliveryFee = hasDashPass ? 0 : rawDeliveryFee;
  const displayDeliveryFee = dashPassDeliveryFee + dashPassServiceFee;
  const dashPassSavings = hasDashPass ? (rawDeliveryFee + serviceFee - dashPassDeliveryFee - dashPassServiceFee) : 0;
  const tax = Math.round(discountedSubtotal * 0.085 * 100) / 100;
  return { serviceFee: dashPassServiceFee, deliveryFee: dashPassDeliveryFee, displayDeliveryFee, dashPassSavings, tax };
}
