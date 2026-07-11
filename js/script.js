/* =========================================================
   ContactHub — state, storage, and helpers
========================================================= */

const STORAGE_KEY = "contacts";

let contacts = []; // in-memory list, mirrored to localStorage
let editingId = null; // id of contact currently being edited (null = adding new)
let currentAvatar = ""; // base64 data-url of the avatar being staged in the modal

const NAME_RE = /^[a-zA-Z\u0600-\u06FF\s]{2,50}$/;
const PHONE_RE = /^(\+20|0020|20)?0?1[0125][0-9]{8}$/; // Egyptian mobile numbers
const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

const GROUP_STYLES = {
  family: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  friends: {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-200",
  },
  work: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  school: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  other: {
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-200",
  },
};

const AVATAR_GRADIENTS = [
  "from-blue-500 to-blue-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-blue-600",
  "from-indigo-500 to-violet-600",
  "from-fuchsia-500 to-pink-600",
];

function generateId() {
  return `contact_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
}

function loadContacts() {
  const raw = localStorage.getItem(STORAGE_KEY);
  try {
    contacts = raw ? JSON.parse(raw) : [];
  } catch {
    contacts = [];
  }
}

function saveContacts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
}

/* =========================================================
   CRUD operations
========================================================= */

function addContact(data) {
  const contact = {
    id: generateId(),
    name: data.name,
    phone: data.phone,
    email: data.email || "",
    address: data.address || "",
    notes: data.notes || "",
    group: data.group || "",
    avatar: data.avatar || "",
    isFavorite: data.isFavorite || false,
    isEmergency: data.isEmergency || false,
    createdAt: new Date().toISOString(),
  };
  contacts.push(contact);
  saveContacts();
  return contact;
}

function updateContact(id, data) {
  const contact = contacts.find((c) => c.id === id);
  if (!contact) return null;
  contact.name = data.name;
  contact.phone = data.phone;
  contact.email = data.email || "";
  contact.address = data.address || "";
  contact.notes = data.notes || "";
  contact.group = data.group || "";
  contact.avatar = data.avatar || "";
  contact.isFavorite = data.isFavorite || false;
  contact.isEmergency = data.isEmergency || false;
  saveContacts();
  return contact;
}

function deleteContact(id) {
  contacts = contacts.filter((c) => c.id !== id);
  saveContacts();
}

function getContactById(id) {
  return contacts.find((c) => c.id === id) || null;
}

function searchContacts(term) {
  if (!term) return contacts;
  const t = term.toLowerCase();
  return contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(t) ||
      c.phone.includes(term) ||
      c.email.toLowerCase().includes(t),
  );
}

function getFavorites() {
  return contacts.filter((c) => c.isFavorite);
}

function getEmergencyContacts() {
  return contacts.filter((c) => c.isEmergency);
}

/* =========================================================
   Rendering helpers
========================================================= */

function renderAvatar(contact, size) {
  const dims = size === "large" ? "w-14 h-14 text-lg" : "w-10 h-10 text-sm";
  const radius = size === "large" ? "rounded-xl" : "rounded-lg";

  if (contact.avatar) {
    return `<img src="${contact.avatar}" alt="${contact.name}" class="${dims} ${radius} object-cover" />`;
  }

  const initials = getInitials(contact.name);
  const gradient =
    AVATAR_GRADIENTS[contact.name.length % AVATAR_GRADIENTS.length];
  return `<div class="${dims} ${radius} bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-semibold shadow-sm">${initials}</div>`;
}

function groupStyle(group) {
  return GROUP_STYLES[(group || "").toLowerCase()] || GROUP_STYLES.other;
}

function renderContactCard(contact) {
  const favIcon = contact.isFavorite
    ? '<i class="fa-solid fa-star text-amber-400"></i>'
    : '<i class="fa-regular fa-star"></i>';
  const favClasses = contact.isFavorite
    ? "text-amber-400 bg-amber-50 hover:bg-amber-100"
    : "text-gray-400 bg-gray-50 hover:bg-gray-100 hover:text-amber-400";

  const emgIcon = contact.isEmergency
    ? '<i class="fa-solid fa-heart-pulse text-rose-500"></i>'
    : '<i class="fa-regular fa-heart"></i>';
  const emgClasses = contact.isEmergency
    ? "text-rose-500 bg-rose-50 hover:bg-rose-100"
    : "text-gray-400 bg-gray-50 hover:bg-gray-100 hover:text-rose-500";

  const emgBadge = contact.isEmergency
    ? `<span class="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 text-rose-600 text-[11px] font-medium rounded-md"><i class="fa-solid fa-heart-pulse text-[10px]"></i>Emergency</span>`
    : "";

  const gs = groupStyle(contact.group);
  const groupBadge = contact.group
    ? `<span class="inline-flex items-center px-2 py-1 ${gs.bg} ${gs.text} text-[11px] font-medium rounded-md capitalize">${contact.group}</span>`
    : "";

  const cornerEmergency = contact.isEmergency
    ? `<div class="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center ring-2 ring-white">
         <i class="fa-solid fa-heart-pulse text-white text-[8px]"></i>
       </div>`
    : "";
  const cornerFavorite = contact.isFavorite
    ? `<div class="absolute -top-0.5 -right-0.5 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center ring-2 ring-white">
         <i class="fa-solid fa-star text-white text-[8px]"></i>
       </div>`
    : "";

  const emailRow = contact.email
    ? `<div class="flex items-center gap-2.5">
         <div class="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
           <i class="fa-solid fa-envelope text-violet-600 text-[10px]"></i>
         </div>
         <span class="text-gray-600 text-sm truncate">${contact.email}</span>
       </div>`
    : "";

  const addressRow = contact.address
    ? `<div class="flex items-center gap-2.5">
         <div class="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
           <i class="fa-solid fa-location-dot text-emerald-600 text-[10px]"></i>
         </div>
         <span class="text-gray-600 text-sm truncate">${contact.address}</span>
       </div>`
    : "";

  const badgeRow =
    groupBadge || emgBadge
      ? `<div class="flex flex-wrap gap-1.5 mt-3">${groupBadge}${emgBadge}</div>`
      : "";

  const emailBtn = contact.email
    ? `<button onclick="emailContact('${contact.email}')" class="w-9 h-9 rounded-lg transition-all flex items-center justify-center cursor-pointer text-violet-600 bg-violet-50 hover:bg-violet-100" title="Email">
         <i class="fa-solid fa-envelope text-sm"></i>
       </button>`
    : "";

  return `
    <div class="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-200 overflow-hidden h-full flex flex-col">
      <div class="p-4 pb-3 flex-1">
        <div class="flex items-start gap-3.5">
          <div class="relative shrink-0">
            ${renderAvatar(contact, "large")}
            ${cornerEmergency}
            ${cornerFavorite}
          </div>
          <div class="flex-1 min-w-0 pt-1">
            <h3 class="font-semibold text-gray-900 text-base truncate">${contact.name}</h3>
            <div class="flex items-center gap-2 mt-1">
              <div class="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center shrink-0">
                <i class="fa-solid fa-phone text-blue-600 text-[9px]"></i>
              </div>
              <span class="text-gray-500 text-sm truncate">${contact.phone}</span>
            </div>
          </div>
        </div>

        <div class="mt-3 space-y-2">
          ${emailRow}
          ${addressRow}
        </div>

        ${badgeRow}
      </div>

      <div class="border-t border-gray-100 bg-gray-50/80 px-4 py-2.5 flex items-center justify-between mt-auto">
        <div class="flex items-center gap-1.5">
          <a href="tel:${contact.phone}" class="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all flex items-center justify-center cursor-pointer" title="Call">
            <i class="fa-solid fa-phone text-sm"></i>
          </a>
          ${emailBtn}
        </div>
        <div class="flex items-center gap-1.5">
          <button onclick="toggleFavorite('${contact.id}')" class="w-9 h-9 ${favClasses} rounded-lg transition-all flex items-center justify-center cursor-pointer" title="Favorite">
            ${favIcon}
          </button>
          <button onclick="toggleEmergency('${contact.id}')" class="w-9 h-9 ${emgClasses} rounded-lg transition-all flex items-center justify-center cursor-pointer" title="Emergency">
            ${emgIcon}
          </button>
          <button onclick="editContactHandler('${contact.id}')" class="w-9 h-9 bg-gray-50 text-gray-500 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center justify-center cursor-pointer" title="Edit">
            <i class="fa-solid fa-pen text-sm"></i>
          </button>
          <button onclick="deleteContactHandler('${contact.id}')" class="w-9 h-9 bg-gray-50 text-gray-500 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center justify-center cursor-pointer" title="Delete">
            <i class="fa-solid fa-trash text-sm"></i>
          </button>
        </div>
      </div>
    </div>`;
}

function renderContactsGrid(list) {
  const container = document.querySelector("#contacts-grid .grid");
  if (!container) return;

  if (!list || list.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-20">
        <div class="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
          <i class="fa-solid fa-address-book text-3xl text-gray-300"></i>
        </div>
        <p class="text-gray-500 font-medium">No contacts found</p>
        <p class="text-gray-400 text-sm mt-1">Click "Add Contact" to get started</p>
      </div>`;
    return;
  }

  container.innerHTML = list.map(renderContactCard).join("");
}

function renderMiniRow(contact, accent) {
  // accent: 'amber' (favorites) or 'rose' (emergency)
  const callBg = accent === "amber" ? "emerald" : "rose";
  return `
    <div class="flex items-center gap-3 p-2.5 bg-gray-50 hover:bg-${accent}-50 rounded-xl transition-all cursor-pointer group">
      <div class="shrink-0">${renderAvatar(contact, "small")}</div>
      <div class="flex-1 min-w-0">
        <h4 class="font-medium text-gray-900 text-sm truncate">${contact.name}</h4>
        <p class="text-xs text-gray-500 truncate">${contact.phone}</p>
      </div>
      <a href="tel:${contact.phone}" class="shrink-0 w-8 h-8 bg-${callBg}-100 group-hover:bg-${callBg}-500 text-${callBg}-600 group-hover:text-white rounded-lg transition-all flex items-center justify-center cursor-pointer">
        <i class="fa-solid fa-phone text-xs"></i>
      </a>
    </div>`;
}

function renderMiniCard(contact, accent) {
  const callBg = accent === "amber" ? "emerald" : "rose";
  return `
    <a href="tel:${contact.phone}" class="flex items-center gap-2 p-2 bg-white border border-gray-100 hover:border-${accent}-200 hover:bg-${accent}-50 rounded-xl transition-all cursor-pointer">
      <div class="w-9 h-9 shrink-0">${renderAvatar(contact, "small")}</div>
      <div class="min-w-0 flex-1">
        <h4 class="font-medium text-gray-900 text-[11px] truncate leading-tight">${contact.name}</h4>
        <p class="text-[10px] text-gray-400 truncate">${contact.phone}</p>
      </div>
      <div class="w-6 h-6 bg-${callBg}-100 text-${callBg}-600 rounded-md flex items-center justify-center shrink-0">
        <i class="fa-solid fa-phone text-[8px]"></i>
      </div>
    </a>`;
}

function renderFavoritesSidebar() {
  const list = getFavorites();
  const emptyMsg =
    '<div class="col-span-2 text-center py-8"><p class="text-gray-400 text-sm">No favorites yet</p></div>';

  const desktop = document.querySelector("#favorites-section .space-y-3");
  if (desktop)
    desktop.innerHTML = list.length
      ? list.map((c) => renderMiniRow(c, "amber")).join("")
      : emptyMsg;

  const mobile = document.querySelector("#favorites-section-mobile .grid");
  if (mobile)
    mobile.innerHTML = list.length
      ? list.map((c) => renderMiniCard(c, "amber")).join("")
      : emptyMsg;
}

function renderEmergencySidebar() {
  const list = getEmergencyContacts();
  const emptyMsg =
    '<div class="col-span-2 text-center py-8"><p class="text-gray-400 text-sm">No emergency contacts</p></div>';

  const desktop = document.querySelector("#emergency-contacts .space-y-3");
  if (desktop)
    desktop.innerHTML = list.length
      ? list.map((c) => renderMiniRow(c, "rose")).join("")
      : emptyMsg;

  const mobile = document.querySelector("#emergency-contacts-mobile .grid");
  if (mobile)
    mobile.innerHTML = list.length
      ? list.map((c) => renderMiniCard(c, "rose")).join("")
      : emptyMsg;
}

function renderStats() {
  document.getElementById("statTotal").textContent = contacts.length;
  document.getElementById("statFavorites").textContent = getFavorites().length;
  document.getElementById("statEmergency").textContent =
    getEmergencyContacts().length;

  const subtitle = document.querySelector("#contacts-header p");
  if (subtitle)
    subtitle.textContent = `Manage and organize your ${contacts.length} contacts`;
}

function refreshAll() {
  renderContactsGrid(contacts);
  renderFavoritesSidebar();
  renderEmergencySidebar();
  renderStats();
}

/* =========================================================
   Modal handling
========================================================= */

function resetAvatarPreview() {
  const preview = document.getElementById("avatarPreview");
  preview.innerHTML = '<i class="fa-solid fa-user"></i>';
  preview.className =
    "w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-violet-500/25";
}

function openAddModal() {
  editingId = null;
  currentAvatar = "";
  document.getElementById("modalTitle").textContent = "Add New Contact";
  document.getElementById("contactForm").reset();
  document.getElementById("contactId").value = "";
  document.getElementById("avatarData").value = "";
  resetAvatarPreview();
  clearFieldErrors();
  document.getElementById("contactModal").classList.remove("hidden");
}

function openEditModal(id) {
  const contact = getContactById(id);
  if (!contact) return;

  editingId = id;
  currentAvatar = contact.avatar || "";

  document.getElementById("modalTitle").textContent = "Edit Contact";
  document.getElementById("contactId").value = contact.id;
  document.getElementById("contactName").value = contact.name;
  document.getElementById("contactPhone").value = contact.phone;
  document.getElementById("contactEmail").value = contact.email;
  document.getElementById("contactAddress").value = contact.address;
  document.getElementById("contactNotes").value = contact.notes;
  document.getElementById("contactGroup").value = contact.group;
  document.getElementById("contactFavorite").checked = contact.isFavorite;
  document.getElementById("contactEmergency").checked = contact.isEmergency;
  document.getElementById("avatarData").value = contact.avatar || "";

  const preview = document.getElementById("avatarPreview");
  if (contact.avatar) {
    preview.innerHTML = `<img src="${contact.avatar}" alt="Avatar" class="w-24 h-24 rounded-full object-cover" />`;
    preview.className = "w-24 h-24 rounded-full shadow-xl shadow-violet-500/25";
  } else {
    preview.innerHTML = getInitials(contact.name);
    preview.className =
      "w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-violet-500/25";
  }

  clearFieldErrors();
  document.getElementById("contactModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("contactModal").classList.add("hidden");
  document.getElementById("contactForm").reset();
  resetAvatarPreview();
  editingId = null;
  currentAvatar = "";
}

function clearFieldErrors() {
  ["contactName", "contactPhone", "contactEmail"].forEach((id) => {
    document.getElementById(id).classList.remove("border-red-500");
    document.getElementById(id).classList.add("border-gray-300");
  });
  ["contactNameError", "contactPhoneError", "contactEmailError"].forEach(
    (id) => {
      document.getElementById(id).classList.add("hidden");
    },
  );
}

/* =========================================================
   Live field validation
========================================================= */

function validateNameField() {
  const input = document.getElementById("contactName");
  const error = document.getElementById("contactNameError");
  const value = input.value.trim();
  const ok = value.length === 0 || NAME_RE.test(value);
  error.classList.toggle("hidden", ok);
  input.classList.toggle("border-red-500", !ok);
  input.classList.toggle("border-gray-300", ok);
}

function validatePhoneField() {
  const input = document.getElementById("contactPhone");
  const error = document.getElementById("contactPhoneError");
  const value = input.value.trim();
  const ok = value.length === 0 || PHONE_RE.test(value);
  error.classList.toggle("hidden", ok);
  input.classList.toggle("border-red-500", !ok);
  input.classList.toggle("border-gray-300", ok);
}

function validateEmailField() {
  const input = document.getElementById("contactEmail");
  const error = document.getElementById("contactEmailError");
  const value = input.value.trim();
  const ok = value.length === 0 || EMAIL_RE.test(value);
  error.classList.toggle("hidden", ok);
  input.classList.toggle("border-red-500", !ok);
  input.classList.toggle("border-gray-300", ok);
}

/* =========================================================
   Form submit — full validation + save
========================================================= */

function handleFormSubmit(e) {
  e.preventDefault();

  const name = document.getElementById("contactName").value.trim();
  const phone = document.getElementById("contactPhone").value.trim();
  const email = document.getElementById("contactEmail").value.trim();
  const address = document.getElementById("contactAddress").value.trim();
  const notes = document.getElementById("contactNotes").value.trim();
  const group = document.getElementById("contactGroup").value;
  const isFavorite = document.getElementById("contactFavorite").checked;
  const isEmergency = document.getElementById("contactEmergency").checked;
  const avatar = currentAvatar;

  if (!name) {
    Swal.fire({
      icon: "error",
      title: "Missing Name",
      text: "Please enter a name for the contact!",
    });
    document.getElementById("contactName").focus();
    return;
  }
  if (!NAME_RE.test(name)) {
    Swal.fire({
      icon: "error",
      title: "Invalid Name",
      text: "Name should contain only letters and spaces (2-50 characters)",
    });
    document.getElementById("contactName").focus();
    return;
  }
  if (!phone) {
    Swal.fire({
      icon: "error",
      title: "Missing Phone",
      text: "Please enter a phone number!",
    });
    document.getElementById("contactPhone").focus();
    return;
  }
  if (!PHONE_RE.test(phone)) {
    Swal.fire({
      icon: "error",
      title: "Invalid Phone",
      text: "Please enter a valid Egyptian phone number (e.g., 01012345678 or +201012345678)",
    });
    document.getElementById("contactPhone").focus();
    return;
  }

  const normalize = (p) => p.replace(/[\s\-()+]/g, "");
  const duplicate = contacts.find((c) => {
    if (editingId && c.id === editingId) return false;
    return normalize(c.phone) === normalize(phone);
  });
  if (duplicate) {
    Swal.fire({
      icon: "error",
      title: "Duplicate Phone Number",
      text: `A contact with this phone number already exists: ${duplicate.name}`,
    });
    document.getElementById("contactPhone").focus();
    return;
  }

  if (email && !EMAIL_RE.test(email)) {
    Swal.fire({
      icon: "error",
      title: "Invalid Email",
      text: "Please enter a valid email address",
    });
    document.getElementById("contactEmail").focus();
    return;
  }

  const payload = {
    name,
    phone,
    email,
    address,
    notes,
    group,
    avatar,
    isFavorite,
    isEmergency,
  };

  if (editingId) {
    updateContact(editingId, payload);
    Swal.fire({
      icon: "success",
      title: "Updated!",
      text: "Contact has been updated successfully.",
      timer: 1500,
      showConfirmButton: false,
    });
  } else {
    addContact(payload);
    Swal.fire({
      icon: "success",
      title: "Added!",
      text: "Contact has been added successfully.",
      timer: 1500,
      showConfirmButton: false,
    });
  }

  closeModal();
  refreshAll();
}

/* =========================================================
   Avatar upload (stored as a base64 data-url so it survives reload)
========================================================= */

function handleAvatarUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    Swal.fire({
      icon: "error",

      title: "Image is too large",
    });

    return;
  }
  const reader = new FileReader();
  reader.onload = function (ev) {
    currentAvatar = ev.target.result;
    document.getElementById("avatarData").value = currentAvatar;
    const preview = document.getElementById("avatarPreview");
    preview.innerHTML = `<img src="${currentAvatar}" alt="Avatar" class="w-24 h-24 rounded-full object-cover" />`;
    preview.className = "w-24 h-24 rounded-full shadow-xl shadow-violet-500/25";
  };
  reader.readAsDataURL(file);
}

/* =========================================================
   Search
========================================================= */

function handleSearch(e) {
  const term = e.target.value.trim();
  renderContactsGrid(searchContacts(term));
}

/* =========================================================
   Action handlers (exposed on window for inline onclick=)
========================================================= */

function toggleFavorite(id) {
  const contact = getContactById(id);
  if (!contact) return;
  contact.isFavorite = !contact.isFavorite;
  saveContacts();
  refreshAll();
  Swal.fire({
    toast: true,
    position: "top-end",
    timer: 1400,
    showConfirmButton: false,
    icon: "success",
    title: contact.isFavorite ? "Added to favorites" : "Removed from favorites",
  });
}

function toggleEmergency(id) {
  const contact = getContactById(id);
  if (!contact) return;
  contact.isEmergency = !contact.isEmergency;
  saveContacts();
  refreshAll();
  Swal.fire({
    toast: true,
    position: "top-end",
    timer: 1400,
    showConfirmButton: false,
    icon: "success",
    title: contact.isEmergency
      ? "Marked as emergency contact"
      : "Removed from emergency contacts",
  });
}

function editContactHandler(id) {
  openEditModal(id);
}

function deleteContactHandler(id) {
  const contact = getContactById(id);
  if (!contact) return;

  Swal.fire({
    title: "Delete Contact?",
    text: `Are you sure you want to delete ${contact.name}? This action cannot be undone.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel",
  }).then((result) => {
    if (result.isConfirmed) {
      deleteContact(id);
      refreshAll();
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Contact has been deleted.",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  });
}

function emailContact(email) {
  if (!email) {
    Swal.fire({
      icon: "warning",
      title: "No Email",
      text: "This contact does not have an email address.",
    });
    return;
  }
  window.location.href = "mailto:" + email;
}

// Expose the handlers used by inline onclick="" attributes in the generated card markup
window.toggleFavorite = toggleFavorite;
window.toggleEmergency = toggleEmergency;
window.editContactHandler = editContactHandler;
window.deleteContactHandler = deleteContactHandler;
window.emailContact = emailContact;

/* =========================================================
   Init
========================================================= */

function init() {
  loadContacts();
  refreshAll();

  document
    .getElementById("addContactBtn")
    .addEventListener("click", openAddModal);
  document
    .getElementById("closeModalBtn")
    .addEventListener("click", closeModal);
  document
    .getElementById("cancelModalBtn")
    .addEventListener("click", closeModal);
  document
    .getElementById("contactForm")
    .addEventListener("submit", handleFormSubmit);
  document
    .getElementById("avatarInput")
    .addEventListener("change", handleAvatarUpload);
  document
    .getElementById("searchInput")
    .addEventListener("input", handleSearch);

  document
    .getElementById("contactName")
    .addEventListener("input", validateNameField);
  document
    .getElementById("contactPhone")
    .addEventListener("input", validatePhoneField);
  document
    .getElementById("contactEmail")
    .addEventListener("input", validateEmailField);

  // Click on the dark backdrop closes the modal
  document
    .getElementById("contactModal")
    .addEventListener("click", function (e) {
      if (e.target.id === "contactModal" || e.target.id === "modalBackdrop")
        closeModal();
    });
}

document.readyState === "loading"
  ? document.addEventListener("DOMContentLoaded", init)
  : init();
