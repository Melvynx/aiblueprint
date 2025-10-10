#!/usr/bin/env bun
// @ts-nocheck

interface HookInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name: string;
  tool_name: string;
  tool_input: {
    file_path: string;
    content: string;
  };
  tool_response: {
    filePath: string;
    success: boolean;
  };
}

interface HookOutput {
  hookSpecificOutput: {
    hookEventName: string;
    additionalContext: string;
  };
}

// Check for debug mode
const DEBUG = process.argv.includes("--debug");

function log(message: string, ...args: unknown[]) {
  if (DEBUG) {
    console.log(message, ...args);
  }
}

async function runCommand(
  command: string[],
): Promise<{ stdout: string; stderr: string; success: boolean }> {
  try {
    const proc = Bun.spawn(command, {
      stdout: "pipe",
      stderr: "pipe",
    });

    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const success = (await proc.exited) === 0;

    return { stdout, stderr, success };
  } catch (error) {
    return { stdout: "", stderr: String(error), success: false };
  }
}

async function main() {
  log("Hook started for file processing");

  // Lire l'input JSON depuis stdin
  const input = await Bun.stdin.text();
  log("Input received, length:", input.length);

  let hookData: HookInput;
  try {
    hookData = JSON.parse(input);
  } catch (error) {
    log("Error parsing JSON input:", error);
    process.exit(0);
  }

  const filePath = hookData.tool_input?.file_path;
  if (!filePath) {
    log("Unable to extract file path from input");
    process.exit(0);
  }

  // Vérifier que c'est un fichier .ts ou .tsx uniquement
  if (!filePath.endsWith(".ts") && !filePath.endsWith(".tsx")) {
    log(`Skipping ${filePath}: not a TypeScript file`);
    process.exit(0);
  }

  log("Processing file:", filePath);

  // Vérifier que le fichier existe
  const file = Bun.file(filePath);
  if (!(await file.exists())) {
    log("File not found:", filePath);
    process.exit(1);
  }

  // 1. Exécuter Prettier
  log("Running Prettier formatting");
  const prettierResult = await runCommand([
    "bun",
    "x",
    "prettier",
    "--write",
    filePath,
  ]);
  if (!prettierResult.success) {
    log("Prettier failed:", prettierResult.stderr);
  }

  // 2. ESLint --fix
  log("Running ESLint --fix");
  await runCommand(["bun", "x", "eslint", "--fix", filePath]);

  // 3. Run ESLint check and TypeScript check in parallel
  log("Running ESLint and TypeScript checks in parallel");
  const [eslintCheckResult, tscResult] = await Promise.all([
    runCommand(["bun", "x", "eslint", filePath]),
    runCommand(["bun", "x", "tsc", "--noEmit", "--pretty", "false"]),
  ]);

  const eslintErrors = (
    eslintCheckResult.stdout + eslintCheckResult.stderr
  ).trim();

  const tsErrors = tscResult.stderr
    .split("\n")
    .filter((line) => line.includes(filePath))
    .join("\n");

  // Construire le message d'erreurs
  let errorMessage = "";

  if (tsErrors || eslintErrors) {
    errorMessage = `Fix NOW the following errors AND warning detected in ${filePath
      .split("/")
      .pop()}:\\n`;

    if (tsErrors) {
      errorMessage += `\\n TypeScript errors:\\n${tsErrors}\\n`;
    }

    if (eslintErrors) {
      errorMessage += `\\n ESLint errors:\\n${eslintErrors}\\n`;
    }
  }

  log("Error message", errorMessage);

  // Sortir le résultat
  if (errorMessage) {
    const output: HookOutput = {
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: errorMessage,
      },
    };

    log("Output", JSON.stringify(output, null, 2));
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.error(`No errors detected in ${filePath.split("/").pop()}`);
  }
}

main().catch((error) => {
  log("Error in hook:", error);
  process.exit(1);
});
