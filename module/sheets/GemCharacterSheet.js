import { prepareRoll } from "../sheets/dialoj.js";

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
        html.find(".fatigue-icon0").click(this._onFatigueChange0.bind(this));
        html.find(".fatigue-icon1").click(this._onFatigueChange1.bind(this));
        html.find(".fatigue-icon2").click(this._onFatigueChange2.bind(this));
        html.find(".fatigue-icon3").click(this._onFatigueChange3.bind(this));
        html.find(".fatigue-icon4").click(this._onFatigueChange4.bind(this));
        html.find(".fatigue-icon5").click(this._onFatigueChange5.bind(this));
        html.find(".badge-click").click(this._onBadgeClick.bind(this));
        html.find(".badge-click-plus").click(this._onBadgeClickPlus.bind(this));

        if(this.actor.owner) {
            html.find(".item-roll-atb").click(this._onItemRollAtb.bind(this));
            html.find(".item-roll-talent").click(this._onItemRollTalent.bind(this));
            html.find(".item-roll-equip").click(this._onItemRollEquip.bind(this));
        }

        super.activateListeners(html);
    }

    async _onItemRollAtb(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        await prepareRoll(this.actor, dataset.label, "-", "-", false, false);
    }

    async _onItemRollTalent(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        const itemId = dataset.itemId;
        let item = this.actor.getOwnedItem(itemId);
        await prepareRoll(this.actor, item.data.data.baseAttribute, item.id, "-", false, false);
    }

    async _onItemRollEquip(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        const itemId = dataset.itemId;
        let item = this.actor.getOwnedItem(itemId);
        await prepareRoll(this.actor, "-", "-", item.id, false, false);
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

    _onFatigueChange0(event) {
        let count = 0;
        this.actor.update({ "data.fatigue": count });
    }

    _onFatigueChange1(event) {
        let count = 1;
        this.actor.update({ "data.fatigue": count });
    }

    _onFatigueChange2(event) {
        let count = 2;
        this.actor.update({ "data.fatigue": count });
    }

    _onFatigueChange3(event) {
        let count = 3;
        this.actor.update({ "data.fatigue": count });
    }

    _onFatigueChange4(event) {
        let count = 4;
        this.actor.update({ "data.fatigue": count });
    }

    _onFatigueChange5(event) {
        let count = 5;
        this.actor.update({ "data.fatigue": count });
    }

    _onBadgeClick(event) {
        let count = this.actor.data.data.stars - 1;

        if(count <= 0)
        {
            count = 0;
        }

        this.actor.update({ "data.stars": count });
    }

    _onBadgeClickPlus(event) {
        let count = this.actor.data.data.stars + 1;

        if(count >= 5)
        {
            count = 5;
        }

        this.actor.update({ "data.stars": count });
    }
}