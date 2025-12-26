const LEVELS = ["debug", "info", "warn", "error"];

const LOG_LEVEL = process.env.LOG_LEVEL || "info";
const MIN_LEVEL_INDEX = Math.max(0, LEVELS.indexOf(LOG_LEVEL));

function shouldLog(level) {
  return LEVELS.indexOf(level) >= MIN_LEVEL_INDEX;
}

function formatMessage(level, message, meta) {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  if (!meta) return base;
  return `${base} ${typeof meta === "string" ? meta : JSON.stringify(meta)}`;
}

function log(level, message, meta) {
  if (!shouldLog(level)) return;
  const line = formatMessage(level, message, meta);
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.log(line);
}

const logger = {
  debug: (message, meta) => log("debug", message, meta),
  info: (message, meta) => log("info", message, meta),
  warn: (message, meta) => log("warn", message, meta),
  error: (message, meta) => log("error", message, meta),
};

module.exports = logger;
