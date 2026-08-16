# Installation, mise à niveau et désinstallation

[English](INSTALLATION.md) | [简体中文](INSTALLATION.zh-CN.md) | [繁體中文](INSTALLATION.zh-TW.md) | [Français](INSTALLATION.fr.md)

## Avant de commencer

- Utilisez Obsidian de bureau `1.12.7` ou plus récent sous Windows.
- Cette version publique n'a pas encore été validée sur macOS ou Linux et ne
  prend pas en charge les appareils mobiles.
- Testez d'abord dans un coffre séparé avec des livres d'exemple non
  sensibles.
- Conservez une sauvegarde des données locales du plugin si la progression,
  les signets, les extraits, les paramètres ou les notes générées ont de la
  valeur pour vous.
- N'utilisez pas ce plugin pour contourner le DRM.

## Installer la version publique GitHub

1. Ouvrez la page
   [Releases](https://github.com/SunnyD0697/local-book-reader/releases) du
   dépôt.
2. Téléchargez `local-book-reader-0.3.6.zip`. Ne téléchargez **pas** l'archive
   **Source code (zip)** générée automatiquement par GitHub ; c'est du code
   source, pas un paquet d'installation.
3. Fermez Obsidian ou désactivez Local Book Reader pendant le remplacement des
   fichiers.
4. Créez `<Vault>/.obsidian/plugins/local-book-reader/`.
5. Extrayez le ZIP d'installation dans ce dossier. Vérifiez que ces trois
   fichiers d'exécution se trouvent directement dans le dossier
   `local-book-reader` :
   - `main.js`
   - `manifest.json`
   - `styles.css`
6. Rouvrez Obsidian et activez **Local Book Reader** dans les plugins
   communautaires. Les nouvelles installations commencent en anglais ;
   choisissez **Langue de l'interface** dans **Paramètres du plugin** à tout
   moment pour basculer entre English, 简体中文, 繁體中文 et Français. Ce
   choix ne modifie jamais les livres, notes, dossiers ou données de lecture.

Utilisez la pièce jointe `SHA256SUMS.txt` de la même Release si vous voulez
vérifier le ZIP téléchargé avant de l'extraire.

Local Book Reader est également disponible dans le répertoire des plugins
communautaires Obsidian. Les mêmes trois fichiers d'exécution sont utilisés
pour les deux méthodes d'installation.

## Compiler et installer à partir des sources

1. Installez Node.js `22.13.0` ou plus récent et pnpm `11.9.0`.
2. Exécutez `pnpm install --frozen-lockfile` puis `pnpm run build` dans le
   dépôt.
3. Suivez les étapes 3–6 ci-dessus. Le ZIP public `0.3.6` et la compilation
   depuis les sources utilisent les trois fichiers d'exécution standard :
   `main.js`, `manifest.json` et `styles.css`.

Le guide de première utilisation s'affiche dans Obsidian. Le plugin laisse
les extensions de livres sous le contrôle d'Obsidian pour éviter les blocages
au démarrage avec les grandes bibliothèques.

## Mise à niveau

1. Sauvegardez `<Vault>/.obsidian/plugins/local-book-reader/data/` s'il
   existe.
2. Téléchargez le ZIP d'installation dédié à la nouvelle version.
3. Désactivez le plugin ou fermez Obsidian.
4. Remplacez les trois fichiers d'exécution listés ci-dessus. Si vous mettez
   à niveau depuis `0.3.0`, vous pouvez également supprimer le fichier
   `pdf.worker.min.mjs` qui n'est plus utilisé.
5. Rouvrez Obsidian et confirmez que le plugin se charge avant d'ouvrir un
   livre.

Avant d'écrire des données mises à niveau, le plugin peut créer des
sauvegardes liées à la version de son index, de l'état de lecture et des
paramètres. Ces sauvegardes ne contiennent pas le contenu des livres et ne
remplacent pas votre propre sauvegarde.

## Désinstallation

1. Désactivez Local Book Reader dans Obsidian.
2. Sauvegardez `<Vault>/.obsidian/plugins/local-book-reader/data/` si vous
   voulez conserver les données de lecture propres au plugin.
3. Supprimez le dossier du plugin `local-book-reader` uniquement après cette
   sauvegarde.

La désinstallation ne supprime, ne déplace, ne renomme, n'écrase et ne modifie
d'aucune façon les livres d'origine. Les notes Markdown que vous avez créées
restent dans le coffre.
