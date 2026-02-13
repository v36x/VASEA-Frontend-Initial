"use client";
 import React, { useState, useEffect, useRef } from 'react';

import { Terminal, Send, CheckCircle, AlertCircle, Code } from 'lucide-react';

import ReactMarkdown from 'react-markdown';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';


const VASEA_WS_URL = "ws://localhost:8000/ws"; // Swap with your Ngrok URL


export default function VaseaDashboard() {

  const [prompt, setPrompt] = useState("");

  const [messages, setMessages] = useState([]);

  const [streamingPRD, setStreamingPRD] = useState("");

  const [isAwaitingApproval, setIsAwaitingApproval] = useState(false);

  const [feedback, setFeedback] = useState("");

  const ws = useRef(null);


  useEffect(() => {

    ws.current = new WebSocket(VASEA_WS_URL);

    ws.current.onmessage = (event) => {

      const data = JSON.parse(event.data);

      handleServerMessage(data);

    };

    return () => ws.current.close();

  }, []);


  const handleServerMessage = (data) => {

    if (data.type === "prd_stream") {

      setStreamingPRD((prev) => prev + data.content);

    } else if (data.type === "node_complete") {

      // Logic to detect if we hit the 'interrupt' before coder

      if (data.data.pm) {

        setIsAwaitingApproval(true);

      }

      setMessages((prev) => [...prev, data.data]);

    }

  };


  const startAgency = () => {

    const payload = { type: "start", prompt: prompt };

    ws.current.send(JSON.stringify(payload));

  };


  const approvePRD = () => {

    const payload = { type: "approve_prd", feedback: feedback };

    ws.current.send(JSON.stringify(payload));

    setIsAwaitingApproval(false);

    setFeedback("");

  };


  return (

    <div className="min-h-screen bg-slate-900 text-white p-6 font-mono">

      {/* Header */}

      <header className="border-b border-slate-700 pb-4 mb-6 flex justify-between items-center">

        <h1 className="text-2xl font-bold text-cyan-400">VASEA v1.0 <span className="text-sm font-light text-slate-400">| Versatile Autonomous Software Engineering Agency</span></h1>

        <div className="flex items-center gap-2 text-green-400 text-sm">

          <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div> Local Node Active

        </div>

      </header>


      <div className="grid grid-cols-12 gap-6">

        {/* Left: Input & Control */}

        <div className="col-span-4 space-y-4">

          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">

            <label className="block text-xs uppercase text-slate-400 mb-2">Agency Prompt</label>

            <textarea 

              className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm focus:border-cyan-500 outline-none"

              rows="4"

              value={prompt}

              onChange={(e) => setPrompt(e.target.value)}

              placeholder="Describe the software you want VASEA to build..."

            />

            <button 

              onClick={startAgency}

              className="mt-3 w-full bg-cyan-600 hover:bg-cyan-500 py-2 rounded font-bold flex items-center justify-center gap-2"

            >

              <Send size={16}/> Initialize Agent Flow

            </button>

          </div>


          {isAwaitingApproval && (

            <div className="bg-amber-900/30 border border-amber-600 p-4 rounded-lg">

              <h3 className="text-amber-400 font-bold mb-2 flex items-center gap-2">

                <AlertCircle size={18}/> Lead Engineer Review Required

              </h3>

              <textarea 

                className="w-full bg-slate-900 border border-amber-700 rounded p-2 text-sm text-white mb-2"

                placeholder="Add feedback to refine PRD or leave blank to approve..."

                value={feedback}

                onChange={(e) => setFeedback(e.target.value)}

              />

              <button 

                onClick={approvePRD}

                className="w-full bg-amber-600 hover:bg-amber-500 py-2 rounded font-bold"

              >

                Approve & Start Coding

              </button>

            </div>

          )}

        </div>


        {/* Right: The Live Output Feed */}

        <div className="col-span-8 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden flex flex-col h-[80vh]">

          <div className="bg-slate-700 px-4 py-2 text-xs flex items-center gap-2">

            <Terminal size={14}/> agent_orchestrator_logs

          </div>

          <div className="p-4 overflow-y-auto flex-1 space-y-6">

            {/* PRD Stream Section */}

            {streamingPRD && (

              <div className="prose prose-invert max-w-none text-sm bg-slate-900 p-4 rounded border border-slate-700">

                <h2 className="text-cyan-400 text-lg border-b border-slate-700 pb-2 mb-4">Drafting PRD...</h2>

                <ReactMarkdown>{streamingPRD}</ReactMarkdown>

              </div>

            )}

            

            {/* Displaying Code Blocks from coder_node */}

            {messages.map((m, i) => m.coder && (

              <div key={i} className="mt-4">

                <div className="flex items-center gap-2 text-purple-400 mb-2 font-bold">

                  <Code size={18}/> Generated Artifacts

                </div>

                {/* Parse the JSON content from your coder_node here */}

                <SyntaxHighlighter language="python" style={vscDarkPlus} customStyle={{fontSize: '12px'}}>

                  {m.coder.code_output}

                </SyntaxHighlighter>

              </div>

            ))}

          </div>

        </div>

      </div>

    </div>

  );

} 
