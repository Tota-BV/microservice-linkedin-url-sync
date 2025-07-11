import { registerGlobalMiddleware } from "@tanstack/react-start";
import {
	createStartHandler,
	defaultStreamHandler,
} from "@tanstack/react-start/server";
import { authMiddleware } from "./lib/auth/auth-middleware";
import { createRouter } from "./router";

console.log("asdsad");

export default createStartHandler({
	createRouter,
})(defaultStreamHandler);

// registerGlobalMiddleware({
// 	middleware: [authMiddleware],
// });
