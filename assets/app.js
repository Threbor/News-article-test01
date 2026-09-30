// Le Veilleur — comportements légers : thème, barre de lecture, recherche.

(() => {
  const racine = document.body.dataset.racine || "";

  // Thème clair / sombre, mémorisé dans le navigateur.
  const bouton = document.querySelector(".theme");
  if (bouton) {
    bouton.addEventListener("click", () => {
      const sombreSysteme = matchMedia("(prefers-color-scheme: dark)").matches;
      const actuel = document.documentElement.dataset.theme || (sombreSysteme ? "dark" : "light");
      const suivant = actuel === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = suivant;
      try { localStorage.setItem("theme", suivant); } catch (e) { /* stockage indisponible */ }
    });
  }

  // Barre de progression de lecture sur les articles.
  const barre = document.querySelector(".progression span");
  const article = document.querySelector(".article");
  if (barre && article) {
    const maj = () => {
      const r = article.getBoundingClientRect();
      const total = r.height - innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1;
      barre.style.transform = `scaleX(${p})`;
    };
    addEventListener("scroll", maj, { passive: true });
    addEventListener("resize", maj);
    maj();
  }

  // Recherche plein texte dans l'index généré au build.
  const champ = document.getElementById("q");
  const filtre = document.getElementById("rub");
  const zone = document.getElementById("resultats");
  const etat = document.getElementById("etat");
  if (!champ || !zone) return;

  const norm = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const echap = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  let index = [];

  const afficher = () => {
    const mots = norm(champ.value).split(/\s+/).filter(Boolean);
    const rub = filtre ? filtre.value : "";
    const res = index.filter((a) => (!rub || a.r === rub) && mots.every((m) => a._txt.includes(m)));
    const liste = mots.length || rub ? res : index.slice(0, 12);
    etat.textContent = mots.length || rub
      ? `${res.length} résultat${res.length > 1 ? "s" : ""}`
      : "Derniers articles publiés";
    zone.innerHTML = liste.slice(0, 60).map((a) => `<article class="carte">
      <p class="surtitre"><a href="${racine}rubrique/${a.r}.html">${echap(a.rn)}</a><span class="sep">·</span>${echap(a.dl)}</p>
      <h3><a href="${racine}${a.u}">${echap(a.t)}</a></h3>
      <p class="chapo">${echap(a.c)}</p>
      ${a.n ? `<p class="meta">Notions : ${echap(a.n)}</p>` : ""}
    </article>`).join("");
  };

  const params = new URLSearchParams(location.search);
  if (params.get("q")) champ.value = params.get("q");

  fetch(`${racine}recherche.json`)
    .then((r) => r.json())
    .then((data) => {
      index = data.map((a) => ({ ...a, _txt: norm([a.t, a.c, a.s, a.rn, a.n, a.b, a.x].join(" ")) }));
      afficher();
    })
    .catch(() => { etat.textContent = "L’index de recherche n’a pas pu être chargé."; });

  champ.addEventListener("input", afficher);
  if (filtre) filtre.addEventListener("change", afficher);
})();
