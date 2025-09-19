// Thrymnor Prototype - local-only
(() => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // --- Core State ---
  const State = {
    loc: null,
    order: 50,  // 0..100
    mercy: 50,  // 0..100
    skills: {
      Swordsmanship: 5, Archery: 3, Spellcasting: 2, Defense: 4,
      Blacksmithing: 1, Alchemy: 3, Cooking: 2, Tailoring: 0,
      Mining: 1, Hunting: 2, Herbalism: 3, Fishing: 1,
      Persuasion: 2, Intimidation: 1, Leadership: 0,
      Survival: 2, Stealth: 1, Cartography: 0
    },
    inventory: [],
    quests: []
  };

  const RARITY = ["common","uncommon","rare","epic","legendary"];
  const RARITY_WEIGHTS = { common: 65, uncommon: 20, rare: 10, epic: 4, legendary: 1 };

  // --- Sample Content (expandable) ---
  const LOC_DESC = {
    "Velmor Highlands": "Rolling hills and contested castles of rival lords.",
    "Cindrel Port": "Bustling trade hub with black markets and guild intrigue.",
    "Drowned Marshes": "Fetid swamps, spirits, and rare herbs.",
    "Ashen Wastes": "Scars of the Shattering War. Dangerous relic hunters roam.",
    "Frostspire Peaks": "Snowbound shrines and beasts. High risk, high reward."
  };

  let ITEM_POOL = []; // now loaded from items.json

async function loadData() {
  try {
    const questsRes = await fetch("data/quests.json");
    const itemsRes = await fetch("data/items.json");

    State.quests = await questsRes.json();
    ITEM_POOL = await itemsRes.json();
  } catch (err) {
    console.error("Failed to load data:", err);
  }
}

  

  // Populate initial state
  State.quests = STARTER_QUESTS;

  // --- Persistence ---
  const save = () => localStorage.setItem("thrymnor_state", JSON.stringify(State));
  const load = () => {
    const raw = localStorage.getItem("thrymnor_state");
    if (!raw) return false;
    const data = JSON.parse(raw);
    Object.assign(State, data);
    return true;
  };
  const reset = () => { localStorage.removeItem("thrymnor_state"); location.reload(); };

  // --- Helpers ---
  function clamp(n, min=0, max=100){ return Math.max(min, Math.min(max, n)); }
  function chancePick(weightMap){
    const entries = Object.entries(weightMap);
    const total = entries.reduce((s,[,w])=>s+w,0);
    let r = Math.random()*total;
    for(const [k,w] of entries){
      if((r-=w) <= 0) return k;
    }
    return entries[0][0];
  }
  function randomItemByRarity(target){
    const pool = ITEM_POOL.filter(i => {
      if(target === "rare") return ["rare","epic","legendary"].includes(i.rarity);
      if(target === "epic") return ["epic","legendary"].includes(i.rarity);
      if(target === "uncommon") return ["uncommon","rare"].includes(i.rarity);
      if(target === "common") return ["common","uncommon"].includes(i.rarity);
      return true;
    });
    return pool[Math.floor(Math.random()*pool.length)] || ITEM_POOL[0];
  }

  // --- Rendering ---
  function renderLocation(desc="Choose a location."){
    $("#locDesc").textContent = desc;
  }

  function renderActions(){
    const actions = [
      { id:"fight", label:"Fight", onClick:() => actOutcome("fight") },
      { id:"talk", label:"Talk", onClick:() => actOutcome("talk") },
      { id:"sneak", label:"Sneak", onClick:() => actOutcome("sneak") },
      { id:"negotiate", label:"Negotiate", onClick:() => actOutcome("negotiate") },
      { id:"forage", label:"Forage", onClick:() => actOutcome("forage") },
      { id:"rest", label:"Rest", onClick:() => actOutcome("rest") },
      { id:"leave", label:"Leave", onClick:() => renderLocation("You step away, considering your next move.") }
    ];
    const bar = $("#actionsBar");
    bar.innerHTML = "";
    actions.forEach(a => {
      const btn = document.createElement("button");
      btn.textContent = a.label;
      btn.addEventListener("click", a.onClick);
      bar.appendChild(btn);
    });
  }

  function renderSkills(){
    const ul = $("#skillsList");
    ul.innerHTML = "";
    Object.entries(State.skills).forEach(([k,v]) => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${k}</span><span>${v}</span>`;
      ul.appendChild(li);
    });
    $("#orderBar").style.width = `${clamp(State.order)}%`;
    $("#mercyBar").style.width = `${clamp(State.mercy)}%`;
  }

  function rarityBadge(r){
    const span = document.createElement("span");
    span.className = `badge ${r}`;
    span.textContent = r;
    return span;
  }

  function renderInventory(){
    const root = $("#inventory");
    root.innerHTML = "";
    if(State.inventory.length === 0){
      root.innerHTML = `<p class="muted">No items yet.</p>`;
      return;
    }
    State.inventory.forEach((it, idx) => {
      const row = document.createElement("div");
      row.className = "item";
      const left = document.createElement("div");
      left.innerHTML = `<strong>${it.name}</strong><div class="muted" style="font-size:12px">${it.effect}</div>`;
      const right = document.createElement("div");
      right.appendChild(rarityBadge(it.rarity));
      const del = document.createElement("button");
      del.textContent = "Drop";
      del.style.marginLeft = "8px";
      del.addEventListener("click", () => {
        State.inventory.splice(idx,1);
        renderInventory();
        save();
      });
      right.appendChild(del);
      row.appendChild(left); row.appendChild(right);
      root.appendChild(row);
    });
  }

  function renderQuests(){
    const root = $("#quests");
    root.innerHTML = "";
    State.quests.forEach(q => {
      const box = document.createElement("div");
      box.className = "quest";
      const title = document.createElement("div");
      title.className = "q-title";
      title.textContent = q.title;
      const status = document.createElement("div");
      status.className = "q-status";
      status.textContent = `Status: ${q.status}`;
      const desc = document.createElement("p");
      desc.textContent = q.desc;

      box.appendChild(title);
      box.appendChild(status);
      box.appendChild(desc);

      if(q.status === "Available"){
        const actions = document.createElement("div");
        q.choices.forEach(choice => {
          const btn = document.createElement("button");
          btn.textContent = choice.label;
          btn.addEventListener("click", () => {
            // apply effects
            if(choice.effects){
              State.order = clamp(State.order + (choice.effects.order||0));
              State.mercy = clamp(State.mercy + (choice.effects.mercy||0));
              if(choice.effects.loot){
                const it = randomItemByRarity(choice.effects.loot);
                State.inventory.push(it);
                notify(`You received: ${it.name} (${it.rarity})`);
              }
            }
            q.status = "Completed";
            status.textContent = `Status: ${q.status}`;
            notify(choice.result || "Outcome resolved.");
            renderSkills(); renderInventory();
            save();
          });
          actions.appendChild(btn);
        });
        box.appendChild(actions);
      }

      root.appendChild(box);
    });
  }

  function notify(msg){
    const div = document.createElement("div");
    div.textContent = msg;
    div.style.position = "fixed";
    div.style.bottom = "16px";
    div.style.right = "16px";
    div.style.padding = "10px 12px";
    div.style.background = "#111827";
    div.style.border = "1px solid #263149";
    div.style.borderRadius = "10px";
    div.style.opacity = "0.95";
    div.style.zIndex = "9999";
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 2400);
  }

  // --- Actions Logic ---
  function actOutcome(kind){
    // very simple check affected by skills + location
    let deltaOrder = 0, deltaMercy = 0, lootKey = null, msg = "";
    if(kind === "fight"){
      const power = (State.skills.Swordsmanship + State.skills.Defense) + (State.loc === "Frostspire Peaks" ? 1 : 0);
      const roll = Math.random()*12 + power;
      if(roll > 12){ msg="Victory! Enemies scatter."; lootKey="uncommon"; deltaOrder+=2; }
      else { msg="Tough fight. You retreat wounded."; deltaMercy+=1; }
    } else if(kind === "talk" || kind === "negotiate"){
      const power = (State.skills.Persuasion + State.skills.Leadership);
      const roll = Math.random()*10 + power;
      if(roll > 10){ msg="Your words sway the crowd."; deltaOrder+=3; }
      else { msg="Talks stall. Tension lingers."; }
    } else if(kind === "sneak"){
      const power = State.skills.Stealth;
      const roll = Math.random()*8 + power;
      if(roll > 7){ msg="You slip by unseen and find a stash."; lootKey="rare"; }
      else { msg="Spotted! You scramble away."; deltaOrder-=1; }
    } else if(kind === "forage"){
      const power = (State.skills.Herbalism + State.skills.Survival);
      const roll = Math.random()*8 + power;
      if(roll > 7){ msg="You gather useful herbs and materials."; lootKey="common"; }
      else { msg="Slim pickings today."; }
    } else if(kind === "rest"){
      msg = "You take time to rest. Nothing happens.";
      deltaMercy += 1;
    }
    State.order = clamp(State.order + deltaOrder);
    State.mercy = clamp(State.mercy + deltaMercy);
    if(lootKey){
      const it = randomItemByRarity(lootKey);
      State.inventory.push(it);
      msg += ` Looted: ${it.name} (${it.rarity}).`;
    }
    notify(msg);
    renderSkills(); renderInventory();
    save();
  }

  // --- Event Wiring ---
  $$(".node").forEach(btn => {
    btn.addEventListener("click", () => {
      const loc = btn.dataset.loc;
      State.loc = loc;
      renderLocation(LOC_DESC[loc] || loc);
      save();
    });
  });
  $("#saveBtn").addEventListener("click", save);
  $("#loadBtn").addEventListener("click", () => {
    if(load()){ renderAll(); notify("Loaded."); }
    else notify("No save found.");
  });
  $("#resetBtn").addEventListener("click", reset);
  $("#lootCommon").addEventListener("click", () => {
    const it = randomItemByRarity("common");
    State.inventory.push(it); renderInventory(); save(); notify(`Looted: ${it.name} (${it.rarity})`);
  });
  $("#lootRare").addEventListener("click", () => {
    const it = randomItemByRarity("rare");
    State.inventory.push(it); renderInventory(); save(); notify(`Looted: ${it.name} (${it.rarity})`);
  });

  function renderAll(){
    renderLocation(State.loc ? LOC_DESC[State.loc] : "Choose a location.");
    renderActions();
    renderSkills();
    renderQuests();
    renderInventory();
  }

// Boot
(async () => {
  load();          // load from localStorage if available
  await loadData();// load quests + items from JSON
  renderAll();     // draw UI
})();
