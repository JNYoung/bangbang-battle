import assert from "node:assert/strict";
import test from "node:test";

import { LegalConfig, getDeveloperContactMailtoUrl } from "../legal-config.js";

test("developer contact mailto uses the configured support email", () => {
  const url = new URL(getDeveloperContactMailtoUrl());
  const params = new URLSearchParams(url.search);

  assert.equal(url.protocol, "mailto:");
  assert.equal(url.pathname, LegalConfig.contactEmail);
  assert.match(params.get("subject"), /斗球球/);
  assert.match(params.get("body"), /请描述你遇到的问题/);
  assert.match(params.get("body"), /应用版本/);
});

