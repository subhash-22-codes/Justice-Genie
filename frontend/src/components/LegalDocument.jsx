import React from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
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
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <span className="font-poppins font-bold text-slate-800 dark:text-slate-100">
            Justice Genie
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-card p-6 sm:p-10">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="font-poppins text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="font-poppins text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-100 mt-8 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                  {children}
                </h2>
              ),
              p: ({ children }) => (
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  {children}
                </p>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-slate-800 dark:text-slate-100">
                  {children}
                </strong>
              ),
              ul: ({ children }) => (
                <ul className="list-disc pl-5 space-y-2 mb-4 text-sm sm:text-base text-slate-600 dark:text-slate-300">
                  {children}
                </ul>
              ),
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              table: ({ children }) => (
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm text-left border-collapse">{children}</table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                  {children}
                </thead>
              ),
              th: ({ children }) => (
                <th className="px-3 py-2 font-semibold border-b border-slate-200 dark:border-slate-700">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                  {children}
                </td>
              ),
              a: ({ children, href }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
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
