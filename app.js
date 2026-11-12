// ===== Pokémon Card Portfolio Tracker =====

const STORAGE_KEY = 'pokemon_portfolio';
const API_BASE = 'https://api.pokemontcg.io/v2/cards';

// ===== State =====
let portfolio = loadPortfolio();
let selectedCard = null; // TCG API card data for the card being added
let editingCardId = null;

// ===== DOM References =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const dom = {
    // Dashboard
    statCount: $('#stat-count'),
    statMarket: $('#stat-market'),
    statCost: $('#stat-cost'),
    statProfit: $('#stat-profit'),
    // Grid
    cardGrid: $('#card-grid'),
    emptyState: $('#empty-state'),
    // Controls
    searchInput: $('#search-input'),
    sortSelect: $('#sort-select'),
    // Add Modal
    modalAdd: $('#modal-add'),
    modalAddClose: $('#modal-add-close'),
    btnAddCard: $('#btn-add-card'),
    // Steps
    stepUpload: $('#step-upload'),
    stepSelect: $('#step-select'),
    stepConfirm: $('#step-confirm'),
    // Upload
    uploadArea: $('#upload-area'),
    fileInput: $('#file-input'),
    uploadPlaceholder: $('#upload-placeholder'),
    uploadPreview: $('#upload-preview'),
    ocrStatus: $('#ocr-status'),
    // Manual search
    manualSearchInput: $('#manual-search-input'),
    btnManualSearch: $('#btn-manual-search'),
    // Search results
    searchResults: $('#search-results'),
    searchLoading: $('#search-loading'),
    searchEmpty: $('#search-empty'),
    btnBackUpload: $('#btn-back-upload'),
    // Confirm
    confirmImage: $('#confirm-image'),
    confirmName: $('#confirm-name'),
    confirmSet: $('#confirm-set'),
    confirmRarity: $('#confirm-rarity'),
    confirmNumber: $('#confirm-number'),
    confirmMarketPrice: $('#confirm-market-price'),
    buyPrice: $('#buy-price'),
    btnConfirmAdd: $('#btn-confirm-add'),
    btnBackSelect: $('#btn-back-select'),
    // Edit modal
    modalEdit: $('#modal-edit'),
    modalEditClose: $('#modal-edit-close'),
    editImage: $('#edit-image'),
    editName: $('#edit-name'),
    editSet: $('#edit-set'),
    editBuyPrice: $('#edit-buy-price'),
    btnEditSave: $('#btn-edit-save'),
    btnEditDelete: $('#btn-edit-delete'),
    // Refresh
    btnRefreshPrices: $('#btn-refresh-prices'),
    refreshOverlay: $('#refresh-overlay'),
    refreshProgress: $('#refresh-progress'),
    refreshStatus: $('#refresh-status'),
    // Toast
    toast: $('#toast'),
};

// ===== Storage =====
function loadPortfolio() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
        return [];
    }
}

function savePortfolio() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
}

// ===== Formatting =====
function formatEuro(value) {
    if (value == null || isNaN(value)) return '—';
    return value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

function formatPercent(value) {
    if (value == null || isNaN(value) || !isFinite(value)) return '';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
}

// ===== Dashboard =====
function updateDashboard() {
    const count = portfolio.length;
    let totalMarket = 0;
    let totalCost = 0;

    portfolio.forEach(card => {
        totalMarket += card.marketPrice || 0;
        totalCost += card.buyPrice || 0;
    });

    const totalProfit = totalMarket - totalCost;

    dom.statCount.textContent = count;
    dom.statMarket.textContent = formatEuro(totalMarket);
    dom.statCost.textContent = formatEuro(totalCost);
    dom.statProfit.textContent = formatEuro(totalProfit);

    dom.statProfit.className = 'stat-value';
    if (totalProfit > 0) dom.statProfit.classList.add('profit');
    else if (totalProfit < 0) dom.statProfit.classList.add('loss');
}

// ===== Render Cards =====
function renderCards() {
    const filter = dom.searchInput.value.toLowerCase().trim();
    const sort = dom.sortSelect.value;

    let cards = [...portfolio];

    // Filter
    if (filter) {
        cards = cards.filter(c =>
            c.name.toLowerCase().includes(filter) ||
            (c.set || '').toLowerCase().includes(filter) ||
            (c.number || '').toLowerCase().includes(filter)
        );
    }

    // Sort
    cards.sort((a, b) => {
        switch (sort) {
            case 'date-desc': return (b.addedAt || 0) - (a.addedAt || 0);
            case 'date-asc': return (a.addedAt || 0) - (b.addedAt || 0);
            case 'name-asc': return a.name.localeCompare(b.name);
            case 'name-desc': return b.name.localeCompare(a.name);
            case 'profit-desc': return getProfit(b) - getProfit(a);
            case 'profit-asc': return getProfit(a) - getProfit(b);
            case 'value-desc': return (b.marketPrice || 0) - (a.marketPrice || 0);
            case 'value-asc': return (a.marketPrice || 0) - (b.marketPrice || 0);
            default: return 0;
        }
    });

    dom.cardGrid.innerHTML = '';

    if (cards.length === 0 && portfolio.length === 0) {
        dom.emptyState.style.display = '';
        return;
    }

    dom.emptyState.style.display = 'none';

    if (cards.length === 0) {
        dom.cardGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--text-secondary);padding:2rem;">Keine Karten für diese Suche gefunden.</p>';
        return;
    }

    cards.forEach(card => {
        const profit = getProfit(card);
        const profitClass = profit > 0 ? 'positive' : profit < 0 ? 'negative' : 'neutral';
        const percentChange = card.buyPrice > 0 ? ((profit / card.buyPrice) * 100) : 0;

        const el = document.createElement('div');
        el.className = 'portfolio-card';
        el.dataset.id = card.id;
        el.innerHTML = `
            <div class="portfolio-card-image">
                <img src="${card.imageUrl}" alt="${card.name}" loading="lazy"
                     onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22280%22><rect fill=%22%231f2b47%22 width=%22200%22 height=%22280%22/><text x=%2250%25%22 y=%2250%25%22 fill=%22%2394a3b8%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2214%22>Kein Bild</text></svg>'">
                ${card.rarity ? `<span class="portfolio-card-rarity">${card.rarity}</span>` : ''}
            </div>
            <div class="portfolio-card-body">
                <div class="portfolio-card-name">${card.name}</div>
                <div class="portfolio-card-set">${card.set || ''}${card.number ? ' · ' + card.number : ''}</div>
                <div class="portfolio-card-prices">
                    <div class="price-block">
                        <span class="price-label">Kaufpreis</span>
                        <span class="price-value">${formatEuro(card.buyPrice)}</span>
                    </div>
                    <div class="price-block">
                        <span class="price-label">Marktwert</span>
                        <span class="price-value market">${formatEuro(card.marketPrice)}</span>
                    </div>
                </div>
                <div class="portfolio-card-profit">
                    <span class="profit-badge ${profitClass}">${profit >= 0 ? '+' : ''}${formatEuro(profit)}</span>
                    <span class="profit-percent">${formatPercent(percentChange)}</span>
                </div>
            </div>
        `;

        el.addEventListener('click', () => openEditModal(card.id));
        dom.cardGrid.appendChild(el);
    });
}

function getProfit(card) {
    return (card.marketPrice || 0) - (card.buyPrice || 0);
}

// ===== TCG API =====
async function searchTCGApi(query) {
    // Clean up the query
    query = query.trim();
    if (!query) return [];

    // Try as set number first (e.g., "sv1-25" or "base1-4")
    const setNumberMatch = query.match(/^([a-z0-9]+)-(\d+)$/i);

    let url;
    if (setNumberMatch) {
        url = `${API_BASE}?q=number:"${setNumberMatch[2]}" set.id:"${setNumberMatch[1]}"&pageSize=10`;
    } else {
        // Search by name — sanitize for the API query
        const safeName = query.replace(/["""]/g, '').replace(/\s+/g, ' ');
        url = `${API_BASE}?q=name:"${safeName}"&pageSize=12&orderBy=-set.releaseDate`;
    }

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = await res.json();
        return data.data || [];
    } catch (err) {
        console.error('TCG API error:', err);
        // Fallback: Try a less strict search
        try {
            const safeName = query.replace(/["""]/g, '').replace(/\s+/g, ' ');
            const fallbackUrl = `${API_BASE}?q=name:"${safeName}*"&pageSize=12&orderBy=-set.releaseDate`;
            const res = await fetch(fallbackUrl);
            if (!res.ok) return [];
            const data = await res.json();
            return data.data || [];
        } catch {
            return [];
        }
    }
}

function getMarketPrice(apiCard) {
    // Try cardmarket.prices.averageSellPrice first, then trendPrice, then tcgplayer
    const cm = apiCard.cardmarket?.prices;
    if (cm) {
        if (cm.averageSellPrice) return cm.averageSellPrice;
        if (cm.trendPrice) return cm.trendPrice;
    }
    const tcg = apiCard.tcgplayer?.prices;
    if (tcg) {
        // Try holofoil, normal, reverseHolofoil, 1stEditionHolofoil
        for (const variant of ['holofoil', 'normal', 'reverseHolofoil', '1stEditionHolofoil', '1stEditionNormal']) {
            if (tcg[variant]?.market) return tcg[variant].market;
            if (tcg[variant]?.mid) return tcg[variant].mid;
        }
    }
    return 0;
}

// ===== OCR =====
async function performOCR(imageSource) {
    dom.ocrStatus.style.display = 'flex';

    try {
        const result = await Tesseract.recognize(imageSource, 'eng', {
            logger: info => {
                if (info.status === 'recognizing text') {
                    const pct = Math.round((info.progress || 0) * 100);
                    dom.ocrStatus.querySelector('span').textContent = `Text wird erkannt… ${pct}%`;
                }
            }
        });

        dom.ocrStatus.style.display = 'none';
        const text = result.data.text || '';
        return extractCardInfo(text);
    } catch (err) {
        console.error('OCR error:', err);
        dom.ocrStatus.style.display = 'none';
        return null;
    }
}

function extractCardInfo(ocrText) {
    const lines = ocrText.split('\n').map(l => l.trim()).filter(Boolean);

    // Try to extract set number (pattern like "123/456" or "SV1-025")
    let setNumber = null;
    for (const line of lines) {
        const match = line.match(/(\d{1,4}\s*\/\s*\d{1,4})/);
        if (match) {
            setNumber = match[1].replace(/\s/g, '');
            break;
        }
        const match2 = line.match(/([A-Za-z]{2,6}\d*[-]\d{1,4})/);
        if (match2) {
            setNumber = match2[1];
            break;
        }
    }

    // The card name is usually the first meaningful line (top of the card)
    // Filter out common noise: HP, Stage, Basic, numbers only, very short
    let cardName = null;
    for (const line of lines) {
        const cleaned = line.replace(/[^a-zA-ZäöüÄÖÜéèêàáâ\s'-]/g, '').trim();
        if (cleaned.length < 3) continue;
        if (/^(basic|stage|trainer|energy|item|supporter|stadium|hp|ex|gx|vstar|vmax|v\b)/i.test(cleaned)) continue;
        cardName = cleaned;
        break;
    }

    return { cardName, setNumber, rawText: ocrText };
}

// ===== Modal Management =====
function openAddModal() {
    selectedCard = null;
    showStep('upload');
    resetUpload();
    dom.modalAdd.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeAddModal() {
    dom.modalAdd.style.display = 'none';
    document.body.style.overflow = '';
}

function showStep(step) {
    dom.stepUpload.style.display = step === 'upload' ? '' : 'none';
    dom.stepSelect.style.display = step === 'select' ? '' : 'none';
    dom.stepConfirm.style.display = step === 'confirm' ? '' : 'none';
}

function resetUpload() {
    dom.fileInput.value = '';
    dom.uploadPreview.style.display = 'none';
    dom.uploadPlaceholder.style.display = '';
    dom.ocrStatus.style.display = 'none';
    dom.manualSearchInput.value = '';
    dom.searchResults.innerHTML = '';
    dom.searchEmpty.style.display = 'none';
    dom.searchLoading.style.display = 'none';
    dom.buyPrice.value = '';
}

// ===== Search and display results =====
async function doSearch(query) {
    showStep('select');
    dom.searchResults.innerHTML = '';
    dom.searchEmpty.style.display = 'none';
    dom.searchLoading.style.display = 'flex';

    const results = await searchTCGApi(query);

    dom.searchLoading.style.display = 'none';

    if (results.length === 0) {
        dom.searchEmpty.style.display = '';
        return;
    }

    results.forEach(card => {
        const price = getMarketPrice(card);
        const el = document.createElement('div');
        el.className = 'search-result-item';
        el.innerHTML = `
            <img src="${card.images?.small || ''}" alt="${card.name}" loading="lazy">
            <div class="search-result-info">
                <strong>${card.name}</strong>
                <span>${card.set?.name || ''} · ${card.number || ''} · ${card.rarity || ''}</span>
            </div>
            <span class="search-result-price">${price > 0 ? formatEuro(price) : '—'}</span>
        `;
        el.addEventListener('click', () => selectSearchResult(card));
        dom.searchResults.appendChild(el);
    });
}

function selectSearchResult(apiCard) {
    selectedCard = apiCard;
    const price = getMarketPrice(apiCard);

    dom.confirmImage.src = apiCard.images?.large || apiCard.images?.small || '';
    dom.confirmName.textContent = apiCard.name;
    dom.confirmSet.textContent = `Set: ${apiCard.set?.name || '—'}`;
    dom.confirmRarity.textContent = `Seltenheit: ${apiCard.rarity || '—'}`;
    dom.confirmNumber.textContent = `Nummer: ${apiCard.number || '—'}`;
    dom.confirmMarketPrice.textContent = price > 0 ? formatEuro(price) : '—';
    dom.buyPrice.value = '';

    showStep('confirm');
}

// ===== Add Card to Portfolio =====
function addCardToPortfolio() {
    if (!selectedCard) return;

    const buyPrice = parseFloat(dom.buyPrice.value) || 0;
    const marketPrice = getMarketPrice(selectedCard);

    const entry = {
        id: crypto.randomUUID(),
        tcgId: selectedCard.id,
        name: selectedCard.name,
        set: selectedCard.set?.name || '',
        setId: selectedCard.set?.id || '',
        number: selectedCard.number || '',
        rarity: selectedCard.rarity || '',
        imageUrl: selectedCard.images?.large || selectedCard.images?.small || '',
        marketPrice,
        buyPrice,
        addedAt: Date.now(),
    };

    portfolio.push(entry);
    savePortfolio();
    updateDashboard();
    renderCards();
    closeAddModal();
    showToast(`${entry.name} hinzugefügt!`);
}

// ===== Edit Modal =====
function openEditModal(cardId) {
    const card = portfolio.find(c => c.id === cardId);
    if (!card) return;

    editingCardId = cardId;
    dom.editImage.src = card.imageUrl;
    dom.editName.textContent = card.name;
    dom.editSet.textContent = `${card.set} · ${card.number}`;
    dom.editBuyPrice.value = card.buyPrice || '';
    dom.modalEdit.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeEditModal() {
    dom.modalEdit.style.display = 'none';
    document.body.style.overflow = '';
    editingCardId = null;
}

function saveEditCard() {
    const card = portfolio.find(c => c.id === editingCardId);
    if (!card) return;

    card.buyPrice = parseFloat(dom.editBuyPrice.value) || 0;
    savePortfolio();
    updateDashboard();
    renderCards();
    closeEditModal();
    showToast('Karte aktualisiert!');
}

function deleteCard() {
    if (!confirm('Karte wirklich löschen?')) return;

    portfolio = portfolio.filter(c => c.id !== editingCardId);
    savePortfolio();
    updateDashboard();
    renderCards();
    closeEditModal();
    showToast('Karte gelöscht.');
}

// ===== Refresh Prices =====
async function refreshAllPrices() {
    if (portfolio.length === 0) {
        showToast('Keine Karten zum Aktualisieren.');
        return;
    }

    dom.refreshOverlay.style.display = 'flex';
    dom.refreshProgress.style.width = '0%';
    dom.refreshStatus.textContent = `0 / ${portfolio.length}`;

    let updated = 0;

    for (let i = 0; i < portfolio.length; i++) {
        const card = portfolio[i];
        try {
            const res = await fetch(`${API_BASE}/${card.tcgId}`);
            if (res.ok) {
                const data = await res.json();
                const newPrice = getMarketPrice(data.data);
                if (newPrice > 0) {
                    card.marketPrice = newPrice;
                    updated++;
                }
            }
        } catch (err) {
            console.warn(`Preis-Update fehlgeschlagen für ${card.name}:`, err);
        }

        const progress = ((i + 1) / portfolio.length) * 100;
        dom.refreshProgress.style.width = `${progress}%`;
        dom.refreshStatus.textContent = `${i + 1} / ${portfolio.length}`;

        // Rate limiting — small delay between requests
        if (i < portfolio.length - 1) {
            await new Promise(r => setTimeout(r, 200));
        }
    }

    savePortfolio();
    updateDashboard();
    renderCards();

    dom.refreshOverlay.style.display = 'none';
    showToast(`${updated} Preis${updated !== 1 ? 'e' : ''} aktualisiert!`);
}

// ===== Toast =====
let toastTimeout;
function showToast(message) {
    clearTimeout(toastTimeout);
    dom.toast.textContent = message;
    dom.toast.style.display = '';
    toastTimeout = setTimeout(() => {
        dom.toast.style.display = 'none';
    }, 3000);
}

// ===== Event Listeners =====
function initEvents() {
    // Add card button
    dom.btnAddCard.addEventListener('click', openAddModal);

    // Close modals
    dom.modalAddClose.addEventListener('click', closeAddModal);
    dom.modalAdd.querySelector('.modal-overlay').addEventListener('click', closeAddModal);

    dom.modalEditClose.addEventListener('click', closeEditModal);
    dom.modalEdit.querySelector('.modal-overlay').addEventListener('click', closeEditModal);

    // File upload
    dom.uploadArea.addEventListener('click', () => dom.fileInput.click());

    dom.uploadArea.addEventListener('dragover', e => {
        e.preventDefault();
        dom.uploadArea.classList.add('dragover');
    });
    dom.uploadArea.addEventListener('dragleave', () => {
        dom.uploadArea.classList.remove('dragover');
    });
    dom.uploadArea.addEventListener('drop', e => {
        e.preventDefault();
        dom.uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });

    dom.fileInput.addEventListener('change', () => {
        if (dom.fileInput.files.length > 0) {
            handleFileUpload(dom.fileInput.files[0]);
        }
    });

    // Manual search
    dom.btnManualSearch.addEventListener('click', () => {
        const q = dom.manualSearchInput.value.trim();
        if (q) doSearch(q);
    });

    dom.manualSearchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            const q = dom.manualSearchInput.value.trim();
            if (q) doSearch(q);
        }
    });

    // Navigation
    dom.btnBackUpload.addEventListener('click', () => showStep('upload'));
    dom.btnBackSelect.addEventListener('click', () => showStep('select'));

    // Confirm add
    dom.btnConfirmAdd.addEventListener('click', addCardToPortfolio);

    // Edit modal
    dom.btnEditSave.addEventListener('click', saveEditCard);
    dom.btnEditDelete.addEventListener('click', deleteCard);

    // Refresh prices
    dom.btnRefreshPrices.addEventListener('click', refreshAllPrices);

    // Search & sort
    dom.searchInput.addEventListener('input', renderCards);
    dom.sortSelect.addEventListener('change', renderCards);

    // Close modal on Escape
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            if (dom.modalAdd.style.display !== 'none') closeAddModal();
            if (dom.modalEdit.style.display !== 'none') closeEditModal();
        }
    });
}

// ===== File Upload Handler =====
async function handleFileUpload(file) {
    if (!file.type.startsWith('image/')) {
        showToast('Bitte ein Bild hochladen.');
        return;
    }

    // Show preview
    const url = URL.createObjectURL(file);
    dom.uploadPreview.src = url;
    dom.uploadPreview.style.display = '';
    dom.uploadPlaceholder.style.display = 'none';

    // Run OCR
    const result = await performOCR(file);

    if (result) {
        // Build search query from OCR results
        let query = '';

        if (result.setNumber) {
            query = result.setNumber;
        } else if (result.cardName) {
            query = result.cardName;
        }

        if (query) {
            dom.manualSearchInput.value = query;
            await doSearch(query);
        } else {
            showToast('Konnte keinen Text erkennen. Bitte manuell suchen.');
        }
    } else {
        showToast('OCR fehlgeschlagen. Bitte manuell suchen.');
    }
}

// ===== Init =====
function init() {
    initEvents();
    updateDashboard();
    renderCards();
}

init();
