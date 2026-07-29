/* =====================================================================
 *  pet.js · 小毛孩 · 宠物日常记录本（工具型）
 *  数据：localStorage v2 · 图片：base64 内嵌 · 不联网 · 不收费
 *  模块：数据模型 / Onboarding / Tab 路由 / 宠物 / 日记 / 相册 /
 *         时间线 / 健康 / 体重 / 纪念 / 设置 / Lightbox / Toast
 *  ===================================================================== */

(() => {
  "use strict";

  // ============ 工具函数 ============
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const STORAGE_KEY = "qilin-pet-data-v2";
  const esc = (s) =>
    String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  const uid = (p = "id") => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const fmt = (ts) => {
    const d = new Date(ts);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };
  const fmtDate = (str) => (str ? str.replace(/-/g, ".") : "—");
  const daysBetween = (a, b) => Math.floor((new Date(b) - new Date(a)) / 86400000);
  const today = () => new Date().toISOString().slice(0, 10);
  const daysUntilNext = (monthDay) => {
    const today = new Date();
    const [m, d] = monthDay.split("-").map(Number);
    let next = new Date(today.getFullYear(), m - 1, d);
    if (next < today) next = new Date(today.getFullYear() + 1, m - 1, d);
    return Math.floor((next - today) / 86400000);
  };
  const toast = (msg, ms = 2000) => {
    const t = $("#pet-toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (t.hidden = true), ms);
  };

  // ============ 主题 ============
  const themeBtn = $("[data-theme-toggle]");
  const setTheme = (t) => {
    if (t === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.dataset.theme = t;
  };
  const initTheme = () => {
    const saved = localStorage.getItem("qilin-pet-theme");
    if (saved) setTheme(saved);
  };
  initTheme();
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const cur = localStorage.getItem("qilin-pet-theme") || "auto";
      const next = cur === "dark" ? "light" : cur === "light" ? "auto" : "dark";
      localStorage.setItem("qilin-pet-theme", next);
      setTheme(next);
      toast(`主题：${next === "auto" ? "跟随系统" : next === "dark" ? "暗色" : "亮色"}`);
    });
  }

  // ============ 数据模型 ============
  const emptyState = () => ({
    version: 2,
    owner: { name: "" },
    pets: [],
    entries: [],
    health: [],
    messages: [],
    candles: {}
  });
  let state = emptyState();
  let activePetId = null;
  let activeTab = "home";

  const load = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyState();
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 2) return parsed;
    } catch {}
    return emptyState();
  };
  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const pet = (id) => state.pets.find((p) => p.id === id);

  // ============ Tab 路由 ============
  const switchTab = (tab) => {
    activeTab = tab;
    $$(".pet-nav button").forEach((b) => b.classList.toggle("is-active", b.dataset.tab === tab));
    $$(".pet-view").forEach((v) => v.classList.toggle("is-active", v.dataset.view === tab));
    // 进入每个 tab 时刷新
    if (tab === "home") renderHome();
    if (tab === "pets") renderPetsManage();
    if (tab === "journal") renderJournal();
    if (tab === "gallery") renderGallery();
    if (tab === "timeline") renderTimeline();
    if (tab === "health") renderHealth();
    if (tab === "tribute") renderTribute();
    if (tab === "settings") renderSettings();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ============ Onboarding ============
  const renderOnboard = () => {
    const ob = $("#pet-onboard");
    if (state.pets.length === 0) {
      ob.hidden = false;
      $("#onboard-skip").onclick = () => {
        loadDemoData();
        save();
        ob.hidden = true;
        switchTab("home");
        toast("已加载示例数据，开始体验");
      };
      $("#onboard-form").onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const avatarFile = fd.get("avatar");
        let avatar = "";
        if (avatarFile && avatarFile.size) avatar = await fileToDataUrl(avatarFile);
        const newPet = {
          id: uid("pet"),
          name: fd.get("name").trim(),
          species: fd.get("species"),
          breed: (fd.get("breed") || "").trim(),
          sex: fd.get("sex"),
          birth: fd.get("birth"),
          avatar,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        state.pets.push(newPet);
        save();
        ob.hidden = true;
        switchTab("home");
        toast(`欢迎，${newPet.name}！`);
      };
    } else {
      ob.hidden = true;
    }
  };

  // ============ Demo 数据 ============
  const loadDemoData = () => {
    const now = Date.now();
    const cat = {
      id: "pet_demo_cat",
      name: "阿橘",
      species: "cat",
      breed: "中华田园橘猫",
      sex: "male",
      color: "橘白相间",
      birth: "2019-08-18",
      passed: "2023-03-07",
      source: "救助",
      microchip: "985112003487219",
      weight: 5.4,
      quote: "它是我在最难的时候遇见的一束光。",
      avatar: "",
      createdAt: now,
      updatedAt: now
    };
    const dog = {
      id: "pet_demo_dog",
      name: "团子",
      species: "dog",
      breed: "柯基",
      sex: "female",
      color: "黄白",
      birth: "2022-05-12",
      passed: "",
      source: "领养",
      weight: 11.2,
      quote: "每天回家第一个迎接我的人。",
      avatar: "",
      createdAt: now,
      updatedAt: now
    };
    state.pets.push(cat, dog);
    state.entries.push(
      {
        id: uid("ent"),
        petId: cat.id,
        date: "2019-09-02",
        type: "milestone",
        title: "第一次叫它「阿橘」",
        content: "室友嫌它太丑要送人，我把它留下了。第一次给它喂奶，它呼噜呼噜的。",
        mood: "happy",
        tags: ["第一次", "到家"],
        photos: [],
        createdAt: now - 86400000 * 1500
      },
      {
        id: uid("ent"),
        petId: cat.id,
        date: "2020-03-15",
        type: "first",
        title: "第一次生病",
        content: "凌晨三点打车去急诊。医药费是我当时两个月生活费。它活下来了。",
        mood: "clingy",
        tags: ["猫瘟", "急诊"],
        photos: [],
        createdAt: now - 86400000 * 1100
      },
      {
        id: uid("ent"),
        petId: cat.id,
        date: "2022-12-28",
        type: "tribute",
        title: "确诊慢性肾病三期",
        content: "医生说还能维持半年到一年。从此每天喂药、打皮下、补液。它最讨厌针头，但每次都忍着不动。",
        mood: "sick",
        tags: ["肾衰", "治疗"],
        photos: [],
        createdAt: now - 86400000 * 400
      },
      {
        id: uid("ent"),
        petId: dog.id,
        date: "2022-05-12",
        type: "milestone",
        title: "团子到家第一天",
        content: "在小区门口的草丛里发现的，谁家走丢的？在业主群里问了一圈没人认领。",
        mood: "happy",
        tags: ["领养"],
        photos: [],
        createdAt: now - 86400000 * 200
      },
      {
        id: uid("ent"),
        petId: dog.id,
        date: "2024-08-15",
        type: "diary",
        title: "第一次去海边",
        content: "团子第一次见到海，兴奋得原地转圈 20 圈才肯下水。追浪追到累瘫。",
        mood: "playful",
        tags: ["海边", "第一次"],
        photos: [],
        createdAt: now - 86400000 * 30
      }
    );
    state.health.push(
      { id: uid("hl"), petId: cat.id, type: "vaccine", name: "狂犬疫苗", date: "2020-01-15", nextDate: "2023-01-15", vet: "朝阳区宠物医院", notes: "" },
      { id: uid("hl"), petId: cat.id, type: "weight", name: "称重", date: "2021-08-15", weight: 5.4, notes: "" },
      { id: uid("hl"), petId: cat.id, type: "weight", name: "称重", date: "2022-09-10", weight: 4.8, notes: "" },
      { id: uid("hl"), petId: cat.id, type: "weight", name: "称重", date: "2023-02-15", weight: 3.9, notes: "开始消瘦" },
      { id: uid("hl"), petId: dog.id, type: "vaccine", name: "五联疫苗", date: "2022-06-15", nextDate: "2023-06-15", vet: "美联众合", notes: "" },
      { id: uid("hl"), petId: dog.id, type: "deworm", name: "体内驱虫", date: "2024-07-15", nextDate: "2025-01-15", vet: "", notes: "拜耳" }
    );
    state.messages.push(
      { id: uid("msg"), petId: cat.id, name: "阿桃家的", msg: "希望你在那边也能追蝴蝶。", ts: now - 86400000 * 3 },
      { id: uid("msg"), petId: cat.id, name: "匿名", msg: "我家的小橘也刚走，看到你写的哭了……", ts: now - 86400000 * 6 }
    );
    state.candles[cat.id] = 18;
  };

  // ============ Home ============
  const renderHome = () => {
    const greeting = (() => {
      const h = new Date().getHours();
      if (h < 6) return "夜深了";
      if (h < 12) return "早上好";
      if (h < 18) return "下午好";
      return "晚上好";
    })();
    $('[data-bind="greeting"]').textContent = `${greeting}，`;
    $('[data-bind="petCount"]').textContent = state.pets.length;

    // 统计
    const photoCount = state.entries.reduce((sum, e) => sum + (e.photos?.length || 0), 0);
    const vaccineCount = state.health.filter((h) => h.type === "vaccine").length;
    const eventCount = state.entries.filter((e) => ["first", "milestone", "tribute"].includes(e.type)).length;
    $$(".pet-stat-card").forEach((card) => {
      const k = card.dataset.stat;
      const n = card.querySelector(".pet-stat-card__num");
      if (k === "entries") n.textContent = state.entries.length;
      if (k === "photos") n.textContent = photoCount;
      if (k === "events") n.textContent = eventCount;
      if (k === "vaccines") n.textContent = vaccineCount;
    });

    // 宠物卡
    const grid = $("#pets-grid");
    grid.innerHTML = state.pets.length
      ? state.pets.map(petCard).join("")
      : `<div class="pet-empty"><p>🐾 还没有小毛孩<br /><small><a href="#" onclick="event.preventDefault();document.querySelector('[data-tab=pets]').click()">去添加第一只</a></small></p></div>`;
    bindPetCardActions(grid, false);

    // 最近日记
    const recent = state.entries
      .slice()
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
      .slice(0, 5);
    $("#recent-entries").innerHTML = recent.length
      ? recent.map(entryHTML).join("")
      : `<li class="pet-empty"><p>📝 还没有日记<br /><small><a href="#" onclick="event.preventDefault();document.querySelector('[data-tab=journal]').click()">写第一条</a></small></p></li>`;
    bindEntryActions($("#recent-entries"));

    // 即将到来的纪念日
    const upcoming = upcomingEvents();
    $("#upcoming-list").innerHTML = upcoming.length
      ? upcoming
          .map(
            (u) =>
              `<li><strong>${esc(u.name)}</strong> · ${esc(u.label)} · <span style="color:var(--accent-2)">还有 ${u.days} 天</span></li>`
          )
          .join("")
      : `<li class="pet-empty"><p>🎂 还没有即将到来的纪念日<br /><small>填了生日就会自动算</small></p></li>`;
  };

  const upcomingEvents = () => {
    const list = [];
    state.pets.forEach((p) => {
      if (!p.birth) return;
      const md = p.birth.slice(5);
      const label = `${new Date(p.birth).getFullYear()} 年生日`;
      list.push({ name: p.name, label, days: daysUntilNext(md) });
      // Gotcha Day 估计 = 创建日期
      if (p.createdAt) {
        const d = new Date(p.createdAt);
        list.push({ name: p.name, label: `到家周年`, days: daysUntilNext(`${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`) });
      }
    });
    return list.sort((a, b) => a.days - b.days).slice(0, 5);
  };

  const petCard = (p) => {
    const emoji = { cat: "🐱", dog: "🐶", rabbit: "🐰", bird: "🦜", reptile: "🦎", fish: "🐟", rodent: "🐹", other: "🐾" }[p.species] || "🐾";
    const avatar = p.avatar ? `style="background-image:url('${esc(p.avatar)}')"` : "";
    const years = p.passed ? `${p.birth.slice(0, 4)} — ${p.passed.slice(0, 4)}` : `生于 ${p.birth.slice(0, 4)}`;
    return `
    <article class="pet-pet-card" data-pet="${esc(p.id)}">
      <div class="pet-pet-card__hero" ${avatar}>${p.avatar ? "" : emoji}</div>
      <div class="pet-pet-card__body">
        <h3 class="pet-pet-card__name">${esc(p.name)} ${emoji}</h3>
        <div class="pet-pet-card__years">${esc(years)}</div>
        <div class="pet-pet-card__meta">${esc(p.breed || p.species)}${p.color ? " · " + esc(p.color) : ""}</div>
        ${p.quote ? `<p class="pet-pet-card__quote">"${esc(p.quote)}"</p>` : ""}
      </div>
      <div class="pet-pet-card__actions">
        <button class="pet-btn pet-btn--small" data-act="edit">编辑</button>
        <button class="pet-btn pet-btn--small" data-act="delete">删除</button>
      </div>
      ${p.passed ? `<span class="pet-pet-card__passed">✦ 已离世</span>` : ""}
    </article>`;
  };

  const bindPetCardActions = (root, manageMode = true) => {
    $$(".pet-pet-card", root).forEach((card) => {
      const id = card.dataset.pet;
      const editBtn = $('[data-act="edit"]', card);
      const delBtn = $('[data-act="delete"]', card);
      if (editBtn) editBtn.onclick = () => openPetModal(id);
      if (delBtn)
        delBtn.onclick = () => {
          if (confirm(`确认删除 "${pet(id).name}"？相关日记和健康记录也会被清除。`)) {
            state.pets = state.pets.filter((p) => p.id !== id);
            state.entries = state.entries.filter((e) => e.petId !== id);
            state.health = state.health.filter((h) => h.petId !== id);
            state.messages = state.messages.filter((m) => m.petId !== id);
            delete state.candles[id];
            save();
            renderHome();
            if (manageMode) renderPetsManage();
            toast("已删除");
          }
        };
    });
  };

  // ============ Pets (档案管理) ============
  const renderPetsManage = () => {
    const grid = $("#pets-grid-manage");
    grid.innerHTML = state.pets.length
      ? state.pets.map(petCard).join("")
      : `<div class="pet-empty"><p>🐾 还没有小毛孩<br /><small>点击右上方添加</small></p></div>`;
    bindPetCardActions(grid, true);
    bindPetForm();
  };

  const openPetModal = (id) => {
    const modal = $("#pet-modal");
    const form = $("#pet-form");
    const isEdit = !!id;
    $("#pet-modal-title").textContent = isEdit ? "编辑宠物档案" : "添加新宠物";
    modal.hidden = false;
    if (isEdit) {
      const p = pet(id);
      form.id.value = p.id;
      form.name.value = p.name || "";
      form.species.value = p.species || "cat";
      form.breed.value = p.breed || "";
      form.sex.value = p.sex || "";
      form.color.value = p.color || "";
      form.birth.value = p.birth || "";
      form.passed.value = p.passed || "";
      form.source.value = p.source || "";
      form.microchip.value = p.microchip || "";
      form.weight.value = p.weight || "";
      form.quote.value = p.quote || "";
    } else {
      form.reset();
      form.id.value = "";
    }
  };

  const bindPetForm = () => {
    $("#btn-add-pet").onclick = () => openPetModal(null);
    const modal = $("#pet-modal");
    $$('[data-close]', modal).forEach((b) => (b.onclick = () => (modal.hidden = true)));
    $("#pet-form").onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const id = fd.get("id");
      const avatarFile = fd.get("avatar");
      let avatar = "";
      if (avatarFile && avatarFile.size) avatar = await fileToDataUrl(avatarFile);
      const data = {
        name: fd.get("name").trim(),
        species: fd.get("species"),
        breed: fd.get("breed").trim(),
        sex: fd.get("sex"),
        color: fd.get("color").trim(),
        birth: fd.get("birth"),
        passed: fd.get("passed") || "",
        source: fd.get("source"),
        microchip: fd.get("microchip").trim(),
        weight: fd.get("weight") ? parseFloat(fd.get("weight")) : null,
        quote: fd.get("quote").trim(),
        updatedAt: Date.now()
      };
      if (id) {
        const p = pet(id);
        Object.assign(p, data);
        if (avatar) p.avatar = avatar;
      } else {
        state.pets.push({ id: uid("pet"), avatar, createdAt: Date.now(), ...data });
      }
      save();
      modal.hidden = true;
      renderPetsManage();
      renderHome();
      toast(id ? "已更新" : "已添加");
    };
  };

  // ============ Journal ============
  const renderJournal = () => {
    populatePetSelect("#journal-pet-filter", true);
    populatePetSelect("#entry-form select[name=petId]", false);
    populatePetSelect("#journal-pet-filter", true, (id) => {
      activePetId = id || null;
      renderEntryList();
    });
    $("#btn-add-entry").onclick = () => openEntryModal(null);

    // 心情板
    $$("#mood-pad button").forEach((btn) => {
      btn.onclick = async () => {
        const today = new Date().toISOString().slice(0, 10);
        const petId = $("#journal-pet-filter").value || (state.pets[0]?.id ?? null);
        if (!petId) return toast("请先添加一只宠物");
        const mood = btn.dataset.mood;
        const moodText = btn.textContent;
        state.entries.push({
          id: uid("ent"),
          petId,
          date: today,
          type: "diary",
          title: `今天心情 · ${moodText}`,
          content: "",
          mood,
          tags: ["心情"],
          photos: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        save();
        renderEntryList();
        toast(`${moodText} 已记录`);
      };
    });

    renderEntryList();
  };

  const renderEntryList = () => {
    const list = $("#entry-list");
    let entries = state.entries.slice();
    if (activePetId) entries = entries.filter((e) => e.petId === activePetId);
    entries.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    list.innerHTML = entries.length
      ? entries.map(entryHTML).join("")
      : `<li class="pet-empty"><p>📝 还没有日记<br /><small>点击心情按钮快速打卡，或 + 写新日记</small></p></li>`;
    bindEntryActions(list);
  };

  const entryHTML = (e) => {
    const p = pet(e.petId);
    const moodMap = { happy: "😺", sleepy: "😴", playful: "🐾", clingy: "🧡", grumpy: "😾", sick: "🤒" };
    const moodIcon = moodMap[e.mood] || "";
    const tags = (e.tags || []).map((t) => `<span>#${esc(t)}</span>`).join("");
    const photos = (e.photos || [])
      .map((url, i) => `<img src="${esc(url)}" alt="" data-photo="${i}" data-entry="${esc(e.id)}" loading="lazy" />`)
      .join("");
    return `
    <li class="pet-entry" data-entry="${esc(e.id)}">
      <div class="pet-entry__head">
        <span class="pet-entry__date">${esc(fmtDate(e.date))}</span>
        <span class="pet-entry__type pet-entry__type--${esc(e.type)}">${esc(typeText(e.type))}</span>
        ${p ? `<span style="font-size:13px;color:var(--muted)">${esc(p.name)}</span>` : ""}
        ${moodIcon ? `<span class="pet-entry__mood">${moodIcon}</span>` : ""}
      </div>
      ${e.title ? `<h3 class="pet-entry__title">${esc(e.title)}</h3>` : ""}
      ${e.content ? `<p class="pet-entry__content">${esc(e.content)}</p>` : ""}
      ${photos ? `<div class="pet-entry__photos">${photos}</div>` : ""}
      ${tags ? `<div class="pet-entry__tags">${tags}</div>` : ""}
      <div class="pet-entry__actions">
        <button class="pet-btn pet-btn--small" data-act="edit">编辑</button>
        <button class="pet-btn pet-btn--small" data-act="delete">删除</button>
      </div>
    </li>`;
  };

  const bindEntryActions = (root) => {
    $$('.pet-entry', root).forEach((card) => {
      const id = card.dataset.entry;
      $('[data-act="edit"]', card).onclick = () => openEntryModal(id);
      $('[data-act="delete"]', card).onclick = () => {
        if (confirm("确认删除这条日记？")) {
          state.entries = state.entries.filter((e) => e.id !== id);
          save();
          renderEntryList();
          renderHome();
          toast("已删除");
        }
      };
      $$('img[data-photo]', card).forEach((img) => {
        img.onclick = () => openLightbox(state.entries.find((e) => e.id === id)?.photos || [], parseInt(img.dataset.photo, 10), "");
      });
    });
  };

  const typeText = (t) => ({ diary: "日常", first: "第一次", milestone: "里程碑", funny: "趣事", tribute: "追思" }[t] || t);

  const openEntryModal = (id) => {
    const modal = $("#entry-modal");
    modal.hidden = false;
    const form = $("#entry-form");
    populatePetSelect("select[name=petId]", false);
    if (id) {
      const e = state.entries.find((x) => x.id === id);
      form.id.value = e.id;
      form.petId.value = e.petId;
      form.date.value = e.date;
      form.type.value = e.type;
      form.title.value = e.title || "";
      form.content.value = e.content || "";
      form.tags.value = (e.tags || []).join(", ");
    } else {
      form.reset();
      form.id.value = "";
      form.date.value = today();
    }
    $$('[data-close]', modal).forEach((b) => (b.onclick = () => (modal.hidden = true)));
  };

  $("#entry-form").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const id = fd.get("id");
    const photoFiles = fd.getAll("photos");
    const photos = [];
    for (const f of photoFiles) {
      if (f && f.size) photos.push(await fileToDataUrl(f));
    }
    const data = {
      petId: fd.get("petId"),
      date: fd.get("date"),
      type: fd.get("type"),
      title: fd.get("title").trim(),
      content: fd.get("content").trim(),
      tags: fd.get("tags")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      updatedAt: Date.now()
    };
    if (id) {
      const e = state.entries.find((x) => x.id === id);
      Object.assign(e, data);
      if (photos.length) e.photos = [...(e.photos || []), ...photos];
    } else {
      state.entries.push({ id: uid("ent"), mood: "", photos, createdAt: Date.now(), ...data });
    }
    save();
    $("#entry-modal").hidden = true;
    renderEntryList();
    renderHome();
    toast(id ? "已更新" : "已添加");
  };

  // ============ Gallery ============
  const renderGallery = () => {
    populatePetSelect("#gallery-pet-filter", true, (id) => {
      activePetId = id || null;
      renderGalleryGrid();
    });
    $("#gallery-sort").onchange = renderGalleryGrid;
    renderGalleryGrid();
  };

  const renderGalleryGrid = () => {
    const grid = $("#gallery-grid");
    let photos = [];
    state.entries.forEach((e) => {
      if (activePetId && e.petId !== activePetId) return;
      (e.photos || []).forEach((url) => photos.push({ url, entry: e }));
    });
    const sort = $("#gallery-sort").value;
    if (sort === "newest") photos.sort((a, b) => (b.entry.date || "").localeCompare(a.entry.date || ""));
    if (sort === "oldest") photos.sort((a, b) => (a.entry.date || "").localeCompare(b.entry.date || ""));
    if (sort === "random") photos.sort(() => Math.random() - 0.5);
    grid.innerHTML = photos.length
      ? photos.map((p) => `<figure><img src="${esc(p.url)}" alt="" loading="lazy" /></figure>`).join("")
      : "";
    $("#gallery-empty").hidden = photos.length > 0;
    $$("#gallery-grid img").forEach((img, i) => {
      img.onclick = () => openLightbox(photos.map((p) => p.url), i, "");
    });
  };

  // ============ Timeline ============
  const renderTimeline = () => {
    populatePetSelect("#timeline-pet-filter", true, (id) => {
      activePetId = id || null;
      renderTimelineList();
    });
    renderTimelineList();
  };

  const renderTimelineList = () => {
    let events = state.entries.filter((e) => ["first", "milestone", "tribute", "funny"].includes(e.type));
    if (activePetId) events = events.filter((e) => e.petId === activePetId);
    events.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    const list = $("#timeline-list");
    list.innerHTML = events.length
      ? events
          .map((e) => {
            const p = pet(e.petId);
            const endClass = e.type === "tribute" ? " is-end" : "";
            return `<li class="${endClass}">
              <div class="pet-timeline__date">${esc(fmtDate(e.date))} · ${esc(p?.name || "—")}</div>
              <div class="pet-timeline__title">${esc(e.title || typeText(e.type))}</div>
              <div class="pet-timeline__meta">${esc(typeText(e.type))}</div>
            </li>`;
          })
          .join("")
      : `<li class="pet-empty"><p>⏳ 还没有里程碑<br /><small>写日记时选"第一次"或"里程碑"类型就会自动汇总到这里</small></p></li>`;
  };

  // ============ Health ============
  const renderHealth = () => {
    populatePetSelect("#health-pet-filter", true, (id) => {
      activePetId = id || null;
      renderHealthList();
      renderWeightChart();
    });
    $("#btn-add-health").onclick = () => openHealthModal(null);
    renderHealthList();
    renderWeightChart();
  };

  const renderHealthList = () => {
    let records = state.health.slice();
    if (activePetId) records = records.filter((h) => h.petId === activePetId);
    records.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    const iconMap = { vaccine: "💉", deworm: "💊", checkup: "🩺", medication: "💊", condition: "🤒", weight: "⚖️" };
    $("#health-list").innerHTML = records.length
      ? records
          .map((h) => {
            const p = pet(h.petId);
            const next = h.nextDate ? `<span class="next">下次 ${fmtDate(h.nextDate)}</span>` : "";
            const w = h.weight ? ` · ${h.weight}kg` : "";
            return `<li data-hl="${esc(h.id)}">
              <span class="icon">${iconMap[h.type] || "📌"}</span>
              <span>
                <span class="name">${esc(h.name)}${w}</span>
                ${p ? `<span style="color:var(--muted);font-size:12px"> · ${esc(p.name)}</span>` : ""}
                ${h.vet ? `<span style="color:var(--muted);font-size:12px"> · ${esc(h.vet)}</span>` : ""}
              </span>
              <span>
                <span class="date">${esc(fmtDate(h.date))}</span>
                ${next}
                <button class="pet-btn pet-btn--small" data-act="edit">编辑</button>
                <button class="pet-btn pet-btn--small" data-act="delete">删除</button>
              </span>
            </li>`;
          })
          .join("")
      : `<li class="pet-empty"><p>💉 还没有健康记录<br /><small>点 + 添加疫苗、驱虫、体检、用药等</small></p></li>`;
    $$("#health-list li[data-hl]").forEach((li) => {
      const id = li.dataset.hl;
      $('[data-act="edit"]', li).onclick = () => openHealthModal(id);
      $('[data-act="delete"]', li).onclick = () => {
        if (confirm("确认删除这条健康记录？")) {
          state.health = state.health.filter((h) => h.id !== id);
          save();
          renderHealthList();
          renderWeightChart();
          renderHome();
          toast("已删除");
        }
      };
    });
  };

  const renderWeightChart = () => {
    const host = $("#weight-chart");
    let records = state.health.filter((h) => h.type === "weight" && h.weight);
    if (activePetId) records = records.filter((h) => h.petId === activePetId);
    records.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    if (records.length < 2) {
      host.innerHTML = records.length
        ? `<p style="color:var(--muted);font-size:13px">只有 1 次记录，再记几次就能看到曲线了 📈</p>`
        : `<p style="color:var(--muted);font-size:13px">添加 type="称重" 的健康记录就会自动生成曲线</p>`;
      return;
    }
    const W = 600, H = 220, pad = { l: 40, r: 20, t: 20, b: 30 };
    const ws = records.map((r) => r.weight);
    const min = Math.min(...ws), max = Math.max(...ws);
    const xs = records.map((_, i) => pad.l + (i * (W - pad.l - pad.r)) / Math.max(1, records.length - 1));
    const ys = records.map((w) => {
      const range = max - min || 1;
      return H - pad.b - ((w - min) / range) * (H - pad.t - pad.b);
    });
    const path = xs.map((x, i) => `${i ? "L" : "M"}${x},${ys[i]}`).join(" ");
    const area = `${path} L${xs[xs.length - 1]},${H - pad.b} L${xs[0]},${H - pad.b} Z`;
    host.innerHTML = `<svg viewBox="0 0 ${W} ${H}">
      <line x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${H - pad.b}" stroke="var(--line)" />
      <line x1="${pad.l}" y1="${H - pad.b}" x2="${W - pad.r}" y2="${H - pad.b}" stroke="var(--line)" />
      <path d="${area}" fill="var(--accent-soft)" />
      <path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2" />
      ${xs.map((x, i) => `<circle cx="${x}" cy="${ys[i]}" r="4" fill="var(--accent-2)" stroke="var(--bg)" stroke-width="2" />`).join("")}
      <text x="${pad.l - 6}" y="${pad.t + 4}" font-size="10" fill="var(--muted)" text-anchor="end">${max}kg</text>
      <text x="${pad.l - 6}" y="${H - pad.b}" font-size="10" fill="var(--muted)" text-anchor="end">${min}kg</text>
    </svg>`;
  };

  const openHealthModal = (id) => {
    const modal = $("#health-modal");
    modal.hidden = false;
    const form = $("#health-form");
    populatePetSelect("select[name=petId]", false);
    if (id) {
      const h = state.health.find((x) => x.id === id);
      form.id.value = h.id;
      form.petId.value = h.petId;
      form.type.value = h.type;
      form.date.value = h.date;
      form.name.value = h.name;
      form.nextDate.value = h.nextDate || "";
      form.vet.value = h.vet || "";
      form.notes.value = h.notes || "";
    } else {
      form.reset();
      form.id.value = "";
      form.date.value = today();
    }
    $$('[data-close]', modal).forEach((b) => (b.onclick = () => (modal.hidden = true)));
  };

  $("#health-form").onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const id = fd.get("id");
    const data = {
      petId: fd.get("petId"),
      type: fd.get("type"),
      date: fd.get("date"),
      name: fd.get("name").trim(),
      nextDate: fd.get("nextDate") || "",
      vet: fd.get("vet").trim(),
      notes: fd.get("notes").trim(),
      weight: fd.get("type") === "weight" ? parseFloat(fd.get("name").match(/[\d.]+/)?.[0] || "") : null,
      updatedAt: Date.now()
    };
    if (id) {
      const h = state.health.find((x) => x.id === id);
      Object.assign(h, data);
    } else {
      state.health.push({ id: uid("hl"), createdAt: Date.now(), ...data });
    }
    save();
    $("#health-modal").hidden = true;
    renderHealthList();
    renderWeightChart();
    renderHome();
    toast(id ? "已更新" : "已添加");
  };

  // ============ Tribute ============
  const renderTribute = () => {
    populatePetSelect("#tribute-pet-filter", true, (id) => {
      activePetId = id || null;
      updateTributeStage();
    });
    updateTributeStage();
  };

  const updateTributeStage = () => {
    const stage = $("#tribute-stage");
    const empty = $("#tribute-empty");
    const p = pet(activePetId);
    if (p && p.passed) {
      stage.hidden = false;
      empty.hidden = true;
      $("#tribute-counter").textContent = state.candles[p.id] || 0;
      $("#tribute-light-btn").onclick = () => {
        state.candles[p.id] = (state.candles[p.id] || 0) + 1;
        save();
        $("#tribute-counter").textContent = state.candles[p.id];
        toast(`🕯️ 为 ${p.name} 点了一根蜡烛`);
      };
      $("#tribute-letter").value = state.messages.find((m) => m.petId === p.id && m._letter)?.msg || "";
      $("#tribute-letter-save").onclick = () => {
        const text = $("#tribute-letter").value.trim();
        let m = state.messages.find((x) => x.petId === p.id && x._letter);
        if (m) m.msg = text;
        else state.messages.push({ id: uid("msg"), petId: p.id, name: "_letter", msg: text, ts: Date.now(), _letter: true });
        save();
        toast("已保存");
      };
    } else {
      stage.hidden = true;
      empty.hidden = false;
    }
    renderTributeWall();
  };

  const renderTributeWall = () => {
    const wall = $("#tribute-wall");
    let msgs = state.messages.filter((m) => !m._letter);
    if (activePetId) msgs = msgs.filter((m) => m.petId === activePetId);
    msgs.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    wall.innerHTML = msgs.length
      ? msgs
          .map(
            (m) =>
              `<li>${esc(m.msg)}<small>—— ${esc(m.name || "匿名")} · ${fmt(m.ts)}</small></li>`
          )
          .join("")
      : `<li style="border-left-color:var(--line);background:transparent;color:var(--muted)">还没有留言 · 写下第一句吧</li>`;
  };

  $("#tribute-msg-form").onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const name = fd.get("name").toString().trim();
    const msg = fd.get("msg").toString().trim();
    if (!msg) return;
    if (!activePetId) return toast("请先选择一只宠物");
    state.messages.push({ id: uid("msg"), petId: activePetId, name: name || "匿名", msg, ts: Date.now() });
    save();
    e.target.reset();
    renderTributeWall();
    toast("已留言");
  };

  // ============ Settings ============
  const renderSettings = () => {
    $("#btn-export").onclick = () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `pet-${today()}.json`;
      a.click();
      toast("已导出 JSON");
    };
    $("#btn-import").onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const data = JSON.parse(r.result);
          if (data.version !== 2) throw new Error("版本不兼容");
          if (confirm("导入会覆盖当前数据，确认？")) {
            state = data;
            save();
            renderHome();
            toast("已导入");
          }
        } catch (err) {
          alert("导入失败：" + err.message);
        }
      };
      r.readAsText(file);
    };
    $("#btn-print").onclick = () => window.print();
    $("#btn-share").onclick = () => {
      const compact = JSON.stringify(state).replace(/\s+/g, "");
      const url = `${location.origin}${location.pathname}#data=${encodeURIComponent(compact)}`;
      const ta = $("#share-link");
      ta.value = url;
      ta.hidden = false;
      ta.select();
      toast("已生成分享链接（复制即可）");
    };
    $("#btn-clear").onclick = () => {
      if (confirm("这会清空所有宠物、日记、健康数据，确认？")) {
        state = emptyState();
        save();
        location.reload();
      }
    };
    $$(".pet-theme-pick button").forEach((b) => {
      b.onclick = () => {
        $$(".pet-theme-pick button").forEach((x) => x.classList.toggle("is-active", x === b));
        localStorage.setItem("qilin-pet-theme", b.dataset.themePick);
        setTheme(b.dataset.themePick);
        toast(`主题：${b.textContent}`);
      };
      const cur = localStorage.getItem("qilin-pet-theme") || "auto";
      b.classList.toggle("is-active", b.dataset.themePick === cur);
    });
  };

  // ============ 公共：宠物下拉 ============
  const populatePetSelect = (sel, includeAll, onChange) => {
    const el = $(sel);
    if (!el) return;
    if (includeAll) {
      el.innerHTML = `<option value="">全部宠物</option>` + state.pets.map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join("");
    } else {
      el.innerHTML = state.pets.map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join("");
    }
    el.value = activePetId || (includeAll ? "" : state.pets[0]?.id || "");
    if (onChange) el.onchange = () => onChange(el.value);
  };

  // ============ 图片处理 ============
  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });

  // ============ Lightbox ============
  let lbPhotos = [], lbIdx = 0;
  const openLightbox = (photos, idx, caption) => {
    lbPhotos = photos;
    lbIdx = idx || 0;
    const lb = $("#pet-lightbox");
    const img = $("img", lb);
    const cap = $("figcaption", lb);
    img.src = lbPhotos[lbIdx];
    cap.textContent = caption || `${lbIdx + 1} / ${lbPhotos.length}`;
    lb.classList.add("is-open");
  };
  $("#pet-lightbox__close")?.remove?.();
  const lb = $("#pet-lightbox");
  $(".pet-lightbox__close", lb).onclick = () => lb.classList.remove("is-open");
  $(".pet-lightbox__prev", lb).onclick = () => {
    lbIdx = (lbIdx - 1 + lbPhotos.length) % lbPhotos.length;
    $("img", lb).src = lbPhotos[lbIdx];
    $("figcaption", lb).textContent = `${lbIdx + 1} / ${lbPhotos.length}`;
  };
  $(".pet-lightbox__next", lb).onclick = () => {
    lbIdx = (lbIdx + 1) % lbPhotos.length;
    $("img", lb).src = lbPhotos[lbIdx];
    $("figcaption", lb).textContent = `${lbIdx + 1} / ${lbPhotos.length}`;
  };
  lb.onclick = (e) => {
    if (e.target === lb) lb.classList.remove("is-open");
  };
  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("is-open")) return;
    if (e.key === "Escape") lb.classList.remove("is-open");
    if (e.key === "ArrowLeft") $(".pet-lightbox__prev", lb).click();
    if (e.key === "ArrowRight") $(".pet-lightbox__next", lb).click();
  });

  // ============ Tab 绑定 ============
  $$(".pet-nav button").forEach((btn) => {
    btn.onclick = () => switchTab(btn.dataset.tab);
  });

  // ============ 移动端导航折叠 ============
  $(".nav-toggle")?.addEventListener?.("click", () => {
    $("#primary-nav").classList.toggle("is-open");
  });

  // ============ 启动 ============
  state = load();
  activePetId = state.pets[0]?.id || null;
  renderOnboard();
  if (state.pets.length) switchTab("home");
})();