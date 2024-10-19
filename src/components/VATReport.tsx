import React, { useState } from 'react';
import { useIncomes } from '../contexts/IncomeContext';
import { EU_COUNTRIES, calculateVAT, isOverVATThreshold } from '../utils/euVatUtils';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const VATReport: React.FC = () => {
  const { incomes } = useIncomes();
  const [selectedCountry, setSelectedCountry] = useState<EU_COUNTRIES | ''>('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const generateReport = () => {
    if (!selectedCountry || !startDate || !endDate) {
      alert('Please select a country and date range');
      return;
    }

    const filteredIncomes = incomes.filter(income => 
      income.customerCountry === selectedCountry &&
      income.date >= startDate &&
      income.date <= endDate
    );

    const totalSales = filteredIncomes.reduce((sum, income) => sum + income.salePrice * income.quantity, 0);
    const totalVAT = filteredIncomes.reduce((sum, income) => sum + calculateVAT(income.salePrice, income.vatRate) * income.quantity, 0);

    const reportData = {
      country: selectedCountry,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      totalSales,
      totalVAT,
      isOverThreshold: isOverVATThreshold(selectedCountry, totalSales),
      transactions: filteredIncomes.map(income => ({
        date: income.date.toISOString().split('T')[0],
        product: income.product,
        quantity: income.quantity,
        salePrice: income.salePrice,
        vatRate: income.vatRate,
        vatAmount: calculateVAT(income.salePrice, income.vatRate) * income.quantity,
      })),
    };

    return reportData;
  };

  const exportToExcel = () => {
    const reportData = generateReport();
    if (!reportData) return;

    const ws = XLSX.utils.json_to_sheet(reportData.transactions);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'VAT Report');
    XLSX.writeFile(wb, `VAT_Report_${reportData.country}_${reportData.startDate}_${reportData.endDate}.xlsx`);
  };

  const exportToPDF = () => {
    const reportData = generateReport();
    if (!reportData) return;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`VAT Report - ${reportData.country}`, 14, 22);
    doc.setFontSize(12);
    doc.text(`Period: ${reportData.startDate} to ${reportData.endDate}`, 14, 30);
    doc.text(`Total Sales: €${reportData.totalSales.toFixed(2)}`, 14, 38);
    doc.text(`Total VAT: €${reportData.totalVAT.toFixed(2)}`, 14, 46);
    doc.text(`VAT Threshold Exceeded: ${reportData.isOverThreshold ? 'Yes' : 'No'}`, 14, 54);

    doc.autoTable({
      startY: 60,
      head: [['Date', 'Product', 'Quantity', 'Sale Price', 'VAT Rate', 'VAT Amount']],
      body: reportData.transactions.map(t => [
        t.date,
        t.product,
        t.quantity,
        `€${t.salePrice.toFixed(2)}`,
        `${(t.vatRate * 100).toFixed(2)}%`,
        `€${t.vatAmount.toFixed(2)}`,
      ]),
    });

    doc.save(`VAT_Report_${reportData.country}_${reportData.startDate}_${reportData.endDate}.pdf`);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">VAT Report</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block mb-2">Country</label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value as EU_COUNTRIES)}
              className="w-full p-2 border rounded"
            >
              <option value="">Select a country</option>
              {Object.values(EU_COUNTRIES).map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-2">Start Date</label>
            <input
              type="date"
              value={startDate ? startDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setStartDate(new Date(e.target.value))}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block mb-2">End Date</label>
            <input
              type="date"
              value={endDate ? endDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setEndDate(new Date(e.target.value))}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        <div className="mt-4 space-x-4">
          <button onClick={exportToExcel} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
            Export to Excel
          </button>
          <button onClick={exportToPDF} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
            Export to PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default VATReport;