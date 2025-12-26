function generateCustomPage(displayName, userData, orderUserName) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${displayName} - 机场贵宾厅权益</title>
    <script defer="defer" src="/frontend/js/chunk-vendors.5de5223d.js"></script>
    <script defer="defer" src="/frontend/js/app.c2845d9d.js"></script>
    <link href="/frontend/css/app.ffac3c6b.css" rel="stylesheet" />
    <script>
      window.CUSTOM_USER_DATA = ${JSON.stringify(userData)};
      window.CUSTOM_USER_NAME = "${displayName}";
      window.ORDER_USER_NAME = "${orderUserName || displayName}";
    </script>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>`;
}

module.exports = {
  generateCustomPage,
};
