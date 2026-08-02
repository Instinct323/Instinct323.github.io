import argparse
import shutil
import shlex
import subprocess
from datetime import datetime
from pathlib import Path
import time

WORKDIR = Path(__file__).parent.parent


def execute(cmd, check=True):
    print("\033[32m\033[1m" + shlex.join(cmd) + "\033[0m")
    return subprocess.run(cmd, cwd=WORKDIR, check=check)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Publish a report into content/blog/ and push it to git")
    parser.add_argument("file", type=str, help="Report file path")
    args = parser.parse_args()

    file = Path(args.file).resolve()
    if not file.exists():
        raise FileNotFoundError(f"{file} does not exist.")
    if not file.is_file():
        raise ValueError(f"{file} is not a file.")
    if file.suffix != ".md":
        raise ValueError(f"{file} is not a markdown file.")
    t = time.strftime("%Y-%m-%d-%H-%M-%S", time.localtime(file.stat().st_mtime))

    dst = WORKDIR / "content" / "blog" / f"Report-{t}"
    git_dst = str(dst.relative_to(WORKDIR))
    dst.mkdir(exist_ok=True)
    shutil.copy(file, dst / "README.md")

    execute(["git", "add", git_dst])
    # Stage README then renormalize line endings (Windows CRLF normalization)
    execute(["git", "add", git_dst, "--renormalize"])
    execute(["git", "commit", "-m", f"add {file.stem}"], check=False)
    execute(["git", "push"])
