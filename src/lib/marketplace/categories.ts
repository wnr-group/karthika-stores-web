/**
 * Category tree helpers. Pure functions over a flat list of categories, so
 * the seed repository, the Supabase repository and the dashboards all walk
 * the tree the same way.
 */

import type { AttributeDefinition, Category, CategoryNode, CategoryRef } from "@/lib/types";

export function toRef(category: Pick<Category, "id" | "name" | "slug">): CategoryRef {
  return { id: category.id, name: category.name, slug: category.slug };
}

/** Root first, ending with the category itself. */
export function categoryTrail(categories: Category[], categoryId: string): Category[] {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const trail: Category[] = [];
  const seen = new Set<string>();
  let current = byId.get(categoryId);

  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    trail.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  return trail;
}

/** The category's own id plus every descendant's. */
export function descendantIds(categories: Category[], categoryId: string): Set<string> {
  const ids = new Set<string>([categoryId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const category of categories) {
      if (category.parentId && ids.has(category.parentId) && !ids.has(category.id)) {
        ids.add(category.id);
        grew = true;
      }
    }
  }
  return ids;
}

export function buildTree(
  categories: Category[],
  counts: Map<string, number> = new Map(),
): CategoryNode[] {
  const nodes = new Map<string, CategoryNode>(
    categories.map((category) => [category.id, { ...category, children: [], listingCount: 0 }]),
  );
  const roots: CategoryNode[] = [];

  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }

  const total = (node: CategoryNode): number => {
    node.children.sort((a, b) => a.displayOrder - b.displayOrder);
    node.listingCount =
      (counts.get(node.id) ?? 0) + node.children.reduce((sum, child) => sum + total(child), 0);
    return node.listingCount;
  };

  roots.sort((a, b) => a.displayOrder - b.displayOrder);
  roots.forEach(total);
  return roots;
}

/**
 * The attributes a category's listings carry: its own definitions plus every
 * ancestor's, nearest winning when two declare the same key. Root-level
 * attributes come first.
 */
export function inheritedAttributes(
  categories: Category[],
  definitions: AttributeDefinition[],
  categoryId: string,
): AttributeDefinition[] {
  const trail = categoryTrail(categories, categoryId);
  const byKey = new Map<string, AttributeDefinition>();
  const order: string[] = [];

  trail.forEach((category, depth) => {
    definitions
      .filter((definition) => definition.categoryId === category.id)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .forEach((definition) => {
        if (!byKey.has(definition.key)) order.push(definition.key);
        byKey.set(definition.key, { ...definition, displayOrder: depth * 100 + definition.displayOrder });
      });
  });

  return order.map((key) => byKey.get(key)!).sort((a, b) => a.displayOrder - b.displayOrder);
}
