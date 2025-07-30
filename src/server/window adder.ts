// @ts-nocheck

import * as scripts from "./scripts.js";

Object.entries(scripts).forEach(([functionName, functionObj]: [string, any]) => {
	window[functionName] = functionObj;
});
