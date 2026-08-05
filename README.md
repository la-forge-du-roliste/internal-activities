# Internal Activities

Internal Activities is a small module for Foundry Virtual Tabletop V14 and the D&D5e 5.3 system. It lets a GM hide selected activities from the dialog that asks the user to choose among multiple activities, without disabling or removing those activities.

[Lire la documentation française](#français)

## Behavior

An internal activity remains a normal part of its Item:

- it can remain the primary activity;
- if it is the only usable activity, normal Item use can still execute it;
- the module does not disable activities or change `activity.canUse`, `activity.use()`, or `item.system.activities`;
- it is hidden only when D&D5e displays a dialog containing multiple activity choices;
- direct calls, macros, Midi-QOL, SC – More Activities, and other automations can still execute it.

## Features

- Eye button in the Item activity list.
- GM-only administration.
- State stored as flags on each Item.
- Direct macro and automation compatibility.
- Optional compatibility with Midi-QOL and SC – More Activities; neither is required.
- Automatic cleanup of identifiers belonging to deleted activities.
- English and French translations.

## Requirements

- Foundry Virtual Tabletop V14.
- D&D5e 5.3 or a later release in a branch compatible with Foundry V14.
- No required module dependencies.

## Installation

### Foundry package browser

Once the module has been accepted into the Foundry package catalog, search for **Internal Activities** in the Add-on Modules browser and install it from there.

### Manifest URL

Paste this URL into the **Manifest URL** field of Foundry's Add-on Modules installer:

```text
https://github.com/theorikkdk/internal-activities/releases/latest/download/module.json
```

This URL will work only after the first GitHub release has been published.

For a manual installation, the final manifest path must be `Data/modules/internal-activities/module.json`. Avoid an additional nested directory.

## Usage

1. Open a D&D5e Item as a GM.
2. Open its Activities tab.
3. Click the eye button in the controls of an activity.
4. The activity remains usable but is omitted when D&D5e displays the multiple-activity choice dialog.

Click the button again to make the activity visible in that dialog.

## Permissions

Only a GM can mark or unmark internal activities, either from the Item sheet or through the public write API. Read methods remain available to other users.

## API

```js
const api = game.modules.get("internal-activities")?.api;
```

- `getInternalActivityIds(item)` returns the valid internal activity IDs as an array.
- `isInternal(item, activityId)` returns a boolean.
- `setInternal(item, activityId, internal)` sets the requested state. It returns `true` on success and `false` on refusal or failure. Writing is restricted to GMs.
- `toggleInternal(item, activityId)` toggles the state. It returns the new boolean state on success and `null` on refusal or failure. Writing is restricted to GMs.

## Compatibility

The module is designed for Foundry VTT V14 and tested with D&D5e 5.3.3. Midi-QOL and SC – More Activities remain optional and are compatible with the tested direct and automated activity-use workflows.

Report problems through [GitHub Issues](https://github.com/theorikkdk/internal-activities/issues).

## License and attributions

The source code is distributed under the [MIT License](LICENSE). Third-party resource information is documented in [ATTRIBUTIONS.md](ATTRIBUTIONS.md).

---

## Français

Internal Activities est un petit module pour Foundry Virtual Tabletop V14 et le système D&D5e 5.3. Il permet au MJ de masquer certaines activités dans la boîte de dialogue proposant plusieurs choix, sans désactiver ni supprimer ces activités.

### Comportement

Une activité interne reste une activité normale de son objet :

- elle peut rester l’activité principale ;
- si elle est la seule activité utilisable, l’utilisation normale de l’objet peut toujours l’exécuter ;
- le module ne désactive pas les activités et ne modifie pas `activity.canUse`, `activity.use()` ou `item.system.activities` ;
- elle est masquée uniquement lorsque D&D5e affiche une boîte de dialogue contenant plusieurs choix d’activité ;
- les appels directs, macros, Midi-QOL, SC – More Activities et autres automatisations peuvent toujours l’exécuter.

### Fonctionnalités

- Bouton œil dans la liste des activités de l’objet.
- Administration réservée au MJ.
- État stocké dans les flags de chaque objet.
- Compatibilité avec les macros et automatisations directes.
- Compatibilité optionnelle avec Midi-QOL et SC – More Activities ; aucun des deux n’est obligatoire.
- Nettoyage automatique des identifiants d’activités supprimées.
- Traductions française et anglaise.

### Prérequis

- Foundry Virtual Tabletop V14.
- D&D5e 5.3 ou une version ultérieure appartenant à une branche compatible avec Foundry V14.
- Aucun module obligatoire.

### Installation

Après acceptation dans le catalogue Foundry, recherchez **Internal Activities** dans le navigateur de modules complémentaires.

Pour une installation par manifeste, collez l’URL suivante dans le champ **Manifest URL** :

```text
https://github.com/theorikkdk/internal-activities/releases/latest/download/module.json
```

Cette URL ne fonctionnera qu’après la publication de la première release GitHub.

Pour une installation manuelle, le chemin final doit être `Data/modules/internal-activities/module.json`, sans dossier intermédiaire supplémentaire.

### Utilisation

1. Ouvrez un objet D&D5e en tant que MJ.
2. Ouvrez son onglet Activités.
3. Cliquez sur le bouton œil dans les contrôles d’une activité.
4. L’activité reste utilisable, mais disparaît lorsque D&D5e affiche la boîte de choix entre plusieurs activités.

Cliquez de nouveau sur le bouton pour rendre l’activité visible dans cette boîte.

### Permissions

Seul un MJ peut marquer ou démarquer une activité interne, depuis la fiche ou avec les méthodes d’écriture de l’API. Les méthodes de lecture restent accessibles aux autres utilisateurs.

### API

```js
const api = game.modules.get("internal-activities")?.api;
```

- `getInternalActivityIds(item)` renvoie le tableau des identifiants internes valides.
- `isInternal(item, activityId)` renvoie un booléen.
- `setInternal(item, activityId, internal)` applique l’état demandé. La méthode renvoie `true` en cas de réussite et `false` en cas de refus ou d’échec. L’écriture est réservée au MJ.
- `toggleInternal(item, activityId)` inverse l’état. La méthode renvoie le nouvel état booléen en cas de réussite et `null` en cas de refus ou d’échec. L’écriture est réservée au MJ.

### Compatibilité

Le module cible Foundry VTT V14 et a été testé avec D&D5e 5.3.3. Midi-QOL et SC – More Activities restent facultatifs et sont compatibles avec les usages directs et automatisés testés.

Signalez les problèmes dans les [issues GitHub](https://github.com/theorikkdk/internal-activities/issues).

### Licence et attributions

Le code source est distribué sous [licence MIT](LICENSE). Les informations relatives aux ressources tierces figurent dans [ATTRIBUTIONS.md](ATTRIBUTIONS.md).
