
import { denoifySourceCodeStringFactory } from "./denoifySourceCodeStringFactory";
import { transformCodebase } from "./transformCodebase";
import { getDenoDependencyFactory, DenoDependencies } from "./getDenoDependencyFactory";

export async function run(
    params: {
        srcDirPath: string;
        destDirPath: string;
        nodeModuleDirPath: string;
        denoDependencies: DenoDependencies;
    }
) {

    const { srcDirPath, destDirPath, nodeModuleDirPath, denoDependencies } = params;

    const { denoifySourceCodeString } = denoifySourceCodeStringFactory(
        getDenoDependencyFactory({
            nodeModuleDirPath,
            denoDependencies
        })
    );

    await transformCodebase({
        srcDirPath,
        destDirPath,
        "transformSourceCodeString": ({ extension, sourceCode }) =>
            /^\.ts$/i.test(extension) || /^\.js$/i.test(extension) ?
                denoifySourceCodeString({ sourceCode })
                :
                Promise.resolve(sourceCode)
    });

}
