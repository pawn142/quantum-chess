import { createHash, randomBytes } from "crypto";
import bcrypt from "bcrypt";

export default class CryptoService {
	async hashPassword(password: string): Promise<string> {
		return bcrypt.hash(password, 10);
	}

	async verifyPassword(password: string, hash: string): Promise<boolean> {
		return bcrypt.compare(password, hash);
	}
	generateToken(): string {
		return randomBytes(32).toString("hex");
	}

	hashToken(token: string): string {
		return createHash("sha256").update(token).digest("hex");
	}
}
