"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const denoifySingleFile_1 = require("../lib/denoifySingleFile");
const typeSafety_1 = require("evt/tools/typeSafety");
const ParsedImportExportStatement_1 = require("../lib/types/ParsedImportExportStatement");
(async () => {
    {
        const sourceCode = `
import 

    * as _ 

from 

"xxx"; import * as foobar from "xxx" import * as d from "xxx";
const ok = 3;
import { } from "xxx";
import * as baz from "xxx";
import * as foo from 'xxx';
import type * as foo from 'xxx';
import type  { Cat } from 'xxx';
import "xxx";

const dd = import("xxx");
const dd = import   (   "xxx"    );

`;
        const expected = `
import * as _ from "xxx"; import * as foobar from "xxx" import * as d from "xxx";
const ok = 3;
import { } from "xxx";
import * as baz from "xxx";
import * as foo from 'xxx';
import type * as foo from 'xxx';
import type { Cat } from 'xxx';
import "xxx";

const dd = import("xxx");
const dd = import("xxx");

`.replace(/xxx/g, "yyy");
        const str = "foo bar";
        const { denoifySingleFile } = denoifySingleFile_1.denoifySingleFileFactory({
            "denoifyImportExportStatement": ({ importExportStatement, fileDirPath }) => {
                typeSafety_1.assert(fileDirPath === str);
                const parsedImportExportStatement = ParsedImportExportStatement_1.ParsedImportExportStatement.parse(importExportStatement);
                typeSafety_1.assert(parsedImportExportStatement.parsedArgument.type === "DEPENDENCY" &&
                    parsedImportExportStatement.parsedArgument.nodeModuleName === "xxx");
                return Promise.resolve(ParsedImportExportStatement_1.ParsedImportExportStatement.stringify({
                    ...parsedImportExportStatement,
                    "parsedArgument": {
                        "type": "URL",
                        "url": "yyy"
                    }
                }));
            }
        });
        await (async () => {
            const modifiedSourceCode = await denoifySingleFile({
                sourceCode,
                "fileDirPath": str
            });
            typeSafety_1.assert(modifiedSourceCode === expected);
            console.log("PASS");
        })();
    }
    {
        const sourceCode = `
console.log(__dirname,__filename);
`;
        const expected = `
const __dirname = (()=>{
    const {url: urlStr}= import.meta;
    const url= new URL(urlStr);
    const __filename = url.protocol === "file:" ? url.pathname : urlStr;
    return __filename.replace(/[/][^/]*$/, '');
})();

const __filename = (()=>{
    const {url: urlStr}= import.meta;
    const url= new URL(urlStr);
    return url.protocol === "file:" ? url.pathname : urlStr;
})();


console.log(__dirname,__filename);
`.replace(/^\n/, "");
        const { denoifySingleFile } = denoifySingleFile_1.denoifySingleFileFactory({
            "denoifyImportExportStatement": () => { throw new Error("never"); }
        });
        await (async () => {
            const modifiedSourceCode = await denoifySingleFile({
                sourceCode,
                "fileDirPath": "whatever"
            });
            typeSafety_1.assert(modifiedSourceCode === expected);
            console.log("PASS");
        })();
    }
    {
        const sourceCode = `
import { Buffer } from "buffer";

Buffer.from("hello");
`;
        const expected = `
import { Buffer } from "https://deno.land/std/xxx/buffer.ts";

Buffer.from("hello");
`;
        const { denoifySingleFile } = denoifySingleFile_1.denoifySingleFileFactory({
            "denoifyImportExportStatement": ({ importExportStatement }) => {
                const parsedImportExportStatement = ParsedImportExportStatement_1.ParsedImportExportStatement.parse(importExportStatement);
                typeSafety_1.assert(parsedImportExportStatement.parsedArgument.type === "DEPENDENCY" &&
                    parsedImportExportStatement.parsedArgument.nodeModuleName === "buffer");
                return Promise.resolve(ParsedImportExportStatement_1.ParsedImportExportStatement.stringify({
                    ...parsedImportExportStatement,
                    "parsedArgument": {
                        "type": "URL",
                        "url": "https://deno.land/std/xxx/buffer.ts"
                    }
                }));
            }
        });
        await (async () => {
            const modifiedSourceCode = await denoifySingleFile({
                sourceCode,
                "fileDirPath": "whatever"
            });
            typeSafety_1.assert(modifiedSourceCode === expected);
            console.log("PASS");
        })();
    }
    {
        const sourceCode = `
Buffer.from("hello");
`;
        const expected = `
import { Buffer } from "https://deno.land/std/xxx/buffer.ts";

Buffer.from("hello");
`.replace(/^\n/, "");
        const { denoifySingleFile } = denoifySingleFile_1.denoifySingleFileFactory({
            "denoifyImportExportStatement": ({ importExportStatement }) => {
                const parsedImportExportStatement = ParsedImportExportStatement_1.ParsedImportExportStatement.parse(importExportStatement);
                typeSafety_1.assert(parsedImportExportStatement.parsedArgument.type === "DEPENDENCY" &&
                    parsedImportExportStatement.parsedArgument.nodeModuleName === "buffer");
                return Promise.resolve(ParsedImportExportStatement_1.ParsedImportExportStatement.stringify({
                    ...parsedImportExportStatement,
                    "parsedArgument": {
                        "type": "URL",
                        "url": "https://deno.land/std/xxx/buffer.ts"
                    }
                }));
            }
        });
        await (async () => {
            const modifiedSourceCode = await denoifySingleFile({
                sourceCode,
                "fileDirPath": "whatever"
            });
            typeSafety_1.assert(modifiedSourceCode === expected);
            console.log("PASS");
        })();
    }
    {
        const sourceCode = `
Buffer`;
        const expected = `
import { Buffer } from "https://deno.land/std/xxx/buffer.ts";

Buffer`.replace(/^\n/, "");
        const { denoifySingleFile } = denoifySingleFile_1.denoifySingleFileFactory({
            "denoifyImportExportStatement": ({ importExportStatement }) => {
                const parsedImportExportStatement = ParsedImportExportStatement_1.ParsedImportExportStatement.parse(importExportStatement);
                typeSafety_1.assert(parsedImportExportStatement.parsedArgument.type === "DEPENDENCY" &&
                    parsedImportExportStatement.parsedArgument.nodeModuleName === "buffer");
                return Promise.resolve(ParsedImportExportStatement_1.ParsedImportExportStatement.stringify({
                    ...parsedImportExportStatement,
                    "parsedArgument": {
                        "type": "URL",
                        "url": "https://deno.land/std/xxx/buffer.ts"
                    }
                }));
            }
        });
        await (async () => {
            const modifiedSourceCode = await denoifySingleFile({
                sourceCode,
                "fileDirPath": "whatever"
            });
            typeSafety_1.assert(modifiedSourceCode === expected);
            console.log("PASS");
        })();
    }
    {
        const sourceCode = `
ArrayBuffer.from("hello");
new BufferSource.foo()
Buffer_name
`;
        const { denoifySingleFile } = denoifySingleFile_1.denoifySingleFileFactory({
            "denoifyImportExportStatement": () => { typeSafety_1.assert(false); }
        });
        await (async () => {
            const modifiedSourceCode = await denoifySingleFile({
                sourceCode,
                "fileDirPath": "whatever"
            });
            typeSafety_1.assert(modifiedSourceCode === sourceCode);
            console.log("PASS");
        })();
    }
})();
//# sourceMappingURL=denoifySingleFile.js.map