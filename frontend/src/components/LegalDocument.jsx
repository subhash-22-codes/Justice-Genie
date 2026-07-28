import React from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // <-- THIS IS WHAT FIXES YOUR TABLE
import { ArrowLeft } from "lucide-react";

/**
 * Shared renderer for any legal/policy document. Content lives in
 * src/content/*.js as plain strings - this component only handles layout
 * and styling, so adding a future third document (or editing existing text)
 * never requires touching this file.
 */
const LegalDocument = ({ title, content, description, path }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-manrope">
      <Helmet>
        <title>{title} | Justice Genie</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`https://justice-genie-mu.vercel.app${path}`} />
      </Helmet>

      {/* Sticky Header with subtle blur - WIDENED for laptops */}
      <header className="sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors active:scale-95"
          >
            <ArrowLeft size={16} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Back
          </button>
          
          {/* BRANDING: Logo and Text combined */}
          <div className="flex items-center gap-2">
            <img 
              src="/images/jg_original_logo_1.png" 
              alt="Justice Genie Logo" 
              className="w-5 h-5 sm:w-6 sm:h-6 object-contain" 
            />
            <span className="font-poppins font-bold text-xs sm:text-sm md:text-base text-slate-800 dark:text-slate-100">
              Justice Genie
            </span>
          </div>
        </div>
      </header>

      {/* Main Content - WIDENED to max-w-7xl so it's not narrow on laptops */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10 md:py-14">
        {/* Card Container */}
        <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 sm:p-8 md:p-12">
          
          <ReactMarkdown
            remarkPlugins={[remarkGfm]} // <-- TELLS IT TO RENDER TABLES
            components={{
              h1: ({ children }) => (
                <h1 className="font-poppins text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50 mb-2 sm:mb-4 leading-tight">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="font-poppins text-lg sm:text-xl md:text-2xl font-semibold text-slate-800 dark:text-slate-100 mt-8 sm:mt-10 md:mt-12 mb-3 sm:mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                  {children}
                </h2>
              ),
              p: ({ children }) => (
                <p className="text-[13px] sm:text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-4 sm:mb-5">
                  {children}
                </p>
              ),
              strong: ({ children }) => (
                <strong className="font-bold text-slate-800 dark:text-slate-100">
                  {children}
                </strong>
              ),
              ul: ({ children }) => (
                <ul className="list-disc pl-5 sm:pl-6 space-y-2 sm:space-y-2.5 mb-5 text-[13px] sm:text-sm md:text-base text-slate-600 dark:text-slate-300">
                  {children}
                </ul>
              ),
              li: ({ children }) => <li className="leading-relaxed pl-1">{children}</li>,
              
              // TABLE STYLES - WITH THIN SCROLLBAR
              table: ({ children }) => (
                <div className="overflow-x-auto mb-6 sm:mb-8 border border-slate-200 dark:border-slate-800 rounded-lg sm:rounded-xl [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-full pb-1 sm:pb-0">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-poppins text-[10px] sm:text-xs uppercase tracking-wider">
                  {children}
                </thead>
              ),
              tbody: ({ children }) => (
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {children}
                </tbody>
              ),
              tr: ({ children }) => (
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  {children}
                </tr>
              ),
              th: ({ children }) => (
                <th className="px-4 sm:px-5 py-3 sm:py-4 font-semibold">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="px-4 sm:px-5 py-3 sm:py-4 text-[12px] sm:text-sm text-slate-600 dark:text-slate-300 align-top">
                  {children}
                </td>
              ),
              a: ({ children, href }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline decoration-blue-300 dark:decoration-blue-700 underline-offset-2 transition-all"
                >
                  {children}
                </a>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </main>
    </div>
  );
};

export default LegalDocument;