// ============================================================
// js/systems/relicSystem.js
// Definição das relíquias disponíveis
// Depende de: player.js
// ============================================================

const RELICS = {
  curupira: { name:'Máscara do Curupira',    icon:'🌿', apply(p){ p.damageBonus      += 1;   } },
  saci:     { name:'Gorro do Saci',          icon:'🎩', apply(p){ p.dashCostMod      += 10;  } },
  mula:     { name:'Chama da Mula',          icon:'🔥', apply(p){ p.staminaRegenMod  += 0.3; } },
  caipora:  { name:'Bumerangue da Caipora',  icon:'🪃', apply(p){ p.damageBonus      += 1; p.dashCostMod += 5; } },
  ancestral:{ name:'Fragmento Ancestral',    icon:'🔮', apply(p){ p.damageBonus      += 2; p.staminaRegenMod += 0.4; } },
};
