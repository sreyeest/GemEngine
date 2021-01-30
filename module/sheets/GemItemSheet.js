export default class GemItemSheet extends ItemSheet {

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, { 
			width: 530, 
			height: 340,
			classes: ["gemengine", "sheet", "item"]
		});

	}

	get template() {
		const path = "systems/gemengine/templates/sheets";
		return `${path}/${this.item.data.type}-sheet.html`;
	}

	getData() {
		const data = super.getData();

		data.config = CONFIG.gemengine;

		return data;
	}
}