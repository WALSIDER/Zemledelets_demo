from pathlib import Path


EXTENSIONS = {
    ".dart",
    ".js",
    ".mjs",
    ".ts",
    ".tsx",
    ".jsx",
    ".html",
    ".css",
    ".json",
    ".md",
    ".yaml",
    ".yml",
    ".txt",
}

SKIP_DIRS = {".git", "node_modules", "build", "dist", ".wrangler", ".npm-cache"}


def main() -> int:
    bad_files = []

    for path in Path(".").rglob("*"):
        if not path.is_file():
            continue
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if path.suffix.lower() not in EXTENSIONS:
            continue

        try:
            path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            bad_files.append(str(path))

    if bad_files:
        print("Files with non-UTF-8 or broken encoding:")
        for file in bad_files:
            print(file)
        return 1

    print("UTF-8 check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
