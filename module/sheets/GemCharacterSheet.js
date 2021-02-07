export default class GemCharacterSheet extends ActorSheet {

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            width: 640, 
            height: 650,
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
        data.artifacts = data.items.filter(function (item) { return item.type == "artifact" });
        data.weapons = data.items.filter(function (item) { return item.type == "weapon" });
        data.armors = data.items.filter(function (item) { return item.type == "armor" });
        data.talents = data.items.filter(function (item) { return item.type == "talent" });
        return data;
    }

    activateListeners(html) {
        html.find(".item-create").click(this._onItemCreate.bind(this));
        html.find(".item-edit").click(this._onItemEdit.bind(this));
        html.find(".item-delete").click(this._onItemDelete.bind(this));
        html.find(".inline-edit").change(this._onTalentEdit.bind(this));
        super.activateListeners(html);
    }

    _onItemCreate(event) {
        event.preventDefault();
        let element = event.currentTarget;

        let itemData = {
            name: game.i18n.localize("gemengine.sheet.newItem"),
            type: element.dataset.type
        };

        return this.actor.createOwnedItem(itemData);
    }

    _onItemEdit(event)
    {
        event.preventDefault();
        let element = event.currentTarget;
        let itemId = element.closest(".item").dataset.itemId;
        let item = this.actor.getOwnedItem(itemId);

        item.sheet.render(true);
    }

    _onItemDelete(event)
    {
        event.preventDefault();
        let element = event.currentTarget;
        let itemId = element.closest(".item").dataset.itemId;
        return this.actor.deleteOwnedItem(itemId);
    }

    _onTalentEdit(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let itemId = element.closest(".item").dataset.itemId;
        let item = this.actor.getOwnedItem(itemId);
        let field = element.dataset.field;

        return item.update({ [field]: element.value });
    }
}