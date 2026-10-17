// Role registry. Role content is loaded with dynamic import() only after a role
// is selected, so the start screen stays light.

export const ROLE_IDS = ["hr", "tech", "sales", "marketing", "ops", "servicedesk", "support", "finance"];

export async function loadRole(id) {
  if (!ROLE_IDS.includes(id)) throw new Error(`Unknown role: ${id}`);
  const module = await import(`./${id}.js`);
  return module.default;
}
