import React, { useState, useRef, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Mail, Settings, Upload, Loader2, Send, CheckCircle2, AlertCircle, LayoutTemplate, Trash2, Plus, Edit2, Code, Layout, Eye, Activity } from 'lucide-react';
import * as XLSX from 'xlsx';
import JoditEditor from 'jodit-react';
import { io } from 'socket.io-client';

const BulkEmail = () => {
  const [activeTab, setActiveTab] = useState('send'); // 'send', 'templates', 'config'

  // --- Global Template State ---
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // --- Campaigns State ---
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  // --- Send Email State ---
  const fileInputRef = useRef(null);
  const [emailList, setEmailList] = useState([]); // Now stores objects: { email: 'x', Var1: 'y' }
  const [uploadError, setUploadError] = useState('');
  const [formData, setFormData] = useState({
    subject: '',
    message: '' // HTML content
  });
  const [selectedSmtpId, setSelectedSmtpId] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [manualEmail, setManualEmail] = useState('');
  const [manualVars, setManualVars] = useState({});
  const [selectedSendTemplateId, setSelectedSendTemplateId] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [delaySeconds, setDelaySeconds] = useState(2);

  // --- Variable Detection ---
  const detectedVariables = useMemo(() => {
    const textToScan = (formData.subject || '') + ' ' + (formData.message || '');
    const regex = /{{\s*([\w]+)\s*}}/g;
    let match;
    const vars = new Set();
    while ((match = regex.exec(textToScan)) !== null) {
      vars.add(match[1]);
    }
    return Array.from(vars);
  }, [formData.subject, formData.message]);

  // --- Column Mapping State ---
  const [isColumnMappingModalOpen, setIsColumnMappingModalOpen] = useState(false);
  const [bulkRawData, setBulkRawData] = useState([]);
  const [bulkHeaders, setBulkHeaders] = useState([]);
  const [columnMappings, setColumnMappings] = useState({ email: '' }); // { email: 'Col A', Name: 'Col B' }

  // --- Template Management State ---
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({ name: '', description: '', subject: '', htmlContent: '' });
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // --- SMTP Config State ---
  const [smtpConfigs, setSmtpConfigs] = useState([]);
  const [loadingSmtps, setLoadingSmtps] = useState(false);
  const [editingSmtp, setEditingSmtp] = useState(null);
  const [smtpForm, setSmtpForm] = useState({
    id: '', accountName: '', host: '', port: 465, user: '', password: '', fromName: '', fromEmail: ''
  });
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configMessage, setConfigMessage] = useState({ type: '', text: '' });

  // --- Editor Modes ---
  const [sendEditorMode, setSendEditorMode] = useState('rich'); // 'rich' | 'html'
  const [templateEditorMode, setTemplateEditorMode] = useState('rich'); // 'rich' | 'html'

  // Jodit Config
  const editorConfig = {
    readonly: false,
    height: 400,
    uploader: { insertImageAsBase64URI: true },
    placeholder: 'Start writing or paste your content here...',
    buttons: ['bold', 'italic', 'underline', 'strikethrough', '|', 'font', 'fontsize', 'brush', '|', 'ul', 'ol', 'align', '|', 'outdent', 'indent', '|', 'image', 'link', 'hr', '|', 'undo', 'redo'],
    extraButtons: [
      {
        name: 'directUpload',
        iconURL: 'https://cdn-icons-png.flaticon.com/128/109/109612.png',
        tooltip: 'Upload Image Directly from PC',
        exec: (editor) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (evt) => {
                editor.selection.insertImage(evt.target.result);
              };
              reader.readAsDataURL(file);
            }
          };
          input.click();
        }
      }
    ]
  };

  useEffect(() => {
    fetchTemplates();
    fetchSmtpConfigs();
    fetchCampaigns();
  }, []);

  // Real-time socket updates for campaigns
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '');
    const socket = io(backendUrl, { path: '/api/socket.io' });

    socket.on('connect', () => {
      socket.emit('joinAdminRoom');
    });

    socket.on('campaignUpdate', (updatedCampaign) => {
      setCampaigns(prev => prev.map(c => c._id === updatedCampaign._id ? updatedCampaign : c));
    });

    return () => socket.disconnect();
  }, []);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const config = { headers: { Authorization: `Bearer ${sessionStorage.getItem('adminToken')}` } };
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/email/templates`, config);
      setTemplates(data);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const fetchSmtpConfigs = async () => {
    setLoadingSmtps(true);
    try {
      const config = { headers: { Authorization: `Bearer ${sessionStorage.getItem('adminToken')}` } };
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/email/smtp-config`, config);
      if (Array.isArray(data)) {
        setSmtpConfigs(data);
      }
    } catch (error) {
      console.error("Error fetching SMTP configs:", error);
    } finally {
      setLoadingSmtps(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${sessionStorage.getItem('adminToken')}` } };
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/email/campaigns`, config);
      setCampaigns(data);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setConfigMessage({ type: '', text: '' });
    try {
      const config = { headers: { Authorization: `Bearer ${sessionStorage.getItem('adminToken')}` } };
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/email/smtp-config`, smtpForm, config);
      setConfigMessage({ type: 'success', text: 'SMTP configuration saved successfully!' });
      fetchSmtpConfigs();
      handleNewSmtp();
    } catch (error) {
      setConfigMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save config' });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleNewSmtp = () => {
    setEditingSmtp(null);
    setSmtpForm({ id: '', accountName: '', host: '', port: 465, user: '', password: '', fromName: '', fromEmail: '' });
    setConfigMessage({ type: '', text: '' });
  };

  const handleEditSmtp = (s) => {
    setEditingSmtp(s._id);
    setSmtpForm({
      id: s._id,
      accountName: s.accountName || '',
      host: s.host || '',
      port: s.port || 465,
      user: s.user || '',
      password: '',
      fromName: s.fromName || '',
      fromEmail: s.fromEmail || ''
    });
    setConfigMessage({ type: '', text: '' });
  };

  const handleDeleteSmtp = async (id) => {
    if (!window.confirm("Are you sure you want to delete this SMTP account?")) return;
    try {
      const config = { headers: { Authorization: `Bearer ${sessionStorage.getItem('adminToken')}` } };
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/email/smtp-config/${id}`, config);
      fetchSmtpConfigs();
      if (editingSmtp === id) handleNewSmtp();
    } catch (err) {
      alert("Failed to delete SMTP config.");
    }
  };

  // --- Send Logic ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadError('');
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          setUploadError("The Excel file is empty.");
          return;
        }

        const headers = Object.keys(data[0]);
        setBulkHeaders(headers);
        setBulkRawData(data);
        
        let initialMappings = { email: '' };
        const emailHeader = headers.find(h => h.toLowerCase().includes('email'));
        if (emailHeader) initialMappings.email = emailHeader;

        // Try to auto-map detected variables
        detectedVariables.forEach(v => {
          const match = headers.find(h => h.toLowerCase() === v.toLowerCase());
          if (match) initialMappings[v] = match;
          else initialMappings[v] = '';
        });

        setColumnMappings(initialMappings);
        setIsColumnMappingModalOpen(true);
      } catch (err) {
        console.error("Excel parse error:", err);
        setUploadError("Failed to read the Excel file.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null;
  };

  const handleApplyColumnMapping = () => {
    if (!columnMappings.email) {
      alert("Please select the column that contains the email addresses.");
      return;
    }
    
    // Check if all variables are mapped
    const unmappedVars = detectedVariables.filter(v => !columnMappings[v]);
    if (unmappedVars.length > 0) {
       alert(`Please map all variables: ${unmappedVars.join(', ')}`);
       return;
    }

    const extracted = [];
    
    bulkRawData.forEach(row => {
      const email = row[columnMappings.email];
      if (email && typeof email === 'string' && email.includes('@')) {
        let recipientObj = { email };
        // Map variables
        detectedVariables.forEach(v => {
          recipientObj[v] = row[columnMappings[v]] || '';
        });
        extracted.push(recipientObj);
      }
    });

    if (extracted.length === 0) {
      setUploadError("No valid email addresses found in the selected column.");
      setIsColumnMappingModalOpen(false);
      return;
    }
    
    // Deduplicate by email
    const uniqueMap = new Map();
    extracted.forEach(obj => {
      if (!uniqueMap.has(obj.email)) uniqueMap.set(obj.email, obj);
    });

    setEmailList(prev => {
       const merged = [...prev];
       Array.from(uniqueMap.values()).forEach(newObj => {
          if (!merged.find(existing => existing.email === newObj.email)) {
             merged.push(newObj);
          }
       });
       return merged;
    });
    
    setIsColumnMappingModalOpen(false);
  };

  const handleAddManualEmail = (e) => {
    e.preventDefault();
    if (!manualEmail || !manualEmail.includes('@')) {
      alert("Please enter a valid email address.");
      return;
    }
    
    const newRecipient = { email: manualEmail };
    detectedVariables.forEach(v => {
      newRecipient[v] = manualVars[v] || '';
    });

    setEmailList(prev => {
      if (prev.find(e => e.email === manualEmail)) return prev;
      return [...prev, newRecipient];
    });
    setManualEmail('');
    setManualVars({});
  };

  const handleSendEmailChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTemplateSelectForSend = (e) => {
    const tid = e.target.value;
    setSelectedSendTemplateId(tid);
    if (!tid) {
      setFormData(prev => ({ ...prev, message: '', subject: '' }));
      return;
    }
    const template = templates.find(t => t._id === tid);
    if (template) {
      setFormData(prev => ({ ...prev, message: template.htmlContent, subject: template.subject || '' }));
    }
  };

  const handleSendBulkEmail = async (e) => {
    e.preventDefault();
    if (emailList.length === 0) {
      alert("Please add recipients first.");
      return;
    }
    if (!formData.subject || !formData.message) {
      alert("Subject and message are required.");
      return;
    }

    if (!selectedSmtpId) {
      alert("Please select a Sender Email (SMTP).");
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      const config = { headers: { Authorization: `Bearer ${sessionStorage.getItem('adminToken')}` } };
      const payload = {
        emails: emailList,
        subject: formData.subject, 
        message: formData.message,
        smtpId: selectedSmtpId,
        campaignName: campaignName,
        delaySeconds: Number(delaySeconds)
      };
      const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/email/send-bulk`, payload, config);
      setSendResult({ type: 'success', text: data.message });
      setFormData({ subject: '', message: '' });
      setSelectedSendTemplateId('');
      setEmailList([]);
      setCampaignName('');
      setDelaySeconds(2);
      fetchCampaigns();
      // Redirect to Campaigns tab after 1.5 seconds
      setTimeout(() => setActiveTab('campaigns'), 1500);
    } catch (error) {
      setSendResult({ type: 'error', text: error.response?.data?.message || 'Failed to create campaign.' });
    } finally {
      setIsSending(false);
    }
  };

  // --- Template Management Logic ---
  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({ name: '', description: '', subject: '', htmlContent: '' });
  };

  const handleEditTemplate = (t) => {
    setEditingTemplate(t._id);
    setTemplateForm({ name: t.name, description: t.description || '', subject: t.subject || '', htmlContent: t.htmlContent });
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm("Are you sure you want to delete this template?")) return;
    try {
      const config = { headers: { Authorization: `Bearer ${sessionStorage.getItem('adminToken')}` } };
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/email/templates/${id}`, config);
      fetchTemplates();
      if (editingTemplate === id) handleNewTemplate();
    } catch (err) {
      console.error("Error deleting template:", err);
      alert("Failed to delete template.");
    }
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!templateForm.name || !templateForm.htmlContent) {
      alert("Template Name and Content are required.");
      return;
    }
    setIsSavingTemplate(true);
    try {
      const config = { headers: { Authorization: `Bearer ${sessionStorage.getItem('adminToken')}` } };
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/email/templates`, {
        ...templateForm,
        type: 'html'
      }, config);
      alert("Template Saved!");
      fetchTemplates();
      handleNewTemplate();
    } catch (err) {
      console.error("Error saving template:", err);
      alert("Failed to save template. Name might already exist.");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#0B1E43] tracking-tight">Bulk Email Service</h1>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-0.5">
          Configure SMTP and send bulk emails to your network
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('send')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'send' ? 'border-[#0066FF] text-[#0066FF]' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Mail size={16} /> Create Campaign
        </button>
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'campaigns' ? 'border-[#0066FF] text-[#0066FF]' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Activity size={16} /> Campaigns
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'templates' ? 'border-[#0066FF] text-[#0066FF]' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <LayoutTemplate size={16} /> Email Templates
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'config' ? 'border-[#0066FF] text-[#0066FF]' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Settings size={16} /> SMTP Configuration
        </button>
      </div>

      {/* TAB 1: Send Email */}
      {activeTab === 'send' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col md:flex-row">
          {/* Left Panel: Upload & List */}
          <div className="w-full md:w-1/3 bg-slate-50 p-6 border-r border-slate-200/80 flex flex-col gap-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">1. Add Recipients</h3>
              <p className="text-xs text-slate-500 mb-4">Upload an Excel/CSV file containing an 'Email' column.</p>
              
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls, .csv" className="hidden" />
              <button
                onClick={() => fileInputRef.current.click()}
                className="w-full py-3 bg-white border-2 border-dashed border-slate-300 hover:border-[#0066FF] text-slate-600 hover:text-[#0066FF] rounded-xl transition-all font-bold flex flex-col items-center justify-center gap-2"
              >
                <Upload size={24} /> <span>Select Excel File</span>
              </button>
              
              {uploadError && (
                <div className="mt-3 p-3 bg-red-50 text-red-600 text-xs rounded-lg flex items-start gap-2">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" /> <p>{uploadError}</p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-slate-200/60">
                <p className="text-xs text-slate-500 mb-2">Or add email manually:</p>
                <form onSubmit={handleAddManualEmail} className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      type="email" value={manualEmail} onChange={(e) => setManualEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0066FF]"
                    />
                    <button type="submit" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors">Add</button>
                  </div>
                  {detectedVariables.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-1 p-2 bg-indigo-50 border border-indigo-100 rounded-lg">
                      {detectedVariables.map(v => (
                        <div key={v} className="col-span-1">
                          <label className="block text-[10px] font-bold text-indigo-800 mb-1">{v}</label>
                          <input
                            type="text" 
                            value={manualVars[v] || ''} 
                            onChange={(e) => setManualVars({...manualVars, [v]: e.target.value})}
                            placeholder={`Value for ${v}`}
                            className="w-full bg-white border border-indigo-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-400"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </form>
              </div>
            </div>

            {emailList.length > 0 && (
              <div className="flex-1 overflow-hidden flex flex-col bg-white rounded-xl border border-slate-200">
                <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                  <span className="text-xs font-bold text-slate-700">Recipients List</span>
                  <span className="text-[10px] bg-[#0066FF] text-white px-2 py-0.5 rounded-full font-black">{emailList.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-60">
                  {emailList.map((item, idx) => (
                    <div key={idx} className="text-xs text-slate-600 px-3 py-2 bg-slate-50/50 rounded-lg border border-slate-100 flex justify-between items-center group hover:bg-slate-100">
                      <span className="truncate font-medium">{item.email}</span>
                      <button 
                        onClick={() => setEmailList(prev => prev.filter(e => e.email !== item.email))}
                        className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-slate-100 bg-slate-50 rounded-b-xl">
                  <button onClick={() => setEmailList([])} className="w-full py-1.5 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">Clear All</button>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Compose */}
          <div className="w-full md:w-2/3 p-6 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">2. Compose Email</h3>
                <p className="text-xs text-slate-500">Draft your message.</p>
              </div>
              
              <div className="flex flex-col items-end gap-1">
                <select 
                  value={selectedSendTemplateId} 
                  onChange={handleTemplateSelectForSend}
                  className="text-xs bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 rounded-lg px-3 py-1.5 outline-none cursor-pointer"
                >
                  <option value="">-- Load Saved Template --</option>
                  {templates.map(t => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {detectedVariables.length > 0 && (
              <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-indigo-800">Dynamic Variables Detected!</p>
                  <p className="text-[10px] text-indigo-600 mt-0.5">We found the following variables in your subject/message: <strong className="bg-indigo-100 px-1 py-0.5 rounded">{detectedVariables.join(', ')}</strong>. Upload an Excel file to map them.</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSendBulkEmail} className="flex-1 flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Campaign Name (Optional)</label>
                  <input
                    type="text" value={campaignName} onChange={(e) => setCampaignName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF] transition-all font-medium"
                    placeholder="e.g. October Newsletter"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Delay Between Emails (seconds) *</label>
                  <input
                    type="number" min="1" required value={delaySeconds} onChange={(e) => setDelaySeconds(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF] transition-all font-medium"
                    placeholder="2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Send From (Select SMTP) *</label>
                <select 
                  required
                  value={selectedSmtpId} 
                  onChange={(e) => setSelectedSmtpId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF] transition-all font-medium"
                >
                  <option value="" disabled>-- Choose Sender Email --</option>
                  {smtpConfigs.map(s => (
                    <option key={s._id} value={s._id}>{s.accountName} ({s.fromEmail})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Subject *</label>
                <input
                  type="text" name="subject" required value={formData.subject} onChange={handleSendEmailChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF] transition-all font-medium"
                  placeholder="e.g. Special Offer on Freight Rates for {{Company}}"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col gap-2">
                    <label className="block text-xs font-bold text-slate-700">Email Design (HTML) *</label>
                    {/* Mode Toggle */}
                    <div className="flex bg-slate-100 rounded-lg p-1 w-fit border border-slate-200">
                      <button 
                        type="button"
                        onClick={() => setSendEditorMode('rich')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors ${sendEditorMode === 'rich' ? 'bg-white text-[#0066FF] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        <Layout size={14} /> Rich Text
                      </button>
                      <button 
                        type="button"
                        onClick={() => setSendEditorMode('html')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors ${sendEditorMode === 'html' ? 'bg-white text-[#0066FF] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        <Code size={14} /> Raw HTML
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden min-h-[400px] flex flex-col">
                  {sendEditorMode === 'rich' ? (
                    <JoditEditor
                      value={formData.message}
                      config={editorConfig}
                      onBlur={newContent => setFormData({ ...formData, message: newContent })}
                      onChange={() => {}}
                    />
                  ) : (
                    <div className="flex flex-col md:flex-row w-full flex-1 min-h-[400px]">
                      {/* HTML Editor */}
                      <div className="w-full md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r border-slate-300">
                        <div className="bg-slate-800 text-slate-300 px-4 py-2 text-xs font-mono font-bold flex items-center gap-2">
                          <Code size={14} /> HTML Code
                        </div>
                        <textarea 
                          className="flex-1 bg-slate-900 text-green-400 p-4 font-mono text-sm outline-none resize-none"
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          placeholder="Paste your HTML/CSS here..."
                        />
                      </div>
                      {/* Preview */}
                      <div className="w-full md:w-1/2 flex flex-col bg-white">
                        <div className="bg-slate-200 text-slate-700 px-4 py-2 text-xs font-bold flex items-center gap-2 border-b border-slate-300">
                          <Eye size={14} /> Live Preview
                        </div>
                        <div 
                          className="flex-1 p-6 overflow-auto"
                          dangerouslySetInnerHTML={{ __html: formData.message }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {sendResult && (
                <div className={`p-4 rounded-xl flex items-start gap-3 ${sendResult.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {sendResult.type === 'success' ? <CheckCircle2 size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
                  <p className="text-sm font-bold mt-0.5">{sendResult.text}</p>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSending || emailList.length === 0}
                  className="px-8 py-3 bg-[#0066FF] hover:bg-blue-600 disabled:bg-slate-300 text-white rounded-xl transition-all shadow-lg shadow-blue-500/25 disabled:shadow-none font-black flex items-center gap-2"
                >
                  {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  {isSending ? 'Sending...' : `Send to ${emailList.length} Recipients`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: Email Templates (WYSIWYG) */}
      {activeTab === 'templates' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col md:flex-row h-[750px]">
          {/* Templates List Sidebar */}
          <div className="w-full md:w-1/4 bg-slate-50 border-r border-slate-200/80 flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
              <h3 className="font-black text-[#0B1E43]">My Templates</h3>
              <button 
                onClick={handleNewTemplate}
                className="p-1.5 bg-[#0066FF] text-white rounded-lg hover:bg-blue-600"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingTemplates ? (
                <div className="text-center py-4 text-slate-400"><Loader2 className="animate-spin mx-auto" size={24} /></div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">No templates saved.</div>
              ) : (
                templates.map(t => (
                  <div 
                    key={t._id} 
                    className={`p-3 rounded-xl cursor-pointer border transition-all group ${editingTemplate === t._id ? 'border-[#0066FF] bg-blue-50' : 'border-transparent bg-white hover:border-slate-300 shadow-sm'}`}
                    onClick={() => handleEditTemplate(t)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className={`font-bold text-sm ${editingTemplate === t._id ? 'text-[#0066FF]' : 'text-slate-700'}`}>{t.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{t.subject || 'No Subject'}</p>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(t._id); }}
                        className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 transition-opacity p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Template Editor */}
          <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                {editingTemplate ? <Edit2 size={20} /> : <Plus size={20} />}
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800">{editingTemplate ? 'Edit Template' : 'Create New Template'}</h2>
                <p className="text-xs text-slate-500">Design your email template here. Use {'{{VariableName}}'} to add dynamic fields.</p>
              </div>
            </div>

            <form onSubmit={handleSaveTemplate} className="flex-1 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Template Name *</label>
                  <input
                    type="text" required value={templateForm.name} onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF] transition-all"
                    placeholder="e.g. Welcome Email"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Description (Optional)</label>
                  <input
                    type="text" value={templateForm.description} onChange={(e) => setTemplateForm({...templateForm, description: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF] transition-all"
                    placeholder="Brief note about this template"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Subject *</label>
                <input
                  type="text" required value={templateForm.subject} onChange={(e) => setTemplateForm({...templateForm, subject: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF] transition-all font-medium"
                  placeholder="e.g. Welcome to Logistics, {{Name}}"
                />
              </div>

              <div className="flex-1 flex flex-col mt-2">
                <div className="flex justify-between items-end mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">Template Content (HTML/Rich Text) *</label>
                  {/* Mode Toggle */}
                  <div className="flex bg-slate-100 rounded-lg p-1 w-fit border border-slate-200">
                    <button 
                      type="button"
                      onClick={() => setTemplateEditorMode('rich')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors ${templateEditorMode === 'rich' ? 'bg-white text-[#0066FF] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <Layout size={14} /> Rich Text
                    </button>
                    <button 
                      type="button"
                      onClick={() => setTemplateEditorMode('html')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors ${templateEditorMode === 'html' ? 'bg-white text-[#0066FF] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <Code size={14} /> Raw HTML
                    </button>
                  </div>
                </div>
                <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 h-full bg-white flex flex-col">
                  {templateEditorMode === 'rich' ? (
                    <JoditEditor
                      value={templateForm.htmlContent}
                      config={{...editorConfig, height: '100%', minHeight: 400}}
                      onBlur={newContent => setTemplateForm({ ...templateForm, htmlContent: newContent })}
                      onChange={() => {}}
                    />
                  ) : (
                    <div className="flex flex-col md:flex-row w-full flex-1">
                      {/* HTML Editor */}
                      <div className="w-full md:w-1/2 h-full flex flex-col border-b md:border-b-0 md:border-r border-slate-300">
                        <div className="bg-slate-800 text-slate-300 px-4 py-2 text-xs font-mono font-bold flex items-center gap-2">
                          <Code size={14} /> HTML Code
                        </div>
                        <textarea 
                          className="flex-1 bg-slate-900 text-green-400 p-4 font-mono text-sm outline-none resize-none min-h-[400px]"
                          value={templateForm.htmlContent}
                          onChange={(e) => setTemplateForm({ ...templateForm, htmlContent: e.target.value })}
                          placeholder="Paste your HTML/CSS here..."
                        />
                      </div>
                      {/* Preview */}
                      <div className="w-full md:w-1/2 h-full flex flex-col bg-white">
                        <div className="bg-slate-200 text-slate-700 px-4 py-2 text-xs font-bold flex items-center gap-2 border-b border-slate-300">
                          <Eye size={14} /> Live Preview
                        </div>
                        <div 
                          className="flex-1 p-6 overflow-auto min-h-[400px]"
                          dangerouslySetInnerHTML={{ __html: templateForm.htmlContent }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 mt-2">
                <button
                  type="submit"
                  disabled={isSavingTemplate}
                  className="px-8 py-3 bg-[#0B1E43] hover:bg-[#1a3668] text-white rounded-xl transition-all shadow-lg font-black flex items-center gap-2"
                >
                  {isSavingTemplate && <Loader2 size={18} className="animate-spin" />}
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: SMTP Config */}
      {activeTab === 'config' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col md:flex-row h-[750px]">
          {/* SMTP List Sidebar */}
          <div className="w-full md:w-1/4 bg-slate-50 border-r border-slate-200/80 flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
              <h3 className="font-black text-[#0B1E43]">SMTP Accounts</h3>
              <button 
                onClick={handleNewSmtp}
                className="p-1.5 bg-[#0066FF] text-white rounded-lg hover:bg-blue-600"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingSmtps ? (
                <div className="text-center py-4 text-slate-400"><Loader2 className="animate-spin mx-auto" size={24} /></div>
              ) : smtpConfigs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">No accounts saved.</div>
              ) : (
                smtpConfigs.map(s => (
                  <div 
                    key={s._id} 
                    className={`p-3 rounded-xl cursor-pointer border transition-all group ${editingSmtp === s._id ? 'border-[#0066FF] bg-blue-50' : 'border-transparent bg-white hover:border-slate-300 shadow-sm'}`}
                    onClick={() => handleEditSmtp(s)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className={`font-bold text-sm ${editingSmtp === s._id ? 'text-[#0066FF]' : 'text-slate-700'}`}>{s.accountName || 'Unnamed'}</h4>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{s.fromEmail}</p>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteSmtp(s._id); }}
                        className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 transition-opacity p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SMTP Editor */}
          <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-white">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                {editingSmtp ? <Edit2 size={20} /> : <Plus size={20} />}
              </div>
              <div className="flex-1 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-black text-slate-800">{editingSmtp ? 'Edit SMTP Account' : 'Add New SMTP Account'}</h2>
                  <p className="text-xs text-slate-500">Configure your email server credentials.</p>
                </div>
                {editingSmtp && smtpConfigs.find(s => s._id === editingSmtp)?.hasPassword && (
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 h-fit">
                    <CheckCircle2 size={14} /> Credentials Saved
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-6 max-w-3xl">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Account Name *</label>
                <input type="text" name="accountName" required value={smtpForm.accountName} onChange={(e) => setSmtpForm({...smtpForm, accountName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm" placeholder="e.g. Sales Team, Info, Support" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">SMTP Host *</label>
                  <input type="text" name="host" required value={smtpForm.host} onChange={(e) => setSmtpForm({...smtpForm, host: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">SMTP Port *</label>
                  <input type="number" name="port" required value={smtpForm.port} onChange={(e) => setSmtpForm({...smtpForm, port: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Sender Name *</label>
                  <input type="text" name="fromName" required value={smtpForm.fromName} onChange={(e) => setSmtpForm({...smtpForm, fromName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Sender Email *</label>
                  <input type="email" name="fromEmail" required value={smtpForm.fromEmail} onChange={(e) => setSmtpForm({...smtpForm, fromEmail: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">SMTP Username *</label>
                  <input type="text" name="user" required value={smtpForm.user} onChange={(e) => setSmtpForm({...smtpForm, user: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">SMTP Password {editingSmtp && smtpConfigs.find(s => s._id === editingSmtp)?.hasPassword ? '(Leave blank to keep current)' : '*'}</label>
                  <input type="password" name="password" required={!(editingSmtp && smtpConfigs.find(s => s._id === editingSmtp)?.hasPassword)} value={smtpForm.password} onChange={(e) => setSmtpForm({...smtpForm, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
                </div>
              </div>

              {configMessage.text && (
                <div className={`p-4 rounded-xl flex items-start gap-3 ${configMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  <p className="text-sm font-bold">{configMessage.text}</p>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <button type="submit" disabled={isSavingConfig} className="px-8 py-3 bg-[#0B1E43] hover:bg-[#1a3668] text-white rounded-xl transition-all shadow-lg font-black flex items-center gap-2">
                  {isSavingConfig ? <Loader2 size={18} className="animate-spin" /> : <Settings size={18} />} Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Column Mapping Modal (Only used in Send Tab) */}
      {isColumnMappingModalOpen && activeTab === 'send' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0B1E43]/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 to-white">
              <h3 className="text-xl font-extrabold text-[#0B1E43]">Map Excel Columns</h3>
              <p className="text-xs text-slate-500 font-bold mt-1">Select the columns from your Excel file that correspond to the fields below.</p>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email Address Column *</label>
                <select 
                  value={columnMappings.email} 
                  onChange={(e) => setColumnMappings({...columnMappings, email: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none font-medium"
                >
                  <option value="" disabled>Select a column...</option>
                  {bulkHeaders.map(header => <option key={header} value={header}>{header}</option>)}
                </select>
              </div>

              {detectedVariables.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3">Map Dynamic Variables</h4>
                  <div className="space-y-3">
                    {detectedVariables.map(v => (
                      <div key={v}>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">{v}</label>
                        <select 
                          value={columnMappings[v] || ''} 
                          onChange={(e) => setColumnMappings({...columnMappings, [v]: e.target.value})} 
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none"
                        >
                          <option value="">-- Select a column to map to {v} --</option>
                          {bulkHeaders.map(header => <option key={header} value={header}>{header}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 pt-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setIsColumnMappingModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800">Cancel</button>
              <button onClick={handleApplyColumnMapping} className="px-6 py-2.5 bg-[#0066FF] hover:bg-blue-600 text-white rounded-xl font-black">Apply & Extract Data</button>
            </div>
          </div>
        </div>
      )}
      {/* TAB 4: Campaigns */}
      {activeTab === 'campaigns' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-black text-[#0B1E43]">Active & Past Campaigns</h3>
              <p className="text-xs text-slate-500 font-medium">Track your email sending progress and open rates.</p>
            </div>
            <button onClick={fetchCampaigns} className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg flex items-center gap-2 transition-colors">
              Refresh Stats
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-black text-slate-400 uppercase tracking-wider">
                  <th className="p-3">Campaign Info</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Progress</th>
                  <th className="p-3">Sent / Failed</th>
                  <th className="p-3">Opened</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(camp => {
                  const progress = camp.totalEmails > 0 ? ((camp.sentCount + camp.failedCount) / camp.totalEmails) * 100 : 0;
                  const openRate = camp.sentCount > 0 ? (camp.openedCount / camp.sentCount) * 100 : 0;
                  return (
                    <tr key={camp._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <p className="text-sm font-bold text-slate-800">{camp.name}</p>
                        <p className="text-[10px] font-medium text-slate-500 mt-0.5">Subj: {camp.subject}</p>
                        <p className="text-[10px] font-medium text-slate-400">SMTP: {camp.smtpId?.fromEmail || 'Deleted'}</p>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full ${
                          camp.status === 'running' ? 'bg-amber-100 text-amber-700' :
                          camp.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          camp.status === 'pending' ? 'bg-slate-100 text-slate-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {camp.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="w-full bg-slate-200 rounded-full h-2 mt-1 mb-1 relative overflow-hidden">
                          <div className={`h-2 rounded-full ${camp.status === 'completed' ? 'bg-emerald-500' : 'bg-[#0066FF]'}`} style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 text-right">{Math.round(progress)}%</p>
                      </td>
                      <td className="p-3">
                        <p className="text-xs font-bold text-slate-700">{camp.sentCount} <span className="text-slate-400 font-medium">/ {camp.totalEmails}</span></p>
                        <p className="text-[10px] font-bold text-rose-500">{camp.failedCount} failed</p>
                      </td>
                      <td className="p-3">
                        <p className="text-xs font-bold text-indigo-700">{camp.openedCount} opened</p>
                        <p className="text-[10px] font-bold text-indigo-400">{Math.round(openRate)}% open rate</p>
                      </td>
                    </tr>
                  )
                })}
                {campaigns.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-sm font-bold text-slate-400">
                      No campaigns found. Create one from the "Create Campaign" tab!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkEmail;
