import { GemItemSheet } from "./module/sheets/GemItemSheet.js";

Hooks.once("init", function() {
    console.log("gemEngine | Initialising Gem Engine System");

    Items.unregisterSheet("core", ItemsSheet);
    Items.registerSheet("gem-engine", GemItemSheet, { makeDefault: true });
});