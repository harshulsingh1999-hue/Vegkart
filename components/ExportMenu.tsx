
import React, { useState } from 'react';
import { ArrowPathIcon, DocumentTextIcon } from './ui/Icons';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportMenuProps {
    data: any[];
    filename: string;
    title?: string;
}

const ExportMenu: React.FC<ExportMenuProps> = ({ data, filename, title = 'Data Export' }) => {
    const [isOpen, setIsOpen] = useState(false);

    // --- HELPER: Flatten Nested Data ---
    const flattenData = (data: any[]) => {
        return data.map(item => {
            const flat: any = {};
            for (const key in item) {
                if (typeof item[key] === 'object' && item[key] !== null) {
                    // Simple stringify for objects/arrays to make them readable in cells
                    flat[key] = JSON.stringify(item[key]);
                } else {
                    flat[key] = item[key];
                }
            }
            return flat;
        });
    };

    // --- EXPORTERS ---

    const exportToCSV = () => {
        if (!data.length) return;
        const flattened = flattenData(data);
        const ws = XLSX.utils.json_to_sheet(flattened);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.csv`;
        link.click();
        setIsOpen(false);
    };

    const exportToExcel = () => {
        if (!data.length) return;
        const flattened = flattenData(data);
        const ws = XLSX.utils.json_to_sheet(flattened);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, `${filename}.xlsx`);
        setIsOpen(false);
    };

    const exportToPDF = () => {
        if (!data.length) return;
        const doc = new jsPDF();
        const flattened = flattenData(data);
        const headers = Object.keys(flattened[0]).map(k => k.toUpperCase());
        const rows = flattened.map(obj => Object.values(obj));

        doc.text(title, 14, 15);
        doc.setFontSize(10);
        
        // Use the imported autoTable function if available (default export)
        // or fallback to the prototype attached version
        if (typeof autoTable === 'function') {
            autoTable(doc, {
                head: [headers],
                body: rows,
                startY: 20,
                styles: { fontSize: 8, cellWidth: 'wrap' },
                theme: 'grid'
            });
        } else if ((doc as any).autoTable) {
             (doc as any).autoTable({
                head: [headers],
                body: rows,
                startY: 20,
                styles: { fontSize: 8, cellWidth: 'wrap' },
                theme: 'grid'
            });
        }

        doc.save(`${filename}.pdf`);
        setIsOpen(false);
    };

    const exportToWord = () => {
        if (!data.length) return;
        const flattened = flattenData(data);
        const headers = Object.keys(flattened[0]);
        
        let html = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>${title}</title>
            <style>
                body { font-family: 'Arial'; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
            </style>
            </head><body>
            <h1>${title}</h1>
            <table>
                <thead>
                    <tr>${headers.map(h => `<th>${h.toUpperCase()}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${flattened.map(row => `<tr>${headers.map(h => `<td>${row[h] !== undefined ? row[h] : ''}</td>`).join('')}</tr>`).join('')}
                </tbody>
            </table>
            </body></html>
        `;

        const blob = new Blob(['\ufeff', html], {
            type: 'application/msword'
        });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.doc`;
        link.click();
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block text-left">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all"
            >
                <ArrowPathIcon className="w-4 h-4 -rotate-90" />
                Export
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl z-50 border border-gray-100 overflow-hidden animate-fade-in">
                    <div className="py-1">
                        <button onClick={exportToExcel} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 w-full text-left font-medium">
                            <span className="bg-green-100 text-green-700 p-1 rounded text-xs font-bold w-8 text-center">XLS</span> Excel File
                        </button>
                        <button onClick={exportToCSV} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 w-full text-left font-medium">
                            <span className="bg-blue-100 text-blue-700 p-1 rounded text-xs font-bold w-8 text-center">CSV</span> CSV File
                        </button>
                        <button onClick={exportToPDF} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 w-full text-left font-medium">
                            <span className="bg-red-100 text-red-700 p-1 rounded text-xs font-bold w-8 text-center">PDF</span> PDF Document
                        </button>
                        <button onClick={exportToWord} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-800 w-full text-left font-medium">
                            <span className="bg-blue-200 text-blue-900 p-1 rounded text-xs font-bold w-8 text-center">DOC</span> Word File
                        </button>
                    </div>
                </div>
            )}
            
            {/* Click outside to close - simple implementation */}
            {isOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
            )}
        </div>
    );
};

export default ExportMenu;
