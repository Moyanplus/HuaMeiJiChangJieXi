const axios = require("axios");
const cfg = require("../core/config");
const { encryptRequest, decryptResponse } = require("../core/cryptoUtils");
const { normalizeResponseData } = require("../utils/parse");

const client = axios.create({
  baseURL: `${cfg.API_BASE_URL}${cfg.API_PREFIX}`,
  headers: cfg.DEFAULT_HEADERS,
  timeout: cfg.TIMEOUT.DEFAULT,
});

function buildTimeout(timeout) {
  return typeof timeout === "number" ? timeout : cfg.TIMEOUT.DEFAULT;
}

async function postEncrypted(endpoint, payload, options = {}) {
  const sdData = encryptRequest(payload);
  const response = await client.post(
    endpoint,
    { sdData },
    {
      headers: options.headers || cfg.DEFAULT_HEADERS,
      timeout: buildTimeout(options.timeout),
    }
  );
  return normalizeResponseData(response && response.data);
}

async function postEncryptedAndDecrypt(endpoint, payload, options = {}) {
  const raw = await postEncrypted(endpoint, payload, options);
  return decryptResponse(raw);
}

module.exports = {
  client,
  postEncrypted,
  postEncryptedAndDecrypt,
};
