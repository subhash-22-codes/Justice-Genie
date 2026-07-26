import React, { useState } from 'react';
import { FaCheckCircle, FaArrowRight, FaTimes, FaBalanceScale } from 'react-icons/fa';

export default function BenchmarkLibrary() {
  const [activeBenchmark, setActiveBenchmark] = useState(null);

  // Scalable Data Structure for the Benchmark Library
  const benchmarks = [
    {
      id: 1,
      topic: "Employment & IP Law",
      title: "Employee IP Ownership",
      shortQuery: '"I developed an AI tool on my personal laptop after hours. My employer claims they own it based on my contract. Can they legally take ownership?"',
      fullQuery: "I am working as a software engineer in an IT company in India. I developed an AI tool completely on my personal laptop, at home, after office hours, using my own internet and without using any company code or resources. After I launched it, my employer claimed they own the entire product because my employment contract says all inventions created during employment belong to the company. Can they legally take ownership of my AI startup? What factors determine who owns the intellectual property? What legal remedies do I have if they send me a legal notice? Please explain the applicable Indian laws, important court judgments, practical steps, and any exceptions.",
      jgScore: "8.8",
      gpScore: "8.6",
      winner: "Justice Genie",
      summary: "Justice Genie demonstrated stronger statutory reasoning and legal analysis, while Gemini Pro excelled in readability and practical guidance.",
      jgStrengths: [
        "Better statutory analysis",
        "Better legal reasoning",
        "Better explanation of Indian laws",
        "Better interpretation of Copyright Act Section 17",
        "More comprehensive discussion of legal remedies",
        "Better educational value",
        "More cautious legal conclusions",
        "Better handling of legal uncertainty"
      ],
      gpStrengths: [
        "Better conversational readability",
        "Better practical action plan",
        "Better evidence checklist",
        "Easier for beginners to understand"
      ],
      aspects: [
        { aspect: "Understanding User Facts", jg: "9.5", gp: "9.5", winner: "Tie", why: "Both understood the core facts perfectly." },
        { aspect: "Legal Accuracy", jg: "8.5", gp: "7.5", winner: "Justice Genie", why: "Better nuance regarding IP ownership clauses." },
        { aspect: "Applicable Statutes", jg: "9.5", gp: "8.0", winner: "Justice Genie", why: "Specific citation of Indian Copyright Act." },
        { aspect: "Contract Law Analysis", jg: "9.0", gp: "8.0", winner: "Justice Genie", why: "Deeper dive into restrictive covenants." },
        { aspect: "Practical Advice", jg: "8.5", gp: "9.5", winner: "Gemini Pro", why: "Highly actionable, step-by-step formatting." },
        { aspect: "Legal Remedies", jg: "9.5", gp: "8.5", winner: "Justice Genie", why: "Detailed specific domestic remedies." },
        { aspect: "Clarity & Readability", jg: "8.0", gp: "9.5", winner: "Gemini Pro", why: "Superior conversational tone and layout." }
      ]
    },
    {
      id: 2,
      topic: "Consumer Protection",
      title: "E-Commerce Fraud & Liability",
      shortQuery: '"I purchased a ₹92,000 laptop online but received a used one. The marketplace rejected my return claim after 20 days. What are my rights?"',
      fullQuery: "I purchased a laptop worth ₹92,000 from an online marketplace in India. The seller delivered a completely different used laptop instead of the new one I ordered. I immediately reported the issue through the platform and uploaded photos and an unboxing video, but after 20 days the marketplace rejected my claim saying the return window had expired. The seller has stopped responding. I paid using a credit card. What legal rights do I have under Indian law? Can I file a complaint against both the seller and the marketplace? Can I seek a refund, compensation, or replacement? Please explain the applicable Indian laws, relevant legal principles, practical steps, required evidence, limitation period, and available legal remedies.",
      jgScore: "9.0",
      gpScore: "8.8",
      winner: "Justice Genie",
      summary: "Justice Genie provided superior statutory analysis and consumer remedies, while Gemini Pro offered better chargeback guidance and user experience.",
      jgStrengths: [
        "Better statutory analysis",
        "Better explanation of consumer remedies",
        "Better evidence guidance",
        "Better criminal law discussion",
        "Better handling of legal uncertainty",
        "Better educational value"
      ],
      gpStrengths: [
        "Chargeback guidance",
        "Readability",
        "User experience"
      ],
      aspects: [
        { aspect: "Understanding User Facts", jg: "9.5", gp: "9.5", winner: "Tie", why: "Both accurately identified the wrong product, delayed rejection, unboxing video, seller, marketplace, and credit card payment." },
        { aspect: "Legal Accuracy", jg: "9.0", gp: "8.5", winner: "Justice Genie", why: "Better distinction between consumer and criminal remedies and more balanced legal reasoning." },
        { aspect: "Applicable Statutes", jg: "9.5", gp: "9.0", winner: "Justice Genie", why: "Covered the Consumer Protection Act, E-Commerce Rules, IPC, while Gemini relied on a narrower statutory discussion." },
        { aspect: "Marketplace Liability", jg: "9.0", gp: "9.0", winner: "Tie", why: "Both correctly explained the potential liability of online marketplaces beyond merely acting as intermediaries." },
        { aspect: "Consumer Remedies", jg: "9.5", gp: "9.0", winner: "Justice Genie", why: "Better explanation of refund, replacement, compensation, punitive damages, and consumer forum remedies." },
        { aspect: "Practical Advice", jg: "9.5", gp: "9.5", winner: "Tie", why: "Both presented an excellent practical step-by-step action plan." },
        { aspect: "Evidence Guidance", jg: "9.5", gp: "9.0", winner: "Justice Genie", why: "More complete evidence checklist including invoices, payment proof, communications, tracking details, delivery records, and unboxing evidence." },
        { aspect: "Chargeback Guidance", jg: "9.0", gp: "9.5", winner: "Gemini Pro", why: "Stronger emphasis on immediately initiating a credit-card chargeback and explaining its strategic importance." },
        { aspect: "Criminal Law Discussion", jg: "8.5", gp: "7.0", winner: "Justice Genie", why: "Better explanation of when cheating provisions may apply and the distinction between civil and criminal remedies." },
        { aspect: "Handling Uncertainty", jg: "9.0", gp: "8.5", winner: "Justice Genie", why: "Used more careful language where facts determine liability rather than making broad conclusions." },
        { aspect: "Factual Reliability", jg: "8.5", gp: "8.5", winner: "Tie", why: "Neither response contained obvious fabricated legal principles." },
        { aspect: "Clarity & Readability", jg: "8.5", gp: "9.5", winner: "Gemini Pro", why: "Easier for non-lawyers to understand." },
        { aspect: "Educational Value", jg: "9.5", gp: "8.5", winner: "Justice Genie", why: "Better explanation of legal principles and why they apply." },
        { aspect: "User Experience", jg: "8.8", gp: "9.5", winner: "Gemini Pro", why: "More concise, approachable, and action-oriented." }
      ]
    }
  ];

  return (
    <section id="benchmarks" className="py-12 sm:py-16 md:py-24 bg-slate-50/50 dark:bg-slate-900/20 border-y border-slate-100 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] sm:text-[10px] md:text-xs font-semibold uppercase tracking-wider mb-3 sm:mb-4">
            <FaBalanceScale className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Benchmark Library
          </span>
          <h2 className="font-poppins text-xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white leading-tight mb-3 sm:mb-4">
            See How We Reason Through Real Law
          </h2>
          <p className="font-manrope text-xs sm:text-sm md:text-base text-slate-500 dark:text-slate-400 px-2 sm:px-0">
            Transparent, side-by-side evaluations of Justice Genie against general-purpose AI using complex Indian legal scenarios.
          </p>
        </div>

        {/* Compact Cards Grid */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
          {benchmarks.map((bench) => (
            <div key={bench.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-6 flex flex-col shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900/50 transition-all">
              <div className="flex justify-between items-start mb-3 sm:mb-4">
                <div>
                  <span className="text-[9px] sm:text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                    {bench.topic}
                  </span>
                  <h3 className="font-poppins font-semibold text-base sm:text-lg text-slate-900 dark:text-white mt-2.5 sm:mt-3 line-clamp-1">
                    {bench.title}
                  </h3>
                </div>
                <div className="flex flex-col items-end flex-shrink-0 ml-2">
                  <span className="font-manrope text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold mb-1">Overall Winner</span>
                  <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 px-2 sm:px-2.5 py-1 rounded-md border border-slate-100 dark:border-slate-700">
                    🏆 {bench.winner === "Justice Genie" ? "JG" : bench.winner}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 sm:p-4 border border-slate-100 dark:border-slate-800 mb-4 sm:mb-5 flex-grow">
                <span className="font-poppins text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase">Query Preview</span>
                <p className="font-manrope text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic mt-1 line-clamp-3">
                  {bench.shortQuery}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                    <img src="/images/jg_original_logo_1.png" alt="JG" className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="font-poppins text-[10px] sm:text-xs font-semibold text-slate-900 dark:text-white truncate">JG Quick 1.0</span>
                  </div>
                  <div className="font-poppins font-bold text-lg sm:text-xl text-blue-600 dark:text-blue-400">{bench.jgScore}<span className="text-[10px] sm:text-xs text-slate-400">/10</span></div>
                </div>
                <div className="w-px h-8 sm:h-10 bg-slate-200 dark:bg-slate-800"></div>
                <div className="flex-1 text-right">
                  <div className="flex items-center justify-end gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                    <img src="/images/Gemini_logo.png" alt="GP" className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="font-poppins text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">Gemini Pro</span>
                  </div>
                  <div className="font-poppins font-bold text-lg sm:text-xl text-slate-700 dark:text-slate-300">{bench.gpScore}<span className="text-[10px] sm:text-xs text-slate-400">/10</span></div>
                </div>
              </div>

              <p className="font-manrope text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-5 sm:mb-6 line-clamp-3">
                <strong className="text-slate-700 dark:text-slate-300">Takeaway:</strong> {bench.summary}
              </p>

              <button 
                onClick={() => setActiveBenchmark(bench)}
                className="w-full mt-auto py-2 sm:py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-manrope text-xs sm:text-sm font-semibold rounded-lg hover:bg-slate-800 dark:hover:bg-white transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                View Complete Benchmark <FaArrowRight size={10} className="sm:text-[12px]" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Full-Screen Modal Overlay - Mobile Optimized */}
      {activeBenchmark && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/70 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white dark:bg-slate-950 rounded-xl sm:rounded-2xl w-full max-w-5xl max-h-[85vh] sm:max-h-[90vh] shadow-2xl border border-slate-200 dark:border-slate-800 relative flex flex-col overflow-hidden">
            
            {/* Modal Header (Sticky) */}
            <div className="sticky top-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 p-3 sm:p-4 md:p-6 flex items-center justify-between z-10 shrink-0">
              <div className="pr-4">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider">Benchmark Report</span>
                <h2 className="font-poppins text-sm sm:text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-tight mt-0.5 sm:mt-1 line-clamp-1">
                  {activeBenchmark.title}
                </h2>
              </div>
              <button 
                onClick={() => setActiveBenchmark(null)}
                className="w-7 h-7 sm:w-8 sm:h-8 flex shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <FaTimes size={14} className="sm:text-[16px]" />
              </button>
            </div>

            {/* Modal Content - Thin Custom Scrollbar */}
            <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-full">
              
              {/* Full Query */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg sm:rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800">
                <h4 className="font-poppins text-[9px] sm:text-[10px] md:text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1.5 sm:mb-2">Original Query Evaluated</h4>
                <p className="font-manrope text-[11px] sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                  "{activeBenchmark.fullQuery}"
                </p>
              </div>

              {/* Strengths Grid */}
              <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                <div className="border border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/10 rounded-lg sm:rounded-xl p-4 sm:p-5">
                  <h4 className="font-poppins font-semibold text-xs sm:text-sm text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
                    🏆 Justice Genie Strengths
                  </h4>
                  <ul className="space-y-1.5 sm:space-y-2">
                    {activeBenchmark.jgStrengths.map((str, i) => (
                      <li key={i} className="flex items-start gap-1.5 sm:gap-2 font-manrope text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">
                        <FaCheckCircle className="text-blue-500 mt-0.5 flex-shrink-0 text-[10px] sm:text-xs" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 rounded-lg sm:rounded-xl p-4 sm:p-5">
                  <h4 className="font-poppins font-semibold text-xs sm:text-sm text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
                    ⭐ Gemini Pro Strengths
                  </h4>
                  <ul className="space-y-1.5 sm:space-y-2">
                    {activeBenchmark.gpStrengths.map((str, i) => (
                      <li key={i} className="flex items-start gap-1.5 sm:gap-2 font-manrope text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">
                        <FaCheckCircle className="text-slate-400 mt-0.5 flex-shrink-0 text-[10px] sm:text-xs" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Aspect Evaluation Table */}
              <div>
                <h3 className="font-poppins text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 uppercase tracking-wider">Aspect Evaluation</h3>
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg sm:rounded-xl overflow-hidden shadow-sm">
                  {/* Table Wrapper - Thin Custom Scrollbar (Horizontal) */}
                  <div className="overflow-x-auto [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-full pb-1">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 font-poppins text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                          <th className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">Aspect</th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-center">JG</th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-center">GP</th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3">Winner</th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 min-w-[180px] sm:min-w-[250px]">Why</th>
                        </tr>
                      </thead>
                      <tbody className="font-manrope text-[10px] sm:text-xs divide-y divide-slate-100 dark:divide-slate-800/50">
                        {activeBenchmark.aspects.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                            <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap sm:whitespace-normal">{row.aspect}</td>
                            <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-center text-slate-600 dark:text-slate-400 font-semibold">{row.jg}</td>
                            <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-center text-slate-600 dark:text-slate-400 font-semibold">{row.gp}</td>
                            <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                              {row.winner === "Justice Genie" && (
                                <span className="inline-flex items-center justify-center p-1 sm:p-1.5 rounded-md dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50">
                                  <img src="/images/jg_original_logo_1.png" alt="Justice Genie" title="Justice Genie" className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain" />
                                </span>
                              )}
                              {row.winner === "Gemini Pro" && (
                                <span className="inline-flex items-center justify-center p-1 sm:p-1.5 rounded-md dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                  <img src="/images/Gemini_logo.png" alt="Gemini Pro" title="Gemini Pro" className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain" />
                                </span>
                              )}
                              {row.winner === "Tie" && (
                                <span className="inline-flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-md dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50">
                                  <img src="/images/jg_original_logo_1.png" alt="Justice Genie" title="Justice Genie" className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain" />
                                  
                                  <img src="/images/Gemini_logo.png" alt="Gemini Pro" title="Gemini Pro" className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain" />
                                </span>
                              )}
                            </td>
                            <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-slate-500 dark:text-slate-400 leading-relaxed">{row.why}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Transparency Disclaimer */}
                <p className="font-manrope text-[9px] sm:text-[10px] text-slate-400 mt-4 sm:mt-6 text-center max-w-3xl mx-auto px-2 leading-relaxed">
                  * This benchmark represents a manual evaluation of this specific legal scenario. Results are scenario-specific and are intended to demonstrate how different AI systems approach complex Indian legal questions. They should not be interpreted as universal rankings.
                </p>
              </div>

            </div>
          </div>
        </div>
      )}
    </section>
  );
}