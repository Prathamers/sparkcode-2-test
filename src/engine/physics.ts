import type { ColliderShape } from '../types/project';

export interface PhysicsBody {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  enabled: boolean;
  isStatic: boolean;
  solid: boolean;
  shape: ColliderShape;
  mass: number;
  friction: number;
  restitution: number;
  gravityScale: number;
  onGround: boolean;
}

export interface PhysicsWorldConfig {
  gravityX: number;
  gravityY: number;
  airDrag: number;
}

export interface CollisionPair {
  aId: string;
  bId: string;
  normalX: number;
  normalY: number;
  penetration: number;
}

export interface RaycastHit {
  hit: boolean;
  bodyId: string | null;
  distance: number;
  hitX: number;
  hitY: number;
  normalX: number;
  normalY: number;
}

export function getBodyHalfExtents(body: Pick<PhysicsBody, 'width' | 'height' | 'scaleX' | 'scaleY'>): {
  hw: number;
  hh: number;
  radius: number;
} {
  const hw = Math.max(2, (Math.abs(body.width * body.scaleX)) / 2);
  const hh = Math.max(2, (Math.abs(body.height * body.scaleY)) / 2);
  const radius = Math.max(hw, hh);
  return { hw, hh, radius };
}

export function checkOverlap(a: PhysicsBody, b: PhysicsBody): CollisionPair | null {
  const ea = getBodyHalfExtents(a);
  const eb = getBodyHalfExtents(b);

  if (a.shape === 'circle' && b.shape === 'circle') {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const distSq = dx * dx + dy * dy;
    const minDist = ea.radius + eb.radius;
    if (distSq >= minDist * minDist) return null;
    const dist = Math.sqrt(distSq);
    if (dist < 0.0001) {
      return { aId: a.id, bId: b.id, normalX: 0, normalY: 1, penetration: minDist };
    }
    return {
      aId: a.id,
      bId: b.id,
      normalX: dx / dist,
      normalY: dy / dist,
      penetration: minDist - dist,
    };
  }

  if (a.shape === 'circle' && b.shape === 'aabb') {
    return circleVsAabb(a, b, false);
  }

  if (a.shape === 'aabb' && b.shape === 'circle') {
    return circleVsAabb(b, a, true);
  }

  // AABB vs AABB
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const overlapX = ea.hw + eb.hw - Math.abs(dx);
  if (overlapX <= 0) return null;
  const overlapY = ea.hh + eb.hh - Math.abs(dy);
  if (overlapY <= 0) return null;

  if (overlapX < overlapY) {
    return {
      aId: a.id,
      bId: b.id,
      normalX: dx < 0 ? -1 : 1,
      normalY: 0,
      penetration: overlapX,
    };
  }
  return {
    aId: a.id,
    bId: b.id,
    normalX: 0,
    normalY: dy < 0 ? -1 : 1,
    penetration: overlapY,
  };
}

function circleVsAabb(circle: PhysicsBody, box: PhysicsBody, flipIds: boolean): CollisionPair | null {
  const ec = getBodyHalfExtents(circle);
  const eb = getBodyHalfExtents(box);
  const closestX = Math.max(box.x - eb.hw, Math.min(circle.x, box.x + eb.hw));
  const closestY = Math.max(box.y - eb.hh, Math.min(circle.y, box.y + eb.hh));

  const dx = box.x - circle.x;
  const dy = box.y - circle.y;
  const vx = circle.x - closestX;
  const vy = circle.y - closestY;
  const distSq = vx * vx + vy * vy;

  if (distSq >= ec.radius * ec.radius) return null;

  let nx = 0;
  let ny = 0;
  let penetration = 0;

  if (distSq > 0.00001) {
    const dist = Math.sqrt(distSq);
    // Normal points from circle to box
    nx = -vx / dist;
    ny = -vy / dist;
    penetration = ec.radius - dist;
  } else {
    // Circle center is inside the box
    const ox = eb.hw - Math.abs(dx);
    const oy = eb.hh - Math.abs(dy);
    if (ox < oy) {
      nx = dx < 0 ? -1 : 1;
      ny = 0;
      penetration = ox + ec.radius;
    } else {
      nx = 0;
      ny = dy < 0 ? -1 : 1;
      penetration = oy + ec.radius;
    }
  }

  if (flipIds) {
    return {
      aId: box.id,
      bId: circle.id,
      normalX: -nx,
      normalY: -ny,
      penetration,
    };
  }
  return {
    aId: circle.id,
    bId: box.id,
    normalX: nx,
    normalY: ny,
    penetration,
  };
}

/**
 * Steps all rigid bodies forward by dt seconds and resolves solid collisions.
 * Uses Scratch-style Y-up coordinate system (+Y is up, -Y is down, so gravityY is negative e.g. -980).
 */
export function stepPhysicsWorld(
  bodies: PhysicsBody[],
  world: PhysicsWorldConfig,
  dt: number
): CollisionPair[] {
  const clampedDt = Math.min(Math.max(dt, 0), 0.05);
  const collisions: CollisionPair[] = [];

  for (const b of bodies) {
    b.onGround = false;
    if (!b.enabled || b.isStatic) continue;

    b.vx += world.gravityX * b.gravityScale * clampedDt;
    b.vy += world.gravityY * b.gravityScale * clampedDt;

    const dragFactor = Math.max(0, 1 - world.airDrag * clampedDt);
    b.vx *= dragFactor;
    b.vy *= dragFactor;

    b.x += b.vx * clampedDt;
    b.y += b.vy * clampedDt;
  }

  // Pairwise narrow-phase resolution (2 solver iterations for stable stacking)
  const iterations = 2;
  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < bodies.length; i++) {
      const a = bodies[i];
      if (!a.enabled) continue;
      for (let j = i + 1; j < bodies.length; j++) {
        const b = bodies[j];
        if (!b.enabled) continue;
        if (a.isStatic && b.isStatic) continue;

        const contact = checkOverlap(a, b);
        if (!contact) continue;
        if (iter === 0) collisions.push(contact);

        if (!a.solid || !b.solid) continue;

        const invMassA = a.isStatic ? 0 : 1 / Math.max(0.05, a.mass);
        const invMassB = b.isStatic ? 0 : 1 / Math.max(0.05, b.mass);
        const invMassSum = invMassA + invMassB;
        if (invMassSum <= 0) continue;

        // Positional correction (Baumgarte-style slop prevents jitter)
        const slop = 0.2;
        const percent = 0.85;
        const correctionMag = (Math.max(contact.penetration - slop, 0) / invMassSum) * percent;
        const corrX = contact.normalX * correctionMag;
        const corrY = contact.normalY * correctionMag;

        a.x -= corrX * invMassA;
        a.y -= corrY * invMassA;
        b.x += corrX * invMassB;
        b.y += corrY * invMassB;

        // Determine grounded state (in Y-up space, if normal pushes body upward)
        if (!a.isStatic && contact.normalY < -0.5) a.onGround = true;
        if (!b.isStatic && contact.normalY > 0.5) b.onGround = true;

        // Relative velocity along normal
        const rvx = b.vx - a.vx;
        const rvy = b.vy - a.vy;
        const velAlongNormal = rvx * contact.normalX + rvy * contact.normalY;

        if (velAlongNormal > 0) continue;

        const restitution = Math.min(a.restitution, b.restitution);
        const jImpulse = (-(1 + restitution) * velAlongNormal) / invMassSum;
        const impX = jImpulse * contact.normalX;
        const impY = jImpulse * contact.normalY;

        a.vx -= impX * invMassA;
        a.vy -= impY * invMassA;
        b.vx += impX * invMassB;
        b.vy += impY * invMassB;

        // Tangential friction impulse
        const rvx2 = b.vx - a.vx;
        const rvy2 = b.vy - a.vy;
        let tx = rvx2 - (rvx2 * contact.normalX + rvy2 * contact.normalY) * contact.normalX;
        let ty = rvy2 - (rvx2 * contact.normalX + rvy2 * contact.normalY) * contact.normalY;
        const tLen = Math.hypot(tx, ty);
        if (tLen > 0.0001) {
          tx /= tLen;
          ty /= tLen;
          const jt = -(rvx2 * tx + rvy2 * ty) / invMassSum;
          const mu = Math.sqrt(Math.max(0, a.friction) * Math.max(0, b.friction));
          const maxFriction = jImpulse * mu;
          const clampedJt = Math.max(-maxFriction, Math.min(maxFriction, jt));
          a.vx -= clampedJt * tx * invMassA;
          a.vy -= clampedJt * ty * invMassA;
          b.vx += clampedJt * tx * invMassB;
          b.vy += clampedJt * ty * invMassB;
        }
      }
    }
  }

  return collisions;
}

/**
 * Casts a 2D ray from (x1, y1) to (x2, y2) and returns the closest hit against solid bodies.
 */
export function raycastBodies(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  bodies: PhysicsBody[],
  ignoreId?: string
): RaycastHit {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const rayLen = Math.hypot(dx, dy);
  if (rayLen < 0.0001) {
    return { hit: false, bodyId: null, distance: 0, hitX: x2, hitY: y2, normalX: 0, normalY: 0 };
  }

  let closestT = 1.00001;
  let bestHit: RaycastHit = {
    hit: false,
    bodyId: null,
    distance: rayLen,
    hitX: x2,
    hitY: y2,
    normalX: 0,
    normalY: 0,
  };

  for (const body of bodies) {
    if (body.id === ignoreId || !body.solid) continue;
    const { hw, hh, radius } = getBodyHalfExtents(body);

    if (body.shape === 'circle') {
      const fx = x1 - body.x;
      const fy = y1 - body.y;
      const a = dx * dx + dy * dy;
      const b = 2 * (fx * dx + fy * dy);
      const c = fx * fx + fy * fy - radius * radius;
      const disc = b * b - 4 * a * c;
      if (disc < 0) continue;
      const sqrtDisc = Math.sqrt(disc);
      const t = (-b - sqrtDisc) / (2 * a);
      if (t >= 0 && t < closestT) {
        closestT = t;
        const hx = x1 + dx * t;
        const hy = y1 + dy * t;
        const nx = (hx - body.x) / radius;
        const ny = (hy - body.y) / radius;
        bestHit = {
          hit: true,
          bodyId: body.id,
          distance: t * rayLen,
          hitX: hx,
          hitY: hy,
          normalX: nx,
          normalY: ny,
        };
      }
    } else {
      // Slab intersection for AABB
      const minX = body.x - hw;
      const maxX = body.x + hw;
      const minY = body.y - hh;
      const maxY = body.y + hh;

      let tMin = 0;
      let tMax = 1;
      let hitNx = 0;
      let hitNy = 0;

      if (Math.abs(dx) < 1e-8) {
        if (x1 < minX || x1 > maxX) continue;
      } else {
        const invD = 1 / dx;
        let t1 = (minX - x1) * invD;
        let t2 = (maxX - x1) * invD;
        let nSign = -1;
        if (t1 > t2) {
          const tmp = t1;
          t1 = t2;
          t2 = tmp;
          nSign = 1;
        }
        if (t1 > tMin) {
          tMin = t1;
          hitNx = nSign;
          hitNy = 0;
        }
        tMax = Math.min(tMax, t2);
        if (tMin > tMax) continue;
      }

      if (Math.abs(dy) < 1e-8) {
        if (y1 < minY || y1 > maxY) continue;
      } else {
        const invD = 1 / dy;
        let t1 = (minY - y1) * invD;
        let t2 = (maxY - y1) * invD;
        let nSign = -1;
        if (t1 > t2) {
          const tmp = t1;
          t1 = t2;
          t2 = tmp;
          nSign = 1;
        }
        if (t1 > tMin) {
          tMin = t1;
          hitNx = 0;
          hitNy = nSign;
        }
        tMax = Math.min(tMax, t2);
        if (tMin > tMax) continue;
      }

      if (tMin >= 0 && tMin < closestT) {
        closestT = tMin;
        bestHit = {
          hit: true,
          bodyId: body.id,
          distance: tMin * rayLen,
          hitX: x1 + dx * tMin,
          hitY: y1 + dy * tMin,
          normalX: hitNx,
          normalY: hitNy,
        };
      }
    }
  }

  return bestHit;
}
