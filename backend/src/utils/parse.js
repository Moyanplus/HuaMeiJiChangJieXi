function tryParseJson(input) {
  if (typeof input !== "string") return null;
  try {
    return JSON.parse(input);
  } catch (_) {
    return null;
  }
}

function normalizeResponseData(raw) {
  if (typeof raw !== "string") return raw;
  const parsed = tryParseJson(raw);
  return parsed || raw;
}

function normalizeDataField(data) {
  if (typeof data !== "string") return data;
  const parsed = tryParseJson(data);
  return parsed || data;
}

module.exports = {
  tryParseJson,
  normalizeResponseData,
  normalizeDataField,
};
