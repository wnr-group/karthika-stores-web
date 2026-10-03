/**
 * The marketplace's seed data, assembled. `MockRepository` boots from this,
 * and `scripts/generate-seed.ts` writes it out as `supabase/seed.sql`, so the
 * two can never disagree.
 */

import { generateActivity } from "./activity";
import { banners, commissionRules, promotions } from "./marketplace";
import { products as otherProducts } from "./products";
import { sareeProducts } from "./products-sarees";
import { services } from "./services";
import { attributeDefinitions, categories, collections, productTypes } from "./taxonomy";
import { vendors } from "./vendors";

export const products = [...sareeProducts, ...otherProducts];

export { attributeDefinitions, banners, categories, collections, commissionRules, productTypes, promotions, services, vendors };

/** Generated once per process; the mock repository copies it into its store. */
export const activity = generateActivity({ vendors, products, services });

/** Shown in the search overlay before anything is typed. */
export const popularSearches = ["Bridal", "Kanchipuram silk", "Birthday cake", "Headphones", "Home cleaning", "Jhumka", "Filter coffee", "Dog bed"];
