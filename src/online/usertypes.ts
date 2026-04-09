export interface User {
	id: string;
	email: string;
	passwordHash: string | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface UserProfile {
	userId: string;
	username: string;
	avatarUrl: string | null;
	rating: number;
	wins: number;
	losses: number;
	draws: number;
	createdAt: string;
	updatedAt: string;
}

export interface Session {
	id: string;
	userId: string;
	sessionTokenHash: string;
	createdAt: string;
	expiresAt: string;
	revokedAt: string | null;
	ipAddress: string | null;
	userAgent: string | null;
}

export interface Room {
	id: string;
	variantId: string;
	status: "open" | "active" | "finished";
	whiteUserId: string;
	blackUserId: string;
	createdAt: string;
	updatedAt: string;
}

export interface RoomEvent {
	id: string;
	roomId: string;
	seq: number;
	eventType: "move" | "chat" | "join" | "leave" | "state";
	payloadJSON: string;
	createdAt: string;
}
