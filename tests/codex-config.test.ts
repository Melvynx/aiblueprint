import { describe, expect, it } from "vitest";
import { mergeCodexConfig } from "../src/lib/codex-config";

const defaults = `# Codex defaults
approval_policy = "never"
sandbox_mode = "danger-full-access"

[[hooks.PreToolUse]]
matcher = "^Bash$"

[[hooks.PreToolUse.hooks]]
type = "command"
command = "/usr/bin/env node \\\"$HOME/.codex/hooks/command-deny-list.ts\\\""
timeout = 5
statusMessage = "Checking command safety"

[tui]
status_line = [
  "model-with-reasoning",
  "run-state",
  "project-name",
  "git-branch",
  "branch-changes",
  "context-remaining",
  "used-tokens",
  "five-hour-limit",
  "weekly-limit",
  "task-progress",
]
status_line_use_colors = true
`;

describe("mergeCodexConfig", () => {
  it("adds the default status line and command safety hook when the user has no tui section", () => {
    const merged = mergeCodexConfig('model = "gpt-5.5"\n', defaults);

    expect(merged).toContain('model = "gpt-5.5"');
    expect(merged).toContain("[tui]");
    expect(merged).toContain('"model-with-reasoning"');
    expect(merged).toContain('"task-progress"');
    expect(merged).toContain("[[hooks.PreToolUse]]");
    expect(merged).toContain("command-deny-list.ts");
  });

  it("does not treat nested tui tables as a configured status line", () => {
    const merged = mergeCodexConfig(`[tui.model_availability_nux]\n"gpt-5.5" = 4\n`, defaults);

    expect(merged).toContain("[tui.model_availability_nux]");
    expect(merged).toContain("[tui]");
    expect(merged).toContain("status_line = [");
  });

  it("preserves an existing user status line", () => {
    const existing = `[tui]\nstatus_line = ["model", "current-dir"]\n`;
    const merged = mergeCodexConfig(existing, defaults);

    expect(merged).toContain('status_line = ["model", "current-dir"]');
    expect(merged).not.toContain('"task-progress"');
  });

  it("adds status line inside an existing tui section without one", () => {
    const existing = `[tui]\nshow_tooltips = false\n\n[plugins.foo]\nenabled = true\n`;
    const merged = mergeCodexConfig(existing, defaults);

    expect(merged).toContain("[tui]\nstatus_line = [");
    expect(merged).toContain("show_tooltips = false");
    expect(merged).toContain("[plugins.foo]");
  });

  it("does not duplicate the command safety hook when already configured", () => {
    const existing = `[[hooks.PreToolUse]]\nmatcher = "^Bash$"\n\n[[hooks.PreToolUse.hooks]]\ntype = "command"\ncommand = "/usr/bin/env node \\\"$HOME/.codex/hooks/command-deny-list.ts\\\""\n`;
    const merged = mergeCodexConfig(existing, defaults);

    expect(merged.match(/command-deny-list\.ts/g)).toHaveLength(1);
  });
});
