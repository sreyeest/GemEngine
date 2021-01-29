export default class GemItemSheet extends ItemSheet {
	get template() {
		const path = "systems/gemengine/templates/sheets";
		return `${path}/${this.item.data.type}-sheet.html`;
	}
}