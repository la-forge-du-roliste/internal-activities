const MODULE_ID = "internal-activities";
const FLAG_KEY = "activityIds";
const itemWriteQueues = new Map();

function getRootElement(html) {
  if (html instanceof HTMLElement) return html;
  if (html?.[0] instanceof HTMLElement) return html[0];
  return null;
}

function getItemFromApplication(app) {
  const candidates = [app?.item, app?.document, app?.object];
  return candidates.find(candidate => candidate?.documentName === "Item") ?? null;
}

function normalizeInternalActivityIds(item, value) {
  if (!Array.isArray(value)) return [];

  const activities = item?.system?.activities;
  if (!activities?.get) return [];

  const seen = new Set();
  return value.filter(id => {
    if (typeof id !== "string" || !id.length || seen.has(id) || !activities.get(id)) return false;
    seen.add(id);
    return true;
  });
}

function getInternalActivityIds(item) {
  return normalizeInternalActivityIds(item, item?.getFlag?.(MODULE_ID, FLAG_KEY));
}

function isInternal(item, activityId) {
  return getInternalActivityIds(item).includes(activityId);
}

function notifyValidationFailure(messageKey, details) {
  console.warn(`${MODULE_ID} | ${details}`);
  ui.notifications.warn(game.i18n.localize(messageKey));
}

function validateWriteRequest(item, activityId) {
  if (item?.documentName !== "Item") {
    notifyValidationFailure("INTERNAL-ACTIVITIES.InvalidItem", "Écriture refusée : le document fourni n’est pas un Item.");
    return false;
  }
  if (!game.user?.isGM) {
    notifyValidationFailure("INTERNAL-ACTIVITIES.NoPermission", "Écriture refusée : cette action est réservée au MJ.");
    return false;
  }
  if (typeof activityId !== "string" || !activityId.length || !item.system?.activities?.get?.(activityId)) {
    notifyValidationFailure(
      "INTERNAL-ACTIVITIES.InvalidActivity",
      `Écriture refusée : l’activité « ${String(activityId)} » est invalide ou absente de l’Item ${item.uuid}.`
    );
    return false;
  }
  return true;
}

function enqueueItemWrite(item, operation) {
  const key = item.uuid ?? item.id;
  const previous = itemWriteQueues.get(key) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(operation);
  itemWriteQueues.set(key, current);

  return current.finally(() => {
    if (itemWriteQueues.get(key) === current) itemWriteQueues.delete(key);
  });
}

function hasStoredFlag(item) {
  return foundry.utils.hasProperty(item.flags, `${MODULE_ID}.${FLAG_KEY}`);
}

async function persistInternalActivityIds(item, ids) {
  if (ids.length) await item.setFlag(MODULE_ID, FLAG_KEY, ids);
  else if (hasStoredFlag(item)) await item.unsetFlag(MODULE_ID, FLAG_KEY);
}

async function runManualWrite(item, operation) {
  try {
    return await enqueueItemWrite(item, operation);
  } catch (error) {
    console.error(`${MODULE_ID} | Échec de l’enregistrement des activités internes pour ${item.uuid}.`, error);
    ui.notifications.error(game.i18n.localize("INTERNAL-ACTIVITIES.SaveFailed"));
    return null;
  }
}

async function setInternal(item, activityId, internal = true) {
  if (!validateWriteRequest(item, activityId)) return false;

  const result = await runManualWrite(item, async () => {
    const ids = new Set(getInternalActivityIds(item));
    if (internal) ids.add(activityId);
    else ids.delete(activityId);

    await persistInternalActivityIds(item, [...ids]);
    return true;
  });

  return result ?? false;
}

async function toggleInternal(item, activityId) {
  if (!validateWriteRequest(item, activityId)) return null;

  return runManualWrite(item, async () => {
    const ids = new Set(getInternalActivityIds(item));
    const nextState = !ids.has(activityId);
    if (nextState) ids.add(activityId);
    else ids.delete(activityId);

    await persistInternalActivityIds(item, [...ids]);
    return nextState;
  });
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
  if (!root || !item || game.system.id !== "dnd5e" || !game.user?.isGM) return;

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
      if (button.disabled) return;

      button.disabled = true;
      try {
        const result = await toggleInternal(item, activityId);
        if (result !== null) app.render({ force: true });
      } finally {
        button.disabled = false;
      }
    });

    const contextButton = controls.querySelector("[data-context-menu]");
    if (contextButton) controls.insertBefore(button, contextButton);
    else controls.append(button);
  }
}

async function cleanupStaleIds(item) {
  if (item?.documentName !== "Item" || !game.user?.isGM || game.system.id !== "dnd5e" || !hasStoredFlag(item)) return;

  await enqueueItemWrite(item, async () => {
    const raw = item.getFlag(MODULE_ID, FLAG_KEY);
    const cleaned = normalizeInternalActivityIds(item, raw);
    const alreadyClean = cleaned.length > 0
      && Array.isArray(raw)
      && raw.length === cleaned.length
      && raw.every((id, index) => id === cleaned[index]);
    if (alreadyClean) return;

    await persistInternalActivityIds(item, cleaned);
  });
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

// Hook spécifique de la boîte de choix D&D5e 5.3.
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
