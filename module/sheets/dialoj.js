import { gemengine } from "../config.js";
export async function prepareRoll(actor, attribute) {

    const html = await renderTemplate('systems/gemengine/templates/chat/dialog.hbs', {
        "actor": actor,
        "attribute": attribute,
        "talent": 4,
        "equip": 1,
        "aspect": true,
        "mod": false,
    });

    //Ejemplo de dialogo
    let dialog = new Dialog({
        title: game.i18n.localize("gemengine.roll.windowName"),
        content: html,
        buttons: {
            roll: {
                icon: '<i class="fas fa-check"></i>',
                label: game.i18n.localize("gemengine.roll.roll"),
                callback: () => {
                    //Ejemplo de tirada
                    //let rollString = actor.data.data.power + "," + actor.data.data.discipline;
                    let rollString = "";
                    let dicePool = DicePool.fromExpression("{1d4,1d4,1d6,1d8,1d8,1d8,1d10,1d10}cs>3");
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