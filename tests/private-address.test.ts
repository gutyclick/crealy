import assert from "node:assert/strict";
import test from "node:test";

import { isPrivateAddress } from "../src/lib/http/private-address";

test("blocks private, local, reserved and mapped addresses used in SSRF", () => {
  for (const address of ["127.0.0.1", "10.0.0.8", "169.254.169.254", "172.16.0.1", "192.168.1.1", "100.64.0.1", "::1", "fc00::1", "fe80::1", "::ffff:127.0.0.1", "::ffff:7f00:1"]) {
    assert.equal(isPrivateAddress(address), true, address);
  }
});

test("allows ordinary public IPv4 and IPv6 addresses", () => {
  assert.equal(isPrivateAddress("8.8.8.8"), false);
  assert.equal(isPrivateAddress("2606:4700:4700::1111"), false);
});
