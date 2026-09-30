// Le Veilleur — comportements légers, en amélioration progressive.
// Sans JavaScript : sections dépliées, liens classiques, sommaire en bas d'article.
// Avec : bandeau réduit, barre du bas, feuilles de notion / source / sommaire,
// accordéons repliés sur mobile, articles lus, filtres, recherche.

(() => {
  const doc = document.documentElement;
  doc.classList.add("js");
  const mobile = matchMedia("(max-width: 820px)");
  const calme = matchMedia("(prefers-reduced-motion: reduce)");
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const norm = (s) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’']/g, "'").toLowerCase();
  const echap = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const lire = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } };
  const ecrire = (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) { /* stockage indisponible */ } };
  const racine = () => document.body.dataset.racine || "";
  const defiler = (y) => scrollTo({ top: y, behavior: calme.matches ? "auto" : "smooth" });
  const hautFixe = () => (mobile.matches ? 64 : 72);

  // ---------- Réglages : thème et taille du texte ----------

  const themeActuel = () => doc.dataset.theme || "auto";
  const appliquerTheme = (t) => {
    if (t === "auto") { delete doc.dataset.theme; ecrire("theme", null); }
    else { doc.dataset.theme = t; ecrire("theme", t); }
    majReglages();
  };
  const appliquerTaille = (n) => {
    n = Math.min(4, Math.max(1, n));
    if (n === 2) delete doc.dataset.taille; else doc.dataset.taille = n;
    ecrire("taille", n === 2 ? null : String(n));
    majReglages();
  };
  const majReglages = () => {
    $$("[data-theme-choix]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.themeChoix === themeActuel())));
    const t = +(doc.dataset.taille || 2);
    $$("[data-taille-pas]").forEach((b) => { b.disabled = (b.dataset.taillePas === "-1" && t <= 1) || (b.dataset.taillePas === "1" && t >= 4); });
  };
  const t0 = lire("taille", null); if (t0) doc.dataset.taille = t0;

  // ---------- Articles lus ----------

  const cle = (href) => {
    try { const p = new URL(href, location.href).pathname.replace(/\.html$/, "").split("/"); return p.slice(-2).join("/"); } catch (e) { return ""; }
  };
  const lus = () => { try { return JSON.parse(lire("lus", "[]")); } catch (e) { return []; } };
  const marquerLu = (k) => {
    if (!k) return;
    const l = lus(); if (!l.includes(k)) { l.push(k); ecrire("lus", JSON.stringify(l.slice(-400))); }
    majLus();
  };
  const majLus = () => {
    const l = new Set(lus());
    $$(".carte, .sommaire-item, .edition-nav li").forEach((el) => {
      const a = $("h3 a, a", el); if (!a) return;
      const lu = l.has(cle(a.getAttribute("href")));
      el.classList.toggle("est-lu", lu);
      let sr = $(".etat-lu", el);
      if (lu && !sr) { sr = document.createElement("span"); sr.className = "visuel-cache etat-lu"; sr.textContent = " (déjà lu)"; a.append(sr); }
      if (!lu && sr) sr.remove();
    });
  };

  // ---------- Feuilles (dialog) ----------

  let feuilleAppel = null;
  const feuille = () => {
    if (feuilleAppel) return feuilleAppel;
    feuilleAppel = document.createElement("dialog");
    feuilleAppel.className = "feuille feuille-appel";
    feuilleAppel.setAttribute("aria-labelledby", "feuille-appel-titre");
    document.body.append(feuilleAppel);
    brancherFeuille(feuilleAppel);
    return feuilleAppel;
  };
  const brancherFeuille = (d) => {
    if (d.dataset.branche) return; d.dataset.branche = "1";
    d.addEventListener("click", (e) => {
      if (e.target === d) { const r = d.getBoundingClientRect(); if (e.clientY < r.top) d.close(); }
      if (e.target.closest(".feuille-fermer")) d.close();
    });
    d.addEventListener("close", () => $$(".est-actif", document).forEach((el) => el.matches("a.appel, a.terme") && el.classList.remove("est-actif")));
    // Balayer vers le bas depuis la poignée ou l'en-tête pour fermer
    let y0 = null;
    d.addEventListener("touchstart", (e) => { if (e.target.closest(".feuille-poignee, .feuille-entete") && d.scrollTop <= 0) y0 = e.touches[0].clientY; }, { passive: true });
    d.addEventListener("touchmove", (e) => { if (y0 === null) return; const dy = Math.max(0, e.touches[0].clientY - y0); d.style.transform = `translateY(${dy}px)`; }, { passive: true });
    d.addEventListener("touchend", (e) => { if (y0 === null) return; const dy = e.changedTouches[0].clientY - y0; d.style.transform = ""; y0 = null; if (dy > 90) d.close(); });
  };
  const ouvrir = (d) => { document.querySelectorAll("dialog.feuille[open]").forEach((x) => x !== d && x.close()); if (!d.open) d.showModal(); d.scrollTop = 0; };
  const entete = (etiquette) => `<span class="feuille-poignee" aria-hidden="true"></span>
    <div class="feuille-entete"><p class="feuille-etiquette">${etiquette}</p><button type="button" class="feuille-fermer">Fermer <span aria-hidden="true">✕</span></button></div>`;

  // Notion : lue dans le bloc « Notions clés » de la page (aucune donnée nouvelle)
  const ouvrirNotion = (id, depuis) => {
    const dt = $(`.notions-cles dt a[href$="#${CSS.escape(id)}"]`);
    if (!dt) return false;
    const dd = dt.closest("div").querySelector("dd");
    const comp = $("a.comprendre", dd);
    const def = [...dd.childNodes].filter((n) => n !== comp).map((n) => n.textContent).join("").trim();
    let dom = ""; try { dom = new URL(comp.href).hostname.replace(/^www\./, ""); } catch (e) { /* */ }
    const d = feuille();
    d.innerHTML = `${entete("Notion")}
      <h2 class="feuille-titre" id="feuille-appel-titre">${echap(dt.textContent)}</h2>
      <p class="feuille-texte">${echap(def)}</p>
      <div class="feuille-actions">
        ${comp ? `<a class="bouton bouton-plein" href="${echap(comp.href)}" target="_blank" rel="noopener">Comprendre ↗ <small>${echap(dom)}</small></a>` : ""}
        <a class="bouton" href="${echap(dt.getAttribute("href"))}">Voir dans le glossaire</a>
      </div>`;
    if (depuis) depuis.classList.add("est-actif");
    ouvrir(d);
    return true;
  };

  // Source : lue dans la liste numérotée « Sources » de la page
  const ouvrirSource = (n, depuis) => {
    const items = $$("#sources li");
    const li = items[n - 1]; if (!li) return false;
    const a = $("a", li);
    const detail = ($(".source-detail", li) || {}).textContent || "";
    const m = detail.match(/^(.*?),\s*([^,]*\d{4}[^,]*)$/);
    const media = m ? m[1] : detail, date = m ? m[2] : "";
    const dom = ($(".domaine", li) || {}).textContent || "";
    const d = feuille();
    d.innerHTML = `${entete(`Source ${n} <span>sur ${items.length}</span>`)}
      <p class="feuille-media">${echap(media)}${date ? ` <span>· ${echap(date)}</span>` : ""}</p>
      <h2 class="feuille-titre feuille-source-titre" id="feuille-appel-titre">${echap(a.textContent)}</h2>
      <div class="feuille-actions">
        <a class="bouton bouton-plein" href="${echap(a.href)}" target="_blank" rel="noopener">Ouvrir la source ↗ <small>${echap(dom)}</small></a>
        <div class="feuille-pagination">
          <button type="button" class="bouton bouton-discret" data-source-aller="${n - 1}" ${n <= 1 ? "disabled" : ""} aria-label="Source précédente">‹ ${n - 1 || ""}</button>
          <button type="button" class="bouton bouton-discret" data-toutes-sources>Toutes les sources</button>
          <button type="button" class="bouton bouton-discret" data-source-aller="${n + 1}" ${n >= items.length ? "disabled" : ""} aria-label="Source suivante">${n < items.length ? n + 1 : ""} ›</button>
        </div>
      </div>`;
    $$("a.appel.est-actif").forEach((x) => x.classList.remove("est-actif"));
    if (depuis) depuis.classList.add("est-actif");
    ouvrir(d);
    return true;
  };

  const ouvrirSommaire = (onglet = "edition") => {
    const d = $("#feuille-sommaire"); if (!d) return false;
    brancherFeuille(d);
    choisirOnglet(d, onglet);
    majLus(); majReglages();
    ouvrir(d);
    return true;
  };
  const choisirOnglet = (racineOnglets, nom) => {
    $$("[role=tab]", racineOnglets).forEach((t) => {
      const actif = t.dataset.onglet === nom;
      t.setAttribute("aria-selected", String(actif)); t.tabIndex = actif ? 0 : -1;
      const p = document.getElementById(t.getAttribute("aria-controls")); if (p) p.hidden = !actif;
    });
  };

  const ouvrirAncre = (id) => {
    const cible = document.getElementById(id); if (!cible) return;
    const det = cible.closest("details") || (cible.matches("details") ? cible : $("details", cible));
    let p = cible.closest("details"); while (p) { p.open = true; p = p.parentElement.closest("details"); }
    if (det) det.open = true;
    requestAnimationFrame(() => defiler(cible.getBoundingClientRect().top + scrollY - hautFixe()));
  };

  // ---------- Délégation des clics (valable après tout changement de page) ----------

  document.addEventListener("click", (e) => {
    const t = e.target;
    const terme = t.closest("a.terme");
    if (terme && ouvrirNotion(terme.dataset.notion, terme)) { e.preventDefault(); return; }
    const appel = t.closest("a.appel");
    if (appel && mobile.matches && ouvrirSource(+appel.dataset.source, appel)) { e.preventDefault(); return; }
    const aller = t.closest("[data-source-aller]");
    if (aller) { ouvrirSource(+aller.dataset.sourceAller); return; }
    if (t.closest("[data-toutes-sources]")) { feuille().close(); ouvrirAncre("sources"); return; }
    const o = t.closest("[data-ouvrir]");
    if (o && ouvrirSommaire(o.dataset.ouvrir)) { e.preventDefault(); return; }
    const tab = t.closest("[role=tab][data-onglet]");
    if (tab) { choisirOnglet(tab.closest("dialog, main, body"), tab.dataset.onglet); return; }
    const th = t.closest("[data-theme-choix]"); if (th) { appliquerTheme(th.dataset.themeChoix); return; }
    const ta = t.closest("[data-taille-pas]"); if (ta) { appliquerTaille(+(doc.dataset.taille || 2) + +ta.dataset.taillePas); return; }
    if (t.closest(".theme")) { const s = matchMedia("(prefers-color-scheme: dark)").matches; appliquerTheme((doc.dataset.theme || (s ? "dark" : "light")) === "dark" ? "light" : "dark"); return; }
    const mode = t.closest("[data-mode-breves]");
    if (mode) { const tout = mode.dataset.modeBreves === "tout"; $$(".article-breves details.breve").forEach((d) => { d.open = tout; }); $$("[data-mode-breves]").forEach((b) => b.setAttribute("aria-pressed", String(b === mode))); return; }
    const dep = t.closest("[data-tout-deplier]");
    if (dep) { const ouvrirTout = dep.getAttribute("aria-pressed") !== "true"; $$(".glossaire details").forEach((d) => { d.open = ouvrirTout; }); dep.setAttribute("aria-pressed", String(ouvrirTout)); dep.textContent = ouvrirTout ? "Tout replier" : "Tout déplier"; return; }
    const car = t.closest(".carrousel-nav button");
    if (car) { const b = $(".breves", car.closest(".carrousel")); const w = b.firstElementChild.getBoundingClientRect().width + 12; b.scrollBy({ left: car.classList.contains("carrousel-suiv") ? w : -w, behavior: calme.matches ? "auto" : "smooth" }); return; }
    const ancre = t.closest('a[href^="#"]');
    if (ancre && ancre.getAttribute("href").length > 1) { const id = decodeURIComponent(ancre.getAttribute("href").slice(1)); if (document.getElementById(id)) { e.preventDefault(); history.replaceState(null, "", "#" + id); ouvrirAncre(id); } }
  });

  document.addEventListener("keydown", (e) => {
    const tab = e.target.closest && e.target.closest("[role=tab]"); if (!tab || !["ArrowLeft", "ArrowRight"].includes(e.key)) return;
    const tabs = $$("[role=tab]", tab.parentElement); const i = tabs.indexOf(tab) + (e.key === "ArrowRight" ? 1 : -1);
    const s = tabs[(i + tabs.length) % tabs.length]; s.focus(); choisirOnglet(tab.closest("dialog, main, body"), s.dataset.onglet);
  });

  // ---------- Défilement : bandeau, progression, carrousel, repérage ----------

  let obs = [];
  const observer = (cibles, rappel, options) => { const o = new IntersectionObserver(rappel, options); cibles.forEach((c) => o.observe(c)); obs.push(o); };

  const majProgression = () => {
    // Bandeau réduit sur la une : visible dès que le titre du journal est sorti de l'écran
    const mast = $(".page-une .masthead"), band = $(".bandeau");
    if (mast && band) band.classList.toggle("est-visible", mast.getBoundingClientRect().bottom < 8);
    const art = $(".article"); const barre = $(".progression span"); if (!art) return;
    const r = art.getBoundingClientRect(); const total = r.height - innerHeight;
    const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1;
    if (barre) barre.style.transform = `scaleX(${p})`;
    const reste = $(".bb-reste"); const min = +art.dataset.minutes || 0;
    if (reste && min) { const m = Math.ceil(min * (1 - p)); reste.textContent = p > .97 ? "Lecture terminée" : `≈ ${m} min restante${m > 1 ? "s" : ""}`; }
    if (p > .9) marquerLu(art.dataset.cle || cle(location.href));
  };
  const majCarrousel = (b) => {
    const cartes = [...b.children]; if (!cartes.length) return;
    const w = cartes[0].getBoundingClientRect().width + 12; const i = Math.min(cartes.length - 1, Math.round(b.scrollLeft / w));
    const c = b.closest(".carrousel"); const pos = $(".carrousel-position", c);
    if (pos) pos.textContent = `${i + 1} / ${cartes.length}`;
    const [prec, suiv] = $$(".carrousel-nav button", c); if (prec) prec.disabled = i === 0; if (suiv) suiv.disabled = i >= cartes.length - 1;
  };
  document.addEventListener("scroll", (e) => {
    if (e.target === document) { majProgression(); return; }
    if (e.target.matches && e.target.matches(".carrousel .breves")) majCarrousel(e.target);
  }, { passive: true, capture: true });
  addEventListener("resize", majProgression);

  const reperer = (liens, cles) => {
    // Met en évidence le lien de la section visible et le ramène dans sa barre défilante
    const map = new Map(liens.map((a) => [decodeURIComponent(a.getAttribute("href").split("#")[1] || ""), a]));
    const sections = cles.map((id) => document.getElementById(id)).filter(Boolean);
    observer(sections, (entrees) => {
      entrees.forEach((en) => {
        if (!en.isIntersecting) return;
        const a = map.get(en.target.id); if (!a) return;
        liens.forEach((x) => x.classList.toggle("est-actif", x === a));
        const bar = a.parentElement; bar.scrollTo({ left: a.offsetLeft - bar.clientWidth / 2 + a.clientWidth / 2, behavior: calme.matches ? "auto" : "smooth" });
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
  };

  // ---------- Glossaire : filtre ----------

  const filtrerNotions = (q) => {
    const m = norm(q.trim()); let n = 0;
    $$(".glossaire .notion").forEach((el) => { const ok = !m || norm(el.textContent).includes(m); el.hidden = !ok; if (ok) n++; if (m && ok) $("details", el).open = true; });
    $$(".glossaire section").forEach((s) => { const vide = !$(".notion:not([hidden])", s); s.hidden = vide; const a = $(`.lettres a[href="#${s.id}"]`); if (a) a.setAttribute("aria-disabled", String(vide)); });
    const etat = $("#glossaire-compte"); if (etat) etat.textContent = `${n} notion${n > 1 ? "s" : ""}`;
  };
  document.addEventListener("input", (e) => { if (e.target.id === "filtre-notions") filtrerNotions(e.target.value); });

  // ---------- Recherche plein texte ----------

  let index = null;
  const recherche = () => {
    const champ = $("#q"), zone = $("#resultats"), etat = $("#etat"); if (!champ || !zone) return;
    const efface = $(".recherche-effacer");
    const filtre = $("#rub"); const puce = $(".filtres [aria-pressed=true]");
    const rubs = puce && puce.dataset.rubs ? puce.dataset.rubs.split(" ") : (filtre && filtre.value ? [filtre.value] : []);
    const mots = norm(champ.value).split(/\s+/).filter(Boolean);
    if (efface) efface.hidden = !champ.value;
    const res = index.filter((a) => (!rubs.length || rubs.includes(a.r)) && mots.every((m) => a._txt.includes(m)));
    const liste = mots.length || rubs.length ? res : index.slice(0, 12);
    etat.textContent = mots.length || rubs.length ? `${res.length} résultat${res.length > 1 ? "s" : ""}` : "Derniers articles publiés";
    const sug = $(".suggestions"); if (sug) sug.hidden = !!mots.length;
    const surligner = (s) => { let h = echap(s); if (!mots.length) return h; const n = norm(s); const marques = [];
      mots.forEach((m) => { let i = n.indexOf(m); while (i >= 0) { marques.push([i, i + m.length]); i = n.indexOf(m, i + m.length); } });
      if (!marques.length) return h; marques.sort((a, b) => a[0] - b[0]); let out = "", k = 0;
      marques.forEach(([a, b]) => { if (a < k) return; out += echap(s.slice(k, a)) + "<mark>" + echap(s.slice(a, b)) + "</mark>"; k = b; }); return out + echap(s.slice(k)); };
    const R = racine();
    zone.innerHTML = liste.slice(0, 60).map((a) => `<article class="carte">
      <p class="surtitre"><a href="${R}rubrique/${a.r}.html">${echap(a.rn)}</a><span class="sep">·</span><span class="sujet">${echap(a.dl)}</span></p>
      <h3><a href="${R}${a.u}">${surligner(a.t)}</a></h3>
      <p class="chapo">${surligner(a.c)}</p>
      <p class="meta">${a.n ? `Notions : ${surligner(a.n)}` : echap(a.dl)}<span class="carte-lire" aria-hidden="true"><span class="a-lire">Lire →</span><span class="lu">Lu ✓</span></span></p>
    </article>`).join("");
    majLus();
    try { const u = new URL(location.href); champ.value ? u.searchParams.set("q", champ.value) : u.searchParams.delete("q"); history.replaceState(null, "", u); } catch (e) { /* */ }
  };
  const initRecherche = () => {
    const champ = $("#q"); if (!champ) return;
    const q = new URLSearchParams(location.search).get("q"); if (q && !champ.value) champ.value = q;
    if (index) { recherche(); return; }
    fetch(`${racine()}recherche.json`).then((r) => r.json()).then((data) => {
      index = data.map((a) => ({ ...a, _txt: norm([a.t, a.c, a.s, a.rn, a.n, a.b, a.x].join(" ")) })); recherche();
    }).catch(() => { const etat = $("#etat"); if (etat) etat.textContent = "L’index de recherche n’a pas pu être chargé."; });
  };
  document.addEventListener("input", (e) => { if (e.target.id === "q" && index) recherche(); });
  document.addEventListener("change", (e) => { if (e.target.id === "rub" && index) recherche(); });
  document.addEventListener("click", (e) => {
    const p = e.target.closest(".filtres [data-rubs]");
    if (p) { $$(".filtres [data-rubs]").forEach((x) => x.setAttribute("aria-pressed", String(x === p))); if (index) recherche(); }
    if (e.target.closest(".recherche-effacer")) { const c = $("#q"); c.value = ""; c.focus(); if (index) recherche(); }
    const s = e.target.closest(".suggestions [data-q]"); if (s) { const c = $("#q"); c.value = s.dataset.q; if (index) recherche(); }
  });

  // ---------- Mise en place ----------

  const rafraichir = () => {
    obs.forEach((o) => o.disconnect()); obs = [];
    // Bandeau réduit sur la une : apparaît quand le titre du journal sort de l'écran
    // Accordéons : dépliés dans le HTML, repliés ici sur téléphone
    if (mobile.matches) {
      $$("details[data-replie-mobile]").forEach((d) => { if (!d.dataset.init) { d.open = false; d.dataset.init = "1"; } });
    }
    $$(".carrousel .breves").forEach(majCarrousel);
    const rc = $$(".rubriques-cahier a[href*='#']");
    if (rc.length) reperer(rc, rc.map((a) => decodeURIComponent(a.getAttribute("href").split("#")[1])));
    const lt = $$(".glossaire-outils .lettres a");
    if (lt.length) reperer(lt, lt.map((a) => a.getAttribute("href").slice(1)));
    // Fin d'article vue : article lu
    const suite = $(".suite"), art = $(".article");
    if (suite && art) observer([suite], ([en]) => { if (en.isIntersecting) marquerLu(art.dataset.cle || cle(location.href)); });
    majLus(); majReglages(); majProgression(); initRecherche();
    if (location.hash.length > 1) { const id = decodeURIComponent(location.hash.slice(1)); if (document.getElementById(id)) ouvrirAncre(id); }
  };

  // Exposé pour le débogage dans la console du navigateur.
  window.Veilleur = { rafraichir, ouvrirNotion, ouvrirSource, ouvrirSommaire, marquerLu, ouvrirAncre };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", rafraichir); else rafraichir();
})();
