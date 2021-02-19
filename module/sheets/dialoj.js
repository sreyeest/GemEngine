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
                    let label = getRollLabel(attribute, talentDice, equipDice, aspectDice, mod);
                    let rollResult = roll.roll();
                    let goal = game.settings.get("gemengine", "diff");

                    let rerollPoolString = getRerollPoolString(rollResult);
                    let canReroll = rerollPoolString != "";

                    let messageData = {
                        speaker: ChatMessage.getSpeaker({ actor: actor }),
                        flags: {'gemengine':{'text':label, 'goal':goal, 'detail': rollResult.result, 'canReroll': canReroll, 'isReroll': false,'baseResult': rollResult.result, 'baseJson': '{}', 'rerollPoolString': rerollPoolString, 'actorId': actor.id}},
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

export async function handleReroll(e) {
    e.stopPropagation();
    const actor = game.actors.get(e.target.dataset.actorId || "");
    const label = e.target.dataset.label || '';
    const rerollPoolString = e.target.dataset.rerollpoolstring  || '';
    const baseResult = e.target.dataset.baseresult || '';
    const goal = e.target.dataset.goal || '';
    const baseJson = e.target.dataset.basejson || '';

    let dicePool = DicePool.fromExpression("{"+ rerollPoolString +"}cs>3");
    let roll = new Roll("", actor.data.data);
    roll.terms.push(dicePool);
    let rollResult = roll.roll();

    let rerollLabel = label + " (" + game.i18n.localize("gemengine.roll.rerolled") + ")";

    let messageData = {
        speaker: ChatMessage.getSpeaker({ actor: actor }),
        flags: {'gemengine':{'text':rerollLabel, 'goal':goal, 'detail': rollResult.result, 'canReroll': false, 'isReroll': true,'baseResult': baseResult, 'baseJson': baseJson, 'rerollPoolString': '', 'actorId': actor.id}},
        flavor: rerollLabel,
    };           
        
    rollResult.toMessage(messageData);
}

export function getRerollPoolString(roll)
{
    let rerollPoolString = "";

    roll.terms.forEach(term => {
        term.rolls.forEach(r => {
            if(r.total == 2 || r.total == 3)
            {
                rerollPoolString += (rerollPoolString == "") ? r.formula : "," + r.formula;
            }
        });
    });

    return rerollPoolString;
}

export function getRollLabel(attribute, talent, equip, aspect, mod)
{
    let label = game.i18n.localize("gemengine.roll.windowName") + " " + game.i18n.localize("gemengine.roll.of") + " ";

    if(attribute != "-")
    {
        label += game.i18n.localize("gemengine.attributes."+attribute);
    }

    if(talent != "-")
    {
        if(attribute != "-")
        {
            if(equip != "-" || aspect != "-" || mod != "-")
            {
                label += ", ";
            }
            else
            {
                label += " " + game.i18n.localize("gemengine.roll.and") + " ";
            }
        }
        else
        {
            label += " ";
        }
        
        label += game.i18n.localize("gemengine.roll.talent");
    }

    if(equip != "-")
    {
        if(attribute != "-" || talent != "-")
        {
            if(aspect != "-" || mod != "-")
            {
                label += ", ";
            }
            else
            {
                label += " " + game.i18n.localize("gemengine.roll.and") + " ";
            }
        }
        else
        {
            label += " ";
        }

        label += game.i18n.localize("gemengine.roll.item");
    }

    if(aspect != "-")
    {
        if(attribute != "-" || talent != "-" || equip != "-")
        {
            if(mod != "-")
            {
                label += ", ";
            }
            else
            {
                label += " " + game.i18n.localize("gemengine.roll.and") + " ";
            }
        }
        else
        {
            label += " ";
        }

        label += game.i18n.localize("gemengine.roll.aspect");
    }

    if(mod != "-")
    {
        if(attribute != "-" || talent != "-" || equip != "-" || aspect != "-")
        {
            label += " " + game.i18n.localize("gemengine.roll.and") + " ";
        }
        else
        {
            label += " ";
        }

        label += game.i18n.localize("gemengine.roll.mod");
    }

    return label;
}
