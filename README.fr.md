# Local Book Reader

[English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [Français](README.fr.md)

Local Book Reader est un plugin Obsidian pour ordinateur de bureau qui permet
de lire et d'organiser des livres électroniques personnels dans le coffre
(Vault) actif. Il traite les livres localement, considère les fichiers de
livres d'origine comme des entrées en lecture seule et enregistre les
résultats de recherche sous forme de notes Markdown ordinaires.

> **État de la version :** `0.3.6` est la dernière version publiée
> publiquement sur GitHub. Téléchargez le ZIP d'installation dédié depuis la
> page Releases de GitHub.
>
> **État du répertoire communautaire :** Local Book Reader est disponible dans
> le répertoire des plugins de la communauté Obsidian.

## Fonctionnalités

- Ouvre les fichiers EPUB, MOBI, AZW, AZW3, TXT et PDF non chiffrés du coffre
  actif.
- Fournit une analyse manuelle et interrompable de la bibliothèque personnelle,
  avec recherche et filtres.
- Enregistre localement la progression de lecture, les signets, les extraits,
  l'apparence de lecture et les sauvegardes propres au plugin.
- Crée des notes Markdown de lecture et de recherche uniquement à la demande.
- Assure le rendu local des PDF avec un worker hors ligne intégré.

## Échelle et performances vérifiées

Lors d'un test sur une véritable collection locale sous Obsidian pour
Windows, la première analyse complète de 10 336 livres a duré environ deux
minutes. L'analyse affiche la progression et peut être suspendue, reprise ou
annulée. Il s'agit d'un résultat observé, pas d'une garantie de performance
minimale ; le temps réel dépend de l'ordinateur et de la collection.

## Promesses de sécurité et de confidentialité

- Les livres d'origine sont en lecture seule : le plugin ne doit pas les
  copier, déplacer, renommer, écraser ou supprimer.
- Aucune fonction de suppression de livres.
- Le contournement du DRM et les livres protégés par DRM sont hors du
  périmètre.
- Le plugin n'envoie pas volontairement de requêtes réseau, ne démarre pas de
  serveur, n'exécute pas de programmes externes, ne collecte pas de
  télémétrie et n'exige pas de compte.
- Le contenu des livres est une entrée non fiable. Le correctif `foliate-js`
  fourni supprime `allow-scripts` de l'iframe pour l'environnement
  Electron/Chromium.

Certaines actions affectent volontairement les données propres au plugin ou
les notes Markdown demandées par l'utilisateur. Une exportation de sauvegarde
confirmée par l'utilisateur peut créer un nouveau fichier JSON hors du coffre,
à un emplacement choisi par l'utilisateur. Lisez [PRIVACY.md](PRIVACY.md) et
[SECURITY.md](SECURITY.md) pour les limites complètes.

## Exigences de la version publique

- Obsidian de bureau `1.12.7` ou plus récent
- Windows ; cette version n'a pas encore été validée sur macOS ou Linux
- Un coffre contenant des livres que vous êtes autorisé à lire
- Interfaces English, 简体中文, 繁體中文 et Français. Les installations
  existantes conservent le chinois simplifié ; les nouvelles installations
  commencent en anglais et peuvent changer de langue dans **Paramètres du
  plugin**. Le changement ne renomme, ne déplace et ne réécrit jamais les
  livres, notes, dossiers ou données de lecture existants.

Les appareils mobiles ne sont pas pris en charge.

## Installation, mise à niveau et désinstallation

Téléchargez le ZIP d'installation dédié depuis la page Releases de GitHub.
N'utilisez **pas** l'archive **Source code (zip)** générée automatiquement par
GitHub comme paquet d'installation.

Les instructions détaillées figurent dans
[docs/INSTALLATION.fr.md](docs/INSTALLATION.fr.md). Testez d'abord dans un
coffre séparé avec des livres d'exemple non sensibles.

## Compilation à partir des sources

Node.js `22.13.0` ou plus récent et pnpm `11.9.0` :

```powershell
pnpm install --frozen-lockfile
pnpm run build
```

Les fichiers d'exécution sont `main.js`, `manifest.json` et `styles.css`. Le
worker PDF est intégré dans `main.js`, la structure correspond donc au format
d'installation standard des plugins communautaires Obsidian. Ne committez pas
les artefacts générés ; ils appartiennent aux pièces jointes des Releases
GitHub.

## Limites connues

- Distribué via le répertoire des plugins communautaires Obsidian et les
  Releases GitHub.
- Les PDF scannés ne fournissent pas d'OCR.
- Pas de synchronisation cloud, de conversion de livres, de métadonnées en
  ligne, de fonctions IA, de synthèse vocale ni d'indexation plein texte de
  toute la bibliothèque.
- L'organisation, le renommage, le déplacement, la fusion et la suppression
  automatiques des livres sont volontairement exclus.

## Limites du projet

Ce projet n'est pas un gestionnaire général de livres, un lecteur cloud, un
outil DRM ni un service de conversion. Il évite volontairement l'indexation
automatique de tout le coffre au démarrage d'Obsidian ; utilisez l'analyse
explicite ou l'actualisation de la bibliothèque personnelle.

## Contribution et assistance

- Lisez [CONTRIBUTING.md](CONTRIBUTING.md) avant d'ouvrir une pull request.
- Utilisez [SUPPORT.md](SUPPORT.md) pour signaler des problèmes en toute
  sécurité.
- Signalez les vulnérabilités en privé comme décrit dans
  [SECURITY.md](SECURITY.md).
- Consultez [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) pour les
  logiciels intégrés et les licences.

## Auteur

Créé et maintenu par Sunny D
([@SunnyD0697](https://github.com/SunnyD0697)).

## Licence

Local Book Reader est distribué sous
[licence MIT](LICENSE). Les composants tiers intégrés conservent leurs
licences respectives.
