const SAVE_KEY = "banglar-tesla-save-v1";
const SAVE_VERSION = 1;
const CONFIG = Object.freeze({
  maxSpeed: 1,
  baseSpeed: 0.36,
  acceleration: 0.32,
  braking: 0.72,
  steerSpeed: 1.45,
  boostSpeed: 1.65,
  boostSeconds: 1.15,
  boostDrain: 38,
  batteryRecharge: 3.8,
  trafficSpawnSeconds: 1.05,
  collisionCooldown: 1.15,
  chaosDecay: 1.9,
  missionReward: 120,
  fineAmount: 35
});
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const random = (min, max) => min + Math.random() * (max - min);
const laneToX = (lane) => [-0.62, 0, 0.62][lane];

function readSave() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    if (parsed && parsed.version === SAVE_VERSION) return parsed;
  } catch {}
  return { version: SAVE_VERSION, bestScore: 0, trips: 0, totalCash: 0, lifetimeScore: 0 };
}
function writeSave(save) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch {}
}

export class Game {
  constructor(canvas, input, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.input = input;
    this.callbacks = callbacks;
    this.save = readSave();
    this.running = false;
    this.ended = false;
    this.frame = 0;
    this.lastTime = 0;
    this.spawnTimer = 0;
    this.collisionTimer = 0;
    this.boostTimer = 0;
    this.bannerTimer = 0;
    this.roadOffset = 0;
    this.traffic = [];
    this.particles = [];
    this.player = { lane: 1, x: 0, speed: 0.42, lean: 0 };
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
    this.reset();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.draw();
  }

  reset() {
    this.running = false;
    this.ended = false;
    this.frame = 0;
    this.spawnTimer = 0.3;
    this.collisionTimer = 0;
    this.boostTimer = 0;
    this.roadOffset = 0;
    this.traffic = [];
    this.particles = [];
    this.player = { lane: 1, x: 0, speed: 0.42, lean: 0 };
    this.state = {
      score: 0, cash: 0, battery: 100, chaos: 0,
      mission: "pickup", passenger: false, missionDistance: 0,
      missionLane: Math.floor(random(0, 3)), trips: this.save.trips,
      totalCash: this.save.totalCash, bestScore: this.save.bestScore,
      lifetimeScore: this.save.lifetimeScore, fines: 0
    };
    this.spawnMissionMarker();
    this.lastTime = 0;
    this.input.reset();
    this.draw();
    this.emitUpdate();
  }

  spawnMissionMarker() {
    this.missionMarker = {
      lane: this.state.missionLane,
      z: 0.22,
      kind: this.state.mission === "pickup" ? "pickup" : "dropoff"
    };
  }

  start() {
    if (this.ended) this.reset();
    this.running = true;
    this.callbacks.onStart?.();
    this.lastTime = 0;
  }
  pause() {
    this.running = false;
    this.input.reset();
    this.callbacks.onPause?.();
  }
  resume() {
    if (!this.ended) {
      this.running = true;
      this.lastTime = 0;
    }
  }
  getState() {
    const s = this.state;
    const carrying = s.passenger;
    return {
      score: Math.floor(s.score),
      cash: s.cash,
      battery: s.battery,
      chaos: s.chaos,
      bestScore: Math.max(this.save.bestScore, Math.floor(s.score)),
      trips: this.save.trips,
      totalCash: this.save.totalCash,
      missionTitle: s.mission === "pickup" ? "যাত্রী তুলতে হবে" : "যাত্রীকে গন্তব্যে পৌঁছাও",
      missionCopy: s.mission === "pickup"
        ? "হলুদ যাত্রী-চিহ্নের কাছে গিয়ে একই লেনে থাকো, তারপর E চাপো।"
        : "সবুজ গন্তব্য-চিহ্নের কাছে গিয়ে E চাপলে ভাড়া পাবে।",
      missionState: carrying ? "যাত্রী গাড়িতে" : "যাত্রী খুঁজছি"
    };
  }
  emitUpdate() { this.callbacks.onUpdate?.(this.getState()); }
  say(message) { this.callbacks.onMessage?.(message); }

  loop(time) {
    if (this.lastTime === 0) this.lastTime = time;
    const dt = Math.min((time - this.lastTime) / 1000, 0.035);
    this.lastTime = time;
    if (this.running && !this.ended) this.update(dt);
    this.draw();
    requestAnimationFrame(this.loop);
  }

  update(dt) {
    this.frame += 1;
    const input = this.input;
    const s = this.state;
    const p = this.player;
    const steering = (input.isDown("right") ? 1 : 0) - (input.isDown("left") ? 1 : 0);
    const accelerating = input.isDown("accelerate");
    const braking = input.isDown("brake");
    p.speed += (accelerating ? CONFIG.acceleration : -0.10) * dt;
    if (braking) p.speed -= CONFIG.braking * dt;
    p.speed = clamp(p.speed, 0.18, CONFIG.maxSpeed);
    p.lean += (steering - p.lean) * Math.min(1, dt * 9);
    p.x = clamp(p.x + steering * CONFIG.steerSpeed * dt * (0.48 + p.speed), -0.86, 0.86);
    p.lane = p.x < -0.28 ? 0 : p.x > 0.28 ? 2 : 1;

    if (input.wasPressed("boost")) {
      if (s.battery >= 14 && this.boostTimer <= 0) {
        this.boostTimer = CONFIG.boostSeconds;
        s.battery = Math.max(0, s.battery - CONFIG.boostDrain);
        this.say("⚡ Jet Boost! সামনের বাধা পেরিয়ে যাও!");
        this.spawnBoostParticles();
      } else if (s.battery < 14) this.say("ব্যাটারি কম! চার্জিং স্টেশন পরের ধাপে আসছে।");
    }
    if (input.wasPressed("interact")) this.tryInteract();
    input.endFrame();

    const boostActive = this.boostTimer > 0;
    if (this.boostTimer > 0) this.boostTimer = Math.max(0, this.boostTimer - dt);
    if (!boostActive) s.battery = Math.min(100, s.battery + CONFIG.batteryRecharge * dt * (braking ? 1.4 : 0.45));

    const travel = dt * (0.24 + p.speed * 0.55) * (boostActive ? CONFIG.boostSpeed : 1);
    this.roadOffset = (this.roadOffset + travel) % 1;
    if (this.missionMarker) {
      this.missionMarker.z += travel * 0.72;
      if (this.missionMarker.z > 1.15) {
        this.missionMarker.z = 0.28;
        this.missionMarker.lane = Math.floor(random(0, 3));
        this.say(s.mission === "pickup" ? "যাত্রী এগিয়ে যাচ্ছে—চিহ্নের দিকে নজর রাখো।" : "গন্তব্য সামনে, মনোযোগ ধরে রাখো।");
      }
    }
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTraffic();
      this.spawnTimer = random(CONFIG.trafficSpawnSeconds * 0.6, CONFIG.trafficSpawnSeconds * 1.45);
    }
    this.collisionTimer = Math.max(0, this.collisionTimer - dt);
    for (const car of this.traffic) {
      car.z += travel * car.approach;
      if (car.z > 0.80 && car.z < 0.96 && this.collisionTimer <= 0 && Math.abs(p.x - laneToX(car.lane)) < (boostActive ? 0.15 : 0.22)) {
        if (boostActive) {
          car.hit = true;
          s.score += 20;
          this.say("দারুণ! Boost দিয়ে বাধা এড়িয়েছ!");
          this.spawnImpactParticles(car.lane, true);
        } else {
          this.collisionTimer = CONFIG.collisionCooldown;
          s.chaos = clamp(s.chaos + (car.kind === "pedestrian" ? 22 : 14), 0, 100);
          s.score = Math.max(0, s.score - 12);
          s.cash = Math.max(0, s.cash - CONFIG.fineAmount);
          s.fines += CONFIG.fineAmount;
          p.speed = Math.max(0.22, p.speed * 0.55);
          car.hit = true;
          this.spawnImpactParticles(car.lane, false);
          this.say("ধাক্কা! জরিমানা ৳35 — সাবধানে চালাও!");
          if (s.chaos >= 100) this.gameOver("chaos");
        }
      }
    }
    this.traffic = this.traffic.filter(car => car.z < 1.18 && !car.hit);
    s.chaos = Math.max(0, s.chaos - CONFIG.chaosDecay * dt);
    s.score += dt * (8 + p.speed * 7);
    this.particles = this.particles.filter(pt => {
      pt.life -= dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      return pt.life > 0;
    });
    if (s.chaos > 72 && Math.random() < dt * 0.35) this.say("🚨 ট্রাফিক পুলিশ তোমার দিকে নজর দিচ্ছে!");
    this.emitUpdate();
  }

  spawnTraffic() {
    const lane = Math.floor(random(0, 3));
    const types = ["car", "bus", "rickshaw", "pedestrian", "cone"];
    const kind = types[Math.floor(random(0, types.length))];
    this.traffic.push({ lane, z: 0.05, kind, approach: random(0.82, 1.2), color: ["#e85d50","#f2b84b","#48a8a4","#6d7de0","#d8e1e4"][Math.floor(random(0,5))], hit: false, sway: random(-0.05,0.05) });
  }

  tryInteract() {
    const marker = this.missionMarker;
    if (!marker || marker.z < 0.65 || marker.z > 1.02 || Math.abs(this.player.x - laneToX(marker.lane)) > 0.31) {
      this.say("যাত্রী/গন্তব্যের চিহ্নের কাছে গিয়ে সঠিক লেনে E চাপো।");
      return;
    }
    const s = this.state;
    if (s.mission === "pickup") {
      s.passenger = true;
      s.mission = "dropoff";
      marker.kind = "dropoff";
      marker.z = 0.18;
      marker.lane = Math.floor(random(0, 3));
      this.say("🗣️ যাত্রী: “ভাই, মিটারে যাবেন তো?” গন্তব্যে চলো!");
    } else {
      const reward = CONFIG.missionReward + Math.round(this.player.speed * 30);
      s.cash += reward;
      s.score += 150;
      s.passenger = false;
      s.mission = "pickup";
      s.trips += 1;
      this.save.trips += 1;
      this.save.totalCash += reward;
      this.save.bestScore = Math.max(this.save.bestScore, Math.floor(s.score));
      this.save.lifetimeScore += Math.floor(s.score);
      writeSave(this.save);
      marker.kind = "pickup";
      marker.z = 0.12;
      marker.lane = Math.floor(random(0, 3));
      this.say("ভাড়া পেয়েছ ৳" + reward + "! পরের যাত্রী খুঁজো।");
    }
    this.emitUpdate();
  }

  spawnBoostParticles() {
    for (let i = 0; i < 15; i++) this.particles.push({ x: this.width * (0.5 + random(-0.08,0.08)), y: this.height * 0.84, vx: random(-60,60), vy: random(-150,-25), life: random(0.25,0.65), max: 0.65, color: "#b5fff0" });
  }
  spawnImpactParticles(lane, good) {
    for (let i = 0; i < 10; i++) this.particles.push({ x: this.width * (0.5 + laneToX(lane) * 0.3), y: this.height * 0.78, vx: random(-90,90), vy: random(-100,30), life: random(0.18,0.5), max: 0.5, color: good ? "#c9f36a" : "#ff6c71" });
  }
  gameOver(kind) {
    if (this.ended) return;
    this.ended = true;
    this.running = false;
    this.save.bestScore = Math.max(this.save.bestScore, Math.floor(this.state.score));
    this.save.lifetimeScore += Math.floor(this.state.score);
    writeSave(this.save);
    const reason = kind === "chaos"
      ? { title: "পুলিশ ধরে ফেলেছে!", copy: "বিশৃঙ্খলা খুব বেড়ে গেছে। একটু শান্তভাবে চালিয়ে আবার চেষ্টা করো।" }
      : { title: "ট্রিপ শেষ", copy: "এই রাউন্ডে স্কোর " + Math.floor(this.state.score) + "। আবার রাস্তায় নামবে?" };
    this.callbacks.onGameOver?.(reason, this.getState());
  }

  draw() {
    if (!this.ctx || !this.width || !this.height) return;
    const ctx = this.ctx, w = this.width, h = this.height;
    const horizon = h * 0.30;
    ctx.clearRect(0,0,w,h);
    const sky = ctx.createLinearGradient(0,0,0,horizon);
    sky.addColorStop(0,"#82c6cf"); sky.addColorStop(1,"#d8e3c7");
    ctx.fillStyle = sky; ctx.fillRect(0,0,w,horizon);
    this.drawSun(ctx,w,h);
    this.drawCity(ctx,w,horizon);
    ctx.fillStyle = "#5b9870"; ctx.fillRect(0,horizon,w,h-horizon);
    this.drawRoad(ctx,w,h,horizon);
    this.drawRoadside(ctx,w,h,horizon);
    this.drawMission(ctx,w,h,horizon);
    const ordered = [...this.traffic].sort((a,b) => a.z-b.z);
    ordered.forEach(car => this.drawTraffic(ctx,car,w,h,horizon));
    this.drawPlayer(ctx,w,h);
    this.drawParticles(ctx);
    if (this.boostTimer > 0) {
      ctx.fillStyle = "rgba(93,255,224,.08)"; ctx.fillRect(0,0,w,h);
      ctx.fillStyle = "#d5fff6"; ctx.font = "900 12px system-ui"; ctx.textAlign = "center"; ctx.fillText("JET BOOST",w/2,h-18);
    }
  }
  drawSun(ctx,w,h) {
    ctx.fillStyle = "#fff1b6"; ctx.beginPath(); ctx.arc(w*0.82,h*0.105,Math.min(w,h)*0.04,0,Math.PI*2); ctx.fill();
  }
  drawCity(ctx,w,horizon) {
    const buildings = 15;
    for (let i=0;i<buildings;i++) {
      const bw = w/(buildings+2)*(0.65+((i*17)%13)/20);
      const x = i*w/buildings;
      const bh = horizon*(0.20+((i*29)%17)/32);
      const colors = ["#507e83","#628a8b","#789899","#53767e","#8da7a1"];
      ctx.fillStyle = colors[i%colors.length];
      ctx.fillRect(x,horizon-bh,bw,bh);
      ctx.fillStyle = "rgba(255,230,158,.45)";
      for (let wy=horizon-bh+8;wy<horizon-6;wy+=12) for (let wx=x+6;wx<x+bw-4;wx+=10) ctx.fillRect(wx,wy,3,4);
      if (i%4===1) {
        ctx.fillStyle="#c85c4c";ctx.fillRect(x+bw*.25,horizon-bh-6,bw*.5,7);
      }
    }
    ctx.fillStyle="#e6e4cf";ctx.fillRect(0,horizon-2,w,4);
  }
  roadEdges(w,horizon) {
    const ctx=this.ctx;
    return { left: w*0.5-w*0.47, right:w*0.5+w*0.47, topLeft:w*0.5-w*0.12, topRight:w*0.5+w*0.12, horizon };
  }
  drawRoad(ctx,w,h,horizon) {
    const leftTop=w*0.39, rightTop=w*0.61, leftBottom=-w*0.04, rightBottom=w*1.04;
    ctx.fillStyle="#b7b4a4";ctx.beginPath();ctx.moveTo(leftTop-12,horizon);ctx.lineTo(rightTop+12,horizon);ctx.lineTo(rightBottom,h);ctx.lineTo(leftBottom,h);ctx.closePath();ctx.fill();
    ctx.fillStyle="#3a4449";ctx.beginPath();ctx.moveTo(leftTop,horizon);ctx.lineTo(rightTop,horizon);ctx.lineTo(rightBottom,h);ctx.lineTo(leftBottom,h);ctx.closePath();ctx.fill();
    ctx.strokeStyle="#d5d0a8";ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(leftTop,horizon);ctx.lineTo(leftBottom,h);ctx.moveTo(rightTop,horizon);ctx.lineTo(rightBottom,h);ctx.stroke();
    const offset=this.roadOffset;
    for(let lane=1;lane<=2;lane++){
      const topX=w*(0.39+lane*0.073), bottomX=w*(lane/3);
      for(let i=0;i<9;i++){
        const z=((i/8+offset)%1);
        const y=horizon+(h-horizon)*z;
        const halfW=(w*0.47)*z;
        const x=w*0.5+(lane-1.5)*(w*0.31)*z;
        const dashH=2+z*18;
        ctx.strokeStyle="#e6e4cf";ctx.lineWidth=1+z*2;
        ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+dashH);ctx.stroke();
      }
    }
    ctx.fillStyle="#e8d6a0";ctx.fillRect(w*.47,horizon+8,w*.06,3);
  }
  drawRoadside(ctx,w,h,horizon) {
    const ctx2=ctx;
    for(let i=0;i<7;i++){
      const z=((i/7+this.roadOffset*0.7)%1);
      const y=horizon+(h-horizon)*z;
      const scale=0.2+z*0.85;
      const sideX=w*.5+(w*.48)*scale;
      ctx2.fillStyle="#385e4a";ctx2.beginPath();ctx2.arc(sideX,y-12*scale,9*scale,0,Math.PI*2);ctx2.fill();
      ctx2.fillStyle="#735c42";ctx2.fillRect(sideX-2*scale,y-10*scale,4*scale,14*scale);
      ctx2.fillStyle="#d7e2c7";ctx2.fillRect(w-sideX-2*scale,y-10*scale,4*scale,14*scale);
    }
  }
  project(lane,z,w,h,horizon) {
    const t=clamp(z,0,1.1);
    const y=horizon+(h-horizon)*t;
    const spread=w*(0.10+0.40*t);
    return { x:w*0.5+laneToX(lane)*spread, y, scale:0.18+1.18*t };
  }
  drawMission(ctx,w,h,horizon) {
    const m=this.missionMarker;
    if(!m)return;
    const pos=this.project(m.lane,m.z,w,h,horizon);
    if(pos.y<horizon-10 || pos.y>h*1.1)return;
    const size=pos.scale*13;
    const pickup=m.kind==="pickup";
    ctx.save();ctx.translate(pos.x,pos.y-size*1.6);
    ctx.fillStyle=pickup?"#ffcc55":"#9dffc8";
    ctx.beginPath();ctx.arc(0,0,size,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#182b2e";ctx.font="900 "+Math.max(8,size*1.1)+"px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(pickup?"৳":"✓",0,0);
    ctx.restore();
    if(pos.y>h*.52){
      ctx.font="800 10px system-ui";ctx.textAlign="center";ctx.fillStyle=pickup?"#fff0b6":"#d4ffeb";
      ctx.fillText(pickup?"যাত্রী":"গন্তব্য",pos.x,pos.y-size*2.6);
    }
  }
  drawTraffic(ctx,car,w,h,horizon) {
    const pos=this.project(car.lane,car.z,w,h,horizon);
    const s=pos.scale;
    if(pos.y<horizon-10)return;
    const x=pos.x+car.sway*w*car.z;
    if(car.kind==="pedestrian"){
      ctx.fillStyle="#263b43";ctx.beginPath();ctx.arc(x,pos.y-s*23,s*5,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle="#e9c7a4";ctx.lineWidth=s*4;ctx.beginPath();ctx.moveTo(x,pos.y-s*18);ctx.lineTo(x,pos.y-s*5);ctx.stroke();
      ctx.strokeStyle="#263b43";ctx.lineWidth=s*3;ctx.beginPath();ctx.moveTo(x,pos.y-s*5);ctx.lineTo(x-s*4,pos.y+s*4);ctx.moveTo(x,pos.y-s*5);ctx.lineTo(x+s*4,pos.y+s*4);ctx.stroke();return;
    }
    if(car.kind==="cone"){
      ctx.fillStyle="#f2a14a";ctx.beginPath();ctx.moveTo(x,pos.y);ctx.lineTo(x-s*10,pos.y);ctx.lineTo(x-s*3,pos.y-s*21);ctx.lineTo(x+s*3,pos.y-s*21);ctx.lineTo(x+s*10,pos.y);ctx.closePath();ctx.fill();ctx.fillStyle="#fff1d6";ctx.fillRect(x-s*6,pos.y-s*9,s*12,s*3);return;
    }
    const width=(car.kind==="bus"?38:car.kind==="rickshaw"?24:29)*s;
    const height=(car.kind==="bus"?52:car.kind==="rickshaw"?30:38)*s;
    ctx.fillStyle="#0003";ctx.beginPath();ctx.ellipse(x,pos.y+2*s,width*.65,5*s,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=car.kind==="rickshaw"?"#dc9b3c":car.color;
    ctx.beginPath();ctx.moveTo(x-width*.48,pos.y);ctx.lineTo(x-width*.42,pos.y-height*.68);ctx.quadraticCurveTo(x-width*.35,pos.y-height,x,pos.y-height);ctx.quadraticCurveTo(x+width*.35,pos.y-height,x+width*.42,pos.y-height*.68);ctx.lineTo(x+width*.48,pos.y);ctx.closePath();ctx.fill();
    ctx.fillStyle="#b8e4e7";ctx.fillRect(x-width*.31,pos.y-height*.76,width*.62,height*.25);
    ctx.fillStyle="#27363a";ctx.fillRect(x-width*.39,pos.y-height*.12,width*.2,height*.1);ctx.fillRect(x+width*.19,pos.y-height*.12,width*.2,height*.1);
    if(car.kind==="rickshaw"){ctx.strokeStyle="#f6d38a";ctx.lineWidth=2*s;ctx.beginPath();ctx.moveTo(x-width*.5,pos.y-height*.9);ctx.lineTo(x+width*.5,pos.y-height*.9);ctx.stroke();}
  }
  drawPlayer(ctx,w,h) {
    const p=this.player;
    const x=w*.5+p.x*w*.34;
    const y=h*.82;
    const scale=Math.min(w/460,1.25);
    const width=42*scale,height=66*scale;
    ctx.save();ctx.translate(x,y);ctx.rotate(p.lean*.09);
    ctx.fillStyle="#0005";ctx.beginPath();ctx.ellipse(0,4,width*.72,8*scale,0,0,Math.PI*2);ctx.fill();
    // Rear-view electric three-wheeler inspired by a Bangladeshi auto-rickshaw.
    ctx.fillStyle="#1d2c31";ctx.fillRect(-width*.49,-height*.15,width*.18,height*.48);ctx.fillRect(width*.31,-height*.15,width*.18,height*.48);
    ctx.fillStyle="#35cbb2";ctx.beginPath();ctx.moveTo(-width*.48,0);ctx.lineTo(-width*.45,-height*.55);ctx.quadraticCurveTo(-width*.42,-height*.82,0,-height*.85);ctx.quadraticCurveTo(width*.42,-height*.82,width*.45,-height*.55);ctx.lineTo(width*.48,0);ctx.closePath();ctx.fill();
    ctx.fillStyle="#163b45";ctx.beginPath();ctx.moveTo(-width*.34,-height*.58);ctx.lineTo(-width*.28,-height*.78);ctx.quadraticCurveTo(0,-height*.84,width*.28,-height*.78);ctx.lineTo(width*.34,-height*.58);ctx.closePath();ctx.fill();
    ctx.strokeStyle="#b8fff1";ctx.lineWidth=1.4*scale;ctx.beginPath();ctx.moveTo(-width*.28,-height*.53);ctx.lineTo(width*.28,-height*.53);ctx.stroke();
    ctx.fillStyle="#fff1ad";ctx.fillRect(-width*.34,-height*.1,width*.18,height*.08);ctx.fillRect(width*.16,-height*.1,width*.18,height*.08);
    ctx.fillStyle="#1b5153";ctx.fillRect(-width*.22,-height*.32,width*.44,height*.12);
    ctx.fillStyle="#d9fff7";ctx.font="900 "+Math.max(7,8*scale)+"px system-ui";ctx.textAlign="center";ctx.fillText("BT",0,-height*.23);
    ctx.restore();
  }
  drawParticles(ctx) {
    for(const p of this.particles){
      ctx.globalAlpha=clamp(p.life/(p.max||0.6),0,1);
      ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,2.5,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;
  }
}
