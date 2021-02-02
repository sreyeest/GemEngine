export default class GemCharacterSheet extends ActorSheet {

    static get defaultOption() {
        return mergeObject(super.defaultOption, {
            template: "systems/gemengine/templates/sheets/character-sheet.hbs",
            classes: ["gemengine", "sheet", "actor", "character"] 
        });
    }

    get template() {
		const path = "systems/gemengine/templates/sheets";
		return `${path}/${this.actor.data.type}-sheet.hbs`;
    }
    
    getData() {
        const data = super.getData();
        data.config = CONFIG.gemengine;
        data.weapons = data.items.filter(function (item) { return item.type == "weapon" });
        data.armors = data.items.filter(function (item) { return item.type == "armor" });
        data.talents = data.items.filter(function (item) { return item.type == "talent" });
        return data;
    }
}