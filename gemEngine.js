import GemItemSheet from "./module/sheets/GemItemSheet.js";

Hooks.once("init", function() {
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("gemengine", GemItemSheet, { makeDefault: true });
});