import { describe, expect, it } from "vitest";
import { canTransition } from "@/lib/orders/state";
import { fillText, resolveValues, sanitizeValues, validatePhotoCount, validateValues } from "@/lib/personalization";
import { CATALOG } from "@/lib/templates/catalog";
import { templateConfigSchema } from "@/lib/templates/schema";
import { isToken, randomToken } from "@/lib/tokens";
import { hmacHex } from "@/lib/payments/provider";
import { MockProvider } from "@/lib/payments/mock";

const candle = CATALOG.find((t) => t.slug === "bday-candlelight")!;

describe("template catalog", () => {
  it("has three valid Birthday templates", () => {
    expect(CATALOG.filter((t) => t.occasion === "birthday")).toHaveLength(3);
  });
  it("rejects a puzzle that points at an optional photo slot", () => {
    const bad = { ...candle, scenes: [{ id: "p", type: "puzzle", puzzle: "match", photos: [7], title: "x", hint: "y" }] };
    expect(templateConfigSchema.safeParse(bad).success).toBe(false);
  });
  it("rejects a template without recipient_name", () => {
    const bad = { ...candle, fields: candle.fields.filter((f) => f.key !== "recipient_name") };
    expect(templateConfigSchema.safeParse(bad).success).toBe(false);
  });
});

describe("personalization", () => {
  it("requires required fields and enforces limits", () => {
    const e = validateValues(candle, { recipient_name: "", sender_name: "A".repeat(31), age: "200", message: "hi", secret_line: "s" });
    expect(Object.keys(e).sort()).toEqual(["age", "recipient_name", "sender_name"]);
  });
  it("accepts a complete set of values", () => {
    expect(validateValues(candle, { recipient_name: "Riya", sender_name: "Aarav", message: "Hi", secret_line: "Goa" })).toEqual({});
  });
  it("drops keys the template doesn't define and strips control characters", () => {
    const v = sanitizeValues(candle, { recipient_name: " Ri\u0000ya ", evil: "<script>", message: "a\r\nb" });
    expect(v).toEqual({ recipient_name: "Riya", message: "a\nb" });
  });
  it("applies defaults to empty optional fields", () => {
    expect(resolveValues(candle, {}).closing_line).toMatch(/won't face/);
  });
  it("fills placeholders and drops empty ones with their separator", () => {
    expect(fillText("From {{sender_name}}, {{relationship}}", { sender_name: "Aarav" })).toBe("From Aarav");
    expect(fillText("From {{sender_name}}, {{relationship}}", { sender_name: "Aarav", relationship: "your friend" })).toBe("From Aarav, your friend");
  });
  it("checks the photo count", () => {
    expect(validatePhotoCount(candle, 5)).toMatch(/at least 6/);
    expect(validatePhotoCount(candle, 6)).toBeNull();
    expect(validatePhotoCount(candle, 9)).toMatch(/up to 8/);
  });
});

describe("order states", () => {
  it("only allows the documented lifecycle", () => {
    expect(canTransition("DRAFT", "PAID")).toBe(false);
    expect(canTransition("PAYMENT_PENDING", "PAID")).toBe(true);
    expect(canTransition("PAID", "PROCESSING")).toBe(true);
    expect(canTransition("ACTIVE", "DRAFT")).toBe(false);
  });
});

describe("tokens", () => {
  it("are 22 characters, unambiguous and unique", () => {
    const set = new Set(Array.from({ length: 2000 }, () => randomToken()));
    expect(set.size).toBe(2000);
    for (const t of set) expect(isToken(t)).toBe(true);
    expect([...set].join("")).not.toMatch(/[0O1lI]/);
  });
});

describe("webhook signatures", () => {
  it("rejects a tampered body", () => {
    const p = new MockProvider();
    const signed = MockProvider.sign({ type: "payment.captured", providerOrderId: "o1", amountMinor: 100 });
    expect(p.parseWebhook(signed.body, new Headers(signed.headers)).kind).toBe("payment.captured");
    const tampered = signed.body.replace('"amount":100', '"amount":1');
    expect(() => p.parseWebhook(tampered, new Headers(signed.headers))).toThrow();
    expect(hmacHex("k", "a")).not.toBe(hmacHex("k", "b"));
  });
});
