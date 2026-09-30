// Outils communs aux programmes de bin/ : lecture des options, sortie d'erreur uniforme.
//
// Conventions (règles du silence et du dépannage) :
// - un programme qui réussit n'écrit rien d'autre que son résultat ; -v le rend bavard ;
// - une erreur s'écrit sur la sortie d'erreur, préfixée du nom du programme, avec un code de sortie non nul.

import path from "node:path";

export function options(argv = process.argv.slice(2)) {
  const opts = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-v" || a === "--bavard") opts.bavard = true;
    else if (a.startsWith("--")) {
      const [cle, val] = a.slice(2).split("=");
      if (val !== undefined) opts[cle] = val;
      else if (argv[i + 1] !== undefined && !argv[i + 1].startsWith("-")) opts[cle] = argv[++i];
      else opts[cle] = true;
    } else opts._.push(a);
  }
  return opts;
}

const nom = path.basename(process.argv[1] ?? "veilleur", ".mjs");
export const dire = (...m) => console.error(`${nom}: ${m.join(" ")}`);

export async function principal(fn, aide = "") {
  const opts = options();
  if (opts.aide || opts.help) { console.log(aide.trim()); return; }
  try {
    const code = await fn(opts);
    if (typeof code === "number") process.exitCode = code;
  } catch (e) {
    dire(e.message);
    if (opts.bavard) console.error(e.stack);
    process.exitCode = 1;
  }
}

export async function lireEntree() {
  const morceaux = [];
  for await (const m of process.stdin) morceaux.push(m);
  return Buffer.concat(morceaux).toString("utf8");
}
