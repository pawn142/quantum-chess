import ts from "typescript";
import path from "path";

const rootDir = "src";
const outDir = "dist";

const configPath = ts.findConfigFile(rootDir, ts.sys.fileExists, "tsconfig.json");

const config = ts.parseJsonConfigFileContent(
	ts.readConfigFile(configPath, ts.sys.readFile).config,
	ts.sys,
	path.dirname(configPath),
	undefined,
	configPath,
);

const program = ts.createProgram({
	rootNames: config.fileNames,
	options: {
		...config.options,
		rootDir: rootDir,
		outDir: outDir,
		noEmit: false,
	},
});

ts.getPreEmitDiagnostics(program).concat(program.emit().diagnostics).forEach(diagnostic => {
	const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
	if (diagnostic.file) {
		const { line, character } = ts.getLineAndCharacterOfPosition(
			diagnostic.file,
			diagnostic.start,
		);
		console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
	} else {
		console.log(message);
	}
});
