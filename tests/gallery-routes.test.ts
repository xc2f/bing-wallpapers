import assert from "node:assert/strict";
import test from "node:test";
import LegacyWaterfallPage from "../app/[locale]/waterfall/page";
import { generateMetadata } from "../app/[locale]/page";
import { siteUrl } from "../lib/seo";

test("legacy waterfall URLs permanently redirect with filters and restoration batch", async () => {
  await assert.rejects(LegacyWaterfallPage({
    params: Promise.resolve({ locale: "zh" }),
    searchParams: Promise.resolve({ q: "lake", country: "US", page: "3", mode: "images" }),
  }), (error: unknown) => {
    assert.equal((error as { digest: string }).digest, "NEXT_REDIRECT;replace;/zh?q=lake&country=US&page=3;308;");
    return true;
  });
});

test("gallery restoration batches canonicalize to the homepage and filters remain noindex", async () => {
  const metadata = await generateMetadata({
    params: Promise.resolve({ locale: "zh" }),
    searchParams: Promise.resolve({ page: "3" }),
  });
  assert.equal(metadata.alternates?.canonical, siteUrl("/zh"));
  assert.equal((metadata.robots as { index: boolean }).index, true);
  const filtered = await generateMetadata({
    params: Promise.resolve({ locale: "zh" }),
    searchParams: Promise.resolve({ q: "lake", page: "3" }),
  });
  assert.equal(filtered.alternates?.canonical, siteUrl("/zh"));
  assert.equal((filtered.robots as { index: boolean }).index, false);
});
