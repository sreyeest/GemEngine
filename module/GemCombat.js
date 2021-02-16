export default class GemCombat extends Combat {
    /**
     * @override
     * Roll initiative for one or multiple Combatants within the Combat entity
     * @param {Array|string} ids        A Combatant id or Array of ids for which to roll
     * @param {string|null} formula     A non-default initiative formula to roll. Otherwise the system default is used.
     * @param {Object} messageOptions   Additional options with which to customize created Chat Messages
     * @return {Promise.<Combat>}       A promise which resolves to the updated Combat entity once updates are complete.
     */
    async rollInitiative(ids, formula, messageOptions) {
        // Structure input data
        ids = typeof ids === 'string' ? [ids] : ids;
        const combatantUpdates = [];
        const initMessages = [];
        let isRedraw = false;
        let skipMessage = false;
        const actionCardDeck = game.tables.getName(CONFIG.gemengine.init.cardTable);
        if (ids.length > actionCardDeck.results.filter((r) => !r.drawn).length) {
            ui.notifications.warn(game.i18n.localize('gemengine.combat.noCardsLeft'));
            return;
        }
        // Iterate over Combatants, performing an initiative draw for each
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            // Get Combatant data
            let c = await this.getCombatant(id);
            if (c.flags.gemengine && c.flags.gemengine.cardValue !== null) {
                console.log('This must be a reroll');
                isRedraw = true;
            }
            //Do not draw cards for defeated combatants
            if (c.defeated)
                continue;
            // Set up edges
            let cardsToDraw = 1;

            if(c.actor.data.data.initiative > 0)
            {
                cardsToDraw = c.actor.data.data.initiative;
            }

            const hasHesitant = c.actor.data.data.initiative <= 0;
            // Draw initiative
            let card;
            if (isRedraw) {
                let oldCard = await this.findCard(c.flags.gemengine.cardValue, c.flags.gemengine.suitValue);
                const cards = await this.drawCard();
                cards.push(oldCard);
                card = await this.pickACard(cards, c.name, oldCard._id);
                if (card === oldCard) {
                    skipMessage = true;
                }
            }
            else {
                if (hasHesitant) {
                    // Hesitant
                    const cards = await this.drawCard(2);
                    if (cards.filter((c) => c.getFlag('gemengine', 'isJoker')).length > 0) {
                        card = await this.pickACard(cards, c.name);
                    }
                    else {
                        cards.sort((a, b) => {
                            //sort cards to pick the lower one
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
                        card = cards[0];
                    }
                }
                else if (cardsToDraw > 1) {
                    //Level Headed
                    const cards = await this.drawCard(cardsToDraw);
                    card = (await this.pickACard(cards, c.name));
                }
                else {
                    //normal card draw
                    const cards = await this.drawCard();
                    card = cards[0];
                }
            }
            const newflags = {
                suitValue: card.getFlag('gemengine', 'suitValue'),
                cardValue: card.getFlag('gemengine', 'cardValue'),
                hasJoker: card.getFlag('gemengine', 'isJoker'),
                cardString: card['data']['content'],
            };
            combatantUpdates.push({
                _id: c._id,
                initiative: card.getFlag('gemengine', 'suitValue') +
                    card.getFlag('gemengine', 'cardValue'),
                'flags.gemengine': newflags,
            });
            // Construct chat message data
            const cardPack = game.settings.get('gemengine', 'cardDeck');
            const template = `
          <div class="table-draw">
              <ol class="table-results">
                  <li class="table-result flexrow">
                      <img class="result-image" src="${card['data']['img']}">
                      <h4 class="result-text">@Compendium[${cardPack}.${card._id}]{${card.name}}</h4>
                  </li>
              </ol>
          </div>
          `;
            const messageData = mergeObject({
                speaker: {
                    scene: canvas.scene._id,
                    actor: c.actor ? c.actor._id : null,
                    token: c.token._id,
                    alias: c.token.name,
                },
                whisper: c.token.hidden || c.hidden
                    ? game.users.entities.filter((u) => u.isGM)
                    : '',
                flavor: `${c.token.name} ${game.i18n.localize('gemengine.combat.initDraw')}`,
                content: template,
            }, messageOptions);
            initMessages.push(messageData);
        }
        if (!combatantUpdates.length)
            return this;
        // Update multiple combatants
        await this.updateEmbeddedEntity('Combatant', combatantUpdates);
        // Create multiple chat messages
        if (game.settings.get('gemengine', 'initiativeSound') && !skipMessage) {
            AudioHelper.play({
                src: 'systems/gemengine/assets/card-flip.wav',
                volume: 0.8,
                autoplay: true,
                loop: false,
            }, true);
        }
        if (game.settings.get('gemengine', 'initMessage') && !skipMessage) {
            await ChatMessage.create(initMessages);
        }
        // Return the updated Combat
        return this;
    }
    /**
     * @override
     * @param a Combatant A
     * @param b Combatant B
     */
    _sortCombatants(a, b) {
        if (a.flags.gemengine && b.flags.gemengine) {
            const cardA = a.flags.gemengine.cardValue;
            const cardB = b.flags.gemengine.cardValue;
            let card = cardB - cardA;
            if (card !== 0)
                return card;
            const suitA = a.flags.gemengine.suitValue;
            const suitB = b.flags.gemengine.suitValue;
            let suit = suitB - suitA;
            return suit;
        }
        let [an, bn] = [a.token.name || '', b.token.name || ''];
        let cn = an.localeCompare(bn);
        if (cn !== 0)
            return cn;
        return a.tokenId - b.tokenId;
    }
    /**
     * @override
     */
    async resetAll() {
        const updates = this.data['combatants'].map((c) => {
            return {
                _id: c._id,
                initiative: null,
                flags: {
                    gemengine: {
                        suitValue: null,
                        cardValue: null,
                        hasJoker: false,
                        cardString: null,
                    },
                },
            };
        });
        await this.updateEmbeddedEntity('Combatant', updates);
        return this.update({ turn: 0 });
    }
    /**
     * Draws cards
     * @param count number of cards to draw
     */
    async drawCard(count = 1) {
        let actionCardPack = game.packs.get(game.settings.get('gemengine', 'cardDeck'));
        if (actionCardPack === null ||
            (await actionCardPack.getIndex()).length === 0) {
            console.log('Something went wrong with the card compendium, switching back to default');
            await game.settings.set('gemengine', 'cardDeck', CONFIG.gemengine.init.defaultCardCompendium);
            actionCardPack = game.packs.get(game.settings.get('gemengine', 'cardDeck'));
        }
        const actionCardDeck = game.tables.getName(CONFIG.gemengine.init.cardTable);
        const packIndex = await actionCardPack.getIndex();
        const cards = [];
        for (let i = 0; i < count; i++) {
            let drawResult = await actionCardDeck.draw({ displayChat: false });
            const lookUpCard = packIndex.find((c) => c.name === drawResult.results[0].text);
            cards.push((await actionCardPack.getEntity(lookUpCard._id)));
        }
        return cards;
    }
    /**
     * Asks the GM to pick a cards
     * @param cards an array of cards
     * @param combatantName name of the combatant
     * @param oldCardId id of the old card, if you're picking cards for a redraw
     */
    async pickACard(cards, combatantName, oldCardId) {
        // any card
        let immedeateRedraw = false;
        // sort the cards for display
        const sortedCards = cards.sort((a, b) => {
            const cardA = a.getFlag('gemengine', 'cardValue');
            const cardB = b.getFlag('gemengine', 'cardValue');
            let card = cardB - cardA;
            if (card !== 0)
                return card;
            const suitA = a.getFlag('gemengine', 'suitValue');
            const suitB = b.getFlag('gemengine', 'suitValue');
            let suit = suitB - suitA;
            return suit;
        });
        let card = null;
        const template = 'systems/gemengine/templates/initiative/choose-card.hbs';
        const html = await renderTemplate(template, {
            data: {
                cards: sortedCards,
                oldCard: oldCardId,
            },
        });
        const buttons = {
            ok: {
                icon: '<i class="fas fa-check"></i>',
                label: game.i18n.localize('gemengine.combat.ok'),
                callback: (html) => {
                    const choice = html.find('input[name=card]:checked');
                    const cardId = choice.data('card-id');
                    if (typeof cardId !== 'undefined') {
                        card = cards.find((c) => c._id === cardId);
                    }
                },
            },
        };
        if (oldCardId) {
            buttons['redraw'] = {
                icon: '<i class="fas fa-redo"></i>',
                label: game.i18n.localize('gemengine.combat.redraw'),
                callback: () => {
                    immedeateRedraw = true;
                },
            };
        }
        return new Promise((resolve) => {
            new Dialog({
                title: `${game.i18n.localize('gemengine.combat.pickACard')} ${combatantName}`,
                content: html,
                buttons: buttons,
                close: async () => {
                    if (immedeateRedraw) {
                        let newCard = await this.drawCard();
                        let newCards = [...cards, ...newCard];
                        card = await this.pickACard(newCards, combatantName, oldCardId);
                    }
                    //if no card has been chosen then choose first in array
                    if (card === null || typeof card === 'undefined') {
                        if (oldCardId) {
                            card = cards.find((c) => c._id === oldCardId);
                        }
                        else {
                            console.log('no card selected');
                            card = cards[0]; //If no card was selected, assign the first card that was drawn
                        }
                    }
                    resolve(card);
                },
            }).render(true);
        });
    }
    /**
     * Find a card from the deck based on it's suit and value
     * @param cardValue
     * @param cardSuit
     */
    async findCard(cardValue, cardSuit) {
        const actionCardPack = game.packs.get(game.settings.get('gemengine', 'cardDeck'));
        const content = (await actionCardPack.getContent());
        return content.find((c) => c.getFlag('gemengine', 'cardValue') === cardValue &&
            c.getFlag('gemengine', 'suitValue') === cardSuit);
    }
}
