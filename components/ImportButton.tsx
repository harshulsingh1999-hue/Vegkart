
import React, { useRef } from 'react';
import * as XLSX from 'xlsx';
import { CloudArrowUpIcon } from './ui/Icons';
import { useToast } from '../providers/ToastProvider';

interface ImportButtonProps {
    onImport: (data: any[]) => void;
    label?: string;
    className?: string;
}

const ImportButton: React.FC<ImportButtonProps> = ({ onImport, label = "Import", className }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showToast } = useToast();

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        showToast('Reading file...', 'info');

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
            
            if (jsonData && jsonData.length > 0) {
                onImport(jsonData);
                showToast(`Successfully processed ${jsonData.length} records`, 'success');
            } else {
                showToast('File is empty or invalid format', 'error');
            }
        } catch (error) {
            console.error("Import Error:", error);
            showToast('Failed to parse file. Ensure it is a valid Excel or CSV.', 'error');
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".csv, .xlsx, .xls" 
                onChange={handleFileChange} 
            />
            <button 
                onClick={handleClick}
                className={className || "flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-100 shadow-sm transition-all active:scale-95"}
            >
                <CloudArrowUpIcon className="w-4 h-4" />
                {label}
            </button>
        </>
    );
};

export default ImportButton;
