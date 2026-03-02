// app.js
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const clientNameInput = document.getElementById('clientName');
    const workDateTimeInput = document.getElementById('workDateTime');
    const btnUnlockGoods = document.getElementById('btnUnlockGoods');
    
    const sectionGoods = document.getElementById('section-goods');
    const goodsList = document.getElementById('goodsList');
    const btnAddGood = document.getElementById('btnAddGood');
    const totalCostDisplay = document.getElementById('totalCostDisplay');
    
    const sectionPricing = document.getElementById('section-pricing');
    const myPriceInput = document.getElementById('myPrice');
    const profitDisplay = document.getElementById('profitDisplay');
    const btnSaveRecord = document.getElementById('btnSaveRecord');

    // UI state Navigation
    const navHome = document.getElementById('navHome');
    const navReports = document.getElementById('navReports');
    const reportsModal = document.getElementById('reportsModal');
    const btnCloseReports = document.getElementById('btnCloseReports');

    // State Variables
    let totalCost = 0;
    let profit = 0;

    // Initialize DateTime
    function updateDateTime() {
        const now = new Date();
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        workDateTimeInput.value = now.toLocaleDateString('en-US', options);
    }
    updateDateTime();
    setInterval(updateDateTime, 60000); // Update every minute

    // Unlock Sections Validation
    btnUnlockGoods.addEventListener('click', () => {
        if (clientNameInput.value.trim() === '') {
            showToast('Please enter the client name first', 'error');
            return;
        }
        
        // Unlock
        sectionGoods.classList.remove('locked');
        sectionPricing.classList.remove('locked');

        // Scroll logic smooth
        sectionGoods.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Request Notification Permission on first user interaction
        if (Notification.permission !== "granted" && Notification.permission !== "denied") {
            Notification.requestPermission();
        }
    });

    // Add Goods Row
    btnAddGood.addEventListener('click', () => {
        const row = document.createElement('div');
        row.className = 'good-item';
        row.innerHTML = `
            <div class="form-group flex-2">
                <input type="text" class="good-name" placeholder="E.g. Welding Rods">
            </div>
            <div class="form-group flex-1">
                <input type="number" inputmode="decimal" class="good-cost" placeholder="0.00">
            </div>
        `;
        goodsList.appendChild(row);

        // Attach event listener to new input
        const newCostInput = row.querySelector('.good-cost');
        newCostInput.addEventListener('input', calculateTotals);
    });

    // Attach listener to initial good cost
    document.querySelector('.good-cost').addEventListener('input', calculateTotals);

    // Calculate Totals function
    function calculateTotals() {
        // Calculate Total Cost
        const costInputs = document.querySelectorAll('.good-cost');
        totalCost = 0;
        
        costInputs.forEach(input => {
            const val = parseFloat(input.value);
            if (!isNaN(val)) {
                totalCost += val;
            }
        });

        totalCostDisplay.textContent = `Rs. ${totalCost.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

        // Calculate Profit
        const myPrice = parseFloat(myPriceInput.value) || 0;
        profit = myPrice - totalCost;

        const formattedProfit = `Rs. ${profit.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        profitDisplay.textContent = formattedProfit;

        // Styling based on profit
        if (profit > 0 && myPrice > 0) {
            profitDisplay.className = 'positive';
            profitDisplay.textContent = `+ ${formattedProfit}`;
        } else if (profit < 0) {
            profitDisplay.className = 'negative';
        } else {
            profitDisplay.className = 'neutral';
        }
    }

    // My Price Input listener
    myPriceInput.addEventListener('input', calculateTotals);

    // Save Logic
    btnSaveRecord.addEventListener('click', () => {
        if (clientNameInput.value.trim() === '') {
            showToast('Client Name is required', 'error');
            return;
        }
        
        const myPrice = parseFloat(myPriceInput.value);
        if (isNaN(myPrice) || myPrice <= 0) {
            showToast('Please enter a valid Price', 'error');
            return;
        }

        // Collect Goods
        const goods = [];
        const rows = document.querySelectorAll('.good-item');
        rows.forEach(row => {
            const name = row.querySelector('.good-name').value.trim();
            const cost = parseFloat(row.querySelector('.good-cost').value) || 0;
            if (name !== '' || cost > 0) {
                goods.push({ name, cost });
            }
        });

        const record = {
            id: Date.now(),
            date: new Date().toISOString(),
            clientName: clientNameInput.value.trim(),
            goods: goods,
            totalCost: totalCost,
            myPrice: myPrice,
            profit: profit
        };

        // Save to DB (LocalStorage)
        let db = JSON.parse(localStorage.getItem('pos_db')) || [];
        db.push(record);
        localStorage.setItem('pos_db', JSON.stringify(db));

        showToast('Record saved successfully!');
        
        // Reset Form
        resetForm();
    });

    function resetForm() {
        clientNameInput.value = '';
        myPriceInput.value = '';
        updateDateTime(); // refresh time
        
        // Lock sections
        sectionGoods.classList.add('locked');
        sectionPricing.classList.add('locked');

        // Reset goods list to 1 item
        goodsList.innerHTML = `
            <div class="good-item">
                <div class="form-group flex-2">
                    <label>Goods Name</label>
                    <input type="text" class="good-name" placeholder="E.g. Steel Pipe">
                </div>
                <div class="form-group flex-1">
                    <label>Cost (LKR)</label>
                    <input type="number" inputmode="decimal" class="good-cost" placeholder="0.00">
                </div>
            </div>
        `;
        document.querySelector('.good-cost').addEventListener('input', calculateTotals);
        
        calculateTotals();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Modal Logic
    navReports.addEventListener('click', () => {
        reportsModal.classList.add('show');
    });

    btnCloseReports.addEventListener('click', () => {
        reportsModal.classList.remove('show');
    });

    // Toast Utility
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
        toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10); // animation frame
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400); // cleanup after animation
        }, 3000);
    }

    // --- Background Notification Loop (Every Minute) ---
    setInterval(() => {
        checkDailyNotification();
    }, 60000);

    function checkDailyNotification() {
        const now = new Date();
        const hour = now.getHours();
        const minutes = now.getMinutes();

        // 8:00 PM is 20:00
        if (hour === 20 && minutes === 0) {
            const todayStr = now.toDateString();
            const lastNotified = localStorage.getItem('last_notified_date');

            if (lastNotified !== todayStr) {
                // Calculate today's profit
                let db = JSON.parse(localStorage.getItem('pos_db')) || [];
                let todaysProfit = 0;
                
                db.forEach(record => {
                    const recordDate = new Date(record.date);
                    if (recordDate.toDateString() === todayStr) {
                        todaysProfit += record.profit;
                    }
                });

                showSystemNotification("Daily Profit Summary", `Today's Total Profit: Rs. ${todaysProfit.toLocaleString()}`);
                localStorage.setItem('last_notified_date', todayStr);
            }
        }
    }

    function showSystemNotification(title, body) {
        if (Notification.permission === "granted") {
            new Notification(title, {
                body: body,
                icon: 'images/logo.png' // Use the app logo as icon
            });
        }
    }
});
