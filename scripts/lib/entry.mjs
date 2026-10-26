// @ts-check
// The CLI entry guard shared by the import and verify scripts (HI-01).
import { realpathSync } from "node:fs";
import { basename } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Run main(argv) when this module is the script node was started with, and set the exit code from its result.
 *
 * The two paths are compared after realpath, so a symlinked repo path, a case-differing path on macOS and
 * `--preserve-symlinks-main` all still run main. A module that is only imported (a test, `node -e`, where
 * process.argv[1] is absent) does nothing and never throws.
 *
 * A run that looks like the CLI but does not resolve to this file (same file name, different real path, for
 * example a copy or a broken link) must not look like a pass: it prints an error and exits 1.
 * @param {string} metaUrl the caller's import.meta.url
 * @param {(argv: string[]) => number} main
 * @returns {void}
 */
export function runAsEntry(metaUrl, main) {
  const entry = process.argv[1];
  if (entry === undefined) return;
  const self = fileURLToPath(metaUrl);
  /** @type {string | undefined} */
  let entryReal;
  try {
    entryReal = realpathSync.native(entry);
  } catch {
    entryReal = undefined;
  }
  if (entryReal !== realpathSync.native(self)) {
    if (basename(entry) === basename(self)) {
      console.error(
        `error: ${basename(self)} was started as ${entry} but this module is ${self}; refusing to exit 0 without running`,
      );
      process.exitCode = 1;
    }
    return;
  }
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    console.error(`error: ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  }
}
