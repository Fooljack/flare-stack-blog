import { describe, expect, it } from "vitest";
import { buildCanonicalHref, canonicalLink } from "@/lib/seo";

describe("seo helpers", () => {
  it("should normalize trailing slashes for canonical paths", () => {
    expect(buildCanonicalHref("/posts/")).toBe("/posts");
    expect(buildCanonicalHref("/")).toBe("/");
  });

  it("should include only defined query params", () => {
    expect(
      buildCanonicalHref("/posts/", {
        tagName: "TypeScript",
        empty: undefined,
      }),
    ).toBe("/posts?tagName=TypeScript");
  });

  it("should build canonical link descriptors", () => {
    expect(canonicalLink("/post/hello-world")).toEqual({
      rel: "canonical",
      href: "/post/hello-world",
    });
  });
});
