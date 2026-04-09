export type Credentials = {
	email: string;
	password: string;
};

export type SignupInput = Credentials & {
	username: string;
};

export type ProfileUpdateInput = {
	displayName?: string;
	avatarUrl?: string | null;
};

export type RoomCreateInput = {
	variantId: string;
};

export type RoomJoinInput = {
	role: "player" | "spectator";
};

export type MoveInput = {
	move: string;
};

export type AuthResult = {
	user: {
		id: string;
		email: string;
		status: string;
		createdAt: string;
		updatedAt: string;
	};
	profile: {
		userId: string;
		displayName: string;
		avatarUrl: string | null;
		rating: number;
		wins: number;
		losses: number;
		draws: number;
		createdAt: string;
		updatedAt: string;
	};
};

export type RoomState = {
	room: {
		id: string;
		variantId: string;
		status: "open" | "active" | "finished";
		whiteUserId: string | null;
		blackUserId: string | null;
		createdAt: string;
		updatedAt: string;
	};
	events: Array<{
		id: string;
		roomId: string;
		seq: number;
		eventType: "move" | "chat" | "join" | "leave" | "state";
		payload: unknown;
		createdAt: string;
	}>;
};

export class ApiClient {
	constructor(private baseUrl: string) {}

	private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
		const response = await fetch(`${this.baseUrl}${path}`, {
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
				...(init.headers ?? {})
			},
			...init
		});
		if (!response.ok) {
			const text = await response.text().catch(() => "");
			throw new Error(text || `Request failed with status ${response.status}`);
		}
		if (response.status === 204) {
			return undefined as T;
		}
		return (await response.json()) as T;
	}

	signup(input: SignupInput): Promise<AuthResult> {
		return this.request<AuthResult>("/auth/signup", {
			method: "POST",
			body: JSON.stringify(input)
		});
	}

	login(input: Credentials): Promise<AuthResult> {
		return this.request<AuthResult>("/auth/login", {
			method: "POST",
			body: JSON.stringify(input)
		});
	}

	logout(): Promise<{ ok: true }> {
		return this.request<{ ok: true }>("/auth/logout", {
			method: "POST"
		});
	}

	me(): Promise<AuthResult> {
		return this.request<AuthResult>("/auth/me", {
			method: "GET"
		});
	}

	updateProfile(input: ProfileUpdateInput): Promise<{ profile: AuthResult["profile"] }> {
		return this.request<{ profile: AuthResult["profile"] }>("/me/profile", {
			method: "PATCH",
			body: JSON.stringify(input)
		});
	}

	createRoom(input: RoomCreateInput): Promise<{ roomId: string }> {
		return this.request<{ roomId: string }>("/rooms", {
			method: "POST",
			body: JSON.stringify(input)
		});
	}

	joinRoom(roomId: string, input: RoomJoinInput): Promise<{ ok: true }> {
		return this.request<{ ok: true }>(`/rooms/${encodeURIComponent(roomId)}/join`, {
			method: "POST",
			body: JSON.stringify(input)
		});
	}

	submitMove(roomId: string, input: MoveInput): Promise<{ ok: true }> {
		return this.request<{ ok: true }>(`/rooms/${encodeURIComponent(roomId)}/move`, {
			method: "POST",
			body: JSON.stringify(input)
		});
	}

	getRoom(roomId: string): Promise<RoomState> {
		return this.request<RoomState>(`/rooms/${encodeURIComponent(roomId)}`, {
			method: "GET"
		});
	}

	getRoomEvents(roomId: string, since = 0): Promise<{ events: RoomState["events"] }> {
		return this.request<{ events: RoomState["events"] }>(
			`/rooms/${encodeURIComponent(roomId)}/events?since=${encodeURIComponent(String(since))}`,
			{ method: "GET" }
		);
	}

	joinQueue(variantId: string): Promise<{ queued: true }> {
		return this.request<{ queued: true }>("/queue/join", {
			method: "POST",
			body: JSON.stringify({ variantId })
		});
	}

	leaveQueue(variantId: string): Promise<{ ok: true }> {
		return this.request<{ ok: true }>("/queue/leave", {
			method: "POST",
			body: JSON.stringify({ variantId })
		});
	}
}
