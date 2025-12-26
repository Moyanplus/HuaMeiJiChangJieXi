import json
import sys
import time

import requests

from python_api_test_utils import (
    compute_sign,
    decrypt_response,
    encrypt_request,
    load_config,
)


def build_payload() -> dict:
  return {
      "orderId": "HXZHXYK958784873763766584",
      "sdTimestamp": int(time.time() * 1000),
  }


def main() -> None:
  cfg = load_config()
  payload = build_payload()

  sign = compute_sign(payload, cfg["REQUEST_SALT"])
  payload_with_sign = {**payload, "sign": sign}

  print("📦 发送短信请求数据（含 sign）:")
  print(json.dumps(payload_with_sign, indent=2, ensure_ascii=False))

  sd_data = encrypt_request(payload)
  print("\n🔐 加密后的 sdData:")
  print(sd_data)

  url = f'{cfg["API_BASE_URL"]}{cfg["API_PREFIX"]}/sms/send'
  timeout = cfg["TIMEOUT"]["DEFAULT"] / 1000.0
  print("\n🚀 请求接口:", url)

  try:
    resp = requests.post(
        url,
        json={"sdData": sd_data},
        headers=cfg["DEFAULT_HEADERS"],
        timeout=timeout,
    )
    resp.raise_for_status()
  except Exception as e:
    print("❌ 短信发送请求失败:", e)
    if hasattr(e, "response") and e.response is not None:
      print("响应内容:", e.response.text)
    sys.exit(1)

  try:
    data = resp.json()
  except ValueError:
    data = resp.text

  if isinstance(data, str):
    try:
      data = json.loads(data)
    except ValueError:
      print("⚠️ 无法解析响应为 JSON:")
      print(data)
      sys.exit(1)

  print("\n📥 接口响应（原文）:")
  print(json.dumps(data, indent=2, ensure_ascii=False))

  decrypted = decrypt_response(data)
  print("\n🔓 解密后的响应数据:")
  print(json.dumps(decrypted, indent=2, ensure_ascii=False))


if __name__ == "__main__":
  main()
