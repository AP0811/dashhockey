const [major] = process.versions.node.split(".").map(Number);

if (major !== 22) {
  console.error("\nErreur: version Node.js non supportee pour ce projet.");
  console.error(`Version detectee: v${process.versions.node}`);
  console.error("Version requise: Node 22.x (LTS)");
  console.error("\nCorrection rapide (nvm-windows):");
  console.error("  nvm install 22.16.0");
  console.error("  nvm use 22.16.0");
  console.error("  node -v\n");
  process.exit(1);
}
