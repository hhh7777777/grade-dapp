const fs = require("fs/promises");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const targets = [
  path.join(rootDir, "artifacts"),
  path.join(rootDir, "cache")
];

async function main() {
  await Promise.all(
    targets.map((target) => fs.rm(target, { recursive: true, force: true }))
  );
  console.log("Removed artifacts and cache directories.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
