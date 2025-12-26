const QR = require("qrcode");
const cfg = require("../core/config");

async function generateQrData(code) {
  if (!code) return null;
  return QR.toDataURL(String(code), {
    width: cfg.QR_CODE.WIDTH,
    margin: cfg.QR_CODE.MARGIN,
    errorCorrectionLevel: cfg.QR_CODE.ERROR_CORRECTION_LEVEL,
    version: cfg.QR_CODE.VERSION,
  });
}

module.exports = {
  generateQrData,
};
