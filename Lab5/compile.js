// Transpile app.jsx to app.js using Babel standalone with classic React runtime
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const babelCode = fs.readFileSync(path.join(__dirname, "vendor", "babel.min.js"), "utf8");
const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(babelCode, sandbox);
const Babel = sandbox.Babel || sandbox.window.Babel;

const jsxCode = fs.readFileSync(path.join(__dirname, "app.jsx"), "utf8");
const result = Babel.transform(jsxCode, {
  presets: [
    ["react", { runtime: "classic" }]
  ]
});

fs.writeFileSync(path.join(__dirname, "app.js"), result.code, "utf8");
console.log("Transpiled app.jsx -> app.js with classic runtime successfully.");
