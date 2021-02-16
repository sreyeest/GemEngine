export async function createActionCardTable(rebuild, cardpack) {
    let packName = game.settings.get('gemengine', 'cardDeck');
    if (cardpack) {
        packName = cardpack;
    }
    const cardPack = game.packs.get(packName);
    const cardPackIndex = await cardPack.getIndex();
    let cardTable = game.tables.getName(CONFIG.gemengine.init.cardTable);
    //If the table doesn't exist, create it
    if (!cardTable) {
        const tableData = {
            img: 'systems/gemengine/assets/ui/wildcard.svg',
            name: CONFIG.gemengine.init.cardTable,
            replacement: false,
            displayRoll: false,
        };
        const tableOptions = { temporary: false, renderSheet: false };
        cardTable = (await RollTable.create(tableData, tableOptions));
    }
    //If it's a rebuild call, delete all entries and then repopulate them
    if (rebuild) {
        let deletions = cardTable.results.map((i) => i._id);
        await cardTable.deleteEmbeddedEntity('TableResult', deletions);
    }
    const createData = [];
    for (let i = 0; i < cardPackIndex.length; i++) {
        let c = cardPackIndex[i];
        let resultData = {
            type: 2,
            text: c.name,
            img: c.img,
            collection: packName,
            resultId: c.id,
            weight: 1,
            range: [i + 1, i + 1],
        };
        createData.push(resultData);
    }
    await cardTable.createEmbeddedEntity('TableResult', createData);
    await cardTable.normalize();
    ui.tables.render();
}

export class CardSetup {
    static async setup() {
        if (!game.tables.getName(CONFIG.gemengine.init.cardTable)) {
            await createActionCardTable(CONFIG.gemengine.init.defaultCardCompendium);
            ui.notifications.info('First-Time-Setup complete');
        }
    }
}

export async function formatRoll(chatMessage, html, data) {
    const colorMessage = chatMessage.getFlag('swade', 'colorMessage');
    // Little helper function
    let pushDice = (chatData, total, faces, red) => {
        let color = 'black';
        if (total > faces) {
            color = 'green';
        }
        if (red) {
            color = 'red';
        }
        let img = null;
        if ([4, 6, 8, 10, 12, 20].indexOf(faces) > -1) {
            img = `../icons/svg/d${faces}-grey.svg`;
        }
        chatData.dice.push({
            img: img,
            result: total,
            color: color,
            dice: true,
        });
    };
    //helper function that determines if a roll contained at least one result of 1
    let rollIsRed = (roll) => {
        let retVal = roll.terms.some((d) => {
            if (d['class'] !== 'Die')
                return false;
            return d.results[0]['result'] === 1;
        });
        return retVal;
    };
    //helper function that determines if a roll contained at least one result of 1
    let dieIsRed = (die) => {
        if (die['class'] !== 'Die')
            return false;
        return die.results[0]['result'] === 1;
    };
    let roll = JSON.parse(data.message.roll);
    let chatData = { dice: [], modifiers: [] };
    //don't format older messages anymore
    if (roll.parts)
        return;
    for (let i = 0; i < roll.terms.length; i++) {
        if (roll.terms[i].class === 'DicePool') {
            // Format the dice pools
            let pool = roll.terms[i].rolls;
            let faces = 0;
            // Compute dice from the pool
            pool.forEach((poolRoll) => {
                faces = poolRoll.terms[0]['faces'];
                pushDice(chatData, poolRoll.total, faces, colorMessage && rollIsRed(poolRoll));
            });
        }
        else if (roll.terms[i].class === 'Die') {
            // Grab the right dice
            let faces = roll.terms[i].faces;
            let totalDice = 0;
            roll.terms[i].results.forEach((result) => {
                totalDice += result.result;
            });
            pushDice(chatData, totalDice, faces, colorMessage && dieIsRed(roll.terms[i]));
        }
        else {
            if (roll.terms[i]) {
                chatData.dice.push({
                    img: null,
                    result: roll.terms[i],
                    color: 'black',
                    dice: false,
                });
            }
        }
    }
    // Replace default dice-formula by this custom;
    let rendered = await renderTemplate('systems/swade/templates/chat/roll-formula.html', chatData);
    let formula = html.find('.dice-formula');
    formula.replaceWith(rendered);
}

export function hideChatActionButtons(message, html, data) {
    const chatCard = html.find('.swade.chat-card');
    if (chatCard.length > 0) {
        // If the user is the message author or the actor owner, proceed
        let actor = game.actors.get(data.message.speaker.actor);
        if (actor && actor.owner)
            return;
        else if (game.user.isGM || data.author.id === game.user.id)
            return;
        // Otherwise conceal action buttons except for saving throw
        const buttons = chatCard.find('button[data-action]');
        buttons.each((i, btn) => {
            if (btn.dataset.action === 'save')
                return;
            btn.style.display = 'none';
        });
    }
}