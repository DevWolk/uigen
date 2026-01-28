import { test, expect, vi, beforeEach, afterEach } from "vitest";

// Mock server-only (it throws in non-server environments)
vi.mock("server-only", () => ({}));

// Use vi.hoisted to ensure mocks are available when vi.mock factories run
const { mockSign, mockSetProtectedHeader, mockSetExpirationTime, mockSetIssuedAt, mockCookieStore, mockSignJWT, mockJwtVerify } = vi.hoisted(() => {
  const mockSign = vi.fn().mockResolvedValue("mock-jwt-token");
  const mockSetProtectedHeader = vi.fn().mockReturnThis();
  const mockSetExpirationTime = vi.fn().mockReturnThis();
  const mockSetIssuedAt = vi.fn().mockReturnThis();
  const mockSignJWT = vi.fn().mockImplementation(() => ({
    setProtectedHeader: mockSetProtectedHeader,
    setExpirationTime: mockSetExpirationTime,
    setIssuedAt: mockSetIssuedAt,
    sign: mockSign,
  }));
  const mockCookieStore = {
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  };
  const mockJwtVerify = vi.fn();
  return { mockSign, mockSetProtectedHeader, mockSetExpirationTime, mockSetIssuedAt, mockCookieStore, mockSignJWT, mockJwtVerify };
});

vi.mock("jose", () => ({
  SignJWT: mockSignJWT,
  jwtVerify: mockJwtVerify,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

import { createSession, getSession } from "../auth";

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

test("createSession creates a JWT token with correct payload", async () => {
  await createSession("user-123", "test@example.com");

  expect(mockSetProtectedHeader).toHaveBeenCalledWith({ alg: "HS256" });
  expect(mockSetExpirationTime).toHaveBeenCalledWith("7d");
  expect(mockSetIssuedAt).toHaveBeenCalled();
  expect(mockSign).toHaveBeenCalled();
});

test("createSession sets cookie with correct options", async () => {
  await createSession("user-123", "test@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledWith(
    "auth-token",
    "mock-jwt-token",
    expect.objectContaining({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    })
  );
});

test("createSession sets cookie expiration to 7 days", async () => {
  const beforeCall = Date.now();
  await createSession("user-123", "test@example.com");
  const afterCall = Date.now();

  const callArgs = mockCookieStore.set.mock.calls[0];
  const cookieOptions = callArgs[2];
  const expiresAt = cookieOptions.expires.getTime();

  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  expect(expiresAt).toBeGreaterThanOrEqual(beforeCall + sevenDaysMs - 1000);
  expect(expiresAt).toBeLessThanOrEqual(afterCall + sevenDaysMs + 1000);
});

test("createSession passes userId and email to SignJWT payload", async () => {
  await createSession("user-456", "john@example.com");

  expect(mockSignJWT).toHaveBeenCalledWith(
    expect.objectContaining({
      userId: "user-456",
      email: "john@example.com",
    })
  );
});

test("createSession includes expiresAt in JWT payload", async () => {
  const beforeCall = Date.now();
  await createSession("user-123", "test@example.com");

  const signJWTCall = mockSignJWT.mock.calls[0][0];
  const expiresAt = new Date(signJWTCall.expiresAt).getTime();

  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  expect(expiresAt).toBeGreaterThanOrEqual(beforeCall + sevenDaysMs - 1000);
});

test("createSession uses correct cookie name", async () => {
  await createSession("user-123", "test@example.com");

  const cookieName = mockCookieStore.set.mock.calls[0][0];
  expect(cookieName).toBe("auth-token");
});

test("createSession sets secure flag to false in non-production", async () => {
  await createSession("user-123", "test@example.com");

  const cookieOptions = mockCookieStore.set.mock.calls[0][2];
  expect(cookieOptions.secure).toBe(false);
});

test("createSession works with different user credentials", async () => {
  await createSession("another-user-id", "another@email.org");

  expect(mockSignJWT).toHaveBeenCalledWith(
    expect.objectContaining({
      userId: "another-user-id",
      email: "another@email.org",
    })
  );

  expect(mockCookieStore.set).toHaveBeenCalledWith(
    "auth-token",
    "mock-jwt-token",
    expect.any(Object)
  );
});

test("createSession stores the generated token in cookie", async () => {
  mockSign.mockResolvedValueOnce("custom-generated-token");

  await createSession("user-123", "test@example.com");

  const tokenInCookie = mockCookieStore.set.mock.calls[0][1];
  expect(tokenInCookie).toBe("custom-generated-token");
});

test("createSession signs token with JWT secret", async () => {
  await createSession("user-123", "test@example.com");

  expect(mockSign).toHaveBeenCalledTimes(1);
  const signArg = mockSign.mock.calls[0][0];
  expect(signArg.constructor.name).toBe("Uint8Array");
  expect(signArg.length).toBeGreaterThan(0);
});

// getSession tests
test("getSession returns null when no token cookie exists", async () => {
  mockCookieStore.get.mockReturnValue(undefined);

  const session = await getSession();

  expect(session).toBeNull();
  expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
});

test("getSession returns null when cookie value is undefined", async () => {
  mockCookieStore.get.mockReturnValue({ value: undefined });

  const session = await getSession();

  expect(session).toBeNull();
});

test("getSession returns session payload when token is valid", async () => {
  const mockPayload = {
    userId: "user-123",
    email: "test@example.com",
    expiresAt: new Date(),
  };

  mockCookieStore.get.mockReturnValue({ value: "valid-token" });
  mockJwtVerify.mockResolvedValue({
    payload: mockPayload,
    protectedHeader: { alg: "HS256" },
  });

  const session = await getSession();

  expect(session).toEqual(mockPayload);
  expect(mockJwtVerify).toHaveBeenCalledTimes(1);
  expect(mockJwtVerify.mock.calls[0][0]).toBe("valid-token");
  // Secret is passed as Uint8Array
  const secret = mockJwtVerify.mock.calls[0][1];
  expect(secret.constructor.name).toBe("Uint8Array");
});

test("getSession returns null when token verification fails", async () => {
  mockCookieStore.get.mockReturnValue({ value: "invalid-token" });
  mockJwtVerify.mockRejectedValue(new Error("Invalid token"));

  const session = await getSession();

  expect(session).toBeNull();
});

test("getSession returns null when token is expired", async () => {
  mockCookieStore.get.mockReturnValue({ value: "expired-token" });
  mockJwtVerify.mockRejectedValue(new Error("Token expired"));

  const session = await getSession();

  expect(session).toBeNull();
});

test("getSession verifies token with correct secret", async () => {
  mockCookieStore.get.mockReturnValue({ value: "some-token" });
  mockJwtVerify.mockResolvedValue({
    payload: { userId: "user-123", email: "test@example.com", expiresAt: new Date() },
    protectedHeader: { alg: "HS256" },
  });

  await getSession();

  expect(mockJwtVerify).toHaveBeenCalledTimes(1);
  const secretArg = mockJwtVerify.mock.calls[0][1];
  expect(secretArg.constructor.name).toBe("Uint8Array");
});
