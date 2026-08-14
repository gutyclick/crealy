import assert from "node:assert/strict";
import test from "node:test";

import {
  displayPrice,
  PRICING_PLANS,
  type PublicPlanId,
} from "../src/config/plans";

test("pricing exposes the four plans in comparison order", () => {
  assert.deepEqual(
    PRICING_PLANS.map((plan) => plan.id),
    ["free", "starter", "creator", "pro"] satisfies PublicPlanId[],
  );
  assert.deepEqual(
    PRICING_PLANS.map(({ monthlyPrice, credits }) => ({
      monthlyPrice,
      credits,
    })),
    [
      { monthlyPrice: 0, credits: 3 },
      { monthlyPrice: 5, credits: 10 },
      { monthlyPrice: 15, credits: 60 },
      { monthlyPrice: 40, credits: 180 },
    ],
  );
});

test("annual pricing shows the monthly equivalent and exact annual charge", () => {
  const annual = Object.fromEntries(
    PRICING_PLANS.slice(1).map((plan) => [plan.id, displayPrice(plan, "annual")]),
  );

  assert.deepEqual(annual.starter, {
    primary: "$4",
    suffix: "/ mes",
    detail: "$48 facturados anualmente",
  });
  assert.deepEqual(annual.creator, {
    primary: "$12",
    suffix: "/ mes",
    detail: "$144 facturados anualmente",
  });
  assert.deepEqual(annual.pro, {
    primary: "$32",
    suffix: "/ mes",
    detail: "$384 facturados anualmente",
  });
});

test("Creator is the only visually recommended plan", () => {
  assert.deepEqual(
    PRICING_PLANS.filter((plan) => plan.popular).map((plan) => plan.id),
    ["creator"],
  );
});
