import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Upload, 
  RefreshCw, 
  Search, 
  Terminal, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Database, 
  Award, 
  MapPin, 
  TrendingUp, 
  Info,
  User,
  Zap,
  Sparkles
} from 'lucide-react';

interface Lead {
  id: string;
  target_person: string;
  title: string;
  company_name: string;
  verified_individual_email: string | null;
  confidence_score: number;
  pattern_used: string;
  personalized_opening_line: string;
  status: 'cured' | 'filtered' | 'failed';
  filter_reason?: string;
  scouted_services: string[];
  scouted_industries: string[];
  headquarters_city: string;
  timestamp: string;
}

interface LogEntry {
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  agent: 'system' | 'scout' | 'detective' | 'copywriter' | 'pipeline';
  message: string;
  details?: any;
}

const NAIROBI_PRESETS = [
  {
    name: "Safari Digital Nairobi (Scrape Data)",
    description: "Kenyan SEO & local retail marketing agency. Contains direct leadership and a generic hello@ inbox to test the Detective's catch-all filter.",
    text: `Safari Digital Nairobi is a premier digital marketing agency located in the heart of Nairobi, Kenya.
We specialize in custom SEO Strategy, high-impact Content Marketing, and local PPC campaigns.
Our target niches include local retail hubs, e-commerce stores, and safari tourism companies across East Africa.

Key leadership:
- Kamau Thuo (Managing Director) - contact him directly to discuss joint SEO ventures.
- Jane Doe (Operations Lead) - coordinates our daily workflows in Nairobi.
- General inquiries go to hello@safaridigital.co.ke (generic inbox - do not use for leadership pitch).`
  },
  {
    name: "EcoTech Solutions (Scrape Data)",
    description: "Nairobi green-tech IoT logistics firm. Contains direct growth lead and general sales email.",
    text: `EcoTech Solutions is a sustainable green tech logistics optimization agency based in Nairobi, Kenya.
Our core services include IoT Integration, green logistics planning, and smart solar tracking algorithms.
We primarily serve renewable energy startups, agri-tech cooperatives, and eco-friendly manufacturing companies.

Leadership team:
- Amina Omondi (Head of Growth) - drives expansion across the East African Community.
- Peter Ochieng (Operations Director) - manages deployment.
- General sales department (contact sales@ecotech.ke for standard inquiries).`
  },
  {
    name: "CloudPeak Agency (Scrape Data)",
    description: "B2B SaaS tech consulting agency. Tests cloud optimization pitches.",
    text: `CloudPeak Agency delivers enterprise-grade cloud migration, tech consulting, and cybersecurity strategies.
Headquartered in Nairobi, we primarily serve SaaS developers and B2B software companies in sub-Saharan Africa.

Founding team:
- Sarah Jenkins (Founder & CEO) - handles strategic enterprise partnerships.
- Robert Mwanzia (CTO) - directs technical infrastructure.
- General team mail: hello@cloudpeak.io`
  }
];

export default function App() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>(NAIROBI_PRESETS[0].text);
  const [useSimulation, setUseSimulation] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [logFilter, setLogFilter] = useState<string>('all');
  const [currentCreditCount, setCurrentCreditCount] = useState<number>(25);
  
  // Pipeline stage tracker
  const [pipelineStage, setPipelineStage] = useState<'idle' | 'scout' | 'detective' | 'copywriter' | 'completed'>('idle');
  const [scoutProgress, setScoutProgress] = useState<number>(0);
  const [detectiveProgress, setDetectiveProgress] = useState<number>(0);
  const [copywriterProgress, setCopywriterProgress] = useState<number>(0);
  const [activeStepText, setActiveStepText] = useState<string>('System Ready');

  // Selected lead for detail preview
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Load leads, logs and config on mount
  useEffect(() => {
    fetchInitialData();
    const interval = setInterval(fetchLogsAndLeads, 4000); // Poll for background logs/leads updates
    return () => clearInterval(interval);
  }, []);

  const fetchInitialData = async () => {
    try {
      const configRes = await fetch('/api/config');
      const configData = await configRes.json();
      setHasApiKey(configData.hasApiKey);
      // If API key is missing, default simulation toggle to true
      if (!configData.hasApiKey) {
        setUseSimulation(true);
      }

      await fetchLogsAndLeads();
    } catch (e) {
      console.error('Error loading initial configurations:', e);
    }
  };

  const fetchLogsAndLeads = async () => {
    try {
      const leadsRes = await fetch('/api/leads');
      const leadsData = await leadsRes.json();
      setLeads(leadsData.leads);

      const logsRes = await fetch('/api/logs');
      const logsData = await logsRes.json();
      setLogs(logsData.logs);

      // Simple credit deduction simulation
      const curedCount = leadsData.leads.filter((l: Lead) => l.status === 'cured').length;
      setCurrentCreditCount(Math.max(25 - curedCount, 0));
    } catch (e) {
      console.error('Error polling data:', e);
    }
  };

  const handleSelectPreset = (presetText: string) => {
    setInputText(presetText);
  };

  const handleResetDatabase = async () => {
    if (!confirm("Are you sure you want to reset the lead list to Nairobi presets? All custom cured leads will be restored to default.")) return;
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      const data = await res.json();
      setLeads(data.leads);
      setLogs(data.logs);
      setCurrentCreditCount(25 - data.leads.filter((l: Lead) => l.status === 'cured').length);
      setSelectedLead(null);
    } catch (e) {
      console.error('Error resetting database:', e);
    }
  };

  const handleRunPipeline = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setSelectedLead(null);
    
    // Reset pipeline visual progress
    setPipelineStage('scout');
    setScoutProgress(10);
    setDetectiveProgress(0);
    setCopywriterProgress(0);
    setActiveStepText('Scout Agent: Booting Antigravity model...');

    // Simulate pipeline progress visually in frontend while backend processes
    const progressInterval = setInterval(() => {
      setScoutProgress(prev => {
        if (prev < 90) return prev + 15;
        return prev;
      });
    }, 200);

    try {
      // Step 1: Scout Agent Complete
      await new Promise(resolve => setTimeout(resolve, 800));
      clearInterval(progressInterval);
      setScoutProgress(100);
      setPipelineStage('detective');
      setDetectiveProgress(15);
      setActiveStepText('Detective Agent: Crawling domains & verifying corporate mail patterns...');

      const detInterval = setInterval(() => {
        setDetectiveProgress(prev => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 250);

      // Step 2: Detective Agent Complete
      await new Promise(resolve => setTimeout(resolve, 1200));
      clearInterval(detInterval);
      setDetectiveProgress(100);
      setPipelineStage('copywriter');
      setCopywriterProgress(20);
      setActiveStepText('Copywriter Agent: Engineering personalized openers with Pomelli Logic...');

      const copyInterval = setInterval(() => {
        setCopywriterProgress(prev => {
          if (prev < 95) return prev + 15;
          return prev;
        });
      }, 200);

      // Post the request to our backend API
      const res = await fetch('/api/run-agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: inputText,
          useSimulation: useSimulation
        })
      });

      const result = await res.json();
      
      clearInterval(copyInterval);
      setCopywriterProgress(100);
      setPipelineStage('completed');
      setActiveStepText('Pipeline Complete! Raw lead list successfully cured.');

      if (res.ok) {
        await fetchLogsAndLeads();
        if (result.curedLeads && result.curedLeads.length > 0) {
          // Select the first successfully cured or filtered lead to show detail
          const firstCured = result.curedLeads.find((l: Lead) => l.status === 'cured');
          setSelectedLead(firstCured || result.curedLeads[0]);
        }
      } else {
        alert('Pipeline Error: ' + (result.error || 'Server error occurred.'));
      }

    } catch (e: any) {
      console.error('Pipeline error:', e);
      setActiveStepText('Pipeline Error: ' + e.message);
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        setPipelineStage('idle');
        setScoutProgress(0);
        setDetectiveProgress(0);
        setCopywriterProgress(0);
        setActiveStepText('System Idle. Ready for new lead lists.');
      }, 4000);
    }
  };

  // CSV Drag and Drop trigger
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setUploadStatus('Reading raw text files...');
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setInputText(event.target.result as string);
          setUploadStatus(`Successfully imported "${file.name}" (dirty list loaded)`);
          setTimeout(() => setUploadStatus(''), 4000);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadStatus('Reading raw text files...');
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setInputText(event.target.result as string);
          setUploadStatus(`Successfully imported "${file.name}" (dirty list loaded)`);
          setTimeout(() => setUploadStatus(''), 4000);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExportCSV = () => {
    const curedLeadsOnly = leads.filter(l => l.status === 'cured');
    if (curedLeadsOnly.length === 0) {
      alert("No cured leads available to export.");
      return;
    }
    const headers = ['Target Person', 'Title', 'Company Name', 'Verified Email', 'Confidence Score', 'Personalized Opener (Pomelli)'];
    const rows = curedLeadsOnly.map(l => [
      l.target_person,
      l.title,
      l.company_name,
      l.verified_individual_email || '',
      l.confidence_score,
      `"${l.personalized_opening_line.replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "leadcure_cured_leads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Search and Filters
  const filteredLeads = leads.filter(l => {
    const matchesSearch = 
      l.target_person.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.verified_individual_email && l.verified_individual_email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = 
      statusFilter === 'all' || 
      l.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredLogs = logs.filter(l => {
    return logFilter === 'all' || l.agent === logFilter;
  });

  return (
    <div className="w-full min-h-screen bg-[#121212] text-gray-100 flex flex-col font-sans selection:bg-[#00C853] selection:text-black">
      
      {/* Top Header Navigation */}
      <nav id="nav-header" className="h-16 border-b border-[#2E2E2E] flex items-center justify-between px-6 bg-[#181818] shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#00C853] rounded flex items-center justify-center shadow-lg shadow-[#00C85333]">
            <Sparkles className="w-5 h-5 text-[#121212]" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white leading-tight">
              LeadCure <span className="text-[#00C853]">AI</span>
            </span>
            <span className="text-[9px] uppercase tracking-widest text-gray-500 font-mono">
              Antigravity pipeline
            </span>
          </div>
          <div className="hidden md:flex ml-4 px-3 py-1 bg-[#252525] rounded-full text-[10px] uppercase tracking-widest text-[#00C853] border border-[#2E2E2E] items-center gap-1.5 font-semibold">
            <Award className="w-3.5 h-3.5" />
            Build with Gemini XPRIZE • 2026
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-[9px] text-gray-500 uppercase tracking-wider font-mono font-semibold">Credits Remaining</div>
            <div className="text-sm font-mono font-bold text-[#00C853] flex items-center gap-1.5 justify-end">
              <span>{currentCreditCount} / 25</span> 
              <span className="text-[10px] text-gray-500 font-normal">(Free Tier)</span>
            </div>
          </div>
          <div className="h-9 w-px bg-[#2E2E2E]" />
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#2E2E2E] flex items-center justify-center border border-[#00C853] text-sm font-bold text-[#00C853]">
              GO
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-white">geomondi09@gmail.com</span>
              <span className="text-[9px] text-gray-500 uppercase tracking-wider font-mono">Kenyan Market Node</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Grid Workspace */}
      <main className="flex-1 p-6 flex flex-col lg:flex-row gap-6 overflow-hidden max-w-7xl mx-auto w-full">
        
        {/* Left Column: Input Panel & Agent Console */}
        <div className="w-full lg:w-[450px] flex flex-col gap-6 shrink-0">
          
          {/* Campaign Header / Conversion Pitch */}
          <div className="bg-[#181818] border border-[#2E2E2E] rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#00C85311] rounded-full blur-2xl pointer-events-none" />
            <h2 className="text-xl font-light mb-2 leading-tight">
              Cure your <span className="text-[#00C853] italic font-semibold">dirty</span> lead lists with Antigravity Agents.
            </h2>
            <p className="text-gray-400 text-xs leading-relaxed mb-4">
              Scrape target websites, paste raw HTML, or drop dirty lists. Our autonomous Google Antigravity Agent Squad extracts direct company leadership, verifies direct personal business emails (filtering bounce-heavy generic catch-alls), and writes bespoke openers.
            </p>
            <div className="flex items-center gap-4 text-[11px] font-mono text-gray-400">
              <span className="flex items-center gap-1 text-[#00C853]">
                <CheckCircle2 className="w-3.5 h-3.5" /> No Card Needed
              </span>
              <span className="flex items-center gap-1 text-[#00C853]">
                <CheckCircle2 className="w-3.5 h-3.5" /> 25 Free Credits
              </span>
            </div>
          </div>

          {/* Preset Selector */}
          <div id="preset-input-console" className="bg-[#181818] border border-[#2E2E2E] rounded-xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-wider text-gray-400 font-mono font-semibold">
                Nairobi Agency Presets (Test Data)
              </label>
              <span className="text-[10px] bg-[#222] text-[#00C853] px-2 py-0.5 rounded border border-[#2E2E2E] font-mono">
                Initial Beachhead Market
              </span>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              {NAIROBI_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectPreset(preset.text)}
                  className={`text-left p-3 rounded-lg border text-xs transition-all ${
                    inputText === preset.text 
                      ? 'bg-[#00C8530b] border-[#00C853] text-white' 
                      : 'bg-[#222] border-[#2E2E2E] hover:border-gray-500 text-gray-300'
                  }`}
                >
                  <div className="font-semibold flex items-center gap-1 text-white">
                    <MapPin className="w-3 h-3 text-[#00C853]" />
                    {preset.name}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1 leading-normal">{preset.description}</div>
                </button>
              ))}
            </div>

            <div className="h-px bg-[#2E2E2E] my-1" />

            {/* Raw Scraping text input or drop zone */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-300">Custom Scrape Payload / CSV Input</span>
                {uploadStatus && <span className="text-[10px] text-[#00C853] font-mono">{uploadStatus}</span>}
              </div>

              {/* Drag and drop zone */}
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-[#2E2E2E] rounded-lg p-4 bg-[#1e1e1e] hover:bg-[#252525] transition-all flex flex-col items-center justify-center cursor-pointer group relative"
              >
                <input 
                  type="file" 
                  accept=".csv,.txt" 
                  onChange={handleFileUpload} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-6 h-6 text-gray-500 group-hover:text-[#00C853] mb-1.5 transition-colors" />
                <span className="text-[11px] text-gray-400 text-center">
                  Drag & drop raw scrape list (.csv, .txt) or <span className="text-[#00C853] font-semibold underline">browse</span>
                </span>
                <span className="text-[8px] uppercase text-gray-600 mt-1 font-mono">Max 15MB file size</span>
              </div>

              {/* Textarea input */}
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full h-32 bg-[#121212] border border-[#2E2E2E] rounded-lg p-3 text-xs font-mono text-gray-300 focus:outline-none focus:border-[#00C853] resize-none leading-relaxed"
                placeholder="Paste raw text or website content here..."
              />
            </div>

            {/* Simulation/API settings */}
            <div className="flex items-center justify-between bg-[#222] p-3 rounded-lg border border-[#2E2E2E] text-xs">
              <div className="flex flex-col">
                <span className="font-semibold text-white flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-[#00C853]" />
                  Execution Engine
                </span>
                <span className="text-[9px] text-gray-500">
                  {hasApiKey ? 'Google AI Studio Active' : 'Sandbox (Simulator fallback)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUseSimulation(!useSimulation)}
                  className={`px-3 py-1 rounded text-[10px] font-mono uppercase tracking-wider font-semibold border transition-all ${
                    useSimulation 
                      ? 'bg-[#e0a80022] text-[#ffc107] border-[#e0a800]' 
                      : 'bg-[#00C85322] text-[#00C853] border-[#00C853]'
                  }`}
                >
                  {useSimulation ? 'Sandbox Simulation' : 'Live Gemini 3.5'}
                </button>
              </div>
            </div>

            {/* Run Button */}
            <button
              id="btn-cure"
              onClick={handleRunPipeline}
              disabled={isProcessing || !inputText.trim()}
              className={`w-full font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg ${
                isProcessing || !inputText.trim()
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                  : 'bg-[#00C853] hover:bg-[#00e65c] text-[#121212] hover:shadow-[#00C85344] transform hover:-translate-y-0.5'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  Curing Leads Pipeline...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-black" />
                  Cure Lead List
                  <ArrowRight className="w-4 h-4 text-black" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Execution Monitor & Data Table */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          
          {/* Agent Pipeline Real-Time Status Monitor */}
          <section id="agent-pipeline-status" className="bg-[#181818] border border-[#2E2E2E] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00C853] animate-pulse" />
                <h2 className="text-xs uppercase tracking-[0.2em] text-gray-400 font-mono font-bold">
                  Antigravity Squad Monitor
                </h2>
              </div>
              <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider bg-[#222] px-2 py-0.5 rounded border border-[#2E2E2E]">
                {activeStepText}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Agent 1 Card */}
              <div className={`p-4 rounded-lg border transition-all ${
                pipelineStage === 'scout' 
                  ? 'bg-[#00C85308] border-[#00C853] shadow-md shadow-[#00C85311]' 
                  : pipelineStage === 'detective' || pipelineStage === 'copywriter' || pipelineStage === 'completed'
                    ? 'bg-[#1e1e1e] border-[#2E2E2E] opacity-75'
                    : 'bg-[#1e1e1e] border-[#2E2E2E]'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] text-gray-400 uppercase font-mono tracking-wider">Agent 01: Scout</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-mono uppercase ${
                    pipelineStage === 'scout' 
                      ? 'bg-[#00C85322] text-[#00C853]' 
                      : pipelineStage === 'detective' || pipelineStage === 'copywriter' || pipelineStage === 'completed'
                        ? 'bg-gray-800 text-gray-400'
                        : 'bg-[#222] text-gray-600'
                  }`}>
                    {pipelineStage === 'scout' ? 'Active' : pipelineStage === 'detective' || pipelineStage === 'copywriter' || pipelineStage === 'completed' ? 'Done' : 'Waiting'}
                  </span>
                </div>
                <div className="text-xs font-semibold mb-2 text-white">Unstructured Site Scraper</div>
                <p className="text-[10px] text-gray-500 leading-normal mb-3">
                  Parses HTML, detects company name, target industries, & extracts executive leadership.
                </p>
                <div className="w-full h-1 bg-[#2E2E2E] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#00C853] transition-all duration-300"
                    style={{ width: `${pipelineStage === 'scout' ? scoutProgress : (pipelineStage !== 'idle' ? 100 : 0)}%` }}
                  />
                </div>
              </div>

              {/* Agent 2 Card */}
              <div className={`p-4 rounded-lg border transition-all ${
                pipelineStage === 'detective' 
                  ? 'bg-[#00C85308] border-[#00C853] shadow-md shadow-[#00C85311]' 
                  : pipelineStage === 'copywriter' || pipelineStage === 'completed'
                    ? 'bg-[#1e1e1e] border-[#2E2E2E] opacity-75'
                    : 'bg-[#1e1e1e] border-[#2E2E2E]'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] text-gray-400 uppercase font-mono tracking-wider">Agent 02: Detective</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-mono uppercase ${
                    pipelineStage === 'detective' 
                      ? 'bg-[#00C85322] text-[#00C853]' 
                      : pipelineStage === 'copywriter' || pipelineStage === 'completed'
                        ? 'bg-gray-800 text-gray-400'
                        : 'bg-[#222] text-gray-600'
                  }`}>
                    {pipelineStage === 'detective' ? 'Active' : pipelineStage === 'copywriter' || pipelineStage === 'completed' ? 'Done' : 'Waiting'}
                  </span>
                </div>
                <div className="text-xs font-semibold mb-2 text-white font-mono">B2B Corporate Email Verifier</div>
                <p className="text-[10px] text-gray-500 leading-normal mb-3">
                  Programmatically traces personal email structures. STRICTLY filters out hello@, info@, sales@.
                </p>
                <div className="w-full h-1 bg-[#2E2E2E] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#00C853] transition-all duration-300"
                    style={{ width: `${pipelineStage === 'detective' ? detectiveProgress : (pipelineStage === 'copywriter' || pipelineStage === 'completed' ? 100 : 0)}%` }}
                  />
                </div>
              </div>

              {/* Agent 3 Card */}
              <div className={`p-4 rounded-lg border transition-all ${
                pipelineStage === 'copywriter' 
                  ? 'bg-[#00C85308] border-[#00C853] shadow-md shadow-[#00C85311]' 
                  : pipelineStage === 'completed'
                    ? 'bg-[#1e1e1e] border-[#2E2E2E] opacity-75'
                    : 'bg-[#1e1e1e] border-[#2E2E2E]'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] text-gray-400 uppercase font-mono tracking-wider">Agent 03: Copywriter</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-mono uppercase ${
                    pipelineStage === 'copywriter' 
                      ? 'bg-[#00C85322] text-[#00C853]' 
                      : pipelineStage === 'completed'
                        ? 'bg-gray-800 text-gray-400'
                        : 'bg-[#222] text-gray-600'
                  }`}>
                    {pipelineStage === 'copywriter' ? 'Active' : pipelineStage === 'completed' ? 'Done' : 'Waiting'}
                  </span>
                </div>
                <div className="text-xs font-semibold mb-2 text-white">Pomelli Copywriter</div>
                <p className="text-[10px] text-gray-500 leading-normal mb-3">
                  Uses the "Direct Value/Gap Angle" for tailored intro line under 25 words. No fluff.
                </p>
                <div className="w-full h-1 bg-[#2E2E2E] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#00C853] transition-all duration-300"
                    style={{ width: `${pipelineStage === 'copywriter' ? copywriterProgress : (pipelineStage === 'completed' ? 100 : 0)}%` }}
                  />
                </div>
              </div>

            </div>
          </section>

          {/* Diagnostic Console Panel */}
          <section id="logs-terminal" className="bg-[#151515] border border-[#2E2E2E] rounded-xl flex flex-col min-h-[180px] h-[220px]">
            <div className="flex items-center justify-between px-4 py-2 bg-[#1d1d1d] border-b border-[#2E2E2E] rounded-t-xl shrink-0">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#00C853]" />
                <span className="text-[11px] font-mono font-bold text-gray-300">DIAGNOSTIC PIPELINE TRACE LOGS</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-gray-500 font-mono">Agent Category:</span>
                <select
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  className="bg-[#2a2a2a] border border-[#3a3a3a] text-gray-300 text-[10px] rounded px-2 py-0.5 focus:outline-none"
                >
                  <option value="all">ALL SQUADS</option>
                  <option value="scout">01: SCOUT</option>
                  <option value="detective">02: DETECTIVE</option>
                  <option value="copywriter">03: COPYWRITER</option>
                  <option value="pipeline">00: PIPELINE</option>
                </select>
                <button 
                  onClick={fetchLogsAndLeads}
                  className="text-gray-400 hover:text-white p-0.5"
                  title="Refresh logs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 font-mono text-[10.5px] leading-relaxed flex flex-col gap-1.5 scrollbar-thin">
              {filteredLogs.length === 0 ? (
                <div className="text-gray-600 italic text-center py-6">No diagnostic events captured yet.</div>
              ) : (
                filteredLogs.map((log, index) => {
                  let logColor = 'text-blue-400';
                  let bgBadge = 'bg-blue-950/40 text-blue-400 border-blue-900/50';
                  
                  if (log.level === 'success') {
                    logColor = 'text-green-400';
                    bgBadge = 'bg-green-950/40 text-green-400 border-green-900/50';
                  } else if (log.level === 'warning') {
                    logColor = 'text-amber-400';
                    bgBadge = 'bg-amber-950/40 text-amber-400 border-amber-900/50';
                  } else if (log.level === 'error') {
                    logColor = 'text-rose-400';
                    bgBadge = 'bg-rose-950/40 text-rose-400 border-rose-900/50';
                  }

                  return (
                    <div key={index} className="hover:bg-white/[0.02] p-1 rounded transition-colors flex items-start gap-2 border-l border-transparent hover:border-[#00C853]">
                      <span className="text-gray-600 select-none font-light shrink-0">
                        [{new Date(log.timestamp).toLocaleTimeString()}]
                      </span>
                      <span className={`px-1.5 py-0.1 border rounded text-[8.5px] font-bold uppercase tracking-wider shrink-0 font-mono ${bgBadge}`}>
                        {log.agent}
                      </span>
                      <span className={`flex-1 break-words ${logColor}`}>
                        {log.message}
                        {log.details && (
                          <span className="block mt-1 text-[9px] text-gray-500 bg-[#121212] p-2 rounded border border-gray-800/80 max-w-full overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(log.details, null, 2)}
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Cured Leads Preview Table */}
          <section id="leads-table-section" className="flex-1 bg-[#181818] border border-[#2E2E2E] rounded-xl p-5 flex flex-col min-h-[300px]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xs uppercase tracking-[0.2em] text-gray-400 font-mono font-bold">
                  Cured Lead List Results
                </h2>
                <span className="bg-[#2E2E2E] text-gray-300 font-mono text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {filteredLeads.length} Lead{filteredLeads.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-3 self-end md:self-auto w-full md:w-auto">
                
                {/* Search */}
                <div className="relative flex-1 md:w-48">
                  <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search leads, companies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#222] text-xs pl-8 pr-3 py-1.5 rounded-lg border border-[#2E2E2E] focus:outline-none focus:border-[#00C853] placeholder-gray-500 text-gray-200"
                  />
                </div>

                {/* Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#222] border border-[#2E2E2E] text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#00C853] text-gray-300"
                >
                  <option value="all">All Statuses</option>
                  <option value="cured">Cured Leads Only</option>
                  <option value="filtered">Filtered-Out</option>
                </select>

                {/* Export */}
                <button
                  onClick={handleExportCSV}
                  className="bg-[#222] border border-[#2E2E2E] hover:border-gray-500 text-white hover:text-[#00C853] text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors font-mono shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  EXPORT CSV
                </button>
              </div>
            </div>

            {/* Main scrollable table area */}
            <div className="flex-1 overflow-auto border border-[#2E2E2E] rounded-lg bg-[#141414] relative">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#1a1a1a] border-b border-[#2E2E2E] text-[10px] uppercase text-gray-500 font-mono font-bold sticky top-0 z-10">
                  <tr>
                    <th className="p-3">Target Person</th>
                    <th className="p-3">Company</th>
                    <th className="p-3">Verified Email</th>
                    <th className="p-3 text-center">Confidence</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Opening Line Preview (Pomelli)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#252525]">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500 italic">
                        No lead records found. Paste custom website text and hit "Cure Lead List" to generate new ones.
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => (
                      <tr 
                        key={lead.id}
                        onClick={() => setSelectedLead(selectedLead?.id === lead.id ? null : lead)}
                        className={`hover:bg-[#00C85303] group cursor-pointer transition-colors ${
                          selectedLead?.id === lead.id ? 'bg-[#00C85308]' : ''
                        }`}
                      >
                        <td className="p-3 font-semibold text-white whitespace-nowrap">
                          {lead.target_person}
                          <span className="block text-[10px] font-normal text-gray-400 font-mono mt-0.5">{lead.title}</span>
                        </td>
                        <td className="p-3 text-gray-300 whitespace-nowrap font-medium">
                          {lead.company_name}
                          <span className="block text-[9px] text-gray-500 font-normal font-mono mt-0.5">{lead.headquarters_city}</span>
                        </td>
                        <td className="p-3 font-mono text-[#00C853] whitespace-nowrap">
                          {lead.verified_individual_email || (
                            <span className="text-amber-500 font-semibold uppercase text-[9px] flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Blocked Catchall
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center whitespace-nowrap font-mono font-bold">
                          {lead.status === 'cured' ? (
                            <span className="px-2 py-0.5 rounded bg-[#1e2e22] text-[#00C853] text-[10px] border border-[#00C85333]">
                              {(lead.confidence_score * 100).toFixed(0)}%
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-amber-950/40 text-amber-500 text-[10px] border border-amber-900/30">
                              Low
                            </span>
                          )}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {lead.status === 'cured' ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-950/40 text-[#00C853] text-[9px] uppercase tracking-wider font-bold border border-[#00C85333]">
                              Cured
                            </span>
                          ) : (
                            <span 
                              className="px-2 py-0.5 rounded bg-amber-950/40 text-amber-500 text-[9px] uppercase tracking-wider font-bold border border-amber-900/40"
                              title={lead.filter_reason}
                            >
                              Filtered
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-gray-400 max-w-xs truncate leading-relaxed">
                          {lead.status === 'cured' ? (
                            lead.personalized_opening_line
                          ) : (
                            <span className="text-gray-500 italic">Excluded: {lead.filter_reason}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Detail Panel for Selected Lead */}
            {selectedLead && (
              <div className="mt-4 p-4 bg-[#1f1f1f] border border-[#2E2E2E] rounded-lg relative overflow-hidden animate-in fade-in duration-200">
                <div className="absolute top-0 right-0 p-2 text-gray-500 font-mono text-[9px]">
                  ID: {selectedLead.id}
                </div>
                
                <h3 className="text-xs uppercase tracking-wider text-[#00C853] font-mono font-bold mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Lead Curing Detailed Analytics
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase font-mono font-semibold mb-1">Scout Insights</div>
                    <div className="font-semibold text-white text-sm mb-1">{selectedLead.company_name}</div>
                    <div className="text-gray-400 mb-2">Location: {selectedLead.headquarters_city}</div>
                    
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedLead.scouted_services.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-gray-800 text-gray-400 text-[9px] font-mono border border-gray-700/60">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-gray-500 uppercase font-mono font-semibold mb-1">Detective Verification</div>
                    <div className="font-semibold text-white flex items-center gap-1">
                      {selectedLead.target_person}
                    </div>
                    <div className="text-gray-400 mb-2">{selectedLead.title}</div>
                    
                    {selectedLead.status === 'cured' ? (
                      <div className="space-y-1">
                        <div className="font-mono text-[#00C853] break-all">{selectedLead.verified_individual_email}</div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          Method: {selectedLead.pattern_used} (Conf: {(selectedLead.confidence_score * 100).toFixed(0)}%)
                        </div>
                      </div>
                    ) : (
                      <div className="text-amber-500 font-mono flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Excluded from campaign output.
                        <span className="block text-[10px] text-gray-400 mt-1">Reason: {selectedLead.filter_reason}</span>
                      </div>
                    )}
                  </div>

                  <div className="md:border-l md:border-[#2E2E2E] md:pl-6 col-span-1 md:col-span-1">
                    <div className="text-[10px] text-gray-500 uppercase font-mono font-semibold mb-1 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-[#00C853]" /> Pomelli Opening Line (Direct Value Angle)
                    </div>
                    {selectedLead.status === 'cured' ? (
                      <div>
                        <blockquote className="italic text-gray-200 bg-[#151515] p-2.5 rounded border-l-2 border-[#00C853] leading-relaxed mb-1 text-xs">
                          "{selectedLead.personalized_opening_line}"
                        </blockquote>
                        <div className="text-[9px] text-gray-500 font-mono text-right">
                          Length: {selectedLead.personalized_opening_line.split(' ').length} words (Strict Limit: &lt;25 words)
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500 italic">No copy generated. Direct individual address was filtered out to protect sender domain reputation.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Preset trigger utility section to clear lists */}
          <div className="flex items-center justify-between text-xs text-gray-500 bg-[#181818] border border-[#2E2E2E] rounded-xl px-5 py-3 shrink-0">
            <span className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5" /> Clear cache or reload Nairobi defaults:
            </span>
            <button
              onClick={handleResetDatabase}
              className="text-[#00C853] hover:text-[#00e65c] font-semibold flex items-center gap-1 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Database & Terminal Logs
            </button>
          </div>

        </div>

      </main>

      {/* Footer Bar */}
      <footer className="h-10 px-6 bg-[#0a0a0a] border-t border-[#2E2E2E] flex items-center justify-between text-[10px] text-gray-500 font-mono shrink-0">
        <div>PIPELINE: GOOGLE ANTIGRAVITY AGENT SQUAD v1.1.2</div>
        <div className="hidden sm:flex items-center gap-6">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> 
            FIREBASE CLOUD FIRESTORE ACTIVE
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> 
            GEMINI-3.5-FLASH ON-DEMAND
          </span>
        </div>
        <div>PROJECT_CODE: LEAD_CURE_XP2026</div>
      </footer>

    </div>
  );
}
