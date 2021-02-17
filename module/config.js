export const gemengine = {};

gemengine.showshield=false;
gemengine.diff = {};

gemengine.diceTypes = {
    none: "-",
    d4: "d4",
    d6: "d6",
    d8: "d8",
    d10: "d10",
    d12: "d12" 
}

gemengine.attackTypes = 
{
    melee: "gemengine.attackTypes.melee",
    ranged: "gemengine.attackTypes.ranged"
}

gemengine.attributes = {
    none: "-",
    power: "gemengine.attributes.power",
    mind: "gemengine.attributes.mind",
    discipline: "gemengine.attributes.discipline",
    skill: "gemengine.attributes.skill",
    aura: "gemengine.attributes.aura",
    instinct: "gemengine.attributes.instinct",
    resist: "gemengine.attributes.resist",
}

gemengine.init = {
    defaultCardCompendium: 'gemengine.action-cards',
    cardTable: 'Action Cards',
}