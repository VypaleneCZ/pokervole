document.addEventListener('DOMContentLoaded', () => {
    const tournamentForm = document.getElementById('tournamentForm');
    const tournamentDetails = document.getElementById('tournament-details');
    const prizesDiv = document.getElementById('prizes');
    const blindPlanDiv = document.getElementById('blind-plan');
    const tournamentList = document.getElementById('tournamentList');
    const saveTournamentBtn = document.getElementById('saveTournament');
    const startTournamentBtn = document.getElementById('startTournament');
    const pauseTournamentBtn = document.getElementById('pauseTournament');
    const timerDisplay = document.getElementById('time');
    const alertSound = document.getElementById('alertSound');

    let currentBlindLevel = 0;
    let timerInterval;
    let blinds = [];
    let isTournamentStarted = false;
    let isPaused = false;
    let remainingTime = 0;

    // Seznam pokerových kombinací od nejslabší po nejsilnější
    const handRankings = [
        "High Card",
        "One Pair",
        "Two Pair",
        "Three of a Kind",
        "Straight",
        "Flush",
        "Full House",
        "Four of a Kind",
        "Straight Flush",
        "Royal Flush"
    ];

    // Načíst seznam kombinací při načtení stránky
    displayHandRankings();

    // Načíst uložené turnaje při načtení stránky
    loadSavedTournaments();

    // Event listener pro odeslání formuláře
    tournamentForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Získání hodnot z formuláře
        const playerCount = parseInt(document.getElementById('playerCount').value);
        const buyIn = parseFloat(document.getElementById('buyIn').value);
        const winners = parseInt(document.getElementById('winners').value);

        // Validace vstupů
        if (winners > playerCount) {
            alert('Počet vítězů nemůže být větší než počet hráčů.');
            return;
        }

        // Výpočet celkového startovného
        const totalPrize = playerCount * buyIn;

        // Výpočet odměn
        const prizeDistribution = calculatePrizes(totalPrize, winners);

        // Generování plánu blindů
        blinds = generateBlindPlan();

        // Zobrazení výsledků
        displayPrizes(prizeDistribution);
        displayBlindPlan(blinds);

        // Resetovat timer a blind level
        currentBlindLevel = 0;
        clearInterval(timerInterval);
        timerDisplay.textContent = '--:--';
        isPaused = false;
        pauseTournamentBtn.classList.add('hidden');
        startTournamentBtn.classList.remove('hidden');

        // Zobrazit sekci s detaily turnaje
        tournamentDetails.classList.remove('hidden');
        isTournamentStarted = false;
    });

    // Event listener pro uložení turnaje
    saveTournamentBtn.addEventListener('click', () => {
        const playerCount = parseInt(document.getElementById('playerCount').value);
        const buyIn = parseFloat(document.getElementById('buyIn').value);
        const winners = parseInt(document.getElementById('winners').value);
        const totalPrize = playerCount * buyIn;
        const prizeDistribution = calculatePrizes(totalPrize, winners);
        const blindPlan = generateBlindPlan();

        const tournament = {
            id: Date.now(),
            playerCount,
            buyIn,
            winners,
            prizeDistribution,
            blindPlan
        };

        saveTournament(tournament);
        loadSavedTournaments();
        alert('Turnaj uložen!');
    });

    // Event listener pro start turnaje
    startTournamentBtn.addEventListener('click', () => {
        if (isTournamentStarted) {
            alert('Turnaj již běží.');
            return;
        }
        if (blinds.length === 0) {
            alert('Nejprve vytvořte turnaj.');
            return;
        }
        isTournamentStarted = true;
        startTournamentBtn.classList.add('hidden');
        pauseTournamentBtn.classList.remove('hidden');
        startBlindTimer();
    });

    // Event listener pro pauzu turnaje
    pauseTournamentBtn.addEventListener('click', () => {
        if (!isTournamentStarted) return;

        if (!isPaused) {
            // Pauza
            clearInterval(timerInterval);
            isPaused = true;
            pauseTournamentBtn.innerHTML = '<i class="fas fa-play"></i> Pokračovat';
        } else {
            // Pokračování
            isPaused = false;
            pauseTournamentBtn.innerHTML = '<i class="fas fa-pause"></i> Pauza Turnaje';
            startBlindTimer();
        }
    });

    // Funkce pro výpočet odměn
    function calculatePrizes(total, winners) {
        const distribution = [];
        // Přesná distribuce: 70% pro 1. místo, 30% pro 2. místo
        const percentages = [0.7, 0.3];
        for (let i = 0; i < winners; i++) {
            const percentage = percentages[i] || 0; // Pro případ, že bude méně než 2 vítězů
            distribution.push({
                place: i + 1,
                prize: percentage * total
            });
        }
        return distribution;
    }

    // Funkce pro generování plánu blindů
    function generateBlindPlan() {
        const blinds = [];
        let smallBlind = 25;
        let bigBlind = 50;
        let level = 1;
        const totalLevels = 20; // Změna na 20 úrovní
        const levelDuration = 10; // Minut

        for (let i = 0; i < totalLevels; i++) {
            blinds.push({
                level: level,
                smallBlind: smallBlind,
                bigBlind: bigBlind,
                duration: levelDuration
            });
            // Zvýšení blindů (můžete upravit logiku podle potřeby)
            smallBlind *= 2;
            bigBlind *= 2;
            level++;
        }
        return blinds;
    }

    // Funkce pro zobrazení odměn
    function displayPrizes(prizes) {
        prizesDiv.innerHTML = '<h3>Odměny</h3><ul>' +
            prizes.map(p => `<li>${p.place}. místo: <strong>${p.prize.toFixed(2)} Kč</strong></li>`).join('') +
            '</ul>';
    }

    // Funkce pro zobrazení plánu blindů
    function displayBlindPlan(blinds) {
        blindPlanDiv.innerHTML = '<h3>Plán Blindů</h3><table>' +
            '<tr><th>Úroveň</th><th>Small Blind</th><th>Big Blind</th><th>Trvání (min)</th></tr>' +
            blinds.map(b => `<tr>
                                <td>${b.level}</td>
                                <td>${b.smallBlind}</td>
                                <td>${b.bigBlind}</td>
                                <td>${b.duration}</td>
                             </tr>`).join('') +
            '</table>';
    }

    // Funkce pro zobrazení seznamu kombinací jako jeden obrázek
    function displayHandRankings() {
        // Tento obrázek obsahuje všechny kombinace pokerových rukou
        // Pokud potřebujete dynamicky měnit obrázek, můžete zde implementovat další logiku
        // Momentálně je obrázek statický, takže zde nic netřeba
    }

    // Funkce pro uložení turnaje do localStorage
    function saveTournament(tournament) {
        let tournaments = JSON.parse(localStorage.getItem('tournaments')) || [];
        tournaments.push(tournament);
        localStorage.setItem('tournaments', JSON.stringify(tournaments));
    }

    // Funkce pro načtení a zobrazení uložených turnajů
    function loadSavedTournaments() {
        tournamentList.innerHTML = '';
        let tournaments = JSON.parse(localStorage.getItem('tournaments')) || [];
        if (tournaments.length === 0) {
            tournamentList.innerHTML = '<li>Žádné uložené turnaje.</li>';
            return;
        }
        tournaments.forEach(tournament => {
            const li = document.createElement('li');
            li.innerHTML = `<span>Turnaj s <strong>${tournament.playerCount}</strong> hráči, startovné <strong>${tournament.buyIn}</strong> Kč, <strong>${tournament.winners}</strong> vítězi</span>
                            <div>
                                <button onclick="loadTournament(${tournament.id})"><i class="fas fa-download"></i> Načíst</button>
                                <button onclick="deleteTournament(${tournament.id})"><i class="fas fa-trash"></i> Smazat</button>
                            </div>`;
            tournamentList.appendChild(li);
        });
    }

    // Globální funkce pro načtení turnaje
    window.loadTournament = function(id) {
        let tournaments = JSON.parse(localStorage.getItem('tournaments')) || [];
        const tournament = tournaments.find(t => t.id === id);
        if (!tournament) {
            alert('Turnaj nenalezen.');
            return;
        }

        // Vyplnit formulář s uloženými údaji
        document.getElementById('playerCount').value = tournament.playerCount;
        document.getElementById('buyIn').value = tournament.buyIn;
        document.getElementById('winners').value = tournament.winners;

        // Zobrazit detaily turnaje
        displayPrizes(tournament.prizeDistribution);
        displayBlindPlan(tournament.blindPlan);
        tournamentDetails.classList.remove('hidden');

        // Resetovat timer a blind level
        currentBlindLevel = 0;
        clearInterval(timerInterval);
        timerDisplay.textContent = '--:--';
        isTournamentStarted = false;
        isPaused = false;
        pauseTournamentBtn.classList.add('hidden');
        startTournamentBtn.classList.remove('hidden');
    };

    // Globální funkce pro smazání turnaje
    window.deleteTournament = function(id) {
        let tournaments = JSON.parse(localStorage.getItem('tournaments')) || [];
        tournaments = tournaments.filter(t => t.id !== id);
        localStorage.setItem('tournaments', JSON.stringify(tournaments));
        loadSavedTournaments();
    };

    // Funkce pro spuštění timeru a automatické zvýšení blindů
    function startBlindTimer() {
        if (currentBlindLevel >= blinds.length) {
            // Pokud jsme dosáhli poslední úrovně, můžete buď zastavit turnaj nebo restartovat
            alert('Turnaj dosáhl poslední úrovně.');
            clearInterval(timerInterval);
            isTournamentStarted = false;
            startTournamentBtn.classList.remove('hidden');
            pauseTournamentBtn.classList.add('hidden');
            return;
        }

        const currentBlind = blinds[currentBlindLevel];
        remainingTime = currentBlind.duration * 60; // převod minut na sekundy

        updateTimerDisplay(remainingTime);
        // Zobrazení aktuální úrovně blindů
        // Přidání do HTML elementu pro aktuální blind (pokud ještě není)
        if (!document.getElementById('currentBlindInfo')) {
            const currentBlindDiv = document.createElement('div');
            currentBlindDiv.id = 'currentBlind';
            currentBlindDiv.innerHTML = `Aktuální Blind: <span id="currentBlindInfo">${currentBlind.smallBlind} SB / ${currentBlind.bigBlind} BB</span>`;
            document.querySelector('.controls').prepend(currentBlindDiv);
        } else {
            document.getElementById('currentBlindInfo').textContent = `${currentBlind.smallBlind} SB / ${currentBlind.bigBlind} BB`;
        }

        timerInterval = setInterval(() => {
            if (!isPaused) {
                remainingTime--;
                if (remainingTime <= 0) {
                    clearInterval(timerInterval);
                    alertSound.play();
                    alert(`Zvyšuje se blindy! Úroveň ${blinds[currentBlindLevel].level}`);
                    currentBlindLevel++;
                    if (currentBlindLevel < blinds.length) {
                        displayBlindPlan(blinds.slice(0, currentBlindLevel + 1));
                        startBlindTimer();
                    } else {
                        alert('Turnaj dosáhl poslední úrovně.');
                        isTournamentStarted = false;
                        startTournamentBtn.classList.remove('hidden');
                        pauseTournamentBtn.classList.add('hidden');
                    }
                }
                updateTimerDisplay(remainingTime);
            }
        }, 1000);
    }

    // Funkce pro aktualizaci zobrazení timeru
    function updateTimerDisplay(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        timerDisplay.textContent = `${padZero(minutes)}:${padZero(secs)}`;
    }

    // Funkce pro přidání nuly před jednociferná čísla
    function padZero(num) {
        return num < 10 ? `0${num}` : num;
    }
});
