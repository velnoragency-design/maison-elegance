const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const compactMotion = window.matchMedia('(max-width: 850px), (pointer: coarse)');
const gentleEase = 'cubic-bezier(.22, 1, .36, 1)';
let currentTransition;
function animateChange(change, selector) {
  if (reducedMotion.matches || compactMotion.matches) { change(); return; }
  if (document.startViewTransition) {
    currentTransition?.skipTransition();
    currentTransition = document.startViewTransition(change);
    currentTransition.finished.catch(() => {});
  } else {
    change();
    document.querySelectorAll(selector).forEach((element, index) => {
      if (!element.hidden && element.getBoundingClientRect().height > 0) {
        element.animate([{opacity: 0, transform: 'translateY(10px)'}, {opacity: 1, transform: 'translateY(0)'}],
          {duration: 320, delay: Math.min(index * 25, 100), easing: gentleEase});
      }
    });
  }
}

// Keep separate HTML pages, with a short, progressive transition on normal navigation.
let leaving = false;
document.addEventListener('click', event => {
  const link = event.target.closest('a[href]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.hasAttribute('download') || (link.target && link.target !== '_self') || reducedMotion.matches || compactMotion.matches) return;
  const destination = new URL(link.href, location.href);
  if (destination.origin !== location.origin || destination.protocol !== location.protocol || !destination.pathname.endsWith('.html') || destination.pathname === location.pathname) return;
  event.preventDefault();
  if (leaving) return;
  leaving = true;
  const navigationDelay = siteMenu?.open ? 270 : 190;
  if (siteMenu?.open) closeSiteMenu();
  document.documentElement.classList.add('is-leaving');
  window.setTimeout(() => location.assign(destination.href), navigationDelay);
});
window.addEventListener('pageshow', () => {
  leaving = false;
  document.documentElement.classList.remove('is-leaving');
});

const menuButton = document.querySelector('.menu-toggle');
const siteMenu = document.querySelector('#site-menu');
let drawerMotion;
let drawerClosing = false;
function closeSiteMenu(immediate = false) {
  if (!siteMenu?.open || (drawerClosing && !immediate)) return;
  drawerClosing = true;
  menuButton.setAttribute('aria-expanded', 'false');
  drawerMotion?.cancel();
  const finish = () => {
    siteMenu.close();
    siteMenu.classList.remove('is-closing');
    document.documentElement.classList.remove('menu-is-open');
    drawerClosing = false;
  };
  if (immediate || reducedMotion.matches) { finish(); return; }
  siteMenu.classList.add('is-closing');
  drawerMotion = siteMenu.animate([{transform:'translateX(0)'},{transform:'translateX(-100%)'}],
    {duration:compactMotion.matches ? 160 : 260,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'});
  drawerMotion.finished.then(finish).catch(() => {});
}
menuButton?.addEventListener('click', () => {
  if (siteMenu.open) { closeSiteMenu(); return; }
  drawerMotion?.cancel();
  siteMenu.showModal();
  document.documentElement.classList.add('menu-is-open');
  menuButton.setAttribute('aria-expanded', 'true');
  if (!reducedMotion.matches) drawerMotion = siteMenu.animate(
    [{transform:'translateX(-100%)'},{transform:'translateX(0)'}],
    {duration:compactMotion.matches ? 220 : 440,easing:gentleEase});
});
siteMenu?.querySelector('.drawer-close').addEventListener('click', () => closeSiteMenu());
siteMenu?.addEventListener('cancel', event => { event.preventDefault(); closeSiteMenu(); });
siteMenu?.addEventListener('click', event => {
  const rect = siteMenu.getBoundingClientRect();
  if (event.target === siteMenu && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) closeSiteMenu();
  const link = event.target.closest('a[href]');
  if (link && new URL(link.href).pathname === location.pathname) closeSiteMenu();
});
window.addEventListener('pageshow', () => closeSiteMenu(true));

const filterButtons = [...document.querySelectorAll('[data-filter]')];
const vegetarian = document.querySelector('#vegetarian');
function updateMenu() {
  const category = document.querySelector('[data-filter][aria-pressed="true"]')?.dataset.filter || 'all';
  let visible = 0;
  document.querySelectorAll('.menu-section').forEach(section => {
    let sectionVisible = 0;
    section.querySelectorAll('.dish').forEach(dish => {
      const show = (category === 'all' || section.dataset.category === category) && (!vegetarian.checked || dish.dataset.vegetarian === 'true');
      dish.hidden = !show;
      if (show) sectionVisible++;
    });
    section.hidden = sectionVisible === 0;
    visible += sectionVisible;
  });
  document.querySelector('#empty-menu').hidden = visible !== 0;
  document.querySelector('#menu-status').textContent = visible + (visible === 1 ? ' plat affiché' : ' plats affichés');
}
function filterMenu() { animateChange(updateMenu, '.dish:not([hidden])'); }
filterButtons.forEach(button => button.addEventListener('click', () => {
  filterButtons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  filterMenu();
}));
vegetarian?.addEventListener('change', filterMenu);

const dishDialog = document.querySelector('#dish-dialog');
document.querySelectorAll('.dish').forEach(dish => dish.addEventListener('click', () => {
  const photo = dish.querySelector('img');
  dishDialog.querySelector('.dialog-photo').src = photo.src;
  dishDialog.querySelector('.dialog-photo').alt = photo.alt;
  dishDialog.querySelector('h2').textContent = dish.querySelector('.dish-name').textContent;
  dishDialog.querySelector('.dialog-description').textContent = dish.querySelector('.dish-description').textContent;
  dishDialog.querySelector('.dialog-price').textContent = dish.querySelector('.price').textContent;
  dishDialog.querySelector('.tag').textContent = dish.querySelector('.tag').textContent;
  dishDialog.showModal();
  if (!reducedMotion.matches && !compactMotion.matches) dishDialog.animate(
    [{opacity: 0, transform: 'translateY(18px) scale(.985)'}, {opacity: 1, transform: 'translateY(0) scale(1)'}],
    {duration: 360, easing: gentleEase});
}));
let closingDialog = false;
function closeDishDialog() {
  if (!dishDialog?.open || closingDialog) return;
  if (reducedMotion.matches || compactMotion.matches) { dishDialog.close(); return; }
  closingDialog = true;
  const animation = dishDialog.animate(
    [{opacity: 1, transform: 'translateY(0)'}, {opacity: 0, transform: 'translateY(10px)'}],
    {duration: 180, easing: 'ease-out'});
  animation.finished.then(() => dishDialog.close()).catch(() => {}).finally(() => { closingDialog = false; });
}
document.querySelector('.dialog-close')?.addEventListener('click', closeDishDialog);
dishDialog?.addEventListener('click', event => { if (event.target === dishDialog) closeDishDialog(); });
dishDialog?.addEventListener('cancel', event => { event.preventDefault(); closeDishDialog(); });

const form = document.querySelector('#booking-form');
if (form) {
  const dateInput = form.elements.date;
  const timeInput = form.elements.time;
  const today = new Intl.DateTimeFormat('en-CA', {timeZone:'Africa/Casablanca',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  dateInput.min = today;
  const defaultDate = new Date(today + 'T12:00:00');
  defaultDate.setDate(defaultDate.getDate() + 1);
  if (defaultDate.getDay() === 1) defaultDate.setDate(defaultDate.getDate() + 1);
  dateInput.value = [defaultDate.getFullYear(),String(defaultDate.getMonth()+1).padStart(2,'0'),String(defaultDate.getDate()).padStart(2,'0')].join('-');
  function updateTimes() {
    const day = new Date(dateInput.value + 'T12:00:00').getDay();
    const previous = timeInput.value;
    timeInput.replaceChildren();
    dateInput.setCustomValidity(day === 1 ? 'Ce jour ne comporte aucun créneau fictif. Choisissez une autre date.' : '');
    const times = day === 1 ? [] : day === 0 ? ['12:00','12:30','13:00','13:30','14:00','14:30'] : ['12:00','12:30','13:00','13:30','14:00','19:00','19:30','20:00','20:30','21:00','21:30','22:00'];
    times.forEach(time => timeInput.add(new Option(time, time)));
    if (times.includes(previous)) timeInput.value = previous;
    else if (times.includes('20:00')) timeInput.value = '20:00';
    timeInput.disabled = !times.length;
    document.querySelector('#date-error').textContent = day === 1 ? 'Aucun créneau de démonstration le lundi.' : '';
  }
  dateInput.addEventListener('change', updateTimes);
  updateTimes();
  form.addEventListener('submit', event => {
    event.preventDefault();
    updateTimes();
    if (!form.reportValidity()) return;
    const confirmation = document.querySelector('#confirmation');
    const details = {
      name: form.elements.fullname.value.trim().split(/\s+/)[0],
      date: new Intl.DateTimeFormat('fr-FR',{dateStyle:'long'}).format(new Date(dateInput.value+'T12:00:00')),
      time: timeInput.value,
      guests: form.elements.guests.value + ' personnes',
      email: form.elements.email.value.trim()
    };
    Object.entries(details).forEach(([key,value]) => { confirmation.querySelector('[data-summary="'+key+'"]').textContent = value; });
    animateChange(() => {
      form.hidden = true;
      form.style.display = 'none';
      confirmation.hidden = false;
      confirmation.querySelector('h2').focus({preventScroll: true});
    }, '#confirmation');
  });

}

