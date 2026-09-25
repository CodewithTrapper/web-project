const header = document.getElementById('header');
const scrollProgress = document.getElementById('scrollProgress');
const ctaTop = document.getElementById('ctaTop');
const navbar = document.getElementById('navbar');
const searchForm = document.getElementById('searchForm');
const cursorGlow = document.getElementById('cursorGlow');
const searchBox = document.getElementById('search-box');

const hasHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const updateScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
    header.classList.toggle('active', y > 40);
    ctaTop.classList.toggle('show', y > 400);
};

let ticking = false;
window.addEventListener('scroll', () => {
    if (!ticking) {
        requestAnimationFrame(() => {
            updateScroll();
            ticking = false;
        });
        ticking = true;
    }
}, { passive: true });

window.addEventListener('load', updateScroll);
updateScroll();

document.getElementById('menu-btn').addEventListener('click', () => navbar.classList.add('active'));
document.getElementById('nav-close').addEventListener('click', () => navbar.classList.remove('active'));
navbar.querySelectorAll('a').forEach(link => link.addEventListener('click', () => navbar.classList.remove('active')));

const normalize = (str) => String(str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const fuzzyScore = (query, target) => {
    if (!query) return 0;
    if (!target) return -1;

    const q = normalize(query);
    const t = normalize(target);

    if (t === q) return 1000;
    if (t.startsWith(q)) return 800 - t.length + q.length;
    if (t.includes(q)) return 500 - t.indexOf(q);

    let qi = 0;
    let score = 0;
    let lastMatch = -1;

    for (let ti = 0; ti < t.length && qi < q.length; ti++) {
        if (t[ti] === q[qi]) {
            score += lastMatch === ti - 1 ? 15 : 5;
            lastMatch = ti;
            qi++;
        }
    }

    return qi === q.length ? score - t.length * 0.1 : -1;
};

const buildSearchIndex = () => {
    const index = [];

    document.querySelectorAll('section[id]').forEach(section => {
        const heading = section.querySelector('h1, h2, h3');
        if (!heading) return;
        index.push({
            id: section.id,
            title: heading.textContent.trim().replace(/\s+/g, ' '),
            type: 'Section',
            context: section.textContent.trim().replace(/\s+/g, ' ').slice(0, 140),
            keywords: [section.id, 'section', 'page'],
            element: heading
        });
    });

    document.querySelectorAll('.category .box').forEach((box, i) => {
        const title = box.querySelector('h3')?.textContent.trim();
        const para = box.querySelector('p')?.textContent.trim();
        if (!title) return;
        box.dataset.searchId = `cat-${i}`;
        index.push({
            id: `cat-${i}`,
            title,
            type: 'Adventure',
            context: para || '',
            keywords: ['adventure', 'activity', 'outdoor', 'offer'],
            element: box
        });
    });

    document.querySelectorAll('.packages .box').forEach((box, i) => {
        const title = box.querySelector('h3')?.textContent.trim();
        const para = box.querySelector('p')?.textContent.trim();
        const price = box.querySelector('.price')?.textContent.trim();
        const tag = box.querySelector('.tag')?.textContent.trim();
        if (!title) return;
        box.dataset.searchId = `pkg-${i}`;
        index.push({
            id: `pkg-${i}`,
            title,
            type: 'Package',
            context: para || '',
            price: price || '',
            keywords: [tag, 'package', 'tour', 'safari', 'travel', 'trip'].filter(Boolean),
            element: box
        });
    });

    const contactHeading = document.querySelector('.contact-intro h1');
    if (contactHeading) {
        index.push({
            id: 'contact',
            title: 'Contact us',
            type: 'Section',
            context: 'Let\'s plan your next story. Tell us where you want to go.',
            keywords: ['contact', 'reach', 'email', 'phone', 'message', 'book'],
            element: contactHeading
        });
    }

    return index;
};

const searchIndex = buildSearchIndex();

const searchItems = (query) => {
    if (!query || !query.trim()) return [];

    const results = [];
    for (const item of searchIndex) {
        const haystacks = [
            { text: item.title, weight: 3 },
            { text: item.type, weight: 1.5 },
            { text: item.context, weight: 1 },
            ...(item.keywords || []).map(k => ({ text: k, weight: 1.2 }))
        ];

        let best = -1;
        for (const { text, weight } of haystacks) {
            const s = fuzzyScore(query, text);
            if (s > 0) best = Math.max(best, s * weight);
        }

        if (best > 0) results.push({ ...item, score: best });
    }

    return results.sort((a, b) => b.score - a.score).slice(0, 8);
};

const highlight = (text, query) => {
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${escaped})`, 'ig'), '<mark>$1</mark>');
};

let resultsPanel = null;
let activeIndex = -1;

const ensureResultsPanel = () => {
    if (resultsPanel) return resultsPanel;

    resultsPanel = document.createElement('div');
    resultsPanel.className = 'search-results';
    resultsPanel.setAttribute('role', 'listbox');
    resultsPanel.hidden = true;

    const form = searchForm.querySelector('form');
    form.insertAdjacentElement('afterend', resultsPanel);

    resultsPanel.addEventListener('click', (e) => {
        const item = e.target.closest('.search-result');
        if (!item) return;
        jumpToResult(resultsPanel._results[Number(item.dataset.index)]);
    });

    resultsPanel.addEventListener('mousemove', (e) => {
        const item = e.target.closest('.search-result');
        if (!item) return;
        setActiveResult(Number(item.dataset.index));
    });

    return resultsPanel;
};

const setActiveResult = (index) => {
    const panel = ensureResultsPanel();
    if (!panel._results) return;

    const items = panel.querySelectorAll('.search-result');
    items.forEach(el => el.classList.remove('active'));

    activeIndex = index;
    if (index >= 0 && index < items.length) {
        items[index].classList.add('active');
        items[index].scrollIntoView({ block: 'nearest' });
    }
};

const renderResults = (results, query) => {
    const panel = ensureResultsPanel();
    panel._results = results;
    activeIndex = -1;

    if (!query || !query.trim()) {
        panel.hidden = true;
        panel.innerHTML = '';
        return;
    }

    if (!results.length) {
        panel.hidden = false;
        panel.innerHTML = `
            <div class="search-empty">
                <i class="fas fa-compass"></i>
                <p>No results for "<strong>${query.replace(/</g, '&lt;')}</strong>"</p>
                <span>Try "safari", "beach", "mountain", or "contact".</span>
            </div>
        `;
        return;
    }

    panel.hidden = false;
    panel.innerHTML = results.map((r, i) => `
        <button type="button" class="search-result" data-index="${i}" role="option">
            <span class="search-result-icon"><i class="fas ${r.type === 'Package' ? 'fa-suitcase-rolling' : r.type === 'Adventure' ? 'fa-mountain' : 'fa-compass'}"></i></span>
            <span class="search-result-body">
                <span class="search-result-title">${highlight(r.title, query)}</span>
                <span class="search-result-meta">
                    <span class="search-result-type">${r.type}</span>
                    ${r.price ? `<span class="search-result-price">${r.price}</span>` : ''}
                </span>
                ${r.context ? `<span class="search-result-context">${highlight(r.context.slice(0, 100), query)}${r.context.length > 100 ? '…' : ''}</span>` : ''}
            </span>
            <span class="search-result-arrow"><i class="fas fa-arrow-right"></i></span>
        </button>
    `).join('');
};

const pulseTarget = (el) => {
    if (!el) return;
    el.classList.remove('search-pulse');
    void el.offsetWidth;
    el.classList.add('search-pulse');
    setTimeout(() => el.classList.remove('search-pulse'), 2000);
};

const jumpToResult = (result) => {
    if (!result) return;

    const target = result.element || document.getElementById(result.id);
    if (!target) return;

    const y = target.getBoundingClientRect().top + window.scrollY - 120;
    window.scrollTo({ top: y, behavior: 'smooth' });

    searchForm.hidePopover();
    searchBox.value = '';
    renderResults([], '');

    setTimeout(() => pulseTarget(target), 500);
};

const debounce = (fn, delay = 120) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
};

const runSearch = debounce((query) => {
    renderResults(searchItems(query), query);
}, 100);

const openSearch = () => {
    if (!searchForm.matches(':popover-open')) {
        searchForm.showPopover();
    }
    setTimeout(() => {
        searchBox.focus();
        if (searchBox.value) runSearch(searchBox.value);
    }, 250);
};

const closeSearch = () => {
    if (searchForm.matches(':popover-open')) {
        searchForm.hidePopover();
    }
    searchBox.value = '';
    renderResults([], '');
};

document.getElementById('search-btn').addEventListener('click', openSearch);
document.getElementById('close-search').addEventListener('click', closeSearch);

searchBox.addEventListener('input', (e) => runSearch(e.target.value));

searchBox.addEventListener('keydown', (e) => {
    const panel = ensureResultsPanel();
    const results = panel._results || [];

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!results.length) return;
        setActiveResult((activeIndex + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!results.length) return;
        setActiveResult((activeIndex - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
        e.preventDefault();
        const pick = activeIndex >= 0 ? results[activeIndex] : results[0];
        if (pick) jumpToResult(pick);
    }
});

searchForm.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const panel = ensureResultsPanel();
    const results = panel._results || [];
    const pick = activeIndex >= 0 ? results[activeIndex] : results[0];
    if (pick) jumpToResult(pick);
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeSearch();
        navbar.classList.remove('active');
    }
});

searchForm.addEventListener('toggle', (e) => {
    if (e.newState === 'closed') {
        searchBox.value = '';
        renderResults([], '');
    }
});

searchForm.addEventListener('click', (e) => {
    if (e.target === searchForm) closeSearch();
});

ctaTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

if (hasHover && !prefersReduced) {
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;

    window.addEventListener('mousemove', (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
    }, { passive: true });

    const animateGlow = () => {
        currentX += (targetX - currentX) * 0.12;
        currentY += (targetY - currentY) * 0.12;
        cursorGlow.style.transform = `translate(${currentX}px, ${currentY}px) translate(-50%, -50%)`;
        requestAnimationFrame(animateGlow);
    };

    animateGlow();
}

const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('in'), index * 90);
            obs.unobserve(entry.target);
        }
    });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

if (hasHover && !prefersReduced) {
    document.querySelectorAll('.tilt').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = `perspective(1000px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-8px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });

    document.querySelectorAll('.btn, .submit-btn').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.15}px, ${y * 0.25}px)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
        });
    });
}

let scrollRAF = false;
const syncScrollVar = () => {
    const y = window.scrollY;
    document.documentElement.style.setProperty('--scroll-y', y);
    scrollRAF = false;
};

window.addEventListener('scroll', () => {
    if (!scrollRAF) {
        requestAnimationFrame(syncScrollVar);
        scrollRAF = true;
    }
}, { passive: true });

syncScrollVar();

const staggerObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('in');
            obs.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

document.querySelectorAll('.category, .footer, .reveal-stagger').forEach(el => {
    staggerObserver.observe(el);
});

const cardGlowHandlers = () => {
    document.querySelectorAll('.category .box, .packages .box').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
            card.style.setProperty('--my', `${e.clientY - rect.top}px`);
        });
    });
};

if (window.matchMedia('(hover: hover)').matches) {
    cardGlowHandlers();
}