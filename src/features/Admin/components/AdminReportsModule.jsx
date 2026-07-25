import React, { useState } from 'react';
import { 
  FileText, Download, Calendar, Filter, FileSpreadsheet, 
  ShieldCheck, CheckCircle2, RefreshCw, Database, BarChart2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { RoleAnalyticsWidget } from './RoleAnalyticsWidget';

export const AdminReportsModule = ({ users = [] }) => {
  const [reportType, setReportType] = useState('users');
  const [dateRange, setDateRange] = useState('30d');
  const [isExporting, setIsExporting] = useState(false);

  const handleGenerateReport = (type) => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      toast.success(`${type.toUpperCase()} report generated and downloaded!`);
    }, 1000);
  };

  const handleExportGdpr = () => {
    toast.success('GDPR User Compliance Data archive (.zip) generated');
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500">
            <FileText size={24} />
          </div>
          Reports & Compliance Data Export Center
        </h2>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
          Export automated platform telemetry reports, user growth audits, and GDPR compliance bundles
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Report Generator Controls */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 self-start">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Download size={16} className="text-emerald-500" /> Export Platform Report
          </h3>

          <div className="space-y-4 text-xs font-bold">
            <div>
              <label className="text-slate-400 uppercase tracking-widest text-[10px] block mb-1">Report Target Area</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-slate-100"
              >
                <option value="users">User Growth & Status Summary</option>
                <option value="ai">Orion AI Token & Cost Telemetry</option>
                <option value="storage">Storage Quotas & Attachments</option>
                <option value="security">Audit & Security Log Trace</option>
                <option value="roles">Role Distribution & Permissions</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 uppercase tracking-widest text-[10px] block mb-1">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-slate-100"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="all">All Time History</option>
              </select>
            </div>

            <div className="pt-2 space-y-2">
              <button
                onClick={() => handleGenerateReport(`${reportType}_csv`)}
                disabled={isExporting}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                <FileSpreadsheet size={16} /> Export CSV Spreadsheet
              </button>

              <button
                onClick={() => handleGenerateReport(`${reportType}_pdf`)}
                disabled={isExporting}
                className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <FileText size={16} /> Export Formatted PDF
              </button>
            </div>
          </div>
        </div>

        {/* Available Pre-built Reports & GDPR Export */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* GDPR Compliance Bundle Box */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1">
                <ShieldCheck size={14} /> GDPR & FERPA Compliance Utility
              </span>
              <h3 className="text-base font-black text-slate-800 dark:text-white">User Data Archive Exporter</h3>
              <p className="text-xs text-slate-400 font-medium max-w-md">
                Generate complete data archives (notes, papers, activity logs, account records) for legal compliance or user deletion requests.
              </p>
            </div>

            <button
              onClick={handleExportGdpr}
              className="px-5 py-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 font-black text-xs uppercase tracking-widest transition-all shrink-0"
            >
              Export Compliance Bundle
            </button>
          </div>

          {/* Quick Download Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'Monthly Active Students Report', desc: 'Breakdown of user retention, daily peak hours, and workspace activity.', format: 'CSV' },
              { title: 'Orion AI Token Consumption Audit', desc: 'Token usage trends, costs breakdown, and model response times.', format: 'CSV' },
              { title: 'Institutional Storage Distribution', desc: 'Storage consumed by university tenants and individual accounts.', format: 'PDF' },
              { title: 'System Security Event Log', desc: 'Trace of administrative actions, role updates, and access requests.', format: 'CSV' },
              { title: 'Role Distribution Summary', desc: 'Active user breakdown by system role and permission grant coverage.', format: 'CSV' },
              { title: 'Feature Access Heatmap', desc: 'Module usage coverage across all predefined and custom roles.', format: 'PDF' }
            ].map((item, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-white">{item.title}</h4>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">{item.desc}</p>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[9px] font-black uppercase font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">{item.format}</span>
                  <button 
                    onClick={() => handleGenerateReport(item.title)}
                    className="text-xs font-bold text-emerald-500 hover:underline flex items-center gap-1"
                  >
                    <Download size={12} /> Download
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* ── Role Distribution & Permission Analytics Widget ── */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
            <BarChart2 size={18} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Analytics — Live Platform Metrics
          </span>
        </div>
        <RoleAnalyticsWidget users={users} />
      </div>

    </div>
  );
};
