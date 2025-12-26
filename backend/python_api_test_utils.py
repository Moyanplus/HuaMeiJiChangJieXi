"""后端接口测试辅助工具。"""

import hashlib
import json
import subprocess
from pathlib import Path
from typing import Any, Dict, Optional


BACKEND_DIR = Path(__file__).resolve().parent


def _run_node(script: str, payload: Optional[Any] = None) -> str:
  """执行 Node.js 片段以复用 JS 加解密与配置逻辑。"""
  process = subprocess.run(
      ["node", "-e", script],
      input="" if payload is None else json.dumps(payload),
      text=True,
      capture_output=True,
      cwd=BACKEND_DIR,
      check=False,
  )
  if process.returncode != 0:
    stderr = process.stderr.strip()
    raise RuntimeError(stderr or "Node helper failed")

  stdout = process.stdout
  if not stdout:
    return ""
  lines = [line for line in stdout.splitlines() if line.strip()]
  return lines[-1] if lines else ""


def load_config() -> Dict[str, Any]:
  """加载后端配置。"""
  script = (
      'const cfg = require("./src/core/config");'
      "process.stdout.write(JSON.stringify(cfg));"
  )
  return json.loads(_run_node(script))


def encrypt_request(payload: Dict[str, Any]) -> str:
  """加密请求体并返回 sdData。"""
  script = """
const { encryptRequest } = require("./src/core/cryptoUtils");
let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  const payload = JSON.parse(input || "{}");
  const sdData = encryptRequest(payload);
  process.stdout.write(sdData);
});
"""
  return _run_node(script, payload)


def decrypt_response(payload: Dict[str, Any]) -> Dict[str, Any]:
  """解密响应数据并返回对象。"""
  script = """
const { decryptResponse } = require("./src/core/cryptoUtils");
let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  const payload = JSON.parse(input || "{}");
  const result = decryptResponse(payload);
  process.stdout.write(JSON.stringify(result));
});
"""
  return json.loads(_run_node(script, payload))


def compute_sign(data: Dict[str, Any], salt: str) -> str:
  """按规则计算签名。"""
  parts = []
  for key in sorted(data):
    value = data[key]
    if isinstance(value, (dict, list)):
      value = json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    elif value is None:
      continue
    else:
      value = str(value).strip()
    if value:
      parts.append(f"{key.lower()}={value}")
  parts.append(salt)
  return hashlib.md5("&".join(parts).encode("utf-8")).hexdigest().upper()
