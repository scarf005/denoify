"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("../../lib");
lib_1.makeThisModuleAnExecutableReplacer(async (params) => {
    for (const { replacer } of await Promise.all([
        Promise.resolve().then(() => require("./ipaddr.js"))
    ])) {
        const output = await replacer(params);
        if (output !== undefined) {
            return output;
        }
    }
    return undefined;
});
//# sourceMappingURL=index.js.map