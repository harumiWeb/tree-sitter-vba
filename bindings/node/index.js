const path = require("node:path");

const root = path.join(__dirname, "..", "..");
module.exports = require("node-gyp-build")(root);

try {
  module.exports.nodeTypeInfo = require("../../vba/src/node-types.json");
} catch (_) {}
