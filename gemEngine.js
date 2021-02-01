import { gemengine } from "./module/config.js";
import GemItemSheet from "./module/sheets/GemItemSheet.js";
import GemCharacterSheet from "./module/sheets/GemCharacterSheet.js";

Hooks.once("init", function() {
    CONFIG.gemengine = gemengine;

    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("gemengine", GemItemSheet, { makeDefault: true });

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("gemengine", GemCharacterSheet, { makeDefault: true });
});