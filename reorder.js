const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/pages/public/PropertyListingView.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Move Header (193-282) below Gallery (335).
// Instead of line numbers, we'll use specific markers.
const breadcrumbEnd = '</nav>';
const section1Start = '{/* SECTION 1: RESO EDITORIAL HEADER & ARCHITECTURAL CADASTRE */}';
const galleryStart = '{/* Gallery Controls: Architectural Photography vs CAD Floorplan */}';
const section3Start = '{/* SECTION 3: KEY METRICS - RESO ARCHITECTURAL LEDGER */}';
const splitColsStart = '{/* MAIN BODY: 2-COLUMN SPLIT */}';
const leftColStart = '{/* LEFT CONTENT COLUMN (65% width / 8 cols) */}';
const rightColStart = '{/* RIGHT STICKY ACTION RAIL (35% width / 4 cols) */}';
const endSplitCols = '{/* BROKERAGE & AGENT CONTACT CARD */}'; // Near the end of right column

// Extract sections
const headerSectionRegex = new RegExp(section1Start.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '[\\s\\S]*?(?=' + galleryStart.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + ')');
const gallerySectionRegex = new RegExp(galleryStart.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '[\\s\\S]*?(?=' + section3Start.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + ')');

const headerMatch = content.match(headerSectionRegex);
const galleryMatch = content.match(gallerySectionRegex);

if (headerMatch && galleryMatch) {
  const headerText = headerMatch[0];
  const galleryText = galleryMatch[0];
  
  // Create an "Overview" style block out of the Header and Section 3
  // Remove them from their current positions
  content = content.replace(headerText, '');
  content = content.replace(galleryText, galleryText + '\n\n        {/* OVERVIEW SECTION (Moved below Gallery) */}\n        ' + headerText);
}

// 2. Remove FinancingCalculator from Left Column
const financingRegex = /\{\/\* PRICING & FINANCING ENGINE \*\/\}\s*<FinancingCalculator[\s\S]*?\/>/;
const financingMatch = content.match(financingRegex);
if (financingMatch) {
  content = content.replace(financingMatch[0], '');
}

// 3. Add static Floor Plans and Property Records to Left Column
const newLeftColSections = `
            {/* FLOOR PLANS (Static) */}
            <div className="bg-white dark:bg-[#0C1618] border border-[#D8DFDF] dark:border-white/10 rounded-[14px] p-6 md:p-8 shadow-[0_16px_36px_rgba(13,68,70,0.06)]">
              <h2 className="font-display text-xl font-bold text-[#141717] dark:text-[#F4F7F7] mb-6 flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E76F51]"></span>
                Floor Plans
              </h2>
              <div className="flex gap-4 mb-4">
                <button className="px-4 py-2 bg-[#0D4446] text-white text-xs font-bold rounded-lg shadow-sm">Ground Floor</button>
                <button className="px-4 py-2 bg-[#F4F5F4] dark:bg-white/5 text-[#5C6768] dark:text-[#95A6A6] text-xs font-bold rounded-lg border border-[#D8DFDF] dark:border-white/10 hover:bg-[#E5EBEB]">Second Floor</button>
                <button className="px-4 py-2 bg-[#F4F5F4] dark:bg-white/5 text-[#5C6768] dark:text-[#95A6A6] text-xs font-bold rounded-lg border border-[#D8DFDF] dark:border-white/10 hover:bg-[#E5EBEB]">Third Floor</button>
              </div>
              <ul className="text-sm text-[#5C6768] dark:text-[#95A6A6] font-sans space-y-2 mb-4">
                <li>• Level 1: Living, Dining, Kitchen, Garage, Maid's Room</li>
                <li>• Level 2: Master Suite, Bedroom 2, Private Balcony</li>
                <li>• Level 3: Bedrooms 3 & 4, Rooftop Terrace</li>
              </ul>
              <button className="text-[#0D4446] dark:text-[#14B8A6] text-xs font-bold uppercase tracking-wider flex items-center gap-1 hover:underline">
                View Full Blueprint <span className="material-symbols-outlined text-[14px]">arrow_forward_ios</span>
              </button>
            </div>

            {/* PROPERTY RECORDS & DUE DILIGENCE */}
            <div className="bg-white dark:bg-[#0C1618] border border-[#D8DFDF] dark:border-white/10 rounded-[14px] p-6 md:p-8 shadow-[0_16px_36px_rgba(13,68,70,0.06)]">
              <h2 className="font-display text-xl font-bold text-[#141717] dark:text-[#F4F7F7] mb-4 flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E76F51]"></span>
                Property Records & Due Diligence
              </h2>
              <ul className="text-sm text-[#5C6768] dark:text-[#95A6A6] font-sans space-y-3">
                <li className="flex justify-between border-b border-[#D8DFDF]/70 dark:border-white/10 pb-2">
                  <span className="font-medium">📜 Title:</span>
                  <span className="text-[#141717] dark:text-[#F4F7F7]">Clean Transfer Certificate (TCT)</span>
                </li>
                <li className="flex justify-between border-b border-[#D8DFDF]/70 dark:border-white/10 pb-2">
                  <span className="font-medium">⚖️ Encumbrances:</span>
                  <span className="text-[#141717] dark:text-[#F4F7F7]">None</span>
                </li>
                <li className="flex justify-between border-b border-[#D8DFDF]/70 dark:border-white/10 pb-2">
                  <span className="font-medium">🧾 Property Taxes:</span>
                  <span className="text-[#141717] dark:text-[#F4F7F7]">Up to date (Current Year)</span>
                </li>
                <li className="flex justify-between pb-2">
                  <span className="font-medium">🌊 Flood Risk:</span>
                  <span className="text-[#141717] dark:text-[#F4F7F7]">Low / Zero recorded flooding</span>
                </li>
              </ul>
            </div>
`;
// Insert new sections before "SECTION 4: GEOGRAPHIC LOCATION"
content = content.replace('{/* SECTION 4: GEOGRAPHIC LOCATION & VICINITY */}', newLeftColSections + '\n            {/* SECTION 4: GEOGRAPHIC LOCATION & VICINITY */}');


// 4. Add FinancingCalculator and Documents to Right Column
const newRightColSections = `
            {/* PRICING & FINANCING ENGINE (Compact) */}
            <FinancingCalculator
              totalContractPrice={listPrice || 3000000}
              promoCashOut={property.promo_cash_out || 'PHP 5,000 to PHP 20,000'}
              startingAmortization={property.monthly_amortization || 'Starting at PHP 15,000 / month'}
              variant="compact"
            />

            {/* DOCUMENTS */}
            <div className="bg-white dark:bg-[#0C1618] border border-[#D8DFDF] dark:border-white/10 rounded-[14px] p-6 shadow-sm">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#5C6768] dark:text-[#95A6A6] font-mono mb-4">
                📄 Documents
              </h3>
              <ul className="text-sm text-[#5C6768] dark:text-[#95A6A6] font-sans space-y-3">
                <li><a href="#" className="flex items-center gap-2 hover:text-[#0D4446] dark:hover:text-[#14B8A6]"><span className="material-symbols-outlined text-[16px]">picture_as_pdf</span> Property Brochure (PDF)</a></li>
                <li><a href="#" className="flex items-center gap-2 hover:text-[#0D4446] dark:hover:text-[#14B8A6]"><span className="material-symbols-outlined text-[16px]">picture_as_pdf</span> Subdivision Guidelines (PDF)</a></li>
              </ul>
            </div>
`;

// Insert the right column sections after Price Card (which ends before VIEWING LIST)
content = content.replace('{/* VIEWING LIST & SITE INSPECTION TRIGGERS */}', newRightColSections + '\n              {/* VIEWING LIST & SITE INSPECTION TRIGGERS */}');

fs.writeFileSync(filePath, content);
console.log('Successfully updated PropertyListingView.jsx');
