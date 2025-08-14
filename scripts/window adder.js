// @ts-nocheck
import * as scripts from "./editor.js";
Object.entries(scripts).forEach(([functionName, functionObj]) => {
    window[functionName] = functionObj;
});
