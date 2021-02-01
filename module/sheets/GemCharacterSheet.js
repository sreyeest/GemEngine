export default class GemCharacterSheet extends ActorSheet {

    static get defaultOption() {
        return mergeObject(super.defaultOption, {
            template: "systems/gemengine/templates/sheets/character-sheet.hbs",
            classes: ["gemengine", "sheet", "character"] 
        });
    }

    get template() {
		const path = "systems/gemengine/templates/sheets";
		return `${path}/${this.actor.data.type}-sheet.hbs`;
	}
}