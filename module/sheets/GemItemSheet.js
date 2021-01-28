export default class GemItemSheet extends ItemSheet {
	get template() {
		return `systems/gem-engine/templates/sheets/${this.item.data.type}-sheet.html`;
	}
}