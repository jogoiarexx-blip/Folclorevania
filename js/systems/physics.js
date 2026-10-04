// ============================================================
// js/systems/physics.js
// Resolução de física AABB em eixo separado
// ============================================================

function resolvePhysics(entity, region) {
  // ── Eixo X primeiro ──
  entity.x += entity.vx;
  for (const t of region.solidTiles) {
    if (_overlap(entity, t)) {
      if (entity.vx > 0) entity.x = t.x - entity.width;
      else               entity.x = t.x + t.w;
      entity.vx = 0;
    }
  }

  // ── Eixo Y ──
  entity.vy += entity.gravity;
  entity.onGround = false;
  entity.y += entity.vy;

  for (const t of region.solidTiles) {
    if (_overlap(entity, t)) {
      if (entity.vy >= 0) {
        entity.y      = t.y - entity.height;
        entity.vy     = 0;
        entity.onGround = true;
      } else {
        entity.y  = t.y + t.h;
        entity.vy = 0;
      }
    }
  }

  // Plataformas one-way
  for (const t of region.oneWayTiles) {
    const prevBottom = entity.y + entity.height - entity.vy;
    if (
      entity.vy >= 0 &&
      prevBottom <= t.y + 4 &&
      entity.y + entity.height >= t.y &&
      entity.x + entity.width > t.x &&
      entity.x < t.x + t.w
    ) {
      entity.y      = t.y - entity.height;
      entity.vy     = 0;
      entity.onGround = true;
    }
  }

  // Limites laterais
  if (entity.x < region.bounds.left)
    entity.x = region.bounds.left;
  if (entity.x + entity.width > region.bounds.right)
    entity.x = region.bounds.right - entity.width;

  // Teto da região (evita sair pelo topo)
  if (entity.y < region.bounds.top) {
    entity.y  = region.bounds.top;
    entity.vy = 0;
  }
}

// AABB — usa .w/.h para tiles, .width/.height para entidades
function _overlap(entity, tile) {
  return entity.x            < tile.x + tile.w &&
         entity.x + entity.width  > tile.x     &&
         entity.y            < tile.y + tile.h  &&
         entity.y + entity.height > tile.y;
}

// Alias público usado em bossSystem e enemy
function aabbOverlap(a, b) { return _overlap(a, b); }
function boxHits(a, b) {
  return a.x < b.x + (b.width  || b.w) && a.x + (a.width  || a.w) > b.x &&
         a.y < b.y + (b.height || b.h) && a.y + (a.height || a.h) > b.y;
}
