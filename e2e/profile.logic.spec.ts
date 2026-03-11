import { expect, test } from "@playwright/test";
import { extractGreetingFirstName } from "../src/lib/profile";

test("extractGreetingFirstName returns first name from full display name", () => {
  expect(extractGreetingFirstName("jane doe")).toBe("Jane");
});

test("extractGreetingFirstName handles single-word names", () => {
  expect(extractGreetingFirstName("MADONNA")).toBe("Madonna");
});

test("extractGreetingFirstName falls back for missing names", () => {
  expect(extractGreetingFirstName("")).toBe("there");
  expect(extractGreetingFirstName("   ")).toBe("there");
  expect(extractGreetingFirstName(null)).toBe("there");
});

test("extractGreetingFirstName normalizes punctuation and separators", () => {
  expect(extractGreetingFirstName("  @john.doe  ")).toBe("John");
  expect(extractGreetingFirstName("o'connor family")).toBe("O'Connor");
});
