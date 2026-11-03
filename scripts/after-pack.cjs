// Firma ad-hoc dell'app macOS (codesign "-") dopo l'unione Intel + Apple Silicon.
// Senza nessuna firma i Mac con chip Apple rifiutano l'app ("è danneggiata").
// Non sostituisce la firma Apple a pagamento: al primo avvio serve comunque "Apri comunque".
const { execFileSync } = require("child_process");
const path = require("path");
const { Arch } = require("builder-util");

exports.default = async function afterPack(ctx) {
  if (ctx.electronPlatformName !== "darwin") return;
  if (ctx.arch !== Arch.universal) return; // i pacchetti x64/arm64 temporanei vengono firmati dopo l'unione
  const app = path.join(ctx.appOutDir, `${ctx.packager.appInfo.productFilename}.app`);
  console.log(`  • firma ad-hoc  ${app}`);
  execFileSync("codesign", ["--force", "--deep", "--sign", "-", app], { stdio: "inherit" });
  execFileSync("codesign", ["--verify", "--deep", "--strict", "--verbose=2", app], { stdio: "inherit" });
};
