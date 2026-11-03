// ===== Menu mobile =====
const toggle = document.querySelector('.nav-toggle');
const menu = document.querySelector('#menu');

toggle.addEventListener('click', () => {
  const ouvert = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!ouvert));
  menu.classList.toggle('is-open', !ouvert);
});

// Referme le menu quand on clique sur un lien
menu.querySelectorAll('a').forEach((lien) => {
  lien.addEventListener('click', () => {
    toggle.setAttribute('aria-expanded', 'false');
    menu.classList.remove('is-open');
  });
});

// ===== Bulles de l'accueil : rotation au scroll =====
// Plus on descend, plus les bulles tournent (0,04 degré par pixel scrollé).
// Désactivé si la personne a demandé à réduire les animations sur son appareil.
const bulles = document.querySelector('.bubbles');
const reduireAnimations = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (bulles && !reduireAnimations) {
  let enAttente = false;
  window.addEventListener('scroll', () => {
    if (enAttente) return;
    enAttente = true;
    requestAnimationFrame(() => {
      const angle = Math.min(window.scrollY, 1200) * 0.04;
      bulles.style.setProperty('--scroll-rotation', angle + 'deg');
      enAttente = false;
    });
  }, { passive: true });
}

// ===== Formulaire de contact (envoi par email via FormSubmit, sans quitter la page) =====
const form = document.querySelector('.contact-form');
const statut = form.querySelector('.form-status');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  statut.className = 'form-status';
  statut.textContent = 'Envoi en cours…';

  try {
    const reponse = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
    });
    const resultat = await reponse.json();
    if (!reponse.ok || String(resultat.success) !== 'true') throw new Error();
    form.reset();
    statut.classList.add('ok');
    statut.textContent = 'Message envoyé. Je vous réponds sous 48 heures.';
  } catch {
    statut.classList.add('erreur');
    statut.textContent = "Le message n'est pas parti. Réessayez, ou contactez-moi sur LinkedIn.";
  }
});
