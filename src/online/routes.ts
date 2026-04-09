import type { FastifyReply, FastifyRequest } from "fastify";

import type AuthService from "./auth.js";
import type ProfileService from "./profile.js";
import type MatchmakingService from "./matchmaking.js";
import type RatingService from "./rating.js";
import type RoomService from "./room.js";

export interface Services {
	auth: AuthService;
	profile: ProfileService;
	matchmaking: MatchmakingService;
	rating: RatingService;
	rooms: RoomService;
}

export async function registerRoutes(app: import("fastify").FastifyInstance, services: Services): Promise<void> {
	app.get("/health", async() => ({ ok: true }));
	const login = async(req: FastifyRequest, reply: FastifyReply) => {
		const result = await services.auth.signUp({
			...req.body as { email: string; password: string; username: string },
			ipAddress: req.ip,
			userAgent: req.headers["user-agent"] ?? null
		});
		setSessionCookie(reply, result.sessionToken);
		return { user: result.user, profile: result.profile };
	};
	app.post("/auth/signup", login);
	app.post("/auth/login", login);
	app.post("/auth/logout", async(request: FastifyRequest, reply: FastifyReply) => {
		if (request.cookies.session) await services.auth.logout(request.cookies.session);
		clearSessionCookie(reply);
		return { ok: true };
	});
	app.get("/auth/me", async(req: FastifyRequest, reply: FastifyReply) => {
		const session = await requireSession(req, services.auth);
		if (!session) return reply.code(401).send({ error: "Unauthorized" });
		return session;
	});
	app.get("/users/:id", async(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
		const profile = await services.profile.getPublicProfile(req.params.id);
		if (!profile) return reply.code(404).send({ error: "Not found" });
		return { profile };
	});
	app.patch("/me/profile", async(req: FastifyRequest, reply: FastifyReply) => {
		const session = await requireSession(req, services.auth);
		if (!session) return reply.code(401).send({ error: "Unauthorized" });
		const profile = await services.profile.updateMyProfile(session.user.id, req.body as {username?: string; avatarUrl?: string | null});
		return { profile };
	});
	app.post("/queue/join", async(req: FastifyRequest, reply: FastifyReply) => {
		const session = await requireSession(req, services.auth);
		if (!session) return reply.code(401).send({ error: "Unauthorized" });
		return await services.matchmaking.joinQueue({ userId: session.user.id, variantId: (req.body as { variantId: string }).variantId });
	});
	app.post("/queue/leave", async(req: FastifyRequest, reply: FastifyReply) => {
		const session = await requireSession(req, services.auth);
		if (!session) return reply.code(401).send({ error: "Unauthorized" });
		await services.matchmaking.leaveQueue({ userId: session.user.id, variantId: (req.body as { variantId: string }).variantId });
		return { ok: true };
	});
	app.post("/rooms", async(req: FastifyRequest, reply: FastifyReply) => {
		const session = await requireSession(req, services.auth);
		if (!session) return reply.code(401).send({ error: "Unauthorized" });
		return reply.code(201).send(await services.rooms.createRoom({ variantId: (req.body as { variantId: string }).variantId, creatorId: session.user.id }));
	});
	app.post("/rooms/:id/join", async(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
		const session = await requireSession(req, services.auth);
		if (!session) return reply.code(401).send({ error: "Unauthorized" });
		await services.rooms.joinRoom({ roomId: req.params.id, userId: session.user.id, role: (req.body as { role: "player" | "spectator" }).role });
		return { ok: true };
	});
	app.post("/rooms/:id/move", async(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
		const session = await requireSession(req, services.auth);
		if (!session) return reply.code(401).send({ error: "Unauthorized" });
		await services.rooms.submitMove({ roomId: req.params.id, userId: session.user.id, move: (req.body as { move: string }).move });
		return { ok: true };
	});
	app.get("/rooms/:id", async(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
		const state = await services.rooms.getState(req.params.id);
		if (!state) return reply.code(404).send({ error: "Not found" });
		return state;
	});
	app.get("/rooms/:id/events", async(req: FastifyRequest<{ Params: { id: string }; Querystring: { since?: string } }>, __reply: FastifyReply) => {
		const since = Number(req.query.since ?? "0");
		const events = await services.rooms.getEventsSince(req.params.id, Number.isFinite(since) ? since : 0);
		return { events };
	});
}

async function requireSession(req: FastifyRequest, auth: AuthService) {
	if (!req.cookies.session) return null;
	return auth.authenticateSession(req.cookies.session);
}

function setSessionCookie(reply: FastifyReply, token: string): void {
	reply.setCookie("session", token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: 2592000
	});
}

function clearSessionCookie(reply: FastifyReply): void {
	reply.clearCookie("session", { path: "/" });
}
