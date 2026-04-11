import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { User, UserProfile } from "./usertypes.js";

import { AuthService, AuthError } from "./auth.js";
import type ProfileService from "./profile.js";
import type MatchmakingService from "./matchmaking.js";
import type RatingService from "./rating.js";
import type RoomService from "./room.js";

function mapAuthErrorToStatus(error: AuthError): number {
	switch (error) {
		case AuthError.INVALID_TOKEN: return 401;
		case AuthError.SESSION_EXPIRED: return 401;
		case AuthError.SESSION_REVOKED: return 401;
		case AuthError.USER_NOT_FOUND: return 401;
		case AuthError.ACCOUNT_DISABLED: return 403;
		case AuthError.PROFILE_MISSING: return 500;
		default: return 500;
	}
}

function getAuthErrorMessage(error: AuthError): string {
	switch (error) {
		case AuthError.INVALID_TOKEN: return "Invalid session token";
		case AuthError.SESSION_EXPIRED: return "Session has expired";
		case AuthError.SESSION_REVOKED: return "Session has been revoked";
		case AuthError.USER_NOT_FOUND: return "User not found";
		case AuthError.ACCOUNT_DISABLED: return "Account is disabled";
		case AuthError.PROFILE_MISSING: return "User profile is missing";
		default: return "Authentication failed";
	}
}

async function requireAuth(
	request: FastifyRequest,
	auth: AuthService
): Promise<{ user: { id: string; email: string }; profile: UserProfile }> {
	const token = request.cookies.session;
	if (!token) throw { statusCode: 401, code: AuthError.INVALID_TOKEN, message: "No session token provided" };
	const result = await auth.authenticateSession(token);
	if (!result.valid) {
		const statusCode = mapAuthErrorToStatus(result.error);
		throw { statusCode, code: result.error, message: getAuthErrorMessage(result.error) };
	}
	return result;
}

interface Services {
	auth: AuthService;
	profile: ProfileService;
	matchmaking: MatchmakingService;
	rating: RatingService;
	rooms: RoomService;
}

export default async function registerRoutes(app: FastifyInstance, services: Services): Promise<void> {
	app.post("/auth/signup", async(req: FastifyRequest, reply: FastifyReply) => {
		try {
			return reply.code(201).send(signUp(req, reply, services));
		} catch (err: any) {
			if (err.message?.includes("Email already in use")) return reply.code(409).send({ code: "EMAIL_IN_USE", message: err.message });
			if (err.message?.includes("Invalid signup input")) return reply.code(400).send({ code: "INVALID_INPUT", message: err.message });
			throw err;
		}
	});
	app.post("/auth/login", async(req: FastifyRequest, reply: FastifyReply) => {
		try {
			return reply.send(signUp(req, reply, services));
		} catch (err: any) {
			if (err.message?.includes("Invalid credentials")) return reply.code(401).send({ code: "INVALID_CREDENTIALS", message: "Invalid email or password" });
			throw err;
		}
	});
	app.post("/auth/logout", async(request: FastifyRequest, reply: FastifyReply) => {
		if (request.cookies.session) await services.auth.logout(request.cookies.session);
		reply.clearCookie("session", { path: "/" });
		return reply.code(204).send();
	});
	app.get("/auth/me", async(req: FastifyRequest, reply: FastifyReply) => {
		try {
			return reply.send(await requireAuth(req, services.auth));
		} catch (err: any) {
			return reply.code(err.statusCode || 401).send({ code: err.code, message: err.message });
		}
	});
	app.get("/users/:id", async(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
		const profile = await services.profile.getPublicProfile(req.params.id);
		if (!profile) return reply.code(404).send({ code: "Not found", message: "Profile not found" });
		return reply.send({ profile });
	});
	app.patch("/me/profile", async(req: FastifyRequest, reply: FastifyReply) => {
		try {
			return reply.send({ profile: await services.profile.updateMyProfile((await requireAuth(req, services.auth)).user!.id, req.body as {username?: string; avatarUrl?: string | null}) });
		} catch (err: any) {
			if (err.statusCode) throw err;
			return reply.code(400).send({ code: "BAD_REQUEST", message: err.message });
		}
	});
	app.post("/rooms", async(req: FastifyRequest, reply: FastifyReply) => {
		return reply.code(201).send(await services.rooms.createRoom({ variantId: (req.body as { variantId: string }).variantId, creatorId: (await requireAuth(req, services.auth)).user!.id }));
	});
	app.get("/rooms/:id", async(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
		const state = await services.rooms.getState(req.params.id);
		if (!state) return reply.code(404).send({ code: "Not found", message: "Room not found" });
		return state;
	});
	app.post("/rooms/:id/join", async(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
		await services.rooms.joinRoom({ roomId: req.params.id, userId: (await requireAuth(req, services.auth)).user!.id, role: (req.body as { role: "player" | "spectator" }).role });
		return reply.send({ ok: true });
	});
	app.post("/rooms/:id/move", async(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
		await services.rooms.submitMove({ roomId: req.params.id, userId: (await requireAuth(req, services.auth)).user!.id, move: (req.body as { move: string }).move });
		return reply.send({ ok: true });
	});
	app.post("/queue/join", async(req: FastifyRequest, reply: FastifyReply) => {
		return reply.send(await services.matchmaking.joinQueue({ userId: (await requireAuth(req, services.auth)).user!.id, variantId: (req.body as { variantId: string }).variantId }));
	});
	app.post("/queue/leave", async(req: FastifyRequest, reply: FastifyReply) => {
		await services.matchmaking.leaveQueue({ userId: (await requireAuth(req, services.auth)).user!.id, variantId: (req.body as { variantId: string }).variantId });
		return reply.send({ ok: true });
	});
	app.get("/rooms/:id/events", async(req: FastifyRequest<{ Params: { id: string }; Querystring: { since?: string } }>, reply: FastifyReply) => {
		const since = Number(req.query.since ?? "0");
		return reply.send({ events: await services.rooms.getEventsSince(req.params.id, Number.isFinite(since) ? since : 0) });
	});
}

async function signUp(req: FastifyRequest, reply: FastifyReply, services: Services): Promise<{ user: User; profile: UserProfile }> {
	const result = await services.auth.signUp({
		...req.body as { email: string; password: string; username: string },
		ipAddress: req.ip,
		userAgent: req.headers["user-agent"] ?? null
	});
	reply.setCookie("session", result.sessionToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: 2592000
	});
	return { user: result.user, profile: result.profile };
}
