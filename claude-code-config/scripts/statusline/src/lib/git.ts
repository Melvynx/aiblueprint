import { execSync } from "node:child_process";

export interface GitInfo {
	branch: string;
	added: number;
	deleted: number;
}

export function getGitInfo(cwd: string): GitInfo | null {
	try {
		const branch = execSync("git rev-parse --abbrev-ref HEAD", {
			cwd,
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
		}).trim();

		const status = execSync("git diff --numstat", {
			cwd,
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
		}).trim();

		let added = 0;
		let deleted = 0;

		if (status) {
			for (const line of status.split("\n")) {
				const [a, d] = line.split("\t");
				// Skip binary files (marked with '-' in numstat)
				if (a === "-" || d === "-") continue;
				// Only add numeric values
				const addedNum = Number(a);
				const deletedNum = Number(d);
				if (!Number.isNaN(addedNum)) added += addedNum;
				if (!Number.isNaN(deletedNum)) deleted += deletedNum;
			}
		}

		return { branch, added, deleted };
	} catch {
		return null;
	}
}
