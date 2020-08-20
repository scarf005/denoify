
import { denoifySingleFileFactory } from "./denoifySingleFile";
import { transformCodebase } from "./transformCodebase";
import { resolveNodeModuleToDenoModuleFactory } from "./resolveNodeModuleToDenoModule";
import * as fs from "fs";
import * as path from "path";
import * as commentJson from "comment-json";
import { denoifyImportExportStatementFactory } from "./denoifyImportExportStatement";
import { isInsideOrIsDir } from "../tools/isInsideOrIsDir";
import { getInstalledVersionPackageJsonFactory } from "./getInstalledVersionPackageJson";
import { toPosix } from "../tools/toPosix"
import * as st from "scripting-tools";
import { id } from "evt/tools/typeSafety";

export async function denoify(
    params: {
        projectPath: string;
        srcDirPath?: string;
    }
) {

    process.chdir(params.projectPath ?? ".");

    const srcDirPath = !!params.srcDirPath ?
        params.srcDirPath :
        ["src", "lib"].find(sourceDirPath => fs.existsSync(sourceDirPath))
        ;

    if (!srcDirPath) {
        throw new Error("No src directory found");
    }

    const packageJsonParsed = JSON.parse(
        fs.readFileSync("package.json")
            .toString("utf8")
    );

    const { tsconfigOutDir } = (() => {

        const parsedTsCompile = commentJson.parse(
            fs.readFileSync("tsconfig.json")
                .toString("utf8")
        );

        const { outDir } = parsedTsCompile["compilerOptions"];

        if (!outDir) {
            throw new Error("tsconfig.json must specify an outDir");
        }

        return {
            "tsconfigOutDir": path.normalize(outDir) // dist/
        };

    })();


    if (!("main" in packageJsonParsed)) {
        //TODO: We shouldn't force users to specify a default export.
        throw new Error([
            "A main field in package.json need to be specified",
            "otherwise we don't know what file the mod.ts should export."
        ].join(" "));
    }

    if (
        !isInsideOrIsDir({
            "dirPath": tsconfigOutDir,
            "fileOrDirPath": path.normalize(packageJsonParsed["main"])
        })
    ) {
        throw new Error(`The package.json main should point to a file inside ${tsconfigOutDir}`)
    }

    const denoDistPath = path.join(
        path.dirname(tsconfigOutDir),
        `deno_${path.basename(tsconfigOutDir)}`
    ); // ./deno_dist

    const { denoifySingleFile } = denoifySingleFileFactory((() => {

        const { getInstalledVersionPackageJson } = getInstalledVersionPackageJsonFactory({
            "projectPath": "."
        });

        const { denoifyImportExportStatement } = denoifyImportExportStatementFactory((() => {

            const { resolveNodeModuleToDenoModule } = resolveNodeModuleToDenoModuleFactory({
                "userProvidedPorts": packageJsonParsed["denoPorts"] ?? {},
                "dependencies": packageJsonParsed["dependencies"] ?? {},
                "devDependencies": packageJsonParsed["devDependencies"] ?? {},
                "log": console.log,
                getInstalledVersionPackageJson
            });

            return id<Parameters<typeof denoifyImportExportStatementFactory>[0]>({
                "getDestDirPath": ({ dirPath }) =>
                    path.join(
                        denoDistPath,
                        path.relative(srcDirPath, dirPath)
                    ),
                resolveNodeModuleToDenoModule,
                "userProvidedReplacerPath": packageJsonParsed["denoifyReplacer"],
                getInstalledVersionPackageJson
            });


        })());

        return { denoifyImportExportStatement };

    })());


    await transformCodebase({
        srcDirPath,
        "destDirPath": denoDistPath,
        "transformSourceCodeString": async ({ sourceCode, filePath }) => {

            if (/\.deno\.tsx?$/i.test(filePath)) {

                const nodeFilePath = filePath.replace(/\.deno\.ts/i, ".ts");

                if (fs.existsSync(nodeFilePath)) {
                    return undefined;
                }

                return {
                    "modifiedSourceCode": sourceCode,
                    "newFileName": path.basename(nodeFilePath)
                };

            }

            if (!/\.(?:ts|tsx|js|jsx)$/i.test(filePath)) {
                return { "modifiedSourceCode": sourceCode };
            }

            const denoVersionFilePath = (() => {

                const split = filePath.split(".");

                split.splice(split.length - 1, 0, "deno");

                return split.join(".");

            })();

            if (fs.existsSync(denoVersionFilePath)) {

                return {
                    "modifiedSourceCode": fs.readFileSync(denoVersionFilePath)
                        .toString("utf8")
                };

            }

            if (
                sourceCode.replace(/^\s*/, "")
                    .startsWith("//@denoify-ignore")
            ) {
                return undefined;
            }

            return {
                "modifiedSourceCode": await denoifySingleFile({
                    sourceCode,
                    "dirPath": path.dirname(filePath)
                })
            };


        }
    });

    {

        const modFilePath = path.join(denoDistPath, "mod.ts");

        if (!fs.existsSync(modFilePath)) {

            fs.writeFileSync(
                path.join(modFilePath),
                Buffer.from(
                    `export * from "${toPosix(
                        path.relative(
                            tsconfigOutDir,
                            path.normalize(packageJsonParsed["main"]) // ./dist/lib/index.js
                        ) // ./lib/index.js
                            .replace(/\.js$/i, ".ts"), // ./deno_dist/lib/index.ts
                    ).replace(/^(:?\.\/)?/, "./")}";`,
                    "utf8"
                )
            );

        }

    }

    for (const fileName of ["README.md", "LICENSE"]) {

        if (!fs.existsSync(fileName)) {
            continue;
        }

        st.fs_move("COPY", ".", denoDistPath, fileName);

    }


}

