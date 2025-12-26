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


def main() -> None:
  cfg = load_config()
  url = f'{cfg["API_BASE_URL"]}{cfg["API_PREFIX"]}{cfg["API_ENDPOINTS"]["COUPON"]}'
  timeout = cfg["TIMEOUT"]["COUPON_REQUEST"] / 1000.0

  while True:
    request_payload = {
        "orderId": "HXZHXYK958784873763766584",
        "smsToken": "HXZHXYKHXZHXYK1990829628704538624",
        # "smsToken": "HXZHXYKHXZHXYK1990819186225561600",
        "sdTimestamp": int(time.time() * 1000),
    }

    sign = compute_sign(request_payload, cfg["REQUEST_SALT"])
    payload_with_sign = {**request_payload, "sign": sign}

    print("\n======================")
    print("📦 请求数据（含 sign）:")
    print(json.dumps(payload_with_sign, indent=2, ensure_ascii=False))

    sd_data = encrypt_request(request_payload)
    print("\n🔐 加密后的 sdData:")
    print(sd_data)

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
      print("❌ 请求失败:", e)
      sys.exit(1)

    try:
      response_data = resp.json()
    except ValueError:
      response_data = resp.text

    if isinstance(response_data, str):
      try:
        response_data = json.loads(response_data)
      except ValueError:
        print("⚠️ 无法解析响应为 JSON:")
        print(response_data)
        sys.exit(1)

    print("\n📥 接口响应（原文）:")
    print(json.dumps(response_data, indent=2, ensure_ascii=False))

    decrypted = decrypt_response(response_data)
    print("\n🔓 解密后的响应数据:")
    print(json.dumps(decrypted, indent=2, ensure_ascii=False))

    print("⏱️ 20 秒后再次调用接口...")
    time.sleep(20)


if __name__ == "__main__":
  main()
