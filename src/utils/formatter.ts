function formatArrayValue(arr: any[]): string {
  if (arr.length === 0) return "";

  // Handle array of objects with code/name (e.g., subdivisions)
  if (typeof arr[0] === "object" && arr[0] !== null) {
    return arr
      .map((item) => {
        if (item.code && item.name) {
          return `${item.code} (${item.name})`;
        }
        return JSON.stringify(item);
      })
      .join(", ");
  }

  // Simple array of primitives
  return arr.join(", ");
}

function flattenObject(obj: any, prefix: string = ""): Array<[string, string]> {
  const result: Array<[string, string]> = [];

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;

    const fullKey = prefix ? `${prefix}_${key}` : key;

    if (Array.isArray(value)) {
      result.push([fullKey, formatArrayValue(value)]);
    } else if (typeof value === "object") {
      // Flatten nested object
      result.push(...flattenObject(value, fullKey));
    } else {
      result.push([fullKey, String(value)]);
    }
  }

  return result;
}

function objectToString(obj: any): string {
  return flattenObject(obj)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

function arrayToString(arr: string[]): string {
  return arr.join("\n");
}

export function formatAsText(data: any) {
  if (Array.isArray(data)) {
    return arrayToString(data);
  } else if (typeof data === "object" && data != null) {
    return objectToString(data);
  } else {
    throw new Error("Unsupported data type for text formatting");
  }
}
