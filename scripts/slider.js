const whatWeDoCards = Array.from(document.querySelectorAll('.what-we-do-card'));
const cardTrack = document.querySelector('.what-we-do-cards');
const prev = document.querySelector('.what-we-do-controls .previous');
const next = document.querySelector('.what-we-do-controls .next');
const visibleCards = 3;

let cardPosition = 0;

function updateWhatWeDoSlider() {
    const maxPosition = Math.max(whatWeDoCards.length - visibleCards, 0);

    // clamp safely and keep the 3 visible cards only
    cardPosition = Math.max(0, Math.min(cardPosition, maxPosition));

    whatWeDoCards.forEach((card, index) => {
        card.style.display = index >= cardPosition && index < cardPosition + visibleCards
            ? 'flex'
            : 'none';
    });
}

prev.addEventListener('click', () => {
    cardPosition = Math.max(0, cardPosition - visibleCards);
    updateWhatWeDoSlider();
});

next.addEventListener('click', () => {
    const maxPosition = Math.max(whatWeDoCards.length - visibleCards, 0);
    cardPosition = Math.min(maxPosition, cardPosition + visibleCards);
    updateWhatWeDoSlider();
});

updateWhatWeDoSlider();
