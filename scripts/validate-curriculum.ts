import catalog from "../content/curriculum/catalog.json";
import { catalogSchema } from "../lib/schemas/skill";

const parsed = catalogSchema.safeParse(catalog);
if (!parsed.success) {
  console.error(parsed.error.format());
  process.exit(1);
}
console.log(`Validated ${parsed.data.skills.length} curriculum skills.`);
