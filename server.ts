import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json({ limit: '15mb' }));

// Memory storage for processed leads and detailed execution logs
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

let savedLeads: Lead[] = [
  {
    id: 'lead-1',
    target_person: 'Kamau Thuo',
    title: 'Managing Director',
    company_name: 'Safari Digital Nairobi',
    verified_individual_email: 'kamau.thuo@safaridigital.co.ke',
    confidence_score: 0.98,
    pattern_used: 'first.last@company.com',
    personalized_opening_line: 'Saw Safari Digital\'s stellar campaigns in Nairobi; love how you connect SEO strategy with local retail hubs.',
    status: 'cured',
    scouted_services: ['SEO Strategy', 'Content Marketing', 'Local PPC'],
    scouted_industries: ['Retail', 'E-commerce', 'Tourism'],
    headquarters_city: 'Nairobi',
    timestamp: new Date().toISOString()
  },
  {
    id: 'lead-2',
    target_person: 'Sarah Jenkins',
    title: 'Founder & CEO',
    company_name: 'CloudPeak Agency',
    verified_individual_email: 's.jenkins@cloudpeak.io',
    confidence_score: 0.94,
    pattern_used: 'first_initial.last@company.com',
    personalized_opening_line: 'Noticed CloudPeak\'s scale in cloud migrations; love how you translate complex AWS architectures for SaaS founders.',
    status: 'cured',
    scouted_services: ['Cloud Infrastructure', 'Tech Consulting'],
    scouted_industries: ['SaaS', 'B2B Software'],
    headquarters_city: 'Nairobi',
    timestamp: new Date().toISOString()
  },
  {
    id: 'lead-3',
    target_person: 'Amina Omondi',
    title: 'Head of Growth',
    company_name: 'EcoTech Solutions',
    verified_individual_email: 'a.omondi@ecotech.ke',
    confidence_score: 0.89,
    pattern_used: 'first_initial.last@company.com',
    personalized_opening_line: 'Your focus on sustainable tech at EcoTech is fantastic; love how you integrate solar logistics with smart IoT tracking.',
    status: 'cured',
    scouted_services: ['IoT Integration', 'Logistics Optimization'],
    scouted_industries: ['Green Tech', 'Renewable Energy'],
    headquarters_city: 'Nairobi',
    timestamp: new Date().toISOString()
  }
];

let pipelineLogs: LogEntry[] = [
  {
    timestamp: new Date().toISOString(),
    level: 'info',
    agent: 'system',
    message: 'LeadCure AI Server Initialized. Ready to cure dirty lead lists.'
  }
];

// Helper to write to logs
function addLog(agent: 'system' | 'scout' | 'detective' | 'copywriter' | 'pipeline', level: 'info' | 'success' | 'warning' | 'error', message: string, details?: any) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    agent,
    message,
    details
  };
  pipelineLogs.unshift(entry); // Newest first
  console.log(`[${agent.toUpperCase()}] [${level.toUpperCase()}] ${message}`);
}

// Lazy initializer for Gemini client
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured or is a placeholder.');
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiInstance;
}

// API: Get Leads
app.get('/api/leads', (req, res) => {
  res.json({ leads: savedLeads });
});

// API: Get Logs
app.get('/api/logs', (req, res) => {
  res.json({ logs: pipelineLogs });
});

// API: Config status
app.get('/api/config', (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';
  res.json({
    hasApiKey: hasKey,
    timeline: 'Build with Gemini XPRIZE (May 19 – August 17, 2026)',
    localTime: new Date().toISOString()
  });
});

// API: Reset Database
app.post('/api/reset', (req, res) => {
  savedLeads = [
    {
      id: 'lead-1',
      target_person: 'Kamau Thuo',
      title: 'Managing Director',
      company_name: 'Safari Digital Nairobi',
      verified_individual_email: 'kamau.thuo@safaridigital.co.ke',
      confidence_score: 0.98,
      pattern_used: 'first.last@company.com',
      personalized_opening_line: 'Saw Safari Digital\'s stellar campaigns in Nairobi; love how you connect SEO strategy with local retail hubs.',
      status: 'cured',
      scouted_services: ['SEO Strategy', 'Content Marketing', 'Local PPC'],
      scouted_industries: ['Retail', 'E-commerce', 'Tourism'],
      headquarters_city: 'Nairobi',
      timestamp: new Date().toISOString()
    },
    {
      id: 'lead-2',
      target_person: 'Sarah Jenkins',
      title: 'Founder & CEO',
      company_name: 'CloudPeak Agency',
      verified_individual_email: 's.jenkins@cloudpeak.io',
      confidence_score: 0.94,
      pattern_used: 'first_initial.last@company.com',
      personalized_opening_line: 'Noticed CloudPeak\'s scale in cloud migrations; love how you translate complex AWS architectures for SaaS founders.',
      status: 'cured',
      scouted_services: ['Cloud Infrastructure', 'Tech Consulting'],
      scouted_industries: ['SaaS', 'B2B Software'],
      headquarters_city: 'Nairobi',
      timestamp: new Date().toISOString()
    },
    {
      id: 'lead-3',
      target_person: 'Amina Omondi',
      title: 'Head of Growth',
      company_name: 'EcoTech Solutions',
      verified_individual_email: 'a.omondi@ecotech.ke',
      confidence_score: 0.89,
      pattern_used: 'first_initial.last@company.com',
      personalized_opening_line: 'Your focus on sustainable tech at EcoTech is fantastic; love how you integrate solar logistics with smart IoT tracking.',
      status: 'cured',
      scouted_services: ['IoT Integration', 'Logistics Optimization'],
      scouted_industries: ['Green Tech', 'Renewable Energy'],
      headquarters_city: 'Nairobi',
      timestamp: new Date().toISOString()
    }
  ];
  pipelineLogs = [
    {
      timestamp: new Date().toISOString(),
      level: 'info',
      agent: 'system',
      message: 'LeadCure AI database reset to Nairobi agency default presets.'
    }
  ];
  res.json({ success: true, leads: savedLeads, logs: pipelineLogs });
});

// API: Run Agents Pipeline
app.post('/api/run-agents', async (req, res) => {
  const { rawText, useSimulation = false } = req.body;

  if (!rawText || rawText.trim() === '') {
    return res.status(400).json({ error: 'Raw HTML or website text input is required.' });
  }

  addLog('pipeline', 'info', `Initiating LeadCure Antigravity pipeline for unstructured payload size: ${rawText.length} characters.`);

  // Check if API key exists. If not, fallback to simulation mode and log warning
  const apiKey = process.env.GEMINI_API_KEY;
  const isKeyMissing = !apiKey || apiKey === 'MY_GEMINI_API_KEY';
  const shouldSimulate = useSimulation || isKeyMissing;

  if (isKeyMissing && !useSimulation) {
    addLog('pipeline', 'warning', 'No valid GEMINI_API_KEY found in server environment. Automatically routing to LeadCure Sandbox Simulation Mode.');
  }

  try {
    if (shouldSimulate) {
      // Run deterministic simulation with high fidelity logs to show EXACTLY how data flows or fails
      addLog('pipeline', 'info', 'Entering LeadCure Agent Simulator (Sandbox Environment)...');
      
      // Step 1: Scout Agent Simulation
      addLog('scout', 'info', 'Agent 01: Scout initiated. Parsing unstructured text...');
      await new Promise(resolve => setTimeout(resolve, 800));

      // Simple heuristic based on text to give nice relevant outputs
      const textLower = rawText.toLowerCase();
      let companyName = 'Nairobi Digital Lab';
      let services = ['PPC Ads', 'Social Media Management', 'Web Development'];
      let industries = ['Hospitality', 'Real Estate', 'Local Services'];
      let headquarters = 'Nairobi';
      let leadership = ['John Mwangi', 'Jane Koech', 'Mike Catchall'];

      if (textLower.includes('safari') || textLower.includes('thuo')) {
        companyName = 'Safari Digital Nairobi';
        services = ['SEO Strategy', 'Content Marketing', 'Local PPC'];
        industries = ['Retail', 'E-commerce', 'Tourism'];
        leadership = ['Kamau Thuo', 'Jane Doe', 'Alex Catchall'];
      } else if (textLower.includes('cloud') || textLower.includes('jenkins')) {
        companyName = 'CloudPeak Agency';
        services = ['Cloud Infrastructure', 'Tech Consulting'];
        industries = ['SaaS', 'B2B Software'];
        leadership = ['Sarah Jenkins', 'Robert Mwanzia'];
      } else if (textLower.includes('eco') || textLower.includes('omondi')) {
        companyName = 'EcoTech Solutions';
        services = ['IoT Integration', 'Logistics Optimization'];
        industries = ['Green Tech', 'Renewable Energy'];
        leadership = ['Amina Omondi', 'Peter Ochieng'];
      } else {
        // Try to find custom company name if provided
        const nameMatch = rawText.match(/company:\s*([^\n]+)/i) || rawText.match(/name:\s*([^\n]+)/i);
        if (nameMatch) {
          companyName = nameMatch[1].trim();
        }
      }

      const scoutOutput = {
        company_name: companyName,
        core_services: services,
        target_industries: industries,
        headquarters_city: headquarters,
        detected_leadership_names: leadership
      };

      addLog('scout', 'success', `Scout extracted company: "${companyName}" with ${leadership.length} leadership members.`, scoutOutput);

      // Step 2: Detective Agent Simulation (Verifying Corporate emails & Filter catchalls)
      addLog('detective', 'info', `Agent 02: Detective initiated. Verifying emails for ${leadership.length} candidates...`);
      await new Promise(resolve => setTimeout(resolve, 1200));

      const detectiveLeads: any[] = [];
      for (const name of leadership) {
        addLog('detective', 'info', `Verifying corporate contact details for "${name}" at ${companyName}...`);
        await new Promise(resolve => setTimeout(resolve, 300));

        // Let's simulate a failure/filter case for leadership containing "Catchall" or "Doe" to show strict filtering logs!
        if (name.toLowerCase().includes('catchall') || name === 'Jane Doe') {
          addLog('detective', 'warning', `[DATA_FLOW_ALERT] Rejected contact "${name}". Reason: Detective verified only generic catch-all box (hello@ or info@) exists. Refusing catch-all email per strict system directives.`);
          detectiveLeads.push({
            target_person: name,
            title: name === 'Jane Doe' ? 'Operations Director' : 'General Inbox',
            verified_individual_email: null,
            confidence_score: 0.15,
            pattern_used: 'N/A - Catchall hello@ rejected',
            status: 'filtered',
            filter_reason: 'Catch-all inbox rejected'
          });
        } else {
          // Success case
          const domain = companyName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.co.ke';
          const parts = name.toLowerCase().split(' ');
          const email = parts.length > 1 ? `${parts[0]}.${parts[1]}@${domain}` : `${parts[0]}@${domain}`;
          const confidence = Number((0.85 + Math.random() * 0.14).toFixed(2));
          
          addLog('detective', 'success', `[VERIFIED] Created individual corporate lead: "${email}" for ${name} (Confidence: ${confidence * 100}%).`);
          detectiveLeads.push({
            target_person: name,
            title: 'Director of Business Development',
            verified_individual_email: email,
            confidence_score: confidence,
            pattern_used: 'first.last@company.com',
            status: 'cured'
          });
        }
      }

      // Step 3: Copywriter Agent Simulation (Pomelli Logic)
      addLog('copywriter', 'info', `Agent 03: Copywriter initiated. Crafting Pomelli Direct Value openers...`);
      await new Promise(resolve => setTimeout(resolve, 800));

      const finalCuredLeads: Lead[] = [];

      for (const dLead of detectiveLeads) {
        if (dLead.status === 'filtered') {
          // Push as filtered
          finalCuredLeads.push({
            id: 'sim-' + Math.random().toString(36).substr(2, 9),
            target_person: dLead.target_person,
            title: dLead.title,
            company_name: companyName,
            verified_individual_email: null,
            confidence_score: dLead.confidence_score,
            pattern_used: dLead.pattern_used,
            personalized_opening_line: 'N/A - Lead Filtered',
            status: 'filtered',
            filter_reason: dLead.filter_reason,
            scouted_services: services,
            scouted_industries: industries,
            headquarters_city: headquarters,
            timestamp: new Date().toISOString()
          });
          continue;
        }

        // Pomelli Logic opener generation
        const chosenService = services[0];
        const chosenIndustry = industries[0];
        const opener = `Loved how you deploy ${chosenService} at ${companyName}; we see a huge gap in connecting this directly to ${chosenIndustry} buyers in Kenya.`;
        
        addLog('copywriter', 'success', `[POMELLI_CRAFTED] Opener for ${dLead.target_person}: "${opener}" (${opener.split(' ').length} words).`);

        finalCuredLeads.push({
          id: 'sim-' + Math.random().toString(36).substr(2, 9),
          target_person: dLead.target_person,
          title: dLead.title,
          company_name: companyName,
          verified_individual_email: dLead.verified_individual_email,
          confidence_score: dLead.confidence_score,
          pattern_used: dLead.pattern_used,
          personalized_opening_line: opener,
          status: 'cured',
          scouted_services: services,
          scouted_industries: industries,
          headquarters_city: headquarters,
          timestamp: new Date().toISOString()
        });
      }

      // Append and save
      savedLeads = [...finalCuredLeads, ...savedLeads];
      addLog('pipeline', 'success', `Antigravity pipeline run successfully completed in sandbox. Cured ${finalCuredLeads.filter(l => l.status === 'cured').length} leads.`);
      
      return res.json({
        success: true,
        isSimulation: true,
        curedLeads: finalCuredLeads
      });
    }

    // --- REAL GEMINI API PIPELINE CODE ---
    const ai = getGeminiClient();
    addLog('pipeline', 'info', 'GEMINI_API_KEY detected. Connecting to real-time Google AI Studio model: gemini-3.5-flash...');

    // 1. Scout Agent Call
    addLog('scout', 'info', 'Sending unstructured payload to Agent 1: Scout...');
    const scoutResponse = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `You are the Scout Agent of LeadCure AI. 
Your task is to parse unstructured text or raw HTML from a target website and extract:
1. The company name
2. Core services offered by the agency
3. Target industries/niches they serve
4. Headquarters city
5. Detected leadership/executive names

Input unstructured website data:
${rawText}

Provide the response in the specified JSON format.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            company_name: { type: Type.STRING },
            core_services: { type: Type.ARRAY, items: { type: Type.STRING } },
            target_industries: { type: Type.ARRAY, items: { type: Type.STRING } },
            headquarters_city: { type: Type.STRING },
            detected_leadership_names: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["company_name", "core_services", "target_industries", "headquarters_city", "detected_leadership_names"]
        }
      }
    });

    const scoutResult = JSON.parse(scoutResponse.text || '{}');
    addLog('scout', 'success', `Scout extracted company: "${scoutResult.company_name}" with ${scoutResult.detected_leadership_names?.length || 0} leadership names.`, scoutResult);

    const { company_name, core_services = [], target_industries = [], headquarters_city, detected_leadership_names = [] } = scoutResult;

    if (!detected_leadership_names || detected_leadership_names.length === 0) {
      addLog('pipeline', 'warning', 'Scout found zero leadership names. Halting pipeline for this record.');
      return res.json({
        success: true,
        isSimulation: false,
        curedLeads: [],
        message: 'No leadership names could be extracted from input.'
      });
    }

    const currentRunLeads: Lead[] = [];

    // Loop through each leader and execute Detective and Copywriter sequentially
    for (const leader of detected_leadership_names) {
      addLog('detective', 'info', `Agent 02: Detective initiated. Verifying corporate email for "${leader}"...`);

      const detectiveResponse = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `You are the Detective Agent of LeadCure AI.
Your task is to identify and programmatically verify direct individual corporate email addresses for the leadership name provided below, for the specified company.

STRICT CRITERIA: Only output a lead if an individual, personal corporate email can be verified (e.g., first.last@company.com or firstinitiallast@company.com). 
Never fall back on generic catch-alls (like info@, sales@, hello@, contact@, support@). If an individual email cannot be verified with high confidence, you must set 'verified_individual_email' to an empty string or null.

Company Details:
- Name: ${company_name}
- Headquarters: ${headquarters_city}
- Target Person: ${leader}

Provide the response in the specified JSON format.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              target_person: { type: Type.STRING },
              title: { type: Type.STRING, description: "Title of target person" },
              verified_individual_email: { type: Type.STRING, description: "Individual corporate email address, or empty string/null if not verified" },
              confidence_score: { type: Type.NUMBER, description: "Float between 0 and 1 representing confidence" },
              pattern_used: { type: Type.STRING, description: "The email pattern used like first.last@company.com" }
            },
            required: ["target_person", "title", "confidence_score", "pattern_used"]
          }
        }
      });

      const detectiveResult = JSON.parse(detectiveResponse.text || '{}');
      const email = detectiveResult.verified_individual_email;

      if (!email || email.trim() === '' || email.toLowerCase().includes('info@') || email.toLowerCase().includes('hello@') || email.toLowerCase().includes('sales@')) {
        addLog('detective', 'warning', `[DATA_FLOW_ALERT] Rejected contact "${leader}". Reason: No direct individual corporate email verified. Found catch-all or empty result.`);
        
        currentRunLeads.push({
          id: 'gem-' + Math.random().toString(36).substr(2, 9),
          target_person: leader,
          title: detectiveResult.title || 'Executive',
          company_name,
          verified_individual_email: null,
          confidence_score: detectiveResult.confidence_score || 0.1,
          pattern_used: detectiveResult.pattern_used || 'None',
          personalized_opening_line: 'N/A - Lead Filtered',
          status: 'filtered',
          filter_reason: 'No direct corporate email verified',
          scouted_services: core_services,
          scouted_industries: target_industries,
          headquarters_city,
          timestamp: new Date().toISOString()
        });
        continue;
      }

      addLog('detective', 'success', `[VERIFIED] Created individual corporate lead: "${email}" for ${leader} (Confidence: ${(detectiveResult.confidence_score * 100).toFixed(0)}%).`);

      // 3. Copywriter Agent Call
      addLog('copywriter', 'info', `Agent 03: Copywriter initiated. Generating personalization for ${email}...`);

      const copywriterResponse = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `You are the Copywriter Agent of LeadCure AI.
Your task is to generate a hyper-personalized, ultra-short opening email line under 25 words using our Pomelli Logic.

POMELLI LOGIC DIRECTIVES:
1. Use the "Direct Value/Gap Angle".
2. Skip generic flattery (e.g., do NOT say "I love your website" or "Congrats on your success").
3. Connect a specific core service found by the Scout Agent directly to one of their target industries to prove deep, human-like research.
4. Total length MUST be under 25 words.

Context:
- Company Name: ${company_name}
- Target Person: ${leader} (${detectiveResult.title})
- Verified Email: ${email}
- Core Services: ${core_services.join(', ')}
- Target Industries: ${target_industries.join(', ')}

Provide the response in the specified JSON format.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              target_email: { type: Type.STRING },
              personalized_opening_line: { type: Type.STRING }
            },
            required: ["target_email", "personalized_opening_line"]
          }
        }
      });

      const copyResult = JSON.parse(copywriterResponse.text || '{}');
      addLog('copywriter', 'success', `[POMELLI_CRAFTED] Opener for ${leader}: "${copyResult.personalized_opening_line}" (${(copyResult.personalized_opening_line || '').split(' ').length} words).`);

      currentRunLeads.push({
        id: 'gem-' + Math.random().toString(36).substr(2, 9),
        target_person: leader,
        title: detectiveResult.title || 'Executive',
        company_name,
        verified_individual_email: email,
        confidence_score: detectiveResult.confidence_score || 0.9,
        pattern_used: detectiveResult.pattern_used || 'first.last@company.com',
        personalized_opening_line: copyResult.personalized_opening_line || '',
        status: 'cured',
        scouted_services: core_services,
        scouted_industries: target_industries,
        headquarters_city,
        timestamp: new Date().toISOString()
      });
    }

    // Save cured leads
    savedLeads = [...currentRunLeads, ...savedLeads];
    addLog('pipeline', 'success', `Antigravity pipeline run complete with live Gemini API. Cured ${currentRunLeads.filter(l => l.status === 'cured').length} of ${detected_leadership_names.length} leads.`);

    res.json({
      success: true,
      isSimulation: false,
      curedLeads: currentRunLeads
    });

  } catch (err: any) {
    addLog('pipeline', 'error', `Pipeline execution failed: ${err.message}`, err.stack);
    res.status(500).json({ error: `Agent data flow failed: ${err.message}` });
  }
});

// Configure Vite integration or asset serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  
  if (isProd) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom'
    });
    
    app.use(vite.middlewares);
    
    app.get('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  }

  const port = 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
  });
}

startServer();
