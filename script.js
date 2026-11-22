// ===== Menu mobile =====
const toggle = document.querySelector('.nav-toggle');
const menu = document.querySelector('#menu');
const toggleLibelle = toggle.querySelector('.visually-hidden');

function ouvrirMenu(ouvrir) {
  toggle.setAttribute('aria-expanded', String(ouvrir));
  menu.classList.toggle('is-open', ouvrir);
  toggleLibelle.textContent = ouvrir ? 'Fermer le menu' : 'Ouvrir le menu';
}

toggle.addEventListener('click', () => {
  ouvrirMenu(toggle.getAttribute('aria-expanded') !== 'true');
});

// Referme le menu quand on clique sur un lien
menu.querySelectorAll('a').forEach((lien) => {
  lien.addEventListener('click', () => ouvrirMenu(false));
});

// Touche Échap : referme le menu et remet le focus sur le bouton
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menu.classList.contains('is-open')) {
    ouvrirMenu(false);
    toggle.focus();
  }
});

// Si on agrandit la fenêtre au-delà du mode mobile, le menu se remet à zéro
window.matchMedia('(min-width: 761px)').addEventListener('change', (e) => {
  if (e.matches) ouvrirMenu(false);
});

// ===== Rubrique en cours de lecture : soulignée dans le menu =====
const liensMenu = [...menu.querySelectorAll('a[href^="#"]:not(.btn)')];
const rubriques = liensMenu
  .map((lien) => document.querySelector(lien.getAttribute('href')))
  .filter(Boolean);

if ('IntersectionObserver' in window) {
  const observateur = new IntersectionObserver((entrees) => {
    entrees.forEach((entree) => {
      if (!entree.isIntersecting) return;
      liensMenu.forEach((lien) => {
        const actif = lien.getAttribute('href') === '#' + entree.target.id;
        if (actif) lien.setAttribute('aria-current', 'true');
        else lien.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' }); // la rubrique qui passe au milieu de l'écran
  rubriques.forEach((rubrique) => observateur.observe(rubrique));
}

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
const boutonEnvoi = form.querySelector('button[type="submit"]');

// Messages d'erreur affichés sous chaque champ
function messageErreur(champ) {
  if (champ.validity.valueMissing) {
    if (champ.name === 'nom') return 'Indiquez votre nom.';
    if (champ.name === 'email') return 'Indiquez votre adresse email.';
    if (champ.name === 'message') return 'Écrivez votre message.';
  }
  if (champ.validity.typeMismatch) return 'Cette adresse email ne semble pas valide (exemple : prenom@entreprise.fr).';
  return '';
}

function verifierChamp(champ) {
  const erreur = document.getElementById(champ.id + '-erreur');
  const texte = messageErreur(champ);
  if (erreur) erreur.textContent = texte;
  if (texte) champ.setAttribute('aria-invalid', 'true');
  else champ.removeAttribute('aria-invalid');
  return !texte;
}

const champsObligatoires = [...form.querySelectorAll('[required]')];

// Une fois qu'un champ a été signalé en erreur, l'erreur disparaît dès qu'il est corrigé
champsObligatoires.forEach((champ) => {
  champ.addEventListener('input', () => {
    if (champ.getAttribute('aria-invalid') === 'true') verifierChamp(champ);
  });
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const invalides = champsObligatoires.filter((champ) => !verifierChamp(champ));
  if (invalides.length) {
    invalides[0].focus();
    return;
  }

  statut.className = 'form-status';

  // Tant que la vraie clé Web3Forms n'est pas en place, inutile d'envoyer
  if (form.access_key.value === 'CLE_WEB3FORMS') {
    console.warn('Web3Forms : la clé d\'accès n\'est pas encore renseignée dans index.html.');
    statut.classList.add('erreur');
    statut.textContent = "Le formulaire n'est pas encore actif. Contactez-moi sur LinkedIn en attendant.";
    return;
  }

  statut.textContent = 'Envoi en cours…';
  boutonEnvoi.disabled = true;
  form.setAttribute('aria-busy', 'true');

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
  } finally {
    boutonEnvoi.disabled = false;
    form.removeAttribute('aria-busy');
  }
});
