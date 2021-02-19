import { gemengine } from "./module/config.js";
import GemItemSheet from "./module/sheets/GemItemSheet.js";
import GemCharacterSheet from "./module/sheets/GemCharacterSheet.js";
import { createActionCardTable, CardSetup, formatRoll, hideChatActionButtons, rollToMenu, onChatLogRender} from "./module/util.js";
import GemCombat from "./module/GemCombat.js";

async function preloadHandlebarsTemplates() {
    const path = "systems/gemengine/templates/partials";
    const templatePaths = [
        `${path}/attributes-panel.hbs`,
        `${path}/data-panel.hbs`,
        `${path}/equipment-panel.hbs`,
        `${path}/aspects-panel.hbs`,
        `${path}/talents-panel.hbs`,
        `${path}/state-panel.hbs`,
        `${path}/equipment-element.hbs`,
        `${path}/talent-element.hbs`,
    ];

    return loadTemplates(templatePaths);
}

Hooks.once("init", function() {
    console.log("gemengine | Initialising Gem Engine System...");
    CONFIG.gemengine = gemengine;
    CONFIG.Combat.entityClass = GemCombat;

    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("gemengine", GemItemSheet, { makeDefault: true });

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("gemengine", GemCharacterSheet, { makeDefault: true });

    game.settings.register('gemengine', 'initiativeSound', {
        name: "Card Sound",
        hint: "Play a short card sound when dealing Initiative",
        default: true,
        scope: 'world',
        type: Boolean,
        config: true,
    });

    game.settings.register('gemengine', 'initMessage', {
        name: "Create Chat Message for Initiative",
        default: true,
        scope: 'world',
        type: Boolean,
        config: true,
    });

    game.settings.register("gemengine", "showDC", {
        name: "Show DC window",
        hint: "If checked a DC box will appear at the bottom of the screen",
        scope: "world",
        config: true,
        default: true,
        type: Boolean,
    });

    game.settings.register("gemengine", "showLastRoll", {
        name: "Show Last Roll window",
        hint: "If checked a box displaying the results of the last Roll will appear at the bottom of the screen",
        scope: "world",
        config: true,
        default: true,
        type: Boolean,
    });

    game.settings.register("gemengine", "diff", {
        name: "GM difficulty",
        hint: "This is linked to the DC Box at the bottom of the screen",
        scope: "world",
        config: false,
        default: 1,
        type: Number,
    });

    preloadHandlebarsTemplates();

    Handlebars.registerHelper("times", function (n, content) {
        let result = "";
        for (let i = 0; i < n; ++i) {
            content.data.index = i + 1;
            result += content.fn(i);
        }
    
        return result;
    });

    Handlebars.registerHelper('ifGreater', function(v1, v2, options) {
        if(parseInt(v1) > parseInt(v2)) {
            return options.fn(this);
        }
        return options.inverse(this);
    });

    Handlebars.registerHelper('ifLess', function(v1, v2, options) {
        if(v1 < v2) {
            return options.fn(this);
        }
        return options.inverse(this);
    });
    
    Handlebars.registerHelper('ifEqual', function(v1, v2, options) {
        if(v1 == v2) {
            return options.fn(this);
        }
        return options.inverse(this);
    });

    Handlebars.registerHelper('isGM', function(options) {
        if(game.user.isGM) {
            return options.fn(this);
        }
        return options.inverse(this);
    });

    Handlebars.registerHelper('isOwner', function(actorId, options) {
        const actor = game.actors.get(actorId || "");

        if(actor.hasPerm(game.user, "OWNER")) {
            return options.fn(this);
        }
        return options.inverse(this);
    });

    Handlebars.registerHelper('difMoreThanZero', function(v1, v2, options) {
        if((parseInt(v1) - parseInt(v2)) > 0) {
            return options.fn(this);
        }
        return options.inverse(this);
    });

    Handlebars.registerHelper('sum', function(v1, v2) {
        return (parseInt(v1) + parseInt(v2));
    });

    Handlebars.registerHelper('dif', function(v1, v2) {
        console.log("value1: " + v1 + " value2: " + v2);
        return (parseInt(v1) - parseInt(v2));
    });
});

Hooks.once('setup', () => {

});

Hooks.once('ready', async () => {
    let packChoices = {};
    game.packs
        .filter((p) => p.entity === 'JournalEntry')
        .forEach((p) => {
        packChoices[p.collection] = `${p.metadata.label} (${p.metadata.package})`;
    });
    game.settings.register('gemengine', 'cardDeck', {
        name: 'Card Deck to use for Initiative',
        scope: 'world',
        type: String,
        config: true,
        default: CONFIG.gemengine.init.defaultCardCompendium,
        choices: packChoices,
        onChange: async (choice) => {
            console.log(`Repopulating action cards Table with cards from deck ${choice}`);
            await createActionCardTable(true, choice);
            ui.notifications.info('Table re-population complete');
        },
    });
    await CardSetup.setup();

    if(game.user.isGM){

        game.data.rolldc = 3;

        let hotbar = document.getElementById("hotbar");
        let backgr = document.createElement("DIV");
        backgr.className = "dc-input";

        let header = document.createElement("DIV");
        header.className = "dc-header";
        header.textContent = "DC";

        let form = document.createElement("FORM");
        let sInput = document.createElement("INPUT");
        sInput.setAttribute("type", "text");
        sInput.setAttribute("name", "dc");
        sInput.setAttribute("value", "");

        let initvalue = 0;
        if(!hasProperty(gemengine.diff,game.data.world.name)){
            setProperty(gemengine.diff,game.data.world.name,0);
        }

        sInput.value = game.settings.get("gemengine", "diff");

        sInput.addEventListener("keydown", async (event) => {
            event.preventDefault();
            event.stopPropagation();

            if(event.key=="Backspace" || event.key=="Delete"){
                sInput.value = 0;
            }

            else if(event.key=="Enter"){
                await game.settings.set("gemengine", "diff", sInput.value);
            }

            else if(event.key=="-"){
                sInput.value = "-";
            }

            else{
                if(!isNaN(event.key))
                    sInput.value += event.key;
            }

            if(!isNaN(sInput.value)){
                sInput.value = parseInt(sInput.value);
            }


        });

        sInput.addEventListener("focusout", async (event) => {
            event.preventDefault();
            event.stopPropagation();

            await game.settings.set("gemengine", "diff", sInput.value);

        });

        form.appendChild(sInput);
        backgr.appendChild(header);

        backgr.appendChild(form);

        if(game.settings.get("gemengine", "showDC")){
            await hotbar.appendChild(backgr);
        }

        await rollToMenu();
        gemengine.showshield = false;

        let macrosheet = document.getElementById("hotbar");
    }
});

Hooks.on('renderChatMessage', async (message, html, data) => {
    if (message.isRoll && message.isContentVisible) {
        await formatRoll(message, html, data);
    }
    hideChatActionButtons(message, html, data);

    if (game.user.isGM){
        $(html).find(".roll-message-delete").click(async ev => {
            msg.delete();
        });
        rollToMenu();
    }
    else {
        if (game.user._id!=data.message.user)
            $(html).find(".roll-message-delete").hide();
    }
});

Hooks.on('renderCombatTracker', (app, html, data) => {
    const currentCombat = data.combats[data.currentIndex - 1] || data.combat;
    html.find('.combatant').each((i, el) => {
        const combId = el.getAttribute('data-combatant-id');
        const combatant = currentCombat.combatants.find((c) => c._id == combId);
        const initdiv = el.getElementsByClassName('token-initiative');
        if (combatant.initiative && combatant.initiative !== 0) {
            initdiv[0].innerHTML = `<span class="initiative">${combatant.flags.gemengine.cardString}</span>`;
        }
        else if (!game.user.isGM) {
            initdiv[0].innerHTML = '';
        }
    });
});

Hooks.on('preUpdateCombat', async (combat, updateData, options, userId) => {
    // Return early if we are NOT a GM OR we are not the player that triggered the update AND that player IS a GM
    const user = game.users.get(userId);
    if (!game.user.isGM || (game.userId !== userId && user.isGM)) {
        return;
    }
    // Return if this update does not contains a round
    if (!updateData.round) {
        return;
    }
    if (combat instanceof CombatEncounters) {
        combat = game.combats.get(updateData._id);
    }
    // If we are not moving forward through the rounds, return
    if (updateData.round < 1 || updateData.round < combat.previous.round) {
        return;
    }
    // If Combat has just started, return
    if ((!combat.previous.round || combat.previous.round === 0) &&
        updateData.round === 1) {
        return;
    }
    let jokerDrawn = false;
    // Reset the Initiative of all combatants
    combat.combatants.forEach((c) => {
        if (c.flags.gemengine && c.flags.gemengine.hasJoker) {
            jokerDrawn = true;
        }
    });
    const resetComs = combat.combatants.map((c) => {
        c.initiative = 0;
        c.hasRolled = false;
        c.flags.gemengine.cardValue = null;
        c.flags.gemengine.suitValue = null;
        c.flags.gemengine.hasJoker = null;
        return c;
    });
    updateData.combatants = resetComs;
    // Reset the deck if any combatant has had a Joker
    if (jokerDrawn) {
        const deck = game.tables.getName(CONFIG.gemengine.init.cardTable);
        await deck.reset();
        ui.notifications.info('Card Deck automatically reset');
    }
    //Init autoroll
    if (game.settings.get('gemengine', 'autoInit')) {
        const combatantIds = combat.combatants.map((c) => c._id);
        await combat.rollInitiative(combatantIds);
    }
});

Hooks.on('updateCombat', (combat, updateData, options, userId) => {
    let string = `Round ${combat.round} - Turn ${combat.turn}\n`;
    for (let i = 0; i < combat.turns.length; i++) {
        const element = combat.turns[i];
        string = string.concat(`${i}) ${element['token']['name']}\n`);
    }
    console.log(string);
});

Hooks.on('deleteCombat', (combat, options, userId) => {
    if (!game.user.isGM || !game.users.get(userId).isGM) {
        return;
    }
    const jokers = combat.combatants.filter((c) => c.flags.gemengine && c.flags.gemengine.hasJoker);
    //reset the deck when combat is ended in a round that a Joker was drawn in
    if (jokers.length > 0) {
        const deck = game.tables.getName(CONFIG.gemengine.init.cardTable);
        deck.reset().then(() => {
            ui.notifications.info('Card Deck automatically reset');
        });
    }
});

Hooks.on("renderChatLog", (_app, html, _data) => onChatLogRender(html));

Hooks.on('renderCombatantConfig', async (app, html, options) => {
    // resize the element so it'll fit the new stuff
    html.css({ height: 'auto' });
    //remove the old initiative input
    html.find('input[name="initiative"]').parents('div.form-group').remove();
    //grab cards and sort them
    const cardPack = game.packs.get(game.settings.get('gemengine', 'cardDeck'));
    let cards = (await cardPack.getContent()).sort((a, b) => {
        const cardA = a.getFlag('gemengine', 'cardValue');
        const cardB = b.getFlag('gemengine', 'cardValue');
        let card = cardA - cardB;
        if (card !== 0)
            return card;
        const suitA = a.getFlag('gemengine', 'suitValue');
        const suitB = b.getFlag('gemengine', 'suitValue');
        let suit = suitA - suitB;
        return suit;
    });
    //prep list of cards for selection
    let cardTable = game.tables.getName(CONFIG.gemengine.init.cardTable);
    let cardList = [];
    for (let card of cards) {
        const cardValue = card.getFlag('gemengine', 'cardValue');
        const suitValue = card.getFlag('gemengine', 'suitValue');
        const color = suitValue === 2 || suitValue === 3 ? 'color: red;' : 'color: black;';
        const isDealt = options.object.flags.gemengine &&
            options.object.flags.gemengine.cardValue === cardValue &&
            options.object.flags.gemengine.suitValue === suitValue;
        const isAvailable = cardTable.results.find((r) => r.text === card.name)
            .drawn
            ? 'text-decoration: line-through;'
            : '';
        cardList.push({
            cardValue,
            suitValue,
            isDealt,
            color,
            isAvailable,
            name: card.name,
            cardString: getProperty(card, 'data.content'),
            isJoker: card.getFlag('gemengine', 'isJoker'),
        });
    }
    const numberOfJokers = cards.filter((c) => c.getFlag('gemengine', 'isJoker'))
        .length;
    //render and inject new HTML
    const path = 'systems/gemengine/templates/combatant-config-cardlist.html';
    $(await renderTemplate(path, { cardList, numberOfJokers })).insertBefore(`#${options.options.id} footer`);
    //Attach click event to button which will call the combatant update as we can't easily modify the submit function of the FormApplication
    html.find('footer button').on('click', (ev) => {
        const selectedCard = html.find('input[name=ActionCard]:checked');
        if (selectedCard.length === 0) {
            return;
        }
        const cardValue = selectedCard.data().cardValue;
        const suitValue = selectedCard.data().suitValue;
        const hasJoker = selectedCard.data().isJoker;
        game.combat.updateEmbeddedEntity('Combatant', {
            _id: options.object._id,
            initiative: suitValue + cardValue,
            'flags.gemengine': {
                cardValue,
                suitValue,
                hasJoker,
                cardString: selectedCard.val(),
            },
        });
    });
    return false; 
});