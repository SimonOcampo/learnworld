import catalog from "../content/curriculum/catalog.json";
import { catalogSchema } from "../lib/schemas/skill";

const parsed = catalogSchema.parse(catalog);
const index = parsed.skills.map(({ id, title, course, moduleId, aliases, keywords }) => ({ id, title, course, moduleId, aliases, keywords }));
console.log(JSON.stringify({ schemaVersion: 1, skills: index }, null, 2));
