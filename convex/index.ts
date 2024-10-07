import { components } from "./_generated/api";
import { DirectAggregate } from "@convex-dev/aggregate";

export const aggregate = new DirectAggregate<string, string>(
  components.aggregate
);
