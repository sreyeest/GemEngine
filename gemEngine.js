import { gemengine } from "./module/config.js";
import GemItemSheet from "./module/sheets/GemItemSheet.js";

Hooks.once("init", function() {
    CONFIG.gemengine = gemengine;

    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("gemengine", GemItemSheet, { makeDefault: true });
});