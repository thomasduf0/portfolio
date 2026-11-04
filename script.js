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

// ===== Rotation au scroll : bulles de l'accueil et photo =====
// Désactivé si la personne a demandé à réduire les animations sur son appareil.
const bulles = document.querySelector('.bubbles');
const photo = document.querySelector('.about-photo');
const reduireAnimations = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function tournerAuScroll() {
  // Bulles : plus on descend, plus elles tournent (0,04 degré par pixel scrollé)
  if (bulles) {
    const angle = Math.min(window.scrollY, 1200) * 0.04;
    bulles.style.setProperty('--scroll-rotation', angle + 'deg');
  }
  // Photo : elle tourne pendant qu'elle traverse l'écran et revient droite au centre
  if (photo) {
    const zone = photo.getBoundingClientRect();
    const ecart = zone.top + zone.height / 2 - window.innerHeight / 2;
    const angle = Math.max(-15, Math.min(15, ecart * -0.03));
    photo.style.setProperty('--scroll-rotation', angle + 'deg');
  }
}

if (!reduireAnimations) {
  let enAttente = false;
  window.addEventListener('scroll', () => {
    if (enAttente) return;
    enAttente = true;
    requestAnimationFrame(() => {
      tournerAuScroll();
      enAttente = false;
    });
  }, { passive: true });
  tournerAuScroll();
}

// ===== Formulaire de contact (envoi par email via Web3Forms, sans quitter la page) =====
const form = document.querySelector('.contact-form');
const statut = form.querySelector('.form-status');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  statut.className = 'form-status';
  statut.textContent = 'Envoi en cours…';

  try {
    const reponse = await fetch(form.action, {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    });
    const resultat = await reponse.json().catch(() => ({}));
    if (reponse.ok && resultat.success === true) {
      form.reset();
      statut.classList.add('ok');
      statut.textContent = 'Message envoyé. Je vous réponds sous 48 heures.';
    } else {
      // Web3Forms explique le problème dans "message"
      console.warn('Web3Forms :', reponse.status, resultat);
      statut.classList.add('erreur');
      statut.textContent = "Le message n'est pas parti. Réessayez, ou contactez-moi sur LinkedIn."
        + (resultat.message ? ' (Détail : ' + resultat.message + ')' : '');
    }
  } catch (erreur) {
    console.warn('Envoi impossible :', erreur);
    statut.classList.add('erreur');
    statut.textContent = "Le message n'est pas parti. Vérifiez votre connexion, ou contactez-moi sur LinkedIn.";
  }
});
