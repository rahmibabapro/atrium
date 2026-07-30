import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { bbcodeToMarkdown } from "../bbcode";
import {
  parseValueTuples,
  parseXenForoDump,
  xenforoSlug,
} from "../xenforo-dump";

describe("bbcode → markdown", () => {
  it("converts common tags", () => {
    assert.equal(bbcodeToMarkdown("[b]bold[/b] [i]it[/i] [s]gone[/s]"), "**bold** *it* ~~gone~~");
    assert.equal(
      bbcodeToMarkdown("[url=https://x.test/a]link[/url]"),
      "[link](https://x.test/a)",
    );
    assert.equal(bbcodeToMarkdown("[img]https://x.test/i.png[/img]"), "https://x.test/i.png");
  });

  it("converts quotes with attribution", () => {
    const md = bbcodeToMarkdown('[quote="alice, post: 5"]hello there[/quote]');
    assert.ok(md.includes("> **alice said:**"));
    assert.ok(md.includes("> hello there"));
  });

  it("converts code blocks and lists", () => {
    const md = bbcodeToMarkdown("[code=php]echo 1;[/code]\n[list]\n[*]a\n[*]b\n[/list]");
    assert.ok(md.includes("```\necho 1;\n```"));
    assert.ok(md.includes("- a"));
    assert.ok(md.includes("- b"));
  });

  it("converts ordered lists and media", () => {
    const md = bbcodeToMarkdown("[list=1][*]first[*]second[/list] [media=youtube]abc123[/media]");
    assert.ok(md.includes("1. first"));
    assert.ok(md.includes("2. second"));
    assert.ok(md.includes("https://www.youtube.com/watch?v=abc123"));
  });

  it("strips presentation-only tags but keeps content", () => {
    assert.equal(
      bbcodeToMarkdown("[size=5][color=red][center]big red[/center][/color][/size]"),
      "big red",
    );
    assert.equal(bbcodeToMarkdown("[USER=7]jane[/USER]"), "jane");
  });

  it("handles nesting", () => {
    const md = bbcodeToMarkdown("[quote][b]strong[/b] inside[/quote]");
    assert.ok(md.includes("> **strong** inside"));
  });
});

describe("mysql dump tokenizer", () => {
  it("parses tuples with escapes, NULLs, numbers", () => {
    const tuples = parseValueTuples(
      "(1,'a\\'b',NULL,3.5),(2,'line\\nbreak','x''y',0)",
    );
    assert.deepEqual(tuples[0], [1, "a'b", null, 3.5]);
    assert.deepEqual(tuples[1], [2, "line\nbreak", "x'y", 0]);
  });

  it("handles parens and commas inside strings", () => {
    const tuples = parseValueTuples("(1,'has (parens), and commas')");
    assert.deepEqual(tuples[0], [1, "has (parens), and commas"]);
  });
});

describe("xenforo dump parser", () => {
  const fixture = fs.readFileSync(
    path.join(__dirname, "fixtures", "xenforo-mini.sql"),
    "utf8",
  );

  it("extracts users, nodes, threads, posts with column names", () => {
    const dump = parseXenForoDump(fixture);
    assert.equal(dump.users.length, 3);
    assert.equal(dump.users[2]!.username, "O'Brien");
    assert.equal(dump.nodes.length, 3);
    assert.equal(dump.threads.length, 3);
    assert.equal(dump.posts.length, 4);

    const welcome = dump.threads.find((t) => t.thread_id === 101)!;
    assert.equal(welcome.title, "Welcome to the forum!");
    assert.equal(welcome.sticky, 1);

    const post = dump.posts.find((p) => p.post_id === 1001)!;
    assert.ok(String(post.message).includes("[b]Welcome![/b]"));
  });

  it("slugifies like xenforo urls", () => {
    assert.equal(xenforoSlug("Welcome to the forum!"), "welcome-to-the-forum");
    assert.equal(xenforoSlug("Çok güzel başlık"), "cok-guzel-baslik");
  });
});
