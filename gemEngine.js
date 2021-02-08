import { gemengine } from "./module/config.js";
import GemItemSheet from "./module/sheets/GemItemSheet.js";
import GemCharacterSheet from "./module/sheets/GemCharacterSheet.js";

async function preloadHandlebarsTemplates() {
    const path = "systems/gemengine/templates/partials";
    const templatePaths = [
        `${path}/attributes-panel.hbs`,
        `${path}/data-panel.hbs`,
        `${path}/equipment-panel.hbs`,
        `${path}/aspects-panel.hbs`,
        `${path}/talents-panel.hbs`,
        `${path}/state-panel.hbs`,
        `${path}/equipment-element.hbs`,
        `${path}/talent-element.hbs`,
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

    Handlebars.registerHelper("times", function (n, content) {
        let result = "";
        for (let i = 0; i < n; ++i) {
            content.data.index = i + 1;
            result += content.fn(i);
        }
    
        return result;
    });

    Handlebars.registerHelper('ifGreater', function(v1, v2, options) {
        if(parseInt(v1) > parseInt(v2)) {
            return options.fn(this);
        }
        return options.inverse(this);
    });

    Handlebars.registerHelper('ifLess', function(v1, v2, options) {
        if(v1 < v2) {
            return options.fn(this);
        }
        return options.inverse(this);
    });
    
    Handlebars.registerHelper('isGM', function(options) {
        if(game.user.isGM) {
            return options.fn(this);
        }
        return options.inverse(this);
    });

    
});