import assert from "node:assert/strict";
import test from "node:test";

import { validateYouTubeAssetUrl } from "../src/lib/youtube/allowed-hosts";
import {
  getVideoThumbnailUrl,
  isYouTubeThumbnailVariant,
} from "../src/lib/youtube/get-video-thumbnails";
import { parseYouTubeChannelUrl } from "../src/lib/youtube/parse-youtube-channel-url";
import {
  parseYouTubeUrl,
  validateYouTubeVideoId,
} from "../src/lib/youtube/parse-youtube-url";

const videoId = "dQw4w9WgXcQ";

test("parses supported YouTube video URL formats", () => {
  assert.equal(parseYouTubeUrl(`https://www.youtube.com/watch?v=${videoId}`), videoId);
  assert.equal(parseYouTubeUrl(`https://youtu.be/${videoId}`), videoId);
  assert.equal(parseYouTubeUrl(`https://youtube.com/shorts/${videoId}`), videoId);
  assert.equal(parseYouTubeUrl(`https://www.youtube.com/embed/${videoId}`), videoId);
});

test("rejects unsafe or malformed video URLs", () => {
  assert.throws(() => parseYouTubeUrl(`https://youtube.com.evil.test/watch?v=${videoId}`));
  assert.throws(() => parseYouTubeUrl(`https://user@youtube.com/watch?v=${videoId}`));
  assert.throws(() => parseYouTubeUrl(`https://youtube.com:8443/watch?v=${videoId}`));
  assert.throws(() => validateYouTubeVideoId("../private"));
});

test("parses only supported YouTube channel references", () => {
  assert.deepEqual(
    parseYouTubeChannelUrl(
      "https://www.youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw",
    ),
    { type: "id", value: "UC_x5XG1OV2P6uZZ5FSM9Ttw" },
  );
  assert.deepEqual(parseYouTubeChannelUrl("https://youtube.com/@GoogleDevelopers"), {
    type: "handle",
    value: "@GoogleDevelopers",
  });
  assert.throws(() => parseYouTubeChannelUrl("https://example.com/@GoogleDevelopers"));
});

test("constructs thumbnail URLs from controlled identifiers", () => {
  assert.equal(
    getVideoThumbnailUrl(videoId, "maxres"),
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
  );
  assert.equal(isYouTubeThumbnailVariant("high"), true);
  assert.equal(isYouTubeThumbnailVariant("../../secret"), false);
});

test("allows only exact YouTube asset hosts and HTTPS", () => {
  assert.equal(
    validateYouTubeAssetUrl("https://i.ytimg.com/vi/id/default.jpg", "thumbnail")
      .hostname,
    "i.ytimg.com",
  );
  assert.throws(() =>
    validateYouTubeAssetUrl(
      "https://i.ytimg.com.attacker.test/vi/id/default.jpg",
      "thumbnail",
    ),
  );
  assert.throws(() =>
    validateYouTubeAssetUrl("http://i.ytimg.com/vi/id/default.jpg", "thumbnail"),
  );
  assert.throws(() =>
    validateYouTubeAssetUrl("https://127.0.0.1/banner.jpg", "banner"),
  );
});
