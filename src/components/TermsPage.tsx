// SPDX-License-Identifier: AGPL-3.0-or-later
import React from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  CheckCircle2,
  FileText,
  Scale,
  ShieldAlert,
} from 'lucide-react';
import type { ThemeMode } from './ThemeToggleButton';
import { SiteFooter, SiteHeader } from './shared/SiteChrome';

interface TermsPageProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  onGoHome: () => void;
  onOpenStudio: () => void;
  onOpenSupportUs: () => void;
}

const TOC_SECTIONS = [
  { id: 'introduction', num: '01', title: 'Introduction & Scope' },
  { id: 'eligibility', num: '02', title: 'Eligibility (10+ Strict Rule)' },
  { id: 'software-license', num: '03', title: 'What Is a License & AGPL v3.0' },
  { id: 'allowed', num: '04', title: 'What You Are Allowed To Do' },
  { id: 'prohibited', num: '05', title: 'What You Are Not Allowed To Do' },
  { id: 'user-content', num: '06', title: 'User Projects & Local Storage' },
  { id: 'experimental-supporters', num: '07', title: 'Supporters & Experimental Labs' },
  { id: 'intellectual-property', num: '08', title: 'Trademarks & Ownership' },
  { id: 'warranties', num: '09', title: 'Disclaimer of Warranties' },
  { id: 'liability', num: '10', title: 'Limitation of Liability' },
  { id: 'governance', num: '11', title: 'Updates, Enforcement & Contact' },
];

export const TermsPage: React.FC<TermsPageProps> = ({
  theme,
  onToggleTheme,
  onGoHome,
  onOpenStudio,
  onOpenSupportUs,
}) => {
  return (
    <div
      data-testid="terms-page"
      className="h-screen w-screen overflow-y-auto bg-[#0B0F17] text-slate-100"
    >
      <SiteHeader
        theme={theme}
        onToggleTheme={onToggleTheme}
        onBrandClick={onGoHome}
        navLabel="Legal page navigation"
        onOpenStudio={onOpenStudio}
        navLinks={
          <>
            <button
              type="button"
              onClick={onGoHome}
              className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Home
            </button>
            <a
              href="#eligibility"
              className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Eligibility (10+)
            </a>
            <a
              href="#software-license"
              className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              License &amp; Rights
            </a>
            <button
              type="button"
              onClick={onOpenSupportUs}
              className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Support Us
            </button>
          </>
        }
      />

      <main className="max-w-[1240px] mx-auto px-6 py-10">
        {/* Back link & Document Title Header */}
        <button
          type="button"
          onClick={onGoHome}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>

        <section className="mt-6 pb-8 border-b border-slate-800/80">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-400 inline-flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" />
                <span>Prathamers Legal &amp; Platform Governance</span>
              </p>
              <h1
                style={{ fontSize: 'clamp(2rem, 3.3vw, 3rem)', textWrap: 'balance' }}
                className="mt-2.5 font-bold tracking-tight leading-[1.1] text-slate-50"
              >
                SparkCode Terms and Conditions of Use
              </h1>
              <p className="mt-3 text-[15px] leading-[1.65] text-slate-300 max-w-[68ch]">
                Governing access to the SparkCode block-based coding platform, visual 2D engine,
                experimental tools, source-code license obligations, and ecosystem eligibility
                published and operated by <strong className="text-slate-100">Prathamers</strong>.
              </p>
            </div>

            {/* Formal Document Metadata Card */}
            <div className="rounded-xl border border-slate-800/90 bg-[#0F1522] px-5 py-4 text-xs shrink-0 lg:min-w-[300px]">
              <div className="flex items-center gap-2 font-semibold text-slate-100 pb-2.5 mb-2.5 border-b border-slate-800/80">
                <FileText className="w-3.5 h-3.5 text-sky-400" />
                <span>Document Record</span>
              </div>
              <dl className="space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Operator:</dt>
                  <dd className="text-slate-100 font-semibold">Prathamers</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Platform:</dt>
                  <dd className="text-slate-100">SparkCode / SparkCode 2</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Last Updated:</dt>
                  <dd className="text-slate-100">November 23, 2026</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Effective Date:</dt>
                  <dd className="text-slate-100">November 23, 2026</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Updated By:</dt>
                  <dd className="text-slate-100">Prathamers Governance Team</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Source License:</dt>
                  <dd className="text-sky-300 font-semibold">GNU AGPL v3.0+</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* Two-Column Corporate Legal Layout: Sticky TOC + Full Clauses */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Sticky Table of Contents */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-20">
            <div className="rounded-xl border border-slate-800/90 bg-[#0F1522] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Table of Contents
              </div>
              <nav aria-label="Terms sections" className="flex flex-col gap-1">
                {TOC_SECTIONS.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="px-2.5 py-1.5 rounded-md text-xs text-slate-300 hover:text-slate-100 hover:bg-slate-800/70 transition-colors flex items-baseline gap-2"
                  >
                    <span className="font-mono text-[10px] text-sky-400 shrink-0">{item.num}</span>
                    <span className="truncate">{item.title}</span>
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Right Primary Legal Document Body */}
          <article className="lg:col-span-9 space-y-10 text-sm leading-[1.75] text-slate-300 max-w-[78ch]">
            {/* SECTION 01: INTRODUCTION */}
            <section id="introduction" className="scroll-mt-20">
              <h2 className="text-xl font-bold tracking-tight text-slate-50 flex items-baseline gap-2.5">
                <span className="font-mono text-xs text-sky-400">01</span>
                <span>Introduction, Platform Scope &amp; Binding Agreement</span>
              </h2>
              <div className="mt-3.5 space-y-4">
                <p>
                  Welcome to <strong className="text-slate-100">SparkCode</strong> (including the{' '}
                  <strong className="text-slate-100">SparkCode 2</strong> studio environment,
                  block-based visual programming workspace, native HTML5 Canvas 2D and optional
                  WebGL2 rendering engines, rigid-body physics and raycasting modules, multi-layer
                  costume editor, experimental laboratory features, starter templates, project
                  serialization utilities, documentation, and related web interfaces—collectively,
                  the <strong className="text-slate-100">&ldquo;SparkCode Ecosystem&rdquo;</strong>{' '}
                  or <strong className="text-slate-100">&ldquo;Platform&rdquo;</strong>). SparkCode
                  is a browser-based, block-based coding platform engineered, published, and
                  maintained by <strong className="text-slate-100">Prathamers</strong>{' '}
                  (&ldquo;Prathamers,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or
                  &ldquo;our&rdquo;).
                </p>
                <p>
                  These Terms and Conditions of Use (&ldquo;Terms&rdquo;) constitute a legally
                  binding agreement between you (&ldquo;User,&rdquo; &ldquo;you,&rdquo; or
                  &ldquo;your&rdquo;—and, where applicable, the parent, legal guardian, educational
                  institution, or corporate entity on whose behalf you access the Platform) and
                  Prathamers. By opening the SparkCode website, launching the SparkCode studio,
                  assembling or executing block scripts, painting or exporting costumes, loading or
                  saving <span className="font-mono text-sky-300">.spark2.json</span> files,
                  participating in community supporter programs, or deploying copies of the
                  Platform, you expressly acknowledge that you have read, understood, and agreed to
                  be bound by these Terms in their entirety.
                </p>
                <p>
                  SparkCode was architected by Prathamers to bridge approachable block-based
                  programming with genuine game-engineering systems—including scoped variables,
                  dictionaries, first-class return functions, particle emitters, dynamic 2D
                  lighting, and optional GPU shader passes—without intrusive tracking or opaque
                  runtime bloat. Because SparkCode operates both as an interactive browser-based
                  coding environment and as copyleft open-source software, these Terms work in
                  conjunction with our software license detailed in Section 03 below. If you do not
                  agree with any provision of these Terms, or if you do not satisfy the mandatory
                  age and eligibility criteria in Section 02, you must immediately cease accessing
                  and using the SparkCode Ecosystem.
                </p>
              </div>
            </section>

            {/* SECTION 02: ELIGIBILITY (10+ STRICT RULE) */}
            <section
              id="eligibility"
              className="scroll-mt-20 pt-8 border-t border-slate-800/80"
            >
              <h2 className="text-xl font-bold tracking-tight text-slate-50 flex items-baseline gap-2.5">
                <span className="font-mono text-xs text-sky-400">02</span>
                <span>Eligibility, Mandatory Age Requirement (10+) &amp; Underage Disclaimer</span>
              </h2>

              <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-950/40 p-4 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-amber-200">
                  <strong className="font-semibold block text-sm mb-1">
                    Strict Minimum Age Policy: Ages 10 and Older (10+) Only
                  </strong>
                  You must be at least <strong>ten (10) years of age</strong> to enter, sign up
                  for, or use any part of the SparkCode Ecosystem. Individuals{' '}
                  <strong>below the age of 10 are strictly prohibited</strong> from accessing or
                  using SparkCode.
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <p>
                  <strong className="text-slate-100">2.1 Minimum Age Requirement (10+).</strong>{' '}
                  Access to the SparkCode Ecosystem is strictly limited to individuals who are{' '}
                  <strong className="text-slate-100">10 years of age or older (10+)</strong>. By
                  entering the Platform, launching the studio, creating projects, or submitting any
                  supporter profile information, you represent and warrant that you are at least 10
                  years old (or, if you are between 10 and the age of legal majority in your
                  jurisdiction, that your parent or legal guardian has reviewed and consented to
                  these Terms on your behalf).
                </p>
                <p>
                  <strong className="text-slate-100">
                    2.2 Prohibition on Users Under Age 10.
                  </strong>{' '}
                  Anyone <strong className="text-slate-100">below the age of 10</strong> is{' '}
                  <strong className="text-slate-100">not allowed</strong> to enter the SparkCode
                  Ecosystem, register or activate any supporter profile, submit feedback or bug
                  reports, or otherwise interact with SparkCode services. SparkCode is neither
                  marketed to nor designed for unsupervised or independent use by children under 10.
                </p>
                <p>
                  <strong className="text-slate-100">
                    2.3 Zero Responsibility for Underage Access or Third-Party Provision.
                  </strong>{' '}
                  <strong className="text-slate-100">
                    Prathamers is not responsible, and expressly disclaims all liability, for any
                    issue, incident, data submission, emotional or financial harm, technical
                    malfunction, or legal dispute that occurs if:
                  </strong>
                </p>
                <ul className="list-disc pl-6 space-y-1.5 text-slate-300">
                  <li>
                    An individual below the age of 10 accesses, uses, or signs up for any part of
                    the SparkCode Ecosystem by misrepresenting their age or bypassing eligibility
                    notices; or
                  </li>
                  <li>
                    A parent, legal guardian, sibling, educator, school, or any other third party
                    provides, hands over, configures, or grants access to SparkCode to a child below
                    the age of 10.
                  </li>
                </ul>
                <p>
                  Any adult, guardian, or organization that chooses to provide SparkCode to a child
                  below 10 in violation of this Section assumes 100% sole legal, supervisory, and
                  financial responsibility for all resulting activity and agrees to hold Prathamers
                  completely harmless from any claim arising therefrom.
                </p>
              </div>
            </section>

            {/* SECTION 03: WHAT IS A LICENSE & AGPL V3.0 */}
            <section
              id="software-license"
              className="scroll-mt-20 pt-8 border-t border-slate-800/80"
            >
              <h2 className="text-xl font-bold tracking-tight text-slate-50 flex items-baseline gap-2.5">
                <span className="font-mono text-xs text-sky-400">03</span>
                <span>What Is a Software License? &amp; The SparkCode License</span>
              </h2>

              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-slate-800/90 bg-[#0F1522] p-5">
                  <h3 className="text-sm font-semibold text-slate-100">
                    3.1 What Is a Software License?
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300">
                    Under international copyright law, software code is automatically protected by
                    copyright the moment it is written—meaning nobody else can legally copy, modify,
                    distribute, or host that code unless the copyright owner grants explicit
                    permission. A <strong className="text-slate-100">software license</strong> is
                    the formal legal document through which the copyright holder (here,{' '}
                    <strong className="text-slate-100">Prathamers</strong>) defines the exact
                    rights, freedoms, and binding conditions granted to users and developers. A
                    license does <em>not</em> transfer ownership of the underlying copyright or
                    brand trademarks; rather, it establishes the clear rules governing how you may
                    use, share, adapt, or deploy the software lawfully.
                  </p>
                </div>

                <p>
                  <strong className="text-slate-100">
                    3.2 Applicable Open-Source License (GNU AGPL v3.0-or-later).
                  </strong>{' '}
                  The source code of the SparkCode Platform is made available under the{' '}
                  <strong className="text-sky-300">
                    GNU Affero General Public License, Version 3.0 or (at your option) any later
                    version (<span className="font-mono">AGPL-3.0-or-later</span>)
                  </strong>
                  . The complete official text of this license is included in the root{' '}
                  <span className="font-mono text-sky-300">LICENSE</span> file of the SparkCode
                  source repository and is also published by the Free Software Foundation at{' '}
                  <span className="font-mono text-sky-300">
                    https://www.gnu.org/licenses/agpl-3.0.txt
                  </span>
                  .
                </p>
                <p>
                  <strong className="text-slate-100">
                    3.3 Copyleft &amp; Network Interaction Rule.
                  </strong>{' '}
                  GNU AGPL v3.0 is a strong copyleft license specifically crafted for web and
                  network-accessible software. In practical terms, if you modify SparkCode and
                  distribute copies—or if you deploy a modified version of SparkCode on a web server
                  where other users interact with it remotely over a network—you are legally
                  required to license your entire modified work under GNU AGPL v3.0 and provide all
                  network users a prominent, free-of-charge way to obtain the complete Corresponding
                  Source code.
                </p>
                <p>
                  <strong className="text-slate-100">
                    3.4 Distinction Between Engine Code and Your Projects.
                  </strong>{' '}
                  Using SparkCode to create your own original games, block scripts, sprite artwork,
                  and <span className="font-mono text-sky-300">.spark2.json</span> project files
                  does not transfer your creative work to Prathamers. Your original project assets
                  and game designs belong to you; the AGPL v3.0 copyleft obligation applies to the
                  SparkCode Platform code itself and derivative works based on the Platform code.
                </p>
              </div>
            </section>

            {/* SECTION 04: WHAT YOU ARE ALLOWED TO DO */}
            <section
              id="allowed"
              className="scroll-mt-20 pt-8 border-t border-slate-800/80"
            >
              <h2 className="text-xl font-bold tracking-tight text-slate-50 flex items-baseline gap-2.5">
                <span className="font-mono text-xs text-emerald-400">04</span>
                <span>What You Are Allowed To Do (Permitted Uses)</span>
              </h2>
              <p className="mt-3">
                Provided that you meet the 10+ eligibility requirement and comply with these Terms
                and the GNU AGPL v3.0 license, Prathamers expressly permits you to:
              </p>

              <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-5">
                <ul className="space-y-3 text-xs leading-relaxed text-emerald-200">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Build &amp; Publish Original Projects:</strong> Design, test, export,
                      and share your own 2D games, simulations, animations, and classroom projects
                      (for personal, educational 10+, nonprofit, or commercial purposes).
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Inspect &amp; Study the Source Code:</strong> Read, audit, benchmark,
                      and learn from every part of SparkCode&rsquo;s TypeScript engine, block AST,
                      physics solver, and renderer.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Fork, Modify &amp; Improve Under AGPL v3.0:</strong> Create custom
                      builds, new block categories, shaders, or translations, provided you preserve
                      original copyright/SPDX notices, document your changes, and release the
                      modified work under GNU AGPL v3.0.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Self-Host &amp; Redistribute Lawfully:</strong> Host unmodified or
                      modified instances for schools, clubs (ages 10+), or communities, provided any
                      modified network-hosted instance prominently provides free access to its
                      complete Corresponding Source code under AGPL v3.0.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Export &amp; Back Up Your Own Data:</strong> Download your{' '}
                      <span className="font-mono">.spark2.json</span> files and custom sprite
                      costumes at any time with zero lock-in.
                    </span>
                  </li>
                </ul>
              </div>
            </section>

            {/* SECTION 05: WHAT YOU ARE NOT ALLOWED TO DO */}
            <section
              id="prohibited"
              className="scroll-mt-20 pt-8 border-t border-slate-800/80"
            >
              <h2 className="text-xl font-bold tracking-tight text-slate-50 flex items-baseline gap-2.5">
                <span className="font-mono text-xs text-rose-400">05</span>
                <span>What You Are Not Allowed To Do (Prohibited Conduct &amp; Restrictions)</span>
              </h2>
              <p className="mt-3">
                You strictly agree that you will <strong className="text-slate-100">NOT</strong>{' '}
                engage in any of the following prohibited activities:
              </p>

              <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-950/90 p-5">
                <ul className="space-y-3 text-xs leading-relaxed text-rose-200">
                  <li className="flex items-start gap-2.5">
                    <Ban className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>No Access for Children Below 10:</strong> Do not sign up, use the
                      SparkCode Ecosystem if you are under 10 years old, or provide, share, or set
                      up SparkCode access for any child below the age of 10.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Ban className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>No Closed-Source Relicensing or Notice Removal:</strong> Do not strip
                      copyright notices, <span className="font-mono">SPDX-License-Identifier</span>{' '}
                      headers, or the <span className="font-mono">LICENSE</span> file, and do not
                      repackage or relicense SparkCode source code under proprietary or incompatible
                      terms.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Ban className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>No Secret Modified SaaS Hosting:</strong> Do not modify SparkCode and
                      deploy it over a network or SaaS platform while withholding the Corresponding
                      Source code from users—doing so violates Section 13 of GNU AGPL v3.0 and
                      automatically terminates your license rights.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Ban className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>No Brand Impersonation or Trademark Misuse:</strong> Do not represent
                      unofficial forks or third-party services as official Prathamers products, or
                      use the &ldquo;Prathamers&rdquo; or &ldquo;SparkCode&rdquo; marks to falsely
                      imply sponsorship or endorsement.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Ban className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>No Abuse, Exploits, or Malicious Content:</strong> Do not attempt to
                      disrupt servers, bypass membership or security controls, inject malicious
                      scripts, scrape personal information, or upload unlawful, infringing,
                      harassing, hateful, or sexually explicit content.
                    </span>
                  </li>
                </ul>
              </div>
            </section>

            {/* SECTION 06: USER PROJECTS & LOCAL STORAGE */}
            <section
              id="user-content"
              className="scroll-mt-20 pt-8 border-t border-slate-800/80"
            >
              <h2 className="text-xl font-bold tracking-tight text-slate-50 flex items-baseline gap-2.5">
                <span className="font-mono text-xs text-sky-400">06</span>
                <span>User-Created Projects, Local Browser Storage &amp; Backups</span>
              </h2>
              <div className="mt-3.5 space-y-3">
                <p>
                  SparkCode executes projects directly within your local web browser and stores
                  certain preferences (such as theme selection, recent blocks, and local supporter
                  settings) in browser storage. You retain full responsibility for exporting and
                  backing up your <span className="font-mono text-sky-300">.spark2.json</span>{' '}
                  project files. Prathamers does not guarantee persistent cloud storage for browser
                  sessions and bears no responsibility for data loss caused by cleared browser
                  caches, device resets, software crashes, or invalid JSON imports.
                </p>
              </div>
            </section>

            {/* SECTION 07: SUPPORTERS & EXPERIMENTAL LABS */}
            <section
              id="experimental-supporters"
              className="scroll-mt-20 pt-8 border-t border-slate-800/80"
            >
              <h2 className="text-xl font-bold tracking-tight text-slate-50 flex items-baseline gap-2.5">
                <span className="font-mono text-xs text-sky-400">07</span>
                <span>Community Supporter Tiers &amp; Experimental Laboratory Features</span>
              </h2>
              <div className="mt-3.5 space-y-3">
                <p>
                  Prathamers may offer optional community supporter tiers (such as Plus Contributor,
                  Pro Contributor, and Elite Member) that provide recognition badges, roadmap voting
                  privileges, homepage supporter listings, and early access to{' '}
                  <strong className="text-slate-100">Experimental Lab</strong> modules (including
                  the Experimental Pen Tool, WebGL2 Hardware Shadow &amp; Bloom Pass, and Improved
                  SparkVM).
                </p>
                <p>
                  Experimental features are provided strictly as pre-release technology previews:
                  they may change, behave differently across GPUs or browsers (including automatic
                  fallback from WebGL2 to 2D Canvas), or be modified or retired at any time.
                  Supporter contributions help sustain ongoing engineering by Prathamers and do not
                  convey ownership, equity, custom SLA guarantees, or exclusive proprietary rights
                  over SparkCode.
                </p>
              </div>
            </section>

            {/* SECTION 08: INTELLECTUAL PROPERTY & TRADEMARKS */}
            <section
              id="intellectual-property"
              className="scroll-mt-20 pt-8 border-t border-slate-800/80"
            >
              <h2 className="text-xl font-bold tracking-tight text-slate-50 flex items-baseline gap-2.5">
                <span className="font-mono text-xs text-sky-400">08</span>
                <span>Intellectual Property &amp; Trademarks</span>
              </h2>
              <div className="mt-3.5 space-y-3">
                <p>
                  Subject to the open-source permissions granted under GNU AGPL v3.0 for the source
                  code, all rights, title, and interest in the{' '}
                  <strong className="text-slate-100">Prathamers</strong> name, the{' '}
                  <strong className="text-slate-100">SparkCode</strong> and{' '}
                  <strong className="text-slate-100">SparkCode 2</strong> names, visual marks,
                  insignia, and official brand identity remain the exclusive property of Prathamers.
                  Nothing in these Terms grants you a trademark license to market derivative works
                  under Prathamers&rsquo; official branding.
                </p>
              </div>
            </section>

            {/* SECTION 09: DISCLAIMER OF WARRANTIES */}
            <section
              id="warranties"
              className="scroll-mt-20 pt-8 border-t border-slate-800/80"
            >
              <h2 className="text-xl font-bold tracking-tight text-slate-50 flex items-baseline gap-2.5">
                <span className="font-mono text-xs text-sky-400">09</span>
                <span>Disclaimer of Warranties (&ldquo;AS IS&rdquo;)</span>
              </h2>
              <div className="mt-3.5 rounded-xl border border-slate-800/90 bg-[#0F1522] p-5 text-xs leading-relaxed text-slate-300 uppercase tracking-[0.01em]">
                THE SPARKCODE ECOSYSTEM, ALL SOURCE CODE, TEMPLATES, RENDERING PIPELINES, PHYSICS
                SOLVERS, AND EXPERIMENTAL FEATURES ARE PROVIDED BY PRATHAMERS ON AN &ldquo;AS
                IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS, WITHOUT WARRANTY OF ANY KIND,
                WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING WITHOUT LIMITATION ANY IMPLIED
                WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE,
                NON-INFRINGEMENT, OR UNINTERRUPTED, ERROR-FREE OPERATION. THE ENTIRE RISK AS TO THE
                QUALITY, PERFORMANCE, HARDWARE COMPATIBILITY, AND OUTPUT OF THE PLATFORM RESTS
                SOLELY WITH YOU.
              </div>
            </section>

            {/* SECTION 10: LIMITATION OF LIABILITY */}
            <section
              id="liability"
              className="scroll-mt-20 pt-8 border-t border-slate-800/80"
            >
              <h2 className="text-xl font-bold tracking-tight text-slate-50 flex items-baseline gap-2.5">
                <span className="font-mono text-xs text-sky-400">10</span>
                <span>Limitation of Liability &amp; Indemnification</span>
              </h2>
              <div className="mt-3.5 space-y-3">
                <p>
                  To the maximum extent permitted by applicable law, in no event shall{' '}
                  <strong className="text-slate-100">Prathamers</strong>, its founders, maintainers,
                  contributors, or affiliates be liable for any indirect, incidental, special,
                  consequential, exemplary, or punitive damages, or for any loss of profits,
                  revenue, project files, artwork, goodwill, or data arising out of or relating to
                  your use of—or inability to use—the SparkCode Ecosystem, including without
                  limitation any claim resulting from:
                </p>
                <ul className="list-disc pl-6 space-y-1.5 text-slate-300">
                  <li>
                    Unauthorized access or use by any individual under the age of 10, or provision
                    of SparkCode to a child under 10 by any parent, guardian, school, or third
                    party;
                  </li>
                  <li>
                    Loss of local browser storage, unsaved scripts, or corrupted imported files;
                  </li>
                  <li>
                    Third-party forks, self-hosted deployments, or user-created projects shared
                    outside Prathamers&rsquo; control; or
                  </li>
                  <li>
                    Experimental GPU/WebGL2 shader or VM features operating on incompatible
                    hardware.
                  </li>
                </ul>
                <p>
                  You agree to indemnify and hold harmless Prathamers from and against any claims,
                  damages, liabilities, and expenses arising out of your breach of these Terms, your
                  violation of GNU AGPL v3.0, or your provision of access to underage (below 10)
                  individuals.
                </p>
              </div>
            </section>

            {/* SECTION 11: UPDATES, ENFORCEMENT & CONTACT */}
            <section
              id="governance"
              className="scroll-mt-20 pt-8 border-t border-slate-800/80"
            >
              <h2 className="text-xl font-bold tracking-tight text-slate-50 flex items-baseline gap-2.5">
                <span className="font-mono text-xs text-sky-400">11</span>
                <span>Modifications, Enforcement, Severability &amp; Contact</span>
              </h2>
              <div className="mt-3.5 space-y-3">
                <p>
                  <strong className="text-slate-100">11.1 Updates to These Terms.</strong>{' '}
                  Prathamers reserves the right to revise or update these Terms periodically to
                  reflect platform developments, new engine capabilities, or legal requirements. When
                  changes are published, Prathamers will update the &ldquo;Last Updated&rdquo; date
                  at the top of this page. Continued use of the SparkCode Ecosystem after updated
                  Terms take effect constitutes acceptance of the revised Terms.
                </p>
                <p>
                  <strong className="text-slate-100">11.2 Enforcement &amp; Severability.</strong>{' '}
                  Prathamers may suspend or restrict access to Prathamers-operated services if we
                  reasonably believe a user has violated these Terms or applicable license
                  obligations. If any clause of these Terms is held unenforceable by a court of
                  competent jurisdiction, the remaining provisions shall remain in full force and
                  effect.
                </p>
                <div className="mt-4 rounded-xl border border-slate-800/90 bg-[#0F1522] p-5 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed text-slate-300">
                    <strong className="text-slate-100 block mb-1">
                      Platform Governance &amp; Inquiries
                    </strong>
                    Operated and maintained by <strong className="text-slate-100">Prathamers</strong>{' '}
                    (SparkCode Block-Based Coding Platform). For compliance, AGPL v3.0 source
                    inquiries, or Terms questions, refer to the official Prathamers repository and
                    governance channels.
                  </div>
                </div>
              </div>
            </section>
          </article>
        </div>

        <SiteFooter
          brandTitle="SparkCode 2 by Prathamers"
          subtitle="Last updated November 23, 2026"
          className="mt-14"
        >
          <button
            type="button"
            onClick={onGoHome}
            className="hover:text-slate-200 transition-colors cursor-pointer"
          >
            Home
          </button>
          <button
            type="button"
            onClick={onOpenSupportUs}
            className="hover:text-slate-200 transition-colors cursor-pointer"
          >
            Support Us
          </button>
          <button
            type="button"
            onClick={onOpenStudio}
            className="font-semibold text-sky-400 hover:text-sky-300 cursor-pointer"
          >
            Launch Studio
          </button>
        </SiteFooter>
      </main>
    </div>
  );
};
