import { gemengine } from "./module/config.js";
import GemItemSheet from "./module/sheets/GemItemSheet.js";
import GemCharacterSheet from "./module/sheets/GemCharacterSheet.js";

async function preloadHandlebarsTemplates() {
    const templatePaths = [
        "systems/gemengine/templates/partials/attributes-panel.hbs",
        "systems/gemengine/templates/partials/equipment-panel.hbs"
    ];

    return loadTemplates(templatePaths);
}

Hooks.once("init", function() {
    console.log("gemengine | Initialising Gem Engine System...");
    CONFIG.gemengine = gemengine;

    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("gemengine", GemItemSheet, { makeDefault: true });

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("gemengine", GemCharacterSheet, { makeDefault: true });

    preloadHandlebarsTemplates();
});