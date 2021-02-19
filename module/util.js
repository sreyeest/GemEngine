import { handleReroll } from "../module/sheets/dialoj.js";

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
    const colorMessage = chatMessage.getFlag('gemengine', 'colorMessage');
    // Little helper function
    let pushDice = (chatData, total, faces) => {
        let img = null;
        if ([4, 6, 8, 10, 12, 20].indexOf(faces) > -1) {
            img = `systems/gemengine/styles/img/d${faces}`;
        }
        chatData.dice.push({
            img: img,
            result: total,
            dice: true,
        });
    };

    let pushBaseDice = (chatData, total, faces) => {
        let img = null;
        if ([4, 6, 8, 10, 12, 20].indexOf(faces) > -1) {
            img = `systems/gemengine/styles/img/d${faces}`;
        }
        chatData.baseDice.push({
            img: img,
            result: total,
            dice: true,
        });
    };

    let roll = JSON.parse(data.message.roll);
    let chatData = { 
        label: chatMessage.getFlag('gemengine', 'text'),
        dice: [], 
        baseDice: [],
        baseJson: data.message.roll,
        goal: chatMessage.getFlag('gemengine', 'goal'),
        result: (chatMessage.getFlag('gemengine', 'isReroll')) ? (parseInt(chatMessage.getFlag('gemengine', 'detail')) + parseInt(chatMessage.getFlag('gemengine', 'baseResult'))) : chatMessage.getFlag('gemengine', 'detail'),
        baseResult: chatMessage.getFlag('gemengine', 'baseResult'),
        canReroll: chatMessage.getFlag('gemengine', 'canReroll'),
        isReroll: chatMessage.getFlag('gemengine', 'isReroll'),
        rerollPoolString: chatMessage.getFlag('gemengine', 'rerollPoolString'),
        actorId: chatMessage.getFlag('gemengine', 'actorId'),
    };

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
                pushDice(chatData, poolRoll.total, faces);
            });
        }
    }

    if(chatData.isReroll)
    {
        let baseJson = chatMessage.getFlag('gemengine', 'baseJson');
        let baseRoll = JSON.parse(baseJson);

        if (baseRoll.parts)
        return;
        for (let i = 0; i < baseRoll.terms.length; i++) {
            if (baseRoll.terms[i].class === 'DicePool') {
                // Format the dice pools
                let pool = baseRoll.terms[i].rolls;
                let faces = 0;
                // Compute dice from the pool
                pool.forEach((poolRoll) => {
                    faces = poolRoll.terms[0]['faces'];
                    pushBaseDice(chatData, poolRoll.total, faces);
                });
            }
        }
    }

    // Replace default dice-formula by this custom;
    let formulaRendered = await renderTemplate('systems/gemengine/templates/chat/roll-formula.hbs', chatData);
    let htmlFormula = html.find('.dice-formula');
    htmlFormula.replaceWith(formulaRendered);

    let resultRendered = await renderTemplate('systems/gemengine/templates/chat/roll-result.hbs', chatData);
    let htmlResult = html.find('.dice-total');
    htmlResult.replaceWith(resultRendered);
}

export function hideChatActionButtons(message, html, data) {
    const chatCard = html.find('.gemengine.chat-card');
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

export function rollToMenu(html = null) {

    if(!game.settings.get("gemengine", "showLastRoll"))
        return;

    //console.log("rolling to menu");
    let hotbar = document.getElementById("hotbar");
    hotbar.className = "flexblock-left-nopad";

    let actionbar = document.getElementById("action-bar");
    if(actionbar!=null)
        actionbar.className = "action-bar-container";

    let prevmenu = hotbar.querySelector(".roll-menu");

    if(prevmenu!=null)
        prevmenu.remove();

    let tester = document.createElement("DIV");

    if(html==null){
        let lastmessage;
        let found = false;

        for(let i=game.messages.size-1;i>=0;i--){
            let amessage = game.messages.entities[i];
            if(!found){
                if(amessage.data.content.includes("roll-template")){
                    found=true;
                    lastmessage =amessage;
                }
            }
        }

        if(lastmessage==null)
            return;
        let msgContent = lastmessage.data.content;

        tester.innerHTML = msgContent;
    }

    else{
        tester.innerHTML = html;
    }

    let rollextra = tester.querySelector(".roll-extra");
    rollextra.style.display="none";


    let rollMenu = document.createElement("DIV");
    rollMenu.className = "roll-menu";
    rollMenu.innerHTML = tester.innerHTML;
    //console.log("appending");
    hotbar.appendChild(rollMenu);
}

export function onChatLogRender(html) {
    html.on('click', 'button.chat-reroll-button', (e) => handleReroll(e));
}