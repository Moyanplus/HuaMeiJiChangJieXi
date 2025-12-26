const CryptoJS = require("crypto-js");
const { sm2 } = require("sm-crypto");
const cfg = require("./config");

const REQUEST_SALT = cfg.REQUEST_SALT;
const RESPONSE_SALT = cfg.RESPONSE_SALT;
const SM2_PUBLIC_KEY = cfg.SM2_PUBLIC_KEY;
const SM2_PRIVATE_KEY = cfg.SM2_PRIVATE_KEY;

function computeSign(input, salt) {
  if (typeof input === "string") {
    return CryptoJS.MD5(input).toString();
  }
  if (input && typeof input === "object") {
    const parts = [];
    const keys = Object.keys(input).sort();
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      let value = input[key];
      if (value && typeof value === "object") {
        value = JSON.stringify(value);
      }
      if (value !== "" && value !== null && value !== undefined) {
        const trimmed = String(value).trim();
        if (trimmed) parts.push(`${key.toLowerCase()}=${trimmed}`);
      }
    }
    parts.push(salt);
    return CryptoJS.MD5(parts.join("&")).toString().toUpperCase();
  }
  return "";
}

function verifyResponseSign(payloadWithoutSign, sign) {
  return computeSign(payloadWithoutSign, RESPONSE_SALT) === sign;
}

function encryptRequest(data) {
  if (data && data.sdData) return data.sdData;

  if (data && typeof data === "object") {
    Object.assign(data, { sign: computeSign(data, REQUEST_SALT) });
  }

  const json = JSON.stringify(data);
  const cipherHex = sm2.doEncrypt(json, SM2_PUBLIC_KEY, 1);
  return `04${cipherHex}`;
}

function decryptResponse(input) {
  const { sdData = "" } = input || {};
  if (!sdData || typeof sdData !== "string") return input;

  const cipher = sdData.startsWith("04") ? sdData.slice(2) : sdData;
  const plain = sm2.doDecrypt(cipher, SM2_PRIVATE_KEY, 1);

  const obj = JSON.parse(plain);
  const { sign, ...rest } = obj;

  if (!verifyResponseSign(rest, sign)) {
    throw new Error("验签失败");
  }

  try {
    if (typeof obj === "string") {
      const parsed = JSON.parse(obj);
      if (parsed && parsed.data) {
        return { ...parsed, data: JSON.parse(parsed.data) };
      }
      return parsed;
    }
    if (obj && typeof obj.data === "string") {
      return { ...obj, data: JSON.parse(obj.data) };
    }
    return obj;
  } catch (e) {
    return { data: plain };
  }
}

module.exports = {
  computeSign,
  verifyResponseSign,
  encryptRequest,
  decryptResponse,
  REQUEST_SALT,
  RESPONSE_SALT,
  SM2_PUBLIC_KEY,
  SM2_PRIVATE_KEY,
};
