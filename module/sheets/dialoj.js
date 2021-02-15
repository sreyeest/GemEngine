export async function prepareRoll(actor, attribute, talentId, equip, aspect, mod) {
    const html = await renderTemplate('systems/gemengine/templates/chat/dialog.hbs', {
        "actor": actor,
        "attribute": attribute,
        "talentId": talentId.toString(),
        "equip": equip.toString(),
        "aspect": aspect,
        "mod": mod,
    });

    //Ejemplo de dialogo
    let dialog = new Dialog({
        title: game.i18n.localize("gemengine.roll.windowName"),
        content: html,
        buttons: {
            roll: {
                icon: '<i class="fas fa-check"></i>',
                label: game.i18n.localize("gemengine.roll.roll"),
                callback: (html) => {
                    let rollString = "";

                    let attributeDice = html.find("#attribute")[0].value;
                    let talentDice = html.find("#talentId")[0].value;
                    let equipDice = html.find("#equip")[0].value;
                    let aspectDice = (html.find("#aspect")[0].checked) ? "d6" : "-";
                    let mod = html.find("#mod")[0].value;

                    let dicePoolString = attributeDice + "," + talentDice + "," + equipDice + "," + aspectDice + "," + mod;
                    dicePoolString = dicePoolString.replace(new RegExp(",-", "g"), "");
                    dicePoolString = dicePoolString.replace(new RegExp("-,", "g"), "");
                    dicePoolString = dicePoolString.replace(new RegExp("-", "g"), "");

                    let dicePool = DicePool.fromExpression("{"+ dicePoolString +"}cs>3");
                    let roll = new Roll(rollString, actor.data.data);
                    roll.terms.push(dicePool);
                    let label = "Tirada de Potensia y disciplina";
                    let rollResult = roll.roll();
                    let goal;

                    let messageData = {
                        speaker: ChatMessage.getSpeaker({ actor: actor }),
                        flags: {'gemengine':{'text':label, 'goal':goal, 'detail': rollResult.result}},
                        flavor: label,
                    };           
                        
                    rollResult.toMessage(messageData);
                },
            },
            cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: game.i18n.localize("gemengine.roll.cancel"),
                callback: () => {},
            },
        },
        default: 'roll',
        close: () => {},     
    });

    dialog.render(true);
}