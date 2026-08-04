const MODULE_ID = "internal-activities";
const FLAG_KEY = "activityIds";

function getRootElement(html) {
  if (html instanceof HTMLElement) return html;
  if (html?.[0] instanceof HTMLElement) return html[0];
  return null;
}

function getItemFromApplication(app) {
  const candidates = [app?.item, app?.document, app?.object];
  return candidates.find(candidate => candidate?.documentName === "Item") ?? null;
}

function getInternalActivityIds(item) {
  const value = item?.getFlag?.(MODULE_ID, FLAG_KEY);
  return Array.isArray(value) ? value.filter(id => typeof id === "string") : [];
}

function isInternal(item, activityId) {
  return getInternalActivityIds(item).includes(activityId);
}

async function setInternal(item, activityId, internal = true) {
  if (!item?.isOwner) {
    ui.notifications.warn(game.i18n.localize("INTERNAL-ACTIVITIES.NoPermission"));
    return false;
  }

  const ids = new Set(getInternalActivityIds(item));
  if (internal) ids.add(activityId);
  else ids.delete(activityId);

  const next = [...ids];
  if (next.length) await item.setFlag(MODULE_ID, FLAG_KEY, next);
  else await item.unsetFlag(MODULE_ID, FLAG_KEY);
  return true;
}

async function toggleInternal(item, activityId) {
  const nextState = !isInternal(item, activityId);
  const updated = await setInternal(item, activityId, nextState);
  return updated ? nextState : isInternal(item, activityId);
}

/**
 * Masque seulement les boutons de la boîte de choix D&D5e.
 * L'activité reste utilisable par code, SC - More Activities et Midi-QOL.
 */
function filterActivityChoiceDialog(app, html) {
  const root = getRootElement(html);
  const item = app?.item ?? getItemFromApplication(app);
  if (!root || !item) return;

  const internalIds = new Set(getInternalActivityIds(item));
  if (!internalIds.size) return;

  for (const button of root.querySelectorAll("button[data-activity-id]")) {
    if (!internalIds.has(button.dataset.activityId)) continue;
    button.closest("li")?.remove();
  }

  const remaining = root.querySelectorAll("button[data-action='choose'][data-activity-id]");
  if (!remaining.length) {
    const menu = root.querySelector("menu");
    if (menu && !menu.querySelector(".internal-activities-empty")) {
      const message = document.createElement("li");
      message.className = "internal-activities-empty";
      message.textContent = game.i18n.localize("INTERNAL-ACTIVITIES.NoVisibleActivity");
      menu.append(message);
    }
  }
}

/** Ajoute le bouton œil dans l'onglet Activités d'une fiche d'objet D&D5e. */
function enhanceItemSheet(app, html) {
  const root = getRootElement(html);
  const item = getItemFromApplication(app);
  if (!root || !item || game.system.id !== "dnd5e" || !item.isOwner) return;

  const internalIds = new Set(getInternalActivityIds(item));

  for (const row of root.querySelectorAll("[data-activity-id]")) {
    const activityId = row.dataset.activityId;
    if (!activityId || !item.system?.activities?.get?.(activityId)) continue;

    const controls = row.querySelector(":scope .activity-controls") ?? row.querySelector(".activity-controls");
    if (!controls || controls.querySelector("[data-internal-activities-toggle]")) continue;

    const internal = internalIds.has(activityId);
    row.classList.toggle("internal-activities-internal", internal);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "unbutton control-button item-control internal-activities-toggle";
    button.classList.toggle("active", internal);
    button.dataset.internalActivitiesToggle = activityId;

    const labelKey = internal ? "INTERNAL-ACTIVITIES.Unmark" : "INTERNAL-ACTIVITIES.Mark";
    const label = game.i18n.localize(labelKey);
    button.setAttribute("aria-label", label);
    button.setAttribute("data-tooltip", label);
    button.innerHTML = `<i class="fa-solid ${internal ? "fa-eye-slash" : "fa-eye"}" inert></i>`;

    button.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();
      await toggleInternal(item, activityId);
      app.render({ force: true });
    });

    const contextButton = controls.querySelector("[data-context-menu]");
    if (contextButton) controls.insertBefore(button, contextButton);
    else controls.append(button);
  }
}

async function cleanupStaleIds(item) {
  if (!item?.isOwner || game.system.id !== "dnd5e") return;

  const stored = getInternalActivityIds(item);
  if (!stored.length) return;

  const activities = item.system?.activities;
  const validIds = new Set(activities ? Array.from(activities, activity => activity.id) : []);
  const cleaned = stored.filter(id => validIds.has(id));
  if (cleaned.length === stored.length) return;

  if (cleaned.length) await item.setFlag(MODULE_ID, FLAG_KEY, cleaned);
  else await item.unsetFlag(MODULE_ID, FLAG_KEY);
}

Hooks.once("init", () => {
  const module = game.modules.get(MODULE_ID);
  if (module) {
    module.api = {
      getInternalActivityIds,
      isInternal,
      setInternal,
      toggleInternal
    };
  }
});

// Hook spécifique de la boîte de choix D&D5e 5.2+.
Hooks.on("renderActivityChoiceDialog", filterActivityChoiceDialog);

// ApplicationV2 est utilisé par D&D5e 5.3 sous Foundry V14.
Hooks.on("renderApplicationV2", (app, html) => {
  if (app?.constructor?.name === "ActivityChoiceDialog") {
    filterActivityChoiceDialog(app, html);
    return;
  }
  enhanceItemSheet(app, html);
});

// Filet de sécurité pour les fiches qui émettent encore le hook ItemSheet.
Hooks.on("renderItemSheet", enhanceItemSheet);

Hooks.on("updateItem", (item, changes) => {
  if (!foundry.utils.hasProperty(changes, "system.activities")) return;
  cleanupStaleIds(item).catch(error => {
    console.error(`${MODULE_ID} | Impossible de nettoyer les activités internes obsolètes.`, error);
  });
});

Hooks.once("ready", () => {
  console.info(`${MODULE_ID} | ${game.i18n.localize("INTERNAL-ACTIVITIES.Ready")}`);
});
