import "server-only";

import { getRepository } from "@/lib/data/repository";
import { categoryTrail, inheritedAttributes } from "@/lib/marketplace/categories";
import type { AttributeDefinition } from "@/lib/types";

/** One choice in the form's category picker, with what that category implies. */
export interface CategoryChoice {
  id: string;
  /** "Fashion › Sarees › Kanchipuram Silk" */
  label: string;
  /** Stock is counted for physical goods, not for made-to-order or digital ones. */
  tracksInventory: boolean;
  supportsVariants: boolean;
  /** The category's own details (fabric, fit...), including inherited ones. */
  attributes: AttributeDefinition[];
}

export async function loadCategoryChoices(): Promise<CategoryChoice[]> {
  const repository = await getRepository();
  const [categories, productTypes, definitions] = await Promise.all([
    repository.listCategories({ kind: "product" }),
    repository.listProductTypes(),
    repository.listAttributeDefinitions(),
  ]);

  return categories
    .map((category) => {
      const trail = categoryTrail(categories, category.id);
      const typeId =
        [...trail].reverse().find((entry) => entry.defaultProductTypeId)?.defaultProductTypeId ?? "pt-physical";
      const productType = productTypes.find((type) => type.id === typeId);
      return {
        id: category.id,
        label: trail.map((entry) => entry.name).join(" › "),
        tracksInventory: productType?.tracksInventory ?? true,
        supportsVariants: productType?.supportsVariants ?? true,
        attributes: inheritedAttributes(categories, definitions, category.id),
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}
