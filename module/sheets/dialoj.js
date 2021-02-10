export async function prepareRoll(actor) {

    const html = await renderTemplate('systems/gemengine/templates/chat/dialog.hbs', {
        "msgDataA": "comeme un huevo",
        "msgDataB": "pero bien...",
    });

    //Ejemplo de dialogo
    let dialog = new Dialog({
        title: "Roll",
        content: html,
        buttons: {
            roll: {
                icon: '<i class="fas fa-check"></i>',
                label: "TIRAR",
                callback: () => {
                    //Ejemplo de tirada
                    let rollString = actor.data.data.power + "," + actor.data.data.discipline;

                    console.log("Roll: Comeme un huevo!" + rollString);
                    
                    let roll = new Roll(rollString, actor.data.data);
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
                label: "CANCELAR",
                callback: () => {},
            },
        },
        default: 'roll',
        close: () => {},     
    });

    dialog.render(true);
}