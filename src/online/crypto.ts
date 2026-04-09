import { createHash, randomBytes, timingSafeEqual } from "crypto";

export default class CryptoService {
	async hashPassword(password: string): Promise<string> {
		return createHash("sha256").update(password).digest("hex");
	}

	async verifyPassword(password: string, hash: string): Promise<boolean> {
		const candidate = await this.hashPassword(password);
		const a = Buffer.from(candidate, "hex");
		const b = Buffer.from(hash, "hex");
		if (a.length !== b.length) return false;
		return timingSafeEqual(a, b);
	}

	generateToken(): string {
		return randomBytes(32).toString("hex");
	}

	hashToken(token: string): string {
		return createHash("sha256").update(token).digest("hex");
	}
}
