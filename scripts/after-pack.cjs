// Ad-hoc signature of the macOS app (codesign "-") after merging Intel + Apple Silicon.
// With no signature at all, Apple-silicon Macs reject the app ("is damaged").
// It does not replace a paid Apple signature: the first launch still needs "Open Anyway".
const { execFileSync } = require("child_process");
const path = require("path");
const { Arch } = require("builder-util");

exports.default = async function afterPack(ctx) {
  if (ctx.electronPlatformName !== "darwin") return;
  if (ctx.arch !== Arch.universal) return; // the temporary x64/arm64 packages are signed after the merge
  const app = path.join(ctx.appOutDir, `${ctx.packager.appInfo.productFilename}.app`);
  console.log(`  • ad-hoc signing  ${app}`);
  execFileSync("codesign", ["--force", "--deep", "--sign", "-", app], { stdio: "inherit" });
  execFileSync("codesign", ["--verify", "--deep", "--strict", "--verbose=2", app], { stdio: "inherit" });
};
