/* eslint-disable space-before-function-paren */
// @ts-nocheck

import { ApiClient } from "./api.js";

const api = new ApiClient(import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000");

const els = {
	signupForm: document.querySelector<HTMLFormElement>("#signup-form"),
	loginForm: document.querySelector<HTMLFormElement>("#login-form"),
	meButton: document.querySelector<HTMLButtonElement>("#me-button"),
	createRoomButton: document.querySelector<HTMLButtonElement>("#create-room-button"),
	joinQueueButton: document.querySelector<HTMLButtonElement>("#join-queue-button"),
	roomIdInput: document.querySelector<HTMLInputElement>("#room-id"),
	moveInput: document.querySelector<HTMLInputElement>("#move-input"),
	submitMoveButton: document.querySelector<HTMLButtonElement>("#submit-move-button"),
	output: document.querySelector<HTMLPreElement>("#output")
};

function print(value: unknown): void {
	if (!els.output) return;
	els.output.textContent = JSON.stringify(value);
}

function textInput(form: HTMLFormElement, name: string): string {
	const el = form.querySelector<HTMLInputElement>(`[name="${name}"]`);
	return el?.value.trim() ?? "";
}

els.signupForm?.addEventListener("submit", async (event) => {
	event.preventDefault();
	try {
		const result = await api.signup({
			email: textInput(els.signupForm!, "email"),
			password: textInput(els.signupForm!, "password"),
			username: textInput(els.signupForm!, "displayName")
		});
		print({ action: "signup", result });
	} catch (error) {
		print({ action: "signup", error: String(error) });
	}
});

els.loginForm?.addEventListener("submit", async (event) => {
	event.preventDefault();
	try {
		const result = await api.login({
			email: textInput(els.loginForm!, "email"),
			password: textInput(els.loginForm!, "password")
		});
		print({ action: "login", result });
	} catch (error) {
		print({ action: "login", error: String(error) });
	}
});

els.meButton?.addEventListener("click", async () => {
	try {
		const result = await api.me();
		print({ action: "me", result });
	} catch (error) {
		print({ action: "me", error: String(error) });
	}
});

els.createRoomButton?.addEventListener("click", async () => {
	try {
		const result = await api.createRoom({ variantId: "standard" });
		if (els.roomIdInput) els.roomIdInput.value = result.roomId;
		print({ action: "createRoom", result });
	} catch (error) {
		print({ action: "createRoom", error: String(error) });
	}
});

els.joinQueueButton?.addEventListener("click", async () => {
	try {
		const result = await api.joinQueue("standard");
		print({ action: "joinQueue", result });
	} catch (error) {
		print({ action: "joinQueue", error: String(error) });
	}
});
