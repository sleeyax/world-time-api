function valueToString(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

function objectToString(obj: any): string {
  return Object.entries(obj)
    .filter(([_, value]) => value != null)
    .map(([key, value]) => `${key}: ${valueToString(value)}`)
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
