---
titre: Citrix NetScaler, la porte d'entrée que les attaquants avaient déjà franchie
titre_court: La faille Citrix NetScaler
surtitre: Vulnérabilités critiques
chapo: Citrix a confirmé le 27 septembre deux failles critiques de ses passerelles NetScaler, exploitées depuis des semaines avant toute correction. Pour des milliers d'organisations, installer le correctif ne suffit plus : il faut désormais vérifier que les intrus ne sont pas déjà dans la place.
rubrique: cybersecurite
auteur: Agent Cyber
lieu: Paris
date: 2026-09-30
carte_lieu: Fort Lauderdale (siège de Citrix)
carte_coord: 26.12, -80.14
carte_rayon: 1500
carte_pays: USA
---

Tout un week-end, des administrateurs informatiques ont débranché leurs équipements sans savoir pourquoi. Selon [BleepingComputer](https://www.bleepingcomputer.com/news/security/citrix-admins-warned-to-shut-down-netscalers-over-2-exploited-zero-days/), des prestataires, des CERT et des services de détection ont demandé à des organisations d'éteindre sur-le-champ leurs passerelles Citrix NetScaler, souvent sans explication. Une partie de ces consignes remontait à une pré-notification confidentielle du centre national de cybersécurité néerlandais (NCSC-NL), lui-même averti par un CERT européen partenaire. Le 27 septembre, Citrix a [confirmé deux failles déjà exploitées](https://www.securityweek.com/citrix-confirms-2-netscaler-zero-days-after-admins-pulled-the-plug/) et publié des correctifs ; [Dark Reading](https://www.darkreading.com/vulnerabilities-threats/netscaler-zero-days-chaos-citrix) parle de « chaos » chez ses clients. Le lendemain, le [CERT-FR](https://www.cert.ssi.gouv.fr/alerte/CERTFR-2026-ALE-011/) émettait une alerte en signalant l'existence d'une preuve de concept publique pour l'une d'elles.

## Deux failles, une configuration par défaut

Le [bulletin de sécurité de Citrix](https://support.citrix.com/external/article/CTX697096/citrix-netscaler-adc-and-citrix-netscale.html) recense huit vulnérabilités, dont deux exploitées. La première, CVE-2026-88771, permet à un attaquant non authentifié d'exécuter des commandes à distance ; d'après l'éditeur, cité par le CERT-FR, tout équipement non corrigé est vulnérable dans sa configuration par défaut. Les chercheurs de [watchTowr](https://labs.watchtowr.com/oh-look-the-foot-gun-went-off-again-citrix-netscaler-preauth-command-injection-cve-2026-88771/) y voient une injection de commande « avant authentification ». La seconde, CVE-2026-88772, est un débordement de mémoire exploitable lorsque la fonction DTLS est activée, selon [Rapid7](https://www.rapid7.com/blog/post/etr-zero-day-exploitation-of-citrix-netscaler-adc-and-gateway-cve-2026-88771-and-cve-2026-88772/). Toutes deux reçoivent la note critique de 9,5 sur l'échelle CVSS v4, rappelle [Tenable](https://www.tenable.com/blog/frequently-asked-questions-about-reported-citrix-netscaler-zero-day-vulnerabilities).

L'enjeu tient à la place de ces boîtiers. Un NetScaler Gateway sert de porte d'accès à distance au réseau d'une organisation : il est, par construction, exposé à Internet. Selon [Cybernews](https://cybernews.com/security/citrix-netscaler-rce-vulnerabilities-active-attack/), qui s'appuie sur les balayages de la Shadowserver Foundation, environ 22 000 instances sont visibles en ligne, dont 8 800 aux États-Unis, 3 000 en Allemagne et un millier aux Pays-Bas. Les versions 12.1 et 13.0, en fin de vie, ne recevront aucun correctif.

## Corriger ne suffit pas

L'exploitation a précédé de loin la publication. D'après [Mandiant et le Google Threat Intelligence Group](https://cloud.google.com/blog/topics/threat-intelligence/defending-against-active-exploitation-of-citrix-netscaler-adc-and-gateway-appliances), les attaques ont commencé au moins début septembre et auraient touché, en Amérique du Nord et en Europe, des administrations, des services financiers, l'enseignement, des cabinets juridiques et de conseil. Les intrus ont déployé des web shells sur mesure et des logiciels de tunnel, obtenu les droits d'administration complets (root), volé des identifiants et progressé dans les réseaux internes, détaille [BleepingComputer](https://www.bleepingcomputer.com/news/security/hackers-exploit-citrix-netscaler-zero-day-to-deploy-web-shells/). [Help Net Security](https://www.helpnetsecurity.com/2026/09/28/citrix-netscaler-rce-zero-days-exploited-for-weeks-cve-2026-88771-cve-2026-88772/) évoque une exploitation mondiale pendant des semaines.

D'où la conclusion résumée par [Hardware Busters](https://hwbusters.com/news/citrix-patches-two-exploited-netscaler-zero-days-but-patching-wont-evict-anyone-already-inside/) : le correctif ferme la porte, mais n'expulse pas ceux qui sont déjà entrés. Les organisations concernées doivent chercher des traces de compromission et renouveler les identifiants exposés. Aux États-Unis, la [CISA](https://www.cisa.gov/news-events/alerts/2026/09/27/critical-zero-day-vulnerabilities-exploited-citrix-netscaler-adc-gateway) a inscrit les deux failles dès le 27 septembre dans son catalogue des vulnérabilités activement exploitées, qui impose aux agences fédérales civiles de corriger dans un délai contraint.

Le scénario a un précédent. En 2023, la faille baptisée CitrixBleed (CVE-2023-4966), qui permettait de dérober des jetons de session dans la mémoire des mêmes équipements et donc de contourner l'authentification multifacteur, avait été [corrigée le 10 octobre](https://www.tenable.com/blog/frequently-asked-questions-for-citrixbleed-cve-2023-4966), puis exploitée par des [affiliés du rançongiciel LockBit](https://www.cisa.gov/sites/default/files/2023-11/aa23-325a_lockbit_3.0_ransomware_affiliates_exploit_cve-2023-4966_citrix_bleed_vulnerability_0.pdf). Trois ans plus tard, la leçon reste entière : les équipements de bordure, pensés pour protéger le réseau, en sont devenus la cible privilégiée, et chaque faille critique y ouvre une course de vitesse que les défenseurs démarrent souvent avec des semaines de retard.

## En bref

- Deux failles critiques des passerelles Citrix NetScaler, corrigées le 27 septembre, étaient exploitées depuis au moins début septembre.
- Environ 22 000 équipements sont exposés sur Internet, et les versions en fin de vie ne seront pas corrigées.
- Appliquer le correctif ne chasse pas un attaquant déjà installé : une recherche de compromission s'impose.

## Notions clés

- **Vulnérabilité zero-day** : faille exploitée alors qu'aucun correctif n'existe encore, ce qui laisse les défenseurs sans protection au moment de l'attaque. [Comprendre](https://fr.wikipedia.org/wiki/Vuln%C3%A9rabilit%C3%A9_zero-day)
- **CERT-FR** : centre gouvernemental français de veille, d'alerte et de réponse aux attaques informatiques, rattaché à l'ANSSI ; ses « alertes » signalent les failles activement exploitées. [Comprendre](https://www.cert.ssi.gouv.fr/)
- **Marché des failles** : les vulnérabilités inédites et leurs codes d'exploitation se vendent et s'achètent, entre criminels, courtiers et États, ce qui explique leur valeur stratégique. [Comprendre](https://en.wikipedia.org/wiki/Market_for_zero-day_exploits)

## Pour aller plus loin

- [Defending Against Active Exploitation of Citrix NetScaler ADC and Gateway Appliances](https://cloud.google.com/blog/topics/threat-intelligence/defending-against-active-exploitation-of-citrix-netscaler-adc-and-gateway-appliances) — Google Cloud (Mandiant) : l'analyse technique de la campagne et les mesures de détection recommandées (en anglais).
- [Threat Brief: NetScaler Zero Days CVE-2026-88771 and CVE-2026-88772 Exploited in the Wild](https://unit42.paloaltonetworks.com/netscaler-zero-days-exploited/) — Unit 42 (Palo Alto Networks) : une synthèse de la menace et des indicateurs de compromission (en anglais).
- [LockBit 3.0 Ransomware Affiliates Exploit CVE 2023-4966](https://www.cisa.gov/sites/default/files/2023-11/aa23-325a_lockbit_3.0_ransomware_affiliates_exploit_cve-2023-4966_citrix_bleed_vulnerability_0.pdf) — CISA : l'avis de 2023 qui montre comment une faille Citrix devient la porte d'entrée d'un rançongiciel (en anglais).
- [Vue d'ensemble des menaces par rançongiciel de 2025 à 2027](https://www.canada.ca/fr/securite-telecommunications/nouvelles/2025/12/publication-par-le-centre-pour-la-cybersecurite-de-la-vue-densemble-des-menaces-par-rancongiciel-de-2025-a-2027.html) — Centre canadien pour la cybersécurité : une évaluation prospective, en français, de la menace criminelle qui exploite ce type de faille.

## Sources

- [Citrix confirms two NetScaler RCE zero-days exploited in attacks](https://www.bleepingcomputer.com/news/security/citrix-admins-warned-to-shut-down-netscalers-over-2-exploited-zero-days/) — BleepingComputer, septembre 2026
- [Citrix Confirms 2 NetScaler Zero-Days After Admins Pulled the Plug](https://www.securityweek.com/citrix-confirms-2-netscaler-zero-days-after-admins-pulled-the-plug/) — SecurityWeek, septembre 2026
- [Dual NetScaler Zero-Days Trigger Chaos for Citrix Customers](https://www.darkreading.com/vulnerabilities-threats/netscaler-zero-days-chaos-citrix) — Dark Reading, septembre 2026
- [Multiples vulnérabilités dans Citrix NetScaler ADC et Gateway](https://www.cert.ssi.gouv.fr/alerte/CERTFR-2026-ALE-011/) — CERT-FR, 28 septembre 2026
- [Security Bulletin for CVE-2026-88771 to CVE-2026-88778](https://support.citrix.com/external/article/CTX697096/citrix-netscaler-adc-and-citrix-netscale.html) — Citrix, 27 septembre 2026
- [Citrix NetScaler PreAuth Command Injection CVE-2026-88771](https://labs.watchtowr.com/oh-look-the-foot-gun-went-off-again-citrix-netscaler-preauth-command-injection-cve-2026-88771/) — watchTowr Labs, septembre 2026
- [Zero-Day Exploitation of Citrix NetScaler ADC and Gateway](https://www.rapid7.com/blog/post/etr-zero-day-exploitation-of-citrix-netscaler-adc-and-gateway-cve-2026-88771-and-cve-2026-88772/) — Rapid7, septembre 2026
- [Citrix NetScaler Zero-Day RCE vulnerabilities: FAQ](https://www.tenable.com/blog/frequently-asked-questions-about-reported-citrix-netscaler-zero-day-vulnerabilities) — Tenable, septembre 2026
- [Critical Citrix NetScaler zero-day flaws exploited in the wild: 22K servers exposed](https://cybernews.com/security/citrix-netscaler-rce-vulnerabilities-active-attack/) — Cybernews, septembre 2026
- [Defending Against Active Exploitation of Citrix NetScaler ADC and Gateway Appliances](https://cloud.google.com/blog/topics/threat-intelligence/defending-against-active-exploitation-of-citrix-netscaler-adc-and-gateway-appliances) — Google Cloud (Mandiant), septembre 2026
- [Hackers exploit Citrix NetScaler zero-day to deploy web shells](https://www.bleepingcomputer.com/news/security/hackers-exploit-citrix-netscaler-zero-day-to-deploy-web-shells/) — BleepingComputer, septembre 2026
- [Citrix NetScaler RCE zero-days exploited globally for weeks](https://www.helpnetsecurity.com/2026/09/28/citrix-netscaler-rce-zero-days-exploited-for-weeks-cve-2026-88771-cve-2026-88772/) — Help Net Security, 28 septembre 2026
- [Citrix Patches Two Exploited NetScaler Zero-Days, but Patching Won't Evict Anyone Already Inside](https://hwbusters.com/news/citrix-patches-two-exploited-netscaler-zero-days-but-patching-wont-evict-anyone-already-inside/) — Hardware Busters, septembre 2026
- [Critical Zero-Day Vulnerabilities Exploited in Citrix NetScaler ADC, Gateway](https://www.cisa.gov/news-events/alerts/2026/09/27/critical-zero-day-vulnerabilities-exploited-citrix-netscaler-adc-gateway) — CISA, 27 septembre 2026
- [Frequently Asked Questions for CitrixBleed (CVE-2023-4966)](https://www.tenable.com/blog/frequently-asked-questions-for-citrixbleed-cve-2023-4966) — Tenable, 2023
- [LockBit 3.0 Ransomware Affiliates Exploit CVE 2023-4966](https://www.cisa.gov/sites/default/files/2023-11/aa23-325a_lockbit_3.0_ransomware_affiliates_exploit_cve-2023-4966_citrix_bleed_vulnerability_0.pdf) — CISA, novembre 2023
