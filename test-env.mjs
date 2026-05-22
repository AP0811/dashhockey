function readEnv(name, fallback) {
  const value = process.env[name]?.trim();
  console.log(`readEnv("${name}") = ${value ?? "null"}, fallback = "${fallback}"`);
  return value || fallback;
}

console.log("SEED_ADMIN_PASSWORD:", readEnv("SEED_ADMIN_PASSWORD", "ChangeMe_Admin_2026!"));
console.log("SEED_COACH_USERNAME:", readEnv("SEED_COACH_USERNAME", "coach.martin"));
