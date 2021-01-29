export default class GemItemSheet extends ItemSheet {
	get template() {
		const path = "systems/gem-engine/templates/sheets";
		return `${path}/${this.item.data.type}-sheet.html`;
	}
}