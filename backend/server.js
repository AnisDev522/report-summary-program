const express = require('express');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
const port = process.env.PORT || 5000;


const dataDir = path.join(__dirname, 'data');

app.get('/api/new-employees', (req, res) => {
    try {
        const candidateTeamMap = new Map();

        // 1. อ่านไฟล์ Daily Reports ทั้งหมดเพื่อหาว่าใครผ่านและอยู่ทีมไหน
        const files = fs.readdirSync(dataDir);
        files.forEach(file => {
            if (file.startsWith('Daily report_') && file.endsWith('.xls')) {
                // ดึงชื่อ Team Member จากชื่อไฟล์
                const parts = file.replace('.xls', '').split('_');
                const teamMember = `${parts[2]} ${parts[3]}`;

                const workbook = xlsx.readFile(path.join(dataDir, file));
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const reportData = xlsx.utils.sheet_to_json(sheet);

                reportData.forEach(row => {
                    if (row.Status && row.Status.toLowerCase() === 'pass') {
                        candidateTeamMap.set(row['Candidate Name'], teamMember);
                    }
                });
            }
        });

        // 2. อ่านไฟล์ New Employee
        let newEmployeeData = [];
        files.forEach(file => {
            if (file.startsWith('New Employee_') && file.endsWith('.xls')) {
                const workbook = xlsx.readFile(path.join(dataDir, file));
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                newEmployeeData = xlsx.utils.sheet_to_json(sheet);
            }
        });
        
        // 3. รวมข้อมูลเพื่อสร้างผลลัพธ์สุดท้าย
        const result = newEmployeeData.map(employee => {
            const teamMember = candidateTeamMap.get(employee['Employee Name']) || 'N/A';
            return {
                "Employee Name": employee['Employee Name'],
                "Join Date": employee['Join Date'],
                "Role": employee['Role'],
                "Team Member": teamMember
            };
        });

        res.json(result);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error processing files');
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`); 
});