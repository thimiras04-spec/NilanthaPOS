// pdf_generator.js
document.addEventListener('DOMContentLoaded', () => {

    // Bind buttons
    const btnCurrentReport = document.getElementById('btnCurrentReport');
    const btnWeeklyReport = document.getElementById('btnWeeklyReport');
    const btnMonthlyReport = document.getElementById('btnMonthlyReport');
    const btnAnnualReport = document.getElementById('btnAnnualReport');
    const annualReportYear = document.getElementById('annualReportYear');
    const btnClearData = document.getElementById('btnClearData');

    // Populate available years from db
    function populateYears() {
        const db = JSON.parse(localStorage.getItem('pos_db')) || [];
        const years = new Set();
        db.forEach(r => {
            const y = new Date(r.date).getFullYear();
            if (!isNaN(y)) years.add(y);
        });
        
        const currentYear = new Date().getFullYear();
        years.add(currentYear);
        
        const sortedYears = Array.from(years).sort((a, b) => b - a);
        
        if (annualReportYear) {
            annualReportYear.innerHTML = '';
            sortedYears.forEach(year => {
                const opt = document.createElement('option');
                opt.value = year;
                opt.textContent = year;
                annualReportYear.appendChild(opt);
            });
        }
    }
    populateYears();

    btnCurrentReport.addEventListener('click', () => generateReport('today'));
    btnWeeklyReport.addEventListener('click', () => generateReport('weekly'));
    btnMonthlyReport.addEventListener('click', () => generateReport('monthly'));
    if (btnAnnualReport) {
        btnAnnualReport.addEventListener('click', () => generateReport('annual'));
    }

    btnClearData.addEventListener('click', () => {
        if (confirm("Are you sure you want to clear all saved data? This cannot be undone.")) {
            localStorage.removeItem('pos_db');
            alert("Database cleared.");
        }
    });

    function generateReport(period) {
        const db = JSON.parse(localStorage.getItem('pos_db')) || [];
        const now = new Date();
        now.setHours(0, 0, 0, 0); // start of today

        let filteredRecords = [];
        let dateRangeText = "";

        if (period === 'today') {
            filteredRecords = db.filter(r => {
                const rDate = new Date(r.date);
                return rDate >= now;
            });
            dateRangeText = `Date: ${now.toLocaleDateString()}`;
        }
        else if (period === 'weekly') {
            const lastWeek = new Date(now);
            lastWeek.setDate(lastWeek.getDate() - 7);
            filteredRecords = db.filter(r => {
                const rDate = new Date(r.date);
                return rDate >= lastWeek;
            });
            dateRangeText = `Period: ${lastWeek.toLocaleDateString()} to ${new Date().toLocaleDateString()}`;
        }
        else if (period === 'monthly') {
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            filteredRecords = db.filter(r => {
                const rDate = new Date(r.date);
                return rDate >= firstDayOfMonth;
            });
            dateRangeText = `Month: ${now.toLocaleDateString('default', { month: 'long', year: 'numeric' })}`;
        }
        else if (period === 'annual') {
            const selectedYear = annualReportYear ? parseInt(annualReportYear.value, 10) : now.getFullYear();
            filteredRecords = db.filter(r => {
                const rDate = new Date(r.date);
                return rDate.getFullYear() === selectedYear;
            });
            
            // Sort by month/date ascending
            filteredRecords.sort((a, b) => new Date(a.date) - new Date(b.date));
            
            dateRangeText = `Year: ${selectedYear}`;
        }

        buildPdfTable(filteredRecords, dateRangeText, period);
    }

    function buildPdfTable(records, dateRangeText, period) {
        document.getElementById('pdfDateRange').textContent = dateRangeText;
        const tableBody = document.getElementById('pdfTableBody');
        tableBody.innerHTML = '';

        let totalProfitAggregate = 0;

        if (records.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="5" style="text-align:center;">No records found for this period.</td>`;
            tableBody.appendChild(tr);
        } else {
            records.forEach(r => {
                const tr = document.createElement('tr');
                const d = new Date(r.date).toLocaleDateString();
                const cost = r.totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 });
                const price = r.myPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 });
                const profit = r.profit.toLocaleString('en-IN', { minimumFractionDigits: 2 });

                tr.innerHTML = `
                    <td>${d}</td>
                    <td>${r.clientName}</td>
                    <td>Rs. ${cost}</td>
                    <td>Rs. ${price}</td>
                    <td>Rs. ${profit}</td>
                `;
                tableBody.appendChild(tr);
                totalProfitAggregate += r.profit;
            });
        }

        document.getElementById('pdfTotalProfit').textContent = `Rs. ${totalProfitAggregate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

        // Trigger html2pdf
        const element = document.getElementById('pdfContent');
        const opt = {
            margin: 0.5,
            filename: `NIW_${period}_report.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        // Temporarily display block wrapper so html2canvas can read it
        const container = document.getElementById('pdfContainer');
        container.style.display = 'block';

        html2pdf().set(opt).from(element).save().then(() => {
            // Hide it again
            container.style.display = 'none';
        });
    }
});
