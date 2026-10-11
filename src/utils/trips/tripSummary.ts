import sumBy from "lodash/sumBy";

import { deliveries, tripLines, trips } from "@/mocks/trips";

export function tripSummary(tripId: string) {
  const trip = trips.find((candidate) => candidate.id === tripId) ?? null;
  const tripDeliveries = deliveries.filter((delivery) => delivery.tripId === tripId);

  const perProduct = tripLines
    .filter((line) => line.tripId === tripId)
    .map((line) => {
      const productDeliveries = tripDeliveries.filter((delivery) => delivery.productId === line.productId);
      const delivered = sumBy(productDeliveries, "delivered");
      const emptiesCollected = sumBy(productDeliveries, "emptiesCollected");
      const expectedFull = Math.max(0, line.loaded - delivered);

      return {
        productId: line.productId,
        loaded: line.loaded,
        delivered,
        expectedFull,
        returnedFull: line.returnedFull,
        emptiesCollected,
        returnedEmpty: line.returnedEmpty,
        fullVariance: line.returnedFull - expectedFull,
        emptyVariance: line.returnedEmpty - emptiesCollected,
      };
    });

  const expectedCash = sumBy(
    tripDeliveries.filter((delivery) => delivery.paymentType === "cash"),
    "amount"
  );
  const cashRemitted = trip?.cashRemitted ?? 0;

  return {
    trip,
    deliveries: tripDeliveries,
    perProduct,
    loaded: sumBy(perProduct, "loaded"),
    delivered: sumBy(perProduct, "delivered"),
    expectedFull: sumBy(perProduct, "expectedFull"),
    returnedFull: sumBy(perProduct, "returnedFull"),
    emptiesCollected: sumBy(perProduct, "emptiesCollected"),
    returnedEmpty: sumBy(perProduct, "returnedEmpty"),
    fullVariance: sumBy(perProduct, "fullVariance"),
    emptyVariance: sumBy(perProduct, "emptyVariance"),
    expectedCash,
    cashRemitted,
    cashVariance: cashRemitted - expectedCash,
  };
}
