const monthYearElement = document.getElementById('month-year');
const calendarDaysElement = document.getElementById('calendar-days');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');

// Modals
const birthdayModal = document.getElementById('birthday-modal');
const preModal = document.getElementById('pre-modal');
const preModalList = document.getElementById('pre-modal-list');
const closeBtns = document.querySelectorAll('.close-modal');
const birthdayListContainer = document.getElementById('birthday-list-container');
const eventAttendeesContainer = document.getElementById('event-attendees-container');

let currentDate = new Date();
let birthdays = [];
let generalEvents = [];

function parseDateString(dateStr) {
    const parts = dateStr.split('/');
    return new Date(parts[2], parts[1] - 1, parts[0]);
}

function loadData() {
    try {
        if (typeof birthdaysData !== 'undefined') {
            birthdays = birthdaysData.map(b => {
                const dateObj = parseDateString(b.birthday);
                return { ...b, parsedDate: dateObj };
            });
        }
        if (typeof eventsData !== 'undefined') {
            generalEvents = eventsData.map(e => {
                const dateObj = parseDateString(e.date);
                return { ...e, parsedDate: dateObj };
            });
        }
        renderCalendar();
    } catch (error) {
        console.error("Error cargando datos:", error);
    }
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    monthYearElement.textContent = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(currentDate);

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    calendarDaysElement.innerHTML = '';

    for (let i = 0; i < firstDay; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('day', 'empty');
        calendarDaysElement.appendChild(emptyDiv);
    }

    const today = new Date();

    for (let i = 1; i <= daysInMonth; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('day');

        const dayNumber = document.createElement('span');
        dayNumber.classList.add('day-number');
        dayNumber.textContent = i;
        dayDiv.appendChild(dayNumber);

        if (year === today.getFullYear() && month === today.getMonth() && i === today.getDate()) {
            dayDiv.classList.add('is-today');
        }

        const bdayPeople = birthdays.filter(b => b.parsedDate.getDate() === i && b.parsedDate.getMonth() === month);
        const dayEvents = generalEvents.filter(e => e.parsedDate.getDate() === i && e.parsedDate.getMonth() === month && e.parsedDate.getFullYear() === year);

        const hasBirthdays = bdayPeople.length > 0;
        const hasEvents = dayEvents.length > 0;

        if (hasBirthdays || hasEvents) {
            if (hasBirthdays) dayDiv.classList.add('has-birthday');

            const indicatorsContainer = document.createElement('div');
            indicatorsContainer.classList.add('indicators-container');

            if (hasBirthdays) {
                const indicator = document.createElement('div');
                indicator.classList.add('indicator', 'birthday');
                indicator.textContent = '🎂 ' + (bdayPeople.length > 1 ? `${bdayPeople.length} Cumpleaños` : bdayPeople[0].name.split(' ')[0]);
                indicatorsContainer.appendChild(indicator);
            }

            if (hasEvents) {
                dayEvents.forEach(evt => {
                    const evtInfo = eventTypes[evt.type] || eventTypes['default'];
                    const indicator = document.createElement('div');
                    indicator.classList.add('indicator', 'event');
                    indicator.style.backgroundColor = evtInfo.color;
                    indicator.textContent = `${evtInfo.emoji} ${evt.title}`;
                    indicatorsContainer.appendChild(indicator);
                });
            }

            dayDiv.appendChild(indicatorsContainer);

            dayDiv.addEventListener('click', () => {
                const totalItems = bdayPeople.length + dayEvents.length;
                if (totalItems > 1) {
                    openPreModal(bdayPeople, dayEvents, year);
                } else {
                    if (bdayPeople.length === 1) {
                        openEventsModal(bdayPeople, [], year, false);
                    } else if (dayEvents.length === 1) {
                        triggerEventAnimation(dayEvents[0], year);
                    }
                }
            });
        }

        calendarDaysElement.appendChild(dayDiv);
    }
}

prevMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

function openPreModal(bdayPeople, dayEvents, currentYear) {
    preModalList.innerHTML = '';

    bdayPeople.forEach(person => {
        const card = document.createElement('div');
        card.className = 'pre-modal-card';
        card.innerHTML = `<div style="font-size: 2rem;">🎂</div><div><h3 style="margin:0;">Cumpleaños de ${person.name}</h3></div>`;
        card.onclick = () => {
            preModal.classList.remove('active');
            openEventsModal([person], [], currentYear);
        };
        preModalList.appendChild(card);
    });

    dayEvents.forEach(evt => {
        const evtInfo = eventTypes[evt.type] || eventTypes['default'];
        const card = document.createElement('div');
        card.className = 'pre-modal-card';
        card.innerHTML = `<div style="font-size: 2rem;">${evtInfo.emoji}</div><div><h3 style="margin:0;">${evt.title}</h3><p style="font-size: 0.8rem; margin:0; opacity: 0.8;">📍 ${evt.location || 'Por definir'} | 🕒 ${evt.time || 'TBD'}</p></div>`;
        card.onclick = () => {
            preModal.classList.remove('active');
            triggerEventAnimation(evt, currentYear);
        };
        preModalList.appendChild(card);
    });

    preModal.classList.add('active');
}

function triggerEventAnimation(evt, currentYear) {
    openEventsModal([], [evt], currentYear);

    let attendeeNames = [];
    if (evt.attendees === "all") {
        attendeeNames = birthdaysData.map(p => p.name);
    } else if (Array.isArray(evt.attendees)) {
        attendeeNames = evt.attendees;
    }

    const sidebarPersons = document.querySelectorAll('.sidebar-person');
    let attendeesToAnimate = [];

    sidebarPersons.forEach(el => {
        if (attendeeNames.includes(el.getAttribute('data-name'))) {
            attendeesToAnimate.push(el);
        }
    });

    attendeesToAnimate.forEach((el, index) => {
        const img = el.querySelector('img');
        const rect = img.getBoundingClientRect();
        const clone = img.cloneNode();
        clone.className = 'ghost-avatar';
        clone.style.left = `${rect.left}px`;
        clone.style.top = `${rect.top}px`;
        clone.style.width = `${rect.width}px`;
        clone.style.height = `${rect.height}px`;

        document.body.appendChild(clone);

        const placeholder = document.createElement('img');
        placeholder.className = 'attendee-avatar';
        placeholder.src = clone.src;
        placeholder.style.opacity = '0';
        placeholder.style.animation = 'none';

        eventAttendeesContainer.appendChild(placeholder);

        requestAnimationFrame(() => {
            setTimeout(() => {
                const targetRect = placeholder.getBoundingClientRect();
                clone.style.left = `${targetRect.left}px`;
                clone.style.top = `${targetRect.top}px`;
                clone.style.width = `${targetRect.width}px`;
                clone.style.height = `${targetRect.height}px`;

                clone.addEventListener('transitionend', () => {
                    clone.remove();
                    placeholder.style.animation = 'popIn 0.3s ease forwards';
                });
            }, index * 80);
        });
    });
}

function openEventsModal(people, events, currentYear) {
    birthdayListContainer.innerHTML = '';
    eventAttendeesContainer.innerHTML = '';

    people.forEach(person => {
        const age = currentYear - person.parsedDate.getFullYear();
        const photoUrl = `photos/${person.photo}`;

        const block = document.createElement('div');
        block.classList.add('birthday-person-block');

        block.innerHTML = `
            <div class="photo-container">
                <div class="photo-bg" style="background-image: url('${photoUrl}')"></div>
                <img src="${photoUrl}" alt="Foto" class="birthday-photo">
            </div>
            <h2 class="birthday-name">${person.name}</h2>
            <p class="birthday-text">¡Feliz Cumpleaños! 🎂</p>
            <p class="birthday-age">Cumple ${age} años</p>
        `;

        birthdayListContainer.appendChild(block);
    });

    events.forEach(evt => {
        const evtInfo = eventTypes[evt.type] || eventTypes['default'];

        const block = document.createElement('div');
        block.classList.add('birthday-person-block');
        block.style.borderColor = evtInfo.color;

        const whatsappMsg = `Hola Juan, pasaba por acá a confirmarte la asistencia para:\n\n*${evt.title}*\n* Fecha: ${evt.date}\n* Hora: ${evt.time || 'TBD'}\n* Lugar: ${evt.location || 'Por definir'}`;
        const whatsappUrl = `https://wa.me/573219384844?text=${encodeURIComponent(whatsappMsg)}`;

        block.innerHTML = `
            <div style="font-size: 3rem; text-align: center; margin-bottom: 10px;">${evtInfo.emoji}</div>
            <h2 class="birthday-name" style="color: ${evtInfo.color};">${evt.title}</h2>
            <p class="birthday-text" style="margin-bottom: 5px;">
                📍 ${evt.location || 'Por definir'} &nbsp;|&nbsp; 🕒 ${evt.time || 'Hora por definir'}
            </p>
            <p class="birthday-text" style="color: rgba(248, 250, 252, 0.7); font-size: 1rem;">${evt.description || ''}</p>
            <div style="margin-top: 15px;">
                <a href="${whatsappUrl}" target="_blank" style="display: inline-flex; align-items: center; gap: 8px; background-color: #25D366; color: white; padding: 10px 20px; border-radius: 20px; text-decoration: none; font-weight: bold; font-size: 0.9rem; transition: transform 0.2s;">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    Confirmar Asistencia
                </a>
            </div>
        `;

        birthdayListContainer.appendChild(block);
    });

    birthdayModal.classList.add('active');
}

closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        birthdayModal.classList.remove('active');
        preModal.classList.remove('active');
    });
});

window.addEventListener('click', (e) => {
    if (e.target === birthdayModal) birthdayModal.classList.remove('active');
    if (e.target === preModal) preModal.classList.remove('active');
});

function generateIntroPersonHTML(person) {
    const firstName = person.name.split(' ')[0];
    const photoUrl = `photos/${person.photo}`;
    return `
        <div class="intro-person">
            <div class="photo-container">
                <div class="photo-bg" style="background-image: url('${photoUrl}')"></div>
                <img src="${photoUrl}" alt="Foto" class="birthday-photo">
            </div>
            <div class="intro-name">${firstName}</div>
        </div>
    `;
}

function generateSidebarPersonHTML(person) {
    const firstName = person.name.split(' ')[0];
    const photoUrl = `photos/${person.photo}`;
    return `
        <div class="sidebar-person" data-name="${person.name}">
            <div class="sidebar-photo-container">
                <div class="sidebar-photo-bg" style="background-image: url('${photoUrl}')"></div>
                <img src="${photoUrl}" alt="Foto" class="sidebar-photo">
            </div>
            <div class="sidebar-name">${firstName}</div>
        </div>
    `;
}

function runIntroAnimation() {
    const chicosListIntro = document.getElementById('chicos-list-intro');

    const coordis = birthdaysData.filter(p => p.isCoordi);
    const chicos = birthdaysData.filter(p => !p.isCoordi);

    // Populate intro screen (only chicos now)
    if (chicosListIntro) {
        chicosListIntro.innerHTML = chicos.map(generateIntroPersonHTML).join('');
    }

    // Populate sidebars
    const sidebarCoordis = document.getElementById('sidebar-coordis');
    const sidebarChicos = document.getElementById('sidebar-chicos');
    if (sidebarCoordis) sidebarCoordis.innerHTML = coordis.map(generateSidebarPersonHTML).join('');
    if (sidebarChicos) sidebarChicos.innerHTML = chicos.map(generateSidebarPersonHTML).join('');

    const introScreen = document.getElementById('intro-screen');
    const introStep = document.getElementById('intro-step');
    const mainApp = document.getElementById('main-app');

    // Sequence
    setTimeout(() => {
        // Hide intro screen completely
        if (introScreen) introScreen.classList.remove('active');
        if (introStep) introStep.classList.remove('active');

        // Show main app after intro fades out
        setTimeout(() => {
            if (mainApp) mainApp.classList.add('active');
        }, 1000); // Matches the 1s CSS transition

    }, 4500); // Intro duration
}

// Initialize
loadData();
runIntroAnimation();
