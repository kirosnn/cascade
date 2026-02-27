import { mkdtemp, rm, mkdir, cp } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"
import { exec } from "child_process"
import { promisify } from "util"
import simpleGit from "simple-git"
import fg from "fast-glob"

const execAsync = promisify(exec)

async function cloneRepo(url: string, path: string) {
    const git = simpleGit()
    await git.clone(url, path, ["--depth", "1"])
}

async function copyWorkingTree(srcRepo: string, dst: string) {
    await mkdir(dst, { recursive: true })
    const entries = await fg(["**/*"], {
        cwd: srcRepo,
        dot: true,
        ignore: ["**/.git/**", "**/node_modules/**", "**/dist/**", "**/build/**"],
        onlyFiles: false
    })

    for (const rel of entries) {
        const from = join(srcRepo, rel)
        const to = join(dst, rel)
        await mkdir(join(to, ".."), { recursive: true })
        await cp(from, to, { recursive: true, force: true })
    }
}

async function getAllFiles(dir: string) {
    return fg(["**/*"], {
        cwd: dir,
        dot: true,
        ignore: ["**/node_modules/**", "**/dist/**", "**/build/**"],
        onlyFiles: true
    })
}

async function getTotalLines(dir: string, files: string[]) {
    let total = 0
    for (const file of files) {
        const bunFile = Bun.file(join(dir, file))
        if (!(await bunFile.exists())) continue
        const text = await bunFile.text().catch(() => "")
        total += text.split("\n").length
    }
    return total
}

async function getDiffLines(dir1: string, dir2: string) {
    try {
        const { stdout } = await execAsync(`git diff --no-index --numstat "${dir1}" "${dir2}"`, {
            maxBuffer: 1024 * 1024 * 64
        })

        let changed = 0
        for (const line of stdout.split("\n")) {
            if (!line.trim()) continue
            const [addStr, delStr] = line.split("\t")
            const adds = addStr === "-" ? 0 : parseInt(addStr, 10)
            const dels = delStr === "-" ? 0 : parseInt(delStr, 10)
            if (Number.isFinite(adds)) changed += adds
            if (Number.isFinite(dels)) changed += dels
        }
        return changed
    } catch (e: any) {
        const stdout = typeof e?.stdout === "string" ? e.stdout : ""
        const stderr = typeof e?.stderr === "string" ? e.stderr : ""

        if (!stdout && stderr) throw e

        let changed = 0
        for (const line of stdout.split("\n")) {
            if (!line.trim()) continue
            const [addStr, delStr] = line.split("\t")
            const adds = addStr === "-" ? 0 : parseInt(addStr, 10)
            const dels = delStr === "-" ? 0 : parseInt(delStr, 10)
            if (Number.isFinite(adds)) changed += adds
            if (Number.isFinite(dels)) changed += dels
        }
        return changed
    }
}

async function main() {
    const [repo1, repo2] = process.argv.slice(2)

    if (!repo1 || !repo2) {
        console.log("Usage: bun scripts/compare-repos.ts <repo1> <repo2>")
        process.exit(1)
    }

    const tempBase = await mkdtemp(join(tmpdir(), "repo-compare-"))
    const repoPath1 = join(tempBase, "repo1")
    const repoPath2 = join(tempBase, "repo2")

    const clean1 = join(tempBase, "clean1")
    const clean2 = join(tempBase, "clean2")

    await cloneRepo(repo1, repoPath1)
    await cloneRepo(repo2, repoPath2)

    await copyWorkingTree(repoPath1, clean1)
    await copyWorkingTree(repoPath2, clean2)

    const files1 = await getAllFiles(clean1)
    const files2 = await getAllFiles(clean2)

    const total1 = await getTotalLines(clean1, files1)
    const total2 = await getTotalLines(clean2, files2)

    const diffLines = await getDiffLines(clean1, clean2)
    const avgTotal = (total1 + total2) / 2

    const percent = avgTotal > 0 ? (diffLines / avgTotal) * 100 : 0

    console.log(`Difference: ${percent.toFixed(2)}%`)
    console.log(`Changed lines: ${diffLines}`)
    console.log(`Average total lines: ${Math.round(avgTotal)}`)

    await rm(tempBase, { recursive: true, force: true })
}

main()