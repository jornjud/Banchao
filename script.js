// ฟังก์ชันสำหรับจัดการ Local Storage
function getData(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// ฟังก์ชันสำหรับการส่งออกข้อมูล
function exportData() {
    const data = {
        tenants: getData('tenants'),
        properties: getData('properties'),
        payments: getData('payments')
    };
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "rental_data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ฟังก์ชันสำหรับการนำเข้าข้อมูล
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        try {
            const data = JSON.parse(content);
            if (data.tenants && data.properties && data.payments) {
                saveData('tenants', data.tenants);
                saveData('properties', data.properties);
                saveData('payments', data.payments);
                alert('นำเข้าข้อมูลสำเร็จ');
                location.reload();
            } else {
                alert('รูปแบบไฟล์ไม่ถูกต้อง');
            }
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
        }
    };
    reader.readAsText(file);
}

// ฟังก์ชันสำหรับจัดรูปแบบวันที่เป็น dd/mm/yyyy
function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

// ฟังก์ชันตรวจสอบว่าการชำระเงินเป็นของเดือนนี้หรือไม่
function isPaymentThisMonth(payment) {
    const paymentDate = new Date(payment.date);
    const now = new Date();
    return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
}

// ฟังก์ชันตรวจสอบว่าผู้เช่าค้างชำระหรือไม่
function isTenantOverdue(tenant) {
    const payments = getData('payments');
    const lastPayment = payments.filter(p => p.tenantId === tenant.id).sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const now = new Date();
    const dueDate = new Date(tenant.startDate);
    const monthsElapsed = Math.floor((now.getFullYear() - dueDate.getFullYear()) * 12 + now.getMonth() - dueDate.getMonth());
    dueDate.setMonth(dueDate.getMonth() + monthsElapsed);

    if (lastPayment) {
        const lastPaymentDate = new Date(lastPayment.date);
        return lastPaymentDate < dueDate;
    } else {
        return now > dueDate;
    }
}

// ฟังก์ชันสำหรับโหลดตัวเลือกสถานที่เช่า
function loadPropertyOptions() {
    const properties = getData('properties');
    const propertySelect = document.getElementById('tenantProperty');
    if (propertySelect) {
        propertySelect.innerHTML = '';
        properties.forEach(property => {
            const option = document.createElement('option');
            option.value = property.id;
            option.textContent = property.name;
            propertySelect.appendChild(option);
        });
    }
}

// ฟังก์ชันสำหรับโหลดตัวเลือกผู้เช่า
function loadTenantOptions() {
    const tenants = getData('tenants');
    const tenantSelect = document.getElementById('paymentTenant');
    if (tenantSelect) {
        tenantSelect.innerHTML = '';
        tenants.forEach(tenant => {
            const option = document.createElement('option');
            option.value = tenant.id;
            option.textContent = tenant.name;
            tenantSelect.appendChild(option);
        });
    }
}

// ฟังก์ชันสำหรับอัปเดตแดชบอร์ด
function updateDashboard() {
    const tenants = getData('tenants');
    const properties = getData('properties');
    const payments = getData('payments');
    const overdueTenants = tenants.filter(isTenantOverdue);

    document.getElementById('totalTenants').textContent = tenants.length;
    document.getElementById('totalProperties').textContent = properties.length;

    let monthlyIncome = payments.filter(isPaymentThisMonth).reduce((sum, payment) => sum + payment.amount, 0);
    document.getElementById('monthlyIncome').textContent = `${monthlyIncome} บาท`;

    document.getElementById('overdueTenants').textContent = overdueTenants.length;
}

// ฟังก์ชันสำหรับจัดการผู้เช่า
function displayTenants() {
    const tenants = getData('tenants');
    const properties = getData('properties');
    const tenantTable = document.getElementById('tenantTable');
    if (!tenantTable) return;
    
    tenantTable.innerHTML = '';

    tenants.forEach((tenant, index) => {
        const tr = document.createElement('tr');

        const tdName = document.createElement('td');
        const tenantLink = document.createElement('a');
        tenantLink.href = `tenant-details.html?id=${tenant.id}`;
        tenantLink.textContent = tenant.name;
        tdName.appendChild(tenantLink);
        tr.appendChild(tdName);

        const tdProperty = document.createElement('td');
        const property = properties.find(p => p.id === tenant.propertyId);
        tdProperty.textContent = property ? property.name : 'N/A';
        tr.appendChild(tdProperty);

        const tdRent = document.createElement('td');
        tdRent.textContent = tenant.rent;
        tr.appendChild(tdRent);

        const tdStartDate = document.createElement('td');
        tdStartDate.textContent = formatDate(tenant.startDate);
        tr.appendChild(tdStartDate);

        const tdActions = document.createElement('td');
        const editBtn = document.createElement('button');
        editBtn.textContent = 'แก้ไข';
        editBtn.onclick = () => editTenant(index);
        tdActions.appendChild(editBtn);

        const delBtn = document.createElement('button');
        delBtn.textContent = 'ลบ';
        delBtn.onclick = () => deleteTenant(index);
        tdActions.appendChild(delBtn);

        tr.appendChild(tdActions);

        tenantTable.appendChild(tr);
    });
}

function addTenant() {
    document.getElementById('tenantFormTitle').textContent = 'เพิ่มผู้เช่า';
    document.getElementById('tenantName').value = '';
    document.getElementById('tenantIdCard').value = '';
    document.getElementById('tenantPhone').value = '';
    document.getElementById('tenantRent').value = '';
    document.getElementById('tenantStartDate').value = '';
    document.getElementById('tenantProperty').value = '';
    document.getElementById('saveTenant').onclick = saveNewTenant;
    document.getElementById('tenantForm').style.display = 'block';
}

function saveNewTenant() {
    const tenants = getData('tenants');
    const tenant = {
        id: Date.now(),
        name: document.getElementById('tenantName').value,
        idCard: document.getElementById('tenantIdCard').value,
        phone: document.getElementById('tenantPhone').value,
        propertyId: parseInt(document.getElementById('tenantProperty').value),
        rent: parseFloat(document.getElementById('tenantRent').value),
        startDate: document.getElementById('tenantStartDate').value
    };
    tenants.push(tenant);
    saveData('tenants', tenants);
    document.getElementById('tenantForm').style.display = 'none';
    displayTenants();
}

function editTenant(index) {
    const tenants = getData('tenants');
    const tenant = tenants[index];
    document.getElementById('tenantFormTitle').textContent = 'แก้ไขผู้เช่า';
    document.getElementById('tenantName').value = tenant.name;
    document.getElementById('tenantIdCard').value = tenant.idCard;
    document.getElementById('tenantPhone').value = tenant.phone;
    document.getElementById('tenantRent').value = tenant.rent;
    document.getElementById('tenantStartDate').value = tenant.startDate;
    document.getElementById('tenantProperty').value = tenant.propertyId;
    document.getElementById('saveTenant').onclick = () => saveEditedTenant(index);
    document.getElementById('tenantForm').style.display = 'block';
}

function saveEditedTenant(index) {
    const tenants = getData('tenants');
    tenants[index] = {
        ...tenants[index],
        name: document.getElementById('tenantName').value,
        idCard: document.getElementById('tenantIdCard').value,
        phone: document.getElementById('tenantPhone').value,
        propertyId: parseInt(document.getElementById('tenantProperty').value),
        rent: parseFloat(document.getElementById('tenantRent').value),
        startDate: document.getElementById('tenantStartDate').value
    };
    saveData('tenants', tenants);
    document.getElementById('tenantForm').style.display = 'none';
    displayTenants();
}

function deleteTenant(index) {
    const tenants = getData('tenants');
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบผู้เช่านี้?')) {
        tenants.splice(index, 1);
        saveData('tenants', tenants);
        displayTenants();
    }
}

// ฟังก์ชันสำหรับจัดการสถานที่เช่า
function displayProperties() {
    const properties = getData('properties');
    const tenants = getData('tenants');
    const propertyTable = document.getElementById('propertyTable');
    if (!propertyTable) return;
    
    propertyTable.innerHTML = '';

    properties.forEach((property, index) => {
        const tr = document.createElement('tr');

        const tdName = document.createElement('td');
        tdName.textContent = property.name;
        tr.appendChild(tdName);

        const tdAddress = document.createElement('td');
        tdAddress.textContent = property.address;
        tr.appendChild(tdAddress);

        const tdTenant = document.createElement('td');
        const tenant = tenants.find(t => t.propertyId === property.id);
        tdTenant.textContent = tenant ? tenant.name : 'ว่าง';
        tr.appendChild(tdTenant);

        const tdActions = document.createElement('td');
        const editBtn = document.createElement('button');
        editBtn.textContent = 'แก้ไข';
        editBtn.onclick = () => editProperty(index);
        tdActions.appendChild(editBtn);

        const delBtn = document.createElement('button');
        delBtn.textContent = 'ลบ';
        delBtn.onclick = () => deleteProperty(index);
        tdActions.appendChild(delBtn);

        tr.appendChild(tdActions);

        propertyTable.appendChild(tr);
    });
}

function addProperty() {
    document.getElementById('propertyFormTitle').textContent = 'เพิ่มสถานที่เช่า';
    document.getElementById('propertyName').value = '';
    document.getElementById('propertyAddress').value = '';
    document.getElementById('saveProperty').onclick = saveNewProperty;
    document.getElementById('propertyForm').style.display = 'block';
}

function saveNewProperty() {
    const properties = getData('properties');
    const property = {
        id: Date.now(),
        name: document.getElementById('propertyName').value,
        address: document.getElementById('propertyAddress').value
    };
    properties.push(property);
    saveData('properties', properties);
    document.getElementById('propertyForm').style.display = 'none';
    displayProperties();
}

function editProperty(index) {
    const properties = getData('properties');
    const property = properties[index];
    document.getElementById('propertyFormTitle').textContent = 'แก้ไขสถานที่เช่า';
    document.getElementById('propertyName').value = property.name;
    document.getElementById('propertyAddress').value = property.address;
    document.getElementById('saveProperty').onclick = () => saveEditedProperty(index);
    document.getElementById('propertyForm').style.display = 'block';
}

function saveEditedProperty(index) {
    const properties = getData('properties');
    properties[index] = {
        ...properties[index],
        name: document.getElementById('propertyName').value,
        address: document.getElementById('propertyAddress').value
    };
    saveData('properties', properties);
    document.getElementById('propertyForm').style.display = 'none';
    displayProperties();
}

function deleteProperty(index) {
    const properties = getData('properties');
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบสถานที่เช่านี้?')) {
        properties.splice(index, 1);
        saveData('properties', properties);
        displayProperties();
    }
}

// ฟังก์ชันสำหรับจัดการการชำระเงิน
function displayPayments() {
    const payments = getData('payments');
    const tenants = getData('tenants');
    const properties = getData('properties');
    const paymentTable = document.getElementById('paymentTable');
    if (!paymentTable) return;
    
    paymentTable.innerHTML = '';

    payments.forEach((payment, index) => {
        const tr = document.createElement('tr');

        const tenant = tenants.find(t => t.id === payment.tenantId);
        const property = properties.find(p => p.id === tenant.propertyId);

        const tdTenant = document.createElement('td');
        tdTenant.textContent = tenant ? tenant.name : 'N/A';
        tr.appendChild(tdTenant);

        const tdProperty = document.createElement('td');
        tdProperty.textContent = property ? property.name : 'N/A';
        tr.appendChild(tdProperty);

        const tdDate = document.createElement('td');
        tdDate.textContent = formatDate(payment.date);
        tr.appendChild(tdDate);

        const tdAmount = document.createElement('td');
        tdAmount.textContent = payment.amount;
        tr.appendChild(tdAmount);

        const tdActions = document.createElement('td');
        const editBtn = document.createElement('button');
        editBtn.textContent = 'แก้ไข';
        editBtn.onclick = () => editPayment(index);
        tdActions.appendChild(editBtn);

        const delBtn = document.createElement('button');
        delBtn.textContent = 'ลบ';
        delBtn.onclick = () => deletePayment(index);
        tdActions.appendChild(delBtn);

        tr.appendChild(tdActions);

        paymentTable.appendChild(tr);
    });
}

function addPayment() {
    document.getElementById('paymentFormTitle').textContent = 'บันทึกการชำระเงิน';
    loadTenantOptions();
    document.getElementById('paymentTenant').value = '';
    document.getElementById('paymentDate').value = '';
    document.getElementById('paymentAmount').value = '';
    document.getElementById('savePayment').onclick = savePayment;
    document.getElementById('paymentForm').style.display = 'block';
}

function savePayment() {
    const payments = getData('payments');
    const payment = {
        id: Date.now(),
        tenantId: parseInt(document.getElementById('paymentTenant').value),
        date: document.getElementById('paymentDate').value,
        amount: parseFloat(document.getElementById('paymentAmount').value)
    };
    payments.push(payment);
    saveData('payments', payments);
    document.getElementById('paymentForm').style.display = 'none';
    displayPayments();
}

function editPayment(index) {
    const payments = getData('payments');
    const payment = payments[index];
    document.getElementById('paymentFormTitle').textContent = 'แก้ไขการชำระเงิน';
    loadTenantOptions();
    document.getElementById('paymentTenant').value = payment.tenantId;
    document.getElementById('paymentDate').value = payment.date;
    document.getElementById('paymentAmount').value = payment.amount;
    document.getElementById('savePayment').onclick = () => saveEditedPayment(index);
    document.getElementById('paymentForm').style.display = 'block';
}

function saveEditedPayment(index) {
    const payments = getData('payments');
    payments[index] = {
        ...payments[index],
        tenantId: parseInt(document.getElementById('paymentTenant').value),
        date: document.getElementById('paymentDate').value,
        amount: parseFloat(document.getElementById('paymentAmount').value)
    };
    saveData('payments', payments);
    document.getElementById('paymentForm').style.display = 'none';
    displayPayments();
}

function deletePayment(index) {
    const payments = getData('payments');
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบการชำระเงินนี้?')) {
        payments.splice(index, 1);
        saveData('payments', payments);
        displayPayments();
    }
}

// ฟังก์ชันสำหรับแสดงผู้เช่าที่ค้างชำระ
function displayOverdueTenants() {
    const tenants = getData('tenants');
    const properties = getData('properties');
    const overdueTable = document.getElementById('overdueTable');
    if (!overdueTable) return;

    overdueTable.innerHTML = '';

    const overdueTenants = tenants.filter(isTenantOverdue);

    overdueTenants.forEach(tenant => {
        const tr = document.createElement('tr');

        const tdName = document.createElement('td');
        const tenantLink = document.createElement('a');
        tenantLink.href = `tenant-details.html?id=${tenant.id}`;
        tenantLink.textContent = tenant.name;
        tdName.appendChild(tenantLink);
        tr.appendChild(tdName);

        const property = properties.find(p => p.id === tenant.propertyId);
        const tdProperty = document.createElement('td');
        tdProperty.textContent = property ? property.name : 'N/A';
        tr.appendChild(tdProperty);

        const dueDate = new Date(tenant.startDate);
        const now = new Date();
        const monthsElapsed = Math.floor((now.getFullYear() - dueDate.getFullYear()) * 12 + now.getMonth() - dueDate.getMonth());
        dueDate.setMonth(dueDate.getMonth() + monthsElapsed);

        const tdDueDate = document.createElement('td');
        tdDueDate.textContent = formatDate(dueDate);
        tr.appendChild(tdDueDate);

        const tdAmount = document.createElement('td');
        tdAmount.textContent = tenant.rent;
        tr.appendChild(tdAmount);

        overdueTable.appendChild(tr);
    });
}

// ฟังก์ชันสำหรับแสดงรายละเอียดผู้เช่า
function displayTenantDetails() {
    const tenants = getData('tenants');
    const payments = getData('payments');
    const properties = getData('properties');
    const urlParams = new URLSearchParams(window.location.search);
    const tenantId = parseInt(urlParams.get('id'));
    const tenant = tenants.find(t => t.id === tenantId);

    if (tenant) {
        const property = properties.find(p => p.id === tenant.propertyId);
        const tenantDetailsDiv = document.getElementById('tenantDetails');
        if (tenantDetailsDiv) {
            tenantDetailsDiv.innerHTML = `
                <p><strong>ชื่อผู้เช่า:</strong> ${tenant.name}</p>
                <p><strong>เลขบัตรประชาชน:</strong> ${tenant.idCard}</p>
                <p><strong>เบอร์โทรศัพท์:</strong> ${tenant.phone}</p>
                <p><strong>สถานที่เช่า:</strong> ${property ? property.name : 'N/A'}</p>
                <p><strong>ค่าเช่า (บาท/เดือน):</strong> ${tenant.rent}</p>
                <p><strong>วันที่เริ่มสัญญา:</strong> ${formatDate(tenant.startDate)}</p>
            `;
        }

        const tenantPayments = payments.filter(p => p.tenantId === tenantId);
        const paymentHistoryTable = document.getElementById('tenantPaymentHistory');
        if (paymentHistoryTable) {
            paymentHistoryTable.innerHTML = '';

            tenantPayments.forEach(payment => {
                const tr = document.createElement('tr');
                const tdDate = document.createElement('td');
                tdDate.textContent = formatDate(payment.date);
                tr.appendChild(tdDate);

                const tdAmount = document.createElement('td');
                tdAmount.textContent = payment.amount;
                tr.appendChild(tdAmount);

                paymentHistoryTable.appendChild(tr);
            });
        }
    } else {
        alert('ไม่พบข้อมูลผู้เช่า');
    }
}

// ฟังก์ชันสำหรับสร้างรายงานรายได้
function generateIncomeReport() {
    const payments = getData('payments');
    const reportContent = document.getElementById('reportContent');
    
    // สร้างรายงานรายได้รายเดือน
    const monthlyIncome = {};
    payments.forEach(payment => {
        const date = new Date(payment.date);
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
        if (!monthlyIncome[monthYear]) {
            monthlyIncome[monthYear] = 0;
        }
        monthlyIncome[monthYear] += payment.amount;
    });

    let report = '<h3>รายงานรายได้</h3><table><tr><th>เดือน/ปี</th><th>รายได้ (บาท)</th></tr>';
    for (const [monthYear, income] of Object.entries(monthlyIncome)) {
        report += `<tr><td>${monthYear}</td><td>${income}</td></tr>`;
    }
    report += '</table>';

    reportContent.innerHTML = report;
}

// ฟังก์ชันสำหรับสร้างรายงานผู้เช่าที่ค้างชำระ
function generateOverdueReport() {
    const tenants = getData('tenants');
    const properties = getData('properties');
    const reportContent = document.getElementById('reportContent');

    const overdueTenants = tenants.filter(isTenantOverdue);

    let report = '<h3>รายงานผู้เช่าที่ค้างชำระ</h3><table><tr><th>ชื่อผู้เช่า</th><th>สถานที่เช่า</th><th>จำนวนเงินที่ค้าง (บาท)</th></tr>';
    overdueTenants.forEach(tenant => {
        const property = properties.find(p => p.id === tenant.propertyId);
        report += `<tr><td>${tenant.name}</td><td>${property ? property.name : 'N/A'}</td><td>${tenant.rent}</td></tr>`;
    });
    report += '</table>';

    reportContent.innerHTML = report;
}

// ฟังก์ชันสำหรับสร้างรายงานอัตราการเช่า
function generateOccupancyReport() {
    const properties = getData('properties');
    const tenants = getData('tenants');
    const reportContent = document.getElementById('reportContent');

    const totalProperties = properties.length;
    const occupiedProperties = tenants.length;
    const occupancyRate = (occupiedProperties / totalProperties) * 100;

    let report = `<h3>รายงานอัตราการเช่า</h3>
                  <p>จำนวนสถานที่เช่าทั้งหมด: ${totalProperties}</p>
                  <p>จำนวนสถานที่เช่าที่มีผู้เช่า: ${occupiedProperties}</p>
                  <p>อัตราการเช่า: ${occupancyRate.toFixed(2)}%</p>`;

    reportContent.innerHTML = report;
}

// เพิ่มฟังก์ชันนี้ก่อนฟังก์ชัน initReportButtons()
function generateRentIncomeReport() {
    const tenants = getData('tenants');
    const payments = getData('payments');
    const reportContent = document.getElementById('reportContent');

    let rentIncome = {};
    let totalIncome = 0;

    tenants.forEach(tenant => {
        rentIncome[tenant.id] = {
            name: tenant.name,
            income: 0
        };
    });

    payments.forEach(payment => {
        if (rentIncome[payment.tenantId]) {
            rentIncome[payment.tenantId].income += payment.amount;
            totalIncome += payment.amount;
        }
    });

    let report = '<h3>รายงานยอดรายรับค่าเช่า</h3><table><tr><th>ชื่อผู้เช่า</th><th>ยอดรายรับค่าเช่า (บาท)</th></tr>';
    
    for (const [tenantId, data] of Object.entries(rentIncome)) {
        if (data.income > 0) {
            report += `<tr><td>${data.name}</td><td>${data.income.toFixed(2)}</td></tr>`;
        }
    }

    report += `<tr><th>ยอดรวมทั้งหมด</th><th>${totalIncome.toFixed(2)}</th></tr>`;
    report += '</table>';

    reportContent.innerHTML = report;
}

// เพิ่ม event listeners สำหรับปุ่มรายงานต่างๆ
function initReportButtons() {
    document.getElementById('incomeReportBtn').addEventListener('click', generateIncomeReport);
    document.getElementById('overdueReportBtn').addEventListener('click', generateOverdueReport);
    document.getElementById('occupancyReportBtn').addEventListener('click', generateOccupancyReport);
    document.getElementById('rentIncomeReportBtn').addEventListener('click', generateRentIncomeReport);
}

// เริ่มต้นการทำงาน
window.onload = function() {
    const path = window.location.pathname;
    const page = path.split("/").pop();

    if (page === 'index.html' || page === '') {
        updateDashboard();
        document.getElementById('exportDataBtn').onclick = exportData;
        document.getElementById('importDataBtn').onclick = () => document.getElementById('importFile').click();
        document.getElementById('importFile').onchange = importData;
    }

    if (page === 'tenants.html') {
        displayTenants();
        loadPropertyOptions();
        document.getElementById('addTenantBtn').onclick = addTenant;
        document.getElementById('closeTenantForm').onclick = () => document.getElementById('tenantForm').style.display = 'none';
    }

    if (page === 'properties.html') {
        displayProperties();
        document.getElementById('addPropertyBtn').onclick = addProperty;
        document.getElementById('closePropertyForm').onclick = () => document.getElementById('propertyForm').style.display = 'none';
    }

    if (page === 'payments.html') {
        displayPayments();
        document.getElementById('addPaymentBtn').onclick = addPayment;
        document.getElementById('closePaymentForm').onclick = () => document.getElementById('paymentForm').style.display = 'none';
    }

    if (page === 'overdue.html') {
        displayOverdueTenants();
    }

    if (page === 'tenant-details.html') {
        displayTenantDetails();
    }

    if (page === 'reports.html') {
        // สามารถเพิ่มฟังก์ชันสำหรับสร้างรายงานเพิ่มเติมได้ที่นี่
    }
	
	if (page === 'reports.html') {
        initReportButtons();
    }

    // Event listener สำหรับการปิดโมดัลเมื่อคลิกนอกกรอบ
    window.onclick = (event) => {
        const modals = document.getElementsByClassName('modal');
        for (let modal of modals) {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        }
    };
};