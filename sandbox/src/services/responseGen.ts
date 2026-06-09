import { faker } from "@faker-js/faker";

type JSONSchema = {
  type?: string | string[];
  format?: string;
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
  required?: string[];
  enum?: unknown[];
  example?: unknown;
  allOf?: JSONSchema[];
  oneOf?: JSONSchema[];
  anyOf?: JSONSchema[];
  nullable?: boolean;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
};

export function generateFromSchema(schema: JSONSchema, fieldName = "", depth = 0): unknown {
  if (!schema || depth > 6) return null;

  // Prefer static examples from the spec
  if (schema.example !== undefined) return schema.example;

  if (schema.enum) return schema.enum[0];

  if (schema.allOf || schema.oneOf || schema.anyOf) {
    const subSchemas = schema.allOf ?? schema.oneOf ?? schema.anyOf ?? [];
    const merged = mergeSchemas(subSchemas);
    return generateFromSchema(merged, fieldName, depth + 1);
  }

  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;

  switch (type) {
    case "object":
      return generateObject(schema, depth);
    case "array":
      return generateArray(schema, fieldName, depth);
    case "string":
      return generateString(schema, fieldName);
    case "integer":
    case "number":
      return generateNumber(schema, fieldName);
    case "boolean":
      return faker.datatype.boolean();
    default:
      // Try to infer from properties
      if (schema.properties) return generateObject(schema, depth);
      return null;
  }
}

function generateObject(schema: JSONSchema, depth: number): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  if (!schema.properties) return obj;

  for (const [key, propSchema] of Object.entries(schema.properties)) {
    obj[key] = generateFromSchema(propSchema, key, depth + 1);
  }

  return obj;
}

function generateArray(schema: JSONSchema, fieldName: string, depth: number): unknown[] {
  if (!schema.items) return [];
  const count = faker.number.int({ min: 1, max: 3 });
  return Array.from({ length: count }, () =>
    generateFromSchema(schema.items!, fieldName, depth + 1)
  );
}

function generateString(schema: JSONSchema, fieldName: string): string {
  const lower = fieldName.toLowerCase();

  switch (schema.format) {
    case "email":        return faker.internet.email();
    case "uuid":         return faker.string.uuid();
    case "date-time":    return faker.date.recent().toISOString();
    case "date":         return faker.date.recent().toISOString().split("T")[0];
    case "uri":          return faker.internet.url();
    case "url":          return faker.internet.url();
    case "hostname":     return faker.internet.domainName();
    case "ipv4":         return faker.internet.ipv4();
    case "password":     return faker.internet.password();
  }

  // Contextual guesses from field name
  if (/name$/i.test(lower))         return faker.person.fullName();
  if (/first.?name/i.test(lower))   return faker.person.firstName();
  if (/last.?name/i.test(lower))    return faker.person.lastName();
  if (/email/i.test(lower))         return faker.internet.email();
  if (/phone/i.test(lower))         return faker.phone.number();
  if (/city/i.test(lower))          return faker.location.city();
  if (/country/i.test(lower))       return faker.location.country();
  if (/address/i.test(lower))       return faker.location.streetAddress();
  if (/zip|postal/i.test(lower))    return faker.location.zipCode();
  if (/company|org/i.test(lower))   return faker.company.name();
  if (/url|href|link/i.test(lower)) return faker.internet.url();
  if (/title/i.test(lower))         return faker.lorem.words(3);
  if (/description|summary|body/i.test(lower)) return faker.lorem.sentence();
  if (/status/i.test(lower))        return "active";
  if (/currency/i.test(lower))      return "USD";
  if (/timezone/i.test(lower))      return "America/New_York";
  if (/language|locale/i.test(lower)) return "en";
  if (/color|colour/i.test(lower))  return faker.color.human();
  if (/id$/i.test(lower))           return faker.string.uuid();

  const minLen = schema.minLength ?? 1;
  const maxLen = schema.maxLength ?? 20;
  return faker.string.alpha({ length: { min: minLen, max: maxLen } });
}

function generateNumber(schema: JSONSchema, fieldName: string): number {
  const min = schema.minimum ?? 0;
  const max = schema.maximum ?? 9999;
  const lower = fieldName.toLowerCase();

  if (/price|amount|total|cost/i.test(lower)) {
    return parseFloat(faker.commerce.price({ min: 1, max: 999 }));
  }
  if (/percent|rate|ratio/i.test(lower)) {
    return faker.number.float({ min: 0, max: 100, fractionDigits: 2 });
  }
  if (/age/i.test(lower)) {
    return faker.number.int({ min: 18, max: 80 });
  }

  if (schema.type === "number") {
    return faker.number.float({ min, max, fractionDigits: 2 });
  }
  return faker.number.int({ min, max });
}

function mergeSchemas(schemas: JSONSchema[]): JSONSchema {
  const merged: JSONSchema = {};
  for (const s of schemas) {
    if (s.properties) {
      merged.properties = { ...(merged.properties ?? {}), ...s.properties };
    }
    if (s.required) {
      merged.required = [...(merged.required ?? []), ...s.required];
    }
    if (!merged.type && s.type) merged.type = s.type;
    if (!merged.format && s.format) merged.format = s.format;
  }
  return merged;
}
